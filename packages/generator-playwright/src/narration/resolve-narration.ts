import {
  createNarrationRequest,
  resolveNarrationFromCache,
  type NarrationProvider,
} from "@demohunter/tts-core";
import { createOpenAINarrationProvider } from "@demohunter/tts-openai";

import type { NarrationRuntimeEvent, NarrationSegment } from "../execute/generator-types.js";
import type { SmokeGenerateInput } from "../smoke-generate.js";

const DEFAULT_NARRATION_SAMPLE_RATE = 24_000;

export type ResolveNarrationSegmentInput = {
  event: NarrationRuntimeEvent;
  loadedConfig: SmokeGenerateInput["loadedConfig"];
};

type ResolveNarrationSegmentDependencies = {
  createProvider: (
    loadedConfig: SmokeGenerateInput["loadedConfig"],
  ) => NarrationProvider;
  resolveNarrationFromCache: typeof resolveNarrationFromCache;
};

const defaultDependencies: ResolveNarrationSegmentDependencies = {
  createProvider: (loadedConfig) => {
    switch (loadedConfig.config.tts.provider) {
      case "openai":
        return createOpenAINarrationProvider();
      default:
        throw new Error(`Unsupported narration provider: ${loadedConfig.config.tts.provider}`);
    }
  },
  resolveNarrationFromCache,
};

export async function resolveNarrationSegment(
  input: ResolveNarrationSegmentInput,
  dependencies: Partial<ResolveNarrationSegmentDependencies> = {},
): Promise<NarrationSegment> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const { config } = input.loadedConfig;
  const request = createNarrationRequest({
    provider: config.tts.provider,
    model: config.tts.model,
    voice: input.event.voice ?? config.tts.voice,
    format: config.tts.format,
    sampleRate: DEFAULT_NARRATION_SAMPLE_RATE,
    instructions: input.event.instructions ?? config.tts.instructions,
    text: input.event.text,
  });

  try {
    const { entry } = await resolvedDependencies.resolveNarrationFromCache({
      cacheDir: config.cacheDir,
      provider: resolvedDependencies.createProvider(input.loadedConfig),
      request,
    });

    return {
      audioPath: entry.audioPath,
      cacheKey: entry.key,
      chapterTitle: input.event.chapterTitle,
      durationMs: entry.durationMs,
      text: request.text,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      throw new Error(
        `Unable to resolve narration segment ${JSON.stringify(request.text)} because ${error.message}`,
        { cause: error },
      );
    }

    throw error;
  }
}
