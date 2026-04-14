---
phase: 06-oss-readiness-and-agent-skill
plan: 04
subsystem: infra
tags: [oss, github-actions, ci, license, bun, playwright, ffmpeg]
requires:
  - phase: 06-oss-readiness-and-agent-skill
    provides: public docs, onboarding error handling, and stable verification commands
provides:
  - Deterministic GitHub Actions CI for the default OSS verification path
  - Explicit MIT licensing for public OSS adoption
  - Static onboarding coverage for CI workflow assumptions
affects: [oss-readiness, public repo, docs, contributor workflow]
tech-stack:
  added: [GitHub Actions]
  patterns: [single-job OSS verification workflow, explicit ffmpeg provisioning, secret-free default CI]
key-files:
  created: [.github/workflows/ci.yml, LICENSE]
  modified: [README.md, tests/e2e/oss-onboarding-contract.test.ts]
key-decisions:
  - "Keep public CI to one contributor-friendly verify job instead of adding speculative release or deployment workflows."
  - "Leave live OpenAI narration out of the default CI path so pull requests never depend on maintainer secrets."
  - "Use MIT licensing for the lowest-friction OSS adoption path."
patterns-established:
  - "Public CI should provision system prerequisites explicitly before running `bun run verify`."
  - "Repo-facing docs and static onboarding tests should reference the same verification contract."
requirements-completed: [OSS-03]
duration: 4m
completed: 2026-04-14
---

# Phase 06 Plan 04: OSS launch contract Summary

**Deterministic public CI via GitHub Actions plus an explicit MIT license for the default DemoHunter OSS adoption path**

## Performance

- **Duration:** 4m
- **Started:** 2026-04-14T06:41:28+02:00
- **Completed:** 2026-04-14T06:45:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `.github/workflows/ci.yml` to prove the default `bun run verify` path on pushes to `main` and pull requests.
- Explicitly provisioned `ffmpeg` and Playwright Chromium in CI so fresh runners match the repo's documented prerequisites.
- Added an in-repo MIT `LICENSE` and updated `README.md` to surface the repo's public CI and licensing posture.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add public CI that proves the deterministic OSS path**
2. `546cd61` `test(06-04): add failing public ci contract`
3. `faeacb5` `feat(06-04): add deterministic public ci workflow`
4. **Task 2: Add the permissive license and finalize public-repo readiness messaging**
5. `4244cd0` `feat(06-04): add MIT license for public OSS use`

## Files Created/Modified
- `.github/workflows/ci.yml` - Public GitHub Actions workflow that installs Bun dependencies, provisions `ffmpeg`, installs Playwright Chromium, and runs `bun run verify`.
- `tests/e2e/oss-onboarding-contract.test.ts` - Static contract coverage for the public CI verification assumptions.
- `LICENSE` - Explicit MIT license text for public OSS use.
- `README.md` - Public-facing note of the MIT license and the GitHub Actions verification contract.

## Decisions Made
- Kept CI intentionally narrow with one verification job because OSS contributors need a predictable default contract more than extra release automation.
- Treated live OpenAI narration as out-of-band for public CI; the default workflow proves the offline-safe repo path only.
- Surfaced license and CI status directly in the README so the repo no longer depends on inferred metadata.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 06 now has examples, skill docs, onboarding docs, deterministic CI, and an explicit OSS license in place.
- The repo is structurally ready for public OSS use without additional maintainer-only setup steps in the default path.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/06-oss-readiness-and-agent-skill/06-oss-readiness-and-agent-skill-04-SUMMARY.md`
- Verified task commits exist: `546cd61`, `faeacb5`, `4244cd0`

---
*Phase: 06-oss-readiness-and-agent-skill*
*Completed: 2026-04-14*
