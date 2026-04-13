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
| 05-01-01 | 01 | 1 | OUT-02 | T-05-01 / T-05-04 | Manifest schema rejects malformed payloads and unknown keys | unit | `bun test packages/manifest` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | OUT-02 | T-05-03 | Checksums are computed from final exported bytes with SHA-256 | unit | `bun test packages/manifest packages/generator-playwright/src/output/write-generation-output.test.ts` | ⚠️ partial | ⬜ pending |
| 05-02-01 | 02 | 2 | OUT-01 | T-05-02 / T-05-05 | Output writer exports poster, manifest, audio, and only output-root-relative paths | unit | `bun test packages/generator-playwright/src/output/write-generation-output.test.ts packages/generator-playwright/src/generate.test.ts` | ⚠️ partial | ⬜ pending |
| 05-03-01 | 03 | 3 | OUT-01 | T-05-02 | Source CLI emits the full portable output set and portability-safe manifest references | e2e | `bun test tests/e2e/generation-engine-contract.test.ts` | ✅ | ⬜ pending |
| 05-03-02 | 03 | 3 | OUT-04 | T-05-02 / T-05-03 | Built CLI preserves the same portable artifact contract from a fresh temp repo | e2e | `bun test tests/e2e/built-cli-bin-contract.test.ts` | ✅ | ⬜ pending |
| 05-03-03 | 03 | 3 | OUT-01, OUT-02, OUT-04 | T-05-01 / T-05-02 / T-05-03 / T-05-05 | Full workspace build and regression suite stay green with the portable contract enabled | integration | `bun run verify` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/manifest/src/*.test.ts` — schema parse/reject, checksum helper, and relative-path guard coverage for OUT-02 and OUT-04
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
