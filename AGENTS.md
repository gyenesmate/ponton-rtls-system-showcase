# Agent brief — RTLS Showcase docs

Read this file first when working on this repository. Detailed plugin definitions live in **`docs/`**. Prefer those docs over inventing new architecture.

## What this project is

A WordPress/Avada plugin that renders modular RTLS marketing showcases. PHP only selects a scenario and prints a container; Vite-built JavaScript owns visualization and animation.

## Required reading (in order)

| Doc | Purpose |
|-----|---------|
| [`docs/plugin-description.md`](docs/plugin-description.md) | Product purpose, shortcode API, scenario list, runtime flow |
| [`docs/file-structure.md`](docs/file-structure.md) | Where files live and where to put new ones |
| [`docs/code-conventions.md`](docs/code-conventions.md) | Coding standards and best practices for this stack |
| [`docs/plans/rtls-showcase-foundation.md`](docs/plans/rtls-showcase-foundation.md) | Foundation: coords/grids, models, playback |
| [`docs/plans/rtls-showcase-spatial-grid.md`](docs/plans/rtls-showcase-spatial-grid.md) | Spatial grid engine + warehouse document |

Also skim [`README.md`](README.md) for install/dev commands.

## Non‑negotiables for agents

1. **Refactor, don’t rewrite** — reuse warehouse / movement / RTLS visualization code unless a change is required.
2. **PHP stays thin** — no simulation or Three.js logic in PHP; only registration, enqueue, sanitize, markup.
3. **One frontend app** — `preview.html` and WordPress both boot via `src/main.js` / `Showcase`.
4. **Scenarios are config** — add scenarios under `src/scenarios/`; each warehouse scenario owns a `site` (floor/routes/objects). Register in `index.js` and mirror IDs in PHP `Rtls_Showcase::SCENARIOS`.
5. **Stable Vite output** — production assets are `dist/rtls-showcase.js` and `dist/rtls-showcase.css` (no hashed names unless PHP can resolve them).
6. **No theme system** — do not add `data-theme`, dark/light theme APIs, or visual redesigns unless asked.
7. **Multiple instances** — query and mount relative to each `.rtls-showcase` root; never assume a single global container.
8. **After JS/CSS changes** — run `npm run build` so WordPress `dist/` stays current.

## Quick orientation

```text
shortcode / preview markup
 → data-scenario="…"
 → src/main.js
 → Showcase → ScenarioManager → scenario config
 → WarehouseScene and/or SoftwareView
```

Spatial / document layer (Three-free):

```text
scenario.site
 → domain/siteAdapter.toDocument
 → Showcase.document + SpatialEngine (occupancy / placement / edits)
 → renderers still consume scenario.site
```

- Grid math: `src/spatial/` (`npm run check:spatial`)
- Document types/helpers: `src/domain/`
- Anchors/cables: `src/warehouse/scene/infrastructure.js`

When unsure where to put something, follow [`docs/file-structure.md`](docs/file-structure.md). When unsure how to write it, follow [`docs/code-conventions.md`](docs/code-conventions.md).
