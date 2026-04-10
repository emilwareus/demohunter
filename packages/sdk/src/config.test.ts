import { describe, expect, test } from "bun:test";

import {
  DEFAULT_DEMOHUNTER_CONFIG,
  DEFAULT_RECORD_CONFIG,
  DEFAULT_TTS_CONFIG,
  defineConfig,
} from "./config.js";
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

describe("sdk entrypoint", () => {
  test("re-exports config helpers and defaults", () => {
    expect(sdk.defineConfig).toBe(defineConfig);
    expect(sdk.DEFAULT_DEMOHUNTER_CONFIG).toBe(DEFAULT_DEMOHUNTER_CONFIG);
    expect(sdk.DEFAULT_RECORD_CONFIG).toBe(DEFAULT_RECORD_CONFIG);
    expect(sdk.DEFAULT_TTS_CONFIG).toBe(DEFAULT_TTS_CONFIG);
  });
});
