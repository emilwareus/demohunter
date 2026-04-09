import { describe, expect, test } from "bun:test";

import {
  DEFAULT_DEMOHUNTER_CONFIG,
  DEFAULT_RECORD_CONFIG,
  DEFAULT_TTS_CONFIG,
  defineConfig,
} from "./config.js";
import { defineTour } from "./tour.js";
import * as sdk from "./index.js";

describe("defineConfig", () => {
  test("returns the authored config object unchanged", () => {
    const authored = {
      baseURL: "http://localhost:3000",
    };

    const config = defineConfig(authored);

    expect(config).toBe(authored);
    expect(config).toEqual({
      baseURL: "http://localhost:3000",
    });
    expect("outputDir" in config).toBe(false);
  });
});

describe("defineTour", () => {
  test("returns a typed tour object with id, title, and run", async () => {
    const run = async () => {};
    const authored = defineTour({
      id: "sample-smoke",
      title: "DemoHunter starter smoke test",
      run,
    });

    expect(authored.id).toBe("sample-smoke");
    expect(authored.title).toBe("DemoHunter starter smoke test");
    expect(authored.run).toBe(run);
    await expect(authored.run({
      page: {},
      chapter: {},
      step: {},
      narrate: async () => {},
    })).resolves.toBeUndefined();
  });
});

describe("sdk entrypoint", () => {
  test("re-exports config helpers, tour helpers, and defaults", () => {
    expect(sdk.defineConfig).toBe(defineConfig);
    expect(sdk.defineTour).toBe(defineTour);
    expect(sdk.DEFAULT_DEMOHUNTER_CONFIG).toBe(DEFAULT_DEMOHUNTER_CONFIG);
    expect(sdk.DEFAULT_RECORD_CONFIG).toBe(DEFAULT_RECORD_CONFIG);
    expect(sdk.DEFAULT_TTS_CONFIG).toBe(DEFAULT_TTS_CONFIG);
  });
});
