# General Refactor — Application TypeScript Architecture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **plan-guide:** This file is the **General** row plan. Progress = checked / total task checkboxes below.

**Goal:** Migrate the RTLS showcase frontend to a single-package, application-based TypeScript layout under `src/`, relocate the WordPress plugin to `wordpress/`, restructure docs, and preserve current showcase behavior.

**Architecture:** Keep one root `package.json` (no workspaces). Move Three-free spatial/domain code into `src/core/grid`, GLB loading into `src/core/models`, draw-only Three into `src/core/rendering`, playback/scenario engine into `src/core/scenarios`, scenario configs into `src/data`, and orchestration/views into `src/app`. Grid remains the spatial authority; rendering only visualizes; app syncs 2D/3D from one state.

**Tech Stack:** Vite 6, Three.js r160, TypeScript (strict where practical), thin PHP WordPress plugin, Node self-checks under `tests/`.

## Global Constraints

- Preserve existing working behavior unless a change is necessary and documented in the task that makes it.
- One root `package.json` and one lockfile — no npm workspaces, no per-module manifests.
- Do not create empty folders for unbuilt features (scenario builder, future simulation leaves).
- Grid must not import Three.js; domain/grid types stay plain TypeScript.
- Rendering must not decide placement validity; use `core/grid` public API.
- Stable Vite outputs remain `dist/rtls-showcase.js` and `dist/rtls-showcase.css`.
- PHP requirement stays **7.4** (plugin header); WordPress **6.5+**.
- Installable plugin zip root is **`wordpress/`** (includes copied `dist/` after package script).
- Models live at **`public/models/<key>.glb`** (not `public/assets/models/`).
- Do **not** commit, push, or amend — leave all changes for the user to review.
- Refactor, don’t rewrite algorithms; full language + layout migration only.
- Adapt the target tree to code that exists; omit template folders with no files.

## Approved decisions

| Decision | Choice |
|----------|--------|
| Scope | General plan-guide row only |
| Migration | Full JS → TS of existing frontend into new tree |
| Execution | One implementation plan, staged checkpoints |
| Empty future modules | Omit until a later plan |
| WordPress | `wordpress/` is zip root |
| Models path | `public/models/` |
| Self-checks | Under `tests/`; keep npm scripts |

## Target layout (only create paths that receive files)

```text
src/
  main.ts
  app/                 # bootstrap, Showcase, views, sync, controls/ui as needed
  core/
    grid/              # SpatialEngine, gridMath, occupancy, document, siteAdapter, …
    rendering/         # scene draw helpers, lights, materials, debug grid, …
    models/            # ModelRegistry, displayScale, procedural factories if tied to load
    scenarios/         # ScenarioManager, PlaybackController, scenario types
  data/
    scenarios/         # developer scenario + sites
  shared/              # constants, assetUrl, dispose, dom, events, …
  styles/

public/models/
wordpress/             # rtls-showcase.php, includes/, dist/ (via package script)
tests/                 # spatial/domain self-checks
docs/
  architecture/
  development/
  deployment/
  technology-guides/
  features/            # only where content exists after move
  plans/
scripts/               # package-plugin, validate
```

## Current → target map

| Today | Target |
|-------|--------|
| `src/spatial/*` | `src/core/grid/` |
| `src/domain/*` | `src/core/grid/` (document, siteAdapter, types) |
| `src/shared/grid.js`, `grid.selfcheck.js` | Delete after move; checks → `tests/` |
| `src/warehouse/assets/ModelRegistry.js` | `src/core/models/model-registry.ts` |
| `src/warehouse/models/displayScale.js` | `src/core/models/scaling/` |
| `src/warehouse/models/{amr,worker,forklift,container}.js` | `src/core/models/` or `src/core/rendering/objects/` if procedural mesh-only (keep with registry consumers) |
| `src/warehouse/scene/lights.js`, `debugGrid.js`, draw helpers | `src/core/rendering/` |
| `src/warehouse/WarehouseScene.js`, scene builders that orchestrate | `src/app/views/view-3d/` |
| `src/software/*` | `src/app/views/view-2d/` |
| `src/core/Showcase.js`, `EventBus.js`, `SceneState.js` | `src/app/` |
| `src/core/PlaybackController.js`, `ScenarioManager.js` | `src/core/scenarios/` |
| `src/scenarios/*` | `src/data/scenarios/` |
| `src/main.js` | `src/main.ts` |
| `rtls-showcase.php`, `includes/` | `wordpress/` |
| `public/assets/models/` | `public/models/` |
| `src/spatial/__checks__/*`, `domain/__checks__/*` | `tests/` (+ `npm run check:spatial`) |

