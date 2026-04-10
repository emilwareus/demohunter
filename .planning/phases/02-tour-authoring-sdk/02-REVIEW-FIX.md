---
phase: 02-tour-authoring-sdk
fixed_at: 2026-04-10T10:26:37Z
review_path: /Users/emilwareus/Development/demohunter/.planning/phases/02-tour-authoring-sdk/02-REVIEW.md
iteration: 3
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---
# Phase 02: Code Review Fix Report

**Fixed at:** 2026-04-10T10:26:37Z
**Source review:** `/Users/emilwareus/Development/demohunter/.planning/phases/02-tour-authoring-sdk/02-REVIEW.md`
**Iteration:** 3

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: Tour ID validation still allows case-variant output paths

**Files modified:** `packages/generator-playwright/src/smoke-generate.ts`, `packages/generator-playwright/src/smoke-generate.test.ts`
**Commit:** `44207c6`
**Applied fix:** Removed case-insensitive matching from the tour ID slug validator, changed the error text to require lowercase filesystem-safe IDs explicitly, and added a regression test that rejects uppercase IDs before any browser or filesystem work starts.

### WR-02: Browser/context shutdown can mask the primary tour failure

**Files modified:** `packages/generator-playwright/src/smoke-generate.ts`, `packages/generator-playwright/src/smoke-generate.test.ts`
**Commit:** `eb22069`
**Status:** `fixed: requires human verification`
**Applied fix:** Carried the first setup/run/teardown or artifact-generation error through the outer cleanup path, only surfacing close failures when no earlier execution error exists, and added a regression test where both `context.close()` and `browser.close()` fail after `run`.

### WR-03: E2E helpers still construct malformed `file://` URLs on Windows

**Files modified:** `tests/e2e/authoring-sdk-contract.test.ts`, `tests/e2e/built-cli-bin-contract.test.ts`
**Commit:** `6580498`
**Applied fix:** Replaced raw ``new URL(`file://${sitePath}`)`` construction with `pathToFileURL(sitePath).href` in both affected e2e helpers so temporary site paths are encoded correctly on Windows and POSIX.

---

_Fixed: 2026-04-10T10:26:37Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 3_
