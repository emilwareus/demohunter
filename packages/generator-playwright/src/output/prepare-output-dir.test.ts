import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { prepareOutputDir } from "./prepare-output-dir.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("prepareOutputDir", () => {
  test("creates <output-root>/<tour-id>", async () => {
    const outputRoot = path.join(await makeTempRoot(), ".demohunter");

    const outputDir = await prepareOutputDir("billing-overview", outputRoot);

    expect(outputDir).toBe(path.join(outputRoot, "billing-overview"));
    expect((await stat(outputDir)).isDirectory()).toBe(true);
  });

  test("writes a self-contained .gitignore at the output root on first run", async () => {
    const outputRoot = path.join(await makeTempRoot(), ".demohunter");

    await prepareOutputDir("billing-overview", outputRoot);

    const gitignorePath = path.join(outputRoot, ".gitignore");
    const gitignore = await readFile(gitignorePath, "utf8");
    expect(gitignore).toContain("*");
    expect(gitignore).toContain("!.gitignore");
    expect(gitignore).toMatch(/Managed by DemoHunter/);
  });

  test("does not overwrite an existing .gitignore at the output root", async () => {
    const outputRoot = path.join(await makeTempRoot(), ".demohunter");
    const existing = "# User edited\n*\nkeep-me\n";

    await prepareOutputDir("first-tour", outputRoot);
    await writeFile(path.join(outputRoot, ".gitignore"), existing, "utf8");

    await prepareOutputDir("second-tour", outputRoot);

    const gitignore = await readFile(path.join(outputRoot, ".gitignore"), "utf8");
    expect(gitignore).toBe(existing);
  });

  test.each(["Billing-Overview", "../billing-overview", "billing overview"])(
    "rejects unsafe tour id %s",
    async (tourId) => {
      await expect(prepareOutputDir(tourId, "/tmp/unused-root")).rejects.toThrow(
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
