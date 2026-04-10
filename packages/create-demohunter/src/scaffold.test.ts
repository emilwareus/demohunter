import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { STARTER_TARGETS, scaffoldStarter } from "./scaffold.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("scaffoldStarter", () => {
  test("writes only the expected starter assets", async () => {
    const cwd = await makeTempProject();

    const result = await scaffoldStarter(cwd);

    expect(result.createdFiles).toEqual(STARTER_TARGETS.map((relativePath) => path.join(cwd, relativePath)));
    expect(await listFiles(cwd)).toEqual([...STARTER_TARGETS].sort());
  });

  test("refuses to overwrite existing files without force", async () => {
    const cwd = await makeTempProject();

    await scaffoldStarter(cwd);

    await expect(scaffoldStarter(cwd)).rejects.toThrow(
      `Refusing to overwrite existing file: ${path.join(cwd, "demohunter.config.ts")}`,
    );
  });

  test("failed reruns leave the repo file set and contents unchanged", async () => {
    const cwd = await makeTempProject();
    await writeFile(path.join(cwd, "README.md"), "keep me\n");

    await scaffoldStarter(cwd);

    const beforeFiles = await listFiles(cwd);
    const beforeContents = await readFiles(cwd, beforeFiles);

    await expect(scaffoldStarter(cwd)).rejects.toThrow(
      `Refusing to overwrite existing file: ${path.join(cwd, "demohunter.config.ts")}`,
    );

    const afterFiles = await listFiles(cwd);
    const afterContents = await readFiles(cwd, afterFiles);

    expect(afterFiles).toEqual(beforeFiles);
    expect(afterContents).toEqual(beforeContents);
  });
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-scaffold-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function listFiles(cwd: string): Promise<string[]> {
  const files = await Array.fromAsync(new Bun.Glob("**/*").scan({ cwd, onlyFiles: true }));
  return files.sort();
}

async function readFiles(cwd: string, relativeFiles: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    relativeFiles.map(async (relativePath) => [
      relativePath,
      await readFile(path.join(cwd, relativePath), "utf8"),
    ]),
  );

  return Object.fromEntries(entries);
}
