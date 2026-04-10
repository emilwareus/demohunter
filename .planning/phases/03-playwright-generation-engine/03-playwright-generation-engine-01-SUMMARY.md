---
phase: 03-playwright-generation-engine
plan: 01
subsystem: generator
tags: [playwright, timeline, runtime-events, two-pass, bun]
requires:
  - phase: 02-tour-authoring-sdk
    provides: typed runtime helper surface reused for pass-1 event capture
provides:
  - Shared runtime event and pass-1 timeline contracts for generator replay
  - Deterministic collectTimeline pass-1 executor with local narration timing fallback
affects: [03-02, generator-playwright, cli]
tech-stack:
  added: []
  patterns: [shared runtime-event contracts, post-run narration duration resolution, Playwright-native lifecycle execution]
key-files:
  created: [packages/generator-playwright/src/execute/generator-types.ts, packages/generator-playwright/src/execute/collect-timeline.ts, packages/generator-playwright/src/execute/collect-timeline.test.ts]
  modified: [packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts, packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts]
key-decisions:
  - "Pass 1 reuses the Phase 2 runtime event surface instead of adding a new authoring contract."
  - "Narration durations are resolved after event capture so runtime event emission stays synchronous and deterministic."
  - "Phase 3 uses a silent local 0ms narration-duration fallback until Phase 4 audio timing lands."
patterns-established:
  - "Collected timeline ordering is explicit: non-narration runtime events become `event` entries while narration becomes `narration` entries with resolved duration."
  - "Tour execution keeps Playwright-native `goto -> setup -> run -> teardown` ordering and preserves the primary error across teardown."
requirements-completed: [GEN-02]
duration: 5 min
completed: 2026-04-10
---

# Phase 3 Plan 1: Pass-1 Timeline Collection Summary

**Shared pass-1 timeline contracts and deterministic Playwright event collection for two-pass demo generation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-10T15:00:56Z
- **Completed:** 2026-04-10T15:05:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Centralized the reusable runtime event union and Phase 3 timeline types in `generator-types.ts`.
- Kept `createSmokeTourRuntime()` thin while proving its helper calls still emit the expected chapter, step, narration, wait, highlight, snapshot, and assert-visible payloads.
- Implemented `collectTimeline()` to run the Playwright-native lifecycle once, capture ordered replay entries, resolve narration durations, and preserve teardown behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: shared generator contracts** - `131b42e` (`test`)
2. **Task 1 GREEN: shared generator contracts** - `cc75463` (`feat`)
3. **Task 2 RED: pass-1 timeline collection** - `88fe5d0` (`test`)
4. **Task 2 GREEN: pass-1 timeline collection** - `61b2f19` (`feat`)

## Files Created/Modified
- `packages/generator-playwright/src/execute/generator-types.ts` - Shared runtime-event union and pass-1 timeline contracts.
- `packages/generator-playwright/src/execute/collect-timeline.ts` - Pass-1 collector that runs the tour lifecycle and resolves narration durations.
- `packages/generator-playwright/src/execute/collect-timeline.test.ts` - TDD coverage for lifecycle order, event ordering, default narration timing, and teardown behavior.
- `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts` - Runtime now emits the shared `TourRuntimeEvent` contract without adding extra responsibilities.
- `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts` - Verifies the runtime helper payloads still match the shared Phase 3 contracts.

## Decisions Made
- Reused the existing runtime event surface as the single pass-1 input contract so authored tours do not need a second tracing API.
- Resolved narration durations after the tour run rather than inside the runtime callback to keep event collection synchronous and ordered.
- Kept the default narration resolver local and silent at `0` ms so Phase 3 establishes the timing contract without leaking Phase 4 TTS/cache work.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Validate narration-duration resolver output**
- **Found during:** Task 2 (Implement the pass-1 timeline collector)
- **Issue:** Replay timing becomes invalid if a custom resolver returns a negative or non-finite duration.
- **Fix:** Added a collector guard that rejects invalid resolved durations before building the collected timeline.
- **Files modified:** `packages/generator-playwright/src/execute/collect-timeline.ts`
- **Verification:** `bun test packages/generator-playwright/src/execute/collect-timeline.test.ts`; `bun test packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts packages/generator-playwright/src/execute/collect-timeline.test.ts`; `bun x tsc -b packages/generator-playwright/tsconfig.json --pretty false`
- **Committed in:** `61b2f19`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The deviation tightened replay-timing correctness without expanding scope beyond pass-1 collection.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `collectTimeline()` now provides a typed, ordered replay contract for pass 2 work in `03-02`.
- No blockers identified for the next plan.

---
*Phase: 03-playwright-generation-engine*
*Completed: 2026-04-10*

## Self-Check: PASSED
- Found `.planning/phases/03-playwright-generation-engine/03-playwright-generation-engine-01-SUMMARY.md`
- Found commits `131b42e`, `cc75463`, `88fe5d0`, and `61b2f19`
