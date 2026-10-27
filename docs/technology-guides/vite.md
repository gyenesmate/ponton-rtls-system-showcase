# Vite

Vite serves `preview.html` during development and bundles `src/main.ts` for
WordPress. CSS is imported by the application entry.

```bash
npm run dev
npm run build
npm run preview
```

Production filenames are intentionally stable:

```text
dist/rtls-showcase.js
dist/rtls-showcase.css
```

Files under `public/` are copied to `dist/`; GLB models therefore resolve from
`models/<key>.glb`. After building, run `npm run package:plugin` to refresh the
copy under `wordpress/dist/`.
