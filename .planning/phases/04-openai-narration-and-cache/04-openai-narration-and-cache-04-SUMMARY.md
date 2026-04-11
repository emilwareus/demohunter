---
phase: 04-openai-narration-and-cache
plan: 04
subsystem: cli
tags: [cli, cache, e2e, integration, openai]
requires:
  - phase: 04-openai-narration-and-cache
    provides: generator narration resolution, caption output, and deterministic local cache behavior from plans 01-03
provides:
  - CLI `cache list|prune|clear` commands over the shared local narration cache
  - Source and built CLI contracts for narrated generation, offline cache reuse, missing-key failure, and corrupt-cache recovery
  - Gated live OpenAI narration integration proof
affects:
  - cli
  - tests
  - built-cli
tech-stack:
  added: []
  patterns:
    - CLI cache commands stay thin wrappers over `tts-core` maintenance helpers
    - Live OpenAI verification is opt-in and environment-gated, while default verification stays deterministic
key-files:
  created:
    - .planning/phases/04-openai-narration-and-cache/04-openai-narration-and-cache-04-SUMMARY.md
  modified:
    - packages/cli/src/bin/demohunter.ts
    - packages/cli/src/bin/demohunter.test.ts
    - packages/cli/src/commands/cache.ts
    - packages/cli/src/commands/cache.test.ts
    - tests/e2e/generation-engine-contract.test.ts
    - tests/e2e/built-cli-bin-contract.test.ts
    - tests/e2e/authoring-sdk-contract.test.ts
    - tests/e2e/init-generate-smoke.test.ts
    - tests/fixtures/tours/phase-04-narration.tour.ts
    - tests/integration/openai-narration-live.test.ts
key-decisions:
  - Keep cache operations local-only and non-interactive, with JSON output suitable for inspection and scripting.
  - Prove real OpenAI synthesis through one gated integration test, then prove offline reuse by removing `OPENAI_API_KEY`.
  - Treat caption files as part of the baseline output contract for successful generation, including earlier e2e fixtures.
patterns-established:
  - Full-suite e2e reliability depends on longer budgets for the long narrated source/built CLI contracts.
  - Temp workspace expectations on macOS need canonical `realpath()` roots so `/var` and `/private/var` do not create false failures.
requirements-completed: [TTS-07, TTS-08, TTS-09]
duration: 1h
completed: 2026-04-11
---

# Phase 04 Plan 04: CLI Cache And Contract Summary

**The CLI now exposes the local narration cache lifecycle, and Phase 4 is proven through source CLI, built CLI, and a gated live OpenAI integration test**

## Performance

- **Duration:** 1h
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added `demohunter cache list`, `demohunter cache prune`, and `demohunter cache clear` as first-class CLI subcommands backed by shared cache helpers.
- Extended the source CLI contract to prove narrated output, caption artifacts, offline cache reuse, missing-key failure, and corrupt-cache recovery.
- Extended the built CLI contract to prove the same narration/cache behavior through the compiled bin.
- Added a gated live OpenAI narration integration test and verified it against the real API with `OPENAI_API_KEY` plus `DEMOHUNTER_RUN_LIVE_OPENAI_TESTS=1`.
- Updated earlier e2e expectations so caption files are treated as part of the baseline successful output set.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add minimal local-first cache commands to the CLI** - `9afb9e9` (feat)
2. **Task 2: Add source CLI narration/cache contracts and gated live integration coverage** - `5610468` (test)
3. **Task 3: Add built CLI narration/cache contract coverage** - `a3e1476` (test)

## Files Created/Modified

- `packages/cli/src/commands/cache.ts` - Thin CLI wrapper for `tts-core` cache list/prune/clear helpers.
- `packages/cli/src/bin/demohunter.ts` - Dispatch for `cache` subcommands.
- `packages/cli/src/bin/demohunter.test.ts` - CLI dispatch and usage coverage for `cache`.
- `packages/cli/src/commands/cache.test.ts` - Unit coverage for local cache command behavior.
- `tests/e2e/generation-engine-contract.test.ts` - Source CLI proof for narrated generation, offline reuse, missing-key failure, and corrupt-cache recovery.
- `tests/e2e/built-cli-bin-contract.test.ts` - Built CLI proof for narrated generation and cache lifecycle behavior.
- `tests/integration/openai-narration-live.test.ts` - Gated real-API narration synthesis and offline cache reuse proof.
- `tests/e2e/authoring-sdk-contract.test.ts` - Regression expectations updated for caption artifacts.
- `tests/e2e/init-generate-smoke.test.ts` - Regression expectations updated for caption artifacts.

## Deviations From Plan

### Auto-fixed Issues

**1. Full-suite e2e budgets were too short for the narrated source/built CLI contracts**
- **Found during:** final regression verification with `make verify`
- **Issue:** the long narrated source and built CLI tests passed in isolation but hit the default 30s budgets during the full e2e suite.
- **Fix:** increased the source narrated contract timeout to `45_000` and the built narrated contract timeout to `45_000`.
- **Files modified:** `tests/e2e/generation-engine-contract.test.ts`, `tests/e2e/built-cli-bin-contract.test.ts`
- **Verification:** `bun test tests/e2e/generation-engine-contract.test.ts`; `bun test tests/e2e/built-cli-bin-contract.test.ts`; `set -a; source .env; set +a; make verify`

**2. macOS temp-root path normalization caused false `/var` vs `/private/var` mismatches**
- **Found during:** source/built CLI contract verification
- **Issue:** cache-path assertions could fail depending on whether the runtime reported canonicalized temp roots.
- **Fix:** canonicalized temp project roots via `realpath()` in the built CLI contract, and aligned the source contract expectations with canonical paths.
- **Files modified:** `tests/e2e/built-cli-bin-contract.test.ts`, `tests/e2e/generation-engine-contract.test.ts`
- **Verification:** `bun test tests/e2e/generation-engine-contract.test.ts`; `bun test tests/e2e/built-cli-bin-contract.test.ts`

## Verification

- `bun test packages/cli/src/bin/demohunter.test.ts packages/cli/src/commands/cache.test.ts`
- `bun test tests/e2e/generation-engine-contract.test.ts`
- `bun test tests/e2e/built-cli-bin-contract.test.ts`
- `set -a; source .env; set +a; bun test tests/integration/openai-narration-live.test.ts`
- `bun test tests/e2e/authoring-sdk-contract.test.ts`
- `bun test tests/e2e/init-generate-smoke.test.ts`
- `bun x tsc -b tsconfig.json --pretty false`
- `set -a; source .env; set +a; make verify`

## Self-Check: PASSED

- Verified the live OpenAI integration test passed against the real API with env-gating.
- Verified `make verify` completed successfully after the timeout and path-normalization hardening.
- Verified the summary file exists and the Wave 4 commits `9afb9e9`, `5610468`, and `a3e1476` exist in git history.
