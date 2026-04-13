---
phase: 05-portable-output-contract
plan: 03
subsystem: output
tags: [manifest, poster, audio, ffmpeg, e2e]
requires:
  - phase: 05-portable-output-contract
    provides: stable video and narration handoff from plan 02
provides:
  - Deterministic `poster.jpg` creation with explicit probed metadata
  - Narration audio export into `audio/`
  - Validated `manifest.json` written from final portable artifacts
affects:
  - 05-04
  - cli
  - tests
  - cloud-handoff
tech-stack:
  added: []
  patterns:
    - Portable manifest assembly happens after all final files exist
    - Machine-local cache paths are stripped before timeline data crosses the external manifest boundary
key-files:
  created:
    - packages/generator-playwright/src/output/capture-poster.ts
    - packages/generator-playwright/src/output/capture-poster.test.ts
    - packages/generator-playwright/src/output/export-audio.ts
    - packages/generator-playwright/src/output/export-audio.test.ts
    - .planning/phases/05-portable-output-contract/05-portable-output-contract-03-SUMMARY.md
  modified:
    - packages/generator-playwright/package.json
    - packages/generator-playwright/src/output/write-generation-output.ts
    - packages/generator-playwright/src/output/write-generation-output.test.ts
    - tests/e2e/generation-engine-contract.test.ts
    - bun.lock
key-decisions:
  - Probe the final `video.mp4` and clamp poster capture to a fixed preferred timestamp of `1_000` ms.
  - Copy narration audio into `audio/` only when narrations exist; never create placeholder audio directories.
  - Strip `audioPath` from manifest timeline narrations so the portable contract never leaks cache-local paths.
patterns-established:
  - Output helpers own ffmpeg/ffprobe details while `writeGenerationOutput()` owns manifest assembly.
  - Manifest descriptors are always created from output-root files after copy/export steps complete.
requirements-completed: [OUT-01, OUT-02, OUT-04]
duration: 18m
completed: 2026-04-13
---

# Phase 05 Plan 03: Portable Output Assembly Summary

**The output layer now emits poster, audio, and a validated portable manifest from final exported bytes, with source-CLI coverage proving the contract**

## Performance

- **Duration:** 18m
- **Started:** 2026-04-13T06:16:00Z
- **Completed:** 2026-04-13T06:34:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added deterministic poster capture with probed duration metadata and fixed-timestamp clamping.
- Added narration audio export into `audio/` with deduplication by source audio path.
- Upgraded output writing to emit `manifest.json`, `poster.jpg`, copied `audio/`, and validated descriptors built from the final portable artifact set.
- Extended the narrated source-CLI contract to assert the new manifest and poster metadata.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create deterministic poster and narration-audio export helpers** - `b0d87c5` (feat)
2. **Task 2: Assemble the validated portable manifest from final output artifacts and explicit probe metadata** - `7e6508c` (feat)

## Files Created/Modified

- `packages/generator-playwright/src/output/capture-poster.ts` - Final-video probe and deterministic poster extraction helper.
- `packages/generator-playwright/src/output/capture-poster.test.ts` - Coverage for explicit metadata and timestamp clamping.
- `packages/generator-playwright/src/output/export-audio.ts` - Copy/export helper for narration audio artifacts under `audio/`.
- `packages/generator-playwright/src/output/export-audio.test.ts` - Coverage for deduped copies and empty-run behavior.
- `packages/generator-playwright/src/output/write-generation-output.ts` - Portable manifest assembly from copied/exported final artifacts.
- `packages/generator-playwright/src/output/write-generation-output.test.ts` - Unit assertions for manifest fields, poster metadata, and audio export.
- `tests/e2e/generation-engine-contract.test.ts` - Source CLI contract assertions for `manifest.playback.durationMs` and `artifacts.poster.captureTimestampMs`.
- `packages/generator-playwright/package.json` - Workspace dependency on `@demohunter/manifest`.

## Decisions Made

- Kept the Plan 02 writer input contract stable and pushed all poster/audio/manifest enrichment inside the output layer.
- Used `parsePortableOutputManifest()` as the last in-memory validation step before writing `manifest.json`.
- Preserved subtitle semantics while excluding `audioPath` from the portable timeline narrations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Removed `audioPath` from portable timeline narrations**
- **Found during:** Task 2 unit verification
- **Issue:** The first manifest assembly attempt passed `recordedNarrations` through directly, which leaked cache-local `audioPath` into `timeline.narrations` and violated the strict manifest schema.
- **Fix:** Mapped timeline narrations to the portable fields only: `cacheKey`, `text`, `chapterTitle`, `startMs`, `endMs`, and `durationMs`.
- **Files modified:** `packages/generator-playwright/src/output/write-generation-output.ts`
- **Verification:** `bun test packages/generator-playwright/src/output/write-generation-output.test.ts`; `bun test tests/e2e/generation-engine-contract.test.ts`
- **Committed in:** `7e6508c`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required to keep the portable manifest free of machine-local paths. No scope creep.

## Issues Encountered

None beyond the schema-enforced `audioPath` leak fixed above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 4 can now verify the full portable output contract through built CLI, starter flow, authoring flow, and workspace-level regression checks.
- The OSS handoff boundary is now concrete: `video.mp4`, optional `video.webm`, `poster.jpg`, captions, chapters, copied audio, and `manifest.json`.
- No blockers for `05-04`.

## Self-Check: PASSED

- Verified `bun test packages/generator-playwright/src/output/capture-poster.test.ts packages/generator-playwright/src/output/export-audio.test.ts`.
- Verified `bun test packages/generator-playwright/src/output/write-generation-output.test.ts`.
- Verified `bun test tests/e2e/generation-engine-contract.test.ts`.
- Verified `bun x tsc -b packages/generator-playwright/tsconfig.json --pretty false`.
- Verified task commits `b0d87c5` and `7e6508c` exist in git history.
