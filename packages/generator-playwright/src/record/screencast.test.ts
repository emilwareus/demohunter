import { describe, expect, mock, test } from "bun:test";

import { startScreencast, stopScreencast } from "./screencast.js";

describe("screencast", () => {
  test("starts Playwright screencast with the temp path and viewport size", async () => {
    const start = mock(async () => {});
    const showActions = mock(async () => {});
    const page = {
      screencast: {
        showActions,
        start,
        stop: mock(async () => {}),
      },
    };

    await startScreencast({
      outputPath: "/tmp/demohunter/demo.webm",
      page: page as never,
      showActions: false,
      viewport: { height: 720, width: 1280 },
    });

    expect(start).toHaveBeenCalledWith({
      path: "/tmp/demohunter/demo.webm",
      size: { height: 720, width: 1280 },
    });
    expect(showActions).not.toHaveBeenCalled();
  });

  test("enables brief action annotations only when showActions is true", async () => {
    const start = mock(async () => {});
    const showActions = mock(async () => {});
    const page = {
      screencast: {
        showActions,
        start,
        stop: mock(async () => {}),
      },
    };

    await startScreencast({
      outputPath: "/tmp/demohunter/demo.webm",
      page: page as never,
      showActions: true,
      viewport: { height: 720, width: 1280 },
    });

    expect(showActions).toHaveBeenCalledWith({
      duration: 500,
      position: "top-right",
    });
  });

  test("preserves the primary replay failure instead of overwriting it with a stop error", async () => {
    const primaryError = new Error("recorded replay diverged");
    const stop = mock(async () => {
      throw new Error("stop failed");
    });
    const page = {
      screencast: {
        showActions: mock(async () => {}),
        start: mock(async () => {}),
        stop,
      },
    };

    await expect(stopScreencast({ page: page as never, primaryError })).rejects.toBe(primaryError);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
