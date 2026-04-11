# Phase 4: OpenAI Narration and Cache - Research

**Completed:** 2026-04-11  
**Phase:** 04-openai-narration-and-cache  
**Status:** Ready for planning

## Research Goal

Constrain the Phase 4 implementation around current OpenAI TTS behavior, deterministic local cache rules, real-audio timing, subtitle generation, and offline regeneration so the planner can break the work into executable plans without reopening product decisions.

## Sources

### Project sources
- `docs/phase_1_oss_core.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/04-openai-narration-and-cache/04-CONTEXT.md`
- `packages/sdk/src/config.ts`
- `packages/cli/src/config/load-config.ts`
- `packages/generator-playwright/src/execute/collect-timeline.ts`
- `packages/generator-playwright/src/generate.ts`
- `packages/tts-core/src/index.ts`
- `packages/tts-openai/src/index.ts`

### Official external sources
- [OpenAI Text to speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio speech API reference](https://platform.openai.com/docs/api-reference/audio/createSpeech)
- [OpenAI GPT-4o mini TTS model page](https://platform.openai.com/docs/models/gpt-4o-mini-tts)
- [OpenAI tts-1 model page](https://platform.openai.com/docs/models/tts-1)
- [OpenAI tts-1-hd model page](https://platform.openai.com/docs/models/tts-1-hd)

## Findings

### 1. The Phase 4 provider should target `v1/audio/speech` directly

The current official OpenAI TTS surface for file generation is the Audio API speech endpoint. The docs and model pages show `gpt-4o-mini-tts`, `tts-1`, and `tts-1-hd` as the relevant models for the speech endpoint, matching the existing OSS spec.

**Implication for planning:** Phase 4 does not need a broader provider abstraction yet than “produce one narration audio file plus provider metadata from text + options.” The OpenAI provider package can stay thin and endpoint-focused.

### 2. Output format is a first-class cache identity input

OpenAI’s current TTS docs list multiple output formats, with `mp3` as the default and others such as `opus`, `aac`, `flac`, `wav`, and `pcm` supported. Because the output bytes differ by format, cache identity must include the requested output format and any resolved audio metadata that affects the resulting file.

**Implication for planning:** Cache keys cannot be based on narration text alone. They must include provider/model/voice/instructions/format and any measured audio metadata the implementation treats as part of identity.

### 3. Real-audio timing should be measured from the cached file on disk

The OSS spec is explicit that narration duration must come from the real audio file rather than text heuristics. Phase 3 already established a two-pass structure where timing is resolved before recording, so the right seam is: ensure audio exists in cache during pass 1, then measure its duration from disk and feed that measured value into replay timing and subtitle construction.

**Implication for planning:** Subtitle generation and replay timing should share one measured narration-segment contract derived from cached audio files, not separate timing logic.

### 4. Offline generation is a cache read-path requirement, not a fallback mode

The product docs and requirements consistently treat offline regeneration as a consequence of deterministic cache hits: if every required narration segment is already cached, generation should succeed without `OPENAI_API_KEY`; if any segment is missing, generation should fail clearly. This is simpler and more reliable than trying to offer mixed degraded behavior.

**Implication for planning:** Missing-key behavior belongs in the cache-or-provider resolution layer. Generator orchestration should ask for narration segments and receive either cached assets, freshly synthesized assets, or a clear uncached/missing-key failure.

### 5. Subtitle generation belongs in Phase 4, but manifest/poster work still does not

Roadmap and requirements place subtitle output in Phase 4 (`OUT-03`) but keep poster and manifest finalization in Phase 5. Phase 4 therefore needs enough narration-segment structure to write `captions.srt` and `captions.vtt`, but should not overreach into the final manifest contract.

**Implication for planning:** A subtitle-focused narration segment type is appropriate in Phase 4; manifest schema/version/checksum work remains deferred.

### 6. Cache CLI commands should be built on shared cache primitives

The CLI surface in the OSS spec is small: `cache list`, `cache prune`, and `cache clear`. These commands should inspect or mutate the same on-disk cache metadata used by generation rather than recreating separate CLI-only filesystem rules.

**Implication for planning:** Phase 4 should produce a shared cache service in `tts-core`, then wire thin CLI commands on top of it.

## Constraints Carried Forward

- DemoHunter remains a thin wrapper on top of Playwright.
- App readiness/bootstrap stays in user Playwright code.
- `OPENAI_API_KEY` remains environment-only.
- Output remains rooted under `.demohunter/<tour-id>/`.
- Phase 4 adds narration/cache/subtitles, not manifest finalization or cloud behavior.

## Recommended Planning Shape

1. **Provider contract + OpenAI adapter**
   - Fill `tts-core` and `tts-openai` package seams.
   - Define request/response shape around one narration segment at a time.

2. **Deterministic cache engine**
   - Key generation, metadata persistence, read/write flows, integrity checks, corrupt-entry recovery.
   - Local-only storage under `.demohunter/cache`.

3. **Generator integration for measured durations + subtitles**
   - Ensure narration exists during pass 1.
   - Measure audio durations from cached files.
   - Produce subtitle segments and write `captions.srt` / `captions.vtt`.

4. **CLI cache commands + offline regeneration validation**
   - `cache list`, `cache prune`, `cache clear`.
   - Source-level and built CLI proof for cache hits, cache misses, missing-key failures, and offline reruns.

## Open Questions Resolved for Planning

1. **Should Phase 4 rely on current official OpenAI speech models or invent an abstraction-first provider layer?**
   - Use the current official OpenAI speech models and keep the provider layer thin.

2. **Should offline support be treated as a special mode?**
   - No. It should emerge naturally from deterministic cache-hit behavior.

3. **Should subtitle timing come from heuristics, provider estimates, or disk-measured audio?**
   - Disk-measured cached audio is the source of truth.

## Risks to Watch During Planning

- Do not let provider request-shaping decisions leak secrets into config files or generated artifacts.
- Do not couple cache identity to unstable incidental fields that would break reuse on identical requests.
- Do not generate subtitles from step/chapter events; Phase 4 scope is narration-only subtitle timing.
- Do not defer offline failure-path coverage; it is part of the phase goal, not optional hardening.

