import { describe, expect, mock, test } from "bun:test";
import path from "node:path";

import { DEFAULT_DEMOHUNTER_CONFIG, DEFAULT_RECORD_CONFIG, DEFAULT_TTS_CONFIG } from "../../../sdk/src/index.js";
import { cacheCommand } from "./cache.js";

describe("cacheCommand", () => {
  test("lists cache entries using the configured cache directory", async () => {
    const log = mock(() => {});
    const listNarrationCacheEntries = mock(async () => [
      {
        key: "cache-key",
        status: "ready",
      },
    ]);

    await cacheCommand("/tmp/demo", { action: "list" }, {
      clearNarrationCache: async () => {
        throw new Error("clear should not be called");
      },
      listNarrationCacheEntries,
      loadConfig: async () => makeLoadedConfig("/tmp/demo"),
      log,
      pruneNarrationCache: async () => {
        throw new Error("prune should not be called");
      },
    });

    expect(listNarrationCacheEntries).toHaveBeenCalledWith({
      cacheDir: path.join("/tmp/demo", ".demohunter/cache"),
    });
    expect(log).toHaveBeenCalledWith(
      JSON.stringify(
        {
          cacheDir: path.join("/tmp/demo", ".demohunter/cache"),
          entries: [{ key: "cache-key", status: "ready" }],
        },
        null,
        2,
      ),
    );
  });

  test("prunes cache entries using the shared maintenance helpers", async () => {
    const log = mock(() => {});
    const pruneNarrationCache = mock(async () => ({
      kept: [{ key: "healthy-entry" }],
      removed: [{ path: "/tmp/demo/.demohunter/cache/broken.json", reason: "Metadata file is not valid JSON." }],
    }));

    await cacheCommand("/tmp/demo", { action: "prune" }, {
      clearNarrationCache: async () => {
        throw new Error("clear should not be called");
      },
      listNarrationCacheEntries: async () => {
        throw new Error("list should not be called");
      },
      loadConfig: async () => makeLoadedConfig("/tmp/demo"),
      log,
      pruneNarrationCache,
    });

    expect(pruneNarrationCache).toHaveBeenCalledWith({
      cacheDir: path.join("/tmp/demo", ".demohunter/cache"),
    });
    expect(log).toHaveBeenCalledWith(
      JSON.stringify(
        {
          cacheDir: path.join("/tmp/demo", ".demohunter/cache"),
          kept: [{ key: "healthy-entry" }],
          removed: [{ path: "/tmp/demo/.demohunter/cache/broken.json", reason: "Metadata file is not valid JSON." }],
        },
        null,
        2,
      ),
    );
  });

  test("clears the cache directory and reports the local result", async () => {
    const clearNarrationCache = mock(async () => {});
    const log = mock(() => {});

    await cacheCommand("/tmp/demo", { action: "clear" }, {
      clearNarrationCache,
      listNarrationCacheEntries: async () => {
        throw new Error("list should not be called");
      },
      loadConfig: async () => makeLoadedConfig("/tmp/demo"),
      log,
      pruneNarrationCache: async () => {
        throw new Error("prune should not be called");
      },
    });

    expect(clearNarrationCache).toHaveBeenCalledWith({
      cacheDir: path.join("/tmp/demo", ".demohunter/cache"),
    });
    expect(log).toHaveBeenCalledWith(
      JSON.stringify(
        {
          cacheDir: path.join("/tmp/demo", ".demohunter/cache"),
          cleared: true,
        },
        null,
        2,
      ),
    );
  });
});

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
