# TypeScript

Frontend source is TypeScript under `src/`, with strict checking configured in
`tsconfig.json`. Use explicit types at module boundaries and let local values
infer where the result is clear.

Run:

```bash
npm run typecheck
```

Imports inside source may include `.ts` extensions where existing modules do.
Tests are also TypeScript and are included in the project typecheck.
