export type BrowserName = "chromium" | "firefox" | "webkit";
export type RecordFormat = "mp4" | "webm";
export type HighlightStyle = "ring" | "spotlight";

export type ViewportConfig = {
  width: number;
  height: number;
};

export type RecordConfig = {
  showActions: boolean;
  showChapters: boolean;
  format: RecordFormat;
  /** Render a custom DOM cursor in the recording pass. Default: true */
  showCursor?: boolean;
  /** Render a ripple animation on clicks during the recording pass. Default: true */
  showClickRipple?: boolean;
  /** Default highlight style applied when a tour omits a per-call style. Default: "ring" */
  highlightStyle?: HighlightStyle;
};

export type TTSProviderName = "openai" | "elevenlabs";

export type ElevenLabsVoiceSettings = {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  speed?: number;
};

export type OpenAITTSConfig = {
  provider: "openai";
  model: string;
  voice: string;
  format: string;
  instructions: string;
  language?: string;
};

export type ElevenLabsTTSConfig = {
  provider: "elevenlabs";
  model: string;
  voice: string;
  format: string;
  instructions: string;
  language?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
};

export type TTSConfig = OpenAITTSConfig | ElevenLabsTTSConfig;

export type DemoHunterUserTTSConfig =
  | (Partial<Omit<OpenAITTSConfig, "provider">> & { provider?: "openai" })
  | (Partial<Omit<ElevenLabsTTSConfig, "provider">> & { provider: "elevenlabs" });

export type DemoHunterUserConfig = {
  baseURL: string;
  outputDir?: string;
  cacheDir?: string;
  browser?: BrowserName;
  viewport?: ViewportConfig;
  holdPaddingMs?: number;
  record?: Partial<RecordConfig>;
  tts?: DemoHunterUserTTSConfig;
};

export type ResolvedDemoHunterConfig = {
  baseURL: string;
  outputDir: string;
  cacheDir: string;
  browser: BrowserName;
  viewport: ViewportConfig;
  holdPaddingMs: number;
  record: RecordConfig;
  tts: TTSConfig;
};

export const DEFAULT_VIEWPORT_CONFIG: ViewportConfig = {
  width: 1440,
  height: 900,
};

export const DEFAULT_RECORD_CONFIG: RecordConfig = {
  showActions: true,
  showChapters: true,
  format: "mp4",
  showCursor: true,
  showClickRipple: true,
  highlightStyle: "ring",
};

export const DEFAULT_TTS_CONFIG: TTSConfig = {
  provider: "openai",
  model: "gpt-4o-mini-tts",
  voice: "marin",
  format: "mp3",
  instructions: "Speak clearly, calm, concise, product-demo style.",
};

export const DEFAULT_ELEVENLABS_TTS_CONFIG: ElevenLabsTTSConfig = {
  provider: "elevenlabs",
  model: "eleven_multilingual_v2",
  voice: "JBFqnCBsd6RMkjVDRZzb",
  format: "mp3_44100_128",
  instructions: "",
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.75,
    useSpeakerBoost: true,
  },
};

export const DEFAULT_DEMOHUNTER_CONFIG: Omit<ResolvedDemoHunterConfig, "baseURL"> = {
  outputDir: ".demohunter",
  cacheDir: ".demohunter/cache",
  browser: "chromium",
  viewport: DEFAULT_VIEWPORT_CONFIG,
  holdPaddingMs: 300,
  record: DEFAULT_RECORD_CONFIG,
  tts: DEFAULT_TTS_CONFIG,
};

export function defineConfig<T extends DemoHunterUserConfig>(config: T): T {
  return config;
}
