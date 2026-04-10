import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { muxVideo } from "./mux-video.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("muxVideo", () => {
  test("converts a temporary screencast into a final mp4 via the injected ffmpeg command", async () => {
    const fixture = await makeFixture();
    const commands: Array<{ command: string; args: string[] }> = [];

    const result = await muxVideo(
      {
        outputDir: fixture.outputDir,
        recordFormat: "mp4",
        tempScreencastPath: fixture.tempScreencastPath,
      },
      {
        ffmpegCommand: "/custom/bin/ffmpeg",
        runCommand: async (command, args) => {
          commands.push({ command, args });
          const outputPath = args[args.length - 1];
          await writeFile(outputPath, "mp4 output");
        },
      },
    );

    expect(result).toEqual({
      format: "mp4",
      fileName: "video.mp4",
      path: path.join(fixture.outputDir, "video.mp4"),
    });
    expect(commands).toHaveLength(1);
    expect(commands[0]).toEqual({
      command: "/custom/bin/ffmpeg",
      args: [
        "-y",
        "-i",
        fixture.tempScreencastPath,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        path.join(fixture.outputDir, "video.mp4"),
      ],
    });
    expect(await readFile(result.path, "utf8")).toBe("mp4 output");
    expect(await readdir(fixture.outputDir)).toEqual(["video.mp4"]);
  });

  test("emits only video.webm when the resolved record format is webm", async () => {
    const fixture = await makeFixture();
    const commands: Array<{ command: string; args: string[] }> = [];

    const result = await muxVideo(
      {
        outputDir: fixture.outputDir,
        recordFormat: "webm",
        tempScreencastPath: fixture.tempScreencastPath,
      },
      {
        runCommand: async (command, args) => {
          commands.push({ command, args });
        },
      },
    );

    expect(result).toEqual({
      format: "webm",
      fileName: "video.webm",
      path: path.join(fixture.outputDir, "video.webm"),
    });
    expect(commands).toHaveLength(0);
    expect(await readFile(result.path, "utf8")).toBe("temporary webm");
    expect(await readdir(fixture.outputDir)).toEqual(["video.webm"]);
  });
});

async function makeFixture(): Promise<{ outputDir: string; tempScreencastPath: string }> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-mux-video-"));
  tempRoots.push(tempRoot);

  const outputDir = path.join(tempRoot, "output");
  await mkdir(outputDir, { recursive: true });

  const tempScreencastPath = path.join(tempRoot, "temp-video.webm");
  await writeFile(tempScreencastPath, "temporary webm");

  return { outputDir, tempScreencastPath };
}
