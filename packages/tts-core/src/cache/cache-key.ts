import { createHash } from "node:crypto";

import { normalizeNarrationText, type NarrationRequest } from "../contracts.js";

export const NARRATION_CACHE_SCHEMA_VERSION = 1;

export type NarrationCacheIdentity = {
  provider: string;
  model: string;
  voice: string;
  instructions: string;
  format: string;
  sampleRate: number;
  text: string;
  version: number;
};

export type NarrationCacheKeyOptions = {
  version?: number;
};

export function createNarrationCacheIdentity(
  request: NarrationRequest,
  options: NarrationCacheKeyOptions = {},
): NarrationCacheIdentity {
  return {
    provider: request.provider,
    model: request.model,
    voice: request.voice,
    instructions: request.instructions,
    format: request.format,
    sampleRate: request.sampleRate,
    text: normalizeNarrationText(request.text),
    version: options.version ?? NARRATION_CACHE_SCHEMA_VERSION,
  };
}

export function createNarrationCacheKey(
  request: NarrationRequest,
  options: NarrationCacheKeyOptions = {},
): string {
  return createHash("sha256")
    .update(JSON.stringify(createNarrationCacheIdentity(request, options)))
    .digest("hex");
}
