---
phase: 05
slug: portable-output-contract
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-13
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `bun test` |
| **Config file** | none — the repo relies on `bun test` and package scripts rather than a standalone config file |
| **Quick run command** | `bun test packages` |
| **Full suite command** | `bun run verify` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun test packages`
- **After every plan wave:** Run `bun test tests/e2e/generation-engine-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green via `bun run verify`
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | OUT-02 | T-05-01-01 | Manifest schema rejects malformed payloads and unknown keys | unit | `bun test packages/manifest/src/schema.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | OUT-02, OUT-04 | T-05-01-02 / T-05-01-03 | Checksums are computed from final exported bytes with SHA-256 and portable paths reject escapes | unit | `bun test packages/manifest/src/checksum.test.ts packages/manifest/src/paths.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | OUT-01 | T-05-02-01 / T-05-02-02 | `muxVideo()` always emits baseline mp4 and only emits webm when configured | unit | `bun test packages/generator-playwright/src/record/mux-video.test.ts` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | OUT-04 | T-05-02-03 / T-05-02-04 | Replay-safe narration timing is captured from pass 2 and forwarded to the output writer without changing captions | unit | `bun test packages/generator-playwright/src/generate.test.ts` | ⚠️ partial | ⬜ pending |
| 05-03-01 | 03 | 3 | OUT-01 | T-05-03-01 / T-05-03-02 | Poster capture and audio export behave deterministically and avoid placeholder output | unit | `bun test packages/generator-playwright/src/output/capture-poster.test.ts packages/generator-playwright/src/output/export-audio.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 3 | OUT-01, OUT-02, OUT-04 | T-05-03-03 / T-05-03-04 | Output writing emits the validated manifest and portable relative artifact descriptors from final bytes | unit | `bun test packages/generator-playwright/src/output/write-generation-output.test.ts` | ⚠️ partial | ⬜ pending |
| 05-04-01 | 04 | 4 | OUT-01 | T-05-04-01 | Source CLI emits the full portable output set and portability-safe manifest references | e2e | `bun test tests/e2e/generation-engine-contract.test.ts` | ✅ | ⬜ pending |
| 05-04-02 | 04 | 4 | OUT-04 | T-05-04-02 / T-05-04-04 | Built CLI preserves the same portable artifact contract from a fresh temp repo and the dist build exports the manifest package boundary | e2e | `bun test tests/e2e/built-cli-bin-contract.test.ts tests/e2e/workspace-build-contract.test.ts` | ✅ | ⬜ pending |
| 05-04-03 | 04 | 4 | OUT-01 | T-05-04-03 | No-narration starter and authored flows keep the new artifact set without placeholder audio while staying on a fast task-level smoke loop | e2e | `bun test tests/e2e/init-generate-smoke.test.ts tests/e2e/authoring-sdk-contract.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/manifest/src/*.test.ts` — schema parse/reject, checksum helper, and relative-path guard coverage for OUT-02 and OUT-04
- [ ] `packages/generator-playwright/src/output/capture-poster.test.ts` and `packages/generator-playwright/src/output/export-audio.test.ts` — deterministic poster capture and portable audio export coverage
- [ ] `packages/generator-playwright/src/output/write-generation-output.test.ts` — coverage for `poster.jpg`, `manifest.json`, and `audio/` export behavior
- [ ] `packages/generator-playwright/src/generate.test.ts` — replay-time narration timestamp capture and manifest assembly coverage
- [ ] `tests/e2e/generation-engine-contract.test.ts` — Phase 5 source CLI artifact set and portability assertions
- [ ] `tests/e2e/built-cli-bin-contract.test.ts` — Phase 5 built CLI artifact set and portability assertions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | — | All phase behaviors should be covered by automated verification | N/A |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
