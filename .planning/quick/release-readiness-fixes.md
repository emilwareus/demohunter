# Quick Task: Release readiness fixes

## Goal

Fix final release blockers before making DemoHunter public and publishing the first npm release.

## Scope

- Make the published `demohunter` TypeScript declarations self-contained.
- Ensure the npm tarball includes README, LICENSE, and CHANGELOG.
- Keep root README, LICENSE, and CHANGELOG as the only source files; package-local copies are generated only during packing and removed afterward.
- Allow the release workflow to publish the current `0.1.0` version.
- Update GitHub Actions to Node 24-compatible official action versions.
- Polish the public README.

## Verification

- `bun test tests/e2e/workspace-build-contract.test.ts tests/e2e/oss-onboarding-contract.test.ts`
- `env -u OPENAI_API_KEY -u DEMOHUNTER_RUN_LIVE_OPENAI_TESTS bun run verify` passed locally. Bun loaded the workspace `.env`, so the gated live OpenAI test also ran and passed.
- `OPENAI_API_KEY= DEMOHUNTER_RUN_LIVE_OPENAI_TESTS=0 bun test tests/integration/openai-narration-live.test.ts`
- `bun run typecheck`
- Packed `packages/cli`, installed the tarball into a fresh npm project, verified runtime import, `demohunter --version`, and TypeScript compilation against `defineConfig`, `defineTour`, and `DemoHunterRunContext`.
- Verified `npm pack` temporarily syncs root docs into the tarball and removes package-local README, LICENSE, and CHANGELOG afterward.
