# Phase 1: Repository and Scaffolding - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the Bun workspace, package boundaries, config loading, and `demohunter init` so a new user can scaffold and run a minimal sample. This phase covers repository shape and starter experience only; it does not build the full authoring DSL, recording engine, TTS pipeline, or cloud features.

</domain>

<decisions>
## Implementation Decisions

### Package layout
- **D-01:** Create the full planned workspace from day one rather than adding packages incrementally later.
- **D-02:** Phase 1 should establish package boundaries for `sdk`, `cli`, `generator-playwright`, `tts-core`, `tts-openai`, `manifest`, and `create-demohunter`, even if later-phase packages begin thin.

### `demohunter init` behavior
- **D-03:** `demohunter init` should stay minimal and safe rather than heavily scaffolding the host repo.
- **D-04:** The scaffolded sample tour should live in a `demos/` folder.
- **D-05:** `demohunter init` should generate a bundled local static sample page rather than targeting an external public site.

### Starter sample
- **D-06:** The generated starter tour should be a smoke path that proves the scaffold works, not a richer showcase demo.
- **D-07:** The starter sample should be positioned as disposable starter content that can later be replaced with a DemoHunter self-demo.

### Config UX
- **D-08:** The generated `demohunter.config.ts` should stay minimal and only expose the fields needed for the Phase 1 sample to run.

### the agent's Discretion
- Internal typed config defaults can be broader than the generated starter file as long as the visible scaffold stays minimal.
- Exact package internals and placeholder implementation depth are left to planning and execution, provided the full workspace shape exists from day one.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope
- `docs/GOAL.md` - Product definition, OSS-vs-cloud split, and local-first positioning.
- `docs/INITIAL_RESEARCH.md` - Phase split between OSS core and later cloud offering.
- `docs/phase_1_oss_core.md` - Canonical OSS Phase 1 spec, package list, CLI surface, config example, technical design, and acceptance criteria.
- `docs/phase_2_cloud_offering.md` - Deferred cloud scope that must stay out of Phase 1.

### Planning artifacts
- `.planning/PROJECT.md` - Project principles and non-negotiable constraints for the OSS core.
- `.planning/REQUIREMENTS.md` - Phase 1 requirement mapping for `INIT-01`, `INIT-02`, and `INIT-03`.
- `.planning/ROADMAP.md` - Phase 1 goal, success criteria, and plan slots.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No reusable application code exists yet; the repo currently contains planning artifacts and product docs only.

### Established Patterns
- Documentation-first repository: product behavior is currently defined by `docs/` and `.planning/`, not by existing source code.
- Project-level constraints are already locked: Bun workspace, TypeScript, ESM-first, thin wrapper on top of Playwright, local-first OSS.

### Integration Points
- New Phase 1 code will establish the initial package structure and become the base integration point for all later phases.
- `demohunter init` must connect generated sample assets, minimal config, and the future workspace conventions without assuming any existing app structure in the target repo.

</code_context>

<specifics>
## Specific Ideas

- The starter sample should be a bundled local static site, not a demo against Google or another third-party site.
- The initial tour should be intentionally small and reliable, aimed at proving the scaffold works.
- The sample content is expected to be replaced later with a DemoHunter self-demo.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 01-repository-and-scaffolding*
*Context gathered: 2026-04-09*