---

### Task 1: TypeScript and Vite tooling

**Files:**
- Create: `tsconfig.json`, `tsconfig.node.json`, `src/vite-env.d.ts`
- Modify: `package.json`, rename `vite.config.js` → `vite.config.ts`
- Modify entry later in Task 6; this task may keep building `src/main.js` until then **or** add a temporary dual entry — prefer switching entry only after `main.ts` exists (Task 6). For Task 1, point Vite at existing `src/main.js` still, add TS support so `.ts` modules can compile.

**Interfaces:**
- Produces: project can `import` `.ts` files from JS; `npx tsc --noEmit` runs.

- [ ] **Step 1: Add TypeScript dependencies**

```bash
npm install -D typescript @types/node
```

Do not add a second package manager. Keep `three` and `vite` as today.

- [ ] **Step 2: Add `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "allowJs": true,
    "checkJs": false,
    "resolveJsonModule": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "vite.config.ts"],
  "exclude": ["node_modules", "dist", "wordpress"]
}
```

- [ ] **Step 3: Add `src/vite-env.d.ts`**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 4: Convert Vite config to TypeScript**

Create `vite.config.ts` (delete `vite.config.js`):

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(rootDir, 'src/main.js'),
      output: {
        entryFileNames: 'rtls-showcase.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'rtls-showcase.css';
          }
          return 'assets/[name][extname]';
        },
        format: 'es',
        inlineDynamicImports: true
      }
    }
  },
  server: {
    open: '/preview.html'
  }
});
```

- [ ] **Step 5: Add scripts**

In `package.json` scripts:

```json
"typecheck": "tsc --noEmit",
"check:spatial": "node tests/spatial/runAll.js"
```

Remove `check:grid` once `src/shared/grid.selfcheck.js` is gone (Task 9). Until then leave `check:grid` or delete if unused.

- [ ] **Step 6: Verify tooling**

```bash
npm run typecheck
npm run build
```

Expected: `tsc` exits 0 (allowJs); `dist/rtls-showcase.js` and `dist/rtls-showcase.css` exist.

---

### Task 2: `src/core/grid` (Three-free spatial + document)

**Files:**
- Create under `src/core/grid/`: migrate from `src/spatial/*` and `src/domain/*` to `.ts`
- Create: `src/core/grid/index.ts`
- Test: move self-checks to `tests/spatial/` and `tests/domain/` (can land in Task 8; for this task keep checks compiling against new imports)

**Interfaces:**
- Consumes: none from new core packages.
- Produces public API from `src/core/grid/index.ts`:

```typescript
export { GridConfig } from './grid-config';
export {
  cellToWorld,
  worldToCell,
  wallToWorld,
  worldToWall,
  wallYaw,
  parseCellKey
  // …re-export every symbol currently imported elsewhere from spatial/gridMath
} from './grid-math';
export { Footprint } from './footprint';
export { OccupancyIndex } from './occupancy-index';
export { PlacementValidator } from './placement-validator';
export { SpatialEngine } from './spatial-engine';
export {
  toDocument,
  // …siteAdapter exports used by Showcase
} from './site-adapter';
export {
  indexableEntities,
  isIndexableEntity
  // …warehouseDocument exports used by SpatialEngine
} from './warehouse-document';
export type * from './types';
```

Use kebab-case file names matching the target architecture (`grid-config.ts`, `spatial-engine.ts`, …). Preserve class/function names (`SpatialEngine`, `GridConfig`, …).

- [ ] **Step 1: List inbound importers**

```bash
rg -n "from ['\"].*/(spatial|domain)/" src --glob "*.js"
```

Record every import path to update after the move.

- [ ] **Step 2: Migrate spatial modules to `src/core/grid/*.ts`**

Move and type (behavior-preserving):

| From | To |
|------|----|
| `src/spatial/gridMath.js` | `src/core/grid/grid-math.ts` |
| `src/spatial/GridConfig.js` | `src/core/grid/grid-config.ts` |
| `src/spatial/Footprint.js` | `src/core/grid/footprint.ts` |
| `src/spatial/OccupancyIndex.js` | `src/core/grid/occupancy-index.ts` |
| `src/spatial/PlacementValidator.js` | `src/core/grid/placement-validator.ts` |
| `src/spatial/SpatialEngine.js` | `src/core/grid/spatial-engine.ts` |

Replace JSDoc `@typedef` with TypeScript types in `src/core/grid/types.ts` (from `src/domain/types.js`).

- [ ] **Step 3: Migrate domain modules into grid**

| From | To |
|------|----|
| `src/domain/types.js` | `src/core/grid/types.ts` |
| `src/domain/warehouseDocument.js` | `src/core/grid/warehouse-document.ts` |
| `src/domain/siteAdapter.js` | `src/core/grid/site-adapter.ts` |

- [ ] **Step 4: Write `src/core/grid/index.ts`**

Re-export the public surface listed under **Interfaces**. Do not export test-only helpers.

- [ ] **Step 5: Point consumers at relative `core/grid` imports**

Update every importer from Step 1 to a relative path into the package entry (no path alias required):

```typescript
import { SpatialEngine, toDocument, GridConfig, cellToWorld } from '../core/grid';
```

Adjust `../` depth per file.

- [ ] **Step 6: Assert no Three imports in grid**

```bash
rg -n "from ['\"]three" src/core/grid
```

Expected: no matches.

- [ ] **Step 7: Run typecheck**

```bash
npm run typecheck
```

Expected: exit 0 (fix new errors in migrated files).

---

### Task 3: `src/core/models`

**Files:**
- Create: `src/core/models/model-registry.ts`, `src/core/models/model-catalog.ts` (thin catalog of known keys), `src/core/models/scaling/display-scale.ts`, `src/core/models/index.ts`
- Migrate procedural factories to `src/core/models/procedural/*.ts` (`amr`, `worker`, `forklift`, `container`) so `trackedObjects` and `ModelRegistry` share one models package.

**Interfaces:**
- Consumes: `assetUrl` from shared (still `src/shared/assetUrl.js` until Task 5/6 types it).
- Produces:

```typescript
// src/core/models/index.ts
export { ModelRegistry } from './model-registry';
export { MODEL_CATALOG } from './model-catalog';
export { displayScaleFor /* existing export names */ } from './scaling/display-scale';
```

`ModelRegistry.acquire(key, meta?)` must resolve files at `models/<key>.glb` via `assetUrl` (path change lands in Task 7; until then keep old path string in one constant `MODELS_PUBLIC_PREFIX`).

- [ ] **Step 1: Introduce path constant**

In `src/core/models/model-registry.ts`:

```typescript
/** Public URL segment under Vite publicDir / dist. Updated in Task 7 to `models`. */
export const MODELS_PUBLIC_PREFIX = 'assets/models';

