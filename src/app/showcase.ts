import { SpatialEngine, toDocument } from '../core/grid/index.ts';
import type {
  EntityBase,
  SpatialDirtySet,
  SpatialEditResult,
  WarehouseDocument
} from '../core/grid/index.ts';
import { ScenarioManager, PlaybackController } from '../core/scenarios';
import type { ScenarioConfig } from '../core/scenarios';
import { enableDevDebugFromElement, devDebug, logOccupancyMatrix } from '../shared/devDebugger.ts';
import { EventBus } from './event-bus.ts';
import { SceneState } from './scene-state.ts';
import { WarehouseScene } from './views/view-3d/WarehouseScene.ts';
import { SoftwareView } from './views/view-2d/SoftwareView.ts';

export interface ShowcaseOptions {
  scenario?: string;
  quality?: string;
}

type EntityPatch = Parameters<SpatialEngine['moveEntity']>[1];

const NO_SPATIAL: SpatialEditResult = { ok: false, reasons: ['no_spatial'], conflicts: [] };

/**
 * One independent RTLS showcase instance bound to a root element.
 * Owns the document + SpatialEngine; 2D and 3D views read scenario/site/document from here.
 */
export class Showcase {
  root: HTMLElement;
  eventBus = new EventBus();
  state = new SceneState();
  warehouse: WarehouseScene | null = null;
  software: SoftwareView | null = null;
  document: WarehouseDocument | null = null;
  spatial: SpatialEngine | null = null;
  destroyed = false;
  scenario: ScenarioConfig;
  playback: PlaybackController;
  ready: Promise<void>;
  warehouseMount: HTMLElement | null = null;
  softwareMount: HTMLElement | null = null;

  constructor(element: HTMLElement, { scenario, quality }: ShowcaseOptions = {}) {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError('Showcase requires a valid root element.');
    }

    this.root = element;

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
  bindSpatialDocument(): void {
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

  /** Programmatic spatial edits (editor-ready). Rejected edits leave the document unchanged. */
  addEntity(entity: EntityBase): SpatialEditResult {
    return this.emitDirty(this.spatial?.addEntity(entity));
  }

  moveEntity(entityId: string, patch: EntityPatch): SpatialEditResult {
    return this.emitDirty(this.spatial?.moveEntity(entityId, patch));
  }

  removeEntity(entityId: string): SpatialEditResult {
    return this.emitDirty(this.spatial?.removeEntity(entityId));
  }

  /** Drain dirty flags from the spatial engine (for tests / future render patching). */
  consumeSpatialDirty(): SpatialDirtySet {
    return this.spatial?.consumeDirty() ?? { entityIds: [], cellBounds: null };
  }

  private emitDirty(result: SpatialEditResult = NO_SPATIAL): SpatialEditResult {
    if (result.ok) this.eventBus.emit('spatial:dirty', result.dirty);
    return result;
  }

  buildShell(): void {
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

  mountViews(quality: string): void {
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

  destroy(): void {
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
