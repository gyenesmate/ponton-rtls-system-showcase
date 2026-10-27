/**
 * Legacy scenario `site` ↔ WarehouseDocument (Three-free).
 * Renderers keep consuming `site` via toSite(); spatial engine uses toDocument().
 * @module domain/siteAdapter
 */

import { DEFAULT_SPATIAL_CELL_SIZE } from './types.js';
import { createWarehouseDocument, migrateWarehouseDocument } from './warehouseDocument.js';

/** Default thickness (m) for interior partition footprints. */
export const DEFAULT_INTERIOR_WALL_THICKNESS = 0.2;

/** Default footprint for infrastructure anchors (placement / viz only). */
const ANCHOR_FOOTPRINT_M = 0.3;

/**
 * @param {object} site
 * @param {{ id?: string, wallThickness?: number }} [options]
 * @returns {import('./types.js').WarehouseDocument}
 */
export function toDocument(site, { id = 'site', wallThickness = DEFAULT_INTERIOR_WALL_THICKNESS } = {}) {
  if (!site || typeof site !== 'object') {
    throw new Error('siteAdapter.toDocument requires a site object');
  }

  const cellSize = site.grid?.cellSize ?? DEFAULT_SPATIAL_CELL_SIZE;
  /** @type {import('./types.js').EntityBase[]} */
  const entities = [];

  (site.machines || []).forEach((m, i) => {
    entities.push({
      id: m.id || `machine-${i}`,
      kind: 'machine',
      x: m.x,
      z: m.z,
      y: 0,
      model: m.model,
      footprint: {
        width: m.sx,
        depth: m.sz,
        height: m.sy,
        yaw: m.yaw ?? 0,
        layer: 'obstacle',
        blocksNavigation: true
      }
    });
  });

  (site.interiorWalls || []).forEach((seg, i) => {
    entities.push(wallEntityFromSegment(seg, i, wallThickness));
  });

  (site.zones || []).forEach((zone, i) => {
    const width = zone.width ?? (zone.radius != null ? zone.radius * 2 : 6);
    const depth = zone.depth ?? (zone.radius != null ? zone.radius * 2 : 6);
    entities.push({
      id: zone.id || `zone-${i}`,
      kind: 'zone',
      x: zone.x,
      z: zone.z,
      y: 0,
      footprint: {
        width,
        depth,
        yaw: zone.yaw ?? 0,
        layer: 'zone',
        blocksNavigation: zone.restricted === true || zone.blocksNavigation === true
      },
      zone: { ...zone }
    });
  });

  (site.infrastructure?.anchors || []).forEach((anchor, i) => {
    entities.push({
      id: anchor.id || `anchor-${i}`,
      kind: 'anchor',
      x: anchor.x,
      z: anchor.z,
      y: anchor.y,
      footprint: {
        width: ANCHOR_FOOTPRINT_M,
        depth: ANCHOR_FOOTPRINT_M,
        height: 0.2,
        layer: 'infrastructure'
      },
      wall: anchor.wall,
      anchor: { ...anchor }
    });
  });

  (site.objects || []).forEach((obj, i) => {
    entities.push({
      id: obj.id || `agent-${i}`,
      kind: 'agentTemplate',
      x: 0,
      z: 0,
      y: 0,
      model: obj.model,
      footprint: {
        width: 0,
        depth: 0,
        layer: 'reservation'
      },
      agent: { ...obj }
    });
  });

  return createWarehouseDocument({
    id,
    orientationY: site.orientationY ?? 0,
    warehouse: site.warehouse || {},
    cellSize,
    entities,
    routes: site.routes || [],
    intersections: site.intersections || [],
    meta: {
      siteGrid: { ...(site.grid || {}) },
      infrastructure: {
        controlUnderAnchorId: site.infrastructure?.controlUnderAnchorId ?? null
      }
    }
  });
}

/**
 * @param {import('./types.js').WarehouseDocument|object} document
 * @returns {object} legacy site shape for WarehouseScene / Livemap
 */
export function toSite(document) {
  const doc = migrateWarehouseDocument(document);
  const machines = [];
  const interiorWalls = [];
  const zones = [];
  const anchors = [];
  const objects = [];

  for (const entity of doc.entities) {
    switch (entity.kind) {
      case 'machine':
        machines.push({
          ...(entity.model ? { model: entity.model } : {}),
          x: entity.x,
          z: entity.z,
          sx: entity.footprint?.width,
          sy: entity.footprint?.height ?? 2.3,
          sz: entity.footprint?.depth,
          ...(entity.footprint?.yaw ? { yaw: entity.footprint.yaw } : {})
        });
        break;
      case 'wall':
        if (entity.segment) {
          interiorWalls.push({ ...entity.segment });
        }
        break;
      case 'zone':
        zones.push(entity.zone ? { ...entity.zone } : zoneFromEntity(entity));
        break;
      case 'anchor':
        anchors.push(
          entity.anchor
            ? { ...entity.anchor }
            : {
                id: entity.id,
                x: entity.x,
                y: entity.y,
                z: entity.z,
                wall: entity.wall
              }
        );
        break;
      case 'agentTemplate':
        objects.push(entity.agent ? { ...entity.agent } : { id: entity.id, model: entity.model });
        break;
      default:
        break;
    }
  }

  const siteGrid = { ...(doc.meta?.siteGrid || {}) };
  if (siteGrid.cellSize == null && doc.grid?.cellSize != null) {
    siteGrid.cellSize = doc.grid.cellSize;
  }

  return {
    orientationY: doc.orientationY ?? 0,
    warehouse: { ...doc.warehouse },
    grid: siteGrid,
    interiorWalls,
    machines,
    zones,
    infrastructure: {
      controlUnderAnchorId: doc.meta?.infrastructure?.controlUnderAnchorId ?? null,
      anchors
    },
    routes: (doc.routes || []).map((r) => ({ ...r, points: (r.points || []).map((p) => [...p]) })),
    intersections: (doc.intersections || []).map((i) => ({
      ...i,
      routeIds: i.routeIds ? [...i.routeIds] : i.routeIds
    })),
    objects
  };
}

/**
 * @param {{ x1: number, z1: number, x2: number, z2: number }} seg
 * @param {number} index
 * @param {number} thickness
 */
export function wallEntityFromSegment(seg, index, thickness = DEFAULT_INTERIOR_WALL_THICKNESS) {
  const dx = seg.x2 - seg.x1;
  const dz = seg.z2 - seg.z1;
  const length = Math.hypot(dx, dz) || thickness;
  const yaw = Math.atan2(dz, dx);

  return {
    id: `wall-${index}`,
    kind: 'wall',
    x: (seg.x1 + seg.x2) * 0.5,
    z: (seg.z1 + seg.z2) * 0.5,
    y: 0,
    footprint: {
      width: length,
      depth: thickness,
      height: 3,
      yaw,
      layer: 'obstacle',
      blocksNavigation: true
    },
    segment: { x1: seg.x1, z1: seg.z1, x2: seg.x2, z2: seg.z2 }
  };
}

function zoneFromEntity(entity) {
  return {
    id: entity.id,
    x: entity.x,
    z: entity.z,
    width: entity.footprint?.width,
    depth: entity.footprint?.depth
  };
}
