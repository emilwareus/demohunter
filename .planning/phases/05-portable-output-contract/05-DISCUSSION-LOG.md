# Phase 5: Portable Output Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 05-portable-output-contract
**Areas discussed:** Manifest shape, Artifact layout, Poster behavior, Portability boundary

---

## Manifest shape

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal inventory | File list plus checksums only. Keeps the manifest small but pushes more reconstruction work to future ingest. | |
| Rich portable manifest | File inventory plus checksums, media metadata, and artifact relationships that cloud ingest can use directly. | ✓ |
| Let the agent decide | Defer the exact level of richness to planning. | |

**User's choice:** Recommended option
**Notes:** Locked as a rich portable manifest. The manifest should be the external source of truth for the generated output contract, not just a thin checksum ledger.

---

## Artifact layout

| Option | Description | Selected |
|--------|-------------|----------|
| Flat root | Keep everything at the tour root except optional files. Simplest structure, but audio assets become cluttered. | |
| Stable relative layout | Keep primary artifacts at the tour root, store narration audio under `audio/`, and reference everything via stable relative paths in the manifest. | ✓ |
| Let the agent decide | Defer the output layout to planning. | |

**User's choice:** Recommended option
**Notes:** Locked as stable relative paths with a dedicated `audio/` subdirectory. Optional artifacts should stay explicit rather than requiring placeholder files.

---

## Poster behavior

| Option | Description | Selected |
|--------|-------------|----------|
| First meaningful frame | Try to pick an attractive early frame heuristically. | |
| Deterministic fixed timestamp | Always extract the poster from a defined timestamp, with deterministic fallback behavior if the video is shorter. | ✓ |
| Chapter-aware poster | Pick a frame based on chapter timing or richer semantic heuristics. | |

**User's choice:** Recommended option
**Notes:** Locked as deterministic fixed-timestamp poster generation. Repeatability and contract stability are more important than content-aware thumbnail quality.

---

## Portability boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal portability | Only include files and checksums, leaving future ingest to infer the rest. | |
| Self-describing ingest contract | Embed artifact-local metadata needed for later cloud ingest while excluding repo-local and machine-local details. | ✓ |
| Let the agent decide | Defer the exact portability boundary to planning. | |

**User's choice:** Recommended option
**Notes:** Locked as a self-describing ingest contract. Absolute paths, repo paths, local URLs, and secrets must stay out of the portable output.

---

## the agent's Discretion

- Exact manifest field names and schema organization
- Exact fixed timestamp for poster extraction
- Exact checksum plumbing and validation helper structure

## Deferred Ideas

None.
