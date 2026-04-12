# Phase 5: Portable Output Contract - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Finalize the versioned `.demohunter/<tour-id>/` output contract so each successful generation produces the full portable artifact set, including poster, manifest, subtitles, chapters, and narration audio, with enough structured metadata that a future cloud service can ingest the folder without needing the source repo.

</domain>

<decisions>
## Implementation Decisions

### Manifest shape
- **D-01:** `manifest.json` should be richer than a bare file inventory. It should include both file inventory plus checksums and the media/timeline metadata that a future ingest service would need directly.
- **D-02:** The manifest should be the single portable source of truth for artifact relationships, generation format version, and output metadata rather than requiring cloud ingest to reconstruct structure from filenames alone.

### Artifact layout
- **D-03:** The portable output directory should use stable relative paths only. All file references in the manifest must be relative to `.demohunter/<tour-id>/`, never absolute or machine-specific.
- **D-04:** Narration audio should live under an `audio/` subdirectory inside the tour output root, while `video.mp4`, optional `video.webm`, `poster.jpg`, `captions.srt`, `captions.vtt`, `chapters.json`, and `manifest.json` remain top-level tour artifacts.
- **D-05:** Optional artifacts should be represented explicitly but conservatively: `video.mp4` is expected by default, `video.webm` appears only when generated, and the manifest should make optionality clear without forcing placeholder files.

### Poster behavior
- **D-06:** `poster.jpg` should be generated deterministically from a fixed playback timestamp rather than a subjective "best frame" heuristic or chapter-aware selection logic.
- **D-07:** Poster generation should favor repeatability and contract stability over content-aware intelligence. If the preferred timestamp is unavailable because the video is shorter, the implementation may fall back deterministically.

### Portability boundary
- **D-08:** The portable contract must embed everything needed for later cloud ingest that is artifact-local: manifest version, relative file paths, checksums, durations, chapter data, subtitle references, and narration-audio references.
- **D-09:** The portable contract must not depend on repo-local or machine-local information such as absolute paths, source file paths, local base URLs, workstation-specific temp paths, or environment-dependent secrets.
- **D-10:** Cloud-ingest readiness matters more than mirroring internal runtime structures exactly. Planning should bias toward a clean external contract that another system can validate and consume without reading generator internals.

### the agent's Discretion
- Exact manifest field names, Zod schema decomposition, and checksum algorithm wiring are open to research and planning as long as the contract stays versioned, portable, and self-describing.
- The exact fixed timestamp used for `poster.jpg` can be chosen during planning, provided it is deterministic and documented in the output contract.
- The exact organization of manifest sections is flexible as long as artifact references remain relative and ingest-safe.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product contract
- `docs/phase_1_oss_core.md` — Defines the OSS generated output contract, manifest package responsibilities, required output files, and the shared OSS-to-cloud handoff boundary.
- `docs/phase_2_cloud_offering.md` — Defines how the future cloud product ingests `.demohunter/<tour-id>/` without source-repo access and what hosted metadata depends on the portable output.

### Project planning
- `.planning/ROADMAP.md` — Phase 5 goal, scope, success criteria, and plan breakdown.
- `.planning/REQUIREMENTS.md` — `OUT-01`, `OUT-02`, and `OUT-04`, which define the portable artifact set, versioned manifest, checksums, and ingest portability requirements.
- `.planning/PROJECT.md` — Project-level constraints around local-first OSS behavior, output portability, and the OSS/cloud contract boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/generator-playwright/src/output/write-generation-output.ts`: Current output writer already persists top-level tour artifacts and is the natural integration point for poster, manifest, and audio-copy work.
- `packages/generator-playwright/src/output/prepare-output-dir.ts`: Already enforces `.demohunter/<tour-id>/` as the output root and tour-id safety constraints.
- `packages/generator-playwright/src/generate.ts`: Already has access to final video artifacts, chapter timing, and narration segment data that a portable manifest will need.
- `packages/tts-core/src/cache/cache-store.ts`: Already persists narration audio plus integrity metadata and includes checksum-oriented data that can inform portable audio references.
- `packages/manifest/src/index.ts`: Package boundary already exists and should become the home for the versioned manifest schema and validation helpers.

### Established Patterns
- Output writing is explicit and artifact-by-artifact, not hidden behind a framework abstraction.
- The repo already treats `.demohunter/<tour-id>/` as the external contract boundary rather than an internal temp directory.
- Tests already assert concrete artifact presence and absence through source CLI and built CLI consumer paths, so Phase 5 should extend that contract rather than invent a parallel one.

### Integration Points
- Manifest generation should connect at the point where final artifact paths are known, after video muxing and subtitle/chapter output are finalized.
- Poster generation should plug into the media-output path alongside final video handling rather than becoming a separate CLI step.
- Portable audio export likely bridges generator output writing with the existing cache-backed narration segments resolved during pass 1.

</code_context>

<specifics>
## Specific Ideas

- The output contract should be self-sufficient enough that a later cloud service can ingest the folder without the original repo or local environment.
- Stable relative paths are preferred over anything that leaks machine-specific details.
- Deterministic poster generation is preferred over "smart" or content-aware poster picking heuristics.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-portable-output-contract*
*Context gathered: 2026-04-12*
