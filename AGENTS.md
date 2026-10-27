# Agent brief — RTLS Showcase

Read this file first when working on this repository. Detailed plugin definitions live in **`docs/`**. Prefer those docs over inventing new architecture.

## What this project is

A WordPress/Avada plugin that renders modular RTLS marketing showcases. PHP only selects a scenario and prints a container; Vite-built JavaScript owns visualization and animation.

## Required reading (in order)

| Doc | Purpose |
|-----|---------|
| [`docs/architecture/overview.md`](docs/architecture/overview.md) | Runtime and module boundaries |
| [`docs/architecture/plugin-description.md`](docs/architecture/plugin-description.md) | Product purpose and shortcode API |
| [`docs/architecture/file-structure.md`](docs/architecture/file-structure.md) | Where files live and where to put new work |
| [`docs/development/code-conventions.md`](docs/development/code-conventions.md) | Coding standards for this stack |
| [`docs/development/setup.md`](docs/development/setup.md) | Development and verification commands |

Also skim [`README.md`](README.md) for install/dev commands.

## Non‑negotiables for agents

1. **Refactor, don’t rewrite** — reuse warehouse / movement / RTLS visualization code unless a change is required.
2. **PHP stays thin** — no simulation or Three.js logic in PHP; only registration, enqueue, sanitize, markup.
3. **One frontend app** — `preview.html` and WordPress both boot via `src/main.ts` / `Showcase`.
4. **Scenarios are config** — add scenarios under `src/data/scenarios/`; each warehouse scenario owns a `site` (floor/routes/objects). Register in `index.ts` and mirror IDs in PHP `Rtls_Showcase::SCENARIOS`.
5. **Stable Vite output** — production assets are `dist/rtls-showcase.js` and `dist/rtls-showcase.css` (no hashed names unless PHP can resolve them).
6. **No theme system** — do not add `data-theme`, dark/light theme APIs, or visual redesigns unless asked.
7. **Multiple instances** — query and mount relative to each `.rtls-showcase` root; never assume a single global container.
8. **After frontend changes** — run `npm run build` and `npm run package:plugin` so `wordpress/dist/` stays current.

## Quick orientation

```text
shortcode / preview markup
 → data-scenario="…"
 → src/main.ts
 → Showcase → ScenarioManager → scenario config
 → WarehouseScene and/or SoftwareView
```

Spatial / document layer (Three-free):

```text
scenario.site
 → core/grid.toDocument
 → Showcase.document + SpatialEngine (occupancy / placement / edits)
 → renderers still consume scenario.site
```

- Grid and document logic: `src/core/grid/` (`npm run check:spatial`)
- Scenarios and sites: `src/data/scenarios/`
- 3D view: `src/app/views/view-3d/`
- WordPress zip root: `wordpress/` after `npm run package:plugin`

When unsure where to put something, follow [`docs/architecture/file-structure.md`](docs/architecture/file-structure.md). When unsure how to write it, follow [`docs/development/code-conventions.md`](docs/development/code-conventions.md).
