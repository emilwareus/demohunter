# Quick Task 260520-hgz: Add npm propagation retry to release traceability verification

**Date:** 2026-05-20
**Status:** Complete

## Changes

- Added a bounded retry loop around the release workflow's `npm view demohunter@$VERSION version` traceability check.
- The verifier now waits up to 10 attempts with 6 seconds between attempts before failing.
- If npm still cannot expose the package version, the workflow prints the final npm error log before emitting the traceability error.
- Updated the release workflow contract test to assert the retry behavior.

## Verification

- `bun test tests/e2e/oss-onboarding-contract.test.ts`
- `bun run verify`

Both passed.
