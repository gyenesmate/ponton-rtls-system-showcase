# Scenarios & playback

App-owned feature: resolve named showcase setups and drive playback timing.

## Location

- Engine: `src/app/core/` (`scenarios.controller.ts`, `playback.controller.ts`,
  `scenarios.types.ts`)
- Data: `src/app/data/scenarios/` (configs + `sites/`)

## Behavior

- `ScenarioManager.resolve(id)` picks a registered scenario or falls back to
  `developer`.
- Each warehouse scenario owns a `site` (floor, routes, objects, zones, …).
- `PlaybackController` owns play/pause/speed-style options from scenario config.
- Showcase builds a spatial document from the site via the grid-system package,
  then mounts views.

## Rules

- Keep data declarative; do not embed view or Three.js code in scenario files.
- New scenario IDs must be registered in `src/app/data/scenarios/index.ts` and
  allowlisted in WordPress PHP.
