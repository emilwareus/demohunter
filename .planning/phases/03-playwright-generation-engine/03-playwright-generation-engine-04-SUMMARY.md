---
phase: 03-playwright-generation-engine
plan: 04
subsystem: generator
tags: [playwright, cli, video, overlays, e2e]
requires:
  - phase: 03-playwright-generation-engine
    provides: pass-1 collection, strict replay, screencast control, and baseline output helpers from plans 03-01 through 03-03
provides:
  - Real `generateTour()` orchestration wired into `demohunter generate`
  - Minimal pass-2 chapter overlays that stay outside the authored tour API
  - Source and built CLI contract coverage for Phase 3 `video.mp4` plus `chapters.json` outputs
affects: [04-tts-and-cache, cli-dist-contract, generator-playwright]
tech-stack:
  added: []
  patterns:
    - two-context browser orchestration for pass 1 collection and pass 2 recording
    - pass-2 chapter overlays injected by proxying the replay runtime instead of changing authored helpers
    - temp-repo source and dist CLI contracts that assert only the baseline Phase 3 artifact set
key-files:
  created:
    - packages/generator-playwright/src/overlays/chapter-overlay.ts
    - packages/generator-playwright/src/overlays/chapter-overlay.test.ts
    - packages/generator-playwright/src/generate.ts
    - packages/generator-playwright/src/generate.test.ts
    - tests/fixtures/tours/phase-03-generation.tour.ts
    - tests/e2e/generation-engine-contract.test.ts
  modified:
    - packages/generator-playwright/src/index.ts
    - packages/cli/src/commands/generate.ts
    - packages/cli/src/commands/generate.test.ts
    - tests/e2e/built-cli-bin-contract.test.ts
key-decisions:
  - "Pass-2 chapter overlays are injected by wrapping `runtime.chapter()` during replay so the authored tour surface stays unchanged."
  - "The CLI now reports the final video path instead of the old smoke artifact path."
  - "Phase 3 `chapters.json` start times are derived from collected narration duration plus hold padding, with later subtitle/audio timing still deferred."
patterns-established:
  - "Real generation runs one browser across separate pass-1 and pass-2 contexts while preserving the primary replay error through screencast shutdown and browser cleanup."
  - "Phase 3 end-to-end contracts assert only `video.mp4` and `chapters.json`, explicitly rejecting manifest and subtitle artifacts until later phases."
requirements-completed: [GEN-01, GEN-06]
duration: 13 min
completed: 2026-04-11
---

# Phase 3 Plan 4: Generation Wiring Summary

**Real two-pass `generateTour()` orchestration with brief chapter overlays and source/built CLI contracts for baseline `video.mp4` plus `chapters.json` output**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-10T23:23:15Z
- **Completed:** 2026-04-10T23:36:01Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added a minimal `showChapterOverlay()` helper and kept chapter annotations brief, transient, and Playwright-page-driven.
- Wired `demohunter generate` to the real Phase 3 engine through `generateTour()`, including pass 1 collection, pass 2 replay, screencast start/stop, muxing, and baseline output writing.
- Proved the Phase 3 contract end-to-end through both source and compiled CLI flows, including a strict replay-divergence failure case.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: add chapter overlay helper coverage** - `653337e` (`test`)
2. **Task 1 GREEN: add chapter overlay helper** - `e9418ad` (`feat`)
3. **Task 2 RED: add real generator wiring coverage** - `558e17f` (`test`)
4. **Task 2 GREEN: wire the real generator path** - `6743618` (`feat`)
5. **Task 3 RED: add failing Phase 3 contract coverage** - `6b08390` (`test`)
6. **Task 3 GREEN: prove Phase 3 generation contracts** - `789c81e` (`test`)

## Files Created/Modified

- `packages/generator-playwright/src/overlays/chapter-overlay.ts` - Minimal replay-time chapter label injection with deterministic hide timing.
- `packages/generator-playwright/src/overlays/chapter-overlay.test.ts` - Focused DOM-level coverage for creation, reuse, and timeout-driven hiding.
- `packages/generator-playwright/src/generate.ts` - Real Phase 3 orchestration entrypoint for collect, replay, screencast, mux, and output writing.
- `packages/generator-playwright/src/generate.test.ts` - TDD coverage for orchestration order, direct Playwright failure propagation, and replay divergence handling.
- `packages/generator-playwright/src/index.ts` - Public generator export now includes `generateTour()`.
- `packages/cli/src/commands/generate.ts` - CLI generate path now delegates to the real generator and logs the final video path.
- `packages/cli/src/commands/generate.test.ts` - CLI tests now assert the Phase 3 generator contract instead of the smoke path.
- `tests/fixtures/tours/phase-03-generation.tour.ts` - Representative two-chapter fixture that exercises Phase 3 generation against an ordinary local HTML app.
- `tests/e2e/generation-engine-contract.test.ts` - Source-level temp-repo contract for Phase 3 success and divergence failure paths.
- `tests/e2e/built-cli-bin-contract.test.ts` - Built CLI contract updated to assert baseline Phase 3 outputs after a fresh workspace build.

## Decisions Made

- Wrapped replay-time `chapter()` calls rather than modifying the SDK/runtime surface so authored tours remain Playwright-native.
- Kept output assertions focused on `video.mp4` and `chapters.json`, with manifest/subtitles still explicitly absent in this phase.
- Reused temp-repo consumer installs for both source and built contracts so the coverage matches how external users run fixtures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added explicit timeout budgets to the new end-to-end CLI contract tests**
- **Found during:** Task 3 (Prove the source and built Phase 3 generation contracts)
- **Issue:** The real CLI + Playwright + build path exceeded Bun's default 5-second test timeout even though the contracts were passing.
- **Fix:** Added per-test timeout budgets to the source and built e2e files so the plan's normal `bun test ...` verification command can complete reliably.
- **Files modified:** `tests/e2e/generation-engine-contract.test.ts`, `tests/e2e/built-cli-bin-contract.test.ts`
- **Verification:** `bun test tests/e2e/generation-engine-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts`; `bun x tsc -b tsconfig.json --pretty false`
- **Committed in:** `789c81e`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation kept the new contract coverage reliable without expanding scope beyond the planned Phase 3 source and built CLI proofs.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `demohunter generate` now runs the real two-pass Phase 3 engine through both the public generator export and the CLI command.
- The baseline user-facing contract is pinned for both source and built consumer paths, including strict replay-failure behavior.
- No blockers identified for narration/cache work in the next phase.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Found `.planning/phases/03-playwright-generation-engine/03-playwright-generation-engine-04-SUMMARY.md`
- Found commits `653337e`, `e9418ad`, `558e17f`, `6743618`, `6b08390`, and `789c81e`
