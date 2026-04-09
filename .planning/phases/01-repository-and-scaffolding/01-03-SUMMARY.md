---
phase: 01-repository-and-scaffolding
plan: 03
subsystem: config
tags: [sdk, cli, templates, typescript, bun]
requires:
  - 01-01
  - 01-02
provides:
  - Typed SDK config and tour contracts for Phase 1
  - CLI config loading with default merging and absolute path normalization
  - Self-contained starter template assets for local smoke demos
affects: [phase-01, config, cli, scaffolding, starter-template]
tech-stack:
  added: [bun-test, node-types]
  patterns: [identity-config-helper, centralized-default-merging, local-static-starter]
key-files:
  created:
    - packages/sdk/src/config.ts
    - packages/sdk/src/config.test.ts
    - packages/sdk/src/tour.ts
    - packages/cli/src/config/load-config.ts
    - packages/cli/src/config/load-config.test.ts
    - packages/create-demohunter/templates/starter/demohunter.config.ts
    - packages/create-demohunter/templates/starter/demos/sample.tour.ts
    - packages/create-demohunter/templates/starter/demos/sample-site/index.html
    - bun.lock
  modified:
    - packages/sdk/src/index.ts
    - packages/sdk/package.json
    - packages/sdk/tsconfig.json
    - packages/cli/package.json
    - packages/cli/tsconfig.json
    - tsconfig.base.json
    - package.json
key-decisions:
  - "Keep defineConfig and defineTour as identity helpers, with all default merging living in the CLI loader."
  - "Treat config.outputDir as the single absolute output root and normalize cacheDir alongside it during load."
  - "Make the starter scaffold entirely local and disposable so init works in a fresh repo without unresolved internal imports."
patterns-established:
  - "Workspace package imports use local package contracts instead of cross-package source imports."
  - "Package builds exclude Bun test files, while source-level tests still prove the authored config and loader behavior."
requirements-completed: [INIT-03]
duration: 19 min
completed: 2026-04-10
---

# Phase 1 Plan 3: Repository and Scaffolding Summary

**Typed config defaults, CLI loading, and a self-contained local starter template**

## Performance

- **Duration:** 19 min
- **Started:** 2026-04-10T08:40:00Z
- **Completed:** 2026-04-10T08:59:00Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Added the Phase 1 SDK config surface, default constants, and identity-only `defineConfig` / `defineTour` helpers.
- Implemented `loadConfig(cwd)` with exact missing-file errors, field-by-field default merging, and absolute `outputDir` / `cacheDir` normalization.
- Added a bundled starter config, smoke-path tour, and local HTML page that can run in a fresh repo with no `@demohunter/*` imports.
- Tightened the workspace package boundary so the CLI consumes `@demohunter/sdk` through the package contract and the full TypeScript build passes cleanly.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the typed config contract and explicitly make `defineConfig` an identity helper** - `b49258b` (feat)
2. **Task 2: Implement the CLI config loader with default merging and a single `outputDir` meaning** - `602c8c1` (feat)
3. **Task 3: Add self-contained starter template files per D-04 through D-08** - `77c64f7` (feat)

## Files Created/Modified

- `packages/sdk/src/config.ts` - Defines the typed Phase 1 config contract and concrete defaults.
- `packages/sdk/src/config.test.ts` - Proves `defineConfig` stays identity-only and the SDK entrypoint re-exports the required helpers/constants.
- `packages/sdk/src/tour.ts` - Defines the minimal typed tour surface for the starter flow.
- `packages/sdk/src/index.ts` - Re-exports config and tour helpers from the public SDK entrypoint.
- `packages/cli/src/config/load-config.ts` - Loads `demohunter.config.ts`, merges defaults centrally, and normalizes project-relative paths.
- `packages/cli/src/config/load-config.test.ts` - Covers default merging, partial nested overrides, missing-config errors, and starter-file loading.
- `packages/create-demohunter/templates/starter/demohunter.config.ts` - Minimal disposable starter config pointing to the bundled sample page.
- `packages/create-demohunter/templates/starter/demos/sample.tour.ts` - Local smoke-path starter tour under `demos/`.
- `packages/create-demohunter/templates/starter/demos/sample-site/index.html` - Bundled static page with the selectors and text required by the smoke flow.
- `packages/sdk/package.json` - Adds a local Bun-aware export condition so workspace consumers can resolve the SDK contract before publish-time builds.
- `packages/sdk/tsconfig.json` - Excludes Bun tests from package build output.
- `packages/cli/package.json` - Declares the CLI's workspace dependency on `@demohunter/sdk`.
- `packages/cli/tsconfig.json` - Adds the SDK project reference and excludes Bun tests from emitted package output.
- `tsconfig.base.json` - Adds Bun-aware resolution and Node types for workspace package builds.
- `package.json` / `bun.lock` - Pins `@types/node` so the CLI package builds cleanly under `tsc -b`.

## Decisions Made

- Kept starter files as plain-object defaults instead of importing SDK helpers so `demohunter init` output stays fresh-repo runnable.
- Centralized default merging in the CLI loader so authored config files remain explicit and easy to reason about.
- Excluded `.test.ts` files from package builds rather than broadening package emit scope, which keeps the dist contract source-only.

## Deviations from Plan

- Extended the plan slightly to adjust package metadata and tsconfig settings after verification exposed a broken build boundary between `demohunter` and `@demohunter/sdk`.
- Added `@types/node` at the workspace root so the planned `tsc -b` verification can compile the CLI's Node APIs without hidden ambient dependencies.

## Issues Encountered

- The initial loader implementation imported SDK source files directly, which broke the composite package build because the CLI project was pulling files from outside its `rootDir`.
- Package builds were also compiling Bun test files, which introduced `bun:test` type errors into the `tsc -b` gate until the emit surface was narrowed to non-test sources.

## User Setup Required

None.

## Next Phase Readiness

- `demohunter init` can now scaffold a minimal local demo against stable starter files.
- Later CLI and generator plans can rely on a single resolved config shape and a stable absolute output root.

## Self-Check: PASSED

- Verified `bun test packages/sdk/src/config.test.ts`.
- Verified `bun test packages/cli/src/config/load-config.test.ts`.
- Verified `bun x tsc -b tsconfig.json --pretty false`.
- Verified commits `b49258b`, `602c8c1`, and `77c64f7` exist in git history.
- Verified the starter template contains the exact smoke-path strings and no unresolved internal imports or external URLs.

---
*Phase: 01-repository-and-scaffolding*
*Completed: 2026-04-10*
