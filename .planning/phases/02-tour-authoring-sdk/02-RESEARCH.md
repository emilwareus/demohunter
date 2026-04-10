# Phase 2: Tour Authoring SDK - Research

**Researched:** 2026-04-10
**Domain:** TypeScript SDK design for Playwright-authored demo scripts
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tours should stay a plain `defineTour({ ... })` object model rather than introducing a builder or fluent DSL.
- The SDK should expose top-level `setup`, `run`, and `teardown` on the tour object so the authoring model stays explicit and close to normal Playwright code.
- `chapter("Title")` should be a lightweight marker that sets the current chapter for following steps, not a block wrapper API.
- `step(title, fn)` should stay inline inside normal async Playwright code rather than becoming a separate metadata declaration layer.
- `narrate(text, opts?)` should remain an inline call inside step bodies, not step metadata.
- Helper APIs such as `waitForStable`, `highlight`, `snapshot`, and `assertVisible` should be exposed directly on the runtime context, not under a nested helper object.
- The authoring surface should feel like a thin Playwright extension, not a custom wrapper framework.
- Phase 2 should support only top-level `setup` and `teardown`.
- Chapter-level and step-level lifecycle hooks are out of scope for this phase.

### the agent's Discretion
- Exact helper signatures and option bags can be designed during planning as long as the surface stays direct and Playwright-like.
- Internal runtime organization, type decomposition, and helper implementation strategy are left to research and planning.

### Deferred Ideas (OUT OF SCOPE)
- Chapter-level lifecycle hooks.
- Step-level lifecycle hooks or richer metadata objects.
- Any abstraction that moves auth, session, or app bootstrap out of user Playwright code.
</user_constraints>

<research_summary>
## Summary

Phase 2 should be implemented as a typed expansion of the existing identity-style SDK, not as a new runtime framework. The current codebase already points in that direction: `defineTour` is an identity helper, the generator already consumes a simple runtime context, and the roadmap explicitly says DemoHunter must remain idiomatic to Playwright. The right move is to strengthen the type contract, add direct helper functions on the run context, and make those helpers observable enough for later generation phases without forcing users into a metadata DSL.

The standard approach for tools layered on Playwright is to keep `Page` and `Locator` as first-class values and let Playwright continue to handle actionability, assertions, and waiting. That means DemoHunter should not invent its own selector model, test runner semantics, or hidden lifecycle engine. Instead, Phase 2 should provide a minimal authoring runtime that wraps ordinary async code with structured events for chapter, step, narration, snapshots, and helper usage.

The main planning implication is compatibility: the richer tour contract must integrate with the existing source-level generate flow and built package contract from Phase 1. That means the phase should include both contract definition and representative sample validation, including migration of the starter/example tour shape to `defineTour`.

**Primary recommendation:** Implement Phase 2 as a typed, locator-friendly runtime contract with direct context helpers and explicit event capture hooks, while keeping authored tour code visually close to normal Playwright scripts.
</research_summary>

<standard_stack>
## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | `^5.9.3` | Type-safe SDK authoring surface | Already the repo standard and required for authored `.tour.ts` files |
| Playwright | `>=1.59` | Browser automation primitives (`Page`, `Locator`, screenshots, assertions) | Product scope explicitly depends on Playwright directly rather than a custom browser layer |
| Bun | workspace runtime | Local execution, tests, and package wiring | Already established in Phase 1 and used by the workspace/build contract |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node `fs/promises` + `path` | built-in | Snapshot/output path plumbing for helper internals | Use for sample/runtime output writes without new dependencies |
| Existing package build/test setup | repo-local | Dist contract and type-level validation | Use for SDK export validation and authoring-flow tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain `defineTour({ ... })` object | Fluent/builder DSL | More ceremony, more type indirection, and a worse fit for the locked product direction |
| Direct context helpers | Nested helper namespaces | Cleaner internal grouping, but worse ergonomics and less Playwright-like call sites |
| Playwright `Page`/`Locator` directly | DemoHunter-specific wrapper objects | Easier to instrument, but violates the thin-wrapper constraint and creates migration friction |

**Installation:**
```bash
bun add @demohunter/sdk playwright
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```text
packages/
├── sdk/
│   └── src/
│       ├── index.ts            # public exports
│       ├── tour.ts             # authored tour types + defineTour
│       ├── runtime-types.ts    # step/chapter/helper context types
│       └── helpers.ts          # helper implementations or helper factories
└── generator-playwright/
    └── src/
        ├── smoke-generate.ts   # current integration point
        └── runtime/            # event capture / execution helpers
