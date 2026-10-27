# Three.js

Three.js code belongs in `src/core/rendering/`, `src/core/models/`, or the 3D
view under `src/app/views/view-3d/`. Spatial and document code must remain
Three-free.

World units are meters, Y is up, and agent-local forward is +Z. Site and scenario
data use plain values rather than Three.js objects.

Each showcase owns its scene resources. On teardown, stop animation, disconnect
observers, and dispose scene objects, controls, model caches, and the renderer.
Respect quality presets for frame rate, pixel ratio, and shadows.
