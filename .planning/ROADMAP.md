# Roadmap: DemoHunter

## Overview

DemoHunter v1 starts as a local-first OSS toolkit, not a hosted product. The roadmap follows the Phase 1 OSS Core document closely: scaffold the repo, establish the authoring DSL, build the Playwright generation engine, add OpenAI narration and cache behavior, lock the portable output contract, and finish with examples, agent skill docs, and OSS launch polish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Repository and Scaffolding** - Create the monorepo, config layer, scaffold flow, and no-audio sample path.
- [ ] **Phase 2: Tour Authoring SDK** - Define the `.tour.ts` authoring model and helper APIs on top of Playwright.
- [ ] **Phase 3: Playwright Generation Engine** - Implement two-pass execution, recording, overlays, and base local output writing.
- [ ] **Phase 4: OpenAI Narration and Cache** - Add provider-backed narration, cache behavior, subtitles, and offline regeneration rules.
- [ ] **Phase 5: Portable Output Contract** - Finalize the manifest schema, checksums, poster generation, and portable artifact layout.
- [ ] **Phase 6: OSS Readiness and Agent Skill** - Ship examples, docs, skill docs, CI, and launch polish.

## Phase Details

### Phase 1: Repository and Scaffolding
**Goal**: Stand up the Bun workspace, package boundaries, config loading, and `demohunter init` so a new user can scaffold and run a minimal sample.
**Depends on**: Nothing (first phase)
**Requirements**: INIT-01, INIT-02, INIT-03
**Success Criteria** (what must be TRUE):
  1. Developer can run `demohunter init` and receive a working config plus sample tour in an existing repo.
  2. The generated starter setup runs in Bun/TypeScript/ESM without requiring cloud services.
  3. DemoHunter config supports the core Phase 1 settings needed by later phases.
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Set up the root Bun workspace and the first package-shell group.
- [ ] 01-02-PLAN.md — Finish the remaining package shells and root project references.
- [ ] 01-03-PLAN.md — Implement config defaults, loader tests, and self-contained starter assets.
- [ ] 01-04-PLAN.md — Implement `demohunter init`, smoke-only `generate`, and overwrite-safe end-to-end validation.

### Phase 2: Tour Authoring SDK
**Goal**: Give developers a stable TypeScript DSL for narrated demos while keeping browser automation idiomatic to Playwright.
**Depends on**: Phase 1
**Requirements**: TOUR-01, TOUR-02, TOUR-03, TOUR-04, TOUR-05
**Success Criteria** (what must be TRUE):
  1. Developer can author a valid `.tour.ts` file with `defineTour`, chapters, steps, and narration calls.
  2. Helper APIs for stability, highlighting, snapshots, assertions, setup, and teardown are available in the authoring runtime.
  3. Auth and session setup still live in user Playwright code rather than DemoHunter-specific abstractions.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Define the SDK surface and tour runtime contracts.
- [ ] 02-02: Implement chapters, steps, narration declarations, and helper primitives.
- [ ] 02-03: Validate the authoring model with representative sample tours.

### Phase 3: Playwright Generation Engine
**Goal**: Execute tours in two passes, record the scripted demo, and write the baseline local artifact set to `.demohunter/`.
**Depends on**: Phase 2
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06
**Success Criteria** (what must be TRUE):
  1. Developer can run `demohunter generate <tour-file>` against local, preview, or arbitrary base URLs.
  2. The generator performs a timing pass before recording so the final video pass is deterministic.
  3. Local output is written under `.demohunter/<tour-id>/` with configurable overlays and default `mp4` output.
**Plans**: 4 plans

Plans:
- [ ] 03-01: Build the runtime executor and pass-1 timeline capture flow.
- [ ] 03-02: Build pass-2 recording, screencast integration, and hold-padding timing behavior.
- [ ] 03-03: Implement local output directory writing and optional `webm` support.
- [ ] 03-04: Add action and chapter overlays plus generator-focused error handling.

### Phase 4: OpenAI Narration and Cache
**Goal**: Add OpenAI-backed narration synthesis, deterministic cache behavior, subtitle generation, and offline regeneration support.
**Depends on**: Phase 3
**Requirements**: TTS-01, TTS-02, TTS-03, TTS-04, TTS-05, TTS-06, TTS-07, TTS-08, TTS-09, OUT-03
**Success Criteria** (what must be TRUE):
  1. Cached narration avoids repeat OpenAI calls while preserving exact timing from real audio durations.
  2. Cached generations can run without `OPENAI_API_KEY`, and missing uncached narration fails clearly.
  3. Subtitle output is generated directly from narration timeline data, and cache lifecycle commands work from the CLI.
**Plans**: 4 plans

Plans:
- [ ] 04-01: Implement the OpenAI TTS provider interface and request shaping.
- [ ] 04-02: Implement cache keys, read/write flows, integrity checks, and corrupt-entry recovery.
- [ ] 04-03: Measure narration duration from cached audio and generate subtitles from narration segments.
- [ ] 04-04: Wire cache CLI commands and validate offline regeneration behavior.

### Phase 5: Portable Output Contract
**Goal**: Finalize the versioned `.demohunter/` output contract so OSS output is portable and ready for later cloud ingest.
**Depends on**: Phase 4
**Requirements**: OUT-01, OUT-02, OUT-04
**Success Criteria** (what must be TRUE):
  1. Every successful run produces the full portable output set, including poster, manifest, subtitles, chapters, and audio files.
  2. Manifest data is versioned, Zod-validated, and contains checksums for generated artifacts.
  3. A future cloud service could ingest `.demohunter/<tour-id>/` without needing the source repo.
**Plans**: 3 plans

Plans:
- [ ] 05-01: Define the manifest schema, versioning rules, and checksum generation.
- [ ] 05-02: Finalize output layout and poster generation for portable artifacts.
- [ ] 05-03: Validate portability assumptions against the deferred cloud ingestion contract.

### Phase 6: OSS Readiness and Agent Skill
**Goal**: Make DemoHunter usable as a public OSS project through examples, docs, agent skill docs, CI, and launch polish.
**Depends on**: Phase 5
**Requirements**: OSS-01, OSS-02, OSS-03
**Success Criteria** (what must be TRUE):
  1. The repo includes working Next.js and Vite examples that demonstrate the intended workflow.
  2. Agent skill docs let Codex or Claude create or update valid `.tour.ts` files in-repo.
  3. New users can adopt the OSS project from the public repo with docs, CI, better errors, and a license in place.
**Plans**: 4 plans

Plans:
- [ ] 06-01: Create example projects and verify their demo flows.
- [ ] 06-02: Write and package the companion markdown skill docs plus script templates.
- [ ] 06-03: Improve docs, errors, and onboarding guidance for OSS users.
- [ ] 06-04: Add CI and choose the OSS license for launch readiness.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Repository and Scaffolding | 0/4 | Not started | - |
| 2. Tour Authoring SDK | 0/3 | Not started | - |
| 3. Playwright Generation Engine | 0/4 | Not started | - |
| 4. OpenAI Narration and Cache | 0/4 | Not started | - |
| 5. Portable Output Contract | 0/3 | Not started | - |
| 6. OSS Readiness and Agent Skill | 0/4 | Not started | - |
