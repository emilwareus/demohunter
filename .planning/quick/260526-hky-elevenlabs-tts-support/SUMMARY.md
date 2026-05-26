# Quick Task 260526-hky Summary

## Completed

- Added `@demohunter/tts-elevenlabs` with environment-only `ELEVENLABS_API_KEY` auth, request shaping, response handling, and tests.
- Extended SDK config with provider-specific OpenAI and ElevenLabs TTS types, defaults, and exported voice settings.
- Added per-call narration overrides for `voice`, `model`, `format`, and ElevenLabs `voiceSettings`.
- Updated narration cache identity to include provider options with stable key ordering so changed voice settings do not collide.
- Wired generator provider selection, ElevenLabs credential errors, sample-rate parsing from ElevenLabs formats, docs, and packaged skill guidance.

## Verification

- `bun test packages/tts-core/src/contracts.test.ts packages/tts-core/src/cache/cache-key.test.ts packages/tts-elevenlabs/src/elevenlabs-provider.test.ts packages/cli/src/config/load-config.test.ts packages/generator-playwright/src/narration/resolve-narration.test.ts packages/sdk/src/config.test.ts packages/sdk/src/tour.test.ts`
- `bun test packages`
- `bun run --cwd packages/cli typecheck`
- `bun x tsc -b tsconfig.json --pretty false`
- `bun run build`
