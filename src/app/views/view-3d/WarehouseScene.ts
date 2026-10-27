import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PALETTE, RTLS_VISUALIZATION, getQualityPreset } from '../../../shared/constants.ts';
import { disposeObject3D } from '../../../shared/dispose.ts';
import { addLights, createDebugGrids } from '../../../core/rendering/index.ts';
import { createWarehouse } from './scene/warehouse.ts';
import { createMachineLayout } from './scene/machines.ts';
import { createMovementRoutes, registerRouteIntersections } from './scene/routes.ts';
import { createTrackedObjects } from './scene/trackedObjects.ts';
import { createZones } from './scene/zones.ts';
import { RouteManager } from './RouteManager.ts';
import { IntersectionController } from './IntersectionController.ts';
import { ZoneMonitor } from './ZoneMonitor.ts';
import { TrackingTagSystem } from './TrackingTagSystem.ts';
import { createRtlsInfrastructure } from './scene/infrastructure.ts';
import { DetectionVisualizer } from './DetectionVisualizer.ts';
import { ModelRegistry } from '../../../core/models/index.ts';
import type { PlaybackController, ScenarioConfig } from '../../../core/scenarios';
import type { EventBus } from '../../event-bus.ts';
import type { SceneState } from '../../scene-state.ts';
import type { WallAnchor } from './scene/infrastructure.ts';
import type { SiteEntry } from './types.ts';

export interface WarehouseSceneOptions {
  quality?: string;
  eventBus?: EventBus | null;
  state?: SceneState | null;
  options?: ScenarioConfig['warehouse'];
  site?: ScenarioConfig['site'] | null;
  playback?: PlaybackController | null;
}

/**
 * Reusable Three.js warehouse visualization driven by scenario.site + flags.
 */
export class WarehouseScene {
  container: HTMLElement;
  eventBus: EventBus | null;
  state: SceneState | null;
  site: SiteEntry;
  playback: PlaybackController | null;
  options: Record<string, any>;
  qualityName: string;
  quality: ReturnType<typeof getQualityPreset>;
  cameraViewHeight = 42;
  cameraTarget = new THREE.Vector3(0, 2.2, 0);
  lastFrameTime = 0;
  animationFrame = 0;
  isRunning = false;
  isIntersecting = true;
  pageIsVisible = !document.hidden;
  minFrameInterval: number;
  modelRegistry = new ModelRegistry();
  /** Resolves when the scene (including model loads) is ready. */
  ready: Promise<void>;
  _playbackEpoch: number;
  _elapsedFallback = 0;

  // Created in init().
  scene!: THREE.Scene;
  camera!: THREE.OrthographicCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  worldRoot!: THREE.Group;
  routeManager!: RouteManager;
  intersectionController!: IntersectionController;
  trackingTags!: TrackingTagSystem;
  detectionVisualizer!: DetectionVisualizer;
  zoneSystem!: ReturnType<typeof createZones>;
  zoneMonitor!: ZoneMonitor;
  anchors!: WallAnchor[];
  controlGroup!: THREE.Group | null;
  cableGroup!: THREE.Group;
  assets!: Record<string, THREE.Object3D>;
  signalsEnabled = true;
  tagsEnabled = true;
  resizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;
  visibilityHandler?: () => void;

  constructor(container: HTMLElement, {
    quality = 'medium',
    eventBus = null,
    state = null,
    options = {},
    site = null,
    playback = null
  }: WarehouseSceneOptions = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('WarehouseScene needs a valid container element.');
    }

    this.container = container;
    this.eventBus = eventBus;
    this.state = state;
    this.site = site || {};
    this.playback = playback;
    this.options = {
      visible: true,
      showTags: true,
      showAnchors: true,
      showZones: false,
      showSignals: true,
      showPaths: true,
      showIntersections: false,
      showGroundGrid: false,
      showWallGrid: false,
      ...options
    };

