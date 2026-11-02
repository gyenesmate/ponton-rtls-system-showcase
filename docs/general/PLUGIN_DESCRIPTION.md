# Plugin description

RTLS Showcase is a WordPress/Avada plugin that embeds interactive **marketing
demonstrations** of real-time location system (RTLS) concepts. It is a showcase,
not a production RTLS client or tracking backend.

## Why it exists

Sales and product pages need a vivid, controllable warehouse scene: moving
assets, zones, routes, and a companion “software” UI. The plugin ships one
Vite-built frontend that WordPress mounts via shortcode, so demos stay versioned
with the site and do not depend on an external 3D host.

## What it does

- Resolves a named **scenario** (layout, objects, routes, playback options).
- Builds a Three-free **warehouse document** and spatial engine (occupancy /
  placement) from that scenario’s site.
- Renders a **3D warehouse view** (Three.js) and an optional **2D software view**
  (operator-style livemap UI).
- Loads **GLB models** with procedural fallbacks when assets are missing.
- Supports multiple `.rtls-showcase` roots on one page; each instance is scoped
  to its own container.

## Runtime shape

```text
shortcode / preview markup
  → data-scenario / data-quality
  → src/main.ts
  → app Showcase
  → scenarios + site data
  → spatial document (showcase-package grid-system)
  → view-3d and/or view-2d
```

PHP only registers the plugin, enqueues stable Vite assets, sanitizes shortcode
attributes, and prints the mount element. Local `preview.html` and WordPress
boot the same `src/main.ts` application.

## Shortcode

```text
[rtls_showcase scenario="developer"]
```

Optional attributes: `height`, `min_height`, `quality` (`high` | `medium` |
`low`), `class`. Unknown scenario IDs fall back to `developer`.

Scenario IDs in frontend data must also be allowlisted in
`wordpress/includes/class-rtls-showcase.php`.

## Production assets

Stable names (no content hashes), so PHP can enqueue them directly:

```text
dist/rtls-showcase.js
dist/rtls-showcase.css
```

After frontend changes: `npm run build` then `npm run package:plugin` so
`wordpress/dist/` stays current.

## Code split (intent)

| Area | Role |
|------|------|
| `src/app/` | Plugin business logic: scenarios, playback, views, scenario data |
| `src/showcase-package/` | Reusable foundation: grid system, model loading, rendering |

Publishing `showcase-package` as a standalone npm package is a future option;
today it lives in-repo.
