---
phase: 05-portable-output-contract
plan: 01
subsystem: infra
tags: [manifest, zod, checksum, paths, portable-output]
requires:
  - phase: 04-openai-narration-and-cache
    provides: narrated output artifacts and replay-safe timing metadata that Phase 5 now formalizes
provides:
  - Strict `@demohunter/manifest` schema and parse boundary
  - SHA-256 checksum helpers for final exported artifacts
  - Output-root-relative POSIX path guards for portable manifests
affects:
  - 05-02
  - 05-03
  - 05-04
  - generator-playwright
tech-stack:
  added: [zod]
  patterns:
    - Portable manifest validation is centralized in one package boundary
    - Portable artifact descriptors always derive paths relative to the output root before hashing
key-files:
  created:
    - packages/manifest/src/schema.ts
    - packages/manifest/src/schema.test.ts
    - packages/manifest/src/checksum.ts
    - packages/manifest/src/checksum.test.ts
    - packages/manifest/src/paths.ts
    - packages/manifest/src/paths.test.ts
    - .planning/phases/05-portable-output-contract/05-portable-output-contract-01-SUMMARY.md
  modified:
    - packages/manifest/package.json
    - packages/manifest/src/index.ts
    - packages/manifest/tsconfig.json
    - bun.lock
key-decisions:
  - Keep the external manifest schema strict and versioned from day one so later generator work cannot silently widen the contract.
  - Require literal top-level artifact paths for baseline files and `audio/`-prefixed narration assets inside the schema.
  - Hash final file bytes with fixed SHA-256 metadata and normalize every portable path to POSIX separators.
patterns-established:
  - Package-level manifest consumers should import one `@demohunter/manifest` boundary instead of rebuilding schema fragments locally.
  - Portable output metadata must never carry absolute or escaping paths.
requirements-completed: [OUT-02, OUT-04]
duration: 12m
completed: 2026-04-13
---

# Phase 05 Plan 01: Portable Manifest Contract Summary

**A strict `@demohunter/manifest` package now defines the portable output schema, checksum metadata, and relative-path guardrails for later generator work**

## Performance

- **Duration:** 12m
- **Started:** 2026-04-13T05:48:00Z
- **Completed:** 2026-04-13T06:00:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added a strict Zod-backed portable manifest schema with a version constant and parse helper.
- Added SHA-256 checksum helpers that derive artifact metadata from final on-disk bytes.
- Added output-root-relative POSIX path normalization and rejection of empty or escaping paths.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the strict versioned manifest schema and parse boundary in `@demohunter/manifest`** - `c76f09d` (feat)
2. **Task 2: Add SHA-256 checksum helpers and portable relative-path guards to the manifest package** - `76f0f22` (feat)

## Files Created/Modified

- `packages/manifest/package.json` - Added the Bun source export and `zod` dependency for the package boundary.
- `packages/manifest/src/schema.ts` - Strict Phase 5 manifest schema, version constant, and parse helper.
- `packages/manifest/src/schema.test.ts` - Valid/invalid manifest coverage plus source/dist export checks.
- `packages/manifest/src/checksum.ts` - SHA-256 checksum and portable artifact descriptor helpers.
- `packages/manifest/src/checksum.test.ts` - Checksum and descriptor regression coverage.
- `packages/manifest/src/paths.ts` - Output-root-relative portable path guard.
- `packages/manifest/src/paths.test.ts` - Path normalization and escape rejection coverage.
- `packages/manifest/src/index.ts` - Single export surface for schema, checksum, and path helpers.
- `packages/manifest/tsconfig.json` - Excluded colocated Bun tests from package `tsc` builds.

## Decisions Made

- Used literal artifact paths for `video.mp4`, `video.webm`, `poster.jpg`, `captions.srt`, `captions.vtt`, and `chapters.json` so the external contract stays explicit.
- Required narration audio artifacts to live under `audio/` in the schema rather than relying on later runtime conventions.
- Kept checksum creation file-based and async so later output writing can reuse it directly against final exported bytes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded colocated Bun tests from the package TypeScript build**
- **Found during:** Task 1 verification
- **Issue:** `packages/manifest/tsconfig.json` was compiling `*.test.ts`, but this repo's package builds do not provide Bun test typings to `tsc -b`, which blocked the required package typecheck.
- **Fix:** Matched the repo's package convention by excluding `src/**/*.test.ts` from the package build while keeping those tests runnable through `bun test`.
- **Files modified:** `packages/manifest/tsconfig.json`
- **Verification:** `bun x tsc -b packages/manifest/tsconfig.json --pretty false`; `bun test packages/manifest`
- **Committed in:** `c76f09d`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for the planned verification commands to pass. No scope creep.

## Issues Encountered

None beyond the package `tsc`/Bun test typing mismatch handled above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 now has an authoritative manifest package for the generator and output writer to consume.
- Wave 2 can wire the generator to the closed video contract and typed output handoff without inventing schema details locally.
- No blockers for `05-02`.

## Self-Check: PASSED

- Verified `bun test packages/manifest`.
- Verified `bun test packages/manifest packages/generator-playwright/src/output/write-generation-output.test.ts`.
- Verified `bun x tsc -b packages/manifest/tsconfig.json --pretty false`.
- Verified task commits `c76f09d` and `76f0f22` exist in git history.
