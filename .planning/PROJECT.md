# DemoHunter

## What This Is

DemoHunter is an open-source TypeScript CLI and SDK for creating narrated product demos programmatically from Playwright-style `.tour.ts` files. It runs locally, generates portable demo assets into `.demohunter/`, and uses OpenAI text-to-speech only for narration generation. The cloud offering is a later additive product, not a dependency of the OSS core.

## Core Value

Developers can turn normal Playwright automation into portable narrated demo assets locally, without depending on a hosted backend.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Scaffold a working Bun/TypeScript monorepo with CLI, SDK, generator, TTS, manifest, and starter project support.
- [ ] Let developers author narrated demos in `.tour.ts` files using a thin Playwright wrapper and helper primitives.
- [ ] Run a reliable two-pass generation flow that writes local video, subtitles, poster, chapters, manifest, and cached narration into `.demohunter/<tour-id>/`.
- [ ] Reuse cached narration automatically and support offline regeneration when required audio already exists on disk.
- [ ] Ship examples, docs, and an agent companion skill so DemoHunter is usable without maintainer hand-holding.

### Out of Scope

- Hosted watch pages, uploads, managed TTS, and sharing links - these belong to the later cloud offering.
- Built-in playback UI - OSS should generate portable output only.
- Auth, session, and bootstrap abstractions on top of Playwright - users keep app-specific setup in their own Playwright code.
- Plugin infrastructure, browser-based editing, and unscripted screen recording - outside the intentionally narrow OSS scope.

## Context

This project is defined by the repository docs in `docs/GOAL.md`, `docs/INITIAL_RESEARCH.md`, `docs/phase_1_oss_core.md`, and `docs/phase_2_cloud_offering.md`. Phase 1 OSS Core is the entire v1 scope for this initialization; Phase 2 Cloud Offering is explicitly deferred.

The product is local-first and TypeScript-only: Bun workspace, TypeScript 5+, ESM-first, direct Playwright usage (not `@playwright/test`), and ffmpeg-backed muxing/asset generation. The generated output contract is shared between OSS and Cloud so cloud ingest can happen later from `.demohunter/<tour-id>/` alone.

The generation architecture is intentionally two-pass. Pass 1 resolves narration, timing, and cached audio without recording latency. Pass 2 replays the tour in a fresh browser context, records video, waits on real narration durations plus hold padding, and writes the final output set. Narration caching is mandatory because repeat generations should not keep paying TTS costs or introduce instability.

AI editor support is product-adjacent rather than infrastructure: the OSS repo should ship a companion markdown skill that teaches agents like Codex or Claude how to create or update `.tour.ts` scripts.

## Constraints

- **Tech stack**: Bun workspace, TypeScript 5+, ESM-first, Playwright `>=1.59`, ffmpeg-backed media generation - matches the Phase 1 implementation plan.
- **Product boundary**: OSS must stand on its own and work entirely locally - cloud features cannot leak into the default flow.
- **Provider boundary**: TTS reads `OPENAI_API_KEY` from environment only - no embedded auth flow or custom credential storage in v1.
- **Output contract**: `.demohunter/` must be portable and versioned so Cloud can ingest it later without source-repo access.
- **Reliability**: Narration caching is mandatory, including offline regeneration behavior and corrupt-cache recovery.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Bun workspace + TypeScript + ESM for all app code | Matches the project direction already set in the Phase 1 spec and keeps packages consistent | - Pending |
| Build on Playwright directly instead of `@playwright/test` | DemoHunter is a generation tool, not a test runner | - Pending |
| Use two-pass generation | Recording must wait on real narration timing, not API latency | - Pending |
| Make the OSS output contract the shared OSS/Cloud handoff | Cloud should ingest generated artifacts without needing the original repo | - Pending |
| Keep auth/session logic in user Playwright code | App-specific setup varies too much to justify abstractions in v1 | - Pending |
| Ship agent support as markdown skill docs | The AI companion should stay simple and installable without product infrastructure | - Pending |
| Default TTS model to `gpt-4o-mini-tts` | Balanced default for OSS narration quality and cost | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after initialization*
