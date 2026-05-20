# Quick Task 260520-hgz: Add npm propagation retry to release traceability verification

**Date:** 2026-05-20
**Status:** Complete

## Goal

Make the release workflow patient enough for npm registry propagation before failing final traceability verification.

## Tasks

### 1. Retry npm visibility during release verification

**Files:** `.github/workflows/release.yml`, `tests/e2e/oss-onboarding-contract.test.ts`

**Action:**
- Wrap the `npm view demohunter@$VERSION version` traceability check in a bounded retry loop.
- Keep failures actionable by printing the final npm error log if all attempts fail.
- Update the onboarding contract test so the retry behavior remains covered.

**Verify:**
- `bun test tests/e2e/oss-onboarding-contract.test.ts`
- `bun run verify`

**Done when:**
- The workflow waits through transient npm 404s after a successful publish without masking real traceability failures.
