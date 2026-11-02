# Docs + src restructure Implementation Plan

> **For agentic workers:** Execute task-by-task. Skip git commits unless the user explicitly asks. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/` into `app/` + `showcase-package/`, rename to `feature.role.ts`, rewrite docs/rules per the design spec.

**Architecture:** Package owns grid/models/rendering (+ shared used by package). App owns scenarios/views/data (+ app-only shared). Docs become `docs/{plans,general,features}` only.

**Tech Stack:** TypeScript, Three.js, Vite, WordPress plugin shell, tsx self-checks.

**Spec:** `docs/plans/2026-11-02-docs-and-src-restructure-design.md`

## Global Constraints

- No git commit/stage without explicit user request
- Package must not import from `app/`
- Behavior unchanged; mechanical move/rename
- Descriptive markdown only under `docs/` (+ root README/AGENTS)
- Temporary AI files only under `.cursor/ai-workspace/`

---

### Task 1: Cursor rules

**Files:**
- Create: `.cursor/rules/typescript_guide.mdc`
- Create: `.cursor/rules/threejs_guide.mdc`

- [x] Write distilled alwaysApply TS + Three.js guides (no verbatim copy of sources)
- [x] Keep each rule concise and actionable

### Task 2: Move showcase-package features

**Files:** move `src/core/grid|models|rendering` → `src/showcase-package/{grid-system,model-loading,rendering}` with role renames; add package `shared/` for cross-cutting used by package (and importable by app).

- [x] Create feature folders and rename files to role suffixes
- [x] Place `assetUrl`, `constants`, `geometry`, `dispose` under package shared (used by package and/or Three foundation)
- [x] Export via feature `.index.ts` files
- [x] Remove empty `src/core/` leftovers for those areas

### Task 3: Restructure app

**Files:** move scenarios → `app/core/`, data → `app/data/`, app-only shared (`dom`, `animation`, `devDebugger`), rename views to role suffixes where honest.

- [x] Move scenario engine + data
- [x] Split shared; ensure package does not import app
- [x] Update all imports across src/tests/scripts
- [x] Delete old `src/shared`, `src/data`, `src/core` if empty

### Task 4: Verify build

- [x] `npm run check:spatial`
- [x] `npm run typecheck`
- [x] `npm run build`

### Task 5: Docs + README + AGENTS

**Files:** create `docs/general/*`, `docs/features/*`, rewrite README/AGENTS; delete old doc trees and `public/models/README.md`.

- [x] Write general + feature docs against new tree
- [x] Thin README (Prerequisites / Development / Deployment)
- [x] Thin AGENTS router
- [x] Delete migrated-away docs
- [x] Update design status if needed

### Task 6: Final verify + cleanup

- [x] Re-run check:spatial, typecheck, build
- [x] Ensure docs tree is only plans/general/features
- [x] Clean `.cursor/ai-workspace/` temp artifacts if any
