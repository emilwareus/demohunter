---
phase: 06-oss-readiness-and-agent-skill
plan: 01
subsystem: testing
tags: [oss, examples, nextjs, vite, bun, playwright]
requires:
  - phase: 01-oss-core
    provides: local CLI, SDK, and generator contracts consumed by the example apps
provides:
  - Next.js example app wired into the Bun workspace
  - Vite example app wired into the Bun workspace
  - End-to-end consumer-root contract coverage for both examples
affects: [oss-readiness, example apps, cli, generator-playwright]
tech-stack:
  added: [next, react, react-dom, vite]
  patterns: [workspace consumer examples, consumer-root CLI verification, configurable output roots]
key-files:
  created: [tests/e2e/examples-contract.test.ts]
  modified:
    [
      package.json,
      bun.lock,
      examples/nextjs-demo/package.json,
      examples/nextjs-demo/app/page.tsx,
      examples/nextjs-demo/demohunter.config.ts,
      examples/nextjs-demo/demos/nextjs-demo.tour.ts,
      examples/vite-demo/package.json,
      examples/vite-demo/src/App.tsx,
      examples/vite-demo/demohunter.config.ts,
      examples/vite-demo/demos/vite-demo.tour.ts,
      packages/cli/src/bin/demohunter.ts,
      packages/generator-playwright/src/generate.ts,
      packages/generator-playwright/src/output/prepare-output-dir.ts,
    ]
key-decisions:
  - "Keep the example apps thin and deterministic by using static sections plus hash navigation instead of hydration-sensitive UI state."
  - "Run example generation from each example root through its package script so the test exercises the real workspace consumer path."
  - "Honor configured output roots in the generator so examples can isolate generated artifacts during contract tests."
patterns-established:
  - "Workspace examples can consume DemoHunter through workspace dependencies without prepublishing packages."
  - "Consumer-path tests should prime narration cache data and run without live OpenAI dependencies."
requirements-completed: [OSS-01]
duration: 4h 44m
completed: 2026-04-13
---

# Phase 06 Plan 01: Example consumer paths for Next.js and Vite Summary

**Two thin workspace example apps plus consumer-root generation coverage for the real DemoHunter CLI/runtime path**

## Performance

- **Duration:** 4h 44m
- **Started:** 2026-04-13T14:43:04Z
- **Completed:** 2026-04-13T19:26:52Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments
- Added real `examples/nextjs-demo` and `examples/vite-demo` workspace consumers with `demohunter.config.ts` and one `.tour.ts` each.
- Proved both examples generate portable output from their own project roots through `tests/e2e/examples-contract.test.ts`.
- Fixed the consumer-root execution path so the workspace CLI bin runs under Bun and generated output honors configured output roots.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add thin workspace examples for Next.js and Vite**
2. `592046e` `test(06-01): add failing example consumer app contracts`
3. `93b175c` `feat(06-01): implement Next.js and Vite workspace examples`
4. **Task 2: Prove both example apps generate DemoHunter output end to end**
5. `b01f0f6` `test(06-01): add failing consumer example generation contract`
6. `5d75fd8` `feat(06-01): verify example generation from consumer roots`

## Files Created/Modified
- `package.json` and `bun.lock` - Added `examples/*` to the workspace and resolved example framework dependencies.
- `examples/nextjs-demo/*` - Added the Next.js example app, config, tour, and framework wiring.
- `examples/vite-demo/*` - Added the Vite example app, config, and tour.
- `tests/e2e/examples-contract.test.ts` - Starts each example app locally, primes narration cache data, runs generation from the example root, and asserts portable output exists.
- `packages/cli/src/bin/demohunter.ts` and `packages/cli/src/bin/demohunter.test.ts` - Kept the workspace `.bin` consumer path executable through Bun symlinks.
- `packages/generator-playwright/src/generate.ts` and `packages/generator-playwright/src/output/prepare-output-dir.ts` - Fixed output directory resolution so configured output roots are respected.

## Decisions Made
- Used static example sections plus hash-based navigation to avoid replay drift from framework hydration while keeping selectors obvious and deterministic.
- Kept the example contract test offline by priming narration cache entries instead of mocking OpenAI at runtime.
- Exercised `bun run generate` from each example root rather than calling the CLI entrypoint from the repo root, because that is the public consumer path OSS-01 needs to prove.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed the workspace CLI bin entrypoint check for symlinked consumer installs**
- **Found during:** Task 2
- **Issue:** `bun x demohunter ...` from an example root silently skipped the CLI entrypoint because the bin compared the symlink path to the real dist path.
- **Fix:** Switched the bin to Bun, resolved real paths before the entrypoint check, and added a regression test for the symlinked `.bin` path.
- **Files modified:** `packages/cli/src/bin/demohunter.ts`, `packages/cli/src/bin/demohunter.test.ts`
- **Verification:** `bun test tests/e2e/examples-contract.test.ts`, `bun run verify`
- **Committed in:** `5d75fd8`

**2. [Rule 1 - Bug] Fixed generator output path handling for configured output roots**
- **Found during:** Task 2
- **Issue:** The generator always wrote to `cwd/.demohunter/<tour-id>` and ignored `config.outputDir`, which broke isolated example output roots.
- **Fix:** Updated output preparation to accept the resolved output root from config and added coverage for the new behavior.
- **Files modified:** `packages/generator-playwright/src/generate.ts`, `packages/generator-playwright/src/output/prepare-output-dir.ts`, `packages/generator-playwright/src/output/prepare-output-dir.test.ts`
- **Verification:** `bun test tests/e2e/examples-contract.test.ts`, `bun run verify`
- **Committed in:** `5d75fd8`

**3. [Rule 1 - Bug] Reworked example tours to avoid replay divergence from hydration-sensitive interactions**
- **Found during:** Task 2
- **Issue:** The original example tours used client-side interactions that replayed inconsistently between collection and recording passes.
- **Fix:** Simplified the example UIs and tours to use deterministic sections and hash navigation while keeping framework-native example apps and stable selectors.
- **Files modified:** `examples/nextjs-demo/app/page.tsx`, `examples/nextjs-demo/demos/nextjs-demo.tour.ts`, `examples/vite-demo/src/App.tsx`, `examples/vite-demo/demos/vite-demo.tour.ts`
- **Verification:** `bun test tests/e2e/examples-contract.test.ts`, `bun run --cwd examples/nextjs-demo build`, `bun run --cwd examples/vite-demo build`, `bun run verify`
- **Committed in:** `5d75fd8`

---

**Total deviations:** 3 auto-fixed (3 bug fixes)
**Impact on plan:** All deviations were correctness fixes required to make the new consumer-path examples actually execute and verify as planned. No scope creep beyond OSS-01.

## Issues Encountered

- `next dev` mutates `next-env.d.ts` and `tsconfig.json` during example verification. Those files were restored to the intended committed state after verification so the task commit only contains intentional source changes.
- Bun CLI flag ordering differs from the plan examples on this machine (`bun run --cwd ...` and `bun x --cwd ...` are the working forms), but that did not require product code changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- OSS-01 is now backed by real example apps and automated consumer-path coverage.
- The next phase can build agent-skill/docs work on top of concrete example file paths and proven example commands.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/06-oss-readiness-and-agent-skill/06-oss-readiness-and-agent-skill-01-SUMMARY.md`
- Verified task commits exist: `592046e`, `93b175c`, `b01f0f6`, `5d75fd8`

---
*Phase: 06-oss-readiness-and-agent-skill*
*Completed: 2026-04-13*
