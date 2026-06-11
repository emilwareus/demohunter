import type { Locator, Page, Response } from "playwright";
import type { ElevenLabsVoiceSettings, ResolvedDemoHunterConfig } from "./config.js";

export type ChapterOptions = {
  id?: string;
};

export type NarrateOptions = {
  voice?: string;
  model?: string;
  format?: string;
  instructions?: string;
  language?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
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
