import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { writeGenerationOutput } from "./write-generation-output.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("writeGenerationOutput", () => {
  test("writes the chosen final video and chapters.json into the prepared output directory", async () => {
    const fixture = await makeFixture();

    const result = await writeGenerationOutput({
      tourId: "billing-overview",
      tourTitle: "Billing overview",
      chapters: [
        { title: "Billing", startMs: 0 },
        { title: "Invoices", startMs: 1400 },
      ],
      videos: {
        mp4: {
          format: "mp4",
          fileName: "video.mp4",
          path: fixture.sourceMp4Path,
        },
        webm: {
          format: "webm",
          fileName: "video.webm",
          path: fixture.sourceWebmPath,
        },
      },
      recordedNarrations: [
        {
          audioPath: "/tmp/cache/billing.mp3",
          cacheKey: "billing",
          chapterTitle: "Billing",
          durationMs: 1_200,
          endMs: 1_200,
          startMs: 0,
          text: "Open the billing workspace.",
        },
        {
          audioPath: "/tmp/cache/invoices.mp3",
          cacheKey: "invoices",
          chapterTitle: "Invoices",
          durationMs: 800,
          endMs: 2_000,
          startMs: 1_200,
          text: "Explain the invoice table.",
        },
      ],
      outputDir: fixture.outputDir,
    });

    expect(result).toEqual({
      captionsSrtPath: path.join(fixture.outputDir, "captions.srt"),
      captionsVttPath: path.join(fixture.outputDir, "captions.vtt"),
      chaptersPath: path.join(fixture.outputDir, "chapters.json"),
      outputDir: fixture.outputDir,
      videoPath: path.join(fixture.outputDir, "video.mp4"),
    });
    expect(await readFile(result.videoPath, "utf8")).toBe("mp4 bytes");
    expect(await readFile(path.join(fixture.outputDir, "video.webm"), "utf8")).toBe("webm bytes");
    expect(await readFile(result.captionsSrtPath, "utf8")).toContain("Open the billing workspace.");
    expect(await readFile(result.captionsVttPath, "utf8")).toContain("Explain the invoice table.");
    expect(JSON.parse(await readFile(result.chaptersPath, "utf8"))).toEqual([
      { title: "Billing", startMs: 0 },
      { title: "Invoices", startMs: 1400 },
    ]);
  });

  test("writes only the baseline phase 3 artifacts", async () => {
    const fixture = await makeFixture();

    await writeGenerationOutput({
      tourId: "billing-overview",
      tourTitle: "Billing overview",
      chapters: [{ title: "Billing", startMs: 0 }],
      videos: {
        mp4: {
          format: "mp4",
          fileName: "video.mp4",
          path: fixture.sourceMp4Path,
        },
      },
      recordedNarrations: [],
      outputDir: fixture.outputDir,
    });

    expect((await readdir(fixture.outputDir)).sort()).toEqual([
      "captions.srt",
      "captions.vtt",
      "chapters.json",
      "video.mp4",
    ]);
    expect((await readdir(fixture.outputDir)).includes("manifest.json")).toBe(false);
    expect((await readdir(fixture.outputDir)).includes("poster.jpg")).toBe(false);
    expect((await readdir(fixture.outputDir)).includes("audio")).toBe(false);
  });

  test("removes the stale alternate video artifact on rerun", async () => {
    const fixture = await makeFixture();
    await writeFile(path.join(fixture.outputDir, "video.webm"), "stale webm bytes");

    await writeGenerationOutput({
      tourId: "billing-overview",
      tourTitle: "Billing overview",
      chapters: [{ title: "Billing", startMs: 100 }],
      videos: {
        mp4: {
          format: "mp4",
          fileName: "video.mp4",
          path: fixture.sourceMp4Path,
        },
      },
      recordedNarrations: [],
      outputDir: fixture.outputDir,
    });

    expect((await readdir(fixture.outputDir)).sort()).toEqual([
      "captions.srt",
      "captions.vtt",
      "chapters.json",
      "video.mp4",
    ]);
  });
});

async function makeFixture(): Promise<{
  outputDir: string;
  sourceMp4Path: string;
  sourceWebmPath: string;
}> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-write-output-"));
  tempRoots.push(tempRoot);

  const outputDir = path.join(tempRoot, ".demohunter", "billing-overview");
  const sourceDir = path.join(tempRoot, "recording");
  await mkdir(outputDir, { recursive: true });
  await mkdir(sourceDir, { recursive: true });

  const sourceMp4Path = path.join(sourceDir, "video.mp4");
  const sourceWebmPath = path.join(sourceDir, "video.webm");
  await writeFile(sourceMp4Path, "mp4 bytes");
  await writeFile(sourceWebmPath, "webm bytes");

  return { outputDir, sourceMp4Path, sourceWebmPath };
}
