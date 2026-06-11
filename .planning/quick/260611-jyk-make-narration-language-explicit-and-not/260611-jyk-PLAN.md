---
quick_id: 260611-jyk
status: planned
---

# Quick Task 260611-jyk: Make Narration Language Explicit And Not Env-Driven

## Scope

Make it clear that DemoHunter narration language is controlled explicitly through `tts.language` or per-call `language`, not ambient locale environment variables.

## Tasks

1. Update starter and getting-started docs to show explicit language configuration.
2. Add regression coverage proving `DEMO_LOCALE` does not affect resolved TTS language.
3. Verify focused tests and typecheck.
