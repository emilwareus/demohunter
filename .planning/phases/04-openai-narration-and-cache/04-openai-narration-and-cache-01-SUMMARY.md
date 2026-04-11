---
phase: 04-openai-narration-and-cache
plan: 01
subsystem: tts
tags: [openai, tts, narration, cache-identity, typescript]
requires:
  - phase: 03-playwright-generation-engine
    provides: two-pass generation flow and resolved config loading
provides:
  - Canonical single-segment narration contracts in tts-core
  - Env-only OpenAI speech adapter in tts-openai
affects:
  - 04-02
  - 04-03
  - 04-04
  - generator-playwright
  - cli
tech-stack:
  added: []
  patterns:
    - Canonical narration request normalization lives in tts-core
    - OpenAI speech synthesis stays fetch-native and env-only
key-files:
  created:
    - packages/tts-core/src/contracts.ts
    - packages/tts-core/src/contracts.test.ts
    - packages/tts-openai/src/openai-provider.ts
    - packages/tts-openai/src/openai-provider.test.ts
    - .planning/phases/04-openai-narration-and-cache/04-openai-narration-and-cache-01-SUMMARY.md
  modified:
    - packages/tts-core/src/index.ts
    - packages/tts-openai/src/index.ts
key-decisions:
  - Keep narration text normalization in tts-core so cache identity stays deterministic before provider calls.
  - Read OPENAI_API_KEY lazily inside synthesize() so cache-hit flows can stay offline in later plans.
  - Keep the OpenAI adapter fetch-native and endpoint-specific instead of adding SDK or cache behavior.
patterns-established:
  - TTS packages expose one per-segment contract/result boundary for later cache and generator layers.
  - OpenAI provider returns raw bytes plus shared metadata and surfaces API failures explicitly.
requirements-completed: [TTS-01, TTS-02]
duration: 9m
completed: 2026-04-11
---

# Phase 04 Plan 01: OpenAI Narration Contract Summary

**Canonical narration contracts with normalized cache identity plus a thin env-only OpenAI speech adapter**

## Performance

- **Duration:** 9m
- **Started:** 2026-04-11T08:42:35Z
- **Completed:** 2026-04-11T08:51:10Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added a shared `NarrationRequest`/`NarrationProvider`/`NarrationSynthesisResult` contract in `tts-core` with deterministic text normalization and explicit `sampleRate`.
- Exported the supported OpenAI speech model list with `gpt-4o-mini-tts` pinned as the default-compatible path.
- Implemented a thin `v1/audio/speech` adapter that reads `OPENAI_API_KEY` from the environment only, returns raw audio bytes, and validates non-2xx API responses.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the shared narration contracts and request normalization rules** - `3f31e80` (test), `7529666` (feat)
2. **Task 2: Implement the thin env-only OpenAI speech adapter** - `dea0f59` (test), `f419b9f` (feat)

## Files Created/Modified
- `packages/tts-core/src/contracts.ts` - Canonical narration request, provider, result, and normalization helpers.
- `packages/tts-core/src/contracts.test.ts` - Contract, normalization, and supported-model regression tests.
- `packages/tts-core/src/index.ts` - Phase 4-safe `tts-core` export surface.
- `packages/tts-openai/src/openai-provider.ts` - Fetch-native OpenAI speech adapter with env-only auth and response validation.
- `packages/tts-openai/src/openai-provider.test.ts` - Adapter tests covering lazy auth lookup, payload shaping, raw bytes output, and API error handling.
- `packages/tts-openai/src/index.ts` - `tts-openai` export surface for the provider factory.

## Decisions Made

- Kept normalization local to `tts-core` instead of re-normalizing in the provider, so later cache-key work can use one canonical identity source.
- Delayed `OPENAI_API_KEY` lookup until `synthesize()` runs, matching the phase decision that missing keys should only matter on uncached synthesis.
- Used direct `fetch` calls to `https://api.openai.com/v1/audio/speech` rather than adding an SDK dependency or any credential/config abstraction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched the new contract test to `node:test` so package typecheck could pass**
- **Found during:** Task 1 (Define the shared narration contracts and request normalization rules)
- **Issue:** `packages/tts-core/tsconfig.json` includes `*.test.ts`, but the workspace does not expose `bun:test` typings to package-local `tsc -b` runs.
- **Fix:** Rewrote the new `tts-core` regression test to use `node:test` and `node:assert/strict` while still running it through `bun test`.
- **Files modified:** packages/tts-core/src/contracts.test.ts
- **Verification:** `bun test packages/tts-core/src/contracts.test.ts`; `bun x tsc -b packages/tts-core/tsconfig.json --pretty false`
- **Committed in:** `7529666`

**2. [Rule 3 - Blocking] Pointed the OpenAI adapter at built `tts-core` declarations instead of sibling source imports**
- **Found during:** Task 2 (Implement the thin env-only OpenAI speech adapter)
- **Issue:** Importing `../../tts-core/src/contracts.js` from `tts-openai` failed package typecheck because the sibling source file sits outside the package `rootDir` and `include` set.
- **Fix:** Used the built `packages/tts-core/dist/contracts.js` declarations for the shared provider/request/result types so `tts-openai` still implements the shared contract without editing shared tsconfig/package wiring.
- **Files modified:** packages/tts-openai/src/openai-provider.ts
- **Verification:** `bun x tsc -b packages/tts-openai/tsconfig.json --pretty false`; `bun x tsc -b packages/tts-core/tsconfig.json packages/tts-openai/tsconfig.json --pretty false`
- **Committed in:** `f419b9f`

**3. [Rule 2 - Missing Critical] Added explicit handling for non-2xx OpenAI speech responses**
- **Found during:** Task 2 (Implement the thin env-only OpenAI speech adapter)
- **Issue:** The plan pinned request shaping but did not explicitly require guarding the external API trust boundary when OpenAI returns an error response.
- **Fix:** Checked `response.ok`, surfaced HTTP status plus response text, and added a regression test for 400 responses.
- **Files modified:** packages/tts-openai/src/openai-provider.ts, packages/tts-openai/src/openai-provider.test.ts
- **Verification:** `bun test packages/tts-openai/src/openai-provider.test.ts`; `bun test packages/tts-core/src/contracts.test.ts packages/tts-openai/src/openai-provider.test.ts`; `bun x tsc -b packages/tts-openai/tsconfig.json --pretty false`
- **Committed in:** `f419b9f`

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical)
**Impact on plan:** All deviations were required to satisfy the plan’s verification commands and trust-boundary expectations. No scope creep beyond correctness.

## Issues Encountered

- `tts-openai` cannot currently consume sibling TypeScript source files directly under its package `tsconfig` boundaries. The adapter now uses the built `tts-core` declarations, which is sufficient for this plan but worth revisiting when shared package-reference wiring is added.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 now has one canonical narration request boundary for deterministic cache keys and generator integration.
- Future cache/generator work can call a tested env-only OpenAI adapter without broadening the provider boundary.
- No blockers for Plan 02, though shared package-reference wiring would remove the current need to consume built `tts-core` declarations from `tts-openai`.

## Self-Check: PASSED

- Verified summary target file exists.
- Verified task commit hashes `3f31e80`, `7529666`, `dea0f59`, and `f419b9f` exist in git history.
- Verified created contract/provider files exist on disk.

---
*Phase: 04-openai-narration-and-cache*
*Completed: 2026-04-11*
