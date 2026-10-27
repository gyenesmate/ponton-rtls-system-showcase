# Plugin description — RTLS Showcase

## Purpose

**RTLS Showcase** is a WordPress plugin for Avada (and any theme) that embeds interactive Real-Time Location System demonstrations on marketing pages.

Editors choose a **scenario keyword**. The frontend engine resolves that keyword and renders the matching demonstration: warehouse 3D animation, simplified software UI, or both.

It is a **showcase / marketing representation**, not a production RTLS client or a clone of the Angular operator app.

## Audience

- Marketing and sales pages that need visual RTLS explanations
- Avada builders placing shortcodes in layouts
- Developers extending scenarios, warehouse visuals, or the software stub

## Runtime model

```text
WordPress shortcode  or  preview.html container
        │
        ▼
<div class="rtls-showcase" data-scenario="…">
        │
        ▼
src/main.js → Showcase → ScenarioManager
        │
        ├── WarehouseScene   (Three.js warehouse – existing animation)
        └── SoftwareView     (simplified operator UI)
```

- **PHP** registers assets and shortcodes, sanitizes attributes, outputs the container.
- **JavaScript** detects `.rtls-showcase` nodes, resolves scenarios, mounts views, runs animation.

Local development uses the same engine via Vite + `preview.html` (`npm run dev`).

## Shortcode API

Primary:

```text
[rtls_showcase scenario="developer"]
```

Optional attributes:

| Attribute     | Default             | Notes                                      |
|---------------|---------------------|--------------------------------------------|
| `scenario`    | `developer`         | Must be a known scenario ID                |
| `height`      | `640px`             | CSS custom property `--rtls-height`        |
| `min_height`  | `420px`             | CSS custom property `--rtls-min-height`    |
| `quality`     | `medium`            | `high` \| `medium` \| `low`                |
| `class`       | _(empty)_           | Extra CSS class on the root                |

Legacy alias (maps to UWB positioning):

```text
[rtls_warehouse]
```

Equivalent markup (also valid in Avada HTML / `preview.html`):

```html
<div
  class="rtls-showcase"
  data-scenario="developer"
  data-quality="medium"
  style="--rtls-height:620px;--rtls-min-height:420px;">
</div>
```

Unknown `scenario` values are sanitized in PHP to the default and resolved in JS with a console warning + fallback.

## Built-in scenarios

| ID          | UI layout | Intent |
|-------------|-----------|--------|
| `developer` | warehouse | Empty shell (floor + walls) with ground/wall grids for spatial-engine work |

Scenario configs live in `src/scenarios/`. Each warehouse scenario owns a declarative **`site`** (plain data: floor, machines, routes, intersections, zones, objects, infrastructure). Shared baseline: `src/scenarios/sites/defaultWarehouseSite.js` via `withSite()`. Marketing scenarios were removed while the spatial grid engine is built — see [`docs/plans/rtls-showcase-spatial-grid.md`](plans/rtls-showcase-spatial-grid.md).

`layout` is UI chrome only (`warehouse` | `split` | `software`). Spatial layout is always under `site` so it can later drive the 2D software livemap.

Feature flags under `warehouse` (e.g. `showSignals`, `showZones`, `showPaths`) toggle visualization without duplicating builders.

## Quality modes

| Mode     | Target FPS | Max DPR | Shadows        |
|----------|------------|---------|----------------|
| `high`   | 60         | 2       | on, 2048 map   |
| `medium` | 45         | 1.5     | on, 1024 map   |
| `low`    | 30         | 1       | off            |

Rendering already pauses when the canvas leaves the viewport or the tab is hidden.

## Build artifacts

```bash
npm run build
```

Produces stable files WordPress enqueues:

```text
dist/rtls-showcase.js
dist/rtls-showcase.css
```

Plugin entry: `rtls-showcase.php`.

## Out of scope

- Full production RTLS / Angular app parity
- Theme / dark-mode systems
- Visualization logic in PHP
- Separate demo implementations for `preview.html`
