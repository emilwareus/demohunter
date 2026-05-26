import type {
  NarrationProvider,
  NarrationRequest,
  NarrationSynthesisResult,
} from "@demohunter/tts-core";

const ELEVENLABS_SPEECH_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

export type ElevenLabsVoiceSettings = {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  speed?: number;
};

export type ElevenLabsNarrationProviderOptions = {
  fetch?: typeof globalThis.fetch;
};

export function createElevenLabsNarrationProvider(
  options: ElevenLabsNarrationProviderOptions = {},
): NarrationProvider {
  const fetchImplementation = options.fetch ?? globalThis.fetch;

  return {
    async synthesize(request: NarrationRequest): Promise<NarrationSynthesisResult> {
      if (fetchImplementation === undefined) {
        throw new Error("ElevenLabs narration requires a fetch implementation in the current runtime.");
      }

      if (request.provider !== "elevenlabs") {
        throw new Error(`ElevenLabs narration received unsupported provider: ${request.provider}`);
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;

      if (!apiKey) {
        throw new Error("ELEVENLABS_API_KEY is required to synthesize narration with ElevenLabs.");
      }

      const response = await fetchImplementation(createSpeechUrl(request), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify(createSpeechBody(request)),
      });

      if (!response.ok) {
        const detail = await readFailureDetail(response);
        const statusText = response.statusText ? ` ${response.statusText}` : "";

        throw new Error(
          detail
            ? `ElevenLabs speech synthesis failed (${response.status}${statusText}): ${detail}`
            : `ElevenLabs speech synthesis failed (${response.status}${statusText}).`,
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
          providerOptions: request.providerOptions,
        },
      };
    },
  };
}

function createSpeechUrl(request: NarrationRequest): string {
  const url = new URL(`${ELEVENLABS_SPEECH_ENDPOINT}/${encodeURIComponent(request.voice)}`);
  url.searchParams.set("output_format", request.format);
  return url.href;
}

function createSpeechBody(request: NarrationRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    text: request.text,
    model_id: request.model,
  };
  const voiceSettings = readVoiceSettings(request.providerOptions);

  if (voiceSettings !== undefined) {
    body.voice_settings = {
      stability: voiceSettings.stability,
      similarity_boost: voiceSettings.similarityBoost,
      style: voiceSettings.style,
      use_speaker_boost: voiceSettings.useSpeakerBoost,
      speed: voiceSettings.speed,
    };
  }

  return pruneUndefined(body);
}

function readVoiceSettings(
  providerOptions: NarrationRequest["providerOptions"],
): ElevenLabsVoiceSettings | undefined {
  const value = providerOptions?.voiceSettings;

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as ElevenLabsVoiceSettings;
}

function pruneUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [
        key,
        typeof child === "object" && child !== null && !Array.isArray(child)
          ? pruneUndefined(child as Record<string, unknown>)
          : child,
      ]),
  ) as T;
}

async function readFailureDetail(response: Response): Promise<string> {
  try {
    return (await response.text()).trim();
  } catch {
    return "";
  }
}
