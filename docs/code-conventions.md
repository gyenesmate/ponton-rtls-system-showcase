# Code conventions & best practices

Conventions for this WordPress + Vite + Three.js RTLS showcase plugin. Align with official WordPress guidance and common Vite/Three.js practice; adapt to patterns already used in this repo.

References:

- [WordPress PHP Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/)
- [WordPress Plugin Best Practices](https://developer.wordpress.org/plugins/plugin-basics/best-practices/)
- [Script Modules in WordPress 6.5+](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/)
- [Three.js: rendering on demand](https://threejs.org/manual/en/rendering-on-demand.html)
- Vite production assets as ES modules (`type="module"`) when bundling for modern browsers

---

## General principles

1. **Reuse over rewrite** — extend existing warehouse / software / scenario code.
2. **Configuration over duplication** — scenarios toggle features; they should not fork whole scenes.
3. **Composition** — `Showcase` mounts views; views own their DOM/WebGL.
4. **One source of truth** — preview and WordPress share `src/main.js`.
5. **Small, purposeful modules** — avoid mega-files and premature abstractions.
6. **Scope to the root** — every instance works from its `.rtls-showcase` element.

---

## PHP (WordPress plugin)

### Structure

- Bootstrap only in `rtls-showcase.php`; logic in `includes/class-*.php`.
- Guard every PHP file: `if ( ! defined( 'ABSPATH' ) ) { exit; }`.
- Use unique prefixes / class names (`Rtls_Showcase_*`) to avoid collisions ([plugin best practices](https://developer.wordpress.org/plugins/plugin-basics/best-practices/)).
- Prefer `require_once` for required includes.

### Security & output

- Sanitize shortcode input (`sanitize_key`, allowlists for scenario/quality).
- Escape all HTML attributes and text at print time (`esc_attr`, `esc_url`, etc.).
- Use `shortcode_atts()` with defaults; never trust raw `$atts`.
- Unknown scenarios must not fatally error — fall back to a default.

### Assets

- **Register** scripts/styles on `wp_enqueue_scripts`, **enqueue** only when the shortcode is present (or inside the shortcode callback for Avada/layout builders).
- Load the Vite bundle as a module (`type="module"`) — required for ESM output.
- Prefer stable filenames (`dist/rtls-showcase.js|.css`) so PHP enqueue stays simple. If you switch to hashed names, resolve via a Vite manifest in PHP.
- Version assets (plugin version + `filemtime`) for cache busting.
- Do not put Three.js / simulation logic in PHP.

### Style

- Follow [WordPress PHP Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/) where practical: tabs, Yoda optional, spaces around operators, braces for blocks.
- Keep PHP thin: registration, enqueue, validation, markup generation.

---

## JavaScript (Vite / ESM)

### Modules

- ES modules only under `src/`. Entry: `src/main.js`.
- Import Three.js from the `three` package (`three`, `three/addons/...`); Vite bundles for production.
- Export named symbols; keep side-effect boot limited to `main.js`.

### Showcase / scenarios

- Resolve scenarios through `ScenarioManager` / registry — no long `if/else` chains in `main.js`.
- Scenario objects stay declarative (`layout`, `warehouse`, `software` flags).
- Fall back gracefully on unknown IDs; log a warning.
- Support multiple `.rtls-showcase` nodes; store instances in a `WeakMap`.

### DOM

- Query within the showcase root / pane mounts (`querySelector` on the element), not `document.getElementById` for instance-owned nodes.
- Prefer `data-scenario`, `data-quality`, `data-rtls-state` for declarative hooks.
- Public API (if needed): `window.RtlsShowcase` for Avada live preview / dynamic inject.

### State & events

- Use lightweight `EventBus` / `SceneState` for warehouse ↔ software sync.
- Event names like `tag:position-changed`, `tag:zone-entered` — emit payloads, don’t couple views tightly.
- Don’t over-build an event system before a scenario needs it.

### Style

- Modern JS: `const`/`let`, classes or factories matching neighbors.
- No React/Vue/etc. unless explicitly introduced later.
- Avoid `useMemo`-style over-caching; keep code direct.

---

## Three.js / warehouse

### World coordinates

- **Y-up**, units = **meters**, floor top ≈ `y = 0`, origin at footprint center.
- Schematic: **−z = back**, **+z = front**; agent local forward = **+Z**.
- Site data stays plain numbers (no Three.js types). Helpers: `src/shared/grid.js` (`snapToGrid`, `wallFrame`, `wallToWorld` / `worldToWall`).
- Authoring grids (`showGroundGrid` / `showWallGrid`) are visualization only — they must not change poses.
- See [`docs/plans/rtls-showcase-foundation.md`](plans/rtls-showcase-foundation.md).

### Playback

- `Showcase` owns `PlaybackController` (`src/core/PlaybackController.js`) and passes it into `WarehouseScene`.
- Default `playback.mode` is continuous (autoplay + loop). Interactive demos use the same clock via `showcase.playback` (`play` / `pause` / `restart` / `setSpeed` / `seek`).
- Visibility/off-screen **RAF stop** is separate from `playback.paused`.
- When `respectReducedMotion` is true and the user prefers reduced motion, simulation stays paused.

### Models

- Optional GLB via `ModelRegistry` (`src/warehouse/assets/ModelRegistry.js`) and `public/assets/models/<key>.glb`.
- Object/machine specs may set `model: '<key>'`; omit or fail → procedural factory.
- Resolve URLs with `assetUrl()` (`src/shared/assetUrl.js`). Soft budgets live in `ASSET_BUDGETS` (`src/shared/constants.js`).

### Lifecycle

- Create renderer, scene, controls per `WarehouseScene` instance.
- On destroy: stop the loop, disconnect observers, dispose the scene graph (`src/shared/dispose.js`), `controls.dispose()`, `renderer.dispose()`, remove canvas, clear `ModelRegistry`.
- Dispose geometries/materials/textures when removing objects long-term ([GPU resources are not freed by remove alone](https://threejs.org/manual/en/rendering-on-demand.html) / Three.js dispose patterns).

### Performance (already expected here)

- Cap pixel ratio and FPS via quality presets.
- Pause with **IntersectionObserver** when off-screen and **Page Visibility** when the tab is hidden ([visibility API](https://www.w3.org/TR/page-visibility-2/), common WebGL practice).
- Prefer one large scene per page over many simultaneous WebGL contexts.
- For mostly static future scenes, consider render-on-demand; continuous RAF is fine while assets move.
- Repeated same-size machines use `InstancedMesh` when count ≥ `ASSET_BUDGETS.instanceMinCount`.

### Feature flags

- Scenario warehouse options (`showAnchors`, `showSignals`, `showPaths`, `showTags`, `showGroundGrid`, `showWallGrid`, …) toggle existing systems — don’t fork scenes.
- Follow-ups tracked in the foundation plan: software `view` / `highlight` still unused by SoftwareView; `interiorWalls` remain livemap-only until a 3D consumer is added.

---

## CSS

- Keep existing look; change styles only for modularization, split layouts, or Vite needs.
- Scope under `.rtls-showcase`, `.rtls-warehouse-scene`, `.rtls-software`.
- Layout modes via `data-layout="warehouse|software|split"`.
- No theme API / dark-mode framework.

---

## Vite workflow

```bash
npm install
npm run dev      # preview.html + HMR
npm run build    # writes dist/ for WordPress
```

- Source in `src/`; static files in `public/`.
- Import CSS from `main.js` so production CSS emits to `dist/rtls-showcase.css`.
- After frontend changes meant for WP, always rebuild `dist/`.
- Don’t maintain a second JS graph for `preview.html`.

---

## Git / docs hygiene

- Don’t commit secrets; `node_modules/` stays ignored.
- Update `docs/plugin-description.md` when scenarios or shortcode attrs change.
- Update `docs/file-structure.md` when folders/responsibilities change.
- Keep `AGENTS.md` accurate as the agent entrypoint into `docs/`.

---

## Checklist before finishing a change

- [ ] Works for **multiple** showcase instances on one page
- [ ] Preview and WordPress paths still share the same engine
- [ ] Scenario registered in JS **and** PHP allowlist (if new)
- [ ] No visualization logic added to PHP
- [ ] `npm run build` succeeds; `dist/` updated when needed
- [ ] No unrelated visual redesign or theme system
