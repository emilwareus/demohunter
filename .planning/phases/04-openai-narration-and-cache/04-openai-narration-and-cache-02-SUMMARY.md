---
phase: 04-openai-narration-and-cache
plan: 02
subsystem: tts
tags: [tts, cache, narration, filesystem, integrity]
requires:
  - phase: 04-openai-narration-and-cache
    provides: canonical narration request normalization and env-only OpenAI synthesis from plan 01
provides:
  - Deterministic narration cache keys with schema versioning
  - Local on-disk narration cache reuse with integrity metadata and corruption recovery
  - Conservative cache list, prune, and clear helpers for later CLI wiring
affects:
  - 04-03
  - 04-04
  - generator-playwright
  - cli
tech-stack:
  added: []
  patterns:
    - Cache artifacts live as sibling audio and JSON metadata files under the configured local cache root
    - Healthy cache hits are validated from disk and never re-hit the provider
key-files:
  created:
    - packages/tts-core/src/cache/cache-key.ts
    - packages/tts-core/src/cache/cache-key.test.ts
    - packages/tts-core/src/cache/cache-store.ts
    - packages/tts-core/src/cache/cache-store.test.ts
    - packages/tts-core/src/cache/cache-maintenance.ts
    - packages/tts-core/src/cache/cache-maintenance.test.ts
    - .planning/phases/04-openai-narration-and-cache/04-openai-narration-and-cache-02-SUMMARY.md
  modified:
    - packages/tts-core/src/index.ts
key-decisions:
  - Store cache artifacts as `<hash>.<format>` plus `<hash>.json` under the local cache root so entries stay inspectable and easy to prune conservatively.
  - Validate byte size and SHA-256 on cache hits so tampered audio downgrades to a recoverable miss instead of being trusted.
  - Keep maintenance limited to disk-derived list/prune/clear primitives without age-based or LRU deletion heuristics.
patterns-established:
  - Narration cache metadata is the on-disk source of truth for audio path, duration, version, and integrity.
  - Cache maintenance operates only inside the configured cache root and treats obsolete or broken artifacts as removable.
requirements-completed: [TTS-04, TTS-05, TTS-06]
duration: 9m
completed: 2026-04-11
---

# Phase 04 Plan 02: Local Narration Cache Summary

**Deterministic on-disk narration cache with integrity-checked reuse, corruption recovery, and conservative maintenance helpers**

## Performance

- **Duration:** 9m
- **Started:** 2026-04-11T09:00:05Z
- **Completed:** 2026-04-11T09:09:24Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Added a deterministic cache identity helper that hashes the canonical narration request fields plus an explicit cache schema version.
- Implemented a local cache store that persists audio and JSON metadata under `.demohunter/cache`, measures duration from the written file, and reuses healthy entries without provider calls.
- Added disk-driven list, prune, and clear helpers that keep cleanup conservative and scoped to the cache root.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement deterministic narration cache keys** - `f304357` (test), `658d4da` (feat)
2. **Task 2: Implement local cache read/write, measured metadata, and corrupt-entry recovery** - `12dd0d9` (test), `e1c8e79` (feat)
3. **Task 3: Add conservative cache maintenance primitives for later CLI wiring** - `a32cc0e` (test), `8e88638` (feat), `4a50c18` (refactor)

## Files Created/Modified
- `packages/tts-core/src/cache/cache-key.ts` - Deterministic narration cache identity and SHA-256 key helpers.
- `packages/tts-core/src/cache/cache-key.test.ts` - Regression coverage for stable reuse, field divergence, and filesystem-safe keys.
- `packages/tts-core/src/cache/cache-store.ts` - Local cache resolution, on-disk metadata validation, duration probing, and corruption recovery.
- `packages/tts-core/src/cache/cache-store.test.ts` - Cache hit, miss, persistence, and recoverable-corruption tests.
- `packages/tts-core/src/cache/cache-maintenance.ts` - Local list/prune/clear primitives rooted to the cache directory.
- `packages/tts-core/src/cache/cache-maintenance.test.ts` - Maintenance tests for disk-derived listing, conservative prune behavior, and scoped cache clearing.
- `packages/tts-core/src/index.ts` - Public `tts-core` exports for cache identity, resolve, duration, and maintenance helpers.

## Decisions Made

- Kept the cache layout flat and inspectable with sibling metadata/audio files instead of nested opaque storage.
- Used checksum and byte-size validation on cache hits so offline reuse still defends against tampered or partial files.
- Defaulted duration probing to `ffprobe` while keeping the cache store injectable for tests and later generator integration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced Bun-only hashing with Node crypto in the cache store**
- **Found during:** Task 2 (Implement local cache read/write, measured metadata, and corrupt-entry recovery)
- **Issue:** The first checksum implementation used `Bun.hash`, which is unavailable in the package-local runtime/typecheck surface and broke both tests and `tsc -b`.
- **Fix:** Switched checksum generation to `node:crypto` so `tts-core` stays portable under Bun test and package-local TypeScript builds.
- **Files modified:** packages/tts-core/src/cache/cache-store.ts
- **Verification:** `bun test packages/tts-core/src/cache/cache-store.test.ts`; `bun x tsc -b packages/tts-core/tsconfig.json --pretty false`
- **Committed in:** `e1c8e79`

**2. [Rule 3 - Blocking] Created sibling output directories explicitly in maintenance fixtures**
- **Found during:** Task 3 (Add conservative cache maintenance primitives for later CLI wiring)
- **Issue:** The new prune/clear tests wrote generated-output sibling files without creating their parent directory first, so verification failed before the cache-scope assertions ran.
- **Fix:** Updated the maintenance fixtures to create the sibling output directory before writing test artifacts outside the cache root.
- **Files modified:** packages/tts-core/src/cache/cache-maintenance.test.ts
- **Verification:** `bun test packages/tts-core/src/cache/cache-maintenance.test.ts`; `bun test packages/tts-core/src/cache/cache-key.test.ts packages/tts-core/src/cache/cache-store.test.ts packages/tts-core/src/cache/cache-maintenance.test.ts`
- **Committed in:** `4a50c18`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to satisfy the plan’s verification steps and keep the cache layer portable and conservative. No scope creep beyond correctness.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `tts-core` now exposes deterministic cache identity, local resolve/recovery, and conservative maintenance helpers for generator and CLI integration.
- Plan 04-03 can resolve narration segments from cache and trust persisted duration metadata instead of heuristics.
- Plan 04-04 can wrap the shared list/prune/clear helpers directly in CLI commands without re-implementing filesystem rules.

## Self-Check: PASSED

- Verified the summary file and all cache-related source/test files created by this plan exist on disk.
- Verified task commit hashes `f304357`, `658d4da`, `12dd0d9`, `e1c8e79`, `a32cc0e`, `8e88638`, and `4a50c18` exist in git history.
