---
phase: 05-portable-output-contract
verified: 2026-04-14T08:28:00+02:00
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification: []
---

# Phase 5: Portable Output Contract Verification Report

**Phase Goal:** Finalize the versioned `.demohunter/` output contract so OSS output is portable and ready for later cloud ingest.
**Verified:** 2026-04-14T08:28:00+02:00
**Status:** passed
**Re-verification:** Yes - verified after restoring the missing phase verification artifact

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Every successful generation now emits the full portable output set under `.demohunter/<tour-id>/`, including `video.mp4`, `poster.jpg`, captions, chapters, manifest, and narration audio when narration exists. | ✓ VERIFIED | Phase 05 summary artifacts and the updated source/built CLI contracts prove the full artifact set. `tests/e2e/generation-engine-contract.test.ts`, `tests/e2e/built-cli-bin-contract.test.ts`, `tests/e2e/init-generate-smoke.test.ts`, and `tests/e2e/authoring-sdk-contract.test.ts` all passed again during re-verification. |
| 2 | `video.mp4` is the baseline output and `video.webm` remains optional rather than replacing the baseline portable artifact. | ✓ VERIFIED | `packages/generator-playwright/src/record/mux-video.ts` and `packages/generator-playwright/src/record/mux-video.test.ts` prove baseline mp4 emission with optional webm retention. |
| 3 | The portable manifest is versioned, strictly validated, and built from final exported artifact bytes rather than temp or cache-local paths. | ✓ VERIFIED | `packages/manifest/src/schema.ts`, `packages/manifest/src/checksum.ts`, `packages/manifest/src/paths.ts`, and `packages/generator-playwright/src/output/write-generation-output.ts` form the single manifest boundary; all related unit tests passed in re-verification. |
| 4 | Portable artifact descriptors use output-root-relative POSIX paths and SHA-256 checksums only. | ✓ VERIFIED | `packages/manifest/src/paths.test.ts` and `packages/manifest/src/checksum.test.ts` passed, covering normalization, escape rejection, and checksum descriptor generation. |
| 5 | Poster capture is deterministic and records explicit playback metadata instead of guessed values. | ✓ VERIFIED | `packages/generator-playwright/src/output/capture-poster.ts` and `packages/generator-playwright/src/output/capture-poster.test.ts` cover fixed-timestamp poster capture with clamped timestamps and probed duration metadata. |
| 6 | Narration audio is copied into `audio/` only when real narration exists, without placeholder output for no-narration runs. | ✓ VERIFIED | `packages/generator-playwright/src/output/export-audio.ts` and `packages/generator-playwright/src/output/export-audio.test.ts` passed; no-narration e2e regressions also passed. |
| 7 | The compiled dist path preserves the same portable output contract as the source CLI. | ✓ VERIFIED | `tests/e2e/built-cli-bin-contract.test.ts` and `tests/e2e/workspace-build-contract.test.ts` passed during re-verification, proving compiled manifest exports and built-bin parity. |
| 8 | The portable manifest boundary is exercised through real source CLI flows, not only unit tests. | ✓ VERIFIED | `tests/e2e/generation-engine-contract.test.ts` passed and parses `manifest.json` through the real manifest package boundary. |
| 9 | Phase 5 is fully covered by automated verification and does not depend on a remaining human-only acceptance step. | ✓ VERIFIED | The phase plans and tests cover manifest schema, checksums, poster/audio export, source/built CLI parity, starter regressions, and workspace build verification; no human-only UAT artifact is required for this phase. |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/manifest/src/schema.ts` | Versioned manifest schema and parse boundary | ✓ VERIFIED | Exists and is covered by `packages/manifest/src/schema.test.ts`. |
| `packages/manifest/src/checksum.ts` | Portable checksum descriptor helpers | ✓ VERIFIED | Exists and is covered by `packages/manifest/src/checksum.test.ts`. |
| `packages/manifest/src/paths.ts` | Output-root-relative path guard | ✓ VERIFIED | Exists and is covered by `packages/manifest/src/paths.test.ts`. |
| `packages/generator-playwright/src/record/mux-video.ts` | Baseline mp4 plus optional webm handling | ✓ VERIFIED | Exists and is covered by `packages/generator-playwright/src/record/mux-video.test.ts`. |
| `packages/generator-playwright/src/output/capture-poster.ts` | Deterministic poster extraction helper | ✓ VERIFIED | Exists and is covered by `packages/generator-playwright/src/output/capture-poster.test.ts`. |
| `packages/generator-playwright/src/output/export-audio.ts` | Narration audio export helper | ✓ VERIFIED | Exists and is covered by `packages/generator-playwright/src/output/export-audio.test.ts`. |
| `packages/generator-playwright/src/output/write-generation-output.ts` | Final portable output writer and manifest assembly | ✓ VERIFIED | Exists and is covered by `packages/generator-playwright/src/output/write-generation-output.test.ts`. |
| `tests/e2e/generation-engine-contract.test.ts` | Source CLI portable contract proof | ✓ VERIFIED | Passed during re-verification. |
| `tests/e2e/built-cli-bin-contract.test.ts` | Built CLI portable contract proof | ✓ VERIFIED | Passed during re-verification. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Manifest schema, checksum, path, mux, poster, audio, and output-writer coverage | `bun test packages/manifest/src/schema.test.ts packages/manifest/src/checksum.test.ts packages/manifest/src/paths.test.ts packages/generator-playwright/src/record/mux-video.test.ts packages/generator-playwright/src/generate.test.ts packages/generator-playwright/src/output/capture-poster.test.ts packages/generator-playwright/src/output/export-audio.test.ts packages/generator-playwright/src/output/write-generation-output.test.ts` | `20 pass, 0 fail` | ✓ PASS |
| Source and built portable contract coverage | `bun test tests/e2e/generation-engine-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts tests/e2e/init-generate-smoke.test.ts tests/e2e/authoring-sdk-contract.test.ts tests/e2e/workspace-build-contract.test.ts` | `9 pass, 0 fail` | ✓ PASS |
| Workspace type safety | `bun x tsc -b tsconfig.json --pretty false` | exit code `0` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `OUT-01` | `05-02`, `05-03`, `05-04` | Every successful generation writes `video.mp4`, optional `video.webm`, `poster.jpg`, `captions.srt`, `captions.vtt`, `chapters.json`, `manifest.json`, and cached audio files into `.demohunter/<tour-id>/`. | ✓ SATISFIED | Source CLI, built CLI, and no-narration e2e flows all passed with the expected artifact set and no placeholder audio. |
| `OUT-02` | `05-01`, `05-03`, `05-04` | DemoHunter defines a versioned Zod manifest schema that describes generated files and includes checksums. | ✓ SATISFIED | Manifest schema, checksum helpers, and manifest parsing tests passed; e2e tests exercise the same parser in real flows. |
| `OUT-04` | `05-01`, `05-02`, `05-03`, `05-04` | The generated output contract is portable enough for a later cloud product to ingest without access to the original repo. | ✓ SATISFIED | Portable path guards, checksum descriptors, copied audio, poster metadata, manifest assembly, and source/built CLI parity all passed in automated verification. |

Orphaned requirements: none. Phase 05 summary frontmatter claims `OUT-01`, `OUT-02`, and `OUT-04`, and this verification artifact now closes the previously missing independent verification source.

### Anti-Patterns Found

No blocker or warning anti-patterns were found in the Phase 05 manifest/output-contract layer. The phase remains fully covered by automated verification.

### Human Verification Required

None.

### Gaps Summary

No blocking gaps were found. Phase 05 achieves the roadmap goal in code, tests, and executable source/built consumer-path verification.

---

_Verified: 2026-04-14T08:28:00+02:00_
_Verifier: Codex_
