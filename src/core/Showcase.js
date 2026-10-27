import { ScenarioManager } from './ScenarioManager.js';
import { EventBus } from './EventBus.js';
import { SceneState } from './SceneState.js';
import { PlaybackController } from './PlaybackController.js';
import { WarehouseScene } from '../warehouse/WarehouseScene.js';
import { SoftwareView } from '../software/SoftwareView.js';
import { enableDevDebugFromElement, devDebug, logOccupancyMatrix } from '../shared/devDebugger.js';
import { toDocument } from '../domain/siteAdapter.js';
import { SpatialEngine } from '../spatial/SpatialEngine.js';

/**
 * One independent RTLS showcase instance bound to a root element.
 */
export class Showcase {
  constructor(element, { scenario, quality } = {}) {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError('Showcase requires a valid root element.');
    }

    this.root = element;
    this.eventBus = new EventBus();
    this.state = new SceneState();
    this.warehouse = null;
    this.software = null;
    this.document = null;
    this.spatial = null;
    this.destroyed = false;

    enableDevDebugFromElement(element);

    const scenarioId = scenario || element.dataset.scenario || '';
    this.scenario = ScenarioManager.resolve(scenarioId);
    this.root.dataset.scenario = this.scenario.id;
    this.root.dataset.layout = this.scenario.layout || 'warehouse';
    this.root.dataset.rtlsState = 'loading';

    this.playback = new PlaybackController(this.scenario.playback || {});
    this.bindSpatialDocument();

    const qualityName =
      quality ||
      element.dataset.quality ||
      this.scenario.quality ||
      'medium';

    devDebug('showcase-init', {
      scenario: this.scenario.id,
      quality: qualityName,
      layout: this.scenario.layout || 'warehouse',
      entities: this.document?.entities?.length ?? 0
    });

    this.buildShell();
    this.mountViews(qualityName);
    this.ready = Promise.resolve(this.warehouse?.ready).then(() => {
      if (!this.destroyed) {
        this.root.dataset.rtlsState = 'ready';
        devDebug('showcase-ready', { scenario: this.scenario.id, ok: true });
      }
    });
  }

  /**
   * Build WarehouseDocument + SpatialEngine from scenario.site (renderers still use site).
   */
  bindSpatialDocument() {
    const site = this.scenario.site;
    if (!site) return;

    this.document = toDocument(site, { id: this.scenario.id });
    this.spatial = SpatialEngine.fromDocument(this.document);

    logOccupancyMatrix(this.spatial.occupancy, {
      layer: 'obstacle',
      label: this.scenario.id
    });
    devDebug('floor-matrix-meta', {
      grid: this.document.grid,
      entities: this.document.entities.length
    });
  }

  /**
   * Programmatic spatial edits (editor-ready). Rejected edits leave the document unchanged.
   * @param {import('../domain/types.js').EntityBase} entity
   */
  addEntity(entity) {
    const result = this.spatial?.addEntity(entity) ?? { ok: false, reasons: ['no_spatial'], conflicts: [] };
    if (result.ok) this.eventBus.emit('spatial:dirty', result.dirty);
    return result;
  }

  /**
   * @param {string} entityId
   * @param {{ x?: number, z?: number, y?: number, yaw?: number, footprint?: object }} patch
   */
  moveEntity(entityId, patch) {
    const result = this.spatial?.moveEntity(entityId, patch) ?? {
      ok: false,
      reasons: ['no_spatial'],
      conflicts: []
    };
    if (result.ok) this.eventBus.emit('spatial:dirty', result.dirty);
    return result;
  }

  /**
   * @param {string} entityId
   */
  removeEntity(entityId) {
    const result = this.spatial?.removeEntity(entityId) ?? {
      ok: false,
      reasons: ['no_spatial'],
      conflicts: []
    };
    if (result.ok) this.eventBus.emit('spatial:dirty', result.dirty);
    return result;
  }

  /** Drain dirty flags from the spatial engine (for tests / future render patching). */
  consumeSpatialDirty() {
    return this.spatial?.consumeDirty() ?? { entityIds: [], cellBounds: null };
  }

  buildShell() {
    this.root.classList.add('rtls-showcase');
    this.root.replaceChildren();

    const layout = this.scenario.layout || 'warehouse';
    this.root.dataset.layout = layout;

    if (layout === 'split') {
      this.warehouseMount = document.createElement('div');
      this.warehouseMount.className = 'rtls-showcase__pane rtls-showcase__warehouse';
      this.softwareMount = document.createElement('div');
      this.softwareMount.className = 'rtls-showcase__pane rtls-showcase__software-host';
      this.root.append(this.warehouseMount, this.softwareMount);
      return;
    }

    if (layout === 'software') {
      this.warehouseMount = null;
      this.softwareMount = document.createElement('div');
      this.softwareMount.className = 'rtls-showcase__pane rtls-showcase__software-host';
      this.root.append(this.softwareMount);
      return;
    }

    this.warehouseMount = document.createElement('div');
    this.warehouseMount.className = 'rtls-showcase__pane rtls-showcase__warehouse';
    this.softwareMount = null;
    this.root.append(this.warehouseMount);
  }

  mountViews(quality) {
    const warehouseConfig = this.scenario.warehouse || { visible: false };
    const softwareConfig = this.scenario.software || { visible: false };

    if (warehouseConfig.visible !== false && this.warehouseMount) {
      this.warehouse = new WarehouseScene(this.warehouseMount, {
        quality,
        eventBus: this.eventBus,
        state: this.state,
        options: warehouseConfig,
        site: this.scenario.site || null,
        playback: this.playback
      });
    }

    if (softwareConfig.visible && this.softwareMount) {
      this.software = new SoftwareView(this.softwareMount, {
        eventBus: this.eventBus,
        state: this.state,
        options: softwareConfig,
        scenario: this.scenario
      });
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.warehouse?.destroy();
    this.software?.destroy();
    this.eventBus.clear();
    this.state.clear();
    this.root.replaceChildren();
    this.root.dataset.rtlsState = '';
  }
}
