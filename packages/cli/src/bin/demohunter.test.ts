import { describe, expect, mock, test } from "bun:test";

import { runCli } from "./demohunter.js";

describe("runCli", () => {
  test("dispatches init with the force flag", async () => {
    const initCommand = mock(async () => {});
    const generateCommand = mock(async () => {});

    await runCli(["init", "--force"], "/tmp/demo", {
      generateCommand,
      initCommand,
    });

    expect(initCommand).toHaveBeenCalledWith("/tmp/demo", { force: true });
    expect(generateCommand).not.toHaveBeenCalled();
  });

  test("dispatches generate with the requested tour path", async () => {
    const initCommand = mock(async () => {});
    const generateCommand = mock(async () => {});

    await runCli(["generate", "demos/sample.tour.ts"], "/tmp/demo", {
      generateCommand,
      initCommand,
    });

    expect(generateCommand).toHaveBeenCalledWith("/tmp/demo", "demos/sample.tour.ts");
    expect(initCommand).not.toHaveBeenCalled();
  });

  test("throws a usage error when generate is missing the tour path", async () => {
    await expect(
      runCli(["generate"], "/tmp/demo", {
        generateCommand: async () => {},
        initCommand: async () => {},
      }),
    ).rejects.toThrow("Usage: demohunter generate <tour-file>");
  });

  test("throws a usage error for unknown commands", async () => {
    await expect(
      runCli(["ship-it"], "/tmp/demo", {
        generateCommand: async () => {},
        initCommand: async () => {},
      }),
    ).rejects.toThrow("Usage: demohunter <init|generate> [options]");
  });
});
