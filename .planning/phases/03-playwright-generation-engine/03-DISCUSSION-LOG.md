# Phase 3: Playwright Generation Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 03-playwright-generation-engine
**Areas discussed:** app readiness and Playwright responsibility, recording overlays, output behavior, pass-2 strictness

---

## App Readiness and Playwright Responsibility

| Option | Description | Selected |
|--------|-------------|----------|
| Lean into Playwright | Do not add extra app-readiness automation; user remains responsible for app startup and Playwright setup. | ✓ |
| Add readiness retries | Try to wait/retry for local app availability before generation starts. | |

**User's choice:** Lean into Playwright. User explicitly said DemoHunter should not try to automate app startup or extra Playwright setup behavior.
**Notes:** The user wants DemoHunter to avoid “extra stuff to automate Playwright.” App running/open/setup remains the user’s job.

---

## Recording Overlays

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal and brief | Overlays appear lightly and briefly so recorded output stays focused on the product. | ✓ |
| Clearly visible and instructional | Overlays are more prominent and persistent to emphasize guidance. | |

**User's choice:** Minimal and brief.
**Notes:** The user chose the lighter-touch overlay direction.

---

## Output Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| `mp4` default, `webm` opt-in | Default generation writes `mp4`; `webm` is only produced when requested. | ✓ |
| Generate both when configured broadly | Try to emit multiple formats by default when possible. | |

**User's choice:** `mp4` default, `webm` opt-in.
**Notes:** This keeps default generation narrower and simpler in Phase 3.

---

## Pass-2 Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Strict failure on divergence | If pass 2 diverges from pass 1 timing or page state, fail clearly. | ✓ |
| Best-effort output | Continue and still emit output if replay diverges. | |

**User's choice:** Strict failure on divergence.
**Notes:** The user explicitly preferred “strict is better.”

---

## the agent's Discretion

- Exact two-pass internals, replay structures, and error taxonomy.
- Exact brief overlay visuals and timing.
- Exact baseline artifact-writing decomposition within the Phase 3 roadmap boundary.

## Deferred Ideas

- Narration synthesis, caching, and subtitle generation belong to later phases.

