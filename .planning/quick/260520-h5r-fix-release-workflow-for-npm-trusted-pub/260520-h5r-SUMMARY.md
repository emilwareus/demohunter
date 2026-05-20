# Quick Task 260520-h5r: Fix release workflow for npm trusted publishing

**Date:** 2026-05-20
**Status:** Complete
**Implementation commit:** `f42155e`

## Changes

- Updated `.github/workflows/release.yml` to run the release job with Node 24 and npm trusted publishing support.
- Removed the `NPM_TOKEN` publish path so `npm publish` uses OIDC trusted publishing instead of an empty `NODE_AUTH_TOKEN`.
- Added an existing-tag recovery step so rerunning the release with `bump=current` publishes from the already-created `v0.1.1` tag when npm is still missing that version.
- Updated the onboarding contract test to assert the trusted-publishing workflow shape.

## Verification

- `bun test tests/e2e/oss-onboarding-contract.test.ts`
- `bun run verify`

Both passed after the update.

## Release Recovery Note

The failed run already created git tag `v0.1.1` while npm still only had `0.1.0`. After this workflow change lands, rerun the Release workflow with `bump=current` to publish `demohunter@0.1.1` and create/verify the GitHub release.
