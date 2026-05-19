import { describe, expect, mock, test } from "bun:test";
import path from "node:path";

import { DEFAULT_DEMOHUNTER_CONFIG, DEFAULT_RECORD_CONFIG, DEFAULT_TTS_CONFIG } from "../../../sdk/src/index.js";
import { doctorCommand } from "./doctor.js";

describe("doctorCommand", () => {
  test("prints passing checks as JSON", async () => {
    const log = mock(() => {});
    const launch = mock(async () => ({
      close: mock(async () => {}),
    }));

    await doctorCommand("/tmp/project", {
      checkCommand: mock(async () => {}),
      fetch: mock(async () => new Response("ok", { status: 200 })) as never,
      loadConfig: async () => makeLoadedConfig("/tmp/project"),
      log,
      playwright: {
        chromium: { launch } as never,
        firefox: { launch: mock(async () => { throw new Error("unexpected browser"); }) } as never,
        webkit: { launch: mock(async () => { throw new Error("unexpected browser"); }) } as never,
      },
    });

    const parsed = JSON.parse(String(log.mock.calls[0]?.[0])) as {
      ok: boolean;
      checks: Array<{ name: string; status: string }>;
    };

    expect(parsed.ok).toBe(true);
    expect(parsed.checks.map((check) => check.name)).toContain("config");
    expect(parsed.checks.map((check) => check.name)).toContain("ffmpeg");
    expect(parsed.checks.map((check) => check.name)).toContain("ffprobe");
    expect(parsed.checks.map((check) => check.name)).toContain("baseURL");
  });

  test("throws after printing JSON when a required check fails", async () => {
    const log = mock(() => {});

    await expect(
      doctorCommand("/tmp/project", {
        checkCommand: mock(async (command) => {
          if (command === "ffmpeg") {
            throw new Error("missing ffmpeg");
          }
        }),
        fetch: mock(async () => new Response("ok", { status: 200 })) as never,
        loadConfig: async () => makeLoadedConfig("/tmp/project"),
        log,
        playwright: {
          chromium: {
            launch: mock(async () => ({
              close: mock(async () => {}),
            })),
          } as never,
          firefox: { launch: mock(async () => { throw new Error("unexpected browser"); }) } as never,
          webkit: { launch: mock(async () => { throw new Error("unexpected browser"); }) } as never,
        },
      }),
    ).rejects.toThrow("Doctor found failing checks.");

    const parsed = JSON.parse(String(log.mock.calls[0]?.[0])) as {
      ok: boolean;
      checks: Array<{ name: string; status: string; message: string }>;
    };
    const ffmpeg = parsed.checks.find((check) => check.name === "ffmpeg");

    expect(parsed.ok).toBe(false);
    expect(ffmpeg?.status).toBe("fail");
    expect(ffmpeg?.message).toBe("missing ffmpeg");
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
