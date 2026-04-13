---
phase: 06-oss-readiness-and-agent-skill
plan: 01
subsystem: examples
tags: [nextjs, vite, playwright, consumer-path, e2e]
requires:
  - phase: 05-portable-output-contract
    provides: portable-output contract and built CLI verification path
provides:
  - Next.js example app with real DemoHunter config and tour
  - Vite example app with real DemoHunter config and tour
  - Consumer-root example generation contract test
affects: [phase-06-plan-02, phase-06-plan-03, oss-onboarding, examples]
tech-stack:
  added: [next, vite]
  patterns: [workspace consumer examples, consumer-root generation verification]
key-files:
  created:
    - examples/nextjs-demo/package.json
    - examples/nextjs-demo/app/page.tsx
    - examples/nextjs-demo/demohunter.config.ts
    - examples/nextjs-demo/demos/nextjs-demo.tour.ts
    - examples/vite-demo/package.json
    - examples/vite-demo/index.html
    - examples/vite-demo/src/main.ts
    - examples/vite-demo/src/App.tsx
    - examples/vite-demo/demohunter.config.ts
    - examples/vite-demo/demos/vite-demo.tour.ts
    - tests/e2e/examples-contract.test.ts
  modified:
    - package.json
    - bun.lock
    - packages/cli/src/bin/demohunter.ts
    - packages/cli/src/bin/demohunter.test.ts
    - packages/generator-playwright/src/generate.ts
    - packages/generator-playwright/src/output/prepare-output-dir.ts
    - packages/generator-playwright/src/output/prepare-output-dir.test.ts
key-decisions:
  - "Keep both example apps intentionally thin and deterministic instead of turning them into showcase apps."
  - "Run example generation from each example root through the real package script so the test proves consumer adoption rather than internal package access."
  - "Harden the CLI entrypoint for Bun workspace symlinks so `bun x demohunter` works from example roots."
patterns-established:
  - "Consumer example configs may override output/cache roots via env vars for temp-dir based e2e verification."
  - "Example tours should prefer replay-safe navigation and selector waits over brittle pass-specific timing helpers."
requirements-completed: [OSS-01]
duration: 38min
completed: 2026-04-13
---

# Phase 6: OSS Readiness and Agent Skill Summary

**Next.js and Vite consumer examples now generate portable DemoHunter output from their own project roots through the real CLI path.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-04-13T18:49:00Z
- **Completed:** 2026-04-13T19:27:07Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- Added two thin workspace examples, one Next.js and one Vite, each with a real `demohunter.config.ts` and `.tour.ts`.
- Added a consumer-root end-to-end contract test that boots each example app and verifies portable output under a temp output directory.
- Fixed the real CLI consumer path and output-dir handling issues that surfaced only when the examples were executed like external users would run them.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add thin workspace examples for Next.js and Vite** - `592046e` and `93b175c` (test/feat)
2. **Task 2: Prove both example apps generate DemoHunter output end to end** - `b01f0f6` and `5d75fd8` (test/feat)

## Files Created/Modified
- `examples/nextjs-demo/app/page.tsx` - deterministic Next.js example app content and selectors
- `examples/nextjs-demo/demohunter.config.ts` - example config with env-overridable output/cache roots
- `examples/nextjs-demo/demos/nextjs-demo.tour.ts` - replay-safe Next.js example tour
- `examples/vite-demo/src/App.tsx` - deterministic Vite example app content and selectors
- `examples/vite-demo/demohunter.config.ts` - example config with env-overridable output/cache roots
- `examples/vite-demo/demos/vite-demo.tour.ts` - replay-safe Vite example tour
- `tests/e2e/examples-contract.test.ts` - consumer-root generation verification for both examples
- `packages/cli/src/bin/demohunter.ts` - hardened CLI entrypoint detection for Bun symlink execution
- `packages/generator-playwright/src/output/prepare-output-dir.ts` - respects configured output roots during example verification

## Decisions Made

- Kept the example apps static and selector-driven to minimize CI flake and maintenance burden.
- Verified the examples through their own package scripts so the proof matches public OSS adoption.
- Allowed env-based output/cache overrides in the examples because temp-root verification is the cleanest way to keep example tests isolated.

## Deviations from Plan

### Auto-fixed Issues

**1. Consumer-root CLI execution initially failed through Bun workspace symlinks**
- **Found during:** Task 2
- **Issue:** `bun x demohunter` from example roots did not reliably treat the workspace bin symlink as the actual CLI entrypoint.
- **Fix:** Hardened entrypoint detection in `packages/cli/src/bin/demohunter.ts` and added a focused test for the symlink case.
- **Files modified:** `packages/cli/src/bin/demohunter.ts`, `packages/cli/src/bin/demohunter.test.ts`
- **Verification:** `bun test tests/e2e/examples-contract.test.ts`
- **Committed in:** `5d75fd8`

**2. Example verification needed isolated output/cache roots**
- **Found during:** Task 2
- **Issue:** Consumer-path e2e needed temp-root isolation instead of writing into example-local `.demohunter/` paths.
- **Fix:** Example configs now accept `DEMOHUNTER_EXAMPLE_OUTPUT_DIR` and `DEMOHUNTER_EXAMPLE_CACHE_DIR`; output-dir handling was tightened for the temp-root path.
- **Files modified:** `examples/nextjs-demo/demohunter.config.ts`, `examples/vite-demo/demohunter.config.ts`, `packages/generator-playwright/src/output/prepare-output-dir.ts`
- **Verification:** `bun test tests/e2e/examples-contract.test.ts`
- **Committed in:** `5d75fd8`

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** Both fixes were required to make the consumer examples prove a real public adoption path instead of only an internal test harness path.

## Issues Encountered

- The first examples contract run exposed real consumer-path gaps rather than example-app issues: CLI symlink execution and temp-root output handling.
- Example tours also needed replay-safe simplification so the e2e contract stayed deterministic across both generation passes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 6 now has real public examples to reference in the companion skill and onboarding docs.
The next wave can build the `skills/demohunter` bundle against concrete example and CLI flows instead of hypothetical usage.

---
*Phase: 06-oss-readiness-and-agent-skill*
*Completed: 2026-04-13*
