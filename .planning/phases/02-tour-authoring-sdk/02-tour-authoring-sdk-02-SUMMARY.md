---
phase: 02-tour-authoring-sdk
plan: 02
subsystem: generator-cli
tags: [typescript, playwright, sdk, cli, smoke-runtime]
requires:
  - phase: 02-tour-authoring-sdk
    provides: Phase 2 SDK tour contract and runtime helper types from plan 02-01
provides:
  - Thin Playwright-native smoke runtime helpers for Phase 2 tour execution
  - Shared lifecycle execution across setup, run, and teardown in smoke mode
  - CLI validation for optional setup and teardown exports on authored tours
affects: [02-tour-authoring-sdk-runtime, smoke-generation, cli-tour-validation]
tech-stack:
  added: []
  patterns:
    - Shared smoke runtime object passed through setup, run, and teardown
    - Event-oriented helper implementations with no Phase 3 output behavior
    - Fail-fast CLI contract validation for optional lifecycle exports
key-files:
  created:
    - packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts
    - packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts
  modified:
    - packages/generator-playwright/src/smoke-generate.ts
    - packages/generator-playwright/src/smoke-generate.test.ts
    - packages/cli/src/commands/generate.ts
    - packages/cli/src/commands/generate.test.ts
    - packages/generator-playwright/package.json
    - bun.lock
key-decisions:
  - Keep the smoke runtime thin and event-oriented so Phase 2 helpers do not write extra artifacts or encode Phase 3 timing behavior.
  - Run setup, run, and teardown against the same runtime object and page rather than introducing separate lifecycle scopes.
  - Reject malformed optional setup and teardown exports at CLI import time with path-specific errors.
patterns-established:
  - Runtime helpers remain direct on context: chapter, step, narrate, waitForStable, highlight, snapshot, and assertVisible.
  - Smoke execution stays a thin wrapper on Playwright and preserves the existing smoke-run JSON artifact contract.
requirements-completed: [TOUR-02, TOUR-03, TOUR-04, TOUR-05]
duration: 4 min
completed: 2026-04-10
---

# Phase 02 Plan 02: Tour Authoring Runtime Summary

**Thin smoke runtime helpers, shared top-level lifecycle execution, and CLI validation for the Phase 2 tour contract**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-10T18:53:58+09:00
- **Completed:** 2026-04-10T18:57:43+09:00
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `createSmokeTourRuntime()` with direct Playwright-native helpers for chapter, step, narrate, waitForStable, highlight, snapshot, and assertVisible.
- Updated smoke generation to execute `setup`, `run`, and `teardown` in order against one shared runtime while preserving the existing `smoke-run.json` output contract.
- Tightened CLI validation so valid Phase 2 tours continue through generation, while malformed optional `setup` or `teardown` exports fail fast with tour-path-specific errors.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the smoke-runtime helper factory with direct Playwright-native helpers**
   - `bfad16a` (`test`) add failing smoke runtime factory test
   - `9e76606` (`feat`) add thin smoke runtime factory
2. **Task 2: Wire lifecycle-aware smoke execution and tighten CLI tour validation**
   - `ed1ea51` (`test`) add failing lifecycle smoke tests
   - `de07dbf` (`feat`) wire smoke lifecycle execution

## Files Created/Modified

- `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts` - Thin helper factory that emits runtime events and delegates behavior to Playwright primitives.
- `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts` - Focused runtime contract coverage for chapter, step, narration, and direct helper delegation.
- `packages/generator-playwright/src/smoke-generate.ts` - Shared runtime creation and `setup`/`run`/`teardown` ordering for smoke execution.
- `packages/generator-playwright/src/smoke-generate.test.ts` - Lifecycle ordering, shared page usage, helper availability, and artifact-contract assertions.
- `packages/cli/src/commands/generate.ts` - Tour validation upgraded to accept valid Phase 2 lifecycle exports and reject malformed ones.
- `packages/cli/src/commands/generate.test.ts` - CLI coverage for valid Phase 2 tours, legacy plain-object compatibility, and explicit invalid lifecycle errors.
- `packages/generator-playwright/package.json` - Added the workspace SDK dependency required for generator type resolution.
- `bun.lock` - Refreshed lockfile after the generator dependency update.

## Decisions Made

- Passed the full smoke runtime object into `setup` and `teardown` so authored code sees one consistent page-backed context through the entire lifecycle.
- Kept helper implementations metadata-only beyond their direct Playwright calls so no video, manifest, subtitle, or narration-resolution behavior leaks into this phase.
- Used the SDK package import in generator source rather than repo-relative type imports so emitted generator declarations remain package-safe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a generator dependency on `@demohunter/sdk`**
- **Found during:** Task 1
- **Issue:** `bun x tsc -b packages/generator-playwright/tsconfig.json --pretty false` failed because the new runtime factory could not resolve the SDK types from the generator package.
- **Fix:** Added `@demohunter/sdk: "workspace:*"` to `packages/generator-playwright/package.json` and refreshed `bun.lock`.
- **Files modified:** `packages/generator-playwright/package.json`, `bun.lock`
- **Verification:** `bun x tsc -b packages/generator-playwright/tsconfig.json --pretty false`
- **Committed in:** `9e76606`

## Known Stubs

None.

## Threat Flags

None.

## Verification

- `bun test packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts`
- `bun test packages/generator-playwright/src/smoke-generate.test.ts packages/cli/src/commands/generate.test.ts`
- `bun x tsc -b tsconfig.json --pretty false`

## Notes

- Phase-level progress artifacts were intentionally left untouched so the orchestrator can handle cross-wave completion state.

## Self-Check: PASSED

- Found `.planning/phases/02-tour-authoring-sdk/02-tour-authoring-sdk-02-SUMMARY.md`
- Found commits `bfad16a`, `9e76606`, `ed1ea51`, and `de07dbf`
- Stub scan on modified implementation files found no placeholder markers
