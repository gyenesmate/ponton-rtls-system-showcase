# Agent brief — RTLS Showcase

WordPress/Avada plugin: thin PHP mount + Vite TypeScript/Three.js showcase.
Prefer existing docs over inventing architecture.

## If you touch…

| Area | Read |
|------|------|
| Layout / naming / where files go | [`docs/general/FILE_STRUCTURES.md`](docs/general/FILE_STRUCTURES.md) |
| Style / TS project habits | [`docs/general/CODE_CONVENTIONS.md`](docs/general/CODE_CONVENTIONS.md) |
| Product purpose / shortcode | [`docs/general/PLUGIN_DESCRIPTION.md`](docs/general/PLUGIN_DESCRIPTION.md) |
| Checks | [`docs/general/TESTING_GUIDE.md`](docs/general/TESTING_GUIDE.md) |
| Grid / occupancy / documents | [`docs/features/showcase-package/GRID_SYSTEM.md`](docs/features/showcase-package/GRID_SYSTEM.md) |
| GLB / procedural models | [`docs/features/showcase-package/MODEL_LOADING.md`](docs/features/showcase-package/MODEL_LOADING.md) |
| Lights / debug grids | [`docs/features/showcase-package/RENDERING.md`](docs/features/showcase-package/RENDERING.md) |
| Scenarios / playback | [`docs/features/SCENARIOS.md`](docs/features/SCENARIOS.md) |
| 3D view | [`docs/features/VIEW_3D.md`](docs/features/VIEW_3D.md) |
| 2D software view | [`docs/features/VIEW_2D.md`](docs/features/VIEW_2D.md) |
| Dev / WordPress package commands | [`README.md`](README.md) |

Cursor rules (always on): `typescript_guide.mdc`, `threejs_guide.mdc`, plus
`ponytail` / `development-workflow`.

## Non‑negotiables

1. Refactor, don’t rewrite — reuse package + view code unless a change is required.
2. PHP stays thin — no simulation or Three.js in PHP.
3. One frontend app — `preview.html` and WordPress both use `src/main.ts`.
4. Scenarios are config under `src/app/data/scenarios/`; mirror IDs in PHP.
5. Stable Vite output names: `rtls-showcase.js` / `.css`.
6. Package (`src/showcase-package/`) must not import from `src/app/`.
7. Multiple instances — scope to each `.rtls-showcase` root.
8. After frontend changes: `npm run build` and `npm run package:plugin`.
