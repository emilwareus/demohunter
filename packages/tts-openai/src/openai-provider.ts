import type {
  NarrationProvider,
  NarrationRequest,
  NarrationSynthesisResult,
} from "../../tts-core/dist/contracts.js";

const OPENAI_SPEECH_ENDPOINT = "https://api.openai.com/v1/audio/speech";
const OPENAI_SUPPORTED_NARRATION_MODELS = [
  "gpt-4o-mini-tts",
  "tts-1",
  "tts-1-hd",
] as const;

export type OpenAINarrationProviderOptions = {
  fetch?: typeof globalThis.fetch;
};

export function createOpenAINarrationProvider(
  options: OpenAINarrationProviderOptions = {},
): NarrationProvider {
  const fetchImplementation = options.fetch ?? globalThis.fetch;

  return {
    async synthesize(request: NarrationRequest): Promise<NarrationSynthesisResult> {
      if (fetchImplementation === undefined) {
        throw new Error("OpenAI narration requires a fetch implementation in the current runtime.");
      }

      assertSupportedModel(request.model);

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is required to synthesize narration with OpenAI.");
      }

      const response = await fetchImplementation(OPENAI_SPEECH_ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          voice: request.voice,
          instructions: request.instructions,
          response_format: request.format,
          input: request.text,
        }),
      });

      if (!response.ok) {
        const detail = await readFailureDetail(response);
        const statusText = response.statusText ? ` ${response.statusText}` : "";

        throw new Error(
          detail
            ? `OpenAI speech synthesis failed (${response.status}${statusText}): ${detail}`
            : `OpenAI speech synthesis failed (${response.status}${statusText}).`,
        );
      }

      return {
        request,
        output: {
          kind: "bytes",
          bytes: new Uint8Array(await response.arrayBuffer()),
        },
        metadata: {
          provider: request.provider,
          model: request.model,
          voice: request.voice,
          format: request.format,
          sampleRate: request.sampleRate,
        },
      };
    },
  };
}

async function readFailureDetail(response: Response): Promise<string> {
  try {
    return (await response.text()).trim();
  } catch {
    return "";
  }
}

function assertSupportedModel(
  model: string,
): asserts model is (typeof OPENAI_SUPPORTED_NARRATION_MODELS)[number] {
  if (OPENAI_SUPPORTED_NARRATION_MODELS.includes(model as (typeof OPENAI_SUPPORTED_NARRATION_MODELS)[number])) {
    return;
  }

  throw new Error(`Unsupported OpenAI narration model: ${model}`);
}
