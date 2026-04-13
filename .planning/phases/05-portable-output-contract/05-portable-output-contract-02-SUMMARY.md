---
phase: 05-portable-output-contract
plan: 02
subsystem: generator
tags: [generator, playwright, video, narration, output-contract]
requires:
  - phase: 05-portable-output-contract
    provides: strict manifest package and portable artifact helper boundary from plan 01
provides:
  - Baseline `video.mp4` with optional `video.webm` generation contract
  - Replay-safe narration timing captured from pass 2
  - Stable typed handoff from generator runtime into output writing
affects:
  - 05-03
  - 05-04
  - cli
  - tests
tech-stack:
  added: []
  patterns:
    - Generator runtime hands typed video and narration artifacts to the output writer instead of reconstructing them later
    - Replay-time metadata is captured from matched pass-2 events, not pass-1 sequence assumptions
key-files:
  created:
    - .planning/phases/05-portable-output-contract/05-portable-output-contract-02-SUMMARY.md
  modified:
    - packages/generator-playwright/src/execute/generator-types.ts
    - packages/generator-playwright/src/record/mux-video.ts
    - packages/generator-playwright/src/record/mux-video.test.ts
    - packages/generator-playwright/src/generate.ts
    - packages/generator-playwright/src/generate.test.ts
    - packages/generator-playwright/src/output/write-generation-output.ts
    - packages/generator-playwright/src/output/write-generation-output.test.ts
key-decisions:
  - Always produce `video.mp4` as the baseline portable artifact and emit `video.webm` only when the recording config requests it.
  - Keep caption serialization behavior unchanged in Phase 5 even though replay-safe narration timing is now available.
  - Extend `writeGenerationOutput()` to accept the future portable-output handoff now, while deferring poster/audio/manifest behavior to the next plan.
patterns-established:
  - Portable generator outputs are passed as `{ mp4, webm? }` rather than a single selected file.
  - Replay-safe narration metadata uses `startMs` and `endMs` anchored to the actual recorded pass clock.
requirements-completed: [OUT-01, OUT-04]
duration: 14m
completed: 2026-04-13
---

# Phase 05 Plan 02: Generator Runtime Contract Summary

**The generator now always emits a baseline mp4, records replay-safe narration timing, and hands one typed portable-output contract into the writer**

## Performance

- **Duration:** 14m
- **Started:** 2026-04-13T06:01:00Z
- **Completed:** 2026-04-13T06:15:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Changed `muxVideo()` to always generate `video.mp4`, optionally retain `video.webm`, and clean stale webm artifacts on non-webm runs.
- Added replay-safe narration timing captured from pass-2 matched narration events.
- Updated `writeGenerationOutput()` to accept typed `tourId`, `tourTitle`, `videos`, `chapters`, and `recordedNarrations` inputs while preserving the current output file set.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lock `muxVideo()` to baseline mp4 plus optional webm output** - `6b26fcd` (feat)
2. **Task 2: Capture replay-safe narration timing and forward typed output inputs** - `e56d856` (feat)

## Files Created/Modified

- `packages/generator-playwright/src/execute/generator-types.ts` - Portable video and replay-safe narration handoff types.
- `packages/generator-playwright/src/record/mux-video.ts` - Baseline mp4 generation plus optional webm retention.
- `packages/generator-playwright/src/record/mux-video.test.ts` - Coverage for required mp4 output, optional webm output, and stale-webm cleanup.
- `packages/generator-playwright/src/generate.ts` - Replay-safe narration timing capture and typed writer handoff.
- `packages/generator-playwright/src/generate.test.ts` - Coverage for replay-timed narration forwarding.
- `packages/generator-playwright/src/output/write-generation-output.ts` - Typed output-writer input contract over `{ mp4, webm? }`.
- `packages/generator-playwright/src/output/write-generation-output.test.ts` - Regression coverage for the new writer input shape and mp4-first output behavior.

## Decisions Made

- Kept the output writer returning `videoPath` for the baseline mp4 because that remains the default portable artifact and CLI-visible path.
- Used the replay callback index to bind pass-2 narration events back to the collected narration segments deterministically.
- Preserved subtitle serialization logic instead of switching captions to replay timestamps in this plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 3 can now consume a stable writer handoff without changing generator callers again.
- Poster capture, audio export, and manifest assembly can build on replay-safe narration timing already available in `recordedNarrations`.
- No blockers for `05-03`.

## Self-Check: PASSED

- Verified `bun test packages/generator-playwright/src/record/mux-video.test.ts`.
- Verified `bun test packages/generator-playwright/src/generate.test.ts`.
- Verified `bun test packages/generator-playwright/src/output/write-generation-output.test.ts`.
- Verified `bun x tsc -b packages/generator-playwright/tsconfig.json --pretty false`.
- Verified task commits `6b26fcd` and `e56d856` exist in git history.
