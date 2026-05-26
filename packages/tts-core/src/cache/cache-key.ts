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
  providerOptions?: Record<string, unknown>;
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
    providerOptions: normalizeProviderOptions(request.providerOptions),
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

function normalizeProviderOptions(
  options: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (options === undefined) {
    return undefined;
  }

  return sortPlainObject(options) as Record<string, unknown>;
}

function sortPlainObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortPlainObject);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortPlainObject(child)]),
  );
}
