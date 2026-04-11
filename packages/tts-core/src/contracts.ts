export const OPENAI_NARRATION_MODELS = [
  "gpt-4o-mini-tts",
  "tts-1",
  "tts-1-hd",
] as const;

export const DEFAULT_OPENAI_NARRATION_MODEL = "gpt-4o-mini-tts";

export type NarrationProviderName = "openai";

export type NarrationRequest = {
  provider: NarrationProviderName;
  model: string;
  voice: string;
  format: string;
  sampleRate: number;
  instructions: string;
  text: string;
};

export type NarrationRequestInput = NarrationRequest;

export type NarrationSynthesisOutput =
  | {
      kind: "bytes";
      bytes: Uint8Array;
    }
  | {
      kind: "file";
      path: string;
    };

export type NarrationSynthesisMetadata = Pick<
  NarrationRequest,
  "provider" | "model" | "voice" | "format" | "sampleRate"
>;

export type NarrationSynthesisResult = {
  request: NarrationRequest;
  output: NarrationSynthesisOutput;
  metadata: NarrationSynthesisMetadata;
};

export interface NarrationProvider {
  synthesize(request: NarrationRequest): Promise<NarrationSynthesisResult>;
}

export function normalizeNarrationText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function createNarrationRequest(input: NarrationRequestInput): NarrationRequest {
  if (!Number.isInteger(input.sampleRate) || input.sampleRate <= 0) {
    throw new Error("Narration sampleRate must be a positive integer.");
  }

  return {
    ...input,
    text: normalizeNarrationText(input.text),
  };
}
