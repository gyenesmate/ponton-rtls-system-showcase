# File structure

```text
src/
  main.ts
  app/                    application lifecycle and views
  core/
    grid/                 Three-free spatial and document logic
    models/               GLB registry and procedural model fallbacks
    rendering/            draw-only Three.js helpers
    scenarios/            scenario resolution and playback
  data/scenarios/         declarative scenario and site data
  shared/                 cross-cutting utilities
  styles/
tests/
  spatial/                grid, footprint, occupancy, placement, edit checks
  domain/                 site/document adapter checks
public/models/            GLB files copied by Vite
wordpress/                installable plugin root
docs/                     architecture, development, deployment, guides, plans
scripts/                  packaging, validation, model export
dist/                     Vite production output
```

## Where changes belong

- New scenario: `src/data/scenarios/`, its registry, and the PHP scenario allowlist.
- Placement or occupancy behavior: `src/core/grid/` plus a check under `tests/`.
- Three.js drawing helper: `src/core/rendering/`.
- View lifecycle or interaction: `src/app/views/`.
- Model loading or procedural model: `src/core/models/`.
- WordPress shortcode or enqueue behavior: `wordpress/includes/`.
- Static GLB: `public/models/<key>.glb`.

Do not add simulation logic to PHP, placement rules to rendering, or a second
frontend entry for WordPress.
