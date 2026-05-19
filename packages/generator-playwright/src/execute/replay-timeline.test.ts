import { describe, expect, mock, test } from "bun:test";
import path from "node:path";

import type { CollectedTimeline } from "./generator-types.js";
import { ReplayTimelineError, replayTimeline } from "./replay-timeline.js";

describe("replayTimeline", () => {
  test("replays the collected timeline through the shared runtime lifecycle order", async () => {
    const page = {
      goto: mock(async () => {}),
      waitForTimeout: mock(async () => {}),
    };
    const calls: string[] = [];
    const contexts: object[] = [];
    const setup = mock(async (context) => {
      calls.push(`setup:${context.page === page}`);
      contexts.push(context as object);
      (context as Record<string, unknown>).marker = "shared";
    });
    const run = mock(async (context) => {
      const { page: runtimePage, chapter, step, narrate } = context;

      calls.push(`run:${runtimePage === page}`);
      contexts.push(context as object);
      expect((context as Record<string, unknown>).marker).toBe("shared");
      await chapter("Billing", { id: "billing" });
      await step("Open invoice view", async () => {
        calls.push("step");
        await narrate("Explain the invoice screen");
      });
    });
    const teardown = mock(async (context) => {
      calls.push(`teardown:${context.page === page}`);
      contexts.push(context as object);
      expect((context as Record<string, unknown>).marker).toBe("shared");
    });

    await replayTimeline({
      loadedConfig: createLoadedConfig("/tmp/workspace"),
      page: page as never,
      timeline: createTimeline("/tmp/workspace"),
      tourFile: {
        path: "/tmp/workspace/demos/billing.tour.ts",
        tour: {
          id: "billing-overview",
          run,
          setup,
          teardown,
          title: "Billing overview",
        },
      },
    });

    expect(page.goto).toHaveBeenCalledWith("http://localhost:3000/");
    expect(page.waitForTimeout).toHaveBeenCalledWith(1500);
    expect(calls).toEqual(["setup:true", "run:true", "step", "teardown:true"]);
    expect(contexts).toHaveLength(3);
    expect(contexts[0]).toBe(contexts[1]);
    expect(contexts[1]).toBe(contexts[2]);
  });

  test("waits for narration duration plus hold padding exactly once per narration event", async () => {
    const waitForTimeout = mock(async () => {});
    const page = {
      goto: mock(async () => {}),
      waitForTimeout,
    };

    await replayTimeline({
      loadedConfig: createLoadedConfig("/tmp/workspace"),
      page: page as never,
      timeline: {
        entries: [
          {
            event: {
              chapterTitle: undefined,
              kind: "narrate",
              text: "Narrated step",
            },
            kind: "narration",
            order: 1,
            segment: {
              audioPath: "/tmp/workspace/.demohunter/cache/narrated-step.mp3",
              cacheKey: "narrated-step",
              chapterTitle: undefined,
              durationMs: 1200,
              text: "Narrated step",
            },
          },
        ],
        narrations: [],
      },
      tourFile: {
        path: "/tmp/workspace/demos/billing.tour.ts",
        tour: {
          id: "billing-overview",
          title: "Billing overview",
          run: async ({ narrate }) => {
            await narrate("Narrated step");
          },
        },
      },
    });

    expect(waitForTimeout).toHaveBeenCalledTimes(1);
    expect(waitForTimeout).toHaveBeenCalledWith(1500);
  });

  test("runs narrateWhile actions during narration and waits only the remaining narration window", async () => {
    const waitForTimeout = mock(async () => {});
    const page = {
      goto: mock(async () => {}),
      waitForTimeout,
    };

    await replayTimeline({
      loadedConfig: createLoadedConfig("/tmp/workspace"),
      page: page as never,
      timeline: {
        entries: [
          {
            event: {
              chapterTitle: undefined,
              kind: "narrate",
              text: "Narrate over motion",
            },
            kind: "narration",
            order: 1,
            segment: {
              audioPath: "/tmp/workspace/.demohunter/cache/motion.mp3",
              cacheKey: "motion",
              chapterTitle: undefined,
              durationMs: 1200,
              text: "Narrate over motion",
            },
          },
          {
            event: {
              chapterTitle: undefined,
              durationMs: 500,
              kind: "narration-sleep",
            },
            kind: "event",
            order: 2,
          },
          {
            event: {
              chapterTitle: undefined,
              kind: "snapshot",
              name: "during-motion",
            },
            kind: "event",
            order: 3,
          },
        ],
        narrations: [],
      },
      tourFile: {
        path: "/tmp/workspace/demos/billing.tour.ts",
        tour: {
          id: "billing-overview",
          title: "Billing overview",
          run: async ({ narrateWhile, snapshot }) => {
            await narrateWhile("Narrate over motion", async ({ sleep }) => {
              await sleep(500);
              await snapshot({ name: "during-motion" });
            });
          },
        },
      },
    });

    expect(waitForTimeout).toHaveBeenCalledTimes(2);
    expect(waitForTimeout).toHaveBeenNthCalledWith(1, 500);
    expect(waitForTimeout).toHaveBeenNthCalledWith(2, 1000);
  });

  test("keeps only hold padding when narrateWhile actions run longer than the narration", async () => {
    const waitForTimeout = mock(async () => {});
    const page = {
      goto: mock(async () => {}),
      waitForTimeout,
    };
    const timestamps = [0, 1600];
    const now = mock(() => timestamps.shift() ?? 1600);

    await replayTimeline({
      loadedConfig: createLoadedConfig("/tmp/workspace"),
      now,
      page: page as never,
      timeline: {
        entries: [
          {
            event: {
              chapterTitle: undefined,
              kind: "narrate",
              text: "Short narration",
            },
            kind: "narration",
            order: 1,
            segment: {
              audioPath: "/tmp/workspace/.demohunter/cache/short.mp3",
              cacheKey: "short",
              chapterTitle: undefined,
              durationMs: 1200,
              text: "Short narration",
            },
          },
          {
            event: {
              chapterTitle: undefined,
              kind: "snapshot",
              name: "slow-action",
            },
            kind: "event",
            order: 2,
          },
        ],
        narrations: [],
      },
      tourFile: {
        path: "/tmp/workspace/demos/billing.tour.ts",
        tour: {
          id: "billing-overview",
          title: "Billing overview",
          run: async ({ narrateWhile, snapshot }) => {
            await narrateWhile("Short narration", async () => {
              await snapshot({ name: "slow-action" });
            });
          },
        },
      },
    });

    expect(waitForTimeout).toHaveBeenCalledTimes(1);
    expect(waitForTimeout).toHaveBeenCalledWith(300);
    expect(now).toHaveBeenCalledTimes(2);
  });

  test("fails clearly when the live pass diverges from the collected timeline", async () => {
    const page = {
      goto: mock(async () => {}),
      waitForTimeout: mock(async () => {}),
    };

    await expect(
      replayTimeline({
        loadedConfig: createLoadedConfig("/tmp/workspace"),
        page: page as never,
        timeline: {
          entries: [
            {
              event: {
                chapterTitle: "Billing",
                kind: "step-start",
                title: "Expected step",
              },
              kind: "event",
              order: 1,
            },
          ],
          narrations: [],
        },
        tourFile: {
          path: "/tmp/workspace/demos/billing.tour.ts",
          tour: {
            id: "billing-overview",
            title: "Billing overview",
            run: async ({ step }) => {
              await step("Actual step", async () => {});
            },
          },
        },
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        cause: expect.objectContaining({
          actual: {
            chapterTitle: undefined,
            kind: "step-start",
            title: "Actual step",
          },
          expected: {
            chapterTitle: "Billing",
            kind: "step-start",
            title: "Expected step",
          },
          index: 1,
        }),
        message: expect.stringContaining("Recorded pass diverged at entry 1"),
        name: ReplayTimelineError.name,
      }),
    );
  });

  test("matches teardown-emitted runtime events before declaring replay complete", async () => {
    const page = {
      goto: mock(async () => {}),
      waitForTimeout: mock(async () => {}),
    };

    await expect(
      replayTimeline({
        loadedConfig: createLoadedConfig("/tmp/workspace"),
        page: page as never,
        timeline: {
          entries: [
            {
              event: {
                chapterTitle: undefined,
                kind: "step-start",
                title: "Cleanup",
              },
              kind: "event",
              order: 1,
            },
            {
              event: {
                chapterTitle: undefined,
                kind: "narrate",
                text: "Finish cleanup",
              },
              kind: "narration",
              order: 2,
              segment: {
                audioPath: "/tmp/workspace/.demohunter/cache/finish-cleanup.mp3",
                cacheKey: "finish-cleanup",
                chapterTitle: undefined,
                durationMs: 200,
                text: "Finish cleanup",
              },
            },
            {
              event: {
                chapterTitle: undefined,
                kind: "step-end",
                title: "Cleanup",
              },
              kind: "event",
              order: 3,
            },
          ],
          narrations: [],
        },
        tourFile: {
          path: "/tmp/workspace/demos/billing.tour.ts",
          tour: {
            id: "billing-overview",
            title: "Billing overview",
            run: async () => {},
            teardown: async ({ step, narrate }) => {
              await step("Cleanup", async () => {
                await narrate("Finish cleanup");
              });
            },
          },
        },
      }),
    ).resolves.toBeUndefined();

    expect(page.waitForTimeout).toHaveBeenCalledWith(500);
  });
});

