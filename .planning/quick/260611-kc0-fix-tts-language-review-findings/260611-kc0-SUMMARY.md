---
quick_id: 260611-kc0
status: complete
completed_at: "2026-06-11T14:43:13+02:00"
---

# Quick Task 260611-kc0 Summary

Fixed the TTS language review findings and reran the review loop.

## Changes

- Normalized `language` in `createNarrationRequest()`, trimming whitespace and dropping blank values.
- Canonicalized requests inside OpenAI and ElevenLabs providers so direct provider callers also get normalized language/text and matching metadata.
- Added resolver coverage for config-level language fallback when an event has no per-call override.
- Added cache-key coverage proving `sv` and ` sv ` do not fragment cache entries.
- Clarified README, getting started, and skill authoring docs to use ISO 639-1 codes.

## Verification

- `bun test packages/tts-core/src/contracts.test.ts packages/tts-core/src/cache/cache-key.test.ts packages/generator-playwright/src/narration/resolve-narration.test.ts packages/tts-openai/src/openai-provider.test.ts packages/tts-elevenlabs/src/elevenlabs-provider.test.ts packages/cli/src/config/load-config.test.ts`
- `bun run typecheck`
- `bun test` — 200 pass, 1 skip, 0 fail

## Review Loop

Second review pass found no remaining blocking or material issues in the changed language/config/provider/cache paths.
