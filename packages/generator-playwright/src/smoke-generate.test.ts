import { afterEach, describe, expect, mock, test } from "bun:test";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { smokeGenerate } from "./smoke-generate.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("smokeGenerate", () => {
  test("writes the smoke artifact and passes the runtime helpers to the tour", async () => {
    const cwd = await makeTempRoot();
    const page = { goto: mock(async () => {}) };
    const newPage = mock(async () => page);
    const closeContext = mock(async () => {});
    const closeBrowser = mock(async () => {});
    const newContext = mock(async () => ({
      close: closeContext,
      newPage,
    }));
    const launch = mock(async () => ({
      close: closeBrowser,
      newContext,
    }));
    const run = mock(async ({ chapter, step, narrate }) => {
      await chapter();
      await step("demo", async () => {});
      await narrate("ignored");
    });

    const result = await smokeGenerate(
      {
        loadedConfig: {
          config: {
            baseURL: "http://localhost:3000",
            outputDir: path.join(cwd, ".demohunter"),
            cacheDir: path.join(cwd, ".demohunter/cache"),
            browser: "chromium",
            viewport: { width: 1280, height: 720 },
            holdPaddingMs: 300,
            record: { showActions: true, showChapters: true },
            tts: {
              provider: "openai",
              model: "gpt-4o-mini-tts",
              voice: "marin",
              format: "mp3",
              instructions: "Speak clearly.",
            },
          },
          configPath: path.join(cwd, "demohunter.config.ts"),
          projectRoot: cwd,
        },
        tourFile: {
          path: path.join(cwd, "demos/sample.tour.ts"),
          tour: {
            id: "sample-smoke",
            title: "Sample demo",
            run,
          },
        },
      },
      {
        now: () => new Date("2026-04-10T00:00:00.000Z"),
        playwright: {
          chromium: { launch },
          firefox: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
          webkit: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
        },
      },
    );

    expect(launch).toHaveBeenCalledTimes(1);
    expect(newContext).toHaveBeenCalledWith({
      viewport: { width: 1280, height: 720 },
    });
    expect(page.goto).toHaveBeenCalledWith("http://localhost:3000/");
    expect(run).toHaveBeenCalledTimes(1);
    expect(closeContext).toHaveBeenCalledTimes(1);
    expect(closeBrowser).toHaveBeenCalledTimes(1);

    expect(result.outputPath).toBe(path.join(cwd, ".demohunter/sample-smoke/smoke-run.json"));

    await access(result.outputPath);
    await expect(access(path.join(cwd, ".demohunter/sample-smoke/video.mp4"))).rejects.toThrow();
    await expect(access(path.join(cwd, ".demohunter/sample-smoke/manifest.json"))).rejects.toThrow();

    const artifact = JSON.parse(await readFile(result.outputPath, "utf8"));
    expect(artifact).toEqual({
      status: "ok",
      tourId: "sample-smoke",
      title: "Sample demo",
      baseURL: "http://localhost:3000",
      browser: "chromium",
      viewport: { width: 1280, height: 720 },
      generatedAt: "2026-04-10T00:00:00.000Z",
    });
  });
});

async function makeTempRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-smoke-generate-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}
