import { describe, expect, mock, test } from "bun:test";

import { createSmokeTourRuntime } from "./create-smoke-tour-runtime.js";

describe("createSmokeTourRuntime", () => {
  test("records chapter markers and runs steps inline", async () => {
    const events: unknown[] = [];
    const runtime = createSmokeTourRuntime({
      page: {} as never,
      outputDir: "/tmp/demohunter-output",
      onEvent: (event) => {
        events.push(event);
      },
    });

    await runtime.chapter("Billing");
    const result = await runtime.step("Open invoice view", async () => "step-result");

    expect(result).toBe("step-result");
    expect(events).toEqual([
      {
        chapterTitle: "Billing",
        kind: "chapter",
        outputDir: "/tmp/demohunter-output",
        title: "Billing",
      },
      {
        chapterTitle: "Billing",
        kind: "step-start",
        title: "Open invoice view",
      },
      {
        chapterTitle: "Billing",
        kind: "step-end",
        title: "Open invoice view",
      },
    ]);
  });

  test("uses Playwright-native methods for stability, highlighting, snapshots, and visibility", async () => {
    const events: unknown[] = [];
    const waitForLoadState = mock(async () => {});
    const page = {
      waitForLoadState,
    } as never;
    const waitFor = mock(async () => {});
    const scrollIntoViewIfNeeded = mock(async () => {});
    const locator = {
      scrollIntoViewIfNeeded,
      waitFor,
    } as never;
    const runtime = createSmokeTourRuntime({
      page,
      outputDir: "/tmp/demohunter-output",
      onEvent: (event) => {
        events.push(event);
      },
    });

    await runtime.waitForStable({ state: "load", timeoutMs: 2500 });
    await runtime.highlight(locator, { name: "CTA", paddingPx: 12 });
    await runtime.snapshot({ name: "hero" });
    await runtime.assertVisible(locator, { timeoutMs: 800 });
    await runtime.narrate("Describe the screen", { voice: "marin" });

    expect(waitForLoadState).toHaveBeenCalledWith("load", { timeout: 2500 });
    expect(waitFor).toHaveBeenCalledTimes(2);
    expect(waitFor.mock.calls[0]).toEqual([{ state: "visible" }]);
    expect(waitFor.mock.calls[1]).toEqual([{ state: "visible", timeout: 800 }]);
    expect(scrollIntoViewIfNeeded).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      {
        kind: "wait-for-stable",
        state: "load",
        timeoutMs: 2500,
      },
      {
        kind: "highlight",
        name: "CTA",
        paddingPx: 12,
      },
      {
        kind: "snapshot",
        name: "hero",
      },
      {
        kind: "assert-visible",
        timeoutMs: 800,
      },
      {
        kind: "narrate",
        text: "Describe the screen",
        voice: "marin",
      },
    ]);
  });
});
