# Code conventions

- Use strict TypeScript and ES modules. Keep public types at package boundaries.
- Preserve the existing architecture and prefer small, focused changes.
- Keep scenario data declarative; avoid scenario-specific copies of views.
- Scope DOM queries and lifecycle state to each `.rtls-showcase` root.
- Keep `src/core/grid/` free of Three.js imports and browser dependencies.
- Keep rendering draw-only; placement decisions belong to the spatial engine.
- Dispose Three.js geometries, materials, textures, controls, and renderers.
- Use meters, Y-up coordinates, and `+Z` as agent-local forward.
- Keep PHP compatible with PHP 7.4 and follow WordPress sanitizing and escaping
  practices. PHP must remain a thin integration layer.
- Keep Vite outputs stable as `rtls-showcase.js` and `rtls-showcase.css`.
- Add or update the smallest self-check that protects non-trivial grid behavior.
- Run typecheck, spatial checks, and build before handing off frontend changes.

See [Testing](../technology-guides/testing.md) for verification commands and
[WordPress deployment](../deployment/wordpress.md) for packaging.
