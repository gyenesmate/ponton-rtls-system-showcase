# Architecture overview

RTLS Showcase is one Vite application embedded by a thin WordPress plugin. Both
`preview.html` and WordPress mount the same `src/main.ts` entry point.

```text
container markup
  → src/main.ts
  → app/showcase.ts
  → core/scenarios + data/scenarios
  → app/views/view-3d and app/views/view-2d
```

## Module boundaries

- `src/app/` owns lifecycle, orchestration, shared view state, and the 2D/3D views.
- `src/core/grid/` owns Three-free documents, coordinates, occupancy, and placement.
- `src/core/models/` owns GLB loading, model metadata, scale, and procedural fallbacks.
- `src/core/rendering/` contains draw-only Three.js helpers.
- `src/core/scenarios/` resolves scenarios and controls playback.
- `src/data/scenarios/` contains declarative scenario and site data.
- `src/shared/` contains small cross-cutting utilities.
- `wordpress/` is the installable plugin root; PHP only validates shortcode input,
  enqueues assets, and prints the mount element.

Grid code must not import Three.js. Rendering must not decide whether placement is
valid; it consumes the document and spatial engine owned by the application.
