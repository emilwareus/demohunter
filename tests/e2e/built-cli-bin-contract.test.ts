import { afterEach, describe, expect, test } from "bun:test";
import { access, cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const builtCliEntryPoint = path.join(repoRoot, "packages/cli/dist/bin/demohunter.js");
const generationFixturePath = path.join(repoRoot, "tests/fixtures/tours/phase-03-generation.tour.ts");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("built cli bin contract", () => {
  test(
    "runs init and generate from compiled dist output",
    async () => {
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

      const outputDir = path.join(cwd, ".demohunter/sample-smoke");
      const videoPath = path.join(outputDir, "video.mp4");
      const chaptersPath = path.join(outputDir, "chapters.json");

      await access(videoPath);
      await access(chaptersPath);
      await expect(access(path.join(outputDir, "manifest.json"))).rejects.toThrow();
      await expect(access(path.join(outputDir, "captions.srt"))).rejects.toThrow();
      expect((await readdir(outputDir)).sort()).toEqual(["chapters.json", "video.mp4"]);
    },
    30_000,
  );

  test(
    "runs a representative phase 3 fixture from a fresh temp repo through compiled dist output",
    async () => {
      await runRepoCommand(["x", "tsc", "-b", "tsconfig.json", "--pretty", "false"]);

      const cwd = await makeTempProject();
      const tourPath = "demos/phase-03-generation.tour.ts";

      await writeGenerationPackageJson(cwd);
      await writeGenerationConfig(cwd);
      await writeGenerationSite(cwd);
      await mkdir(path.join(cwd, "demos"), { recursive: true });
      await cp(generationFixturePath, path.join(cwd, tourPath));

      const installResult = await spawnCommand([process.execPath, "install"], cwd);
      expect(installResult.exitCode).toBe(0);

      const generateResult = await spawnCommand([process.execPath, builtCliEntryPoint, "generate", tourPath], cwd);
      expect(generateResult.exitCode).toBe(0);

      const outputDir = path.join(cwd, ".demohunter/phase-03-generation");
      const chapters = JSON.parse(await readFile(path.join(outputDir, "chapters.json"), "utf8")) as Array<{
        startMs: number;
        title: string;
      }>;

      await access(path.join(outputDir, "video.mp4"));
      expect(chapters).toEqual([
        { startMs: 0, title: "Workspace Overview" },
        { startMs: 300, title: "Payment History" },
      ]);
      expect((await readdir(outputDir)).sort()).toEqual(["chapters.json", "video.mp4"]);
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

async function writeGenerationPackageJson(cwd: string): Promise<void> {
  await writeFile(
    path.join(cwd, "package.json"),
    `${JSON.stringify(
      {
        name: "phase-03-built-generation-contract",
        private: true,
        type: "module",
        dependencies: {
          "@demohunter/sdk": `file:${path.join(repoRoot, "packages/sdk")}`,
          playwright: ">=1.59",
        },
      },
      null,
      2,
    )}\n`,
  );
}

async function writeGenerationConfig(cwd: string): Promise<void> {
  const sitePath = path.join(cwd, "site", "index.html");

  await writeFile(
    path.join(cwd, "demohunter.config.ts"),
    `export default {
  baseURL: ${JSON.stringify(pathToFileURL(sitePath).href)},
};
`,
  );
}

async function writeGenerationSite(cwd: string): Promise<void> {
  const siteDir = path.join(cwd, "site");
  await mkdir(siteDir, { recursive: true });
  await writeFile(
    path.join(siteDir, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Phase 3 Generation Contract</title>
  </head>
  <body>
    <main>
      <form id="login-form">
        <label>
          Email
          <input aria-label="Email" />
        </label>
        <label>
          Password
          <input aria-label="Password" type="password" />
        </label>
        <button type="button" id="sign-in">Sign in</button>
      </form>

      <section id="dashboard" hidden>
        <h1>Workspace home</h1>
        <button type="button" id="open-billing-workspace">Open billing workspace</button>
        <section id="billing-workspace" hidden>
          <h2>Billing workspace</h2>
          <button type="button" id="reveal-payment-history">Reveal payment history</button>
          <section id="payment-history" hidden>
            <h2>Payment history</h2>
            <ul>
              <li>Invoice #1001</li>
              <li>Invoice #1002</li>
            </ul>
          </section>
        </section>
        <button type="button" id="sign-out">Sign out</button>
      </section>
    </main>

    <script type="module">
      const loginForm = document.querySelector("#login-form");
      const dashboard = document.querySelector("#dashboard");
      const billingWorkspace = document.querySelector("#billing-workspace");
      const paymentHistory = document.querySelector("#payment-history");

      document.querySelector("#sign-in")?.addEventListener("click", () => {
        loginForm.hidden = true;
        dashboard.hidden = false;
      });

      document.querySelector("#open-billing-workspace")?.addEventListener("click", () => {
        billingWorkspace.hidden = false;
      });

      document.querySelector("#reveal-payment-history")?.addEventListener("click", () => {
        paymentHistory.hidden = false;
      });

      document.querySelector("#sign-out")?.addEventListener("click", () => {
        paymentHistory.hidden = true;
        billingWorkspace.hidden = true;
        dashboard.hidden = true;
        loginForm.hidden = false;
      });
    </script>
  </body>
</html>
`,
  );
}
