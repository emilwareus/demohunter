---
phase: 05-portable-output-contract
plan: 04
subsystem: testing
tags: [e2e, cli, dist, manifest, regression]
requires:
  - phase: 05-portable-output-contract
    provides: portable manifest assembly, poster generation, and exported audio from plan 03
provides:
  - Source CLI proof of the portable manifest boundary
  - Built CLI proof of optional webm and compiled portable output behavior
  - No-narration regression coverage and compiled manifest dist export proof
affects:
  - roadmap
  - requirements
  - oss-readiness
  - cloud-handoff
tech-stack:
  added: []
  patterns:
    - Portable output contract assertions parse `manifest.json` instead of relying on file-exists checks alone
    - No-narration flows explicitly reject placeholder `audio/` output
key-files:
  created:
    - .planning/phases/05-portable-output-contract/05-portable-output-contract-04-SUMMARY.md
  modified:
    - tests/e2e/generation-engine-contract.test.ts
    - tests/e2e/built-cli-bin-contract.test.ts
    - tests/e2e/init-generate-smoke.test.ts
    - tests/e2e/authoring-sdk-contract.test.ts
    - tests/e2e/workspace-build-contract.test.ts
key-decisions:
  - Keep source and built e2e coverage validating the same manifest parser instead of duplicating schema checks by hand.
  - Move the authored no-narration regression to an inline temp-repo fixture so it stays env-independent and does not require OpenAI.
  - Use the built CLI narrated test to lock optional `video.webm` plus `.wav` exported audio through the compiled path.
patterns-established:
  - Portable contract regressions should be caught through both source CLI and compiled dist entrypoints.
  - Workspace build verification now treats `@demohunter/manifest` as a first-class public package.
requirements-completed: [OUT-01, OUT-02, OUT-04]
duration: 16m
completed: 2026-04-13
---

# Phase 05 Plan 04: Portable Contract Verification Summary

**The portable output contract is now proven across source CLI, built CLI, starter flow, authored flow, and the full workspace verification path**

## Performance

- **Duration:** 16m
- **Started:** 2026-04-13T06:35:00Z
- **Completed:** 2026-04-13T06:51:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Extended the source CLI narrated contract to assert relative manifest paths, portable artifact layout, and replay-safe narration timing relationships without changing the Phase 4 caption bytes.
- Extended the built CLI contract to prove optional `video.webm`, `.wav` audio export, and manifest portability through the compiled dist path.
- Updated starter and authored no-narration regressions to expect `manifest.json` and `poster.jpg` while still rejecting placeholder `audio/`.
- Extended the workspace build contract to require `packages/manifest/dist/index.js` and verify the compiled manifest helpers are exported.
- Verified the full workspace with `bun run verify`, including the gated live OpenAI integration path enabled in the current environment.

## Task Commits

Each task was committed atomically:

1. **Task 1: Update the source CLI contract test for narrated portable output** - `59d3764` (test)
2. **Task 2: Prove the compiled CLI and dist build preserve the same portable contract** - `103a787` (test)
3. **Task 3: Update no-narration regressions and reserve full verification for plan sign-off** - `0b602c1` (test)

## Files Created/Modified

- `tests/e2e/generation-engine-contract.test.ts` - Source CLI manifest portability and narration-timeline assertions.
- `tests/e2e/built-cli-bin-contract.test.ts` - Compiled CLI assertions for optional webm, `.wav` audio export, and manifest parsing.
- `tests/e2e/init-generate-smoke.test.ts` - Starter no-narration baseline expectations for `manifest.json` and `poster.jpg`.
- `tests/e2e/authoring-sdk-contract.test.ts` - Env-independent no-narration authored flow plus baseline portable artifact assertions.
- `tests/e2e/workspace-build-contract.test.ts` - Compiled manifest package export probe.

## Decisions Made

- Reused `parsePortableOutputManifest()` in e2e rather than open-coding manifest expectations, so test failures stay aligned with the real contract boundary.
- Kept the static authoring fixture for the setup/bootstrap contract while generating a no-narration authored tour inline for the executable regression path.
- Let `bun run verify` remain the final sign-off gate after the targeted Wave 4 e2e updates landed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced the executable authored regression fixture with an inline no-narration authored tour**
- **Found during:** Task 3 verification
- **Issue:** The existing `phase-02-authoring.tour.ts` fixture contains `narrate()` calls, so the new “no placeholder audio” assertion was invalid and the test path still depended on narration behavior.
- **Fix:** Kept the fixture for the static bootstrap contract check, but wrote an inline no-narration `defineTour()` file for the executable temp-repo regression.
- **Files modified:** `tests/e2e/authoring-sdk-contract.test.ts`
- **Verification:** `bun test tests/e2e/init-generate-smoke.test.ts tests/e2e/authoring-sdk-contract.test.ts`; `bun run verify`
- **Committed in:** `0b602c1`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Improved determinism and matched the intended no-narration regression coverage. No scope creep.

## Issues Encountered

None beyond the authored-fixture mismatch handled above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 is fully proven and ready to be marked complete.
- Phase 6 can build examples, docs, and launch polish on top of a now-stable portable handoff boundary.
- No blockers for `06`.

## Self-Check: PASSED

- Verified `bun test tests/e2e/generation-engine-contract.test.ts`.
- Verified `bun test tests/e2e/built-cli-bin-contract.test.ts`.
- Verified `bun test tests/e2e/workspace-build-contract.test.ts`.
- Verified `bun test tests/e2e/init-generate-smoke.test.ts tests/e2e/authoring-sdk-contract.test.ts`.
- Verified `bun run verify`.
- Verified task commits `59d3764`, `103a787`, and `0b602c1` exist in git history.
