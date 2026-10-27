import { el } from '../shared/dom.js';
import { normalizeZoneSize } from '../warehouse/scene/zones.js';

/**
 * 2D livemap driven by scenario.site (landscape — longer side horizontal).
 */
export class Livemap {
  constructor(root, { eventBus = null, state = null, site = null } = {}) {
    this.root = root;
    this.eventBus = eventBus;
    this.state = state;
    this.site = site || {};
    this.markers = new Map();
    this.objectMeta = new Map();

    (this.site.objects || []).forEach((object) => {
      this.objectMeta.set(object.id, {
        id: object.id,
        type: object.type,
        label: object.tracking?.label || object.id,
        routeId: object.routeId || '—'
      });
    });

    const warehouse = this.site.warehouse || {};
    this.bounds = {
      width: warehouse.width || 44,
      depth: warehouse.depth || 30
    };

    this.element = el('div', 'rtls-software__livemap');
    this.floor = el('div', 'rtls-software__floor');
    this.floor.style.aspectRatio = `${this.bounds.width} / ${this.bounds.depth}`;
    this.layers = el('div', 'rtls-software__floor-layers');
    this.floor.append(this.layers);
    this.tooltip = el('div', 'rtls-software__tooltip');
    this.tooltip.hidden = true;
    this.tooltip.setAttribute('aria-hidden', 'true');
    this.element.append(this.floor);
    this.element.append(this.tooltip);
    root.append(this.element);

    this.hoveredTagId = null;
    this.hoveredMarker = null;

    this.renderStaticLayers();

    this.unsubscribe = eventBus?.on('tag:position-changed', (payload) => {
      this.updateMarker(payload.tagId, payload.position);
      if (this.hoveredTagId === payload.tagId && this.hoveredMarker) {
        this.positionTooltip(this.hoveredMarker);
      }
    });
  }

  renderStaticLayers() {
    const outline = el('div', 'rtls-software__wall-outline');
    this.layers.append(outline);

    (this.site.interiorWalls || []).forEach((wall) => {
      const segment = el('div', 'rtls-software__interior-wall');
      placeSegment(
        segment,
        this.toPercent(wall.x1, wall.z1),
        this.toPercent(wall.x2, wall.z2)
      );
      this.layers.append(segment);
    });

    (this.site.machines || []).forEach((machine) => {
      const node = el('div', 'rtls-software__machine');
      this.placeRect(node, machine.x, machine.z, machine.sx, machine.sz);
      this.layers.append(node);
    });

    (this.site.zones || []).forEach((zone) => {
      const size = normalizeZoneSize(zone);
      const node = el('div', 'rtls-software__zone');
      node.dataset.zoneId = zone.id;
      if (zone.label) node.title = zone.label;
      this.placeRect(node, zone.x, zone.z, size.width, size.depth);
      this.layers.append(node);
    });

    (this.site.routes || []).forEach((route) => {
      if (route.visible === false) return;
      const points = (route.points || []).map(([x, , z]) => this.toPercent(x, z));
      if (points.length < 2) return;
      for (let i = 0; i < points.length - 1; i++) {
        const segment = el('div', 'rtls-software__route-segment');
        placeSegment(segment, points[i], points[i + 1]);
        this.layers.append(segment);
      }
    });
  }

  placeRect(node, x, z, width, depth) {
    const left = ((x - width / 2 + this.bounds.width / 2) / this.bounds.width) * 100;
    const top = ((z - depth / 2 + this.bounds.depth / 2) / this.bounds.depth) * 100;
    const w = (width / this.bounds.width) * 100;
    const h = (depth / this.bounds.depth) * 100;
    node.style.left = `${left}%`;
    node.style.top = `${top}%`;
    node.style.width = `${w}%`;
    node.style.height = `${h}%`;
  }

  toPercent(x, z) {
    return {
      x: ((x + this.bounds.width / 2) / this.bounds.width) * 100,
      y: ((z + this.bounds.depth / 2) / this.bounds.depth) * 100
    };
  }

  updateMarker(tagId, position) {
    let marker = this.markers.get(tagId);
    if (!marker) {
      marker = el('button', 'rtls-software__marker');
      marker.type = 'button';
      marker.dataset.tagId = tagId;
      marker.setAttribute('aria-label', this.objectMeta.get(tagId)?.label || tagId);
      marker.addEventListener('pointerenter', (event) => {
        this.showTooltip(tagId, event.currentTarget);
      });
      marker.addEventListener('pointerleave', (event) => {
        // Ignore leave when moving to a child (none expected) or if another marker is hovered.
        if (event.currentTarget !== this.hoveredMarker) return;
        this.hideTooltip();
      });
      marker.addEventListener('focus', (event) => {
        this.showTooltip(tagId, event.currentTarget);
      });
      marker.addEventListener('blur', () => {
        this.hideTooltip();
      });
      this.floor.append(marker);
      this.markers.set(tagId, marker);
    }

    const point = this.toPercent(position.x, position.z);
    marker.style.left = `${clamp(point.x, 2, 98)}%`;
    marker.style.top = `${clamp(point.y, 2, 98)}%`;
    marker.dataset.x = position.x.toFixed(1);
    marker.dataset.z = position.z.toFixed(1);
  }

  showTooltip(tagId, anchor) {
    const meta = this.objectMeta.get(tagId) || { id: tagId, label: tagId, type: 'asset' };
    const x = anchor.dataset.x ?? '—';
    const z = anchor.dataset.z ?? '—';
    this.hoveredTagId = tagId;
    this.hoveredMarker = anchor;
    this.tooltip.innerHTML = `
      <strong>${escapeHtml(meta.label)}</strong>
      <span>ID: ${escapeHtml(meta.id)}</span>
      <span>Type: ${escapeHtml(meta.type)}</span>
      <span>Pos: ${escapeHtml(x)}, ${escapeHtml(z)}</span>
    `;
    this.tooltip.hidden = false;
    this.tooltip.setAttribute('aria-hidden', 'false');
    this.positionTooltip(anchor);
  }

  positionTooltip(anchor) {
    if (!anchor || this.tooltip.hidden) return;

    const mapRect = this.element.getBoundingClientRect();
    const markerRect = anchor.getBoundingClientRect();
    const tipWidth = this.tooltip.offsetWidth || 160;
    const tipHeight = this.tooltip.offsetHeight || 72;

    let left = markerRect.left - mapRect.left + markerRect.width / 2;
    let top = markerRect.top - mapRect.top - 10;

    // Keep tooltip inside the livemap container when possible.
    left = clamp(left, tipWidth / 2 + 8, mapRect.width - tipWidth / 2 - 8);
    if (top - tipHeight < 8) {
      top = markerRect.bottom - mapRect.top + tipHeight + 10;
      this.tooltip.classList.add('rtls-software__tooltip--below');
    } else {
      this.tooltip.classList.remove('rtls-software__tooltip--below');
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  hideTooltip() {
    this.hoveredTagId = null;
    this.hoveredMarker = null;
    this.tooltip.hidden = true;
    this.tooltip.setAttribute('aria-hidden', 'true');
    this.tooltip.classList.remove('rtls-software__tooltip--below');
  }

  destroy() {
    this.unsubscribe?.();
    this.element.remove();
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function placeSegment(node, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  node.style.left = `${a.x}%`;
  node.style.top = `${a.y}%`;
  node.style.width = `${length}%`;
  node.style.transform = `rotate(${angle}deg)`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
