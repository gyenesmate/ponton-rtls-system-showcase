# File structure — where to put new work

Use this map when adding features. Prefer extending existing modules over inventing parallel trees.

Architecture plans: [`rtls-showcase-foundation.md`](plans/rtls-showcase-foundation.md) (coords / models / playback), [`rtls-showcase-spatial-grid.md`](plans/rtls-showcase-spatial-grid.md) (document / occupancy / placement).

## Repository layout

```text
ponton-rtls-system-showcase/
├── AGENTS.md                # AI brief → points here (docs/)
├── README.md                # Human install / commands
├── docs/                    # Plugin definitions for humans + agents
│   ├── plugin-description.md
│   ├── file-structure.md    # this file
│   ├── code-conventions.md
│   └── plans/               # Architecture / implementation plans
│
├── rtls-showcase.php        # WP plugin bootstrap only
├── includes/                # Thin PHP integration
│   ├── class-rtls-showcase.php
│   ├── class-assets.php
│   └── class-shortcode.php
│
├── preview.html             # Vite dev host (same markup as WP)
├── package.json
├── vite.config.js
│
├── src/                     # All frontend source (Vite)
│   ├── main.js              # Boot: find .rtls-showcase → Showcase
│   ├── core/                # Showcase engine + PlaybackController
│   ├── domain/              # WarehouseDocument + siteAdapter (Three-free)
│   ├── spatial/             # Three-free grid math, footprints, occupancy
│   ├── scenarios/           # Scenario configs (keywords)
│   ├── warehouse/           # Three.js warehouse (reused animation)
│   ├── software/            # Simplified operator UI
│   ├── effects/             # Optional shared visual effects (add when needed)
│   ├── shared/              # Constants, DOM, geometry, grid shim, dispose, devDebugger
│   └── styles/              # showcase / warehouse / software CSS
│
├── public/                  # Static assets copied by Vite
│   └── assets/
│       ├── models/          # Optional .glb files (see README there)
│       ├── svg/
│       └── images/
│
└── dist/                    # Production build (enqueued by WP)
    ├── rtls-showcase.js
    └── rtls-showcase.css
```

## Decision guide — “I need to add…”

