import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { toPortableRelativePath } from "./paths.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("toPortableRelativePath", () => {
  test("normalizes nested paths to output-root-relative POSIX paths", async () => {
    const tempRoot = await makeTempRoot();
    const outputDir = path.join(tempRoot, ".demohunter", "billing-overview");
    const audioDir = path.join(outputDir, "audio");
    const audioPath = path.join(audioDir, "billing.mp3");

    await mkdir(audioDir, { recursive: true });
    await writeFile(audioPath, "audio");

    expect(toPortableRelativePath(outputDir, audioPath)).toBe("audio/billing.mp3");
  });

  test("rejects empty or escaping paths", async () => {
    const tempRoot = await makeTempRoot();
    const outputDir = path.join(tempRoot, ".demohunter", "billing-overview");
    const outsidePath = path.join(tempRoot, "video.mp4");

    await mkdir(outputDir, { recursive: true });
    await writeFile(outsidePath, "video");

    expect(() => toPortableRelativePath(outputDir, outputDir)).toThrow(
      "Portable artifact path must not be empty.",
    );
    expect(() => toPortableRelativePath(outputDir, outsidePath)).toThrow(
      "Portable artifact path must stay within the output directory.",
    );
  });
});

async function makeTempRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-portable-paths-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}
