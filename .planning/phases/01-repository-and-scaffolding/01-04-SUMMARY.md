---
phase: 01-repository-and-scaffolding
plan: 04
subsystem: cli
tags: [cli, scaffolding, playwright, smoke, e2e]
requires:
  - 01-01
  - 01-02
  - 01-03
provides:
  - Safe `demohunter init` scaffold flow
  - Minimal no-audio `demohunter generate` smoke path
  - Source-level end-to-end proof of init, overwrite refusal, and smoke output generation
affects: [phase-01, cli, scaffolding, generator, e2e]
tech-stack:
  added: [playwright]
  patterns: [overwrite-safe-scaffolding, source-level-cli-e2e, output-root-contract]
key-files:
  created:
    - packages/create-demohunter/src/scaffold.ts
    - packages/create-demohunter/src/scaffold.test.ts
    - packages/create-demohunter/src/bin/create-demohunter.ts
    - packages/cli/src/commands/init.ts
    - packages/cli/src/commands/generate.ts
    - packages/generator-playwright/src/smoke-generate.ts
    - tests/e2e/init-generate-smoke.test.ts
  modified:
    - packages/create-demohunter/package.json
    - packages/create-demohunter/tsconfig.json
    - packages/create-demohunter/src/index.ts
    - packages/cli/package.json
    - packages/cli/tsconfig.json
    - packages/cli/src/bin/demohunter.ts
    - packages/generator-playwright/package.json
    - packages/generator-playwright/src/index.ts
    - bun.lock
key-decisions:
  - "Copy only the three fixed starter files and refuse silent overwrite unless --force is passed."
  - "Keep generate Phase 1-local: run the tour in Playwright, write only smoke-run.json, and skip audio/video/manifest outputs."
  - "Treat config.outputDir as the single output-root source of truth everywhere in the smoke path."
patterns-established:
  - "CLI commands are dispatched from a single source-level bin entrypoint with small command modules."
  - "Fresh-repo verification runs through the real source CLI flow before the compiled bin contract is proven in Plan 01-05."
requirements-completed: [INIT-01, INIT-02]
duration: 30 min
completed: 2026-04-10
---

# Phase 1 Plan 4: Repository and Scaffolding Summary

**Safe init scaffolding, local smoke generation, and source-level end-to-end proof**

## Performance

- **Duration:** 30 min
- **Started:** 2026-04-10T09:00:00Z
- **Completed:** 2026-04-10T09:30:00Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Implemented reusable scaffold logic that copies only the three approved starter assets and refuses overwrite by default.
- Replaced the CLI stub with real `init` and `generate` command handling and a minimal Playwright-backed smoke runner.
- Added source-level end-to-end coverage that proves init, overwrite refusal, and `.demohunter/sample-smoke/smoke-run.json` generation in a temp repo.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement safe scaffold copying and prove overwrite refusal with a real test** - `095f742` (feat)
2. **Task 2: Implement the minimal no-audio `demohunter generate` smoke path with a consistent output-root contract** - `66704b1` (feat)
3. **Task 3: Prove the full init-to-generate path with an end-to-end temp-repo test** - `ac55c9a` (test)

## Files Created/Modified

- `packages/create-demohunter/src/scaffold.ts` - Copies the starter files into an existing repo with overwrite refusal unless `--force` is passed.
- `packages/create-demohunter/src/scaffold.test.ts` - Verifies exact refusal messaging and unchanged file contents on rerun.
- `packages/create-demohunter/src/bin/create-demohunter.ts` - Provides the package-level scaffold entrypoint.
- `packages/create-demohunter/src/index.ts` - Re-exports scaffold helpers from the package entrypoint.
- `packages/cli/src/bin/demohunter.ts` - Dispatches `init` and `generate` from the source CLI entrypoint.
- `packages/cli/src/commands/init.ts` - Runs the shared scaffold flow and prints created files.
- `packages/cli/src/commands/generate.ts` - Loads config and tour modules, then calls the smoke generator.
- `packages/generator-playwright/src/smoke-generate.ts` - Launches Playwright, runs the smoke tour, and writes `smoke-run.json` under `${config.outputDir}/${tour.id}/`.
- `packages/generator-playwright/src/index.ts` - Re-exports the smoke generator API.
- `tests/e2e/init-generate-smoke.test.ts` - Exercises the full source-level CLI flow in a temp repo.
- `packages/cli/package.json` / `packages/cli/tsconfig.json` - Add the package dependencies and project references needed for the scaffold and smoke generator command surfaces.
- `packages/create-demohunter/package.json` / `packages/create-demohunter/tsconfig.json` - Add Bun-aware local exports and exclude test files from package builds.
- `packages/generator-playwright/package.json` - Declares Playwright for the smoke runner and enables Bun-aware local exports.
- `bun.lock` - Records the newly required workspace dependency state.

## Decisions Made

- Kept the scaffold limited to exactly three starter files, with no package-manager automation, git initialization, or repo rewriting.
- Chose a source-level CLI e2e for Phase 1 speed, while leaving compiled-bin proof to Plan 01-05.
- Installed the local Playwright Chromium runtime in the environment to satisfy the planned smoke verification instead of weakening the test.

## Deviations from Plan

- None in product behavior. The only implementation adjustment was normalizing the e2e overwrite-path expectation with `realpath()` because Bun canonicalizes temp repo paths under `/private/var` on macOS child processes.

## Issues Encountered

- The source-level e2e initially failed on macOS temp-path canonicalization (`/var/...` vs `/private/var/...`) before the actual smoke generation step.
- Playwright was present as a package dependency but Chromium had not yet been downloaded in the local environment, which blocked the smoke run until `bunx playwright install chromium` completed.

## User Setup Required

- Local smoke generation requires a Playwright browser runtime. In this workspace, Chromium was installed with `bunx playwright install chromium`.

## Next Phase Readiness

- The project now has a real user-facing flow to validate through the built CLI and dist contracts in Plan 01-05.
- Later phases can extend `generate` beyond smoke output without changing the scaffolded starter shape or output-root contract.

## Self-Check: PASSED

- Verified `bun test packages/create-demohunter/src/scaffold.test.ts`.
- Verified `bun test tests/e2e/init-generate-smoke.test.ts`.
- Verified the smoke generator `rg` contract for `loadConfig`, `pathToFileURL`, `smoke-run.json`, `config.outputDir`, and the no-audio helper callbacks.
- Verified the absence of `video.mp4`, `captions.srt`, `captions.vtt`, `manifest.json`, and `OPENAI_API_KEY` references in the generate path.
- Verified `bun x tsc -b tsconfig.json --pretty false`.
- Verified commits `095f742`, `66704b1`, and `ac55c9a` exist in git history.

---
*Phase: 01-repository-and-scaffolding*
*Completed: 2026-04-10*
