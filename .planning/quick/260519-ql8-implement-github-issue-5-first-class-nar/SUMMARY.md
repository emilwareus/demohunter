# Quick Task Summary: Issue #5 narrateWhile

## Completed

- Added `narrateWhile(text, fn, options?)` to the SDK and CLI authoring contracts.
- Added `DemoHunterNarrationTimeline.sleep(ms)` for timed choreography inside narration.
- Added a `narration-sleep` runtime event so pass one/pass two still perform strict replay divergence checks for authored timing.
- Updated replay so `narrateWhile` starts narration, runs wrapped actions during the narration window, and waits only `remainingNarrationMs + holdPaddingMs`.
- Preserved normal `narrate()` behavior: standalone narration still waits `durationMs + holdPaddingMs`.
- Updated subtitle serialization to use recorded narration `startMs`/`endMs` spans when available.
- Updated docs and the packaged DemoHunter agent skill to recommend `narrateWhile` for transitions and visible motion.

## Verification

- `bun test packages/sdk/src/tour.test.ts packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts packages/generator-playwright/src/execute/collect-timeline.test.ts packages/generator-playwright/src/execute/replay-timeline.test.ts packages/generator-playwright/src/output/subtitles.test.ts tests/skills/demohunter-skill-contract.test.ts`
- `bun run typecheck`
- `bun test tests/e2e/generation-engine-contract.test.ts`
- `bun test`

All verification passed.
