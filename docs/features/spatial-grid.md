# Spatial grid

The spatial grid converts warehouse coordinates into cells, rasterizes entity
footprints, tracks sparse occupancy by layer, and validates placement. It also
provides incremental add, move, and remove operations over a warehouse document.

Implementation lives in `src/core/grid/`. The package is independent of Three.js;
views consume its document and `SpatialEngine` results.

Coverage is provided by the checks under `tests/spatial/` and `tests/domain/`.
Run them with `npm run check:spatial`.
