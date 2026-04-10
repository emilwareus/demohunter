import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { DEFAULT_DEMOHUNTER_CONFIG, DEFAULT_RECORD_CONFIG, DEFAULT_TTS_CONFIG } from "../../../sdk/src/index.js";
import { generateCommand } from "./generate.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("generateCommand", () => {
  test("loads the requested tour file and forwards a valid phase 3 tour to generateTour", async () => {
    const cwd = await makeTempProject();
    const tourPath = path.join(cwd, "demos", "sample.tour.ts");
    const generateTour = mock(async () => ({
      outputDir: path.join(cwd, ".demohunter/sample-smoke"),
      videoPath: path.join(cwd, ".demohunter/sample-smoke/video.mp4"),
    }));
    const log = mock(() => {});

    await generateCommand(cwd, "demos/sample.tour.ts", {
      importModule: (href) => import(href),
      generateTour,
      loadConfig: async () => makeLoadedConfig(cwd),
      log,
    });

    expect(generateTour).toHaveBeenCalledTimes(1);
    expect(generateTour.mock.calls[0]?.[0]).toEqual({
      loadedConfig: makeLoadedConfig(cwd),
      tourFile: {
        path: tourPath,
        tour: {
          id: "sample-smoke",
          setup: expect.any(Function),
          title: "Sample",
          teardown: expect.any(Function),
          run: expect.any(Function),
        },
      },
    });
    expect(log).toHaveBeenCalledWith(path.join(cwd, ".demohunter/sample-smoke/video.mp4"));
  });

  test("throws a clear error for invalid default exports", async () => {
    const cwd = await makeTempProject();

    await expect(
      generateCommand(cwd, "demos/invalid.tour.ts", {
        importModule: (href) => import(href),
        generateTour: async () => ({ outputDir: "", videoPath: "" }),
        loadConfig: async () => makeLoadedConfig(cwd),
        log: () => {},
      }),
    ).rejects.toThrow(
      `Tour file must default export an object with string id/title and a run function: ${path.join(cwd, "demos/invalid.tour.ts")}`,
    );
  });

  test("rejects a non-function setup export with the tour path", async () => {
    const cwd = await makeTempProject();

    await expect(
      generateCommand(cwd, "demos/invalid-setup.tour.ts", {
        importModule: (href) => import(href),
        generateTour: async () => ({ outputDir: "", videoPath: "" }),
        loadConfig: async () => makeLoadedConfig(cwd),
        log: () => {},
      }),
    ).rejects.toThrow(
      `Tour file has invalid setup export; expected a function when provided: ${path.join(cwd, "demos/invalid-setup.tour.ts")}`,
    );
  });

  test("rejects a non-function teardown export with the tour path", async () => {
    const cwd = await makeTempProject();

    await expect(
      generateCommand(cwd, "demos/invalid-teardown.tour.ts", {
        importModule: (href) => import(href),
        generateTour: async () => ({ outputDir: "", videoPath: "" }),
        loadConfig: async () => makeLoadedConfig(cwd),
        log: () => {},
      }),
    ).rejects.toThrow(
      `Tour file has invalid teardown export; expected a function when provided: ${path.join(cwd, "demos/invalid-teardown.tour.ts")}`,
    );
  });
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-generate-command-"));
  tempRoots.push(tempRoot);
  await mkdir(path.join(tempRoot, "demos"), { recursive: true });
  await writeFile(
    path.join(tempRoot, "demos", "sample.tour.ts"),
    'export default { id: "sample-smoke", title: "Sample", async setup() {}, async run() {}, async teardown() {} };\n',
  );
  await writeFile(path.join(tempRoot, "demos", "invalid.tour.ts"), "export default { nope: true };\n");
  await writeFile(
    path.join(tempRoot, "demos", "invalid-setup.tour.ts"),
    'export default { id: "sample-smoke", title: "Sample", setup: true, async run() {} };\n',
  );
  await writeFile(
    path.join(tempRoot, "demos", "invalid-teardown.tour.ts"),
    'export default { id: "sample-smoke", title: "Sample", async run() {}, teardown: \"later\" };\n',
  );
  return tempRoot;
}

function makeLoadedConfig(cwd: string) {
  return {
    projectRoot: cwd,
    configPath: path.join(cwd, "demohunter.config.ts"),
    config: {
      baseURL: "http://localhost:3000",
      outputDir: path.join(cwd, DEFAULT_DEMOHUNTER_CONFIG.outputDir),
      cacheDir: path.join(cwd, DEFAULT_DEMOHUNTER_CONFIG.cacheDir),
      browser: DEFAULT_DEMOHUNTER_CONFIG.browser,
      viewport: DEFAULT_DEMOHUNTER_CONFIG.viewport,
      holdPaddingMs: DEFAULT_DEMOHUNTER_CONFIG.holdPaddingMs,
      record: DEFAULT_RECORD_CONFIG,
      tts: DEFAULT_TTS_CONFIG,
    },
  };
}
