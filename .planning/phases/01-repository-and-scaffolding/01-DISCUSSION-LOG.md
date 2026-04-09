# Phase 1: Repository and Scaffolding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-09T06:13:41Z
**Phase:** 1-Repository and Scaffolding
**Areas discussed:** Package layout, `demohunter init` behavior, Starter sample, Config UX

---

## Package layout

| Option | Description | Selected |
|--------|-------------|----------|
| Full planned workspace now | Create all intended packages immediately: `sdk`, `cli`, `generator-playwright`, `tts-core`, `tts-openai`, `manifest`, `create-demohunter`. | Yes |
| Phase-1-only packages | Create only what Phase 1 strictly needs now, then add the rest in later phases. | |
| Hybrid | Create all package directories now, but only fully wire/build the Phase 1-critical ones while the rest are stubs. | |

**User's choice:** Full planned workspace now
**Notes:** User chose `1`.

---

## `demohunter init` behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal and safe | Create only `demohunter.config.ts`, one sample `.tour.ts`, and the minimum folders needed. | Yes |
| Opinionated starter | Create config, sample tour, a `demos/` folder, a `.demohunter/` ignore rule if needed, and a clear starter structure the user can keep. | |
| Split modes | Default to minimal, but support an optional richer starter mode later, such as `demohunter init --example`. | |

**User's choice:** Minimal and safe
**Notes:** User clarified the sample should live in a `demos/` folder and initially suggested using a public site before refining that later.

---

## Starter sample

| Option | Description | Selected |
|--------|-------------|----------|
| Local bundled static sample | `init` creates a tiny static demo page in the repo and the sample tour runs against that. | Yes |
| External public site sample | The sample tour targets a public site like Google. | |
| Both | Ship a reliable local static sample as the default, and include an optional public-site example tour in `demos/`. | |

**User's choice:** Local bundled static sample
**Notes:** User wants a simple smoke-path starter and plans to later replace it with a DemoHunter self-demo.

---

## Starter sample scope

| Option | Description | Selected |
|--------|-------------|----------|
| Bare smoke path | A very small tour that opens the local static page, clicks or navigates a little, and proves the scaffold works. | Yes |
| More narrative sample | A slightly richer tour with multiple steps and chapters so users immediately see the intended authoring style. | |
| Two samples | One tiny smoke test sample and one more expressive sample. | |

**User's choice:** Bare smoke path
**Notes:** User chose `1`.

---

## Config UX

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal config | Include only the fields needed for the Phase 1 sample to run, with the rest implied by defaults. | Yes |
| Full future-facing config | Generate the broader config shape from the spec now, even if some fields are only used in later phases. | |
| Minimal visible config, richer typed defaults | The generated file stays small, but the internal config system already supports the fuller future shape. | |

**User's choice:** Minimal config
**Notes:** User chose `1`.

---

## the agent's Discretion

- Internal default handling can stay richer than the generated starter config if the generated file remains minimal.

## Deferred Ideas

- Replace the starter sample later with a DemoHunter self-demo.
