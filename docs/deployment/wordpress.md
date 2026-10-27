# WordPress deployment

## Build the plugin

```bash
npm install
npm run build
npm run package:plugin
npm run validate
```

`package:plugin` replaces `wordpress/dist/` with the current Vite build. Zip the
`wordpress/` folder so `rtls-showcase.php` is at the root of the zip.

## Install

1. In WordPress Admin, open **Plugins → Add New Plugin → Upload Plugin**.
2. Upload the zip, install it, and activate **RTLS Showcase**.
3. Add the shortcode to a page:

```text
[rtls_showcase scenario="developer"]
```

Optional sizing and quality:

```text
[rtls_showcase scenario="developer" height="620px" min_height="420px" quality="medium"]
```

Rebuild and repackage after frontend changes. Do not zip the repository root or
use the root `dist/` directly as a WordPress plugin.
