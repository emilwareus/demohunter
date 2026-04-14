---
phase: 06-oss-readiness-and-agent-skill
plan: 03
subsystem: docs
tags: [oss, onboarding, docs, cli, playwright, ffmpeg]
requires:
  - phase: 01-oss-core
    provides: local CLI, SDK, starter scaffold, and generation behavior that the public onboarding path documents
  - phase: 06-oss-readiness-and-agent-skill
    provides: example apps and skill bundle paths referenced by the public docs
provides:
  - Public README plus focused getting-started and troubleshooting docs
  - Actionable CLI guidance for first-run generate and init failures
  - Docs-and-errors onboarding contract coverage through the source CLI
affects: [oss-readiness, docs, cli, examples, agent-skill]
tech-stack:
  added: []
  patterns: [public onboarding docs split by entrypoint/setup/troubleshooting, CLI error translation for adoption blockers]
key-files:
  created:
    [README.md, docs/getting-started.md, docs/troubleshooting.md, tests/e2e/oss-onboarding-contract.test.ts]
  modified:
    [packages/cli/src/commands/generate.ts, packages/cli/src/commands/init.ts, packages/cli/src/commands/generate.test.ts]
key-decisions:
  - "Keep README concise and move deeper setup and failure guidance into two focused docs instead of one long onboarding wall."
  - "Translate only adoption-path failures in the CLI so first-run errors get actionable guidance without rewriting unrelated internals."
  - "Preserve important original failure signals inside improved messages when wider repo contracts already depend on them."
patterns-established:
  - "Public docs should point at the same repo-local commands the source-cli e2e contract verifies."
  - "Onboarding errors should name the missing prerequisite or boundary and tell the user the next command or correction."
requirements-completed: [OSS-03]
duration: 4h 58m
completed: 2026-04-14
---

# Phase 06 Plan 03: OSS onboarding docs and adoption-path error handling Summary

**Public onboarding docs, troubleshooting guidance, and source-cli error messages now reflect one real DemoHunter OSS adoption path**

## Performance

- **Duration:** 4h 58m
- **Started:** 2026-04-13T21:40:38+02:00
- **Completed:** 2026-04-14T06:38:30+02:00
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added a public `README.md` with prerequisites, product boundary, quickstart, example paths, skill note, and verification commands.
- Added `docs/getting-started.md` and `docs/troubleshooting.md` so setup details and first-run blockers live in one small, coherent doc set.
- Hardened `demohunter generate` and `demohunter init` onboarding-path errors and locked them down with source-cli and unit coverage.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add public onboarding docs that reflect the real OSS workflow**
2. `189e0e8` `feat(06-03): add OSS onboarding docs`
3. **Task 2: Harden adoption-path CLI errors and verify them**
4. `16beaf0` `test(06-03): add failing onboarding error contracts`
5. `af4e0ff` `fix(06-03): harden OSS onboarding error guidance`

## Files Created/Modified
- `README.md` - Main OSS entrypoint with the real local-first adoption flow and product boundary.
- `docs/getting-started.md` - Expanded setup, example usage, starter-project path, and verification commands.
- `docs/troubleshooting.md` - First-run fixes for missing Playwright browser runtime, `ffmpeg`, `OPENAI_API_KEY`, invalid tour shape, and unreachable `baseURL`.
- `packages/cli/src/commands/generate.ts` - Maps adoption blockers to actionable guidance while preserving useful underlying failure signals.
- `packages/cli/src/commands/init.ts` - Adds overwrite guidance for `init` without breaking existing starter rerun expectations.
- `packages/cli/src/commands/generate.test.ts` - Covers the new CLI guidance for browser runtime, `ffmpeg`, credentials, reachability, and invalid tour shape.
- `tests/e2e/oss-onboarding-contract.test.ts` - Verifies doc command alignment and source-cli first-run error guidance.

## Decisions Made
- Kept the onboarding surface small: `README.md` for entry, `docs/getting-started.md` for setup, and `docs/troubleshooting.md` for failure recovery.
- Anchored the docs in the repo’s real consumer paths (`examples/*`, `bun x demohunter ...`, and `skills/demohunter`) instead of aspirational flows.
- Preserved original low-level failure phrases inside improved narration guidance where existing e2e contracts still depended on them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Preserved the original narration failure signal inside the improved OPENAI_API_KEY guidance**
- **Found during:** Task 2
- **Issue:** The broader generation-engine contract still asserted the original `Unable to resolve narration segment ...` phrase and failed after the onboarding wording change.
- **Fix:** Kept the new actionable missing-key guidance, but appended the original underlying error so the wider repo contract stayed compatible.
- **Files modified:** `packages/cli/src/commands/generate.ts`
- **Verification:** `bun test tests/e2e/oss-onboarding-contract.test.ts`, `bun test packages/cli/src/commands/generate.test.ts`, `bun run verify`
- **Committed in:** `af4e0ff`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation preserved compatibility with an existing repo contract while keeping the intended onboarding improvement. No scope creep.

## Issues Encountered
- A targeted rerun of `tests/e2e/generation-engine-contract.test.ts` behaved inconsistently after an earlier interrupted session, so final verification was driven from the canonical `bun run verify` path instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- OSS users now have a public entrypoint, deeper setup/troubleshooting docs, and clearer first-run CLI guidance.
- Phase `06-04` can focus on CI and licensing with stable onboarding commands and error wording already under contract.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/06-oss-readiness-and-agent-skill/06-oss-readiness-and-agent-skill-03-SUMMARY.md`
- Verified task commits exist: `189e0e8`, `16beaf0`, `af4e0ff`

---
*Phase: 06-oss-readiness-and-agent-skill*
*Completed: 2026-04-14*
