import type { Locator, Page } from "playwright";

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
  page: Page;
};

export type DemoHunterChapter = (title: string, options?: ChapterOptions) => Promise<void>;

export type DemoHunterStep = <T>(title: string, fn: () => Promise<T> | T) => Promise<T>;

export type DemoHunterNarrate = (text: string, options?: NarrateOptions) => Promise<void>;

export type DemoHunterWaitForStable = (options?: WaitForStableOptions) => Promise<void>;

export type DemoHunterHighlight = (target: Locator, options?: HighlightOptions) => Promise<void>;

export type DemoHunterSnapshot = (options?: SnapshotOptions) => Promise<void>;

export type DemoHunterAssertVisible = (
  target: Locator,
  options?: AssertVisibleOptions,
) => Promise<void>;

export type DemoHunterRunContext = DemoHunterLifecycleContext & {
  chapter: DemoHunterChapter;
  step: DemoHunterStep;
  narrate: DemoHunterNarrate;
  waitForStable: DemoHunterWaitForStable;
  highlight: DemoHunterHighlight;
  snapshot: DemoHunterSnapshot;
  assertVisible: DemoHunterAssertVisible;
};
