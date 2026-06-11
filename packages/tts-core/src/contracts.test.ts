import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  DEFAULT_ELEVENLABS_NARRATION_MODEL,
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
      language: " sv ",
      providerOptions: {
        voiceSettings: {
          stability: 0.4,
        },
      },
      text: "  Cafe\u0301 launch \r\n\t now  ",
    });

    assert.deepEqual(request, {
      provider: "openai",
      model: "tts-1",
      voice: "alloy",
      format: "wav",
      sampleRate: 24_000,
      instructions: "Keep it brisk.",
      language: "sv",
      providerOptions: {
        voiceSettings: {
          stability: 0.4,
        },
      },
      text: "Café launch\nnow",
    });
  });

  test("normalizes blank narration language to an absent option", () => {
    const request = createNarrationRequest({
      provider: "openai",
      model: DEFAULT_OPENAI_NARRATION_MODEL,
      voice: "marin",
      format: "mp3",
      sampleRate: 24_000,
      instructions: "Speak clearly, calm, concise, product-demo style.",
      language: "   ",
      text: "Narrate the billing dashboard.",
    });

    assert.equal("language" in request, false);
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

    assert.deepEqual(synthesized.output, {
      kind: "bytes",
      bytes,
    });
    assert.deepEqual(persisted.output, {
      kind: "file",
      path: "/tmp/narration.mp3",
    });
  });

  test("normalizes text deterministically without environment-dependent behavior", () => {
    process.env.OPENAI_API_KEY = "ignored-for-normalization";

    const input = "  Cafe\u0301 \r\n\r\n  launch\t today  ";
    const first = normalizeNarrationText(input);
    const second = normalizeNarrationText(input);

    assert.equal(first, "Café\n\nlaunch today");
    assert.equal(second, first);
  });

  test("pins the supported OpenAI speech models with gpt-4o-mini-tts as the default", () => {
    assert.equal(DEFAULT_OPENAI_NARRATION_MODEL, "gpt-4o-mini-tts");
    assert.equal(DEFAULT_ELEVENLABS_NARRATION_MODEL, "eleven_multilingual_v2");
    assert.deepEqual(OPENAI_NARRATION_MODELS, [
      "gpt-4o-mini-tts",
      "tts-1",
      "tts-1-hd",
    ]);
  });
});
