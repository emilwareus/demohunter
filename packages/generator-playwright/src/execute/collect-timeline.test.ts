import { describe, expect, mock, test } from "bun:test";
import path from "node:path";

import { collectTimeline } from "./collect-timeline.js";

describe("collectTimeline", () => {
  test("reuses one runtime across goto, setup, run, and teardown while collecting ordered replay entries", async () => {
    const page = {
      goto: mock(async () => {}),
      waitForLoadState: mock(async () => {}),
    };
    const locator = {
      scrollIntoViewIfNeeded: mock(async () => {}),
      waitFor: mock(async () => {}),
    };
    const calls: string[] = [];
    const contexts: object[] = [];
    const resolveNarrationSegment = mock(async () => ({
      audioPath: "/tmp/workspace/.demohunter/cache/narration.mp3",
      cacheKey: "cache-key",
      chapterTitle: "Billing",
      durationMs: 1200,
      text: "Explain the invoice screen",
    }));
    const setup = mock(async (context) => {
      calls.push(`setup:${context.page === page}`);
      contexts.push(context as object);
      (context as Record<string, unknown>).marker = "shared";
    });
    const run = mock(
      async (context) => {
        const { page: runtimePage, chapter, step, narrate, waitForStable, highlight, snapshot, assertVisible } =
          context;

        calls.push(`run:${runtimePage === page}`);
        contexts.push(context as object);
        expect((context as Record<string, unknown>).marker).toBe("shared");
        await chapter("Billing", { id: "billing" });
        await step("Open invoice view", async () => {
          calls.push("step");
          await narrate("Explain the invoice screen", { voice: "marin" });
          await waitForStable({ state: "load", timeoutMs: 2500 });
          await highlight(locator as never, { name: "CTA", paddingPx: 12 });
          await snapshot({ name: "invoice" });
          await assertVisible(locator as never, { timeoutMs: 800 });
        });
      },
    );
    const teardown = mock(async (context) => {
      calls.push(`teardown:${context.page === page}`);
      contexts.push(context as object);
      expect((context as Record<string, unknown>).marker).toBe("shared");
    });

    const timeline = await collectTimeline({
      loadedConfig: createLoadedConfig("/tmp/workspace"),
      page: page as never,
      resolveNarrationSegment,
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
    expect(resolveNarrationSegment).toHaveBeenCalledWith({
      chapterTitle: "Billing",
      kind: "narrate",
      text: "Explain the invoice screen",
      voice: "marin",
    });
    expect(calls).toEqual(["setup:true", "run:true", "step", "teardown:true"]);
    expect(contexts).toHaveLength(3);
    expect(contexts[0]).toBe(contexts[1]);
    expect(contexts[1]).toBe(contexts[2]);
    expect(page.waitForLoadState).toHaveBeenCalledWith("load", { timeout: 2500 });
    expect(locator.waitFor).toHaveBeenCalledTimes(2);
    expect(locator.scrollIntoViewIfNeeded).toHaveBeenCalledTimes(1);
    expect(timeline).toEqual({
      entries: [
        {
          event: {
            chapterTitle: "Billing",
            id: "billing",
            kind: "chapter",
            outputDir: path.join("/tmp/workspace/.demohunter", "billing-overview"),
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
            voice: "marin",
          },
          kind: "narration",
          order: 3,
          segment: {
            audioPath: "/tmp/workspace/.demohunter/cache/narration.mp3",
            cacheKey: "cache-key",
            chapterTitle: "Billing",
            durationMs: 1200,
            text: "Explain the invoice screen",
          },
        },
        {
          event: {
            chapterTitle: "Billing",
            kind: "wait-for-stable",
            state: "load",
            timeoutMs: 2500,
          },
          kind: "event",
          order: 4,
        },
        {
          event: {
            chapterTitle: "Billing",
            kind: "highlight",
            name: "CTA",
            paddingPx: 12,
          },
          kind: "event",
          order: 5,
        },
        {
          event: {
            chapterTitle: "Billing",
            kind: "snapshot",
            name: "invoice",
          },
          kind: "event",
          order: 6,
        },
        {
          event: {
            chapterTitle: "Billing",
            kind: "assert-visible",
            timeoutMs: 800,
          },
          kind: "event",
          order: 7,
        },
        {
          event: {
            chapterTitle: "Billing",
            kind: "step-end",
            title: "Open invoice view",
          },
          kind: "event",
          order: 8,
        },
      ],
      narrations: [
        {
          chapterTitle: "Billing",
          audioPath: "/tmp/workspace/.demohunter/cache/narration.mp3",
          cacheKey: "cache-key",
          durationMs: 1200,
          text: "Explain the invoice screen",
        },
      ],
    });
  });

  test("fails clearly when uncached narration requires OPENAI_API_KEY", async () => {
    const page = {
      goto: mock(async () => {}),
    };

    const originalApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      await expect(
        collectTimeline({
          loadedConfig: createLoadedConfig("/tmp/workspace"),
          page: page as never,
          tourFile: {
            path: "/tmp/workspace/demos/billing.tour.ts",
            tour: {
              id: "billing-overview",
              title: "Billing overview",
              run: async ({ narrate }) => {
                await narrate("Resolve real narration");
              },
            },
          },
        }),
      ).rejects.toThrow(/OPENAI_API_KEY/);
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
    }
  });

  test("still runs teardown when the tour fails and rethrows the primary error", async () => {
    const page = {
      goto: mock(async () => {}),
    };
    const calls: string[] = [];
    const failure = new Error("run failed");

    await expect(
      collectTimeline({
        loadedConfig: createLoadedConfig("/tmp/workspace"),
        page: page as never,
        tourFile: {
          path: "/tmp/workspace/demos/billing.tour.ts",
          tour: {
            id: "billing-overview",
            title: "Billing overview",
            setup: async () => {
              calls.push("setup");
            },
            run: async () => {
              calls.push("run");
              throw failure;
            },
            teardown: async () => {
              calls.push("teardown");
            },
          },
        },
      }),
    ).rejects.toThrow("run failed");

    expect(calls).toEqual(["setup", "run", "teardown"]);
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
