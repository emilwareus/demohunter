---
phase: 04-openai-narration-and-cache
plan: 03
subsystem: generator
tags: [generator, narration, subtitles, cache, replay]
requires:
  - phase: 04-openai-narration-and-cache
    provides: canonical narration request/provider contracts and deterministic local narration cache from plans 01 and 02
provides:
  - Pass-1 narration resolution through the shared cache/provider layer
  - Audio-backed narration timing reused for strict replay
  - `captions.srt` and `captions.vtt` written from narration segments only
affects:
  - 04-04
  - generator-playwright
  - cli
tech-stack:
  added: []
  patterns:
    - Pass 1 resolves narration into cache-backed segments before recording starts
    - Subtitle serialization uses only narration segment timing and text, never chapter or step metadata
key-files:
  created:
    - packages/generator-playwright/src/narration/resolve-narration.ts
    - packages/generator-playwright/src/narration/resolve-narration.test.ts
    - packages/generator-playwright/src/output/subtitles.ts
    - packages/generator-playwright/src/output/subtitles.test.ts
    - .planning/phases/04-openai-narration-and-cache/04-openai-narration-and-cache-03-SUMMARY.md
  modified:
    - packages/generator-playwright/src/execute/generator-types.ts
    - packages/generator-playwright/src/execute/collect-timeline.ts
    - packages/generator-playwright/src/execute/collect-timeline.test.ts
    - packages/generator-playwright/src/execute/replay-timeline.ts
    - packages/generator-playwright/src/execute/replay-timeline.test.ts
    - packages/generator-playwright/src/generate.ts
    - packages/generator-playwright/src/generate.test.ts
    - packages/generator-playwright/src/output/write-generation-output.ts
    - packages/generator-playwright/src/output/write-generation-output.test.ts
    - packages/generator-playwright/package.json
    - packages/tts-core/package.json
    - packages/tts-openai/package.json
    - packages/tts-openai/src/openai-provider.ts
key-decisions:
  - Treat narration as a first-class segment object with cache identity, audio path, and measured duration instead of a text-plus-duration placeholder.
  - Keep pass 2 free of provider work by resolving narration only during pass 1 and replaying against stored segment timing.
  - Emit caption artifacts on every successful generation run, with cue timing derived strictly from narration segments.
patterns-established:
  - Source-path workspace imports for `tts-core` and `tts-openai` use Bun export conditions while dist consumers continue to use package `dist/`.
  - Missing `OPENAI_API_KEY` is surfaced as a narration-resolution failure only on uncached segments; cache hits stay offline-safe.
requirements-completed: [TTS-03, TTS-07, TTS-08, OUT-03]
duration: 2m
completed: 2026-04-11
---

# Phase 04 Plan 03: Generator Narration Wiring Summary

**Pass-1 narration resolution now flows through the shared cache/provider layer, drives replay timing, and emits subtitle artifacts**

## Performance

- **Duration:** 2m
- **Started:** 2026-04-11T18:20:02+09:00
- **Completed:** 2026-04-11T18:22:07+09:00
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Added a generator-facing narration resolver that canonicalizes request identity, reuses the local cache offline, and fails clearly on uncached missing-key paths.
- Upgraded the collected timeline so narration entries carry real segment metadata and replay timing comes from measured cached audio.
- Added SRT/VTT subtitle serialization and wrote caption artifacts alongside the selected final video and `chapters.json`.

## Task Commits

Each task was committed atomically:

1. **Task 1-3: Lock the Wave 3 narration/timeline/output contract in tests** - `8e75269` (test)
2. **Task 1-3: Implement narration resolution, replay timing, and caption output wiring** - `a356baf` (feat)

## Files Created/Modified

- `packages/generator-playwright/src/narration/resolve-narration.ts` - Pass-1 bridge from narration runtime events to canonical cached/provider-backed narration segments.
- `packages/generator-playwright/src/narration/resolve-narration.test.ts` - Coverage for offline cache reuse and uncached missing-key failure.
- `packages/generator-playwright/src/output/subtitles.ts` - SRT/VTT serialization from narration segments only.
- `packages/generator-playwright/src/output/subtitles.test.ts` - Coverage for cue timing and metadata exclusion.
- `packages/generator-playwright/src/execute/generator-types.ts` - Timeline contracts for audio-backed narration segments.
- `packages/generator-playwright/src/execute/collect-timeline.ts` - Pass-1 narration resolution wiring.
- `packages/generator-playwright/src/execute/replay-timeline.ts` - Replay waits sourced from measured narration segment duration.
- `packages/generator-playwright/src/output/write-generation-output.ts` - Caption artifact writing beside the final video and chapter data.
- `packages/generator-playwright/src/generate.ts` - End-to-end narration segment forwarding from pass 1 into final output writing.
- `packages/generator-playwright/package.json` - Direct workspace dependencies for the new TTS imports.
- `packages/tts-core/package.json` - Bun source export for source-path workspace consumers.
- `packages/tts-openai/package.json` - Bun source export and explicit `tts-core` dependency for source-path workspace consumers.
- `packages/tts-openai/src/openai-provider.ts` - Package import cleanup so source-path consumers no longer depend on built relative dist paths.

## Decisions Made

- Kept narration `sampleRate` fixed at the Phase 4 default `24_000` inside the generator bridge until config-level exposure exists.
- Returned normalized narration text from the resolver so cache identity, replay timing, and captions all share one canonical string.
- Wrote empty caption files when a tour has no narration so the output contract stays consistent once captions exist.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Bun source exports for TTS workspace packages**
- **Found during:** Task 1 (Resolve narration segments during pass 1 through the cache-or-provider layer)
- **Issue:** Source-path generator tests could not import `@demohunter/tts-core` or `@demohunter/tts-openai` without relying on prebuilt dist artifacts.
- **Fix:** Added `bun` export entries for both packages, declared the direct workspace dependencies, and updated the OpenAI provider to import `tts-core` through its package boundary.
- **Files modified:** `packages/generator-playwright/package.json`, `packages/tts-core/package.json`, `packages/tts-openai/package.json`, `packages/tts-openai/src/openai-provider.ts`
- **Verification:** `bun install`; `bun x tsc -b packages/generator-playwright/tsconfig.json --pretty false`
- **Committed in:** `a356baf`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for reliable source-path verification; no scope change beyond making the planned imports usable without a prior build.

## Issues Encountered

None beyond the auto-fixed workspace import issue above.

## User Setup Required

None.

## Next Phase Readiness

- Plan 04-04 can now prove narrated output, offline cache reuse, corrupt-cache recovery, and caption artifacts through the source and built CLI paths.
- The live OpenAI integration test can rely on the same narration resolver path as the generator instead of a separate test-only provider shim.

## Self-Check: PASSED

- Verified the summary file and all Wave 3 source/test files exist on disk.
- Verified commit hashes `8e75269` and `a356baf` exist in git history.
