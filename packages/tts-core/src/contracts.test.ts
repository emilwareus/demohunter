import { describe, expect, test } from "bun:test";

import {
  DEFAULT_OPENAI_NARRATION_MODEL,
  OPENAI_NARRATION_MODELS,
  createNarrationRequest,
  normalizeNarrationText,
} from "./index.js";
import type {
  NarrationProvider,
  NarrationRequest,
  NarrationSynthesisResult,
} from "./index.js";

describe("narration contracts", () => {
  test("creates a canonical narration request with normalized text and sample rate identity", () => {
    const request: NarrationRequest = createNarrationRequest({
      provider: "openai",
      model: "tts-1",
      voice: "alloy",
      format: "wav",
      sampleRate: 24_000,
      instructions: "Keep it brisk.",
      text: "  Cafe\u0301 launch \r\n\t now  ",
    });

    expect(request).toEqual({
      provider: "openai",
      model: "tts-1",
      voice: "alloy",
      format: "wav",
      sampleRate: 24_000,
      instructions: "Keep it brisk.",
      text: "Café launch\nnow",
    });
  });

  test("exports provider and synthesis result types that do not require provider-specific branching", async () => {
    const request = createNarrationRequest({
      provider: "openai",
      model: DEFAULT_OPENAI_NARRATION_MODEL,
      voice: "marin",
      format: "mp3",
      sampleRate: 24_000,
      instructions: "Speak clearly, calm, concise, product-demo style.",
      text: "Narrate the billing dashboard.",
    });
    const bytes = new Uint8Array([1, 2, 3]);
    const provider: NarrationProvider = {
      async synthesize(input) {
        const result: NarrationSynthesisResult = {
          request: input,
          output: {
            kind: "bytes",
            bytes,
          },
          metadata: {
            provider: input.provider,
            model: input.model,
            voice: input.voice,
            format: input.format,
            sampleRate: input.sampleRate,
          },
        };

        return result;
      },
    };

    const synthesized = await provider.synthesize(request);
    const persisted: NarrationSynthesisResult = {
      request,
      output: {
        kind: "file",
        path: "/tmp/narration.mp3",
      },
      metadata: {
        provider: request.provider,
        model: request.model,
        voice: request.voice,
        format: request.format,
        sampleRate: request.sampleRate,
      },
    };

    expect(synthesized.output).toEqual({
      kind: "bytes",
      bytes,
    });
    expect(persisted.output).toEqual({
      kind: "file",
      path: "/tmp/narration.mp3",
    });
  });

  test("normalizes text deterministically without environment-dependent behavior", () => {
    process.env.OPENAI_API_KEY = "ignored-for-normalization";

    const input = "  Cafe\u0301 \r\n\r\n  launch\t today  ";
    const first = normalizeNarrationText(input);
    const second = normalizeNarrationText(input);

    expect(first).toBe("Café\n\nlaunch today");
    expect(second).toBe(first);
  });

  test("pins the supported OpenAI speech models with gpt-4o-mini-tts as the default", () => {
    expect(DEFAULT_OPENAI_NARRATION_MODEL).toBe("gpt-4o-mini-tts");
    expect(OPENAI_NARRATION_MODELS).toEqual([
      "gpt-4o-mini-tts",
      "tts-1",
      "tts-1-hd",
    ]);
  });
});
