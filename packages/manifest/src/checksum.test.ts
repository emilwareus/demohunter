import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createPortableArtifactDescriptor,
  createPortableFileChecksum,
  PORTABLE_CHECKSUM_ALGORITHM,
} from "./checksum.js";
import { parsePortableOutputManifest, PORTABLE_OUTPUT_MANIFEST_VERSION } from "./schema.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("createPortableFileChecksum", () => {
  test("hashes final bytes with SHA-256 metadata", async () => {
    const tempRoot = await makeTempRoot();
    const filePath = path.join(tempRoot, "video.mp4");
    await writeFile(filePath, "portable video bytes");

    const checksum = await createPortableFileChecksum(filePath);

    expect(checksum.algorithm).toBe(PORTABLE_CHECKSUM_ALGORITHM);
    expect(checksum.byteSize).toBe(Buffer.byteLength("portable video bytes"));
    expect(checksum.hex).toHaveLength(64);
  });
});

describe("createPortableArtifactDescriptor", () => {
  test("returns a portable descriptor that can flow through the manifest schema", async () => {
    const tempRoot = await makeTempRoot();
    const outputDir = path.join(tempRoot, ".demohunter", "billing-overview");
    const audioDir = path.join(outputDir, "audio");
    const audioPath = path.join(audioDir, "billing.mp3");

    await mkdir(audioDir, { recursive: true });
    await writeFile(audioPath, "audio bytes");

    const descriptor = await createPortableArtifactDescriptor({
      outputDir,
      filePath: audioPath,
      mediaType: "audio/mpeg",
    });

    expect(descriptor).toEqual({
      path: "audio/billing.mp3",
      mediaType: "audio/mpeg",
      checksum: {
        algorithm: PORTABLE_CHECKSUM_ALGORITHM,
        byteSize: Buffer.byteLength("audio bytes"),
        hex: expect.any(String),
      },
    });

    const manifest = parsePortableOutputManifest({
      manifestVersion: PORTABLE_OUTPUT_MANIFEST_VERSION,
      tour: {
        id: "billing-overview",
        title: "Billing overview",
      },
      playback: {
        durationMs: 1_200,
      },
      artifacts: {
        videos: {
          mp4: await createPortableArtifactDescriptor({
            outputDir,
            filePath: await makePortableFile(outputDir, "video.mp4", "video bytes"),
            mediaType: "video/mp4",
          }),
        },
        poster: {
          ...(await createPortableArtifactDescriptor({
            outputDir,
            filePath: await makePortableFile(outputDir, "poster.jpg", "poster bytes"),
            mediaType: "image/jpeg",
          })),
          captureTimestampMs: 1_000,
        },
        captions: {
          srt: await createPortableArtifactDescriptor({
            outputDir,
            filePath: await makePortableFile(outputDir, "captions.srt", "srt bytes"),
            mediaType: "text/plain",
          }),
          vtt: await createPortableArtifactDescriptor({
            outputDir,
            filePath: await makePortableFile(outputDir, "captions.vtt", "vtt bytes"),
            mediaType: "text/vtt",
          }),
        },
        chapters: await createPortableArtifactDescriptor({
          outputDir,
          filePath: await makePortableFile(outputDir, "chapters.json", JSON.stringify([])),
          mediaType: "application/json",
        }),
        audio: [
          {
            ...descriptor,
            cacheKey: "billing",
            durationMs: 1_200,
          },
        ],
      },
      timeline: {
        chapters: [{ title: "Billing", startMs: 0 }],
        narrations: [
          {
            cacheKey: "billing",
            text: "Open the billing workspace.",
            chapterTitle: "Billing",
            startMs: 0,
            endMs: 1_200,
            durationMs: 1_200,
          },
        ],
      },
    });

    expect(manifest.artifacts.audio[0].path).toBe("audio/billing.mp3");
    expect(manifest.artifacts.audio[0].path.startsWith("/")).toBe(false);
  });
});

async function makeTempRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-portable-checksum-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function makePortableFile(outputDir: string, fileName: string, contents: string): Promise<string> {
  const filePath = path.join(outputDir, fileName);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
  expect(await readFile(filePath, "utf8")).toBe(contents);
  return filePath;
}
