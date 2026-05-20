# Quick Task 260520-e2s

Implement GitHub issue #8: add beforeRecord lifecycle hook that runs after setup and before recorded run, update generated skill docs, and test recording boundary / validation behavior.

## Result

- Added `beforeRecord` to the SDK and published CLI type surface.
- Full generation now starts screencast after `beforeRecord` and before `run`.
- Timeline collection, recorded replay, and dry-run validation all execute `beforeRecord`.
- Pre-record lifecycle hooks use a runtime proxy that shares custom state but hides timeline/narration helpers.
- Full generation delays debug capture until after `beforeRecord`, so failures in pre-record setup do not write body/screenshot debug artifacts.
- Packaged DemoHunter skill docs and template now document/use `beforeRecord`.

## Verification

- `bun test packages/generator-playwright/src/execute/collect-timeline.test.ts packages/generator-playwright/src/execute/replay-timeline.test.ts packages/generator-playwright/src/generate.test.ts packages/generator-playwright/src/smoke-generate.test.ts`
- `bun test packages/sdk/src/tour.test.ts packages/cli/src/commands/generate.test.ts tests/skills/demohunter-skill-contract.test.ts`
- `bun run typecheck`
- `bun run build`
- `bun test --timeout 20000`
