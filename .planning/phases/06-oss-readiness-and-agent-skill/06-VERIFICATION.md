---
phase: 06-oss-readiness-and-agent-skill
verified: 2026-04-14T05:01:08Z
status: human_needed
score: 3/3 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Fresh-user onboarding walkthrough"
    expected: "A first-time OSS user can follow README.md and docs/getting-started.md from a clean checkout, choose the right repo-local path, and reach generated output without maintainer help."
    why_human: "Docs clarity, sequencing, and ambiguity around public adoption are usability judgments that structural tests cannot fully verify."
  - test: "CLI error-message clarity"
    expected: "When Playwright, ffmpeg, or OPENAI_API_KEY are missing, the reported guidance is immediately understandable and points to the next action without confusion."
    why_human: "The tests prove message presence, but whether the wording is actually clear to a new user is a human judgment."
  - test: "Agent skill usability in a real client"
    expected: "Using only skills/demohunter, a Codex or Claude user can create or update a valid .tour.ts file while staying Playwright-native."
    why_human: "The contract tests verify paths and type safety, not real agent behavior across clients."
---

# Phase 6: OSS Readiness and Agent Skill Verification Report

**Phase Goal:** Make DemoHunter usable as a public OSS project through examples, docs, agent skill docs, CI, and launch polish.
**Verified:** 2026-04-14T05:01:08Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | The repo includes working Next.js and Vite examples that demonstrate the intended workflow. | ✓ VERIFIED | Root workspace includes `examples/*` in [package.json](/Users/emilwareus/Development/demohunter/package.json:5). Both examples ship repo-local `generate` scripts and `baseURL` config in [examples/nextjs-demo/package.json](/Users/emilwareus/Development/demohunter/examples/nextjs-demo/package.json:8), [examples/vite-demo/package.json](/Users/emilwareus/Development/demohunter/examples/vite-demo/package.json:8), [examples/nextjs-demo/demohunter.config.ts](/Users/emilwareus/Development/demohunter/examples/nextjs-demo/demohunter.config.ts:6), and [examples/vite-demo/demohunter.config.ts](/Users/emilwareus/Development/demohunter/examples/vite-demo/demohunter.config.ts:6). [tests/e2e/examples-contract.test.ts](/Users/emilwareus/Development/demohunter/tests/e2e/examples-contract.test.ts:50) passed for both example roots and asserted `manifest.json`, `chapters.json`, and `video.mp4` output. `bun run --cwd examples/nextjs-demo build` and `bun run --cwd examples/vite-demo build` both passed. |
| 2 | Agent skill docs let Codex or Claude create or update valid `.tour.ts` files in-repo. | ✓ VERIFIED | The canonical skill entrypoint links its references and template in [skills/demohunter/SKILL.md](/Users/emilwareus/Development/demohunter/skills/demohunter/SKILL.md:13) and explicitly preserves Playwright-native code in [skills/demohunter/SKILL.md](/Users/emilwareus/Development/demohunter/skills/demohunter/SKILL.md:20). Authoring rules and current helper surface are documented in [skills/demohunter/references/authoring.md](/Users/emilwareus/Development/demohunter/skills/demohunter/references/authoring.md:5). The shipped starter template is a real `defineTour` file in [skills/demohunter/assets/tour.template.ts](/Users/emilwareus/Development/demohunter/skills/demohunter/assets/tour.template.ts:1). `bun test tests/skills/demohunter-skill-contract.test.ts` passed and typechecked the template against current workspace sources. |
| 3 | New users can adopt the OSS project from the public repo with docs, CI, better errors, and a license in place. | ✓ VERIFIED | README, setup, and troubleshooting docs align around the repo-local OSS path in [README.md](/Users/emilwareus/Development/demohunter/README.md:16), [README.md](/Users/emilwareus/Development/demohunter/README.md:55), [docs/getting-started.md](/Users/emilwareus/Development/demohunter/docs/getting-started.md:10), and [docs/troubleshooting.md](/Users/emilwareus/Development/demohunter/docs/troubleshooting.md:75). CLI guidance for missing config, browser runtime, ffmpeg, uncached narration, and baseURL reachability is implemented in [packages/cli/src/commands/generate.ts](/Users/emilwareus/Development/demohunter/packages/cli/src/commands/generate.ts:98) and guarded by [packages/cli/src/commands/generate.test.ts](/Users/emilwareus/Development/demohunter/packages/cli/src/commands/generate.test.ts:98). Public CI provisions ffmpeg and Playwright Chromium, builds both examples, and runs `bun run verify` in [.github/workflows/ci.yml](/Users/emilwareus/Development/demohunter/.github/workflows/ci.yml:39). MIT licensing is present in [LICENSE](/Users/emilwareus/Development/demohunter/LICENSE:1). `bun test tests/e2e/oss-onboarding-contract.test.ts` passed and `bun run verify` passed with 153 tests. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `examples/nextjs-demo/demohunter.config.ts` | Real Next.js example consumer config | ✓ VERIFIED | Exists, sets example `baseURL`, `outputDir`, and cache wiring; consumed by the example `generate` script and exercised by the example e2e contract. |
| `examples/vite-demo/demohunter.config.ts` | Real Vite example consumer config | ✓ VERIFIED | Exists, sets example `baseURL`, `outputDir`, and cache wiring; consumed by the example `generate` script and exercised by the example e2e contract. |
| `tests/e2e/examples-contract.test.ts` | Consumer-path verification for both examples | ✓ VERIFIED | Boots each example app from its own root, primes offline-safe narration cache, runs `generate`, and asserts portable output files. |
| `skills/demohunter/SKILL.md` | Canonical installable skill entrypoint | ✓ VERIFIED | Exists, points to reference files and template asset, and states the Playwright-native editing rules. |
| `skills/demohunter/assets/tour.template.ts` | Valid starter tour template | ✓ VERIFIED | Real `defineTour` template with `chapter`, `step`, `narrate`, `waitForStable`, and `snapshot`; typechecked in the skill contract test. |
| `tests/skills/demohunter-skill-contract.test.ts` | Skill drift protection | ✓ VERIFIED | Verifies required files, markdown links, CLI command references, and template type safety. |
| `README.md` | Primary public onboarding doc | ✓ VERIFIED | Contains prerequisites, quickstart, product boundary, example paths, skill note, verification commands, and license/CI posture. |
| `docs/getting-started.md` | Expanded onboarding doc | ✓ VERIFIED | Covers prerequisites, example walkthroughs, repo-local starter path, output contract, and verification commands. |
| `docs/troubleshooting.md` | First-run failure guidance | ✓ VERIFIED | Covers Playwright runtime, ffmpeg, OPENAI_API_KEY, invalid tour shape, baseURL reachability, and product-boundary confusion. |
| `tests/e2e/oss-onboarding-contract.test.ts` | Onboarding-path verification | ✓ VERIFIED | Guards docs alignment, CI assumptions, and source-CLI error guidance. |
| `.github/workflows/ci.yml` | Default public CI workflow | ✓ VERIFIED | Provisions ffmpeg and Playwright Chromium, builds both example apps, and runs the repo verify path. |
| `LICENSE` | Permissive OSS license | ✓ VERIFIED | MIT license committed in-repo. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `examples/*/package.json` | `demohunter generate` | Example `generate` scripts | ✓ WIRED | Both examples invoke `bun x demohunter generate demos/*.tour.ts` from the example root, matching the consumer path used in `tests/e2e/examples-contract.test.ts`. |
| `tests/e2e/examples-contract.test.ts` | Example output artifacts | Spawned example dev server + `bun run generate` | ✓ WIRED | The contract test starts each app, waits for readiness, runs generation from the example root, and validates generated `manifest.json`, `chapters.json`, and `video.mp4`. |
| `skills/demohunter/SKILL.md` | Reference docs and template | Relative markdown links | ✓ WIRED | The skill points to `references/authoring.md`, `references/cli.md`, `references/troubleshooting.md`, and `assets/tour.template.ts`; `tests/skills/demohunter-skill-contract.test.ts` resolves those links. |
| `README.md` / onboarding docs | CLI and CI contract | `tests/e2e/oss-onboarding-contract.test.ts` | ✓ WIRED | The onboarding contract checks the public docs for the same repo-local commands and CI assumptions that the repo actually ships. |
| `.github/workflows/ci.yml` | Default verification path | `bun run verify` | ✓ WIRED | CI provisions system prerequisites, builds both examples, and runs the same verify command the README advertises. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `tests/e2e/examples-contract.test.ts` | Generated manifest, chapters, and video paths | `bun run generate` executed from each example root after local dev-server readiness | Yes | ✓ FLOWING |
| `tests/e2e/oss-onboarding-contract.test.ts` | CLI stderr guidance for onboarding failures | Source CLI entrypoint invoking `packages/cli/src/commands/generate.ts` against temp projects | Yes | ✓ FLOWING |
| `tests/skills/demohunter-skill-contract.test.ts` | Template typecheck and link validation results | Real workspace file paths plus temporary `tsconfig` typecheck against `@demohunter/sdk` source | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Next.js example has a framework-native build path | `bun run --cwd examples/nextjs-demo build` | Next.js 16 build passed and produced static route output | ✓ PASS |
| Vite example has a framework-native build path | `bun run --cwd examples/vite-demo build` | Vite build passed | ✓ PASS |
| Both example apps generate portable output from their own roots | `bun test tests/e2e/examples-contract.test.ts` | 2/2 tests passed | ✓ PASS |
| Skill bundle is internally consistent and template-valid | `bun test tests/skills/demohunter-skill-contract.test.ts` | 3/3 tests passed | ✓ PASS |
| Onboarding docs, CI assumptions, and first-run CLI guidance stay aligned | `bun test tests/e2e/oss-onboarding-contract.test.ts` | 3/3 tests passed | ✓ PASS |
| Default public verification path is green | `bun run verify` | 153 tests passed, 0 failed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `OSS-01` | `06-01-PLAN.md` | The repo includes working example projects for Next.js and Vite demo flows. | ✓ SATISFIED | Example package scripts and config exist; both example builds passed; `tests/e2e/examples-contract.test.ts` passed and verified portable output from both example roots. |
| `OSS-02` | `06-02-PLAN.md` | The repo includes installable markdown skill docs that let agents like Codex or Claude create or update `.tour.ts` files. | ✓ SATISFIED | `skills/demohunter/` ships `SKILL.md`, reference docs, and `assets/tour.template.ts`; `tests/skills/demohunter-skill-contract.test.ts` passed. |
| `OSS-03` | `06-03-PLAN.md`, `06-04-PLAN.md` | The public OSS repo ships with docs, better error handling, CI, and a permissive license so new users can succeed without maintainer intervention. | ✓ SATISFIED | README/docs exist and align with onboarding tests; CLI error translations are implemented and unit-tested; CI workflow exists and passed spot-check assumptions; MIT `LICENSE` exists; `bun run verify` passed. |

