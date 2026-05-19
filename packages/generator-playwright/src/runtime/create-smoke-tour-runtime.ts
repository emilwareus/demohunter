import type {
  AssertVisibleOptions,
  ChapterOptions,
  DemoHunterLifecycleContext,
  DemoHunterRunContext,
  HighlightOptions,
  NarrateOptions,
  SnapshotOptions,
  WaitForStableOptions,
  ResolvedDemoHunterConfig,
} from "@demohunter/sdk";
import type { Locator, Page } from "playwright";
import type { TourRuntimeEvent } from "../execute/generator-types.js";

export type SmokeRuntime = DemoHunterRunContext & DemoHunterLifecycleContext;

type SnapshotInput = string | SnapshotOptions | undefined;

export type SmokeTourRuntimeEvent = TourRuntimeEvent;

export function createSmokeTourRuntime(args: {
  config: ResolvedDemoHunterConfig;
  page: Page;
  outputDir: string;
  onEvent?: (event: SmokeTourRuntimeEvent) => void;
}): SmokeRuntime {
  let currentChapter: string | undefined;

  const emit = (event: TourRuntimeEvent): void => {
    args.onEvent?.(event);
  };
  const goto: DemoHunterRunContext["goto"] = async (url, options) => {
    const resolvedUrl = new URL(url, args.config.baseURL).href;

    return args.page.goto(resolvedUrl, options);
  };

  return {
    config: args.config,
    goto,
    page: args.page,
    async chapter(title: string, options?: ChapterOptions): Promise<void> {
      currentChapter = title;
      emit({
        chapterTitle: title,
        id: options?.id,
        kind: "chapter",
        outputDir: args.outputDir,
        title,
      });
    },
    async step<T>(title: string, fn: () => Promise<T> | T): Promise<T> {
      emit({
        chapterTitle: currentChapter,
        kind: "step-start",
        title,
      });

      try {
        const result = await fn();
        emit({
          chapterTitle: currentChapter,
          kind: "step-end",
          title,
        });
        return result;
      } catch (error) {
        emit({
          chapterTitle: currentChapter,
          kind: "step-end",
          title,
        });
        throw error;
      }
    },
    async narrate(text: string, options?: NarrateOptions): Promise<void> {
      emit({
        chapterTitle: currentChapter,
        kind: "narrate",
        text,
        ...options,
      });
    },
    async waitForStable(options?: WaitForStableOptions): Promise<void> {
      const state = options?.state ?? "networkidle";
      const waitOptions = options?.timeoutMs === undefined ? undefined : { timeout: options.timeoutMs };

      await args.page.waitForLoadState(state, waitOptions);
      emit({
        chapterTitle: currentChapter,
        kind: "wait-for-stable",
        state,
        timeoutMs: options?.timeoutMs,
      });
    },
    async highlight(target: Locator, options?: HighlightOptions): Promise<void> {
      await target.waitFor({ state: "visible" });
      await target.scrollIntoViewIfNeeded();
      emit({
        chapterTitle: currentChapter,
        kind: "highlight",
        ...options,
      });
    },
    async snapshot(nameOrOptions?: SnapshotInput): Promise<void> {
      const options =
        typeof nameOrOptions === "string"
          ? {
              name: nameOrOptions,
            }
          : nameOrOptions;

      emit({
        chapterTitle: currentChapter,
        kind: "snapshot",
        ...options,
      });
    },
    async assertVisible(target: Locator, options?: AssertVisibleOptions): Promise<void> {
      await target.waitFor(
        options?.timeoutMs === undefined
          ? { state: "visible" }
          : { state: "visible", timeout: options.timeoutMs },
      );
      emit({
        chapterTitle: currentChapter,
        kind: "assert-visible",
        timeoutMs: options?.timeoutMs,
      });
    },
  };
}
