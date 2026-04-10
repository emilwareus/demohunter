---
phase: 01-repository-and-scaffolding
plan: 05
subsystem: verification
tags: [dist, build, cli, e2e, contract]
requires:
  - 01-03
  - 01-04
provides:
  - Build-first workspace export contract test
  - Compiled CLI/bin end-to-end contract test
  - Explicit post-build proof of the Phase 1 dist surface
affects: [phase-01, verification, build, cli, dist]
tech-stack:
  added: [dist-first-e2e]
  patterns: [compiled-entrypoint-import-check, built-bin-contract]
key-files:
  created:
    - tests/e2e/workspace-build-contract.test.ts
    - tests/e2e/built-cli-bin-contract.test.ts
key-decisions:
  - "Require a fresh workspace build inside both tests so compiled output is the thing being proven, not stale artifacts."
  - "Import built dist entrypoints from a subprocess to avoid any accidental fallback to source transpilation."
  - "Assert only the required JSON contract fields in the built-bin test so extra metadata does not create false negatives."
patterns-established:
  - "Phase verification now distinguishes source-level behavior checks from authoritative built-output contract checks."
  - "The compiled CLI/bin is exercised against a fresh temp repo using the same user-facing commands as the source-level flow."
requirements-completed: [INIT-01, INIT-02]
duration: 11 min
completed: 2026-04-10
---

# Phase 1 Plan 5: Repository and Scaffolding Summary

**Build-first dist contract tests for compiled package exports and the built CLI/bin**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-10T09:31:00Z
- **Completed:** 2026-04-10T09:42:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added a build-first contract test that rebuilds the workspace, asserts compiled entrypoints exist, and imports the built SDK, generator, and scaffold packages directly from `dist/`.
- Added a compiled-bin contract test that runs `packages/cli/dist/bin/demohunter.js` in a temp repo and proves `init` plus `generate` from built output.
- Re-ran the full Phase 1 verification set after these tests landed, closing the source-vs-dist gap left intentionally after Wave 4.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add a build-first workspace export contract test** - `7bbaa1b` (test)
2. **Task 2: Prove the compiled `demohunter` bin in a temp repo** - `1c29489` (test)

## Files Created/Modified

- `tests/e2e/workspace-build-contract.test.ts` - Rebuilds the workspace, asserts compiled entrypoints exist, and imports built package exports from `dist/`.
- `tests/e2e/built-cli-bin-contract.test.ts` - Runs the compiled CLI bin in a temp repo and validates the resulting scaffold and smoke artifact contract.

## Decisions Made

- Made both tests run `bun x tsc -b tsconfig.json --pretty false` themselves so dist checks never depend on previous manual build state.
- Used subprocess-based import checks for compiled ESM entrypoints rather than direct in-process imports from the test runner.
- Narrowed the built-bin JSON assertion to the required contract fields after the generator intentionally emitted additional metadata fields.

## Deviations from Plan

- None in behavior. The only test adjustment was switching the built-bin artifact assertion from exact object equality to a required-field match because the generated JSON legitimately includes `baseURL`, `title`, and `generatedAt`.

## Issues Encountered

- The first built-bin test version failed because it asserted an exact JSON payload instead of the contract fields the plan actually required.

## User Setup Required

None beyond the Playwright Chromium runtime already installed during Plan 01-04 verification.

## Next Phase Readiness

- Phase 1 now has both fast source-level verification and authoritative compiled-output contract coverage.
- Later phases can extend the dist surface with confidence that the build and compiled CLI path are already under automated regression tests.

## Self-Check: PASSED

- Verified `bun test tests/e2e/workspace-build-contract.test.ts`.
- Verified `bun test tests/e2e/built-cli-bin-contract.test.ts`.
- Verified the combined Phase 1 suite: `bun test packages/sdk/src/config.test.ts packages/cli/src/config/load-config.test.ts packages/create-demohunter/src/scaffold.test.ts tests/e2e/init-generate-smoke.test.ts tests/e2e/workspace-build-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts`.
- Verified commits `7bbaa1b` and `1c29489` exist in git history.

---
*Phase: 01-repository-and-scaffolding*
*Completed: 2026-04-10*
