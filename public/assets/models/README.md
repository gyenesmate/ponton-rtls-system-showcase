# Warehouse GLB models

Binary glTF files as `<key>.glb`. Vite copies this folder into `dist/assets/models/` on build.

## Shipped keys (from procedural factories)

| File | Source |
|------|--------|
| `forklift.glb` | `src/warehouse/models/forklift.js` |
| `worker.glb` | `src/warehouse/models/worker.js` |
| `amr.glb` | `src/warehouse/models/amr.js` (+ cargo) |
| `container.glb` | `src/warehouse/models/container.js` |

Regenerate after mesh edits:

```bash
npm run export:models
```

These are schematic marketing meshes (same look as the procedural builders), not photoreal art. Replace any file with a Blender export when you want higher detail — keep the filename/key.

## Conventions

| Rule | Value |
|------|-------|
| Format | `.glb` (glTF 2.0 binary) |
| Units | 1 unit = 1 meter (export at scale 1) |
| Up | +Y |
| Forward | +Z (matches RouteManager yaw) |
| Pivot | Ground contact at origin; centered on XZ |
| Runtime scale | Host applies `MODEL_DISPLAY_SCALE` (forklift 0.9, worker 0.85, amr 0.86) |
| Named nodes | `leftArm` / `rightArm` / `leftLeg` / `rightLeg` (worker), `cargo` (amr) |
| Load policy | GLB first; procedural factory only if load fails |

## Usage in scenarios

```js
{ id: 'forklift-a', type: 'forklift', model: 'forklift', routeId: '…' }
```

Omit `model` (or if the file fails to load) → procedural factory is used.
