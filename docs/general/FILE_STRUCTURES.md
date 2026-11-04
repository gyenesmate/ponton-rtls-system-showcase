# File structures

## Repository (high level)

```text
src/
├── main.ts                      # Vite / WordPress entry
├── app/                         # THIS PLUGIN — business logic
│   ├── app.index.ts
│   ├── showcase.controller.ts
│   ├── bootstrap.util.ts
│   ├── event-bus.util.ts
│   ├── scene-state.util.ts
│   ├── core/                    # scenarios + playback
│   ├── data/scenarios/          # declarative scenario + site configs
│   ├── shared/                  # app-only helpers (DOM, occupancy debug UI)
│   └── views/
│       ├── view-2d/             # software / livemap UI
│       └── view-3d/             # Three.js warehouse view
├── showcase-package/            # REUSABLE Three.js foundation
│   ├── grid-system/             # Three-free spatial / document engine
│   ├── model-loading/           # GLB registry + procedural fallbacks
│   ├── rendering/               # draw-only lights / debug grids
│   └── shared/                  # package cross-cutting (const, geometry, dispose, debug)
├── styles/
public/models/                   # GLB files (Vite publicDir)
wordpress/                       # installable plugin root
tests/                           # spatial + domain self-checks
scripts/                         # package, validate, export models
docs/
├── plans/
├── general/
└── features/
```

Indicators: `app/` = plugin-specific; `showcase-package/` = reusable; nested
`shared/` = cross-cutting **within that tree only**. Package must not import
from `app/`. App may import from `showcase-package/`.

## File naming

Pattern: `kebab-name.role.ts`

- Left of the role: what feature / concern the file belongs to (dashed).
- Role segment (before `.ts`): what kind of TypeScript content belongs in the file.

| Role | Put here |
|------|----------|
| `.const` | Constants, const maps, frozen catalogs |
| `.types` | Types and interfaces only |
| `.util` | Pure helpers / small modules without heavy lifecycle |
| `.controller` | Stateful orchestration / public API class |
| `.service` | Side-effectful operations (load, I/O, adapters with I/O-like work) |
| `.view` | DOM / UI surfaces |
| `.scene` | Three.js scene graph builders / scene owners |
| `.renderer` | Visual-only Three helpers (beams, overlays) |
| `.index` | Re-exports only |

Examples:

- `grid-system.controller.ts` — spatial engine API
- `grid-system.const.ts` — grid config class / defaults
- `model-loading.service.ts` — GLB load + cache
- `warehouse.scene.ts` — 3D warehouse view owner

Feature folders may contain several files that share a prefix
(`grid-system-math.util.ts`, `grid-system-footprint.util.ts`) when one role is
not enough for a single file.

## Feature-local vs shared

- Prefer **feature-local** `*.const.ts` / `*.util.ts` / `*.types.ts` next to the
  feature that owns them.
- Use that tree’s `shared/` only for helpers used by **more than one feature**
  in the same tree (`app/shared` or `showcase-package/shared`).
- Do not recreate a top-level `src/shared/` or `src/core/`.

## Where new work goes

| Change | Location |
|--------|----------|
| New scenario / site | `src/app/data/scenarios/` (+ PHP allowlist) |
| Placement / occupancy | `src/showcase-package/grid-system/` + `tests/` |
| Draw-only Three helper | `src/showcase-package/rendering/` |
| Model load / procedural | `src/showcase-package/model-loading/` |
| View lifecycle / UI | `src/app/views/` |
| Scenario resolve / playback | `src/app/core/` |
| WordPress shortcode / enqueue | `wordpress/includes/` |
| Static GLB | `public/models/<key>.glb` |