function createLoadedConfig(projectRoot: string) {
  return {
    config: {
      baseURL: "http://localhost:3000",
      outputDir: path.join(projectRoot, ".demohunter"),
      cacheDir: path.join(projectRoot, ".demohunter/cache"),
      browser: "chromium" as const,
      viewport: { width: 1280, height: 720 },
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

function createTimeline(projectRoot: string): CollectedTimeline {
  return {
    entries: [
      {
        event: {
          chapterTitle: "Billing",
          id: "billing",
          kind: "chapter",
          outputDir: path.join(projectRoot, ".demohunter", "billing-overview"),
          title: "Billing",
        },
        kind: "event",
        order: 1,
      },
      {
        event: {
          chapterTitle: "Billing",
          kind: "step-start",
          title: "Open invoice view",
        },
        kind: "event",
        order: 2,
      },
      {
        event: {
          chapterTitle: "Billing",
          kind: "narrate",
          text: "Explain the invoice screen",
        },
        kind: "narration",
        order: 3,
        segment: {
          audioPath: path.join(projectRoot, ".demohunter", "cache", "narration.mp3"),
          cacheKey: "narration",
          chapterTitle: "Billing",
          durationMs: 1200,
          text: "Explain the invoice screen",
        },
      },
      {
        event: {
          chapterTitle: "Billing",
          kind: "step-end",
          title: "Open invoice view",
        },
        kind: "event",
        order: 4,
      },
    ],
    narrations: [
      {
        chapterTitle: "Billing",
        audioPath: path.join(projectRoot, ".demohunter", "cache", "narration.mp3"),
        cacheKey: "narration",
        durationMs: 1200,
        text: "Explain the invoice screen",
      },
    ],
  };
}
