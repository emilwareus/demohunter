import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";

import {
  NARRATION_CACHE_SCHEMA_VERSION,
  clearNarrationCache,
  createNarrationCacheKey,
  createNarrationRequest,
  listNarrationCacheEntries,
  pruneNarrationCache,
  type NarrationProvider,
  type NarrationRequest,
} from "../index.js";
import { resolveNarrationFromCache } from "./cache-store.js";

describe("narration cache maintenance", () => {
  test("lists inspectable cache entries from disk metadata and file state", async () => {
    const fixture = await createFixture();

    try {
      const seeded = await seedHealthyEntry(fixture);
      const metadata = JSON.parse(await readFile(seeded.metadataPath, "utf8")) as {
        key: string;
        version: number;
        createdAt: string;
        request: NarrationRequest;
        output: {
          format: string;
          audioPath: string;
          byteSize: number;
          durationMs: number;
          sha256: string;
        };
      };

      metadata.output.durationMs = 4_321;
      await writeFile(seeded.metadataPath, JSON.stringify(metadata, null, 2), "utf8");

      const entries = await listNarrationCacheEntries({
        cacheDir: fixture.cacheDir,
      });

      assert.equal(entries.length, 1);
      assert.equal(entries[0]?.status, "ready");
      assert.equal(entries[0]?.durationMs, 4_321);
      assert.equal(entries[0]?.audioPath, seeded.audioPath);
      assert.equal(entries[0]?.metadataPath, seeded.metadataPath);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  test("prunes only invalid, obsolete, or clearly broken cache artifacts by default", async () => {
    const fixture = await createFixture();

    try {
      const healthy = await seedHealthyEntry(fixture);
      const brokenMetadataPath = join(fixture.cacheDir, "broken.json");
      const brokenAudioPath = join(fixture.cacheDir, "broken.mp3");
      const orphanAudioPath = join(fixture.cacheDir, "orphan.mp3");
      const obsolete = await writeObsoleteEntry(fixture);
      const generatedOutputPath = join(fixture.tempRoot, ".demohunter", "billing-overview", "video.mp4");

      await mkdir(dirname(generatedOutputPath), { recursive: true });
      await writeFile(brokenMetadataPath, "{broken json", "utf8");
      await writeFile(brokenAudioPath, new Uint8Array([7, 7, 7]));
      await writeFile(orphanAudioPath, new Uint8Array([8, 8, 8]));
      await writeFile(generatedOutputPath, new Uint8Array([9, 9, 9]));

      const pruned = await pruneNarrationCache({
        cacheDir: fixture.cacheDir,
      });

      assert.equal(pruned.kept.length, 1);
      assert.equal(pruned.kept[0]?.key, healthy.key);

      const removedPaths = pruned.removed.map((entry) => entry.path).sort();

      assert.deepEqual(removedPaths, [
        brokenAudioPath,
        brokenMetadataPath,
        obsolete.audioPath,
        obsolete.metadataPath,
        orphanAudioPath,
      ].sort());

      await assertExists(healthy.audioPath);
      await assertExists(healthy.metadataPath);
      await assertExists(generatedOutputPath);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  test("clears only the local cache root without touching generated demo output", async () => {
    const fixture = await createFixture();

    try {
      await seedHealthyEntry(fixture);

      const generatedOutputPath = join(fixture.tempRoot, ".demohunter", "billing-overview", "video.mp4");

      await mkdir(dirname(generatedOutputPath), { recursive: true });
      await writeFile(generatedOutputPath, new Uint8Array([4, 5, 6]));

      await clearNarrationCache({
        cacheDir: fixture.cacheDir,
      });

      await assertMissing(fixture.cacheDir);
      await assertExists(generatedOutputPath);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});

async function createFixture(): Promise<{
  tempRoot: string;
  cacheDir: string;
  request: NarrationRequest;
}> {
  const tempRoot = await mkdtemp(join(tmpdir(), "demohunter-cache-maintenance-"));

  return {
    tempRoot,
    cacheDir: join(tempRoot, ".demohunter", "cache"),
    request: createNarrationRequest({
      provider: "openai",
      model: "gpt-4o-mini-tts",
      voice: "marin",
      format: "mp3",
      sampleRate: 24_000,
      instructions: "Speak clearly, calm, concise, product-demo style.",
      text: "Narrate the billing dashboard.",
    }),
  };
}

async function seedHealthyEntry(fixture: {
  cacheDir: string;
  request: NarrationRequest;
}): Promise<{
  key: string;
  audioPath: string;
  metadataPath: string;
}> {
  const provider = createProvider([
    new Uint8Array([1, 2, 3, 4]),
  ]);
  const entry = await resolveNarrationFromCache({
    cacheDir: fixture.cacheDir,
    request: fixture.request,
    provider: provider.provider,
    measureDurationMs: async () => 1_111,
  });

  return {
    key: entry.entry.key,
    audioPath: entry.entry.audioPath,
    metadataPath: entry.entry.metadataPath,
  };
}

async function writeObsoleteEntry(fixture: {
  cacheDir: string;
  request: NarrationRequest;
}): Promise<{
  audioPath: string;
  metadataPath: string;
}> {
  const version = NARRATION_CACHE_SCHEMA_VERSION - 1;
  const key = createNarrationCacheKey(fixture.request, {
    version,
  });
  const audioBytes = new Uint8Array([5, 5, 5, 5]);
  const audioPath = join(fixture.cacheDir, `${key}.${fixture.request.format}`);
  const metadataPath = join(fixture.cacheDir, `${key}.json`);

  await writeFile(audioPath, audioBytes);
  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        key,
        version,
        createdAt: "2026-04-11T09:30:00.000Z",
        request: fixture.request,
        output: {
          format: fixture.request.format,
          audioPath: `${key}.${fixture.request.format}`,
          byteSize: audioBytes.byteLength,
          durationMs: 2_222,
          sha256: createHash("sha256").update(audioBytes).digest("hex"),
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    audioPath,
    metadataPath,
  };
}

function createProvider(outputs: Uint8Array[]): {
  provider: NarrationProvider;
} {
  let callCount = 0;

  return {
    provider: {
      async synthesize(request) {
        const bytes = outputs[callCount] ?? outputs[outputs.length - 1];

        callCount += 1;

        return {
          request,
          output: {
            kind: "bytes",
            bytes,
          },
          metadata: {
            provider: request.provider,
            model: request.model,
            voice: request.voice,
            format: request.format,
            sampleRate: request.sampleRate,
          },
        };
      },
    },
  };
}

async function assertExists(path: string): Promise<void> {
  await stat(path);
}

async function assertMissing(path: string): Promise<void> {
  await assert.rejects(() => stat(path), (error: unknown) => {
    return (
      typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "ENOENT"
    );
  });
}
