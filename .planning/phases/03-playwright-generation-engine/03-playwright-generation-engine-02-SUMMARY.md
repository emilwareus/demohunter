---
phase: 03-playwright-generation-engine
plan: 02
subsystem: generator
tags: [playwright, replay, screencast, two-pass, bun]
requires:
  - phase: 03-playwright-generation-engine
    provides: pass-1 collected timeline contracts and runtime event capture from 03-01
provides:
  - Strict pass-2 replay that compares every live runtime event against the collected timeline
  - Narration hold timing enforcement using collected duration plus configured hold padding
  - Playwright screencast start/stop helpers that preserve primary replay failures
affects: [03-03, 03-04, generator-playwright, cli]
tech-stack:
  added: []
  patterns: [strict event-by-event replay validation, primary-error-preserving cleanup, Playwright-native screencast control]
key-files:
  created: [packages/generator-playwright/src/execute/replay-timeline.ts, packages/generator-playwright/src/execute/replay-timeline.test.ts, packages/generator-playwright/src/record/screencast.ts, packages/generator-playwright/src/record/screencast.test.ts]
  modified: []
key-decisions:
  - "Pass 2 reuses the existing smoke runtime surface and enforces strictness by validating each emitted event against the collected timeline."
  - "Narration timing stays in the replay layer by waiting on collected duration plus hold padding after each matched narrate event."
  - "Screencast control remains a thin Playwright wrapper and follows the generator's primary-error-over-cleanup rule."
patterns-established:
  - "Replay failures are explicit generator errors with entry index and expected vs actual event context."
  - "Recording cleanup never overwrites an earlier replay failure."
requirements-completed: [GEN-02, GEN-03]
duration: 24 min
completed: 2026-04-11
---

# Phase 3 Plan 2: Recorded Replay and Screencast Summary

**Strict pass-2 replay with narration hold timing and Playwright screencast helpers for recorded generation**

## Performance

- **Duration:** 24 min
- **Started:** 2026-04-10T22:55:00Z
- **Completed:** 2026-04-10T23:18:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `replayTimeline()` to rerun tours through the existing runtime surface and fail immediately when live pass-2 events diverge from pass-1 expectations.
- Enforced recorded-pass narration timing by waiting exactly `durationMs + holdPaddingMs` once per matched narration event.
- Added Playwright-native screencast helpers that start with an explicit temp path, optionally enable brief action annotations, and preserve the primary replay failure on shutdown.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: strict replay engine** - `7adb676` (`test`)
2. **Task 1 GREEN: strict replay engine** - `f53181b` (`feat`)
3. **Task 2 RED: screencast wrapper** - `9c75484` (`test`)
4. **Task 2 GREEN: screencast wrapper** - `01a4cae` (`feat`)

## Files Created/Modified
- `packages/generator-playwright/src/execute/replay-timeline.ts` - Strict pass-2 replay implementation with explicit divergence errors and narration hold waits.
- `packages/generator-playwright/src/execute/replay-timeline.test.ts` - TDD coverage for ordered replay, hold-padding timing, and divergence failures.
- `packages/generator-playwright/src/record/screencast.ts` - Thin `page.screencast` start/stop wrapper for recorded-pass use.
- `packages/generator-playwright/src/record/screencast.test.ts` - TDD coverage for explicit start options, opt-in action annotations, and primary-error-preserving stop behavior.
- `.planning/phases/03-playwright-generation-engine/03-playwright-generation-engine-02-SUMMARY.md` - Plan execution summary and verification record.

## Decisions Made
- Reused `createSmokeTourRuntime()` for pass 2 instead of adding a replay-only DSL so authored tours stay on the Playwright-native helper surface.
- Compared pass-2 events directly against the collected `event`/`narration` entries from plan `03-01`, which keeps the strictness contract inside the generator layer.
- Kept screencast orchestration narrow and deferred chapter overlays, matching the phase boundary and research guidance.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `replayTimeline()` and `startScreencast()` / `stopScreencast()` are ready for wiring into the broader generation flow.
- No blockers identified for downstream Phase 3 plans.

---
*Phase: 03-playwright-generation-engine*
*Completed: 2026-04-11*

## Self-Check: PASSED
- Found `.planning/phases/03-playwright-generation-engine/03-playwright-generation-engine-02-SUMMARY.md`
- Found commits `7adb676`, `f53181b`, `9c75484`, and `01a4cae`
