import { afterEach, describe, expect, test } from "bun:test";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("workspace build contract", () => {
  test("builds the workspace and exposes compiled package entrypoints", async () => {
    await runRepoCommand(["x", "tsc", "-b", "tsconfig.json", "--pretty", "false"]);

    const builtEntryPoints = [
      "packages/sdk/dist/index.js",
      "packages/generator-playwright/dist/index.js",
      "packages/create-demohunter/dist/index.js",
      "packages/cli/dist/bin/demohunter.js",
    ];

    for (const relativePath of builtEntryPoints) {
      await access(path.join(repoRoot, relativePath));
    }

    const exportProbe = await runBunEval(`
      const sdk = await import(${JSON.stringify(pathToFileURL(path.join(repoRoot, "packages/sdk/dist/index.js")).href)});
      const generator = await import(${JSON.stringify(pathToFileURL(path.join(repoRoot, "packages/generator-playwright/dist/index.js")).href)});
      const scaffold = await import(${JSON.stringify(pathToFileURL(path.join(repoRoot, "packages/create-demohunter/dist/index.js")).href)});
      const cli = await import(${JSON.stringify(pathToFileURL(path.join(repoRoot, "packages/cli/dist/bin/demohunter.js")).href)});
      console.log(JSON.stringify({
        sdk: {
          defineConfig: typeof sdk.defineConfig,
          defineTour: typeof sdk.defineTour,
        },
        generator: {
          smokeGenerate: typeof generator.smokeGenerate,
        },
        scaffold: {
          scaffoldStarter: typeof scaffold.scaffoldStarter,
        },
        cli: {
          runCli: typeof cli.runCli,
        },
      }));
    `);

    const exports = JSON.parse(exportProbe.stdout.trim()) as {
      sdk: Record<string, string>;
      generator: Record<string, string>;
      scaffold: Record<string, string>;
      cli: Record<string, string>;
    };

    const sdkDeclarations = await readFile(path.join(repoRoot, "packages/sdk/dist/index.d.ts"), "utf8");

    expect(exports.sdk).toEqual({
      defineConfig: "function",
      defineTour: "function",
    });
    expect(exports.generator).toEqual({
      smokeGenerate: "function",
    });
    expect(exports.scaffold).toEqual({
      scaffoldStarter: "function",
    });
    expect(exports.cli).toEqual({
      runCli: "function",
    });
    expect(sdkDeclarations).toContain("DemoHunterRunContext");
    expect(sdkDeclarations).toContain("WaitForStableOptions");
  });
});

async function runRepoCommand(args: string[]): Promise<void> {
  const result = await spawnCommand([process.execPath, ...args], repoRoot);

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: bun ${args.join(" ")}`);
  }
}

async function runBunEval(script: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return spawnCommand([process.execPath, "--eval", script], await makeTempRoot());
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

async function makeTempRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-build-contract-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}
