# Quick Task 260526-jmt: ElevenLabs live integration test

## Goal

Add a gated live integration test that verifies DemoHunter can synthesize real ElevenLabs narration and reuse the cached result offline.

## Plan

1. Mirror the existing OpenAI live integration test structure for ElevenLabs.
2. Gate the test behind `DEMOHUNTER_RUN_LIVE_ELEVENLABS_TESTS=1` and `ELEVENLABS_API_KEY`.
3. Use a short narration request with optional env overrides for voice/model/format.
4. Run the live test locally using the `.env` key without printing credentials.
