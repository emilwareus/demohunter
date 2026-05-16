# Debug: CI verify timeout

## Symptoms

- GitHub Actions job `verify` fails during `bun run verify`.
- Failing test: `workspace build contract > builds the workspace and exposes a single published demohunter package`.
- Failure mode: Bun default test timeout after 5000ms.

## Root Cause

The workspace build contract invokes `bun run build` from inside the test. CI already runs a full workspace build immediately before `bun run verify`, but the test still rebuilds and can exceed Bun's default 5s timeout on Ubuntu runners.

## Fix

Added an explicit 30s timeout to the single build-heavy workspace contract test, consistent with the other e2e tests that perform real CLI/build work.

## Verification

- `bun test tests/e2e/workspace-build-contract.test.ts` passes.
- `bun run verify` passes locally with 165 tests.
