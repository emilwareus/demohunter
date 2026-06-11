---
quick_id: 260611-jyk
status: complete
completed_at: "2026-06-11T14:23:11+02:00"
---

# Quick Task 260611-jyk Summary

Made narration language explicitly configured rather than locale-env driven.

## Changes

- Added explicit `tts.language` guidance to the starter config template.
- Updated getting-started docs to show `language: "sv"` in ElevenLabs config and per-call narration options.
- Documented that DemoHunter does not infer narration language from `DEMO_LOCALE`.
- Added regression coverage proving `DEMO_LOCALE=sv` does not populate `config.tts.language`.

## Verification

- `bun test packages/cli/src/config/load-config.test.ts tests/e2e/init-generate-smoke.test.ts tests/e2e/workspace-build-contract.test.ts`
- `bun run typecheck`
