# Debug: Playwright peer dependency

## Symptoms

- Downstream dependency-update PRs can fail TypeScript builds when DemoHunter and the host app resolve different Playwright versions.
- Devloupe saw `Page` type incompatibilities between DemoHunter's private Playwright install and the app's `@playwright/test` install.

## Root Cause

The published `demohunter` package declared `playwright` as a normal dependency. Package managers could therefore install Playwright under DemoHunter separately from the host app's Playwright or `@playwright/test` version, and DemoHunter's exported context types resolved against that private type tree.

## Fix

Move `playwright` from the published CLI package's `dependencies` to `peerDependencies`, while keeping it in `devDependencies` for DemoHunter's own build and tests. This makes the host app provide the single Playwright version used by both DemoHunter's exported types and local Playwright tests.

## Verification

- Packaging contract asserts the packed CLI no longer has `dependencies.playwright` and does have `peerDependencies.playwright`.
- `bun test tests/e2e/workspace-build-contract.test.ts` passes.
- `bun install --frozen-lockfile` passes.
- `ffmpeg -version` passes.
- `bun x playwright install --with-deps chromium` passes.
- `bun run build` passes.
- `bun run --cwd examples/nextjs-demo build` passes.
- `bun run --cwd examples/vite-demo build` passes.
- `bun run verify` passes with 230 passing tests and 1 skipped ElevenLabs live test.
- `npm publish --dry-run --access public` passes from `packages/cli`.
