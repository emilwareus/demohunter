# Phase 4: OpenAI Narration and Cache - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add OpenAI-backed narration synthesis, deterministic cache behavior, subtitle generation, and offline regeneration support on top of the Phase 3 generation engine. This phase covers provider-backed audio generation, cache identity and lifecycle, real-audio duration measurement, subtitle generation, and cache CLI behavior; it does not finalize the full portable output manifest or cloud ingestion contract.

</domain>

<decisions>
## Implementation Decisions

### Provider boundary and offline behavior
- **D-01:** Phase 4 should keep the provider boundary env-only: `OPENAI_API_KEY` is read from environment variables only, with no credential prompts, config-file secrets, or custom auth flow.
- **D-02:** Cache hits should remain fully local and offline-capable; missing `OPENAI_API_KEY` should fail only when an uncached narration segment is actually required.
- **D-03:** The default OpenAI narration choice should remain `gpt-4o-mini-tts`, while Phase 4 also supports the spec-listed OpenAI speech models without changing the local-first contract.

### Cache identity and storage
- **D-04:** Narration cache keys should be deterministic and content-addressed, incorporating provider, model, voice, instructions, format, sample rate, normalized text, and a version field so materially different requests never collide.
- **D-05:** Cache storage should stay local under `.demohunter/cache`, with audio files and integrity metadata persisted on disk rather than hidden in process memory or opaque external stores.
- **D-06:** Corrupt cache entries should be treated as recoverable misses and regenerated automatically instead of requiring manual repair first.

### Timing and subtitle source of truth
- **D-07:** Narration timing must come from measured duration of the real cached audio file, not text heuristics or request-time estimates.
- **D-08:** Subtitle generation should be derived from narration segments only, not from chapters, steps, highlights, or other runtime events.

### Cache CLI behavior
- **D-09:** `demohunter cache list`, `prune`, and `clear` should stay minimal and local-first rather than becoming a cache-management framework.
- **D-10:** Pruning should be conservative by default: safe cleanup of invalid, obsolete, or clearly removable cache entries is preferred over aggressive deletion heuristics that risk destroying useful offline assets.

### the agent's Discretion
- Exact on-disk metadata layout, audio-duration probing mechanism, and cache integrity schema can be designed during research and planning as long as they support deterministic reuse and corrupt-entry recovery.
- The exact CLI table/output formatting for cache commands is open to planning, provided the commands remain inspectable, predictable, and local-only.
- Subtitle serialization details can be chosen during planning as long as `captions.srt` and `captions.vtt` both come directly from narration timing data.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope
- `docs/GOAL.md` - Product definition, Playwright-first boundary, and narration-on-top positioning.
- `docs/phase_1_oss_core.md` - Canonical v1 OSS spec, including TTS/cache requirements, CLI commands, offline behavior, and subtitle/output expectations.

### Planning artifacts
- `.planning/PROJECT.md` - Project principles and non-negotiables, especially two-pass generation, env-only OpenAI auth, and mandatory narration caching.
- `.planning/REQUIREMENTS.md` - Phase 4 requirement mapping for `TTS-01` through `TTS-09` and `OUT-03`.
- `.planning/ROADMAP.md` - Phase 4 goal, success criteria, and plan slots.
- `.planning/phases/02-tour-authoring-sdk/02-CONTEXT.md` - Prior decisions that keep authored narration declarative and inline in normal Playwright flow.
- `.planning/phases/03-playwright-generation-engine/03-CONTEXT.md` - Prior decisions that lock direct Playwright behavior, strict replay, and `.demohunter/<tour-id>/` output roots.
- `.planning/phases/03-playwright-generation-engine/03-VERIFICATION.md` - Phase 3 verification notes that establish the current generator behavior Phase 4 extends.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/sdk/src/config.ts` already defines shared `tts` config fields for `provider`, `model`, `voice`, `format`, and `instructions`, plus the local `cacheDir` default.
- `packages/cli/src/config/load-config.ts` already resolves the shared config shape, so Phase 4 can reuse the existing loader contract instead of inventing a second TTS config surface.
- `packages/generator-playwright/src/execute/collect-timeline.ts` and `packages/generator-playwright/src/execute/generator-types.ts` already produce ordered narration events, which gives Phase 4 a concrete seam for cache lookup, duration measurement, and subtitle segment construction.
- `packages/generator-playwright/src/generate.ts` already orchestrates pass 1 before the recorded pass, which is the right place to ensure narration exists in cache before recording starts.
- `packages/tts-core/src/index.ts` and `packages/tts-openai/src/index.ts` exist as package shells, so Phase 4 can fill the intended provider/cache boundaries without reshaping the monorepo.

### Established Patterns
- The repo consistently prefers thin identity/config helpers and explicit package boundaries over hidden magic.
- Phase 3 locked direct Playwright behavior and strict replay; Phase 4 should extend timing and output behavior without adding app-readiness automation or turning DemoHunter into a framework.
- Source-level and built CLI consumer paths are already treated as product contracts, so Phase 4 should preserve both when adding provider-backed narration and cache commands.

### Integration Points
- The Phase 4 TTS/cache layer should connect to pass 1 so narration audio and exact timing are resolved before recording begins.
- Cache commands belong in `packages/cli` but should route through shared cache logic rather than duplicating filesystem rules in the CLI.
- Subtitle generation should plug into the same narration timeline data that Phase 3 now uses for deterministic replay, then feed the later output-contract work in Phase 5.

</code_context>

<specifics>
## Specific Ideas

- Keep the OpenAI integration boring and explicit: environment key only, no auth UX.
- Treat cache reuse as a reliability feature, not just a cost optimization; offline reruns matter.
- Preserve the Phase 3 pattern where runtime correctness comes from actual generated artifacts on disk, not heuristics.

</specifics>

<deferred>
## Deferred Ideas

- Manifest schema finalization and checksum/versioning - Phase 5.
- Full output portability guarantees for future cloud ingest - Phase 5.
- Managed/cloud TTS or remote generation without a user-managed OpenAI key - cloud offering only.

</deferred>

---

*Phase: 04-openai-narration-and-cache*
*Context gathered: 2026-04-11*
