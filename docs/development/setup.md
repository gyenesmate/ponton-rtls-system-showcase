# Development setup

## Prerequisites

- Node.js 20 or newer
- npm
- A modern browser with WebGL
- WordPress 6.5+ and PHP 7.4+ only when testing the plugin

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run check:spatial
npm run build
```

`npm run dev` opens `preview.html` with hot reload. `npm run build` writes stable
assets to `dist/`. Spatial checks run directly from `tests/` with `tsx`.

Additional scripts:

```bash
npm run preview
npm run export:models
npm run package:plugin
npm run validate
```

Use `package:plugin` after a successful build to refresh `wordpress/dist/`.
