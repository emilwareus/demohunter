import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { prepareOutputDir } from "./prepare-output-dir.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("prepareOutputDir", () => {
  test("creates .demohunter/<tour-id> under the current working directory", async () => {
    const cwd = await makeTempRoot();

    const outputDir = await prepareOutputDir("billing-overview", {
      cwd: () => cwd,
    });

    expect(outputDir).toBe(path.join(cwd, ".demohunter", "billing-overview"));
    expect((await stat(outputDir)).isDirectory()).toBe(true);
  });

  test.each(["Billing-Overview", "../billing-overview", "billing overview"])(
    "rejects unsafe tour id %s",
    async (tourId) => {
      await expect(prepareOutputDir(tourId)).rejects.toThrow(
        "Tour id must be a lowercase filesystem-safe slug",
      );
    },
  );
});

async function makeTempRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-output-dir-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}
