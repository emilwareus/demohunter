# Phase 05: Portable Output Contract - Research

**Researched:** 2026-04-13  
**Domain:** Portable artifact contracts for local media generation  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Manifest shape
- **D-01:** `manifest.json` should be richer than a bare file inventory. It should include both file inventory plus checksums and the media/timeline metadata that a future ingest service would need directly.
- **D-02:** The manifest should be the single portable source of truth for artifact relationships, generation format version, and output metadata rather than requiring cloud ingest to reconstruct structure from filenames alone.

#### Artifact layout
- **D-03:** The portable output directory should use stable relative paths only. All file references in the manifest must be relative to `.demohunter/<tour-id>/`, never absolute or machine-specific.
- **D-04:** Narration audio should live under an `audio/` subdirectory inside the tour output root, while `video.mp4`, optional `video.webm`, `poster.jpg`, `captions.srt`, `captions.vtt`, `chapters.json`, and `manifest.json` remain top-level tour artifacts.
- **D-05:** Optional artifacts should be represented explicitly but conservatively: `video.mp4` is expected by default, `video.webm` appears only when generated, and the manifest should make optionality clear without forcing placeholder files.

#### Poster behavior
- **D-06:** `poster.jpg` should be generated deterministically from a fixed playback timestamp rather than a subjective "best frame" heuristic or chapter-aware selection logic.
- **D-07:** Poster generation should favor repeatability and contract stability over content-aware intelligence. If the preferred timestamp is unavailable because the video is shorter, the implementation may fall back deterministically.

#### Portability boundary
- **D-08:** The portable contract must embed everything needed for later cloud ingest that is artifact-local: manifest version, relative file paths, checksums, durations, chapter data, subtitle references, and narration-audio references.
- **D-09:** The portable contract must not depend on repo-local or machine-local information such as absolute paths, source file paths, local base URLs, workstation-specific temp paths, or environment-dependent secrets.
- **D-10:** Cloud-ingest readiness matters more than mirroring internal runtime structures exactly. Planning should bias toward a clean external contract that another system can validate and consume without reading generator internals.

