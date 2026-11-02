# RTLS Showcase for WordPress

Vite-built TypeScript / Three.js plugin that embeds interactive RTLS marketing
showcases. WordPress selects a scenario; the frontend owns visualization and
animation.

## Prerequisites

- Node.js 20+ and npm
- A modern WebGL browser
- WordPress 6.5+ and PHP 7.4+ for plugin use

## Development

```bash
npm install
npm run dev
```

The Vite dev server opens `preview.html`, which boots the same `src/main.ts`
application WordPress loads.

Verification:

```bash
npm run check:spatial
npm run typecheck
npm run build
```

Stable build outputs: `dist/rtls-showcase.js`, `dist/rtls-showcase.css`.

## Deployment

```bash
npm run build
npm run package:plugin
npm run validate
```

`package:plugin` copies the build into `wordpress/dist/`.

1. Zip the `wordpress/` folder so `rtls-showcase.php` is at the zip root.
2. In WordPress Admin: **Plugins → Add New Plugin → Upload Plugin**.
3. Install and activate **RTLS Showcase**.
4. Add a shortcode:

```text
[rtls_showcase scenario="developer"]
```

Optional attributes:

```text
[rtls_showcase scenario="developer" height="620px" min_height="420px" quality="medium"]
```

Rebuild and repackage after frontend changes. Do not zip the repository root.

Agent / architecture docs: [`AGENTS.md`](AGENTS.md) and [`docs/`](docs/).
