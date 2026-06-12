---
status: complete
quick_id: 260612-frj
slug: implement-automatic-elevenlabs-narration
completed_at: "2026-06-12T11:21:00+02:00"
---

# Summary

Implemented automatic ElevenLabs narration continuity by inferring adjacent
narration text during timeline collection and passing compatible context through
provider options to ElevenLabs `previous_text` / `next_text`.

## Verification

- `bun test packages/tts-elevenlabs packages/generator-playwright`
- `bun run typecheck`
- `bun run verify`
