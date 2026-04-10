# Phase 2: Tour Authoring SDK - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 02-tour-authoring-sdk
**Areas discussed:** Authoring shape, chapter model, step and narration style, helper API ergonomics, lifecycle scope

---

## Authoring shape

| Option | Description | Selected |
|--------|-------------|----------|
| Plain object | `defineTour({ ... })` with explicit top-level fields | ✓ |
| Builder/fluent style | More opinionated chained API for authoring | |
| Agent decides | Leave the surface open for planning | |

**User's choice:** Recommended option
**Notes:** Keep the SDK close to normal TypeScript object authoring and avoid a custom framework feel.

---

## Chapter model

| Option | Description | Selected |
|--------|-------------|----------|
| Marker call | `chapter("Billing")` sets the current chapter for following steps | ✓ |
| Block wrapper | `chapter("Billing", async () => { ... })` wraps a scoped block | |
| Agent decides | Leave chapter semantics open | |

**User's choice:** Recommended option
**Notes:** Prefer a lightweight marker model over block scoping.

---

## Step and narration style

| Option | Description | Selected |
|--------|-------------|----------|
| Inline calls | `step()` and `narrate()` live inside normal async Playwright flow | ✓ |
| Metadata-driven | Narration becomes step metadata instead of inline calls | |
| Agent decides | Leave the style open | |

**User's choice:** Recommended option
**Notes:** Keep narration and steps embedded in regular Playwright-style code.

---

## Helper API ergonomics

| Option | Description | Selected |
|--------|-------------|----------|
| Direct context helpers | Expose helpers directly on the runtime context | ✓ |
| Nested helper object | Group helpers under a namespace or object | |
| Wrapper framework | Introduce a more opinionated helper abstraction | |

**User's choice:** Recommended option
**Notes:** The runtime should feel like a thin Playwright extension rather than a separate framework.

---

## Lifecycle scope

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level only | Support only top-level `setup` and `teardown` in Phase 2 | ✓ |
| Nested lifecycle hooks | Add chapter/step-level lifecycle hooks now | |
| Agent decides | Leave lifecycle depth open | |

**User's choice:** Recommended option
**Notes:** Keep lifecycle scope intentionally small for the first authoring pass.

---

## the agent's Discretion

- Exact helper signatures and option bag details
- Internal runtime/type organization

## Deferred Ideas

- Chapter-level lifecycle hooks
- Step-level lifecycle hooks
- Metadata-heavy step definitions
