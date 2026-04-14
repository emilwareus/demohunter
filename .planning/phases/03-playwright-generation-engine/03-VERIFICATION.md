---
phase: 03-playwright-generation-engine
verified: 2026-04-14T08:28:00+02:00
status: passed
score: 9/9 must-haves verified
overrides_applied: 1
human_verification: []
---

# Phase 3: Playwright Generation Engine Verification Report

**Phase Goal:** Execute tours in two passes, record the scripted demo, and write the baseline local artifact set to `.demohunter/`.
**Verified:** 2026-04-14T08:28:00+02:00
**Status:** passed
**Re-verification:** Yes - human-UAT gate waived by user on 2026-04-14

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Developer can run `demohunter generate <tour-file>` through the real Phase 3 generator path and receive baseline output. | ✓ VERIFIED | `packages/cli/src/commands/generate.ts:27-47` loads config, imports the authored tour, delegates to `generateTour()`, and logs the final video path. Source and built CLI contract tests both pass in `tests/e2e/generation-engine-contract.test.ts:18-55` and `tests/e2e/built-cli-bin-contract.test.ts:18-46,52-83`. |
| 2 | The generator performs a timing pass before recording so pass 2 uses a deterministic collected timeline. | ✓ VERIFIED | `packages/generator-playwright/src/generate.ts:89-149` runs `collectTimeline()` before `startScreencast()` and `replayTimeline()`. `packages/generator-playwright/src/execute/collect-timeline.ts:24-64` returns a typed `CollectedTimeline`, and `packages/generator-playwright/src/execute/generator-types.ts:58-82` defines the shared pass-1/pass-2 contract. |
| 3 | Pass 1 collects replay data from the existing Phase 2 runtime event surface instead of inventing a second authoring model. | ✓ VERIFIED | `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts:20-123` emits `TourRuntimeEvent` values, and `packages/generator-playwright/src/execute/collect-timeline.ts:33-39,45-64` captures those events while executing authored `setup/run/teardown` against the shared runtime. |
| 4 | The recorded pass replays the collected timeline instead of free-running the tour a second time. | ✓ VERIFIED | `packages/generator-playwright/src/execute/replay-timeline.ts:37-94,107-179` compares live runtime events to `timeline.entries` entry-by-entry. `packages/generator-playwright/src/execute/replay-timeline.test.ts:8-60` proves replay follows the collected sequence. |
| 5 | During the recorded pass, DemoHunter waits `durationMs + holdPaddingMs` after each narration. | ✓ VERIFIED | `packages/generator-playwright/src/execute/replay-timeline.ts:140-175` applies `expectedEntry.durationMs + args.config.holdPaddingMs`. `packages/generator-playwright/src/execute/replay-timeline.test.ts:62-103` asserts a single `1500` ms wait for `1200 + 300`. |
| 6 | Invalid or unreachable `baseURL` values fail through direct Playwright navigation behavior, not custom readiness automation. | ✓ VERIFIED | `packages/generator-playwright/src/execute/collect-timeline.ts:41` and `packages/generator-playwright/src/execute/replay-timeline.ts:66` call `page.goto(new URL(config.baseURL).href)` directly. `packages/generator-playwright/src/generate.test.ts:182-218` proves a connection-refused error is surfaced without retries and pass 2 is never started. |
| 7 | Local output is written under `.demohunter/<tour-id>/` relative to the project root/current working directory. | ✓ VERIFIED | `packages/generator-playwright/src/output/prepare-output-dir.ts:16-32` enforces a safe slug and resolves `${cwd}/.demohunter/${tourId}`. `packages/generator-playwright/src/generate.ts:74` uses `loadedConfig.projectRoot` when preparing the output directory. E2E tests assert output under `.demohunter/phase-03-generation` in `tests/e2e/generation-engine-contract.test.ts:35-55` and `tests/e2e/built-cli-bin-contract.test.ts:71-83`. |
| 8 | DemoHunter outputs `mp4` by default and can optionally generate `webm`, leaving only the selected final video artifact. | ✓ VERIFIED | `packages/sdk/src/config.ts:50-53` sets `format: "mp4"` by default, `packages/cli/src/config/load-config.ts:30-45` merges authored `record.format`, and `packages/generator-playwright/src/record/mux-video.ts:33-69` emits either `video.mp4` or `video.webm`. `tests/e2e/generation-engine-contract.test.ts:86-113` proves rerunning with `webm` removes stale `video.mp4`. |
| 9 | Action and chapter overlays are wired behind config and stay brief/minimal in implementation. | ✓ VERIFIED | `packages/generator-playwright/src/record/screencast.ts:25-40` only enables Playwright action annotations when `showActions` is true and uses brief defaults (`duration: 500`, `position: "top-right"`). `packages/generator-playwright/src/generate.ts:127-132,190-237` only wraps chapter calls when `showChapters` is true, and `packages/generator-playwright/src/overlays/chapter-overlay.ts:25-59` injects a transient overlay with a short hide timer. The remaining presentation-only human review was later waived by user instruction on 2026-04-14. |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/generator-playwright/src/execute/generator-types.ts` | Shared runtime event and two-pass timeline contracts | ✓ VERIFIED | Exists, substantive, and exports `TourRuntimeEvent`, `NarrationDurationResolver`, `CollectedTimelineEntry`, and `CollectedTimeline`. |
| `packages/generator-playwright/src/execute/collect-timeline.ts` | Pass-1 collector | ✓ VERIFIED | Exists, runs `goto -> setup -> run -> teardown`, captures runtime events, resolves narration durations, and returns ordered timeline data. |
| `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts` | Thin reusable runtime event source | ✓ VERIFIED | Exists, substantive, and remains Playwright-native while emitting chapter, step, narrate, wait, highlight, snapshot, and assert-visible events. |
| `packages/generator-playwright/src/execute/replay-timeline.ts` | Strict pass-2 replay engine | ✓ VERIFIED | Exists, enforces entry-by-entry replay, narration wait timing, and explicit divergence errors. |
| `packages/generator-playwright/src/record/screencast.ts` | Playwright screencast wrapper | ✓ VERIFIED | Exists, starts/stops screencast sessions and preserves the primary replay error during shutdown. |
| `packages/sdk/src/config.ts` | Shared record-format and overlay config contract | ✓ VERIFIED | Exists and defaults `record.format` to `"mp4"` while preserving `showActions`/`showChapters`. |
| `packages/generator-playwright/src/record/mux-video.ts` | Final video conversion/copy helper | ✓ VERIFIED | Exists, uses ffmpeg for `mp4` and direct copy for `webm`, returning a typed final artifact. |
| `packages/generator-playwright/src/output/prepare-output-dir.ts` | Safe `.demohunter/<tour-id>/` path preparation | ✓ VERIFIED | Exists, rejects unsafe tour IDs and creates the expected output root under the current project. |
| `packages/generator-playwright/src/output/write-generation-output.ts` | Baseline Phase 3 output writer | ✓ VERIFIED | Exists, writes only `video.*` and `chapters.json` and removes stale alternate video artifacts. |
| `packages/generator-playwright/src/overlays/chapter-overlay.ts` | Brief chapter overlay helper | ✓ VERIFIED | Exists and injects a temporary in-page chapter label without changing the authored runtime API. |
| `packages/generator-playwright/src/generate.ts` | Final Phase 3 orchestration | ✓ VERIFIED | Exists and wires pass 1, pass 2, screencast lifecycle, muxing, output writing, overlay proxying, and cleanup. |
| `tests/e2e/generation-engine-contract.test.ts` | Source-level Phase 3 contract proof | ✓ VERIFIED | Exists, substantive, and verifies success, strict divergence failure, and mp4/webm rerun behavior from a temp consumer repo. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/cli/src/commands/generate.ts` | `packages/generator-playwright/src/generate.ts` | CLI delegates to the real generator | WIRED | `generateCommand()` calls `resolvedDependencies.generateTour(...)` at `packages/cli/src/commands/generate.ts:27-47`. |
| `packages/generator-playwright/src/generate.ts` | `packages/generator-playwright/src/execute/collect-timeline.ts` | pass-1 collection | WIRED | `generateTour()` invokes `collectTimeline(...)` before any recording at `packages/generator-playwright/src/generate.ts:89-93`. |
| `packages/generator-playwright/src/generate.ts` | `packages/generator-playwright/src/record/screencast.ts` | recorded-pass session wrapper | WIRED | `generateTour()` calls `startScreencast(...)` before replay and `stopScreencast(...)` afterward at `packages/generator-playwright/src/generate.ts:104-141`. |
| `packages/generator-playwright/src/generate.ts` | `packages/generator-playwright/src/execute/replay-timeline.ts` | pass-2 strict replay | WIRED | `generateTour()` calls `replayTimeline(...)` inside the recording window at `packages/generator-playwright/src/generate.ts:113-133`. |
| `packages/generator-playwright/src/generate.ts` | `packages/generator-playwright/src/record/mux-video.ts` | final video production | WIRED | `generateTour()` passes the temp screencast and resolved record format into `muxVideo(...)` at `packages/generator-playwright/src/generate.ts:143-147`. |
| `packages/generator-playwright/src/generate.ts` | `packages/generator-playwright/src/output/write-generation-output.ts` | final artifact persistence | WIRED | `generateTour()` forwards `chapters`, `finalVideo`, and `outputDir` into `writeGenerationOutput(...)` at `packages/generator-playwright/src/generate.ts:149-153`. |
| `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts` | `packages/generator-playwright/src/execute/collect-timeline.ts` | runtime `onEvent` callback | WIRED | `collectTimeline()` constructs the runtime with `onEvent` and pushes emitted events into `events[]` at `packages/generator-playwright/src/execute/collect-timeline.ts:32-39`. |
| `packages/generator-playwright/src/runtime/create-smoke-tour-runtime.ts` | `packages/generator-playwright/src/execute/replay-timeline.ts` | shared runtime reused for live pass validation | WIRED | `createReplayRuntime()` wraps `createSmokeTourRuntime(...)` and validates every emitted event against the collected timeline at `packages/generator-playwright/src/execute/replay-timeline.ts:107-179`. |
| `packages/cli/src/config/load-config.ts` | `packages/sdk/src/config.ts` | record-format and overlay default resolution | WIRED | `loadConfig()` merges `DEFAULT_RECORD_CONFIG` into authored config at `packages/cli/src/config/load-config.ts:30-45`, using defaults from `packages/sdk/src/config.ts:50-70`. |
| `packages/generator-playwright/src/generate.ts` | `packages/generator-playwright/src/overlays/chapter-overlay.ts` | chapter overlay injection during replay | WIRED | `wrapTourForReplay()` intercepts `chapter()` and calls `showChapterOverlay(...)` only when `showChapters` is enabled at `packages/generator-playwright/src/generate.ts:190-237`. |
| `packages/generator-playwright/src/generate.ts` | `packages/generator-playwright/src/output/prepare-output-dir.ts` | fixed `.demohunter/<tour-id>/` root | WIRED | `generateTour()` resolves the output directory through `prepareOutputDirHelper(...)` at `packages/generator-playwright/src/generate.ts:49-57,74-75`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `packages/generator-playwright/src/execute/collect-timeline.ts` | `events[]` / `entries[]` / `narrations[]` | Real runtime events emitted during authored `setup/run/teardown` execution | Yes | ✓ FLOWING |
| `packages/generator-playwright/src/execute/replay-timeline.ts` | `expectedEntry` / `timeline.entries` | Pass-1 `CollectedTimeline` returned from `collectTimeline()` | Yes | ✓ FLOWING |
| `packages/generator-playwright/src/generate.ts` | `chapters[]` | `onMatchedEvent` callbacks fired by strict replay during pass 2 | Yes | ✓ FLOWING |
| `packages/generator-playwright/src/record/mux-video.ts` | `recordFormat` / `tempScreencastPath` | Resolved config plus actual recorded temp screencast | Yes | ✓ FLOWING |
| `packages/generator-playwright/src/output/write-generation-output.ts` | `finalVideo` / `chapters` | `muxVideo()` result and replay-derived chapter timing from `generateTour()` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 03 unit and integration contract coverage | `bun test packages/generator-playwright/src/runtime/create-smoke-tour-runtime.test.ts packages/generator-playwright/src/execute/collect-timeline.test.ts packages/generator-playwright/src/execute/replay-timeline.test.ts packages/generator-playwright/src/record/screencast.test.ts packages/generator-playwright/src/record/mux-video.test.ts packages/generator-playwright/src/output/prepare-output-dir.test.ts packages/generator-playwright/src/output/write-generation-output.test.ts packages/generator-playwright/src/overlays/chapter-overlay.test.ts packages/generator-playwright/src/generate.test.ts packages/cli/src/commands/generate.test.ts packages/sdk/src/config.test.ts packages/cli/src/config/load-config.test.ts` | `49 pass, 0 fail` | ✓ PASS |
| Source and built consumer-path generation contracts | `bun test tests/e2e/generation-engine-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts` | `5 pass, 0 fail` | ✓ PASS |
| Workspace type safety after Phase 03 changes | `bun x tsc -b tsconfig.json --pretty false` | exit code `0` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `GEN-01` | `03-04` | Developer can run `demohunter generate <tour-file>` against a local dev server, preview URL, or arbitrary base URL. | ✓ SATISFIED | `generateCommand()` delegates to `generateTour()` at `packages/cli/src/commands/generate.ts:27-47`; config preserves authored `baseURL` strings at `packages/cli/src/config/load-config.ts:30-45`; both passes use direct `page.goto(new URL(config.baseURL).href)` at `packages/generator-playwright/src/execute/collect-timeline.ts:41` and `packages/generator-playwright/src/execute/replay-timeline.ts:66`; source/dist e2e generation tests pass. This is partly an inference from direct URL handoff. |
| `GEN-02` | `03-01`, `03-02` | Generation uses a two-pass flow so narration timing is resolved before the recorded video pass starts. | ✓ SATISFIED | `generateTour()` runs `collectTimeline()` before recording and passes the result into `replayTimeline()` at `packages/generator-playwright/src/generate.ts:89-133`. `CollectedTimeline` is typed in `packages/generator-playwright/src/execute/generator-types.ts:58-82`. |
| `GEN-03` | `03-02` | During the recorded pass, the tool waits `durationMs + holdPaddingMs` after each narrated action. | ✓ SATISFIED | `packages/generator-playwright/src/execute/replay-timeline.ts:140-175` applies `durationMs + holdPaddingMs`, and `packages/generator-playwright/src/execute/replay-timeline.test.ts:62-103` asserts the exact wait. |
| `GEN-04` | `03-03`, `03-04` | Generated assets are written to `.demohunter/<tour-id>/` relative to the current working directory. | ✓ SATISFIED | `packages/generator-playwright/src/output/prepare-output-dir.ts:16-32` resolves `${cwd}/.demohunter/${tourId}`, `generateTour()` uses `loadedConfig.projectRoot` at `packages/generator-playwright/src/generate.ts:74`, and e2e tests assert the expected output path. |
| `GEN-05` | `03-03` | DemoHunter outputs `mp4` by default and can optionally generate `webm`. | ✓ SATISFIED | `packages/sdk/src/config.ts:50-53` defaults to `mp4`, `packages/cli/src/config/load-config.test.ts:108-139` covers defaulting and explicit `webm`, and `tests/e2e/generation-engine-contract.test.ts:86-113` proves the selected artifact is the only final video on rerun. |
| `GEN-06` | `03-04` | DemoHunter can render action and chapter overlays during generation when enabled in config. | ✓ SATISFIED | Code wiring is present in `packages/generator-playwright/src/record/screencast.ts:25-40`, `packages/generator-playwright/src/generate.ts:127-132,190-237`, and `packages/generator-playwright/src/overlays/chapter-overlay.ts:12-63`; unit tests cover gating and timing; the remaining presentation-only human gate was explicitly waived by user instruction on 2026-04-14. |

