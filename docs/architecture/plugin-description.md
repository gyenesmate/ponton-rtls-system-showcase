# Plugin description

RTLS Showcase is a WordPress plugin for embedding interactive RTLS marketing
demonstrations. It is a showcase, not a production RTLS client.

## Runtime

WordPress emits a `.rtls-showcase` element with `data-scenario` and
`data-quality`. `src/main.ts` mounts one `Showcase` per element, resolves the
scenario, creates its spatial document, and mounts the requested views.

PHP stays limited to plugin registration, asset loading, input validation, and
markup. Local preview and WordPress use the same frontend application.

## Shortcode

```text
[rtls_showcase scenario="developer"]
```

Optional attributes are `height`, `min_height`, `quality` (`high`, `medium`, or
`low`), and `class`. Unknown scenarios fall back to `developer`.

The current built-in `developer` scenario is a warehouse shell used for spatial
grid and rendering development. Scenario configuration lives in
`src/data/scenarios/`; scenario IDs must also be allowed by
`wordpress/includes/class-rtls-showcase.php`.

Production assets have stable names:

```text
dist/rtls-showcase.js
dist/rtls-showcase.css
```
