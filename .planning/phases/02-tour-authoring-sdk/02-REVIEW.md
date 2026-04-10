---
phase: 02-tour-authoring-sdk
reviewed: 2026-04-10T10:11:15Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - packages/sdk/package.json
  - packages/sdk/src/runtime-types.ts
  - packages/sdk/src/tour.ts
  - packages/sdk/src/index.ts
  - packages/sdk/src/tour.test.ts
  - packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts
  - packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts
  - packages/generator-playwright/src/smoke-generate.ts
  - packages/generator-playwright/src/smoke-generate.test.ts
  - packages/cli/src/commands/generate.ts
  - packages/cli/src/commands/generate.test.ts
  - tests/fixtures/tours/phase-02-authoring.tour.ts
  - tests/e2e/authoring-sdk-contract.test.ts
  - tests/e2e/init-generate-smoke.test.ts
  - tests/e2e/workspace-build-contract.test.ts
  - tests/e2e/built-cli-bin-contract.test.ts
findings:
  critical: 0
  warning: 3
  info: 0
  total: 3
status: issues_found
---
# Phase 02: Code Review Report

**Reviewed:** 2026-04-10T10:11:15Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the SDK authoring surface, smoke runtime/generator path, CLI `generate` command, and the related contract tests. The package-level tests in scope passed locally, but there are still three correctness/reliability issues: teardown is skipped on failures, authored tour IDs are written into paths without validation, and one e2e test is pinned to a machine-specific absolute path.

## Warnings

### WR-01: `teardown` is skipped whenever `setup` or `run` throws

**File:** `packages/generator-playwright/src/smoke-generate.ts:84-86`
**Issue:** `setup`, `run`, and `teardown` are awaited in a straight line inside the main `try` block. If `setup` or `run` throws, control jumps to the outer `finally`, the browser closes, and `tour.teardown` never runs. That makes authored cleanup hooks unreliable exactly when they are most needed.
**Fix:**
```ts
let primaryError: unknown;

try {
  await Promise.resolve(tourFile.tour.setup?.(runtime));
  await Promise.resolve(tourFile.tour.run(runtime));
} catch (error) {
  primaryError = error;
} finally {
  try {
    await Promise.resolve(tourFile.tour.teardown?.(runtime));
  } catch (teardownError) {
    if (primaryError === undefined) {
      throw teardownError;
    }
  }

  if (primaryError !== undefined) {
    throw primaryError;
  }
}
```

### WR-02: Raw `tour.id` can escape the configured output root

**File:** `packages/generator-playwright/src/smoke-generate.ts:77`
**Issue:** `path.join(config.outputDir, tourFile.tour.id)` trusts the authored `id` verbatim. IDs containing `/`, `..`, or platform separators can create nested directories or write outside `.demohunter`, which breaks the portability contract for generated assets.
**Fix:**
```ts
const TOUR_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

if (!TOUR_ID_PATTERN.test(tourFile.tour.id)) {
  throw new Error(`Tour id must be a filesystem-safe slug: ${tourFile.path}`);
}

const outputDir = path.join(config.outputDir, tourFile.tour.id);
```

### WR-03: E2E test is hardcoded to one developer machine path

**File:** `tests/e2e/init-generate-smoke.test.ts:7`
**Issue:** The CLI entry point is set to `/Users/emilwareus/Development/demohunter/...`, so this test only passes when the repo lives at that exact absolute path. It will fail on CI, on another workstation, or in any differently named workspace.
**Fix:**
```ts
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = path.join(repoRoot, "packages/cli/src/bin/demohunter.ts");
```

---

_Reviewed: 2026-04-10T10:11:15Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
