# Design: Docs rewrite + src restructure

Date: 2026-11-02  
Status: implemented (docs + src restructure); left uncommitted for review

## Goal

Rewrite project documentation into a simple `docs/{plans,general,features}` layout, add always-on Cursor rules for TypeScript and Three.js, thin down `README.md` / `AGENTS.md`, and restructure `src/` so reusable Three.js foundations live in `showcase-package/` while plugin business logic lives in `app/`. Rename files to `kebab-feature.role.ts` in the same pass.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Docs + rename | Same effort: docs describe reality after code move |
| Package vs app | Package = grid + models + rendering; scenario engine stays in app |
| Package layout | Feature folders under `src/showcase-package/` |
| Role suffixes | Fixed set: `.const`, `.types`, `.util`, `.controller`, `.service`, `.view` / `.scene` / `.renderer`, `.index` |
| App layout | Mini-system: `core/`, `views/`, `shared/`, `data/` |
| Feature docs | Current features only |
| Feature docs layout | App docs at `docs/features/*`; package docs under `docs/features/showcase-package/` |
| Old docs | Migrate then delete (incl. `public/models/README.md`, no `docs/README.md`) |
| Cursor rules | `typescript_guide.mdc` + `threejs_guide.mdc`, `alwaysApply: true` |
| Execution | Spec → phased implementation |

## Source layout

```text
src/
  main.ts
  app/                          # this plugin’s business logic
    core/                       # scenarios, playback, domain orchestration
    views/
      view-2d/
      view-3d/
    shared/                     # app-only cross-cutting helpers
    data/
      scenarios/                # declarative scenario + site configs
  showcase-package/             # reusable Three.js foundation (not published yet)
    grid-system/
    model-loading/
    rendering/
    shared/                     # package-only cross-cutting helpers
```

### Boundaries

- Package owns grid system, model loading, and rendering only.
- App owns scenarios/playback, views, scenario data, and showcase bootstrap.
- No top-level `src/shared/` or `src/core/` after the move.
- Package must not import from `app/`. App may import from `showcase-package/`.
- Publishing `showcase-package` as an npm package is out of scope (informational only).

### File naming

Pattern: `kebab-feature.role.ts`

| Role | Contents |
|------|----------|
| `.const` | Constants / const maps |
| `.types` | Types and interfaces |
| `.util` | Pure helpers |
| `.controller` | Stateful orchestration / public API |
| `.service` | Side-effectful operations (load, I/O) |
| `.view` / `.scene` / `.renderer` | UI or Three.js surfaces |
| `.index` | Re-exports only |

If a file’s role is ambiguous during rename, prefer the smallest honest role (`.util` / `.types`) over inventing new suffixes.

### Move map (mechanical)

| From | To |
|------|----|
| `src/core/grid/` | `src/showcase-package/grid-system/` |
| `src/core/models/` | `src/showcase-package/model-loading/` |
| `src/core/rendering/` | `src/showcase-package/rendering/` |
| `src/core/scenarios/` | `src/app/core/` (scenarios / playback) |
| `src/data/scenarios/` | `src/app/data/scenarios/` |
| `src/app/views/` | stay under `src/app/views/`, rename to role suffixes where it fits |
| `src/shared/` | split by caller into `app/shared/` vs `showcase-package/shared/` |

Exact per-file role names are chosen during implementation; behavior must not change.

## Documentation layout

```text
docs/
  plans/                         # existing plans + this design
  general/
    PLUGIN_DESCRIPTION.md        # what / why / functionalities (moderately detailed)
    FILE_STRUCTURES.md           # tree indicators, naming, what belongs in each role file
    CODE_CONVENTIONS.md          # distilled style from ts.dev/style (no verbatim copy)
    TESTING_GUIDE.md             # how checks/tests work in this repo
  features/
    SCENARIOS.md                 # app: scenario resolve + playback
    VIEW_3D.md
    VIEW_2D.md
    showcase-package/
      GRID_SYSTEM.md
      MODEL_LOADING.md           # absorbs public/models/README content
      RENDERING.md
```

### README.md

Thin only:

- Short plugin description
- Prerequisites
- Development (`preview.html` / Vite)
- Deployment (build, `package:plugin`, zip/upload, shortcode)

No separate Vite or WordPress doc files.

### AGENTS.md

Thin AI entrypoint:

- 2–3 lines on what the project is
- “If you touch X, read Y” pointers into `docs/general` and `docs/features`
- Short non‑negotiables list
- No long architecture essay

### Cursor rules

- `.cursor/rules/typescript_guide.mdc` — modern TypeScript usage (handbook + ts.dev/style + current best practice), distilled
- `.cursor/rules/threejs_guide.mdc` — Three.js practice (dispose, draw-only rendering, performance), distilled from best-practice sources

Both `alwaysApply: true`. Keep concise and actionable (Cursor rule size guidance).

### Doc ownership split

| Artifact | Owns |
|----------|------|
| `CODE_CONVENTIONS.md` | Project syntax/style and how we write TS here |
| `FILE_STRUCTURES.md` | Directory tree and `feature.role.ts` roles |
| `*.mdc` guides | Language / engine best practices for the agent |
| Feature `*.md` | Behavior and boundaries of one feature area |

### Delete after migrate

- `docs/architecture/`
- `docs/development/`
- `docs/deployment/`
- `docs/technology-guides/`
- `docs/README.md`
- `docs/features/spatial-grid.md` (replaced by `showcase-package/GRID_SYSTEM.md`)
- `public/models/README.md` (content folded into `MODEL_LOADING.md`)

Descriptive markdown lives only under `docs/` (plus root `README.md` / `AGENTS.md`).

## Execution phases

1. This design file under `docs/plans/` (no git commit unless explicitly requested).
2. Add Cursor rules.
3. Restructure/rename `src/` and fix imports (tests/scripts that path into old locations included).
4. Rewrite `README.md`, `AGENTS.md`, `docs/general/*`, `docs/features/*` against the new tree.
5. Delete old doc paths.
6. Verify: `npm run check:spatial`, `npm run typecheck`, `npm run build` (and packaging scripts if paths require it).

## Out of scope

- Publishing `showcase-package` as a real npm package
- Scenario builder or other new product features
- PHP / WordPress directory rename
- Git commit, push, or history changes without explicit user request

## Success criteria

- `src/` matches the layout and naming rules above
- Docs tree is only `plans/`, `general/`, `features/`
- README covers Prerequisites / Development / Deployment only (plus thin blurb)
- AGENTS.md is a short router into docs
- Always-on TS and Three.js Cursor rules exist
- Spatial checks, typecheck, and build pass with unchanged product behavior
