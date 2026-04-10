import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const tempRoots: string[] = [];
const cliEntryPoint = "/Users/emilwareus/Development/demohunter/packages/cli/src/bin/demohunter.ts";

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("init to generate smoke flow", () => {
  test("scaffolds safely and writes the smoke artifact in a temp repo", async () => {
    const cwd = await makeTempProject();

    const firstInit = await runCli(cwd, ["init"]);
    expect(firstInit.exitCode).toBe(0);
    expect(await listFiles(cwd)).toEqual([
      "demohunter.config.ts",
      "demos/sample-site/index.html",
      "demos/sample.tour.ts",
    ]);

    const scaffoldedTour = await readFile(path.join(cwd, "demos/sample.tour.ts"), "utf8");
    expect(scaffoldedTour).toContain("export default {");
    expect(scaffoldedTour).not.toContain("defineTour(");

    const beforeRerun = await listFiles(cwd);
    const effectiveCwd = await realpath(cwd);
    const secondInit = await runCli(cwd, ["init"]);

    expect(secondInit.exitCode).toBe(1);
    expect(secondInit.stderr.trim()).toContain(
      `Refusing to overwrite existing file: ${path.join(effectiveCwd, "demohunter.config.ts")}`,
    );
    expect(await listFiles(cwd)).toEqual(beforeRerun);

    const generate = await runCli(cwd, ["generate", "demos/sample.tour.ts"]);
    expect(generate.exitCode).toBe(0);

    const artifactPath = path.join(cwd, ".demohunter/sample-smoke/smoke-run.json");
    const artifact = JSON.parse(await readFile(artifactPath, "utf8"));

    expect(artifact.status).toBe("ok");
    expect(artifact.tourId).toBe("sample-smoke");
  });
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-e2e-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function listFiles(cwd: string): Promise<string[]> {
  const results = await Array.fromAsync(new Bun.Glob("**/*").scan({ cwd, onlyFiles: true }));
  return results.sort();
}

async function runCli(cwd: string, args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const processResult = Bun.spawn({
    cmd: [process.execPath, cliEntryPoint, ...args],
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    processResult.exited,
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
  ]);

  return { exitCode, stdout, stderr };
}
