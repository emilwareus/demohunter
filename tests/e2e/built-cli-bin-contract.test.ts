import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const builtCliEntryPoint = path.join(repoRoot, "packages/cli/dist/bin/demohunter.js");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("built cli bin contract", () => {
  test("runs init and generate from compiled dist output", async () => {
    await runRepoCommand(["x", "tsc", "-b", "tsconfig.json", "--pretty", "false"]);

    const cwd = await makeTempProject();

    const initResult = await spawnCommand([process.execPath, builtCliEntryPoint, "init"], cwd);
    expect(initResult.exitCode).toBe(0);
    expect(await listFiles(cwd)).toEqual([
      "demohunter.config.ts",
      "demos/sample-site/index.html",
      "demos/sample.tour.ts",
    ]);

    const generateResult = await spawnCommand(
      [process.execPath, builtCliEntryPoint, "generate", "demos/sample.tour.ts"],
      cwd,
    );
    expect(generateResult.exitCode).toBe(0);

    const artifactPath = path.join(cwd, ".demohunter/sample-smoke/smoke-run.json");
    const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as {
      status: string;
      tourId: string;
      browser: string;
      viewport: { width: number; height: number };
    };

    expect(artifact).toMatchObject({
      status: "ok",
      tourId: "sample-smoke",
      browser: "chromium",
      viewport: {
        width: 1440,
        height: 900,
      },
    });
  });
});

async function runRepoCommand(args: string[]): Promise<void> {
  const result = await spawnCommand([process.execPath, ...args], repoRoot);

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: bun ${args.join(" ")}`);
  }
}

async function spawnCommand(
  cmd: string[],
  cwd: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const processResult = Bun.spawn({
    cmd,
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

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-built-bin-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function listFiles(cwd: string): Promise<string[]> {
  const results = await Array.fromAsync(new Bun.Glob("**/*").scan({ cwd, onlyFiles: true }));
  return results.sort();
}
