import { describe, expect, mock, test } from "bun:test";
import path from "node:path";

import type { CollectedTimeline } from "./execute/generator-types.js";
import { ReplayTimelineError } from "./execute/replay-timeline.js";
import { generateTour } from "./generate.js";

describe("generateTour", () => {
  test("runs pass 1, recorded replay, muxing, and output writing in order", async () => {
    const calls: string[] = [];
    const passOnePage = { goto: mock(async () => {}) };
    const passTwoPage = { goto: mock(async () => {}) };
    const passOneContext = {
      close: mock(async () => {
        calls.push("close-pass-1");
      }),
      newPage: mock(async () => {
        calls.push("new-page-pass-1");
        return passOnePage;
      }),
    };
    const passTwoContext = {
      close: mock(async () => {
        calls.push("close-pass-2");
      }),
      newPage: mock(async () => {
        calls.push("new-page-pass-2");
        return passTwoPage;
      }),
    };
    const browser = {
      close: mock(async () => {
        calls.push("close-browser");
      }),
      newContext: mock(async () => {
        calls.push("new-context");
        return browser.newContext.mock.calls.length === 1 ? passOneContext : passTwoContext;
      }),
    };
    const collectTimeline = mock(async () => {
      calls.push("collect");
      return createTimeline();
    });
    const replayTimeline = mock(async ({ tourFile }) => {
      calls.push("replay");
      await tourFile.tour.run({
        chapter: mock(async () => {
          calls.push("chapter");
        }),
      });
    });
    const startScreencast = mock(async () => {
      calls.push("start");
    });
    const stopScreencast = mock(async () => {
      calls.push("stop");
    });
    const muxVideo = mock(async () => {
      calls.push("mux");
      return {
        fileName: "video.mp4" as const,
        format: "mp4" as const,
        path: "/tmp/video.mp4",
      };
    });
    const writeGenerationOutput = mock(async () => {
      calls.push("write");
      return {
        outputDir: "/tmp/project/.demohunter/billing-overview",
        videoPath: "/tmp/project/.demohunter/billing-overview/video.mp4",
      };
    });
    const showChapterOverlay = mock(async () => {
      calls.push("show-chapter-overlay");
    });

    const result = await generateTour(
      {
        loadedConfig: createLoadedConfig("/tmp/project"),
        tourFile: createTourFile("/tmp/project"),
      },
      {
        collectTimeline,
        muxVideo,
        playwright: {
          chromium: {
            launch: mock(async () => {
              calls.push("launch");
              return browser;
            }),
          },
          firefox: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
          webkit: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
        },
        prepareOutputDir: mock(async () => {
          calls.push("prepare-output");
          return "/tmp/project/.demohunter/billing-overview";
        }),
        replayTimeline,
        showChapterOverlay,
        startScreencast,
        stopScreencast,
        writeGenerationOutput,
      },
    );

    expect(result).toEqual({
      outputDir: "/tmp/project/.demohunter/billing-overview",
      videoPath: "/tmp/project/.demohunter/billing-overview/video.mp4",
    });
    expect(calls).toEqual([
      "prepare-output",
      "launch",
      "new-context",
      "new-page-pass-1",
      "collect",
      "close-pass-1",
      "new-context",
      "new-page-pass-2",
      "start",
      "replay",
      "chapter",
      "show-chapter-overlay",
      "stop",
      "mux",
      "write",
      "close-pass-2",
      "close-browser",
    ]);
    expect(startScreencast).toHaveBeenCalledWith({
      outputPath: "/tmp/project/.demohunter/billing-overview.recording.webm",
      page: passTwoPage,
      showActions: true,
      viewport: { height: 720, width: 1280 },
    });
    expect(writeGenerationOutput).toHaveBeenCalledWith({
      chapters: [
        { startMs: 0, title: "Billing" },
        { startMs: 1500, title: "Invoices" },
      ],
      finalVideo: {
        fileName: "video.mp4",
        format: "mp4",
        path: "/tmp/video.mp4",
      },
      outputDir: "/tmp/project/.demohunter/billing-overview",
    });
    expect(showChapterOverlay).toHaveBeenCalledWith({
      durationMs: 900,
      page: passTwoPage,
      title: "Billing",
    });
  });

  test("fails directly when pass 1 navigation fails instead of retrying readiness checks", async () => {
    const navigationError = new Error("page.goto: net::ERR_CONNECTION_REFUSED http://localhost:3000/");
    const collectTimeline = mock(async () => {
      throw navigationError;
    });
    const replayTimeline = mock(async () => {});

    await expect(
      generateTour(
        {
          loadedConfig: createLoadedConfig("/tmp/project"),
          tourFile: createTourFile("/tmp/project"),
        },
        {
          collectTimeline,
          playwright: {
            chromium: {
              launch: mock(async () => ({
                close: mock(async () => {}),
                newContext: mock(async () => ({
                  close: mock(async () => {}),
                  newPage: mock(async () => ({ goto: mock(async () => {}) })),
                })),
              })),
            },
            firefox: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
            webkit: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
          },
          prepareOutputDir: mock(async () => "/tmp/project/.demohunter/billing-overview"),
          replayTimeline,
        },
      ),
    ).rejects.toBe(navigationError);

    expect(collectTimeline).toHaveBeenCalledTimes(1);
    expect(replayTimeline).not.toHaveBeenCalled();
  });

  test("rethrows recorded-pass divergence and preserves it through screencast shutdown", async () => {
    const divergenceError = new ReplayTimelineError("Recorded pass diverged at entry 2", {
      actual: {
        chapterTitle: "Billing",
        kind: "step-start",
        title: "Actual step",
      },
      expected: {
        chapterTitle: "Billing",
        kind: "step-start",
        title: "Expected step",
      },
      index: 2,
      reason: "mismatch",
    });
    const stopScreencast = mock(async ({ primaryError }) => {
      throw primaryError;
    });
    const muxVideo = mock(async () => {
      throw new Error("should not mux after divergence");
    });
    const writeGenerationOutput = mock(async () => {
      throw new Error("should not write after divergence");
    });

    await expect(
      generateTour(
        {
          loadedConfig: createLoadedConfig("/tmp/project"),
          tourFile: createTourFile("/tmp/project"),
        },
        {
          collectTimeline: mock(async () => createTimeline()),
          muxVideo,
          playwright: {
            chromium: {
              launch: mock(async () => ({
                close: mock(async () => {}),
                newContext: mock(async () => ({
                  close: mock(async () => {}),
                  newPage: mock(async () => ({ goto: mock(async () => {}) })),
                })),
              })),
            },
            firefox: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
            webkit: { launch: mock(async () => { throw new Error("unexpected browser"); }) },
          },
          prepareOutputDir: mock(async () => "/tmp/project/.demohunter/billing-overview"),
          replayTimeline: mock(async () => {
            throw divergenceError;
          }),
          startScreencast: mock(async () => {}),
          stopScreencast,
          writeGenerationOutput,
        },
      ),
    ).rejects.toBe(divergenceError);

    expect(stopScreencast).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryError: divergenceError,
      }),
    );
    expect(muxVideo).not.toHaveBeenCalled();
    expect(writeGenerationOutput).not.toHaveBeenCalled();
  });
});

