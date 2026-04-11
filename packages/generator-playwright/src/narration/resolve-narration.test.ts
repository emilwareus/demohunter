import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createNarrationRequest, resolveNarrationFromCache } from "@demohunter/tts-core";

import { resolveNarrationSegment } from "./resolve-narration.js";

const originalApiKey = process.env.OPENAI_API_KEY;
const tempRoots: string[] = [];

afterEach(async () => {
  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }

  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("resolveNarrationSegment", () => {
  test("reuses cached narration without OPENAI_API_KEY when the segment already exists locally", async () => {
    const projectRoot = await makeTempProject();
    const request = createNarrationRequest({
      provider: "openai",
      model: "gpt-4o-mini-tts",
      voice: "marin",
      format: "mp3",
      sampleRate: 24_000,
      instructions: "Speak clearly.",
      text: "Explain the billing dashboard",
    });
    const primed = await resolveNarrationFromCache({
      cacheDir: path.join(projectRoot, ".demohunter", "cache"),
      request,
      provider: {
        async synthesize(input) {
          return {
            request: input,
            output: {
              kind: "bytes",
              bytes: new Uint8Array([1, 2, 3, 4]),
            },
            metadata: {
              provider: input.provider,
              model: input.model,
              voice: input.voice,
              format: input.format,
              sampleRate: input.sampleRate,
            },
          };
        },
      },
      measureDurationMs: async () => 987,
      now: () => new Date("2026-04-11T00:00:00.000Z"),
    });

    delete process.env.OPENAI_API_KEY;

    const segment = await resolveNarrationSegment({
      event: {
        chapterTitle: "Billing",
        kind: "narrate",
        text: "Explain the billing dashboard",
      },
      loadedConfig: createLoadedConfig(projectRoot),
    });

    expect(segment).toEqual({
      audioPath: primed.entry.audioPath,
      cacheKey: primed.entry.key,
      chapterTitle: "Billing",
      durationMs: 987,
      text: "Explain the billing dashboard",
    });
  });

  test("fails clearly when uncached narration requires OPENAI_API_KEY", async () => {
    const projectRoot = await makeTempProject();
    delete process.env.OPENAI_API_KEY;

    await expect(
      resolveNarrationSegment({
        event: {
          chapterTitle: "Billing",
          kind: "narrate",
          text: "Explain the billing dashboard",
        },
        loadedConfig: createLoadedConfig(projectRoot),
      }),
    ).rejects.toThrow(/OPENAI_API_KEY/);
  });
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-resolve-narration-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

function createLoadedConfig(projectRoot: string) {
  return {
    config: {
      baseURL: "http://localhost:3000",
      outputDir: path.join(projectRoot, ".demohunter"),
      cacheDir: path.join(projectRoot, ".demohunter", "cache"),
      browser: "chromium" as const,
      viewport: { width: 1280, height: 720 },
      holdPaddingMs: 300,
      record: { format: "mp4" as const, showActions: true, showChapters: true },
      tts: {
        provider: "openai" as const,
        model: "gpt-4o-mini-tts",
        voice: "marin",
        format: "mp3",
        instructions: "Speak clearly.",
      },
    },
    configPath: path.join(projectRoot, "demohunter.config.ts"),
    projectRoot,
  };
}
