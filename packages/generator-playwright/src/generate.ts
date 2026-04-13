import { rm } from "node:fs/promises";
import path from "node:path";

import type { DemoHunterRunContext, ResolvedDemoHunterConfig } from "@demohunter/sdk";
import * as playwright from "playwright";
import type { BrowserType } from "playwright";

import { collectTimeline } from "./execute/collect-timeline.js";
import type {
  CollectedTimeline,
  RecordedNarration,
} from "./execute/generator-types.js";
import { replayTimeline } from "./execute/replay-timeline.js";
import { prepareOutputDir as prepareOutputDirHelper } from "./output/prepare-output-dir.js";
import { writeGenerationOutput } from "./output/write-generation-output.js";
import type { GenerationChapter, WriteGenerationOutputResult } from "./output/write-generation-output.js";
import { showChapterOverlay } from "./overlays/chapter-overlay.js";
import { muxVideo } from "./record/mux-video.js";
import { startScreencast, stopScreencast } from "./record/screencast.js";
import type { SmokeTourModule } from "./smoke-generate.js";

const CHAPTER_OVERLAY_DURATION_MS = 900;

type BrowserTypeMap = Record<"chromium" | "firefox" | "webkit", Pick<BrowserType, "launch">>;

export type GenerateTourResult = WriteGenerationOutputResult;
export type GenerateLoadedConfig = {
  config: ResolvedDemoHunterConfig;
  configPath: string;
  projectRoot: string;
};
export type GenerateTourFile = SmokeTourModule;

export type GenerateTourInput = {
  loadedConfig: GenerateLoadedConfig;
  tourFile: GenerateTourFile;
};

type GenerateTourDependencies = {
  collectTimeline: typeof collectTimeline;
  muxVideo: typeof muxVideo;
  now: () => number;
  playwright: BrowserTypeMap;
  prepareOutputDir: (tourId: string, outputRoot: string) => Promise<string>;
  replayTimeline: typeof replayTimeline;
  showChapterOverlay: typeof showChapterOverlay;
  startScreencast: typeof startScreencast;
  stopScreencast: typeof stopScreencast;
  writeGenerationOutput: typeof writeGenerationOutput;
};

const defaultDependencies: GenerateTourDependencies = {
  collectTimeline,
  muxVideo,
  now: () => Date.now(),
  playwright,
  prepareOutputDir: (tourId, outputRoot) => prepareOutputDirHelper(tourId, outputRoot),
  replayTimeline,
  showChapterOverlay,
  startScreencast,
  stopScreencast,
  writeGenerationOutput,
};

export async function generateTour(
  { loadedConfig, tourFile }: GenerateTourInput,
  dependencies: Partial<GenerateTourDependencies> = {},
): Promise<GenerateTourResult> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const { config } = loadedConfig;
  const outputDir = await resolvedDependencies.prepareOutputDir(tourFile.tour.id, config.outputDir);
  const tempScreencastPath = path.join(path.dirname(outputDir), `${tourFile.tour.id}.recording.webm`);
  const browserType = resolvedDependencies.playwright[config.browser];
  const browser = await browserType.launch();
  let passOneContext: Awaited<ReturnType<typeof browser.newContext>> | undefined;
  let passTwoContext: Awaited<ReturnType<typeof browser.newContext>> | undefined;
  let primaryError: unknown;
  const chapters: GenerationChapter[] = [];
  const recordedNarrations: RecordedNarration[] = [];

  try {
    passOneContext = await browser.newContext({
      viewport: config.viewport,
    });

    const passOnePage = await passOneContext.newPage();
    const timeline = await resolvedDependencies.collectTimeline({
      loadedConfig,
      page: passOnePage,
      tourFile,
    });

    await passOneContext.close();
    passOneContext = undefined;

    passTwoContext = await browser.newContext({
      viewport: config.viewport,
    });

    const passTwoPage = await passTwoContext.newPage();

    await resolvedDependencies.startScreencast({
      outputPath: tempScreencastPath,
      page: passTwoPage,
      showActions: config.record.showActions,
      viewport: config.viewport,
    });
    const recordingStartedAt = resolvedDependencies.now();

    try {
      await resolvedDependencies.replayTimeline({
        loadedConfig,
        onMatchedEvent: (event, index) => {
          if (event.kind === "chapter") {
            chapters.push({
              startMs: Math.max(0, resolvedDependencies.now() - recordingStartedAt),
              title: event.title,
            });
            return;
          }

          if (event.kind !== "narrate") {
            return;
          }

          const matchedEntry = timeline.entries[index - 1];

          if (matchedEntry?.kind !== "narration") {
            return;
          }

          const startMs = Math.max(0, resolvedDependencies.now() - recordingStartedAt);
          recordedNarrations.push({
            ...matchedEntry.segment,
            endMs: startMs + matchedEntry.segment.durationMs,
            startMs,
          });
        },
        page: passTwoPage,
        timeline,
        tourFile: wrapTourForReplay({
          page: passTwoPage,
          showChapterOverlay: resolvedDependencies.showChapterOverlay,
          showChapters: config.record.showChapters,
          tourFile,
        }),
      });
    } catch (error) {
      primaryError = error;
    }

    await resolvedDependencies.stopScreencast({
      page: passTwoPage,
      primaryError,
    });

    const videos = await resolvedDependencies.muxVideo({
      outputDir,
      recordFormat: config.record.format,
      tempScreencastPath,
    });

    return await resolvedDependencies.writeGenerationOutput({
      tourId: tourFile.tour.id,
      tourTitle: tourFile.tour.title,
      chapters,
      recordedNarrations,
      videos,
      outputDir,
    });
  } catch (error) {
    primaryError ??= error;
    throw error;
  } finally {
    let closeError: unknown;

    try {
      await rm(tempScreencastPath, { force: true });
    } catch (error) {
      closeError ??= error;
    }

    try {
      await passOneContext?.close();
    } catch (error) {
      closeError ??= error;
    }

    try {
      await passTwoContext?.close();
    } catch (error) {
      closeError ??= error;
    }

    try {
      await browser.close();
    } catch (error) {
      closeError ??= error;
    }

    if (primaryError === undefined && closeError !== undefined) {
      throw closeError;
    }
  }
}

function wrapTourForReplay(args: {
  page: Parameters<typeof showChapterOverlay>[0]["page"];
  showChapterOverlay: typeof showChapterOverlay;
  showChapters: boolean;
  tourFile: SmokeTourModule;
}): SmokeTourModule {
  if (!args.showChapters) {
    return args.tourFile;
  }

  return {
    ...args.tourFile,
    tour: {
      ...args.tourFile.tour,
      run: async (runtime) => {
        await args.tourFile.tour.run(
          new Proxy(runtime, {
            get(target, property, receiver) {
              if (property === "chapter") {
                return async (title: string, options?: Parameters<DemoHunterRunContext["chapter"]>[1]) => {
                  const chapter = Reflect.get(
                    target,
                    property,
                    receiver,
                  ) as DemoHunterRunContext["chapter"];
                  await chapter(title, options);
                  await args.showChapterOverlay({
                    durationMs: CHAPTER_OVERLAY_DURATION_MS,
                    page: args.page,
                    title,
                  });
                };
              }

              const value = Reflect.get(target, property, receiver);

              if (typeof value === "function") {
                return value.bind(target);
              }

              return value;
            },
          }),
        );
      },
    },
  };
}
