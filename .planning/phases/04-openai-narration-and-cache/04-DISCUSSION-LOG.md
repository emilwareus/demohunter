# Phase 4: OpenAI Narration and Cache - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11T00:00:00Z
**Phase:** 04-openai-narration-and-cache
**Areas discussed:** Provider boundary and offline behavior, Cache identity and storage, Timing and subtitle source of truth, Cache CLI behavior

---

## Provider boundary and offline behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Env-only key boundary | Read `OPENAI_API_KEY` from environment only; cache hits stay local and uncached segments fail clearly when the key is missing. | ✓ |
| Config-managed credentials | Allow keys or provider auth data in `demohunter.config.ts`. | |
| Interactive credential flow | Prompt for credentials or launch an auth flow when generation needs TTS. | |

**User's choice:** `[auto] Env-only key boundary`
**Notes:** Auto-selected recommended default because PROJECT.md and the OSS spec already lock env-only OpenAI auth and offline cache-hit behavior.

---

## Cache identity and storage

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic content-addressed cache | Key cache entries by provider/model/voice/instructions/format/sampleRate/normalized text/version and store them locally under `.demohunter/cache`. | ✓ |
| Text-only cache key | Reuse audio by narration text alone with minimal metadata in the cache. | |
| Session-scoped temporary cache | Keep narration cache ephemeral per run and regenerate often. | |

**User's choice:** `[auto] Deterministic content-addressed cache`
**Notes:** Auto-selected recommended default because the OSS spec explicitly calls out collision-safe cache identity and local cache reuse as mandatory behavior.

---

## Timing and subtitle source of truth

| Option | Description | Selected |
|--------|-------------|----------|
| Real-audio timing from cache | Measure duration from cached audio files and generate subtitles from narration segments only. | ✓ |
| Heuristic text timing | Estimate durations from text length and synthesize subtitles from those estimates. | |
| Mixed event timeline subtitles | Blend narration, steps, and chapter events into subtitle timing. | |

**User's choice:** `[auto] Real-audio timing from cache`
**Notes:** Auto-selected recommended default because the product spec explicitly rejects text heuristics and requires subtitle generation from narration segments only.

---

## Cache CLI behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal local cache commands | Keep `list`, `prune`, and `clear` simple, inspectable, and conservative about deletion. | ✓ |
| Aggressive lifecycle management | Add opinionated pruning heuristics and broad automated cache cleanup behavior. | |
| Rich cache administration UI | Turn cache commands into a more advanced management layer with interactive flows. | |

**User's choice:** `[auto] Minimal local cache commands`
**Notes:** Auto-selected recommended default because Phase 4 scope is local-first CLI behavior, not a cache management framework.

---

## the agent's Discretion

- Exact metadata file format and duration-probing implementation
- Exact `cache list` presentation format
- Conservative prune rules that stay inside the locked local-first contract

## Deferred Ideas

- Manifest schema and checksums
- Full portable output finalization
- Managed/cloud TTS
