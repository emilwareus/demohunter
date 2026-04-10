# Requirements: DemoHunter

**Defined:** 2026-04-09
**Core Value:** Developers can turn normal Playwright automation into portable narrated demo assets locally, without depending on a hosted backend.

## v1 Requirements

### Setup

- [x] **INIT-01**: Developer can run `demohunter init` in an existing repo and receive a working `demohunter.config.ts` plus a sample `.tour.ts` file.
- [x] **INIT-02**: Scaffolded DemoHunter projects use Bun, TypeScript, and ESM without any required cloud dependency.
- [x] **INIT-03**: Developer can configure `baseURL`, output and cache directories, browser, viewport, `holdPaddingMs`, overlay toggles, and TTS defaults in `demohunter.config.ts`.

### Tour Authoring

- [ ] **TOUR-01**: Developer can define a narrated demo in a `.tour.ts` file with `defineTour`.
- [ ] **TOUR-02**: Developer can organize the demo into named chapters and steps.
- [ ] **TOUR-03**: Developer can add declarative narration with `narrate(text, opts?)` without manually calculating timing.
- [ ] **TOUR-04**: Developer can use helper APIs `waitForStable`, `highlight`, `snapshot`, `assertVisible`, `setup`, and `teardown` inside a tour.
- [ ] **TOUR-05**: Developer keeps auth, session, and app bootstrap logic in normal Playwright code rather than DemoHunter-specific abstractions.

### Generation

- [ ] **GEN-01**: Developer can run `demohunter generate <tour-file>` against a local dev server, preview URL, or arbitrary base URL.
- [ ] **GEN-02**: Generation uses a two-pass flow so narration timing is resolved before the recorded video pass starts.
- [ ] **GEN-03**: During the recorded pass, the tool waits `durationMs + holdPaddingMs` after each narrated action.
- [ ] **GEN-04**: Generated assets are written to `.demohunter/<tour-id>/` relative to the current working directory.
- [ ] **GEN-05**: DemoHunter outputs `mp4` by default and can optionally generate `webm`.
- [ ] **GEN-06**: DemoHunter can render action and chapter overlays during generation when enabled in config.

### Narration and Cache

- [ ] **TTS-01**: OpenAI speech synthesis works by reading `OPENAI_API_KEY` from environment only.
- [ ] **TTS-02**: Developer can choose OpenAI model, voice, instructions, and format for narration generation.
- [ ] **TTS-03**: Narration timing is based on measured duration from the real cached audio file, not text heuristics.
- [ ] **TTS-04**: Identical narration segments reuse cached audio without repeat API calls.
- [ ] **TTS-05**: Different model, voice, instructions, format, sample rate, or provider version combinations produce distinct cache keys.
- [ ] **TTS-06**: Corrupt cache entries are detected and regenerated automatically.
- [ ] **TTS-07**: `demohunter generate` succeeds without `OPENAI_API_KEY` when every required narration segment is already cached locally.
- [ ] **TTS-08**: `demohunter generate` fails clearly when uncached narration is required and `OPENAI_API_KEY` is missing.
- [ ] **TTS-09**: CLI supports `demohunter cache list`, `demohunter cache prune`, and `demohunter cache clear`.

### Output Contract

- [ ] **OUT-01**: Every successful generation writes `video.mp4`, optional `video.webm`, `poster.jpg`, `captions.srt`, `captions.vtt`, `chapters.json`, `manifest.json`, and cached audio files into `.demohunter/<tour-id>/`.
- [ ] **OUT-02**: DemoHunter defines a versioned Zod manifest schema that describes generated files and includes checksums.
- [ ] **OUT-03**: Subtitle files are generated from narration segments only.
- [ ] **OUT-04**: The generated output contract is portable enough for a later cloud product to ingest without access to the original repo.

### OSS Readiness

- [ ] **OSS-01**: The repo includes working example projects for Next.js and Vite demo flows.
- [ ] **OSS-02**: The repo includes installable markdown skill docs that let agents like Codex or Claude create or update `.tour.ts` files.
- [ ] **OSS-03**: The public OSS repo ships with docs, better error handling, CI, and a permissive license so new users can succeed without maintainer intervention.

## v2 Requirements

### Cloud Offering

- **CLOUD-01**: Team can upload generated OSS output and receive a hosted watch page.
- **CLOUD-02**: Cloud offering supports managed TTS so the CLI can generate without a user-managed OpenAI key.
- **CLOUD-03**: Cloud offering supports projects, version history, and share permissions for generated demos.
- **CLOUD-04**: Cloud offering later supports remote generation for reachable preview and staging environments.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Built-in OSS playback UI | OSS scope is artifact generation, not a viewer application |
| Auth/session abstraction layer | User Playwright code should stay responsible for app-specific setup |
| Plugin system | Too broad for the intentionally narrow Phase 1 product |
| Browser-based timeline editor | Not required to prove the scripted demo workflow |
| Unscripted screen recording | Product is focused on scripted narrated tours |
| Cloud upload, sharing, and hosting | Deferred to the later cloud offering in `docs/phase_2_cloud_offering.md` |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INIT-01 | Phase 1 | Complete |
| INIT-02 | Phase 1 | Complete |
| INIT-03 | Phase 1 | Complete |
| TOUR-01 | Phase 2 | Pending |
| TOUR-02 | Phase 2 | Pending |
| TOUR-03 | Phase 2 | Pending |
| TOUR-04 | Phase 2 | Pending |
| TOUR-05 | Phase 2 | Pending |
| GEN-01 | Phase 3 | Pending |
| GEN-02 | Phase 3 | Pending |
| GEN-03 | Phase 3 | Pending |
| GEN-04 | Phase 3 | Pending |
| GEN-05 | Phase 3 | Pending |
| GEN-06 | Phase 3 | Pending |
| TTS-01 | Phase 4 | Pending |
| TTS-02 | Phase 4 | Pending |
| TTS-03 | Phase 4 | Pending |
| TTS-04 | Phase 4 | Pending |
| TTS-05 | Phase 4 | Pending |
| TTS-06 | Phase 4 | Pending |
| TTS-07 | Phase 4 | Pending |
| TTS-08 | Phase 4 | Pending |
| TTS-09 | Phase 4 | Pending |
| OUT-03 | Phase 4 | Pending |
| OUT-01 | Phase 5 | Pending |
| OUT-02 | Phase 5 | Pending |
| OUT-04 | Phase 5 | Pending |
| OSS-01 | Phase 6 | Pending |
| OSS-02 | Phase 6 | Pending |
| OSS-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initialization*