Plan requirement union covers `GEN-01` through `GEN-06`, and `REQUIREMENTS.md` maps exactly those six IDs to Phase 3. No orphaned Phase 3 requirements were found.

### Anti-Patterns Found

No blocker or warning anti-patterns were found in the scoped Phase 03 implementation and test files. Grep hits were limited to expected empty-array initialization and `undefined` checks, not placeholders, hollow returns, or unwired stub paths.

### Human Verification Required

None. The remaining presentation-only checks were waived by user instruction on 2026-04-14.

### Gaps Summary

No blocking implementation gaps were found. Phase 03 achieves the roadmap goal in code, wiring, and executable checks. The remaining presentation-only human review was waived by user instruction on 2026-04-14.

Disconfirmation pass notes:
- Partial requirement: `GEN-06` is implemented and wired, but the final overlay look-and-feel is inherently human-evaluated.
- Misleading test to avoid over-trusting: `packages/generator-playwright/src/generate.test.ts:9-179` proves orchestration order with mocked dependencies, not the actual screencast pixels or codec output; the real recording proof comes from the e2e contract tests.
- Uncovered error path: there is no dedicated test for cleanup-only failures in `packages/generator-playwright/src/generate.ts:157-186` when `rm(...)`, context close, or `browser.close()` fails after an otherwise successful run.

---

_Verified: 2026-04-14T08:28:00+02:00_
_Verifier: Claude (gsd-verifier)_
