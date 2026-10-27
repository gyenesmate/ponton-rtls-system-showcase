# RTLS Showcase for WordPress

Vite-built RTLS showcase engine for Avada/WordPress. WordPress only selects a scenario; the frontend resolves and renders it.

## Development

```bash
npm install
npm run dev
```

Opens `preview.html` with the same showcase engine WordPress uses.

```bash
npm run build
npm run check:spatial
```

`check:spatial` runs Three-free grid / occupancy / placement / site-adapter self-checks.

Writes stable production assets to:

```text
dist/rtls-showcase.js
dist/rtls-showcase.css
```

## WordPress installation

1. Run `npm run build` (or use a committed `dist/`).
2. Install this folder as a WordPress plugin and activate **RTLS Showcase**.
3. Add a shortcode:

```text
[rtls_showcase scenario="uwb-positioning"]
```

Other scenarios:

```text
[rtls_showcase scenario="alert-zone"]
[rtls_showcase scenario="asset-tracking"]
[rtls_showcase scenario="software-overview"]
[rtls_showcase scenario="full-system"]
```

Optional attributes:

```text
[rtls_showcase scenario="full-system" height="620px" min_height="420px" quality="medium"]
```

Markup produced:

```html
<div
  class="rtls-showcase"
  data-scenario="alert-zone"
  data-quality="medium">
</div>
```

`[rtls_warehouse]` remains as a legacy alias for the UWB positioning scenario.

## Architecture

```text
WordPress shortcode / preview.html
        │
        ▼
data-scenario="…"
        │
        ▼
src/main.js → Showcase → ScenarioManager → scenario config
        │
        ├── WarehouseScene  (existing Three.js warehouse animation)
        └── SoftwareView    (simplified operator UI placeholder)
```

Scenario configs live in `src/scenarios/`. PHP stays thin: registration, enqueue, shortcode validation, and container markup.

## Quality modes

- `high`: up to 60 FPS, DPR capped at 2, 2048 px shadows
- `medium`: up to 45 FPS, DPR capped at 1.5, 1024 px shadows
- `low`: up to 30 FPS, DPR capped at 1, shadows off
