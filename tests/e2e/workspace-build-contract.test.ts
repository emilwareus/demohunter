import { afterEach, describe, expect, test } from "bun:test";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("workspace build contract", () => {
  test(
    "builds the workspace and exposes a single published demohunter package",
    async () => {
      await runRepoCommand(["run", "build"]);

      const builtEntryPoints = [
        "packages/cli/dist/index.js",
        "packages/cli/dist/index.d.ts",
        "packages/cli/dist/bin/demohunter.js",
        "packages/cli/dist/bin/demohunter.d.ts",
        "packages/cli/templates/starter/demohunter.config.ts",
        "packages/cli/templates/starter/demos/sample.tour.ts",
        "packages/cli/templates/starter/demos/sample-site/index.html",
      ];

      for (const relativePath of builtEntryPoints) {
        await access(path.join(repoRoot, relativePath));
      }

      const exportProbe = await runBunEval(`
      const demohunter = await import(${JSON.stringify(pathToFileURL(path.join(repoRoot, "packages/cli/dist/index.js")).href)});
      const cli = await import(${JSON.stringify(pathToFileURL(path.join(repoRoot, "packages/cli/dist/bin/demohunter.js")).href)});
      console.log(JSON.stringify({
        demohunter: {
          defineConfig: typeof demohunter.defineConfig,
          defineTour: typeof demohunter.defineTour,
          DEFAULT_DEMOHUNTER_CONFIG: typeof demohunter.DEFAULT_DEMOHUNTER_CONFIG,
        },
        cli: {
          runCli: typeof cli.runCli,
        },
      }));
    `);

      const exports = JSON.parse(exportProbe.stdout.trim()) as {
        demohunter: Record<string, string>;
        cli: Record<string, string>;
      };

      expect(exports.demohunter).toEqual({
        defineConfig: "function",
        defineTour: "function",
        DEFAULT_DEMOHUNTER_CONFIG: "object",
      });
      expect(exports.cli).toEqual({
        runCli: "function",
      });

      const declarations = await readFile(path.join(repoRoot, "packages/cli/dist/index.d.ts"), "utf8");
      expect(declarations).toContain("DemoHunterRunContext");
      expect(declarations).toContain("WaitForStableOptions");
    },
    30_000,
  );
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
