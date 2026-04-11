---
phase: 04-openai-narration-and-cache
reviewed: 2026-04-11T10:35:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - packages/cli/src/bin/demohunter.ts
  - packages/cli/src/bin/demohunter.test.ts
  - packages/cli/src/commands/cache.ts
  - packages/cli/src/commands/cache.test.ts
  - packages/generator-playwright/src/narration/resolve-narration.ts
  - packages/generator-playwright/src/narration/resolve-narration.test.ts
  - packages/generator-playwright/src/output/subtitles.ts
  - packages/generator-playwright/src/output/subtitles.test.ts
  - packages/generator-playwright/src/output/write-generation-output.ts
  - packages/generator-playwright/src/output/write-generation-output.test.ts
  - packages/tts-core/src/cache/cache-store.ts
  - packages/tts-core/src/cache/cache-maintenance.ts
  - tests/e2e/generation-engine-contract.test.ts
  - tests/e2e/built-cli-bin-contract.test.ts
  - tests/integration/openai-narration-live.test.ts
  - tests/fixtures/tours/phase-04-narration.tour.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-11T10:35:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** clean

## Summary

Reviewed the Phase 04 implementation with emphasis on local cache correctness, missing-key failure behavior, subtitle generation boundaries, CLI surface area, and the new source/built/live contract coverage.

Focused checks:

- `packages/cli/src/bin/demohunter.ts:22-56` and `packages/cli/src/commands/cache.ts:31-85` keep the `cache` subcommands thin and delegate to shared `tts-core` helpers instead of forking cache policy in the CLI.
- `packages/tts-core/src/cache/cache-store.ts:89-140` and `packages/tts-core/src/cache/cache-maintenance.ts:58-109` correctly model cache-hit reuse, recoverable regeneration, conservative prune behavior, and local-only clear semantics.
- `packages/generator-playwright/src/narration/resolve-narration.ts:37-79`, `packages/generator-playwright/src/output/subtitles.ts:8-35`, and `packages/generator-playwright/src/output/write-generation-output.ts:40-76` preserve the Phase 04 contract: narration timing comes from cached audio, missing keys fail clearly on cache misses, and captions are emitted from narration segments only.
- `tests/e2e/generation-engine-contract.test.ts:27-145`, `tests/e2e/built-cli-bin-contract.test.ts:16-115`, and `tests/integration/openai-narration-live.test.ts:24-71` cover source CLI, built CLI, and gated real-API behavior with direct assertions on offline reuse, missing-key failures, caption artifacts, and cache lifecycle commands.

Targeted verification consulted during this review:

- `set -a; source .env; set +a; make verify`
- `set -a; source .env; set +a; bun test tests/integration/openai-narration-live.test.ts`

No bugs, security issues, or maintainability issues that require Phase 04 follow-up were found in the reviewed scope.

## Residual Risk

The main residual risk is operational rather than structural: the live OpenAI integration test depends on an available key and network access, so CI or local environments without those prerequisites will correctly skip that proof path. The deterministic source and built contracts still cover the default local-first behavior.

---

_Reviewed: 2026-04-11T10:35:00Z_
_Reviewer: Codex_
_Depth: standard_
