import { describe, expect, mock, test } from "bun:test";

import { runCli } from "./demohunter.js";

describe("runCli", () => {
  test("dispatches init with the force flag", async () => {
    const cacheCommand = mock(async () => {});
    const initCommand = mock(async () => {});
    const generateCommand = mock(async () => {});

    await runCli(["init", "--force"], "/tmp/demo", {
      cacheCommand,
      generateCommand,
      initCommand,
    });

    expect(cacheCommand).not.toHaveBeenCalled();
    expect(initCommand).toHaveBeenCalledWith("/tmp/demo", { force: true });
    expect(generateCommand).not.toHaveBeenCalled();
  });

  test("dispatches generate with the requested tour path", async () => {
    const cacheCommand = mock(async () => {});
    const initCommand = mock(async () => {});
    const generateCommand = mock(async () => {});

    await runCli(["generate", "demos/sample.tour.ts"], "/tmp/demo", {
      cacheCommand,
      generateCommand,
      initCommand,
    });

    expect(cacheCommand).not.toHaveBeenCalled();
    expect(generateCommand).toHaveBeenCalledWith("/tmp/demo", "demos/sample.tour.ts");
    expect(initCommand).not.toHaveBeenCalled();
  });

  test("dispatches cache subcommands with the requested action", async () => {
    const cacheCommand = mock(async () => {});
    const initCommand = mock(async () => {});
    const generateCommand = mock(async () => {});

    await runCli(["cache", "prune"], "/tmp/demo", {
      cacheCommand,
      generateCommand,
      initCommand,
    });

    expect(cacheCommand).toHaveBeenCalledWith("/tmp/demo", { action: "prune" });
    expect(generateCommand).not.toHaveBeenCalled();
    expect(initCommand).not.toHaveBeenCalled();
  });

  test("throws a usage error when generate is missing the tour path", async () => {
    await expect(
      runCli(["generate"], "/tmp/demo", {
        cacheCommand: async () => {},
        generateCommand: async () => {},
        initCommand: async () => {},
      }),
    ).rejects.toThrow("Usage: demohunter generate <tour-file>");
  });

  test("throws a usage error when cache is missing the action", async () => {
    await expect(
      runCli(["cache"], "/tmp/demo", {
        cacheCommand: async () => {},
        generateCommand: async () => {},
        initCommand: async () => {},
      }),
    ).rejects.toThrow("Usage: demohunter cache <list|prune|clear>");
  });

  test("throws a usage error for unknown commands", async () => {
    await expect(
      runCli(["ship-it"], "/tmp/demo", {
        cacheCommand: async () => {},
        generateCommand: async () => {},
        initCommand: async () => {},
      }),
    ).rejects.toThrow("Usage: demohunter <init|generate|cache> [options]");
  });
});
