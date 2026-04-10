---
phase: 02-tour-authoring-sdk
plan: 01
subsystem: sdk
tags: [typescript, playwright, sdk, bun]
requires:
  - phase: 01-repository-and-scaffolding
    provides: workspace package layout, TypeScript build graph, and identity helper pattern
provides:
  - Playwright-native lifecycle and run context types for authored tours
  - Identity-only defineTour contract with optional top-level setup and teardown
  - Focused SDK contract tests that validate entrypoint and dist declaration exports
affects: [02-tour-authoring-sdk-runtime, workspace-build-contract, authored-tour-validation]
tech-stack:
  added: []
  patterns:
    - Identity-only authoring contracts
    - Playwright Page and Locator as first-class public SDK types
    - Dist declaration inspection in focused SDK contract tests
key-files:
  created:
    - packages/sdk/src/runtime-types.ts
  modified:
    - packages/sdk/package.json
    - packages/sdk/src/tour.ts
    - packages/sdk/src/index.ts
    - packages/sdk/src/tour.test.ts
    - packages/sdk/src/config.test.ts
    - bun.lock
key-decisions:
  - Keep defineTour identity-only and limit lifecycle scope to top-level setup and teardown.
  - Re-export runtime contract types from the SDK entrypoint instead of hiding them behind tour.ts.
  - Build the SDK inside the focused contract test before checking dist declarations so the assertion matches the real package contract.
patterns-established:
  - Runtime helper access stays context-first: chapter, step, narrate, waitForStable, highlight, snapshot, and assertVisible are called from the run context.
  - SDK typing stays Playwright-native by exposing Page and Locator directly rather than wrapping them.
requirements-completed: [TOUR-01, TOUR-02, TOUR-03]
duration: 4 min
completed: 2026-04-10
---

# Phase 02 Plan 01: Tour Authoring Contract Summary

**Playwright-native SDK tour typing with top-level lifecycle hooks, direct context helpers, and dist-verified entrypoint exports**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-10T18:45:57+09:00
- **Completed:** 2026-04-10T18:50:19+09:00
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added a dedicated `runtime-types.ts` module with Phase 2 option bags and Playwright-native lifecycle and run contexts.
- Expanded `defineTour` to support optional top-level `setup` and `teardown` without introducing a builder, nested helper namespace, or unsupported hook scopes.
- Re-exported the SDK contract from the public entrypoint and moved tour contract coverage into a focused `tour.test.ts` that validates the built declaration output.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the Playwright-native runtime and tour contracts in the SDK**
   - `b78a73d` (`test`) add failing SDK tour contract test
   - `d66dc8b` (`feat`) define Phase 2 SDK tour contract
2. **Task 2: Export the Phase 2 SDK surface and prove the contract with focused tests**
   - `e670cc8` (`test`) add failing SDK entrypoint contract test
   - `3a7df43` (`feat`) export Phase 2 SDK authoring surface

## Files Created/Modified

- `packages/sdk/src/runtime-types.ts` - Public lifecycle, run-context, and helper option bag types using Playwright `Page` and `Locator`.
- `packages/sdk/src/tour.ts` - Identity-only `defineTour` contract with optional top-level lifecycle hooks.
- `packages/sdk/src/index.ts` - Public entrypoint re-exports for the tour contract and runtime types.
- `packages/sdk/src/tour.test.ts` - Focused Phase 2 SDK contract test, including dist declaration verification.
- `packages/sdk/src/config.test.ts` - Reduced to config-only coverage after moving tour assertions into the focused contract test.
- `packages/sdk/package.json` - Peer and local dev dependency declarations for Playwright.
- `bun.lock` - Refreshed lockfile after adding the SDK-local Playwright dev dependency.

## Decisions Made

- Reused Playwright `Page` and `Locator` directly in the public SDK surface to preserve thin-wrapper semantics.
- Kept lifecycle typing constrained to top-level `setup` and `teardown` so helper signatures do not imply unsupported chapter or step hooks.
- Verified entrypoint type exports by checking `packages/sdk/dist/index.d.ts`, which pins the published package contract instead of only the source module shape.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added an SDK-local Playwright dev dependency so typecheck could resolve Playwright types**
- **Found during:** Task 1
- **Issue:** `bun x tsc -b packages/sdk/tsconfig.json --pretty false` failed because `packages/sdk` could not resolve the `playwright` module for the new public type imports.
- **Fix:** Added `playwright: ">=1.59"` to `packages/sdk` `devDependencies`, kept the required peer dependency, and refreshed `bun.lock`.
- **Files modified:** `packages/sdk/package.json`, `bun.lock`
- **Verification:** `bun x tsc -b packages/sdk/tsconfig.json --pretty false`
- **Committed in:** `d66dc8b`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix was required to keep the SDK package buildable while exposing Playwright-native public types. No product scope changed.

## Issues Encountered

- The initial RED test for Task 1 used only type imports, which Bun erased at runtime. The failing assertion was tightened to check the runtime module boundary so the TDD cycle stayed real.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The SDK now exposes the stable authoring contract that runtime execution work can implement against.
- Dist declarations and focused tests pin the exported authoring surface for downstream runtime and workspace validation plans.
- No blockers remain for the next Phase 2 plans.

## Self-Check: PASSED

- Found `.planning/phases/02-tour-authoring-sdk/02-tour-authoring-sdk-01-SUMMARY.md`
- Found commits `b78a73d`, `d66dc8b`, `e670cc8`, and `3a7df43`
