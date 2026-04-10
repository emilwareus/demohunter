# Phase 2: Tour Authoring SDK - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the `.tour.ts` authoring DSL and helper APIs on top of Playwright so developers can write narrated demos in a stable, TypeScript-first format. This phase is about authoring shape and helper ergonomics only; it does not add the two-pass recording engine, TTS execution, cache commands, or cloud behavior.

</domain>

<decisions>
## Implementation Decisions

### Authoring shape
- **D-01:** Tours should stay a plain `defineTour({ ... })` object model rather than introducing a builder or fluent DSL.
- **D-02:** The SDK should expose top-level `setup`, `run`, and `teardown` on the tour object so the authoring model stays explicit and close to normal Playwright code.

### Chapter and step semantics
- **D-03:** `chapter("Title")` should be a lightweight marker that sets the current chapter for following steps, not a block wrapper API.
- **D-04:** `step(title, fn)` should stay inline inside normal async Playwright code rather than becoming a separate metadata declaration layer.
- **D-05:** `narrate(text, opts?)` should remain an inline call inside step bodies, not step metadata.

### Helper API ergonomics
- **D-06:** Helper APIs such as `waitForStable`, `highlight`, `snapshot`, and `assertVisible` should be exposed directly on the runtime context, not under a nested helper object.
- **D-07:** The authoring surface should feel like a thin Playwright extension, not a custom wrapper framework.

### Lifecycle scope
- **D-08:** Phase 2 should support only top-level `setup` and `teardown`.
- **D-09:** Chapter-level and step-level lifecycle hooks are out of scope for this phase.

### the agent's Discretion
- Exact helper signatures and option bags can be designed during planning as long as the surface stays direct and Playwright-like.
- Internal runtime organization, type decomposition, and helper implementation strategy are left to research and planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope
- `docs/GOAL.md` — Product definition and local-first OSS boundary.
- `docs/phase_1_oss_core.md` — Canonical v1 spec, including the intended `.tour.ts` shape and required SDK exports.

### Planning artifacts
- `.planning/PROJECT.md` — Project principles and constraints, especially “thin wrapper on top of Playwright.”
- `.planning/REQUIREMENTS.md` — Phase 2 requirement mapping for `TOUR-01` through `TOUR-05`.
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and plan slots.
- `.planning/phases/01-repository-and-scaffolding/01-CONTEXT.md` — Prior decisions that lock DemoHunter into a thin, local-first Playwright-oriented direction.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/sdk/src/tour.ts`: already contains a minimal `defineTour` identity helper and the first `DemoHunterTour` type shape.
- `packages/sdk/src/index.ts`: already acts as the SDK public entrypoint and should remain the main export surface for authoring helpers.
- `packages/generator-playwright/src/smoke-generate.ts`: already consumes a runtime context with `page`, `chapter`, `step`, and `narrate`, which gives Phase 2 a concrete integration target for authoring/runtime contracts.

### Established Patterns
- The repo is using thin, identity-style helpers (`defineConfig`, `defineTour`) rather than magic builders or hidden default behavior.
- Phase 1 established a TypeScript-first ESM workspace with package boundaries, tests, and dist-first build contracts.
- DemoHunter is intentionally positioned as a thin wrapper around Playwright, not as a replacement runtime or test framework.

### Integration Points
- Phase 2 will primarily expand `packages/sdk/src/tour.ts` and related SDK exports.
- The generator runtime will need to consume the richer tour contract introduced here without breaking the source-level and built-bin flows added in Phase 1.
- New helper APIs should be designed so later generation phases can observe chapters, steps, and narration without forcing app-specific setup abstractions.

</code_context>

<specifics>
## Specific Ideas

- Keep the authoring experience as close as possible to ordinary Playwright automation so developers and coding agents can read and write tours naturally.
- Prefer direct runtime helpers on context over nested namespaces or a custom framework-style wrapper.
- Avoid introducing metadata-heavy step declarations if an inline async Playwright flow can express the same thing clearly.

</specifics>

<deferred>
## Deferred Ideas

- Chapter-level lifecycle hooks — better considered in a later phase if the simple model proves insufficient.
- Step-level lifecycle hooks or richer metadata objects — defer unless later generation/runtime needs force them.
- Any abstraction that moves auth, session, or app bootstrap out of user Playwright code — remains out of scope.

</deferred>

---

*Phase: 02-tour-authoring-sdk*
*Context gathered: 2026-04-10*
