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
    const resolveNarrationDuration = mock(async () => 1200);
    const setup = mock(async (context) => {
      calls.push(`setup:${context.page === page}`);
      contexts.push(context as object);
      (context as Record<string, unknown>).marker = "shared";
    });
    const run = mock(
      async ({ page: runtimePage, chapter, step, narrate, waitForStable, highlight, snapshot, assertVisible, marker }) => {
        calls.push(`run:${runtimePage === page}`);
        contexts.push(arguments[0] as object);
        expect(marker).toBe("shared");
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
      resolveNarrationDuration,
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
    expect(resolveNarrationDuration).toHaveBeenCalledWith({
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
          chapterTitle: "Billing",
          durationMs: 1200,
          event: {
            chapterTitle: "Billing",
            kind: "narrate",
            text: "Explain the invoice screen",
            voice: "marin",
          },
          kind: "narration",
          order: 3,
          text: "Explain the invoice screen",
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
          durationMs: 1200,
          event: {
            chapterTitle: "Billing",
            kind: "narrate",
            text: "Explain the invoice screen",
            voice: "marin",
          },
          kind: "narration",
          order: 3,
          text: "Explain the invoice screen",
        },
      ],
    });
  });

  test("uses a deterministic local 0ms narration duration when no resolver is provided", async () => {
    const page = {
      goto: mock(async () => {}),
    };

    const timeline = await collectTimeline({
      loadedConfig: createLoadedConfig("/tmp/workspace"),
      page: page as never,
      tourFile: {
        path: "/tmp/workspace/demos/billing.tour.ts",
        tour: {
          id: "billing-overview",
          title: "Billing overview",
          run: async ({ narrate }) => {
            await narrate("Silent pass 1 narration");
          },
        },
      },
    });

    expect(page.goto).toHaveBeenCalledWith("http://localhost:3000/");
    expect(timeline.narrations).toEqual([
      {
        chapterTitle: undefined,
        durationMs: 0,
        event: {
          chapterTitle: undefined,
          kind: "narrate",
          text: "Silent pass 1 narration",
        },
        kind: "narration",
        order: 1,
        text: "Silent pass 1 narration",
      },
    ]);
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
