# Testing

The project uses lightweight TypeScript self-checks for Three-free spatial and
document behavior.

```bash
npm run check:spatial
npm run typecheck
npm run build
```

`check:spatial` runs `tests/spatial/runAll.ts` through `tsx`. Spatial checks live
under `tests/spatial/`; site/document adapter checks live under `tests/domain/`.
Failures set a non-zero process exit code.

Add focused assertions beside the existing check for grid math, footprint
rasterization, occupancy, placement, edit behavior, or site conversion.
