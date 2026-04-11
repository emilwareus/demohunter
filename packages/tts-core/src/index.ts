export {
  DEFAULT_OPENAI_NARRATION_MODEL,
  OPENAI_NARRATION_MODELS,
  createNarrationRequest,
  normalizeNarrationText,
} from "./contracts.js";
export {
  NARRATION_CACHE_SCHEMA_VERSION,
  createNarrationCacheIdentity,
  createNarrationCacheKey,
} from "./cache/cache-key.js";
export type {
  NarrationProvider,
  NarrationProviderName,
  NarrationRequest,
  NarrationRequestInput,
  NarrationSynthesisMetadata,
  NarrationSynthesisOutput,
  NarrationSynthesisResult,
} from "./contracts.js";
export type {
  NarrationCacheIdentity,
  NarrationCacheKeyOptions,
} from "./cache/cache-key.js";
