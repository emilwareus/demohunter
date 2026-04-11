import { afterEach, describe, expect, test } from "bun:test";
import { access, mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createNarrationRequest, resolveNarrationFromCache } from "../../packages/tts-core/src/index.js";
import { createOpenAINarrationProvider } from "../../packages/tts-openai/src/index.js";

const tempRoots: string[] = [];
const originalApiKey = process.env.OPENAI_API_KEY;
const shouldRunLive = process.env.DEMOHUNTER_RUN_LIVE_OPENAI_TESTS === "1" && Boolean(process.env.OPENAI_API_KEY);
const liveTest = shouldRunLive ? test : test.skip;

afterEach(async () => {
  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }

  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("openai narration live integration", () => {
  liveTest(
    "synthesizes narration once through the real API and reuses the cached result without OPENAI_API_KEY",
    async () => {
      const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-openai-live-"));
      tempRoots.push(tempRoot);

      const cacheDir = path.join(tempRoot, "cache");
      const request = createNarrationRequest({
        provider: "openai",
        model: "gpt-4o-mini-tts",
        voice: "marin",
        format: "mp3",
        sampleRate: 24_000,
        instructions: "Speak clearly, calm, concise, product-demo style.",
        text: "Narrate the billing workspace in one short sentence.",
      });
      const provider = createOpenAINarrationProvider();

      const first = await resolveNarrationFromCache({
        cacheDir,
        provider,
        request,
      });

      expect(first.source).toBe("provider");
      expect(first.entry.durationMs).toBeGreaterThan(0);
      expect(first.entry.byteSize).toBeGreaterThan(0);
      await access(first.entry.audioPath);
      const firstStat = await stat(first.entry.audioPath);

      delete process.env.OPENAI_API_KEY;

      const second = await resolveNarrationFromCache({
        cacheDir,
        provider,
        request,
      });

      expect(second.source).toBe("cache");
      expect(second.entry.key).toBe(first.entry.key);
      expect(second.entry.audioPath).toBe(first.entry.audioPath);
      expect(second.entry.durationMs).toBe(first.entry.durationMs);
      expect(second.entry.byteSize).toBe(first.entry.byteSize);
      expect((await stat(second.entry.audioPath)).mtimeMs).toBe(firstStat.mtimeMs);
    },
    60_000,
  );
});
