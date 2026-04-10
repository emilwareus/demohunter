export type BrowserName = "chromium" | "firefox" | "webkit";
export type RecordFormat = "mp4" | "webm";

export type ViewportConfig = {
  width: number;
  height: number;
};

export type RecordConfig = {
  showActions: boolean;
  showChapters: boolean;
  format: RecordFormat;
};

export type TTSConfig = {
  provider: "openai";
  model: string;
  voice: string;
  format: string;
  instructions: string;
};

export type DemoHunterUserConfig = {
  baseURL: string;
  outputDir?: string;
  cacheDir?: string;
  browser?: BrowserName;
  viewport?: ViewportConfig;
  holdPaddingMs?: number;
  record?: Partial<RecordConfig>;
  tts?: Partial<TTSConfig>;
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
};

export const DEFAULT_TTS_CONFIG: TTSConfig = {
  provider: "openai",
  model: "gpt-4o-mini-tts",
  voice: "marin",
  format: "mp3",
  instructions: "Speak clearly, calm, concise, product-demo style.",
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
