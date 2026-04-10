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
            chapterTitle: undefined,
            durationMs: 1200,
            event: {
              chapterTitle: undefined,
              kind: "narrate",
              text: "Narrated step",
            },
            kind: "narration",
            order: 1,
            text: "Narrated step",
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
      record: { showActions: true, showChapters: true },
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
        chapterTitle: "Billing",
        durationMs: 1200,
        event: {
          chapterTitle: "Billing",
          kind: "narrate",
          text: "Explain the invoice screen",
        },
        kind: "narration",
        order: 3,
        text: "Explain the invoice screen",
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
        durationMs: 1200,
        event: {
          chapterTitle: "Billing",
          kind: "narrate",
          text: "Explain the invoice screen",
        },
        kind: "narration",
        order: 3,
        text: "Explain the invoice screen",
      },
    ],
  };
}
