# Code conventions

Distilled project style (aligned with common TypeScript style guides; not a
verbatim copy). Cursor also loads `.cursor/rules/typescript_guide.mdc`.

## Language

- Strict TypeScript, ES modules only.
- Prefer `unknown` over `any`; narrow before use.
- Prefer `import type` for type-only imports.
- Prefer named exports; keep public types at feature / package boundaries.
- Prefer `satisfies` / `as const` when config objects must stay narrow and checked.
- Prefer discriminated unions over boolean flag piles.

## Identifiers

| Form | Use for |
|------|---------|
| `UpperCamelCase` | Classes, types, interfaces, enums |
| `lowerCamelCase` | Variables, functions, methods, parameters |
| `CONSTANT_CASE` | True constants and enum members |

- Do not prefix interfaces with `I`.
- Do not use leading/trailing `_` on identifiers.
- Names should not restate the type (`users`, not `userList: User[]`).

## Architecture habits

- Prefer small, focused changes; reuse existing helpers.
- Keep scenario / site data declarative — no scenario-specific forks of views.
- Scope DOM queries and lifecycle to each `.rtls-showcase` root.
- `showcase-package/grid-system` stays free of Three.js and browser DOM.
- Rendering stays draw-only; placement belongs to the spatial engine.
- Dispose Three.js GPU resources on teardown.
- World units: meters, Y-up, agent-local forward `+Z`.
- PHP stays thin (7.4+ compatible): sanitize/escape only; no simulation.
- Vite outputs stay stable: `rtls-showcase.js` / `rtls-showcase.css`.

## File roles

Follow `FILE_STRUCTURES.md` for `feature.role.ts` naming and what belongs in
`.const` / `.types` / `.controller` / `.service` / `.view` / `.scene` files.

## Checks

Non-trivial spatial logic leaves a small self-check under `tests/`. Before
handoff: `npm run check:spatial`, `npm run typecheck`, `npm run build`.
