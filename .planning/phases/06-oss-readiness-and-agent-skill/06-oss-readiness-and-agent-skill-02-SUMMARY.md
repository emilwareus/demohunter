---
phase: 06-oss-readiness-and-agent-skill
plan: 02
subsystem: testing
tags: [oss, agent-skill, markdown, bun, typescript, playwright]
requires:
  - phase: 01-oss-core
    provides: DemoHunter SDK and CLI authoring surface consumed by the skill bundle
  - phase: 06-oss-readiness-and-agent-skill
    provides: example tours and repo-local verification paths used as skill references
provides:
  - Canonical installable `skills/demohunter` markdown skill bundle
  - Repo-valid `.tour.ts` starter template for agent-authored tours
  - Contract checks for markdown links, CLI commands, and template type safety
affects: [oss-readiness, agent-skill, docs, sdk, cli]
tech-stack:
  added: []
  patterns: [concise markdown skill bundle, repo-local verification guidance, temp-tsconfig contract typecheck]
key-files:
  created:
    [
      skills/demohunter/SKILL.md,
      skills/demohunter/references/authoring.md,
      skills/demohunter/references/cli.md,
      skills/demohunter/references/troubleshooting.md,
    ]
  modified:
    [
      skills/demohunter/assets/tour.template.ts,
      tests/skills/demohunter-skill-contract.test.ts,
    ]
key-decisions:
  - "Keep `SKILL.md` short and push detailed usage into focused reference files."
  - "Validate the shipped template with a temporary TypeScript config that maps `@demohunter/sdk` to workspace sources."
  - "Ship a concrete starter tour instead of placeholder-only template strings."
patterns-established:
  - "Agent skill docs should preserve Playwright-native code and explicitly forbid invented auth/bootstrap abstractions."
  - "Skill contract tests should resolve markdown links and typecheck bundled assets against current workspace code."
requirements-completed: [OSS-02]
duration: 5m
completed: 2026-04-13
---

# Phase 06 Plan 02: DemoHunter agent skill bundle Summary

**Installable DemoHunter markdown skill docs with a concrete `.tour.ts` starter and automated drift checks against the current CLI and SDK**

## Performance

- **Duration:** 5m
- **Started:** 2026-04-13T19:30:05Z
- **Completed:** 2026-04-13T19:35:42Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `skills/demohunter/` as the canonical installable skill bundle with one concise `SKILL.md` and focused references.
- Shipped a real `.tour.ts` template that uses the current `defineTour` and Playwright-native run context instead of pseudocode.
- Added automated contract coverage for required files, markdown links, documented CLI commands, and template type safety.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the installable DemoHunter skill bundle**
2. `6780916` `test(06-02): add failing DemoHunter skill bundle contract`
3. `d121c54` `feat(06-02): add installable DemoHunter skill bundle`
4. **Task 2: Add contract checks so the skill bundle cannot silently drift**
5. `6769a34` `test(06-02): strengthen skill bundle drift checks`
6. `81bd7b2` `fix(06-02): make DemoHunter skill template concrete`

## Files Created/Modified
- `skills/demohunter/SKILL.md` - Canonical skill entrypoint with workflow and authoring rules.
- `skills/demohunter/references/authoring.md` - Current SDK authoring contract and Playwright-native editing rules.
- `skills/demohunter/references/cli.md` - Supported CLI commands, verification flow, and output expectations.
- `skills/demohunter/references/troubleshooting.md` - Environment and generation failure guidance aligned with the OSS product boundary.
- `skills/demohunter/assets/tour.template.ts` - Concrete starter tour using the current `defineTour` surface.
- `tests/skills/demohunter-skill-contract.test.ts` - Structural guardrail for files, links, CLI commands, and template typechecking.

## Decisions Made
- Kept the skill install surface to plain markdown plus one asset, with deeper details moved into references to keep activation context small.
- Anchored the guidance in current repo-local verification commands instead of agent-specific automation promises.
- Made the shipped template concrete so agents get a useful starting point without carrying placeholder-only strings into user code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced direct template import validation with a temporary TypeScript contract harness**
- **Found during:** Task 2
- **Issue:** Importing `skills/demohunter/assets/tour.template.ts` directly from the test could not resolve `@demohunter/sdk` from the non-package `skills/` directory.
- **Fix:** Added a temporary `tsconfig.json` in the contract test with workspace path mapping and Node type roots so the template is typechecked against current SDK sources.
- **Files modified:** `tests/skills/demohunter-skill-contract.test.ts`
- **Verification:** `bun test tests/skills/demohunter-skill-contract.test.ts`, `bun run test`
- **Committed in:** `6769a34`

**2. [Rule 2 - Missing Critical] Replaced placeholder template strings with a concrete starter flow**
- **Found during:** Task 2
- **Issue:** The shipped template still used placeholder IDs, headings, and snapshot names, which weakened the "useful starter" requirement for OSS-02.
- **Fix:** Rewrote the template to a concrete `product-overview` example while keeping it generic enough for agents to adapt.
- **Files modified:** `skills/demohunter/assets/tour.template.ts`
- **Verification:** `bun test tests/skills/demohunter-skill-contract.test.ts`, `bun run test`, `bun x tsc -b tsconfig.json --pretty false`
- **Committed in:** `81bd7b2`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both changes were required to make the bundle verifiable and genuinely useful. No scope creep beyond OSS-02.

## Issues Encountered
- Direct runtime import was not a reliable way to validate a bundled asset outside a package boundary in this Bun workspace, so the test now validates the template through TypeScript instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- OSS-02 is now backed by a real installable skill bundle instead of markdown-only guidance.
- The docs/CI plan can now reference stable skill paths and a deterministic contract test.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/06-oss-readiness-and-agent-skill/06-oss-readiness-and-agent-skill-02-SUMMARY.md`
- Verified task commits exist: `6780916`, `d121c54`, `6769a34`, `81bd7b2`

---
*Phase: 06-oss-readiness-and-agent-skill*
*Completed: 2026-04-13*