function createLoadedConfig(projectRoot: string) {
  return {
    config: {
      baseURL: "http://localhost:3000",
      outputDir: path.join(projectRoot, ".demohunter"),
      cacheDir: path.join(projectRoot, ".demohunter/cache"),
      browser: "chromium" as const,
      viewport: { height: 720, width: 1280 },
      holdPaddingMs: 300,
      record: { format: "mp4" as const, showActions: true, showChapters: true },
      tts: {
        provider: "openai" as const,
        model: "gpt-4o-mini-tts",
        voice: "marin",
        format: "mp3",
        instructions: "Speak clearly.",
      },
    },
    configPath: path.join(projectRoot, "demohunter.config.ts"),
    projectRoot,
  };
}

function createTimeline(): CollectedTimeline {
  return {
    entries: [
      {
        event: {
          chapterTitle: "Billing",
          id: "billing",
          kind: "chapter",
          outputDir: "/tmp/project/.demohunter/billing-overview",
          title: "Billing",
        },
        kind: "event",
        order: 1,
      },
      {
        chapterTitle: "Billing",
        durationMs: 1200,
        event: {
          chapterTitle: "Billing",
          kind: "narrate",
          text: "Explain billing",
        },
        kind: "narration",
        order: 2,
        text: "Explain billing",
      },
      {
        event: {
          chapterTitle: "Invoices",
          id: "invoices",
          kind: "chapter",
          outputDir: "/tmp/project/.demohunter/billing-overview",
          title: "Invoices",
        },
        kind: "event",
        order: 3,
      },
    ],
    narrations: [
      {
        chapterTitle: "Billing",
        durationMs: 1200,
        event: {
          chapterTitle: "Billing",
          kind: "narrate",
          text: "Explain billing",
        },
        kind: "narration",
        order: 2,
        text: "Explain billing",
      },
    ],
  };
}

function createTourFile(projectRoot: string) {
  return {
    path: path.join(projectRoot, "demos", "billing.tour.ts"),
    tour: {
      id: "billing-overview",
      title: "Billing overview",
      run: async ({ chapter }: { chapter: (title: string) => Promise<void> }) => {
        await chapter("Billing");
      },
    },
  };
}
