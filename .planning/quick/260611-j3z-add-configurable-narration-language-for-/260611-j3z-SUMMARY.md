---
quick_id: 260611-j3z
status: complete
completed_at: "2026-06-11T13:50:56+02:00"
---

# Quick Task 260611-j3z Summary

Implemented configurable narration language for both TTS providers.

## Changes

- Added optional `language` to DemoHunter TTS config and per-call narration options.
- Added `language` to the core narration request, synthesis metadata, and cache identity.
- ElevenLabs provider now sends `language` as documented `language_code`.
- OpenAI provider appends a deterministic language/accent instruction because the current OpenAI speech API reference does not document a general language parameter for built-in TTS voices.
- Updated README, skill authoring docs, and focused tests.

## Verification

- `bun test packages/tts-core/src/cache/cache-key.test.ts packages/tts-core/src/contracts.test.ts packages/tts-openai/src/openai-provider.test.ts packages/tts-elevenlabs/src/elevenlabs-provider.test.ts`
- `bun test packages/cli/src/config/load-config.test.ts packages/generator-playwright/src/narration/resolve-narration.test.ts`
- `bun run typecheck`
- `bun test` — 194 pass, 1 skip, 0 fail
