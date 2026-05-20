# Quick Task 260520-ggc: Fix release version bump workspace protocol failure

## Goal

Make the manual release workflow bump `packages/cli/package.json` without npm traversing the Bun workspace graph and failing on `workspace:*` dependencies.

## Plan

1. Update `.github/workflows/release.yml` so `npm version` runs only against the CLI package.
2. Add a regression assertion to the existing release workflow contract test.
3. Reproduce the version bump command in a clean temp copy and run the focused test.

## Verification

- Temp-copy `npm version patch --no-git-tag-version --preid rc --workspaces=false` from `packages/cli`.
- `bun test tests/e2e/oss-onboarding-contract.test.ts`
