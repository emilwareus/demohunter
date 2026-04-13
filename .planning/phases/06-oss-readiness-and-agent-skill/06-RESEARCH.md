# Phase 06: OSS Readiness and Agent Skill - Research

**Researched:** 2026-04-13  
**Domain:** OSS adoption, example apps, agent skill packaging, and launch readiness  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints

No explicit `06-CONTEXT.md` exists for this phase. Research is grounded in the current roadmap, requirements, repo state, and product docs.

### Locked Product Constraints
- DemoHunter stays a local-first OSS CLI and SDK; cloud behavior remains out of scope for Phase 6.
- DemoHunter stays a thin wrapper on top of Playwright and must not automate app readiness, auth, or bootstrap beyond normal user Playwright code.
- `.demohunter/<tour-id>/` is already the portable handoff boundary and must remain the center of example and docs validation.
- The public repo must be usable without maintainer hand-holding, which means examples, docs, error clarity, CI, and licensing all need to land together instead of as optional polish.

### Current Repo Facts
- There is currently no `README.md`.
- There is currently no `LICENSE`.
- There is currently no `.github/` workflow directory.
- There is currently no `examples/` directory.
- Root scripts already provide a workable verification spine: `build`, `typecheck`, `test`, `test:unit`, `test:e2e`, and `verify`.

### Open Planning Latitude
- The exact workspace wiring for `examples/` is still open.
- The exact permissive license is still open.
- The exact shape of agent-skill reference files and template assets is still open, as long as the repo ships plain markdown-installable skill docs.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OSS-01 | The repo includes working example projects for Next.js and Vite demo flows. [VERIFIED: .planning/REQUIREMENTS.md] | Add `examples/nextjs-demo` and `examples/vite-demo` as minimal but real apps in the monorepo, each with a demo page, `demohunter.config.ts`, and a tour proving generation against a live local app. |
| OSS-02 | The repo includes installable markdown skill docs that let agents like Codex or Claude create or update `.tour.ts` files. [VERIFIED: .planning/REQUIREMENTS.md] | Ship a plain `skills/demohunter/` bundle with one concise `SKILL.md`, a small set of reference files, and one template `.tour.ts` asset that stays aligned with the actual SDK/runtime contract. |
| OSS-03 | The public OSS repo ships with docs, better error handling, CI, and a permissive license so new users can succeed without maintainer intervention. [VERIFIED: .planning/REQUIREMENTS.md] | Land README/onboarding/troubleshooting docs, adoption-focused CLI error improvements, a default CI workflow that runs deterministic verification, and a permissive `LICENSE` file. |
</phase_requirements>

## Summary

Phase 6 should be treated as a consumer-path phase, not a pure docs phase. The repo already has the core engine and portable output contract; what it lacks is the public surface that proves a new user can actually adopt it. The plan should therefore center on three adoption loops: example apps, agent-assisted authoring, and first-run OSS onboarding.

The most important planning decision is to keep the examples deliberately small. A full production-style Next.js or Vite app would create maintenance burden and flaky tests without improving the proof. The stronger approach is two tiny example apps with stable selectors, one representative tour each, and a shared verification harness that launches the local app and runs `demohunter generate` against it. This directly proves OSS-01 without turning the examples into a second product.

The skill work should be packaged as plain markdown instructions under `skills/demohunter/`, not as repo-specific automation magic. The installable unit is the skill folder itself: one short `SKILL.md`, a few focused reference files, and one valid template tour asset that references the real SDK contract. That is enough for Codex or Claude to create and update `.tour.ts` files without inventing a product-side agent system.

For OSS readiness, the docs and errors should be optimized around the actual failure points new users hit first: missing Playwright browsers, missing `ffmpeg`, missing `OPENAI_API_KEY` on uncached narration, and confusion about what DemoHunter does not manage. CI should stay deterministic and should not require a live OpenAI key by default; the existing gated live OpenAI test can remain opt-in and skipped in normal CI.

## Standard Stack And Sources

