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
      chapters: [
        { title: "Billing", startMs: 0 },
        { title: "Invoices", startMs: 1400 },
      ],
      finalVideo: {
        format: "webm",
        fileName: "video.webm",
        path: fixture.sourceVideoPath,
      },
      outputDir: fixture.outputDir,
    });

    expect(result).toEqual({
      chaptersPath: path.join(fixture.outputDir, "chapters.json"),
      outputDir: fixture.outputDir,
      videoPath: path.join(fixture.outputDir, "video.webm"),
    });
    expect(await readFile(result.videoPath, "utf8")).toBe("webm bytes");
    expect(JSON.parse(await readFile(result.chaptersPath, "utf8"))).toEqual([
      { title: "Billing", startMs: 0 },
      { title: "Invoices", startMs: 1400 },
    ]);
  });

  test("writes only the baseline phase 3 artifacts", async () => {
    const fixture = await makeFixture();

    await writeGenerationOutput({
      chapters: [{ title: "Billing", startMs: 0 }],
      finalVideo: {
        format: "mp4",
        fileName: "video.mp4",
        path: fixture.sourceVideoPath,
      },
      outputDir: fixture.outputDir,
    });

    expect((await readdir(fixture.outputDir)).sort()).toEqual(["chapters.json", "video.mp4"]);
    expect((await readdir(fixture.outputDir)).includes("manifest.json")).toBe(false);
    expect((await readdir(fixture.outputDir)).includes("captions.srt")).toBe(false);
    expect((await readdir(fixture.outputDir)).includes("captions.vtt")).toBe(false);
    expect((await readdir(fixture.outputDir)).includes("poster.jpg")).toBe(false);
    expect((await readdir(fixture.outputDir)).includes("audio")).toBe(false);
  });

  test("removes the stale alternate video artifact on rerun", async () => {
    const fixture = await makeFixture();
    await writeFile(path.join(fixture.outputDir, "video.webm"), "stale webm bytes");

    await writeGenerationOutput({
      chapters: [{ title: "Billing", startMs: 100 }],
      finalVideo: {
        format: "mp4",
        fileName: "video.mp4",
        path: fixture.sourceVideoPath,
      },
      outputDir: fixture.outputDir,
    });

    expect((await readdir(fixture.outputDir)).sort()).toEqual(["chapters.json", "video.mp4"]);
  });
});

async function makeFixture(): Promise<{ outputDir: string; sourceVideoPath: string }> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-write-output-"));
  tempRoots.push(tempRoot);

  const outputDir = path.join(tempRoot, ".demohunter", "billing-overview");
  const sourceDir = path.join(tempRoot, "recording");
  await mkdir(outputDir, { recursive: true });
  await mkdir(sourceDir, { recursive: true });

  const sourceVideoPath = path.join(sourceDir, "video.webm");
  await writeFile(sourceVideoPath, "webm bytes");

  return { outputDir, sourceVideoPath };
}
