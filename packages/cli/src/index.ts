import type { Locator, Page, Response } from "playwright";

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

export type ChapterOptions = {
  id?: string;
};

export type NarrateOptions = {
  voice?: string;
  instructions?: string;
  cacheKeyHint?: string;
};

export type WaitForStableOptions = {
  state?: "load" | "domcontentloaded" | "networkidle";
  timeoutMs?: number;
};

export type HighlightOptions = {
  name?: string;
  paddingPx?: number;
};

export type SnapshotOptions = {
  name?: string;
};

export type AssertVisibleOptions = {
  timeoutMs?: number;
};

export type DemoHunterLifecycleContext = {
  config: ResolvedDemoHunterConfig;
  goto: DemoHunterGoto;
  page: Page;
};

export type DemoHunterChapter = (title: string, options?: ChapterOptions) => Promise<void>;

export type DemoHunterStep = <T>(title: string, fn: () => Promise<T> | T) => Promise<T>;

export type DemoHunterNarrate = (text: string, options?: NarrateOptions) => Promise<void>;

export type DemoHunterNarrationTimeline = {
  sleep(ms: number): Promise<void>;
};

export type DemoHunterNarrateWhile = <T>(
  text: string,
  fn: (timeline: DemoHunterNarrationTimeline) => Promise<T> | T,
  options?: NarrateOptions,
) => Promise<T>;

export type DemoHunterWaitForStable = (options?: WaitForStableOptions) => Promise<void>;

export type DemoHunterHighlight = (target: Locator, options?: HighlightOptions) => Promise<void>;

export type DemoHunterSnapshot = (options?: SnapshotOptions) => Promise<void>;

export type DemoHunterAssertVisible = (
  target: Locator,
  options?: AssertVisibleOptions,
) => Promise<void>;

export type DemoHunterGoto = (
  url: string | URL,
  options?: Parameters<Page["goto"]>[1],
) => Promise<null | Response>;

export type DemoHunterRunContext = DemoHunterLifecycleContext & {
  chapter: DemoHunterChapter;
  step: DemoHunterStep;
  narrate: DemoHunterNarrate;
  narrateWhile: DemoHunterNarrateWhile;
  waitForStable: DemoHunterWaitForStable;
  highlight: DemoHunterHighlight;
  snapshot: DemoHunterSnapshot;
  assertVisible: DemoHunterAssertVisible;
};

export type DemoHunterTour = {
  id: string;
  title: string;
  setup?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
  run: (context: DemoHunterRunContext) => Promise<void> | void;
  teardown?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
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

export function defineTour<T extends DemoHunterTour>(tour: T): T {
  return tour;
}