| Tool / Source | Why It Matters |
|---------------|----------------|
| [Next.js installation docs](https://nextjs.org/docs/app/getting-started/installation) | Confirms the current supported app-router scaffold path for the example app. [CITED] |
| [Next.js `transpilePackages` docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages) | Relevant if the Next example consumes local workspace packages directly. [CITED] |
| [Vite guide](https://vite.dev/guide/) | Confirms the current Vite scaffold and dev-server shape for the example app. [CITED] |
| [Playwright browser install docs](https://playwright.dev/docs/browsers) | Relevant to CI and first-run onboarding because Chromium must exist for end-to-end generation tests. [CITED] |
| [Bun installation docs](https://bun.sh/docs/installation) | Useful for README quickstart and CI setup. [CITED] |
| Local Codex skill format reference: `/Users/emilwareus/.codex/skills/.system/skill-creator/SKILL.md` | Confirms that plain `SKILL.md` plus optional references/assets is the correct installable unit for Codex. [VERIFIED: local skill reference] |

## Architecture Recommendations

### Pattern 1: Add `examples/*` To The Workspace, But Keep Them Thin

**What:** Extend the root workspace to include `examples/*`, with two minimal consumer apps:
- `examples/nextjs-demo`
- `examples/vite-demo`

Each example should include:
- a tiny app with deterministic UI and selectors
- `demohunter.config.ts`
- `demos/` with one real `.tour.ts`
- example-specific run scripts so e2e can start the dev server predictably

**Why:** The repo needs to prove real consumer paths, not just internal package tests. Workspace wiring keeps install friction low and lets the examples consume local packages without publishing.

**Recommendation:** Make the example apps intentionally boring. One screen, one or two state changes, obvious selectors, and no external APIs. The test value comes from proving adoption, not from demonstrating sophisticated UI.

### Pattern 2: Validate Examples Through A Shared End-To-End Harness

**What:** Add one Phase 6 example contract test that:
- installs/builds from the monorepo workspace
- starts each example app on its own local port
- runs `demohunter generate` against the example tour
- asserts `.demohunter/<tour-id>/manifest.json` and `video.mp4` exist

**Why:** This is the only realistic proof for OSS-01. Static example files alone do not prove the examples survive repo evolution.

**Recommendation:** Keep the validation consumer-oriented:
- do not test Next.js and Vite internals
- do not record large or flaky app flows
- do prove that a fresh repo user can run the examples end to end

### Pattern 3: Ship One Installable Skill Bundle, Not Multiple Competing Agent Surfaces

**What:** Add `skills/demohunter/` with:
- `SKILL.md`
- `references/authoring.md`
- `references/cli.md`
- `references/troubleshooting.md`
- `assets/tour.template.ts`

Optional:
- `agents/openai.yaml` if the project wants skill-chip metadata for Codex-compatible UIs

**Why:** The requirement is plain markdown-installable skill docs. A single canonical skill avoids divergence between Claude/Codex instructions and the actual repo contract.

**Recommendation:** The skill should teach agents how to:
- inspect `demohunter.config.ts`
- preserve normal Playwright patterns
- add or update `.tour.ts` files without inventing abstractions
- keep selectors and narration grounded in the target app
- run verification after edits

### Pattern 4: README And Errors Must Point At The Same Adoption Path

**What:** README and CLI errors should both steer the user through the same first-run sequence:
1. Install Bun, Playwright browser runtime, and `ffmpeg`
2. Run `demohunter init` or open an example
3. Set `OPENAI_API_KEY` only when uncached narration is needed
4. Run `demohunter generate ...`

**Why:** New-user frustration usually comes from hidden prerequisites and vague error text, not missing implementation depth.

**Recommendation:** Improve error text for exactly these cases:
- missing browser runtime
- missing `ffmpeg`
- missing `OPENAI_API_KEY` for uncached narration
- invalid or missing tour entrypoint
- invalid `baseURL`/app not reachable under normal Playwright behavior

The docs should explain that DemoHunter does not manage app startup, auth, or Playwright test-runner concerns.

### Pattern 5: CI Must Stay Deterministic By Default

**What:** Add a standard GitHub Actions workflow that installs Bun, installs Playwright Chromium, and runs the existing deterministic verification path without requiring a live OpenAI key.

**Why:** OSS CI should prove the default path on every PR. Live OpenAI coverage is valuable, but it should remain opt-in or secret-gated so contributors are not blocked.

**Recommendation:** Default CI should run:
- install dependencies
- `bun x playwright install --with-deps chromium`
- `bun run verify`

The already-gated live OpenAI integration test should continue to skip unless the CI environment explicitly provides `OPENAI_API_KEY` and the opt-in flag.

## Recommended Phase Decomposition

| Plan | Scope | Requirements |
|------|-------|--------------|
| 06-01 | Add and validate the Next.js and Vite examples as real consumer paths | OSS-01 |
| 06-02 | Add the installable `skills/demohunter` bundle, references, template asset, and skill contract checks | OSS-02 |
| 06-03 | Improve README/docs/onboarding and harden adoption-path CLI errors | OSS-03 |
| 06-04 | Add CI workflow(s), choose the permissive license, and lock launch-readiness verification | OSS-03 |

This split matches the roadmap placeholders and keeps the only heavy implementation item, example apps, isolated from docs and CI churn.

## Verification Strategy

### Must Be Automated
- Example generation from both `examples/nextjs-demo` and `examples/vite-demo`
- Skill bundle contract checks: required files exist, internal links resolve, template tour typechecks/loads against the current SDK
- CLI tests for new or improved adoption-path error messages
- CI-safe full repo verification without a live OpenAI key

### Can Stay Static / Doc-Level
- Public README prose quality
- Example screenshots or narrative explanation
- Skill install instructions for specific agent products, as long as the installable skill folder is correct

### Human Spot Checks Still Worth Doing
- Run one example manually to confirm the documented quickstart reads naturally
- Read the skill end to end once to confirm it does not encourage non-idiomatic Playwright usage

## Common Pitfalls

### Pitfall 1: Overbuilding The Examples
**What goes wrong:** The examples become miniature applications with large dependency graphs, brittle selectors, and slow CI.  
**How to avoid:** Keep each example to one or two demoable flows with deterministic UI and no external API dependencies.

### Pitfall 2: Letting Skill Docs Drift From The SDK
**What goes wrong:** Agents generate invalid `.tour.ts` files because the template or instructions reference old helpers or wrong file paths.  
**How to avoid:** Add a skill contract test that validates the template and the existence of referenced docs/paths.

### Pitfall 3: Writing Docs That Promise More Automation Than The Product Provides
**What goes wrong:** Users assume DemoHunter starts their app, manages auth, or behaves like `@playwright/test`.  
**How to avoid:** State the boundary clearly in README, example docs, and error text.

### Pitfall 4: Making CI Depend On Live OpenAI
**What goes wrong:** Public contribution flow becomes fragile, slow, or secret-dependent.  
**How to avoid:** Keep live narration integration explicitly gated and skipped in normal CI.

### Pitfall 5: Choosing A License Too Late
**What goes wrong:** The repo looks unfinished or legally ambiguous even if the code is solid.  
**How to avoid:** Decide and commit a permissive license in the same wave as CI and README polish. My recommendation is **MIT** for the least-friction OSS adoption path unless explicit patent-grant requirements emerge.

## Concrete Planning Recommendations

1. Put `examples/*` into the workspace so installs stay one-command and the examples can consume local packages directly.
2. Use one shared e2e harness for both examples instead of separate bespoke test stacks.
3. Make `skills/demohunter/SKILL.md` concise, and move details into `references/` plus one template asset.
4. Treat README as the main onboarding surface and keep deeper docs in a small `docs/` set instead of many scattered files.
5. Improve only the error surfaces that block adoption; do not turn Phase 6 into a generic error-message rewrite.
6. Default CI should prove deterministic OSS behavior only; live OpenAI stays optional.

## Suggested Plan Order

1. `06-01` examples first, because they are the strongest external proof and they inform docs.
2. `06-02` skill bundle next, because it depends on the final authoring surface already established.
3. `06-03` docs and error polish after examples/skill paths are concrete.
4. `06-04` CI and license last, once the main verification commands are finalized.

## References

- [Next.js installation docs](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js `transpilePackages` docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Vite guide](https://vite.dev/guide/)
- [Playwright browsers docs](https://playwright.dev/docs/browsers)
- [Bun installation docs](https://bun.sh/docs/installation)
- Local skill reference: `/Users/emilwareus/.codex/skills/.system/skill-creator/SKILL.md`

## RESEARCH COMPLETE

Phase 6 should be planned as four concrete adoption-focused plans: examples, agent skill bundle, docs/error polish, and CI/license. The repo should add thin workspace examples, one canonical `skills/demohunter` bundle, onboarding docs tied to clearer prerequisite errors, and deterministic CI that skips live OpenAI by default.