Orphaned requirements: none. Every Phase 06 requirement declared in `REQUIREMENTS.md` is claimed by at least one Phase 06 plan, and every requirement claimed by plan frontmatter was accounted for above.

### Anti-Patterns Found

No blocker or warning anti-patterns were found in the Phase 06 files reviewed. Pattern-based artifact failures from `gsd-tools verify artifacts` were limited to literal `contains:` string mismatches in plan frontmatter, not missing or stub implementations.

### Human Verification Required

### 1. Fresh-User Onboarding Walkthrough

**Test:** Follow `README.md` and `docs/getting-started.md` from a clean checkout on a machine without repo context.
**Expected:** A new OSS user picks the repo-local example or starter path correctly, understands the product boundary, and reaches generated output without maintainer help.
**Why human:** This is a comprehension and ergonomics check; automated tests only prove that commands and files exist and run.

### 2. CLI Error-Message Clarity

**Test:** Intentionally trigger missing-browser, missing-ffmpeg, and missing-`OPENAI_API_KEY` failures and read the resulting CLI guidance as a first-time user.
**Expected:** The next action is obvious without needing to inspect source code or surrounding tests.
**Why human:** The tests prove message coverage, but clarity and usefulness are human-judgment properties.

### 3. Agent Skill Usability In A Real Client

**Test:** Install or reference `skills/demohunter` in a real Codex or Claude session and ask the agent to create or update a tour.
**Expected:** The agent stays Playwright-native, uses the shipped template/rules, and produces a valid `.tour.ts` plus repo-local verification steps.
**Why human:** Structural checks do not prove how real clients interpret and follow the markdown skill bundle.

### Gaps Summary

No programmatic gaps were found against the Phase 06 roadmap contract or plan frontmatter must-haves. Automated verification shows the examples, skill bundle, onboarding docs, CLI error handling, CI workflow, and license are present, substantive, wired, and passing the repo’s advertised verification path. Remaining work is human-only validation of UX clarity for first-time OSS adopters and real client behavior for the shipped agent skill.

---

_Verified: 2026-04-14T05:01:08Z_
_Verifier: Claude (gsd-verifier)_
