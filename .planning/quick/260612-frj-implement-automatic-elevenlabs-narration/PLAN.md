# Automatic ElevenLabs Narration Continuity

Implement automatic ElevenLabs continuity for adjacent narration clips by passing
neighbor text as provider options and serializing it to ElevenLabs
`previous_text` / `next_text`.

## Tasks

- Add internal narration context fields to the shared TTS request/provider options.
- Compute immediate compatible previous/next narration context during timeline collection.
- Serialize ElevenLabs `previous_text` and `next_text` from provider options.
- Cover provider serialization, resolver options, and timeline compatibility with tests.
- Run focused tests and typecheck.
