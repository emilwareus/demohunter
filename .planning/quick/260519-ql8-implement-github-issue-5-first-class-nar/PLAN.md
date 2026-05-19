# Quick Task Plan: Issue #5 narrateWhile

## Goal

Implement first-class timed narration choreography for DemoHunter tours via `narrateWhile(text, fn, options?)`, including SDK types, deterministic collection/replay behavior, caption timing, docs, and the packaged DemoHunter agent skill.

## Research Notes

- Current pass one emits ordered runtime events; narration segments are resolved from `narrate` events.
- Current pass two validates each emitted event against the collected timeline and blocks for `durationMs + holdPaddingMs` after every narration.
- Audio muxing already offsets narration files by recorded `startMs`; the key missing behavior is replay waiting only for the remaining narration window after wrapped actions.
- Captions currently serialize narration segments back-to-back, so overlapping narration with UI motion should use recorded `startMs`/`endMs` in output captions.

## Implementation Steps

1. Add SDK types for `DemoHunterNarrationTimeline` and `DemoHunterNarrateWhile`, then expose `narrateWhile` on `DemoHunterRunContext`.
2. Add `narrateWhile` to the shared smoke runtime by emitting the same narration event and running the callback with a deterministic `sleep(ms)` helper.
3. Override `narrateWhile` in replay so wrapped actions run after narration starts, `sleep` advances replay time, strict divergence checks still apply, and the runtime waits only remaining narration time plus hold padding.
4. Update timeline/event contract tests and add replay tests for shorter/longer wrapped action behavior and divergence.
5. Serialize captions from recorded narration spans when available.
6. Update authoring docs and packaged DemoHunter skill guidance to recommend `narrateWhile` for transitions and timed visible motion.
7. Run focused tests plus typecheck/build checks.

## Verification

- `bun test` focused package tests covering runtime, collection, replay, subtitles, SDK type contract, and skill contract.
- Broader `bun test` if the focused suite passes quickly.
