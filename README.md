# RTLS Showcase for WordPress

Vite-built TypeScript and Three.js RTLS showcase for WordPress/Avada. WordPress
selects a scenario; the frontend owns visualization and animation.

## Prerequisites

- Node.js 20 or newer and npm
- A modern WebGL browser
- WordPress 6.5+ and PHP 7.4+ for plugin use

## Development

```bash
npm install
npm run dev
```

The dev server opens `preview.html` using the same application WordPress loads.

Verification and production build:

```bash
npm run check:spatial
npm run typecheck
npm run build
```

The build writes stable assets to `dist/rtls-showcase.js` and
`dist/rtls-showcase.css`.

## WordPress package

```bash
npm run build
npm run package:plugin
npm run validate
```

`package:plugin` copies the current build into `wordpress/dist/`.

1. Zip the `wordpress/` folder, with `rtls-showcase.php` at the zip root.
2. In WordPress Admin, choose **Plugins → Add New Plugin → Upload Plugin**.
3. Upload, install, and activate **RTLS Showcase**.
4. Add the shortcode to a page:

```text
[rtls_showcase scenario="developer"]
```

Optional attributes:

```text
[rtls_showcase scenario="developer" height="620px" min_height="420px" quality="medium"]
```

## Architecture

`src/main.ts` mounts each `.rtls-showcase` container. `src/app/` orchestrates
views, `src/core/grid/` owns Three-free spatial behavior, and
`src/data/scenarios/` holds declarative scenario data. PHP under `wordpress/`
remains a thin integration layer.

See the [documentation index](docs/README.md) for architecture, development,
deployment, technology, and feature guides.