// load: assetUrl(`${MODELS_PUBLIC_PREFIX}/${key}.glb`)
```

- [ ] **Step 2: Migrate `ModelRegistry` to TypeScript under `src/core/models/`**

Preserve acquire/cache/clone-on-success and null-on-failure behavior.

- [ ] **Step 3: Migrate `displayScale` and procedural model factories**

Keep export names used by `trackedObjects.js`.

- [ ] **Step 4: Add `index.ts` and update importers**

```bash
rg -n "ModelRegistry|displayScale|warehouse/models" src
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

---

### Task 4: `src/core/scenarios`

**Files:**
- Create: `src/core/scenarios/playback-controller.ts` (from `src/core/PlaybackController.js`)
- Create: `src/core/scenarios/scenario-manager.ts` (from `src/core/ScenarioManager.js`)
- Create: `src/core/scenarios/scenario-types.ts` (layout, playback options, scenario shape)
- Create: `src/core/scenarios/index.ts`
- Data configs stay in Task 5 (`src/data/scenarios`)

**Interfaces:**
- Consumes: scenario registry from `src/data/scenarios` (after Task 5; until then import from old `src/scenarios/index.js`).
- Produces:

```typescript
export { PlaybackController } from './playback-controller';
export { ScenarioManager } from './scenario-manager';
export type { ScenarioConfig, PlaybackOptions, ShowcaseLayout } from './scenario-types';
```

`PlaybackController` constructor options remain: `mode`, `autoplay`, `loop`, `speed`, `respectReducedMotion`. Methods: `play`, `pause`, `restart`, and existing tick/seek API — preserve signatures from current class.

