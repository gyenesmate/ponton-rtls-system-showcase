# View 3D

App-owned Three.js warehouse presentation for a showcase root.

## Location

`src/app/views/view-3d/`

- `warehouse.scene.ts` — scene owner (renderer, controls, frame loop)
- `*.controller.ts` — routes, intersections, zones, tracking tags
- `*.renderer.ts` — visual-only overlays (e.g. detection beams)
- `scene/*.scene.ts` — shell, machines, routes, zones, tracked objects, infrastructure

## Behavior

- Consumes scenario config + spatial results; does not own placement validity.
- Loads models through `showcase-package/model-loading`.
- Uses `showcase-package/rendering` for lights and optional debug grids.
- Disposes GPU resources when the showcase tears down.

## Rules

- Draw-only: no collision / occupancy decisions here.
- Multiple instances: never assume a single global renderer or canvas.
