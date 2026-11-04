# Testing guide

This repo uses lightweight TypeScript self-checks (not a heavy test framework)
for Three-free spatial and document behavior.

## Commands

```bash
npm run check:spatial   # grid / footprint / occupancy / placement / edits / site adapter
npm run typecheck       # tsc --noEmit
npm run build           # Vite production build
npm run validate        # plugin package sanity (after package:plugin)
```

`check:spatial` runs `tests/spatial/runAll.ts` via `tsx`. Failures exit non-zero.

## Layout

| Path | Covers |
|------|--------|
| `tests/spatial/` | Grid math, footprint rasterization, occupancy, placement, edit API |
| `tests/domain/` | Site ↔ document adapter behavior (pulled in by the spatial runner) |

## What to add

- Add focused assertions next to the existing check for the behavior you change.
- Prefer one small self-check that fails if the logic breaks over broad fixtures.
- Do not put Three.js scene tests in the spatial suite; keep that suite free of
  WebGL where possible.
- After moving modules, import from `src/showcase-package/...` or
  `src/app/data/...` — never revive `src/core/` paths.
