# Quick Task 260526-hky: ElevenLabs TTS support

## Goal

Add first-class ElevenLabs narration support while keeping OpenAI as the default local-first provider.

## Plan

1. Extend SDK and TTS core contracts to admit provider-specific narration settings.
2. Add an `@demohunter/tts-elevenlabs` provider package that reads `ELEVENLABS_API_KEY` from the environment.
3. Wire the generator provider selection and narration request creation for ElevenLabs.
4. Update config loading so provider-specific defaults are applied cleanly.
5. Document the OpenAI and ElevenLabs config shapes and add focused tests.

## Verification

- Focused unit tests for config, provider request shaping, narration resolution, and cache identity.
- Typecheck/build after implementation.
