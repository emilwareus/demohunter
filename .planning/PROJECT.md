# DemoHunter

## What This Is

DemoHunter is a shipped open-source TypeScript CLI and SDK for creating narrated product demos programmatically from Playwright-style `.tour.ts` files. It runs locally, generates portable demo assets into `.demohunter/`, and uses OpenAI text-to-speech only for narration generation. The cloud offering is the next additive milestone, not a dependency of the OSS core.

## Core Value

Developers can turn normal Playwright automation into portable narrated demo assets locally, without depending on a hosted backend.

## Current State

DemoHunter `v1.0` shipped on 2026-04-14 with the full OSS core milestone complete.

- Scope delivered: scaffold flow, Playwright-native authoring SDK, two-pass generation, OpenAI narration/cache, portable manifest/output contract, example apps, installable skill docs, public onboarding docs, CI, and MIT license
- Delivery footprint: 6 phases, 24 plans, 55 tasks, 216 files changed, and 24,356 inserted lines across the milestone range
- Runtime stack: Bun workspace, TypeScript 5+, ESM-first packages, Playwright `>=1.59`, ffmpeg-backed media generation, and env-only `OPENAI_API_KEY`
- Release state: all 30 v1 requirements complete, milestone archived, local git tag `v1.0` created
- Known planning debt: Phase 05 Nyquist validation docs are stale relative to shipped verification artifacts

## Requirements

### Validated

- ✓ Working Bun/TypeScript monorepo, shared config layer, and safe `demohunter init` starter flow — v1.0
- ✓ Playwright-native `.tour.ts` authoring DSL with lifecycle hooks and direct runtime helpers — v1.0
- ✓ Two-pass local generation that writes portable demo assets under `.demohunter/<tour-id>/` — v1.0
- ✓ Deterministic local narration cache with offline reuse, corrupt-cache recovery, and live OpenAI integration proof — v1.0
- ✓ OSS adoption surface with examples, markdown skill docs, troubleshooting docs, CI, and license — v1.0

### Active

None yet. Define the next milestone with `/gsd-new-milestone`.

## Next Milestone Goals

- Hosted watch pages and cloud ingest for portable OSS output bundles
- Managed TTS path that removes the need for user-managed OpenAI credentials
- Projects, version history, and sharing permissions for generated demos
- Remote generation support for reachable preview and staging environments

### Out of Scope

- Built-in playback UI — OSS should generate portable output only.
- Auth, session, and bootstrap abstractions on top of Playwright — users keep app-specific setup in their own Playwright code.
- Plugin infrastructure, browser-based editing, and unscripted screen recording — outside the intentionally narrow OSS scope.

## Context

The shipped codebase is local-first and TypeScript-only: Bun workspace, TypeScript 5+, ESM-first packages, direct Playwright usage (not `@playwright/test`), ffmpeg-backed muxing/asset generation, and an OpenAI-backed narration layer with deterministic local caching.

The stable artifact boundary is `.demohunter/<tour-id>`: `video.mp4`, optional `video.webm`, `poster.jpg`, captions, `chapters.json`, copied narration audio, and `manifest.json` validated through `@demohunter/manifest`. This contract is the intended ingest surface for the future cloud product.

The repo now includes two real consumer examples (`examples/nextjs-demo` and `examples/vite-demo`), an installable `skills/demohunter` bundle for Codex/Claude, public onboarding/troubleshooting docs, and a public CI path that stays secret-free by excluding live OpenAI narration from default verification.

## Constraints

- **Tech stack**: Bun workspace, TypeScript 5+, ESM-first, Playwright `>=1.59`, ffmpeg-backed media generation
- **Product boundary**: OSS must stand on its own and work entirely locally
- **Provider boundary**: TTS reads `OPENAI_API_KEY` from environment only
- **Output contract**: `.demohunter/` must stay portable and versioned for later cloud ingest
- **Reliability**: Narration caching remains mandatory, including offline regeneration behavior and corrupt-cache recovery

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Bun workspace + TypeScript + ESM for all app code | Keeps packages consistent and aligned with the OSS build path | ✓ Good |
| Build on Playwright directly instead of `@playwright/test` | DemoHunter is a generation tool, not a test runner | ✓ Good |
| Use two-pass generation | Recording must wait on real narration timing, not API latency | ✓ Good |
| Make the OSS output contract the shared OSS/Cloud handoff | Cloud should ingest generated artifacts without needing the original repo | ✓ Good |
| Keep auth/session logic in user Playwright code | App-specific setup varies too much to justify abstractions in v1 | ✓ Good |
| Ship agent support as markdown skill docs | The AI companion should stay simple and installable without product infrastructure | ✓ Good |
| Default TTS model to `gpt-4o-mini-tts` | Balanced default for OSS narration quality and cost | ✓ Good |
| Make `video.mp4` the baseline portable artifact and `webm` opt-in | Keeps the portable contract deterministic while still allowing alternate output | ✓ Good |
| Keep live OpenAI narration out of default CI | Public verification should not depend on maintainer secrets | ✓ Good |

## Evolution

This document now evolves at future milestone boundaries. The next substantial update should happen when the cloud milestone is defined and requirements move back into active planning.

---
*Last updated: 2026-04-14 after v1.0 milestone completion*
