import { describe, expect, mock, test } from "bun:test";

import { applyHighlightVisual, clearHighlightVisual } from "./highlight-visual.js";

function createWaitForTimeout() {
  const calls: number[] = [];
  const waitForTimeout = mock(async (_page: unknown, durationMs: number) => {
    calls.push(durationMs);
  });

  return { calls, waitForTimeout: waitForTimeout as never };
}

describe("applyHighlightVisual", () => {
  test("draws a ring without Playwright selector labels and clears it after the hold", async () => {
    const evaluateArgs: unknown[] = [];
    const highlight = mock(async () => {});
    const hideHighlight = mock(async () => {});
    const evaluate = mock(async (_fn: unknown, arg?: unknown) => {
      evaluateArgs.push(arg);
    });
    const page = { evaluate, hideHighlight };
    const target = {
      boundingBox: mock(async () => ({ x: 30, y: 40, width: 200, height: 60 })),
      highlight,
    };
    const { calls, waitForTimeout } = createWaitForTimeout();

    await applyHighlightVisual({
      page: page as never,
      target: target as never,
      style: "ring",
      paddingPx: 8,
      durationMs: 800,
      waitForTimeout,
    });

    expect(highlight).not.toHaveBeenCalled();
    expect(calls).toEqual([800]);
    // One evaluate clears the previous highlight, one shows the ring, one clears it afterwards.
    expect(evaluate.mock.calls.length).toBe(3);
    expect(evaluateArgs).toContainEqual({ x: 30, y: 40, width: 200, height: 60, padding: 8 });
  });

  test("renders a spotlight from the bounding box and clears it after the hold", async () => {
    const evaluateArgs: unknown[] = [];
    const evaluate = mock(async (_fn: unknown, arg?: unknown) => {
      evaluateArgs.push(arg);
    });
    const page = { evaluate, hideHighlight: mock(async () => {}) };
    const target = {
      boundingBox: mock(async () => ({ x: 10, y: 20, width: 100, height: 40 })),
      highlight: mock(async () => {}),
    };
    const { calls, waitForTimeout } = createWaitForTimeout();

    await applyHighlightVisual({
      page: page as never,
      target: target as never,
      style: "spotlight",
      paddingPx: 12,
      durationMs: 1200,
      waitForTimeout,
    });

    expect(target.highlight).not.toHaveBeenCalled();
    expect(calls).toEqual([1200]);
    // One evaluate clears the previous highlight, one shows the spotlight, one clears it afterwards.
    expect(evaluate.mock.calls.length).toBe(3);
    expect(evaluateArgs).toContainEqual({ x: 10, y: 20, width: 100, height: 40, padding: 12 });
  });

  test("skips the spotlight gracefully when the bounding box is null", async () => {
    const evaluate = mock(async () => {});
    const page = { evaluate, hideHighlight: mock(async () => {}) };
    const target = {
      boundingBox: mock(async () => null),
      highlight: mock(async () => {}),
    };
    const { calls, waitForTimeout } = createWaitForTimeout();

    await applyHighlightVisual({
      page: page as never,
      target: target as never,
      style: "spotlight",
      paddingPx: 8,
      durationMs: 800,
      waitForTimeout,
    });

    // Only the initial clear evaluate runs; no show/clear highlight and no hold.
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([]);
  });
});

describe("clearHighlightVisual", () => {
  test("hides the Playwright ring and clears the spotlight overlay", async () => {
    const hideHighlight = mock(async () => {});
    const evaluate = mock(async () => {});

    await clearHighlightVisual({ evaluate, hideHighlight } as never);

    expect(hideHighlight).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledTimes(1);
  });
});