```

### Pattern 1: Identity-authored tour contract
**What:** Keep `defineTour` as an identity helper that returns the authored object unchanged while providing a strict compile-time shape.
**When to use:** Always for `.tour.ts` authoring.
**Example:**
```typescript
export default defineTour({
  id: "billing-overview",
  title: "New billing flow",
  async setup({ page }) {
    await page.goto("/login");
  },
  async run({ page, chapter, step, narrate }) {
    await chapter("Billing");
    await step("Open billing", async () => {
      await page.goto("/billing");
      await narrate("This is the billing dashboard.");
    });
  },
  async teardown() {},
});
```

### Pattern 2: Direct runtime context with observable helper calls
**What:** Expose helper functions directly on the context and implement them so they can both perform immediate runtime behavior and emit structured metadata for later phases.
**When to use:** For chapter, step, narration, snapshot, highlight, visibility, and stability helpers.
**Example:**
```typescript
type DemoHunterRunContext = {
  page: Page;
  chapter: (title: string, options?: ChapterOptions) => Promise<void>;
  step: <T>(title: string, fn: () => Promise<T> | T) => Promise<T>;
  narrate: (text: string, options?: NarrateOptions) => Promise<void>;
  waitForStable: (options?: WaitForStableOptions) => Promise<void>;
  highlight: (target: Locator, options?: HighlightOptions) => Promise<void>;
  snapshot: (name?: string) => Promise<void>;
  assertVisible: (target: Locator) => Promise<void>;
};
```

### Pattern 3: Generator-owned runtime factory
**What:** Keep helper implementation details in generator/runtime code and let the SDK primarily define public types and the authoring contract.
**When to use:** When helper behavior depends on execution mode, artifact writing, or later timeline capture.
**Example:**
```typescript
const runtime = createTourRuntime({ page, outputDir, recordEvents });
await tour.setup?.(runtime);
await tour.run(runtime);
await tour.teardown?.(runtime);
```

### Anti-Patterns to Avoid
- **Framework-shaped DSL:** Avoid chainable builder APIs, decorator-like steps, or metadata-heavy configs that make authored tours look unlike Playwright.
- **Custom selector/assertion layer:** Avoid wrapping `Locator` semantics in DemoHunter-specific query helpers when Playwright already provides stable primitives.
- **Phase leakage:** Avoid implementing timing, video-pass logic, or TTS resolution here. Phase 2 should define the surface that later phases consume, not finish the engine early.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Element readiness | Custom polling and ad hoc sleeps | Playwright actionability and locator waiting | Playwright already solves visibility, attachment, and interactability more reliably |
| Visibility assertions | DemoHunter-specific assertion DSL | Playwright locator assertions or a thin wrapper over them | Avoids duplicating semantics and keeps authored tours familiar |
| Selector abstraction | App-specific query wrappers in the SDK | Plain `page.getBy...` and `locator` usage | Product scope explicitly keeps app logic in user Playwright code |
| Narrative structure | Separate metadata AST for each step | Inline `chapter`, `step`, `narrate` calls in async code | Matches locked decisions and avoids dual sources of truth |

**Key insight:** the SDK should add structure around ordinary Playwright code, not replace Playwright with a second automation model.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Turning `step()` into metadata instead of execution
**What goes wrong:** Step definitions become detached from the actual browser actions they describe.
**Why it happens:** It is tempting to model tours as serializable data instead of executable code.
**How to avoid:** Keep `step(title, fn)` as an inline async wrapper that executes the function immediately.
**Warning signs:** Plans mention AST-like step storage, step arrays, or a separate authoring schema.

### Pitfall 2: Over-designing helper behavior before the engine exists
**What goes wrong:** Helpers bake in timing, overlay, or output semantics that belong to later phases.
**Why it happens:** Phase 2 needs helper APIs, but later phases will be the ones that consume their events.
**How to avoid:** Define stable helper contracts now and keep implementation thin, observable, and testable.
**Warning signs:** `waitForStable`, `highlight`, or `snapshot` start writing final production artifacts or encoding recording policy.

### Pitfall 3: Breaking the starter and dist contract while improving types
**What goes wrong:** The richer SDK surface compiles in source but breaks `dist` exports, starter examples, or smoke generation.
**Why it happens:** Phase 1 already established real source and built-package flows, and the starter tour still uses a plain object export.
**How to avoid:** Include unit tests for the contract, sample-tour tests, and source-plus-dist validation in the phase plan.
**Warning signs:** Only SDK unit tests are added, with no validation of starter/demo tours or built entrypoints.
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official and canonical sources:

### Thin authored tour shape
```typescript
export default defineTour({
  id: "sample-smoke",
  title: "DemoHunter starter smoke test",
  async run({ page, step, narrate }) {
    await step("Start demo", async () => {
      await page.getByRole("button", { name: "Start demo" }).click();
      await narrate("The demo starts here.");
    });
  },
});
```
Source: `docs/phase_1_oss_core.md`

### Locator-first helper design
```typescript
async function assertVisible(target: Locator): Promise<void> {
  await expect(target).toBeVisible();
}
```
Source: Playwright assertions docs and locator API

### Snapshot helper stays Playwright-native
```typescript
async function snapshot(page: Page, filePath: string): Promise<void> {
  await page.screenshot({ path: filePath, fullPage: false });
}
```
Source: Playwright screenshots and `Page` API docs
</code_examples>

<sota_updates>
## State of the Art (2024-2026)

What's changed recently:

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Frameworks layering custom browser abstractions on top of test runners | Thin wrappers that preserve Playwright idioms and use `Locator`/assertion primitives directly | Ongoing ecosystem shift through recent Playwright releases | Favors a minimal SDK contract over a framework-like DSL |
| Manual sleeps and page-level polling | Locator/actionability-driven waits and focused assertions | Matured across modern Playwright guidance | `waitForStable` should complement Playwright, not replace it |
| Heavy metadata-driven automation configs | Executable TypeScript with typed helper surfaces | Standard practice in TS-first toolchains | Supports `defineTour({ ... })` as the primary authoring model |

**New tools/patterns to consider:**
- Runtime event capture around authored async code: gives later phases chapters, steps, and narration timeline data without changing author ergonomics.
- Dist-contract tests for package entrypoints: important because Phase 1 already treats compiled output as a product contract.

**Deprecated/outdated:**
- Builder/fluent DSLs for this phase: not technically deprecated, but misaligned with the current Playwright-first ecosystem and the project's locked decisions.
- DemoHunter-managed auth/session wrappers: explicitly out of scope and architecturally harmful here.
</sota_updates>

<open_questions>
## Open Questions

1. **Where should runtime-only helper implementations live?**
   - What we know: the SDK should own the public contract, while generator code already constructs the execution context.
   - What's unclear: whether helper implementations should live entirely in `generator-playwright` or partially in `sdk`.
   - Recommendation: keep public types/export plumbing in `sdk`, but let the generator own runtime factories and execution behavior.

2. **How rich should helper option bags be in Phase 2?**
   - What we know: helper signatures can be designed during planning, and later phases will need event metadata.
   - What's unclear: how much of highlight/snapshot/wait configuration is worth exposing immediately.
   - Recommendation: plan minimal option bags now and expand later only when a downstream phase proves the need.

3. **Should the Phase 1 starter tour migrate fully to the Phase 2 DSL in this phase?**
   - What we know: roadmap plan 02-03 explicitly calls for representative sample tour validation, and the current starter still exports a plain object.
   - What's unclear: whether the minimal starter should change immediately or a separate Phase 2 sample should carry validation.
   - Recommendation: include a plan item to validate at least one real `.tour.ts` sample through the new SDK surface and update the starter if that is the lowest-friction path.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `docs/phase_1_oss_core.md` - canonical OSS scope, required SDK exports, and intended `.tour.ts` authoring shape
- `.planning/phases/02-tour-authoring-sdk/02-CONTEXT.md` - locked Phase 2 decisions and out-of-scope items
- `.planning/REQUIREMENTS.md` - Phase 2 requirement mapping for `TOUR-01` through `TOUR-05`
- `.planning/ROADMAP.md` - Phase 2 goal, success criteria, and plan slots
- `packages/sdk/src/tour.ts` - current minimal authoring contract
- `packages/sdk/src/index.ts` - current SDK public export surface
- `packages/generator-playwright/src/smoke-generate.ts` - existing runtime context consumed by generation flow
- `packages/create-demohunter/templates/starter/demos/sample.tour.ts` - current starter tour shape
- [Playwright locators docs](https://playwright.dev/docs/locators) - locator-first authoring guidance
- [Playwright actionability docs](https://playwright.dev/docs/actionability) - built-in waiting/action semantics
- [Playwright locator API](https://playwright.dev/docs/api/class-locator) - locator methods and direct helper targets
- [Playwright screenshots docs](https://playwright.dev/docs/screenshots) - screenshot behavior for snapshot helper design

### Secondary (MEDIUM confidence)
- `tests/e2e/workspace-build-contract.test.ts` - confirms `dist` package exports are already treated as a contract
- `packages/sdk/src/config.test.ts` - confirms the repo currently prefers identity-style authored helpers

### Tertiary (LOW confidence - needs validation)
- None. The core design questions for this phase are already well constrained by product docs, current code, and official Playwright guidance.
</sources>
