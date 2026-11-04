# View 2D (software view)

App-owned marketing UI that mimics an RTLS operator surface (livemap-first).

## Location

`src/app/views/view-2d/`

- `software.view.ts` — shell
- `livemap.view.ts`, `sidebar.view.ts`, panels, toasts

## Behavior

- Shares showcase `EventBus` / `SceneState` with the 3D view so markers and zone
  events stay in sync.
- DOM helpers come from `src/app/shared/dom.util.ts`.

## Rules

- Stay presentation-focused; spatial truth remains in the grid-system package.
- Scope all queries to the showcase root element.
