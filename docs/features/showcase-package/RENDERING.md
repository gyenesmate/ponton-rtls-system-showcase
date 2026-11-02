# Rendering

Draw-only Three.js helpers shared by views. No placement or scenario logic.

## Location

`src/showcase-package/rendering/`

- `rendering-lights.util.ts`
- `rendering-debug-grid.util.ts`
- `rendering.index.ts`

Package shared helpers used with rendering:

- `shared-dispose.util.ts`
- `shared-geometry.util.ts`
- `shared.const.ts` (palette / quality presets)

## Rules

- Consume poses and documents from callers; do not validate placement here.
- Dispose geometries, materials, and helpers with the owning scene.
- Debug grids are opt-in visualization only.