### Claude's Discretion
- Exact manifest field names, Zod schema decomposition, and checksum algorithm wiring are open to research and planning as long as the contract stays versioned, portable, and self-describing.
- The exact fixed timestamp used for `poster.jpg` can be chosen during planning, provided it is deterministic and documented in the output contract.
- The exact organization of manifest sections is flexible as long as artifact references remain relative and ingest-safe.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OUT-01 | Every successful generation writes `video.mp4`, optional `video.webm`, `poster.jpg`, `captions.srt`, `captions.vtt`, `chapters.json`, `manifest.json`, and cached audio files into `.demohunter/<tour-id>/`. [VERIFIED: .planning/REQUIREMENTS.md] | Extend the existing explicit output writer to export copied narration audio into `audio/`, capture `poster.jpg` from the final video, and write `manifest.json` only after all final artifacts exist. [VERIFIED: codebase grep] |
| OUT-02 | DemoHunter defines a versioned Zod manifest schema that describes generated files and includes checksums. [VERIFIED: .planning/REQUIREMENTS.md] | Put the schema, version constant, parse helpers, and SHA-256 checksum helpers in `@demohunter/manifest`, using strict Zod objects and shared checksum descriptors. [VERIFIED: codebase grep] [VERIFIED: npm registry] [CITED: https://zod.dev/api?id=sets] [CITED: https://nodejs.org/api/crypto.html] |
| OUT-04 | The generated output contract is portable enough for a later cloud product to ingest without access to the original repo. [VERIFIED: .planning/REQUIREMENTS.md] | Manifest paths must be output-relative only, and the manifest must embed the artifact relationships, chapter data, subtitle references, narration-audio references, and replay-safe timing metadata that Cloud docs already describe as upload/ingest inputs. [VERIFIED: codebase grep] |
</phase_requirements>

## Summary

Phase 5 should treat `@demohunter/manifest` as the authoritative home of the external output contract, because that package already exists as the intended manifest boundary while the current generator writer still emits only the selected final video, `chapters.json`, and subtitle files; it does not yet export narration audio, capture `poster.jpg`, or write `manifest.json`. [VERIFIED: codebase grep]

The most important planning constraint is timing fidelity. `generateTour()` already records replay-time chapter starts from pass 2, but subtitle serialization currently concatenates narration durations back-to-back and does not encode replay gaps, hold padding, or chapter-overlay time. [VERIFIED: codebase grep] Therefore the planner should not build the portable manifest from pass-one narration order alone; it should add replay-measured narration timing to the pass-two orchestration and use that richer timeline for ingest-safe manifest metadata. [VERIFIED: codebase grep]

Cloud docs already assume upload of `.demohunter/<tour-id>/` with video, captions, chapters, manifest, poster, and `audio/`, and they call out “manifest ingestion” plus reusable narration segments in a timeline manifest as future hosted behavior. [VERIFIED: codebase grep] **Primary recommendation:** write all final artifacts first, hash the actual exported files inside `.demohunter/<tour-id>/`, validate a strict versioned manifest with Zod, and keep every manifest reference relative to the tour output root. [VERIFIED: codebase grep] [CITED: https://nodejs.org/api/path.html]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@demohunter/manifest` | workspace `0.0.0` | Home for manifest schema, parse helpers, and checksum helpers. | The workspace package already exists specifically for generated-output manifest responsibilities and is currently only a placeholder export, so Phase 5 should fill this seam instead of inventing a new contract location. [VERIFIED: codebase grep] |
| `zod` | `4.3.6` (published 2026-01-22) | Strict manifest validation and inferred TypeScript types. | The phase requires a versioned Zod manifest schema, and current Zod docs expose object/schema APIs plus JSON Schema generation support that fit a portable contract package well. [VERIFIED: npm registry] [CITED: https://zod.dev/api?id=sets] [CITED: https://zod.dev/json-schema] |
| `node:crypto` | builtin in Node `v20.19.4` | SHA-256 artifact checksums. | Node documents `crypto.createHash()` as the standard hash primitive, and the repo already uses SHA-256 for cache keys and cache-integrity metadata. [VERIFIED: local environment probe] [VERIFIED: codebase grep] [CITED: https://nodejs.org/api/crypto.html] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ffmpeg` | `8.0` | Deterministic poster extraction from the final rendered video. | Use for `poster.jpg` generation after the final video artifact exists. FFmpeg docs explicitly support seeking and limited-frame extraction. [VERIFIED: local environment probe] [CITED: https://ffmpeg.org/ffmpeg.html] |
| `ffprobe` | `8.0` | Duration probing for poster clamping and manifest media metadata. | Use to measure final video duration and clamp poster timestamp deterministically. The repo already uses ffprobe for audio-duration measurement. [VERIFIED: local environment probe] [VERIFIED: codebase grep] [CITED: https://ffmpeg.org/ffprobe-all.html] |
| `playwright` | repo floor `>=1.59`, current registry `1.59.1` (published 2026-04-01) | Existing generation and end-to-end contract tests still run through real browser execution. | Keep the existing Phase 3/4 test approach; Phase 5 extends artifact assertions, not the browser stack. [VERIFIED: codebase grep] [VERIFIED: npm registry] [VERIFIED: local environment probe] |
| `node:path` | builtin in Node `v20.19.4` | Relative-path enforcement for manifest portability. | Use `path.relative()` and `path.resolve()` to convert absolute local paths back into output-root-relative references and reject escapes. [VERIFIED: local environment probe] [CITED: https://nodejs.org/api/path.html] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@demohunter/manifest` as the contract owner | Put schema/checksum logic in `@demohunter/generator-playwright` | This would mix external contract rules into the generator runtime package and bypass the manifest package boundary that Phase 1 and product docs already reserved for this responsibility. [VERIFIED: codebase grep] |
| `node:crypto` SHA-256 helpers | A third-party checksum package | An external checksum dependency adds surface area without solving a problem the builtin crypto API does not already solve. [CITED: https://nodejs.org/api/crypto.html] |
| Fixed poster timestamp | Content-aware or chapter-aware poster picking | This conflicts directly with D-06 and D-07, which lock poster selection to deterministic timestamping over heuristics. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md] |

**Installation:**
```bash
cd packages/manifest
bun add zod
```

**Version verification:** [VERIFIED: npm registry]
```bash
npm view zod version time --json
npm view playwright version time --json
```

- `zod` current version: `4.3.6`, published `2026-01-22T19:14:35.382Z`. [VERIFIED: npm registry]
- `playwright` current version: `1.59.1`, published `2026-04-01T17:58:48.894Z`; the repo currently pins a floor of `>=1.59`. [VERIFIED: npm registry] [VERIFIED: codebase grep]

## Architecture Patterns

### Recommended Project Structure
```text
packages/
├── manifest/
│   └── src/
│       ├── schema.ts        # Zod manifest schema + exported types
│       ├── checksum.ts      # sha256 file helpers and checksum descriptor types
│       ├── paths.ts         # output-root-relative path guards
│       └── index.ts         # public parse/create exports
└── generator-playwright/
    └── src/
        ├── output/
        │   ├── write-generation-output.ts  # final artifact orchestration
        │   ├── capture-poster.ts           # ffmpeg poster extraction
        │   └── export-audio.ts             # copy cache audio into output/audio/
        └── generate.ts                     # pass-two timing capture + manifest assembly
```
Follow the existing explicit artifact-by-artifact writer pattern rather than introducing a generic build pipeline abstraction. [VERIFIED: codebase grep]

### Pattern 1: Manifest Package Owns the External Contract
**What:** Put the manifest version constant, strict Zod schemas, parse helpers, and checksum descriptor types in `@demohunter/manifest`, then import those helpers from the generator when writing `manifest.json`. [VERIFIED: codebase grep] [VERIFIED: npm registry] [CITED: https://zod.dev/api?id=sets]

**When to use:** Use this package for every read or write of `manifest.json`, including tests that validate round-trips and rejection of unknown keys. [VERIFIED: codebase grep]

**Example:**
```ts
// Source: https://zod.dev/api?id=sets
import * as z from "zod";

export const checksumSchema = z.strictObject({
  algorithm: z.literal("sha256"),
  byteSize: z.int().nonnegative(),
  hex: z.string().length(64),
});

export const artifactSchema = z.strictObject({
  path: z.string().min(1),
  mediaType: z.string().min(1),
  checksum: checksumSchema,
});
```

### Pattern 2: Write Final Files First, Then Build the Manifest From the Output Directory
**What:** `writeGenerationOutput()` should finish copying/writing video, subtitles, chapters, poster, and `audio/` exports before the manifest is assembled, so checksums and byte sizes describe the final portable bytes and not intermediate or cache-local artifacts. [VERIFIED: codebase grep]

**When to use:** After `muxVideo()` and after any ffmpeg/ffprobe-based media helpers have completed successfully. [VERIFIED: codebase grep]

**Example:**
```ts
// Source: https://nodejs.org/api/path.html and https://nodejs.org/api/crypto.html
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function createArtifactRecord(outputDir: string, filePath: string) {
  const relativePath = path.relative(outputDir, filePath);

  if (relativePath === "" || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Artifact path must stay inside the portable output root.");
  }

  const bytes = await readFile(filePath);
  return {
    path: relativePath,
    checksum: {
      algorithm: "sha256",
      byteSize: bytes.byteLength,
      hex: createHash("sha256").update(bytes).digest("hex"),
    },
  };
}
```

### Pattern 3: Capture Replay-Measured Chapter and Narration Timing During Pass 2
**What:** Extend `generateTour()` so pass 2 records narration start times the same way it already records chapter start times, then feed those timings into the manifest. Current subtitle serialization only accumulates narration duration; it does not represent replay gaps or hold padding. [VERIFIED: codebase grep]

**When to use:** Whenever the manifest needs `startMs`, `endMs`, chapter alignment, poster timestamp context, or future cloud transcript navigation. [VERIFIED: codebase grep]

**Example:**
```ts
// Source: codebase pattern from packages/generator-playwright/src/generate.ts
const recordingStartedAt = now();
const narrationTimeline: Array<{ cacheKey: string; startMs: number; endMs: number }> = [];

await replayTimeline({
  loadedConfig,
  onMatchedEvent: (event) => {
    if (event.kind === "narrate") {
      const startMs = Math.max(0, now() - recordingStartedAt);
      const segment = /* resolve from collected timeline by event order */;
      narrationTimeline.push({
        cacheKey: segment.cacheKey,
        startMs,
        endMs: startMs + segment.durationMs,
      });
    }
  },
  page,
  timeline,
  tourFile,
});
```

### Anti-Patterns to Avoid
- **Manifest-by-filename reconstruction:** Do not make Cloud or later phases infer relationships from `video.mp4`, `captions.vtt`, and `audio/*.mp3` naming alone; D-01 and D-02 explicitly reject that thinner contract. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]
- **Absolute-path leakage:** `loadConfig()` resolves `outputDir` and `cacheDir` to absolute filesystem paths, so writing those strings into the manifest would violate D-03 and D-09 immediately. [VERIFIED: codebase grep]
- **Pass-one timing treated as final media timing:** The current subtitle helper serializes contiguous narration durations only, which is not rich enough for an ingest-safe portable timeline. [VERIFIED: codebase grep]
- **Poster heuristics:** Do not add chapter-aware or “best frame” analysis; the phase is locked to deterministic timestamp extraction. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Manifest validation | Custom JSON-shape checks spread across the generator | `zod` strict schemas in `@demohunter/manifest` | The phase explicitly requires Zod validation, and strict schemas keep unknown-key rejection centralized and testable. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: npm registry] [CITED: https://zod.dev/api?id=sets] |
| File checksums | A bespoke checksum algorithm or handwritten hex logic | `node:crypto` SHA-256 helper | The repo already depends on SHA-256 semantics for cache integrity, and Node exposes the hashing primitive directly. [VERIFIED: codebase grep] [CITED: https://nodejs.org/api/crypto.html] |
| Poster frame extraction | Manual video parsing in TypeScript | `ffmpeg` with `-ss` and `-frames:v 1` | FFmpeg already powers media generation in this repo and directly supports seeking plus limited-frame extraction. [VERIFIED: codebase grep] [CITED: https://ffmpeg.org/ffmpeg.html] |
| Duration probing | Timing guesses from file names or narrated text length | `ffprobe` against the final video file | The repo already uses ffprobe for measured audio duration, and poster clamping/media metadata should follow the same measured-asset pattern. [VERIFIED: codebase grep] [CITED: https://ffmpeg.org/ffprobe-all.html] |
| Relative-path enforcement | String slicing like `fullPath.replace(outputDir, "")` | `path.relative()` plus escape checks | Node documents the relative/resolve semantics directly, and this avoids platform-specific separator bugs. [CITED: https://nodejs.org/api/path.html] |

**Key insight:** The dangerous parts of this phase are not “writing another JSON file”; they are path leakage, inaccurate timeline metadata, and media-side edge cases that already have standard primitives in Zod, Node, ffmpeg, and ffprobe. [VERIFIED: codebase grep] [CITED: https://nodejs.org/api/crypto.html] [CITED: https://ffmpeg.org/ffmpeg.html]

## Common Pitfalls

### Pitfall 1: Building the Manifest Before the Portable Bytes Exist
**What goes wrong:** Checksums, byte sizes, or relative paths describe cache-local or temporary artifacts instead of the final exported files. [VERIFIED: codebase grep]
**Why it happens:** Current narration audio lives in `.demohunter/cache`, while the portable contract requires copied audio under `.demohunter/<tour-id>/audio/`. [VERIFIED: codebase grep]
**How to avoid:** Export/copy every final artifact first, then enumerate and hash the files inside the tour output directory only. [VERIFIED: codebase grep]
**Warning signs:** `manifest.json` references paths outside the tour directory, or checksum mismatches appear immediately after a rerun. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]

### Pitfall 2: Treating Sequential Narration Duration as the Final Video Timeline
**What goes wrong:** Transcript or narration metadata ends earlier than the actual video because hold padding, waits, and replay-time action latency are missing from timing fields. [VERIFIED: codebase grep]
**Why it happens:** `serializeNarrationSubtitles()` currently accumulates `durationMs` sequentially, while `replayTimeline()` adds `holdPaddingMs` during pass 2 and `generateTour()` only records chapter timestamps from actual replay. [VERIFIED: codebase grep]
**How to avoid:** Add pass-two narration timestamp capture and build manifest timeline fields from replay events, not from the pass-one narration array alone. [VERIFIED: codebase grep]
**Warning signs:** `captions.srt` reaches EOF while the video is still visibly playing, or chapter markers line up but narration metadata does not. [VERIFIED: codebase grep]

### Pitfall 3: Letting Absolute Local Paths Leak Into the Manifest
**What goes wrong:** Cloud ingest or cross-machine reuse fails because the manifest contains `/Users/...`, temp recording paths, or cache-root paths that only exist on one workstation. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]
**Why it happens:** `loadConfig()` normalizes `outputDir` and `cacheDir` to absolute paths for runtime convenience. [VERIFIED: codebase grep]
**How to avoid:** Convert every artifact path back to output-root-relative form with `path.relative()`, then reject any empty, absolute, or escaping result. [CITED: https://nodejs.org/api/path.html]
**Warning signs:** `manifest.json` changes when the same tour is generated from a different absolute repo location. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]

### Pitfall 4: Leaving the Video-Artifact Contract Ambiguous
**What goes wrong:** Tests, manifest schema, and runtime behavior disagree on whether the contract is “one selected video file” or “always mp4 plus optional webm.” [VERIFIED: codebase grep] [VERIFIED: .planning/REQUIREMENTS.md]
**Why it happens:** Phase 3 intentionally emits only the selected final video artifact, but OUT-01 and Phase 1 docs can be read as `video.mp4` plus optional `video.webm`. [VERIFIED: codebase grep]
**How to avoid:** Resolve the ambiguity in planning before implementation and encode the answer in manifest schema, writer behavior, and e2e assertions together. [VERIFIED: codebase grep]
**Warning signs:** A manifest row marks `video.mp4` as required while a `record.format = "webm"` run still passes source tests. [VERIFIED: codebase grep]

### Pitfall 5: Poster Capture Drifts Across Reruns
**What goes wrong:** Two successful runs of the same tour produce different `poster.jpg` outputs, which makes the portable contract unstable and breaks checksum expectations. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]
**Why it happens:** Poster selection is based on heuristics or on a timestamp that is not clamped deterministically for short videos. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]
**How to avoid:** Use one fixed timestamp constant and clamp it against measured final-video duration before frame extraction. [CITED: https://ffmpeg.org/ffmpeg.html] [CITED: https://ffmpeg.org/ffprobe-all.html]
**Warning signs:** `poster.jpg` checksums change even when `video.mp4` checksums do not. [VERIFIED: codebase grep]

## Code Examples

Verified patterns from official sources and current repo seams:

### Strict Manifest Parse at the Package Boundary
```ts
// Source: https://zod.dev/api?id=sets
import * as z from "zod";

export const manifestSchema = z.strictObject({
  manifestVersion: z.literal(1),
  tourId: z.string().min(1),
  checksumAlgorithm: z.literal("sha256"),
  artifacts: z.strictObject({
    chapters: z.strictObject({
      path: z.literal("chapters.json"),
      checksum: checksumSchema,
    }),
    poster: z.strictObject({
      path: z.literal("poster.jpg"),
      checksum: checksumSchema,
      capturedAtMs: z.int().nonnegative(),
    }),
  }),
});

export function parseManifest(input: unknown) {
  return manifestSchema.parse(input);
}
```

### Poster Capture With Seek + Single-Frame Output
```ts
// Source: https://ffmpeg.org/ffmpeg.html
await runCommand("ffmpeg", [
  "-y",
  "-ss",
  `${posterAtMs / 1000}`,
  "-i",
  videoPath,
  "-frames:v",
  "1",
  "-q:v",
  "2",
  posterPath,
]);
```

### Output-Relative Path Guard
```ts
// Source: https://nodejs.org/api/path.html
import path from "node:path";

export function toPortablePath(outputDir: string, artifactPath: string): string {
  const relativePath = path.relative(outputDir, artifactPath);

  if (relativePath === "" || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Portable artifact path escaped the output root.");
  }

  return relativePath;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Baseline artifact writer emitted only the selected final video plus `chapters.json`. [VERIFIED: codebase grep] | Current Phase 4 writer emits the selected final video plus `chapters.json`, `captions.srt`, and `captions.vtt`, but still omits poster, manifest, and exported audio. [VERIFIED: codebase grep] | Phase 4 completed on 2026-04-11. [VERIFIED: .planning/STATE.md] | Phase 5 can build on a real output seam instead of inventing a new generator path. [VERIFIED: codebase grep] |
| Filenames and directory layout were enough for local OSS output. [VERIFIED: codebase grep] | Product and cloud docs now require a richer manifest that Cloud can ingest directly, including timeline and checksum data. [VERIFIED: codebase grep] | Locked in Phase 5 context on 2026-04-12. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md] | Manifest design is now an external contract decision, not internal implementation detail. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md] |
| Cache integrity metadata is local-cache-only. [VERIFIED: codebase grep] | The portable contract must describe exported artifact bytes under `.demohunter/<tour-id>/`, even when some bytes originated from cache. [VERIFIED: codebase grep] | Phase 5 roadmap/requirements. [VERIFIED: codebase grep] | Planner should hash exported files from the output directory, not stop at cache metadata lookup. [VERIFIED: codebase grep] |

**Deprecated/outdated:**
- Treating `manifest.json` as a thin file inventory is outdated for this phase because D-01 and D-02 lock a richer contract. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]
- Using absolute or machine-specific artifact references is outdated because D-03 and D-09 explicitly forbid them. [VERIFIED: .planning/phases/05-portable-output-contract/05-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A fixed poster capture timestamp of `1000ms` is a reasonable default if the planner wants a concrete constant now. [ASSUMED] | Architecture Patterns / Common Pitfalls | Low-to-medium. The contract remains deterministic either way, but tests and docs must agree on the chosen constant. |

## Open Questions

1. **Does Phase 5 preserve the current one-of video output model or change to always-on `video.mp4` plus optional `video.webm`?**
   - What we know: current code and Phase 3 tests remove the stale alternate video and keep only the selected final artifact, while OUT-01 and product docs can be read as `video.mp4` plus optional `video.webm`. [VERIFIED: codebase grep] [VERIFIED: .planning/REQUIREMENTS.md]
   - What's unclear: whether “optional `video.webm`” means an additional artifact or only an alternate chosen by config.
   - Recommendation: resolve this before plan breakdown, because it affects `RecordFormat`, `muxVideo()`, manifest schema, and every e2e artifact assertion. [VERIFIED: codebase grep]

2. **Should Phase 5 correct subtitle timing to replay-relative values, or only add replay-safe timing inside the manifest?**
   - What we know: current subtitle files are derived from narration segments only, and their timing is sequential duration accumulation rather than replay-measured media timing. [VERIFIED: codebase grep]
   - What's unclear: whether phase scope includes changing the already-completed OUT-03 subtitle behavior or only enriching the portable manifest for future ingest.
   - Recommendation: at minimum add replay-measured narration timing to the manifest in Phase 5; change `captions.srt` and `captions.vtt` only if the planner explicitly chooses to tighten the subtitle contract now. [VERIFIED: codebase grep]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Workspace build and test commands | ✓ [VERIFIED: local environment probe] | `1.2.20` [VERIFIED: local environment probe] | — |
| Node.js | Runtime, CLI, `node:crypto`, and local scripts | ✓ [VERIFIED: local environment probe] | `v20.19.4` [VERIFIED: local environment probe] | — |
| ffmpeg | Poster extraction and existing video muxing flow | ✓ [VERIFIED: local environment probe] | `8.0` [VERIFIED: local environment probe] | None — required for media output. [VERIFIED: codebase grep] |
| ffprobe | Video-duration probing and existing audio-duration measurement pattern | ✓ [VERIFIED: local environment probe] | `8.0` [VERIFIED: local environment probe] | None — required for measured media metadata. [VERIFIED: codebase grep] |
| Playwright CLI/runtime | Source and built-CLI generation tests | ✓ [VERIFIED: local environment probe] | `1.59.1` [VERIFIED: local environment probe] | None for e2e generation tests. [VERIFIED: codebase grep] |

**Missing dependencies with no fallback:**
- None. [VERIFIED: local environment probe]

**Missing dependencies with fallback:**
- None. [VERIFIED: local environment probe]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `bun test` with Bun test APIs. [VERIFIED: codebase grep] [VERIFIED: local environment probe] |
| Config file | none — the repo relies on `bun test` and package scripts rather than a standalone config file. [VERIFIED: codebase grep] |
| Quick run command | `bun test packages` [VERIFIED: codebase grep] |
| Full suite command | `bun test` or `bun run verify` [VERIFIED: codebase grep] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OUT-01 | Successful generation emits poster, manifest, subtitles, chapters, selected video artifact(s), and `audio/` export in `.demohunter/<tour-id>/`. [VERIFIED: .planning/REQUIREMENTS.md] | e2e | `bun test tests/e2e/generation-engine-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts` [VERIFIED: codebase grep] | ✅ existing suites need Phase 5 assertions. [VERIFIED: codebase grep] |
| OUT-02 | Manifest schema is versioned, Zod-validated, and includes checksums. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `bun test packages/manifest packages/generator-playwright/src/output/write-generation-output.test.ts` [VERIFIED: codebase grep] | ❌ `packages/manifest` currently has no tests. [VERIFIED: codebase grep] |
| OUT-04 | Manifest is ingest-portable with relative paths and no repo-local leakage. [VERIFIED: .planning/REQUIREMENTS.md] | unit + e2e | `bun test packages/manifest tests/e2e/generation-engine-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts` [VERIFIED: codebase grep] | ⚠️ partial; e2e files exist, portability-specific assertions do not. [VERIFIED: codebase grep] |

### Sampling Rate
- **Per task commit:** `bun test packages` [VERIFIED: codebase grep]
- **Per wave merge:** `bun test tests/e2e/generation-engine-contract.test.ts tests/e2e/built-cli-bin-contract.test.ts` [VERIFIED: codebase grep]
- **Phase gate:** `bun test` or `bun run verify` before `/gsd-verify-work`. [VERIFIED: codebase grep]

### Wave 0 Gaps
- [ ] `packages/manifest/src/*.test.ts` — add schema parse/reject, checksum helper, and relative-path guard coverage for OUT-02 and OUT-04. [VERIFIED: codebase grep]
- [ ] `packages/generator-playwright/src/output/write-generation-output.test.ts` — extend for `poster.jpg`, `manifest.json`, and `audio/` export coverage. [VERIFIED: codebase grep]
- [ ] `packages/generator-playwright/src/generate.test.ts` — add replay-time narration timestamp capture and manifest assembly assertions. [VERIFIED: codebase grep]
- [ ] `tests/e2e/generation-engine-contract.test.ts` and `tests/e2e/built-cli-bin-contract.test.ts` — update expected artifact sets and portability checks for source and built CLI paths. [VERIFIED: codebase grep]

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no [VERIFIED: codebase grep] | Local file generation only; no auth is introduced in this phase. [VERIFIED: codebase grep] |
| V3 Session Management | no [VERIFIED: codebase grep] | No session state is added by manifest/output work. [VERIFIED: codebase grep] |
| V4 Access Control | no [VERIFIED: codebase grep] | The output contract is local filesystem data, not an authorization boundary. [VERIFIED: codebase grep] |
| V5 Input Validation | yes [VERIFIED: codebase grep] | Use strict Zod schemas and explicit output-root-relative path guards. [VERIFIED: npm registry] [CITED: https://zod.dev/api?id=sets] [CITED: https://nodejs.org/api/path.html] |
| V6 Cryptography | yes [VERIFIED: codebase grep] | Use `node:crypto` SHA-256; never hand-roll checksum logic. [CITED: https://nodejs.org/api/crypto.html] |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Absolute-path or cache-path leakage inside `manifest.json` | Information Disclosure | Convert every artifact reference to an output-root-relative path and reject path escapes. [CITED: https://nodejs.org/api/path.html] |
| Malformed or poisoned manifest payloads | Tampering | Validate with strict Zod schemas before write/read and reject unknown keys. [CITED: https://zod.dev/api?id=sets] |
| Artifact corruption after copy/export | Tampering | Hash final output files in `.demohunter/<tour-id>/` and store per-artifact SHA-256 checksums. [CITED: https://nodejs.org/api/crypto.html] |
| Shell-injection risk in media helpers | Elevation of Privilege | Follow existing `spawn`/argument-array command execution patterns for ffmpeg/ffprobe helpers instead of interpolated shell strings. [VERIFIED: codebase grep] |

## Sources

### Primary (HIGH confidence)
- `docs/phase_1_oss_core.md` - OSS output contract, manifest package responsibility, generated-output layout, and phase decomposition. [VERIFIED: codebase grep]
- `docs/phase_2_cloud_offering.md` - Upload/ingest expectations, watch-page dependencies, and timeline-manifest reuse goals. [VERIFIED: codebase grep]
- `.planning/phases/05-portable-output-contract/05-CONTEXT.md` - Locked Phase 5 decisions and portability constraints. [VERIFIED: codebase grep]
- `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` - OUT-01/02/04 requirements plus Phase 5 success criteria. [VERIFIED: codebase grep]
- `packages/generator-playwright/src/generate.ts`, `write-generation-output.ts`, `replay-timeline.ts`, `subtitles.ts` - Current orchestration, timing capture, and artifact-writing behavior. [VERIFIED: codebase grep]
- `packages/tts-core/src/cache/cache-store.ts` - Existing SHA-256 cache integrity metadata and ffprobe duration pattern. [VERIFIED: codebase grep]
- [Zod API docs](https://zod.dev/api?id=sets) - Schema/object APIs. [CITED: https://zod.dev/api?id=sets]
- [Zod JSON Schema docs](https://zod.dev/json-schema) - JSON Schema export behavior and limits. [CITED: https://zod.dev/json-schema]
- [Node.js crypto docs](https://nodejs.org/api/crypto.html) - `crypto.createHash()` API. [CITED: https://nodejs.org/api/crypto.html]
- [Node.js path docs](https://nodejs.org/api/path.html) - `path.relative()` and `path.resolve()` behavior. [CITED: https://nodejs.org/api/path.html]
- [FFmpeg docs](https://ffmpeg.org/ffmpeg.html) - seek and frame-limited extraction behavior. [CITED: https://ffmpeg.org/ffmpeg.html]
- [ffprobe docs](https://ffmpeg.org/ffprobe-all.html) - probing/writer options and media metadata inspection. [CITED: https://ffmpeg.org/ffprobe-all.html]
- `npm view zod version time --json` and `npm view playwright version time --json` - current package versions and publish dates. [VERIFIED: npm registry]
- Local environment probes for `bun`, `node`, `ffmpeg`, `ffprobe`, and `bun x playwright --version`. [VERIFIED: local environment probe]

### Secondary (MEDIUM confidence)
- None. [VERIFIED: source review]

### Tertiary (LOW confidence)
- None. [VERIFIED: source review]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package seams, runtime tools, and external versions were directly verified in the repo, npm registry, and local environment. [VERIFIED: codebase grep] [VERIFIED: npm registry] [VERIFIED: local environment probe]
- Architecture: MEDIUM - the core writer/timing seams are verified, but the exact video-artifact contract and whether subtitle timing should change remain unresolved. [VERIFIED: codebase grep]
- Pitfalls: HIGH - the main failure modes are directly visible in current code paths and locked phase constraints. [VERIFIED: codebase grep]

**Research date:** 2026-04-13  
**Valid until:** 2026-05-13 for repo-specific seams; re-check npm/tool versions sooner if planning slips. [VERIFIED: npm registry] [VERIFIED: local environment probe]