| Goal | Put it here |
|------|-------------|
| New scenario keyword | `src/scenarios/<id>.js` (+ `site` via `withSite()` / `src/scenarios/sites/`) + register in `index.js` + PHP `SCENARIOS` |
| Shared / default floor plan data | `src/scenarios/sites/defaultWarehouseSite.js` |
| Change shortcode / markup attrs | `includes/class-shortcode.php` (+ sanitize list in `class-rtls-showcase.php`) |
| Change how assets load in WP | `includes/class-assets.php` |
| Boot / multi-instance init | `src/main.js` |
| Orchestration (layout, mount warehouse/software) | `src/core/Showcase.js` |
| Scenario registry / fallback | `src/core/ScenarioManager.js` |
| Shared simulation events/state | `src/core/EventBus.js`, `src/core/SceneState.js` |
| Playback clock (play/pause/speed/seek) | `src/core/PlaybackController.js` (owned by Showcase; pass into WarehouseScene) |
| Warehouse scene lifecycle / flags | `src/warehouse/WarehouseScene.js` |
| Routes / movement | `src/warehouse/RouteManager.js`, `src/warehouse/scene/routes.js` (data from `site.routes`) |
| Path intersections / yield | `src/warehouse/IntersectionController.js` (+ `site.intersections`) |
| Alert / marketing zones | `src/warehouse/scene/zones.js` (+ `site.zones`, `showZones`) |
| Ground / wall grid utils + snap | `src/spatial/gridMath.js` (shim: `src/shared/grid.js`) |
| Grid config (cols/rows/origin) | `src/spatial/GridConfig.js` |
| Footprint raster (OBB → cells) | `src/spatial/Footprint.js` |
| Sparse multi-layer occupancy | `src/spatial/OccupancyIndex.js` |
| Placement validation | `src/spatial/PlacementValidator.js` |
| Spatial facade + edit API | `src/spatial/SpatialEngine.js` (`addEntity` / `moveEntity` / `removeEntity`) |
| Spatial self-checks | `npm run check:spatial` (alias: `check:grid`) |
| Authoring grid visualization | `src/warehouse/scene/debugGrid.js` via `showGroundGrid` / `showWallGrid` |
| GLB model load / cache | `src/warehouse/assets/ModelRegistry.js` + `public/assets/models/` |
| Dev logger | `src/shared/devDebugger.js` (`?rtlsDebug=1`, `data-debug`, DEV default on) |
| Domain / spatial JSDoc types | `src/domain/types.js` (see spatial-grid plan) |
| Warehouse document helpers | `src/domain/warehouseDocument.js` |
| Legacy site ↔ document | `src/domain/siteAdapter.js` |
| Static asset URL helper | `src/shared/assetUrl.js` |
| GPU dispose walk | `src/shared/dispose.js` |
| Tracked models (procedural) | `src/warehouse/models/*`, spawned from `site.objects` via `scene/trackedObjects.js` |
| Anchors / tags / signal links | `warehouse/scene/infrastructure.js` (from `site.infrastructure`), `TrackingTagSystem.js`, `DetectionVisualizer.js` |
| Operator UI panels | `src/software/*` |
| Cross-cutting CSS | `src/styles/showcase.css` |
| Warehouse-only CSS | `src/styles/warehouse.css` |
| Software UI CSS | `src/styles/software.css` |
| Shared palette / quality / asset budgets | `src/shared/constants.js` |
| SVG / raster for Vite | `public/assets/svg/` or `public/assets/images/` |
| Local multi-scenario playground | `preview.html` (markup only — no demo logic) |
| Docs for agents / contributors | `docs/` (+ update `AGENTS.md` if workflow changes) |
| Foundation / architecture plans | `docs/plans/` |

## Adding a new scenario (checklist)

1. Create `src/scenarios/my-scenario.js` with `id`, UI `layout`, `warehouse` flags, `software`, and a **`site`** (use `withSite({ ... })` from `sites/defaultWarehouseSite.js`).
2. Put floor data in `site`: `warehouse`, `machines`, `routes`, `intersections`, `zones`, `objects`, `orientationY`, `infrastructure`.
3. Optional: `playback: { mode, autoplay, speed, respectReducedMotion }`, `warehouse.showGroundGrid` / `showWallGrid`, object `model` keys.
4. Register it in `src/scenarios/index.js`.
5. Add `'my-scenario'` to `Rtls_Showcase::SCENARIOS` in `includes/class-rtls-showcase.php`.
6. Optionally add a section in `preview.html` with `data-scenario="my-scenario"`.
7. Document it in `docs/plugin-description.md`.
8. Run `npm run build`.

Prefer **site config + feature flags** over copying scene code per scenario.

## Adding a tracked warehouse asset (checklist)

1. Procedural factory in `src/warehouse/models/` (+ type entry in `trackedObjects.js` FACTORIES if new), **or** place `public/assets/models/<key>.glb` and set `model: '<key>'` on the object.
2. Add an object entry to the scenario’s `site.objects` (id, type, routeId, movement, tracking).
3. Ensure the route exists in `site.routes`.
4. Run `npm run build` / preview that scenario.

## Adding software UI pieces

1. Component under `src/software/`.
2. Compose from `SoftwareView.js`.
3. Scope DOM queries to the showcase root / software mount.
4. Subscribe to `EventBus` events when mirroring warehouse state (do not poll globals).

## What not to create

- Parallel “demo” apps inside `preview.html`
- Scenario-specific full warehouse copies
- Visualization code under `includes/`
- Hashed `dist/` filenames without updating PHP enqueue
- Theme managers or `data-theme` systems

## Empty / optional folders

`src/effects/` exists for future effects. `public/assets/models/` holds optional GLBs — procedural factories remain the default when no model is set or load fails.
