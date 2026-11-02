# Model loading

GLB registry, display scale, and procedural mesh fallbacks for warehouse actors.

## Location

`src/showcase-package/model-loading/`

- `model-loading.service.ts` — `ModelRegistry` (load, cache, clone)
- `model-loading.const.ts` — catalog
- `model-scale.util.ts` — display scale factors
- `model-procedural-*.util.ts` — schematic fallback meshes
- Static files: `public/models/<key>.glb` (Vite copies to `dist/models/`)

## Shipped keys

| File | Procedural source |
|------|-------------------|
| `forklift.glb` | `model-procedural-forklift.util.ts` |
| `worker.glb` | `model-procedural-worker.util.ts` |
| `amr.glb` | `model-procedural-amr.util.ts` |
| `container.glb` | `model-procedural-container.util.ts` |

Regenerate after mesh edits: `npm run export:models`.

## Conventions

| Rule | Value |
|------|-------|
| Format | `.glb` (glTF 2.0 binary) |
| Units | 1 unit = 1 meter |
| Up | +Y |
| Forward | +Z |
| Pivot | Ground at origin; centered on XZ |
| Runtime scale | `MODEL_DISPLAY_SCALE` applied by host |
| Load policy | GLB first; procedural only on failure |

Scenario objects reference keys via `model: 'forklift'` (etc.). Omit `model` or
fail the load → procedural factory.