    this.qualityName = quality;
    this.quality = getQualityPreset(quality);
    this.minFrameInterval = 1000 / this.quality.targetFps;
    this._playbackEpoch = playback?.epoch ?? 0;
    this.ready = this.init();
  }

  /** Simulation time (shared clock when playback is provided). */
  get elapsed() {
    return this.playback ? this.playback.time : this._elapsedFallback;
  }

  async init(): Promise<void> {
    this.container.classList.add('rtls-warehouse-scene');
    this.container.dataset.rtlsState = 'loading';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.color1);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 180);
    this.camera.position.set(40, 34, 42);
    this.camera.lookAt(this.cameraTarget);

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality.antialias,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.cameraTarget);
    this.controls.enableDamping = true;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minZoom = 0.55;
    this.controls.maxZoom = 3.2;
    // Keep the camera above the floor plane (orthographic orbit).
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;

    addLights(this.scene, PALETTE, this.quality);

    this.worldRoot = new THREE.Group();
    this.worldRoot.rotation.y = this.site.orientationY || 0;
    this.scene.add(this.worldRoot);

    createWarehouse(this.worldRoot, PALETTE, this.site.warehouse || {});
    createMachineLayout(this.worldRoot, PALETTE, this.site.machines || [], {
      modelRegistry: this.modelRegistry
    });

    if (this.options.showGroundGrid || this.options.showWallGrid) {
      createDebugGrids(this.worldRoot, this.site, this.options);
    }

    this.routeManager = new RouteManager(this.worldRoot, PALETTE);
    this.intersectionController = new IntersectionController(this.worldRoot, {
      palette: PALETTE,
      debug: this.options.showIntersections === true
    });
    this.trackingTags = new TrackingTagSystem(PALETTE);
    const infrastructure = createRtlsInfrastructure(
      this.worldRoot,
      PALETTE,
      this.site.infrastructure || {}
    );
    this.anchors = infrastructure.anchors;
    this.controlGroup = infrastructure.controlGroup;
    this.cableGroup = infrastructure.cableGroup;

    this.detectionVisualizer = new DetectionVisualizer(
      this.worldRoot,
      PALETTE,
      infrastructure.anchors,
      RTLS_VISUALIZATION
    );

    createMovementRoutes(
      this.routeManager,
      PALETTE,
      this.site.routes || [],
      this.site.grid?.cellSize
    );
    registerRouteIntersections(this.intersectionController, this.site.intersections || []);

    this.zoneSystem = createZones(
      this.worldRoot,
      PALETTE,
      this.site.zones || [],
      this.options.showZones === true
    );

    this.assets = await createTrackedObjects({
      scene: this.worldRoot,
      palette: PALETTE,
      routeManager: this.routeManager,
      trackingTags: this.trackingTags,
      detectionVisualizer: this.detectionVisualizer,
      objects: this.site.objects || [],
      modelRegistry: this.modelRegistry
    });

    const objectLabels: Record<string, string> = {};
    (this.site.objects || []).forEach((spec: SiteEntry) => {
      objectLabels[spec.id] = spec.tracking?.label || spec.id;
    });

    this.zoneMonitor = new ZoneMonitor({
      zones: this.site.zones || [],
      eventBus: this.eventBus,
      state: this.state,
      objectLabels
    });

    this.applyFeatureFlags();
    this.installObservers();
    this.resize();
    this.container.dataset.rtlsState = 'ready';
    this.start();
  }

  applyFeatureFlags() {
    const {
      showSignals,
      showPaths,
      showTags,
      showIntersections,
      showZones,
      showAnchors
    } = this.options;

    const anchorsVisible = showAnchors !== false;
    this.anchors.forEach((anchor) => {
      anchor.group.visible = anchorsVisible;
    });
    if (this.controlGroup) this.controlGroup.visible = anchorsVisible;
    if (this.cableGroup) this.cableGroup.visible = anchorsVisible;

    this.routeManager.routes.forEach((route) => {
      const authored = this.site.routes?.find((entry: SiteEntry) => entry.id === route.id);
      if (authored && authored.visible === false) {
        route.group.visible = false;
        return;
      }
      route.group.visible = showPaths !== false;
    });

    this.intersectionController?.setDebugVisible(showIntersections === true);
    this.zoneSystem?.setVisible(showZones === true);

    this.signalsEnabled = showSignals !== false;
    this.tagsEnabled = showTags !== false;

    this.trackingTags.signalRings.forEach(({ ring }) => {
      ring.visible = this.tagsEnabled;
    });

    if (!this.signalsEnabled) {
      this.detectionVisualizer.trackedAssets.forEach((asset) => {
        asset.linkGroup.visible = false;
        asset.pulseGroup.visible = false;
      });
    }
  }

  installObservers() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isIntersecting = entry.isIntersecting && entry.intersectionRatio > 0.02;
        this.syncAnimationState();
      },
      { threshold: [0, 0.02, 0.25] }
    );
    this.intersectionObserver.observe(this.container);

    this.visibilityHandler = () => {
      this.pageIsVisible = !document.hidden;
      this.syncAnimationState();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  syncAnimationState() {
    // Visibility/off-screen stops RAF; distinct from playback.paused.
    if (this.isIntersecting && this.pageIsVisible) {
      this.start();
    } else {
      this.stop();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animationFrame = requestAnimationFrame((time) => this.animate(time));
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrame);
  }

  syncPlaybackEpoch() {
    if (!this.playback) return;
    if (this.playback.epoch === this._playbackEpoch) return;
    this._playbackEpoch = this.playback.epoch;
    this.routeManager.resetSimulation(this.playback.time);
  }

  animate(timestamp: number) {
    if (!this.isRunning) return;
    this.animationFrame = requestAnimationFrame((time) => this.animate(time));

    const frameTime = timestamp - this.lastFrameTime;
    if (frameTime < this.minFrameInterval) return;

    this.lastFrameTime = timestamp - (frameTime % this.minFrameInterval);
    const wallDelta = Math.min(frameTime / 1000, 0.1);

    this.syncPlaybackEpoch();

    let simDelta = wallDelta;
    if (this.playback) {
      simDelta = this.playback.tick(wallDelta);
    } else {
      this._elapsedFallback += wallDelta;
    }

    this.controls.update();
    this.intersectionController.update(this.routeManager.movingObjects);
    this.routeManager.update(simDelta);
    this.zoneMonitor?.update(this.routeManager.movingObjects, this.elapsed);

    if (this.tagsEnabled) {
      this.trackingTags.update(this.elapsed);
    }

    if (this.signalsEnabled) {
      this.detectionVisualizer.update(this.elapsed);
    } else {
      this.detectionVisualizer.trackedAssets.forEach((asset) => {
        asset.linkGroup.visible = false;
        asset.pulseGroup.visible = false;
      });
    }

    this.publishAssetPositions();
    this.renderer.render(this.scene, this.camera);
  }

  publishAssetPositions() {
    if (!this.state && !this.eventBus) return;

    Object.entries(this.assets || {}).forEach(([id, object]) => {
      if (!object) return;
      const position = {
        x: object.position.x,
        y: object.position.y,
        z: object.position.z
      };
      this.state?.setTagPosition(id, position);
      this.eventBus?.emit('tag:position-changed', { tagId: id, position });
    });
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    const aspect = width / height;

    this.camera.left = -(this.cameraViewHeight * aspect) / 2;
    this.camera.right = (this.cameraViewHeight * aspect) / 2;
    this.camera.top = this.cameraViewHeight / 2;
    this.camera.bottom = -this.cameraViewHeight / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.maxPixelRatio));
  }

  destroy() {
    this.stop();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.intersectionController?.destroy();
    this.controls?.dispose();
    this.modelRegistry?.dispose();
    if (this.scene) {
      disposeObject3D(this.scene);
    }
    this.renderer?.dispose();
    this.renderer?.domElement?.remove();
    // Drop the reference so a second destroy() is a no-op for scene disposal.
    this.scene = null as unknown as THREE.Scene;
  }
}