- [ ] **Step 1: Define `scenario-types.ts` from current scenario objects**

Mirror fields used in `src/scenarios/developer.js` and `ScenarioManager.resolve`: `id`, `layout`, `warehouse`, `software`, `playback`, `quality`, `site`.

- [ ] **Step 2: Migrate `PlaybackController` and `ScenarioManager` to `src/core/scenarios/`**

- [ ] **Step 3: Export `index.ts` and update Showcase imports**

```typescript
import { ScenarioManager, PlaybackController } from '../core/scenarios';
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

---

### Task 5: `src/data/scenarios` + `src/core/rendering` + `src/app`

**Files:**
- Create: `src/data/scenarios/developer.ts`, `src/data/scenarios/sites/default-warehouse-site.ts`, `src/data/scenarios/index.ts`
- Create: `src/core/rendering/` — migrate draw-only modules (`lights.js`, `debugGrid.js`, materials helpers, pure mesh builders)
- Create: `src/app/bootstrap.ts`, `src/app/showcase.ts` (from `Showcase.js`), `src/app/event-bus.ts`, `src/app/scene-state.ts`
- Create: `src/app/views/view-3d/` (from `WarehouseScene.js` + remaining `warehouse/scene/*` orchestration, routes, zones monitors as today)
- Create: `src/app/views/view-2d/` (from `src/software/*`)
- Keep 2D/3D sync inside `showcase.ts` (do not create an empty `synchronization/` folder)
- Create: `src/app/index.ts` if useful
- Create: `src/core/rendering/index.ts`

**Interfaces:**
- Consumes: `core/grid`, `core/models`, `core/scenarios`, `data/scenarios`
- Produces: `Showcase` class usable from `main.ts` with same constructor `(element, { scenario, quality })`

Single source of truth: `Showcase` still builds `document` + `SpatialEngine` via `toDocument` / `fromDocument`; both views read scenario/site/document — do not duplicate occupancy state in the 2D view.

- [ ] **Step 1: Move scenario data to `src/data/scenarios/`**

`index.ts` exports registry map + default id matching PHP allowlist (`developer`).

- [ ] **Step 2: Wire `ScenarioManager` to import registry from `../../data/scenarios`**

- [ ] **Step 3: Migrate rendering-only warehouse pieces to `src/core/rendering/`**

If unsure whether a file is “draw-only” vs orchestration, leave it under `app/views/view-3d/` (prefer fewer wrong splits).

- [ ] **Step 4: Migrate `WarehouseScene` → `src/app/views/view-3d/`**

Update imports to `core/grid`, `core/models`, `core/rendering`, `core/scenarios`.

- [ ] **Step 5: Migrate software UI → `src/app/views/view-2d/`**

- [ ] **Step 6: Migrate `Showcase`, `EventBus`, `SceneState` → `src/app/`**

```typescript
// showcase.ts — bindSpatialDocument remains:
this.document = toDocument(site, { id: this.scenario.id });
this.spatial = SpatialEngine.fromDocument(this.document);
```

- [ ] **Step 7: Typecheck and build**

```bash
npm run typecheck
npm run build
```

---

### Task 6: Entry, shared, styles

**Files:**
- Create: `src/main.ts` (from `src/main.js`)
- Modify: `vite.config.ts` input → `src/main.ts`
- Migrate remaining `src/shared/*` to `.ts` under `src/shared/` (thin: `constants`, `assetUrl`, `dispose`, `dom`, `geometry`, `animation`, `devDebugger`)
- Keep `src/styles/*.css` (import from `main.ts`)

**Interfaces:**
- Produces: same public boot API as today (`initializeShowcase` / auto-boot on `.rtls-showcase`).

- [ ] **Step 1: Write `src/main.ts`**

```typescript
import { Showcase } from './app/showcase';
import './shared/dev-debugger';
import './styles/showcase.css';
import './styles/warehouse.css';
import './styles/software.css';

const instances = new WeakMap<HTMLElement, Showcase>();

export function initializeShowcase(
  container: HTMLElement,
  overrides: { scenario?: string; quality?: string } = {}
): Showcase | null {
  if (!(container instanceof HTMLElement)) return null;
  if (instances.has(container)) return instances.get(container)!;

  try {
    const showcase = new Showcase(container, {
      scenario: overrides.scenario || container.dataset.scenario,
      quality: overrides.quality || container.dataset.quality
    });
    instances.set(container, showcase);
    return showcase;
  } catch (error) {
    container.dataset.rtlsState = 'error';
    console.error('RTLS Showcase initialization failed:', error);
    return null;
  }
}

function initializeAll(root: ParentNode = document): void {
  root.querySelectorAll('.rtls-showcase').forEach((element) => {
    initializeShowcase(element as HTMLElement);
  });
}

function boot(): void {
  initializeAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
```

(Adjust `dev-debugger` filename to whatever the migrated shared module is named.)

- [ ] **Step 2: Point Vite `rollupOptions.input` at `src/main.ts`**

- [ ] **Step 3: Migrate shared utilities to TypeScript**

- [ ] **Step 4: Delete `src/main.js` after `main.ts` works**

- [ ] **Step 5: Verify preview entry**

```bash
npm run build
npm run dev
```

Expected: `preview.html` still opens; `.rtls-showcase` mounts without console errors.

---

### Task 7: `public/models/`, WordPress package root, scripts

**Files:**
- Move: `public/assets/models/**` → `public/models/**` (keep README)
- Modify: `MODELS_PUBLIC_PREFIX` → `'models'`
- Move: `rtls-showcase.php`, `includes/` → `wordpress/`
- Create: `scripts/package-plugin.mjs` (copy `dist/` into `wordpress/dist/`)
- Create: `scripts/validate.mjs` (optional: existence checks for dist + php main file)
- Modify: `package.json` scripts `package:plugin`, `validate`
- Ensure PHP still resolves `dist/rtls-showcase.js` relative to plugin root (`wordpress/`)

**Interfaces:**
- WordPress zip = contents of `wordpress/` after `npm run build && npm run package:plugin`.

- [ ] **Step 1: Move model files to `public/models/`**

Update `public/models/README.md` paths. Remove empty `public/assets/models` if empty.

- [ ] **Step 2: Set `MODELS_PUBLIC_PREFIX = 'models'`**

- [ ] **Step 3: Move PHP plugin into `wordpress/`**

```text
wordpress/
  rtls-showcase.php
  includes/class-rtls-showcase.php
  includes/class-assets.php
  includes/class-shortcode.php
```

Keep `RTLS_SHOWCASE_PATH` / URL helpers based on `__FILE__` so `dist/` is `wordpress/dist/`.

- [ ] **Step 4: Add `scripts/package-plugin.mjs`**

```javascript
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const wpDist = resolve(root, 'wordpress', 'dist');

if (!existsSync(resolve(dist, 'rtls-showcase.js'))) {
  console.error('Missing dist/rtls-showcase.js — run npm run build first');
  process.exit(1);
}

rmSync(wpDist, { recursive: true, force: true });
mkdirSync(wpDist, { recursive: true });
cpSync(dist, wpDist, { recursive: true });
console.log('Copied dist/ → wordpress/dist/');
```

- [ ] **Step 5: Add `scripts/validate.mjs` and npm scripts**

```javascript
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'wordpress/rtls-showcase.php',
  'wordpress/dist/rtls-showcase.js',
  'wordpress/dist/rtls-showcase.css'
];
let failed = false;
for (const rel of required) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) {
    console.error('Missing:', rel);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log('validate: ok');
```

```json
"package:plugin": "node scripts/package-plugin.mjs",
"validate": "node scripts/validate.mjs"
```

- [ ] **Step 6: Build and package**

```bash
npm run build
npm run package:plugin
npm run validate
```

Expected: validate exits 0.

---

### Task 8: Tests relocation and docs tree

**Files:**
- Move: `src/spatial/__checks__/*` → `tests/spatial/`
- Move: `src/domain/__checks__/*` → `tests/domain/`
- Create: `tests/spatial/runAll.js` (or `.ts` run via node after build — keep plain JS runners importing compiled-free TS via `tsx` **or** keep checks as `.ts` run with `node --experimental-strip-types` / `tsx`; simplest: keep self-checks as TypeScript-free `.mjs` importing from `src/core/grid` via Vite-free relative `.ts` only if Node can load them — **prefer** migrating checks to `.ts` and running with)

```json
"check:spatial": "node --import tsx tests/spatial/runAll.ts"
```

If adding `tsx` as a devDependency is acceptable for one runner; otherwise compile-free: keep checks as `.js` that import from `../src/core/grid/...` with `allowJs` — **chosen approach:** add devDependency `tsx` and run:

```json
"check:spatial": "tsx tests/spatial/runAll.ts"
```

- Create docs (move/split existing; no empty feature folders without content):

| Doc | Action |
|-----|--------|
| `docs/file-structure.md` | Move/adapt → `docs/architecture/file-structure.md` |
| `docs/plugin-description.md` | → `docs/architecture/plugin-description.md` or `docs/features/` as appropriate |
| `docs/code-conventions.md` | → `docs/development/code-conventions.md` |
| New | `docs/development/setup.md` (npm scripts, preview) |
| New | `docs/deployment/wordpress.md` (zip `wordpress/` after package:plugin, upload, activate, shortcode) |
| New | `docs/technology-guides/typescript.md`, `threejs.md`, `vite.md`, `wordpress.md` (concise; testing.md if checks exist) |
| New | `docs/architecture/overview.md` (module boundaries from this plan) |
| `docs/plans/*` | Stay |
| `AGENTS.md` | Update required-reading paths |
| `README.md` | Prerequisites, commands, zip/upload WP install |

- [ ] **Step 1: Relocate self-checks to `tests/` and fix imports to `src/core/grid`**

- [ ] **Step 2: Install `tsx` and wire `check:spatial`**

```bash
npm install -D tsx
npm run check:spatial
```

Expected: all asserts pass (same as today’s spatial suite).

- [ ] **Step 3: Restructure docs as in the table**

Do not create empty `docs/features/scenario-builder/` etc. Optional: one-line stubs only under `docs/features/` for areas that already have runtime code (grid, rendering, models, scenarios).

- [ ] **Step 4: Update `AGENTS.md` and `README.md`**

README must include:

1. `npm install` / `npm run dev` / `npm run build` / `npm run typecheck` / `npm run check:spatial`
2. `npm run package:plugin`
3. Zip the `wordpress/` folder, upload in WP Admin → Plugins, activate, add `[rtls_showcase scenario="developer"]`

- [ ] **Step 5: Add `docs/README.md` index linking the new folders**

---

### Task 9: Delete legacy trees and shims

**Files:**
- Delete once nothing imports them: `src/spatial/`, `src/domain/`, `src/warehouse/` (if fully moved), `src/software/`, old `src/scenarios/`, old `src/core/*.js`, `src/shared/grid.js`, `src/effects/` if still empty, `public/assets/` if empty, root `rtls-showcase.php` / `includes/` after wordpress move

- [ ] **Step 1: Confirm no leftover imports**

```bash
rg -n "src/spatial|src/domain|shared/grid|warehouse/assets/ModelRegistry|from ['\"]\\.\\./warehouse" src tests
```

Expected: no stale paths (except intentional docs history).

- [ ] **Step 2: Delete obsolete directories and empty `effects/`**

- [ ] **Step 3: Remove `check:grid` script if file gone**

- [ ] **Step 4: Build + typecheck + spatial**

```bash
npm run typecheck
npm run check:spatial
npm run build
npm run package:plugin
npm run validate
```

---

### Task 10: Final validation checklist

- [ ] **Step 1: `npm run typecheck`** — exit 0
- [ ] **Step 2: `npm run check:spatial`** — exit 0
- [ ] **Step 3: `npm run build`** — writes `dist/rtls-showcase.js` and `dist/rtls-showcase.css`
- [ ] **Step 4: `npm run package:plugin` && `npm run validate`** — exit 0
- [ ] **Step 5: Smoke `npm run dev`** — developer scenario shows floor/grid; no init errors
- [ ] **Step 6: Update [`plan-guide.md`](plan-guide.md) General Progress** to `checked/total` matching this file’s checkboxes after implementation (during implementation, tick boxes here as you go)
- [ ] **Step 7: Record deviations** at the bottom of this file under **Deviations** (add section if any path differed)

## Deviations

_(None yet — implementers append bullet points here.)_

## Unresolved (out of scope — later plan-guide rows)

- Scenario builder UI
- Playback on-screen UX redesign
- JSON scenario storage decision
- WebGPU renderer
- PHP version bump above 7.4
- GitHub publish (user-owned Git)

---

## Checkbox count (for plan-guide)

There are **56** task checkboxes (`- [ ]`) under Tasks 1–10. Initial Progress: **0/56**.
