import { afterEach, describe, expect, test } from "bun:test";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const builtCliEntryPoint = path.join(repoRoot, "packages/cli/dist/bin/demohunter.js");
const authoringFixturePath = path.join(repoRoot, "tests/fixtures/tours/phase-02-authoring.tour.ts");
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

  test("runs a defineTour fixture from a fresh temp repo through compiled dist output", async () => {
    await runRepoCommand(["x", "tsc", "-b", "tsconfig.json", "--pretty", "false"]);

    const cwd = await makeTempProject();
    const tourPath = "demos/phase-02-authoring.tour.ts";

    await writeAuthoringPackageJson(cwd);
    await writeAuthoringConfig(cwd);
    await writeAuthoringSite(cwd);
    await mkdir(path.join(cwd, "demos"), { recursive: true });
    await cp(authoringFixturePath, path.join(cwd, tourPath));

    const installResult = await spawnCommand([process.execPath, "install"], cwd);
    expect(installResult.exitCode).toBe(0);

    const generateResult = await spawnCommand([process.execPath, builtCliEntryPoint, "generate", tourPath], cwd);
    expect(generateResult.exitCode).toBe(0);

    const artifactPath = path.join(cwd, ".demohunter/phase-02-authoring/smoke-run.json");
    const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as {
      status: string;
      tourId: string;
      browser: string;
    };

    expect(artifact).toMatchObject({
      status: "ok",
      tourId: "phase-02-authoring",
      browser: "chromium",
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

async function writeAuthoringPackageJson(cwd: string): Promise<void> {
  await writeFile(
    path.join(cwd, "package.json"),
    `${JSON.stringify(
      {
        name: "phase-02-built-authoring-contract",
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

async function writeAuthoringConfig(cwd: string): Promise<void> {
  const sitePath = path.join(cwd, "site", "index.html");

  await writeFile(
    path.join(cwd, "demohunter.config.ts"),
    `export default {
  baseURL: ${JSON.stringify(pathToFileURL(sitePath).href)},
};
`,
  );
}

async function writeAuthoringSite(cwd: string): Promise<void> {
  const siteDir = path.join(cwd, "site");
  await mkdir(siteDir, { recursive: true });
  await writeFile(
    path.join(siteDir, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Phase 2 Authoring Contract</title>
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
        <button type="button" id="open-settings">Open settings</button>
        <section id="settings-panel" hidden>
          <h2>Workspace Settings</h2>
          <button type="button" id="save-settings">Save settings</button>
          <p id="settings-status" hidden>Settings saved</p>
        </section>
        <button type="button" id="sign-out">Sign out</button>
      </section>
    </main>

    <script type="module">
      const loginForm = document.querySelector("#login-form");
      const dashboard = document.querySelector("#dashboard");
      const settingsPanel = document.querySelector("#settings-panel");
      const settingsStatus = document.querySelector("#settings-status");

      document.querySelector("#sign-in")?.addEventListener("click", () => {
        loginForm.hidden = true;
        dashboard.hidden = false;
      });

      document.querySelector("#open-settings")?.addEventListener("click", () => {
        settingsPanel.hidden = false;
      });

      document.querySelector("#save-settings")?.addEventListener("click", () => {
        settingsStatus.hidden = false;
      });

      document.querySelector("#sign-out")?.addEventListener("click", () => {
        settingsPanel.hidden = true;
        settingsStatus.hidden = true;
        dashboard.hidden = true;
        loginForm.hidden = false;
      });
    </script>
  </body>
</html>
`,
  );
}
