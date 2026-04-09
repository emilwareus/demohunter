---
phase: 01-repository-and-scaffolding
plan: 02
subsystem: infra
tags: [typescript, esm, packages, cli, scaffolding]
requires:
  - 01-01
provides:
  - Remaining Phase 1 package shells for tts-core, tts-openai, cli, and create-demohunter
  - Root TypeScript project references for all seven planned Phase 1 packages
  - Explicit compiled CLI bin contract for later command implementation
affects: [phase-01, workspace, package-layout, cli]
tech-stack:
  added: [typescript-project-references]
  patterns: [dist-first package shells, compiled bin metadata, source-only shell commits]
key-files:
  created:
    - packages/tts-core/package.json
    - packages/tts-core/tsconfig.json
    - packages/tts-core/src/index.ts
    - packages/tts-openai/package.json
    - packages/tts-openai/tsconfig.json
    - packages/tts-openai/src/index.ts
    - packages/create-demohunter/package.json
    - packages/create-demohunter/tsconfig.json
    - packages/create-demohunter/src/index.ts
    - packages/cli/package.json
    - packages/cli/tsconfig.json
    - packages/cli/src/index.ts
    - packages/cli/src/bin/demohunter.ts
  modified:
    - tsconfig.json
key-decisions:
  - "Keep the new packages dependency-free and runtime-thin so later plans can add behavior without unwinding shell-only setup."
  - "Declare the CLI bin path now against ./dist/bin/demohunter.js so later command work targets the real built entrypoint."
patterns-established:
  - "Every package in the workspace now extends ../../tsconfig.base.json and emits declarations into dist."
  - "The root tsconfig.json is the single source of truth for the full Phase 1 project reference graph."
requirements-completed: [INIT-02]
duration: 4 min
completed: 2026-04-10
---

# Phase 1 Plan 2: Repository and Scaffolding Summary

**Remaining package shells for TTS, CLI, and scaffolding with the full root TypeScript reference graph**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T23:28:00Z
- **Completed:** 2026-04-09T23:32:17Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Added thin shells for `@demohunter/tts-core`, `@demohunter/tts-openai`, and `create-demohunter` using the same dist-first ESM conventions established in Plan 01.
- Added the `demohunter` CLI package shell with an explicit compiled bin contract at `./dist/bin/demohunter.js`.
- Extended the root `tsconfig.json` project references so all seven planned Phase 1 packages are part of the workspace build graph.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the remaining package shells for TTS and scaffold flows** - `3631dab` (feat)
2. **Task 2: Add the CLI package shell and extend root project references** - `ae3de49` (feat)

## Files Created/Modified

- `packages/tts-core/package.json` - Declares the `@demohunter/tts-core` shell package contract.
- `packages/tts-core/tsconfig.json` - Pins source and declaration emit into `dist`.
- `packages/tts-core/src/index.ts` - Exposes a minimal compilable placeholder export.
- `packages/tts-openai/package.json` - Declares the `@demohunter/tts-openai` shell package contract.
- `packages/tts-openai/tsconfig.json` - Pins source and declaration emit into `dist`.
- `packages/tts-openai/src/index.ts` - Exposes a minimal compilable placeholder export.
- `packages/create-demohunter/package.json` - Declares the scaffold package shell entrypoints.
- `packages/create-demohunter/tsconfig.json` - Pins source and declaration emit into `dist`.
- `packages/create-demohunter/src/index.ts` - Exposes a minimal compilable scaffold placeholder export.
- `packages/cli/package.json` - Declares the CLI shell and its built `bin` mapping.
- `packages/cli/tsconfig.json` - Pins CLI source and declaration emit into `dist`.
- `packages/cli/src/index.ts` - Exposes a minimal compilable CLI placeholder export.
- `packages/cli/src/bin/demohunter.ts` - Establishes the source path that compiles to the declared built CLI entrypoint.
- `tsconfig.json` - Extends the root project references to the four packages introduced in this plan.

## Decisions Made

- Kept the new package shells free of example content, credential handling, and runtime behavior so Phase 1 remains local-first and minimal.
- Removed generated `dist/` output after verification so commits remain source-only, matching the repository contract established in Plan 01.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## User Setup Required

None - no external services or credentials are required.

## Next Phase Readiness

- Config loading can now target stable package names and a complete workspace graph.
- The CLI and scaffold packages have explicit source and build surfaces for the later `init` and `generate` plans.

## Self-Check: PASSED

- Verified the plan-level `rg` checks passed for package metadata, tsconfig output layout, and root references.
- Verified `bun x tsc -b tsconfig.json --pretty false` completed successfully across the full workspace graph.
- Verified commits `3631dab` and `ae3de49` exist in git history.

---
*Phase: 01-repository-and-scaffolding*
*Completed: 2026-04-10*
