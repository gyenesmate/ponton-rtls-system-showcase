# Grid system

Three-free spatial engine: cells, footprints, occupancy, placement, and warehouse
documents. Independent of Three.js; views consume its document and
`SpatialEngine` results.

## Location

`src/showcase-package/grid-system/`

Notable roles:

- `grid-system.controller.ts` — `SpatialEngine`
- `grid-system.const.ts` — `GridConfig`
- `grid-system.types.ts` — document / layer types
- `grid-system-*.util.ts` — math, footprint, occupancy, document helpers
- `grid-system-site.service.ts` — site ↔ document conversion
- `grid-system.index.ts` — public exports

## Behavior

- Floor grid is primary; walls participate in the same document model.
- Paths, zones, and static objects are entities; movers occupy cells on enter.
- Zones are not for collision — project-specific semantics only.
- Cell size should keep non-zone entities from visually overlapping when they
  share a cell budget (entities ≈ one cell).

## Checks

`npm run check:spatial` — see `docs/general/TESTING_GUIDE.md`.
