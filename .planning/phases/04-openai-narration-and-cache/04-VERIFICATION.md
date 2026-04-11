---
phase: 04-openai-narration-and-cache
verified: 2026-04-11T10:37:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification: []
---

# Phase 04: OpenAI Narration And Cache Verification Report

**Phase Goal:** Add local OpenAI-backed narration synthesis with deterministic caching, narration-derived captions, CLI cache commands, and end-to-end source/built/live proof paths.
**Verified:** 2026-04-11T10:37:00Z
**Status:** passed
**Re-verification:** Yes - verified after final e2e timeout hardening

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `demohunter` exposes local cache lifecycle commands for inspect, conservative cleanup, and clear. | ✓ VERIFIED | `packages/cli/src/bin/demohunter.ts:22-56` dispatches `cache <list|prune|clear>`, and `packages/cli/src/commands/cache.ts:31-85` delegates each action to `tts-core` helpers while returning JSON summaries. |
| 2 | Narration resolution is deterministic and cache-backed, using real cached audio duration instead of heuristic timing. | ✓ VERIFIED | `packages/generator-playwright/src/narration/resolve-narration.ts:37-79` resolves narration through the cache/provider layer; `packages/tts-core/src/cache/cache-store.ts:89-140` reuses ready cache entries or regenerates recoverable misses; `packages/tts-core/src/cache/cache-store.ts:142-164` measures duration from real audio. |
| 3 | Cache hits succeed without `OPENAI_API_KEY`, while uncached misses fail clearly when the key is absent. | ✓ VERIFIED | The missing-key error is wrapped explicitly in `packages/generator-playwright/src/narration/resolve-narration.ts:70-76`. Source CLI coverage proves offline reruns and uncached failure in `tests/e2e/generation-engine-contract.test.ts:28-103`; built CLI coverage proves the same in `tests/e2e/built-cli-bin-contract.test.ts:54-114`. |
| 4 | Caption files are generated from narration segments only. | ✓ VERIFIED | `packages/generator-playwright/src/output/subtitles.ts:8-35` serializes only `NarrationSegment[]`, and `packages/generator-playwright/src/output/write-generation-output.ts:40-76` writes `captions.srt` plus `captions.vtt` beside `chapters.json` and the final video. |
| 5 | Successful generation emits caption artifacts as part of the baseline output contract. | ✓ VERIFIED | Source CLI assertions in `tests/e2e/generation-engine-contract.test.ts:51-78` require `captions.srt` and `captions.vtt`; built CLI assertions in `tests/e2e/built-cli-bin-contract.test.ts:38-49,79-97` require the same; earlier regression suites were updated in `tests/e2e/authoring-sdk-contract.test.ts:35-52` and `tests/e2e/init-generate-smoke.test.ts:41-60`. |
| 6 | Corrupt cache entries are recoverable through normal prune/regenerate flow instead of manual repair. | ✓ VERIFIED | `packages/tts-core/src/cache/cache-maintenance.ts:58-109` removes invalid/obsolete metadata and orphaned audio conservatively. `tests/e2e/generation-engine-contract.test.ts:106-145` proves prune keeps healthy entries, removes corrupt artifacts, and generation still succeeds afterward. |
| 7 | The compiled CLI preserves the same local narration/cache behavior as the source CLI. | ✓ VERIFIED | `tests/e2e/built-cli-bin-contract.test.ts:54-114` proves narrated generation, caption output, `cache list`, offline reuse, `cache clear`, and missing-key failure through `packages/cli/dist/bin/demohunter.js`. |
| 8 | A gated live integration test proves real OpenAI synthesis once, then local cache reuse without another live call. | ✓ VERIFIED | `tests/integration/openai-narration-live.test.ts:24-71` requires both `OPENAI_API_KEY` and `DEMOHUNTER_RUN_LIVE_OPENAI_TESTS=1`, asserts the first resolve comes from `provider`, removes `OPENAI_API_KEY`, then asserts the second resolve comes from `cache` with the same audio path and metadata. This was executed successfully during verification. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/cli/src/commands/cache.ts` | CLI wrapper for list/prune/clear | ✓ VERIFIED | Exists, substantive, and local-only. |
| `tests/e2e/generation-engine-contract.test.ts` | Source CLI narration/cache contract proof | ✓ VERIFIED | Exists and proves narrated output, offline reuse, missing-key failure, and corrupt-cache recovery. |
| `tests/e2e/built-cli-bin-contract.test.ts` | Built CLI narration/cache contract proof | ✓ VERIFIED | Exists and proves the compiled bin behaves like the source path. |
| `tests/integration/openai-narration-live.test.ts` | Gated real OpenAI narration proof | ✓ VERIFIED | Exists, env-gated, and executed successfully with the local `.env`. |
| `packages/generator-playwright/src/output/subtitles.ts` | Narration-only subtitle serializer | ✓ VERIFIED | Exists and consumes narration segments directly. |
| `packages/generator-playwright/src/narration/resolve-narration.ts` | Generator-facing narration/cache bridge | ✓ VERIFIED | Exists and carries the cache-or-provider contract into generation. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/cli/src/bin/demohunter.ts` | `packages/cli/src/commands/cache.ts` | CLI subcommand dispatch | WIRED | `runCli()` dispatches validated `cache` actions at `packages/cli/src/bin/demohunter.ts:33-39`. |
| `packages/cli/src/commands/cache.ts` | `packages/tts-core/src/cache/cache-maintenance.ts` | shared local cache rules | WIRED | `cacheCommand()` calls `listNarrationCacheEntries`, `pruneNarrationCache`, and `clearNarrationCache` from `tts-core` at `packages/cli/src/commands/cache.ts:43-84`. |
| `packages/generator-playwright/src/narration/resolve-narration.ts` | `packages/tts-core/src/cache/cache-store.ts` | cache-or-provider narration resolution | WIRED | `resolveNarrationSegment()` delegates to `resolveNarrationFromCache()` at `packages/generator-playwright/src/narration/resolve-narration.ts:56-61`. |
| `packages/generator-playwright/src/output/write-generation-output.ts` | `packages/generator-playwright/src/output/subtitles.ts` | caption file generation | WIRED | `writeGenerationOutput()` serializes and writes subtitle files at `packages/generator-playwright/src/output/write-generation-output.ts:50-67`. |
| `tests/e2e/generation-engine-contract.test.ts` | `packages/cli/src/bin/demohunter.ts` | source CLI contract | WIRED | The test drives the real source bin through `generate` and `cache` commands from a temp consumer repo. |
| `tests/e2e/built-cli-bin-contract.test.ts` | `packages/cli/dist/bin/demohunter.js` | built CLI contract | WIRED | The test rebuilds and exercises the compiled bin from a fresh temp repo. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 04 unit and package coverage | `bun test packages/cli/src/bin/demohunter.test.ts packages/cli/src/commands/cache.test.ts` | `9 pass, 0 fail` | ✓ PASS |
| Source narration/cache contract | `bun test tests/e2e/generation-engine-contract.test.ts` | `3 pass, 0 fail` | ✓ PASS |
| Built CLI narration/cache contract | `bun test tests/e2e/built-cli-bin-contract.test.ts` | `2 pass, 0 fail` | ✓ PASS |
| Live OpenAI narration proof | `set -a; source .env; set +a; bun test tests/integration/openai-narration-live.test.ts` | `1 pass, 0 fail` | ✓ PASS |
| Workspace type safety | `bun x tsc -b tsconfig.json --pretty false` | exit code `0` | ✓ PASS |
| Top-level regression suite | `set -a; source .env; set +a; make verify` | exit code `0` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `TTS-07` | `04-03`, `04-04` | Cached narration can be reused locally without re-synthesizing. | ✓ SATISFIED | Cache hits return `source: "cache"` in `packages/tts-core/src/cache/cache-store.ts:111-115`, and source/built/live tests all prove reuse without `OPENAI_API_KEY`. |
| `TTS-08` | `04-03`, `04-04` | Uncached narration fails clearly when the OpenAI key is missing. | ✓ SATISFIED | `packages/generator-playwright/src/narration/resolve-narration.ts:70-76` wraps the missing-key failure, and both source/built e2e suites assert the clear error. |
| `TTS-09` | `04-04` | Developers can inspect, prune, and clear the local narration cache through the CLI. | ✓ SATISFIED | `packages/cli/src/bin/demohunter.ts:33-39` plus `packages/cli/src/commands/cache.ts:43-84`; source/built contracts invoke all three commands successfully. |
| `OUT-03` | `04-03` | Subtitle files are emitted from narration segments only. | ✓ SATISFIED | `packages/generator-playwright/src/output/subtitles.ts:8-35` and source contract assertions on emitted captions. |

### Anti-Patterns Found

No blocker or warning anti-patterns were found in the scoped Phase 04 implementation. The CLI remains thin, cache policy remains centralized, and the live API path stays correctly gated by environment variables.

### Human Verification Required

None. The phase goal is fully covered by automated source, built, and live integration verification, and no remaining acceptance criterion depends on visual or experiential judgment.

### Gaps Summary

No blocking gaps were found. Phase 04 achieves the planned local-first narration/cache goal end to end in code, tests, and real API verification.

---

_Verified: 2026-04-11T10:37:00Z_
_Verifier: Codex_
