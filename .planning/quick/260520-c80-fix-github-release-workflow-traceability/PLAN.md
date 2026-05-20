# Quick Task 260520-c80: Fix GitHub release workflow traceability

## Goal

Make the manual release workflow produce and verify a one-to-one mapping between:

- the `demohunter` npm package version
- the repository git tag
- the GitHub release for that tag

## Plan

1. Update `.github/workflows/release.yml` to make release state preflight idempotent for partial reruns.
2. Ensure the workflow creates or reuses the version commit and annotated tag before publish, then publishes only when the npm version is absent.
3. Replace the final release action with an explicit GitHub CLI release creation step and a traceability verification step.

## Verification

- Parse the workflow as YAML.
- Review the generated shell for the expected npm/tag/release checks and rerun repair behavior.
