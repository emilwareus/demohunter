---
phase: 03-playwright-generation-engine
plan: 03
subsystem: generator
tags: [playwright, ffmpeg, output, config, bun]
requires:
  - phase: 03-playwright-generation-engine
    provides: typed pass-1 timeline contracts reused by later output writing
provides:
  - Record format configuration with mp4 default and webm opt-in resolution
  - Final video muxing helper with injected ffmpeg command execution
  - Baseline `.demohunter/<tour-id>/` output preparation and artifact writing
affects: [03-04, generator-playwright, cli, sdk]
tech-stack:
  added: []
  patterns: [dependency-injected ffmpeg execution, safe tour-id output pathing, baseline artifact-only output writing]
key-files:
  created:
    [
      packages/generator-playwright/src/record/mux-video.ts,
      packages/generator-playwright/src/record/mux-video.test.ts,
      packages/generator-playwright/src/output/prepare-output-dir.ts,
      packages/generator-playwright/src/output/prepare-output-dir.test.ts,
      packages/generator-playwright/src/output/write-generation-output.ts,
      packages/generator-playwright/src/output/write-generation-output.test.ts,
    ]
  modified:
    [
      packages/sdk/src/config.ts,
      packages/sdk/src/index.ts,
      packages/sdk/src/config.test.ts,
      packages/cli/src/config/load-config.test.ts,
    ]
key-decisions:
  - "Record format stays in the shared SDK config so the CLI and generator resolve the same mp4-default contract."
  - "muxVideo() owns only final format emission and injects ffmpeg execution so tests do not need a real binary."
  - "Phase 3 output writing persists only the selected final video and chapters.json, leaving manifest, subtitles, poster, and audio for later phases."
patterns-established:
  - "Filesystem output is prepared through a dedicated helper that enforces the same lowercase slug rule as the smoke generator."
  - "Output writers accept already-resolved artifacts and only persist the baseline Phase 3 files."
requirements-completed: [GEN-04, GEN-05]
duration: 8h 9m
completed: 2026-04-11
---

# Phase 3 Plan 3: Output and Media Format Summary

**mp4-default record config, injected ffmpeg muxing, and baseline `.demohunter/<tour-id>/` artifact writing**

## Performance

- **Duration:** 8h 9m
- **Started:** 2026-04-10T15:10:00Z
- **Completed:** 2026-04-10T23:18:56Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Extended the shared SDK/CLI config contract so `record.format` resolves as `"mp4"` by default and preserves explicit `"webm"` selection.
- Added `muxVideo()` as the phase-scoped media helper that either runs ffmpeg for `video.mp4` or emits only `video.webm`.
- Added dedicated output helpers that validate tour IDs, create `.demohunter/<tour-id>/`, and persist only the final video plus `chapters.json`.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: output format and muxing** - `be2b8f0` (`test`)
2. **Task 1 GREEN: output format and muxing** - `257f896` (`feat`)
3. **Task 2 RED: baseline output artifact writing** - `e5770e0` (`test`)
4. **Task 2 GREEN: baseline output artifact writing** - `fb7570a` (`feat`)

## Files Created/Modified
- `packages/sdk/src/config.ts` - Adds the shared `RecordFormat` contract and the default `mp4` record setting.
- `packages/sdk/src/index.ts` - Re-exports the record-format type for downstream callers.
- `packages/sdk/src/config.test.ts` - Verifies the shared record defaults now include `format: "mp4"`.
- `packages/cli/src/config/load-config.test.ts` - Covers default `mp4` resolution and explicit `webm` selection in loaded config.
- `packages/generator-playwright/src/record/mux-video.ts` - Converts temp screencasts into `video.mp4` or emits `video.webm` directly.
- `packages/generator-playwright/src/record/mux-video.test.ts` - Proves ffmpeg-path injection and single-artifact output behavior.
- `packages/generator-playwright/src/output/prepare-output-dir.ts` - Enforces safe tour IDs and creates `.demohunter/<tour-id>/` under the current working directory.
- `packages/generator-playwright/src/output/prepare-output-dir.test.ts` - Verifies safe path resolution and unsafe-tour rejection.
- `packages/generator-playwright/src/output/write-generation-output.ts` - Writes only the selected final video artifact and `chapters.json`.
- `packages/generator-playwright/src/output/write-generation-output.test.ts` - Asserts later-phase artifacts stay absent from Phase 3 output writing.

## Decisions Made
- Kept `record.format` in the SDK config layer so the resolved output format is shared between author config loading and generator execution.
- Injected command execution into `muxVideo()` so ffmpeg behavior is testable without shelling out in unit tests.
- Scoped output writing to the Phase 3 baseline artifact set instead of prematurely writing manifest, subtitles, poster, or copied audio files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced Bun-specific process execution in the mux helper**
- **Found during:** Task 1 (Extend config and media-format handling for `mp4` default / `webm` opt-in)
- **Issue:** The initial `muxVideo()` implementation used `Bun.spawn`, but the package typecheck runs against Node typings and failed with `Cannot find name 'Bun'`.
- **Fix:** Switched the default ffmpeg runner to `node:child_process.spawn` while keeping the injected command-path contract unchanged.
- **Files modified:** `packages/generator-playwright/src/record/mux-video.ts`
- **Verification:** `bun test packages/sdk/src/config.test.ts packages/cli/src/config/load-config.test.ts packages/generator-playwright/src/record/mux-video.test.ts`; `bun x tsc -b tsconfig.json --pretty false`
- **Committed in:** `257f896`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix kept the mux helper portable within the repo's Node-typed build without expanding scope.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The generator now has a stable seam for selecting output format, producing the final video artifact, and writing the baseline local output directory.
- Later orchestration work can call `prepareOutputDir()`, `muxVideo()`, and `writeGenerationOutput()` without taking on manifest, subtitles, poster, or audio responsibilities early.

---
*Phase: 03-playwright-generation-engine*
*Completed: 2026-04-11*

## Self-Check: PASSED
- Found `.planning/phases/03-playwright-generation-engine/03-playwright-generation-engine-03-SUMMARY.md`
- Found commits `be2b8f0`, `257f896`, `e5770e0`, and `fb7570a`
