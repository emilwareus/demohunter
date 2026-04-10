import { afterEach, describe, expect, test } from "bun:test";
import { access, cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = path.join(repoRoot, "packages/cli/src/bin/demohunter.ts");
const generationFixturePath = path.join(repoRoot, "tests/fixtures/tours/phase-03-generation.tour.ts");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("generation engine contract", () => {
  test(
    "runs a representative phase 3 tour through the source cli and writes the baseline output set",
    async () => {
      const cwd = await makeTempProject();
      const tourPath = "demos/phase-03-generation.tour.ts";

      await writeTempRepoPackageJson(cwd);
      await writeTempRepoConfig(cwd);
      await writeTempRepoSite(cwd);
      await mkdir(path.join(cwd, "demos"), { recursive: true });
      await cp(generationFixturePath, path.join(cwd, tourPath));

      const installResult = await spawnCommand([process.execPath, "install"], cwd);
      expect(installResult.exitCode).toBe(0);

      const generateResult = await spawnCommand([process.execPath, cliEntryPoint, "generate", tourPath], cwd);
      expect(generateResult.exitCode).toBe(0);

      const outputDir = path.join(cwd, ".demohunter/phase-03-generation");
      const chaptersPath = path.join(outputDir, "chapters.json");
      const videoPath = path.join(outputDir, "video.mp4");

      await access(videoPath);
      await access(chaptersPath);
      await expect(access(path.join(cwd, ".demohunter/phase-03-generation.recording.webm"))).rejects.toThrow();
      await expect(access(path.join(outputDir, "manifest.json"))).rejects.toThrow();
      await expect(access(path.join(outputDir, "captions.srt"))).rejects.toThrow();
      await expect(access(path.join(outputDir, "captions.vtt"))).rejects.toThrow();

      const chapters = JSON.parse(await readFile(chaptersPath, "utf8")) as Array<{
        startMs: number;
        title: string;
      }>;

      expect(chapters).toHaveLength(2);
      expect(chapters.map((chapter) => chapter.title)).toEqual(["Workspace Overview", "Payment History"]);
      expect(chapters[0]?.startMs).toBeGreaterThanOrEqual(0);
      expect(chapters[1]?.startMs).toBeGreaterThan(chapters[0]?.startMs ?? -1);
      expect((await readdir(outputDir)).sort()).toEqual(["chapters.json", "video.mp4"]);
    },
    20_000,
  );

  test(
    "fails clearly on recorded-pass divergence and avoids false-success artifacts",
    async () => {
      const cwd = await makeTempProject();
      const tourPath = "demos/divergent-phase-03.tour.ts";

      await writeTempRepoPackageJson(cwd);
      await writeTempRepoConfig(cwd);
      await writeTempRepoSite(cwd);
      await mkdir(path.join(cwd, "demos"), { recursive: true });
      await writeFile(path.join(cwd, tourPath), createDivergentTourFixture());

      const installResult = await spawnCommand([process.execPath, "install"], cwd);
      expect(installResult.exitCode).toBe(0);

      const generateResult = await spawnCommand([process.execPath, cliEntryPoint, "generate", tourPath], cwd);
      expect(generateResult.exitCode).toBe(1);
      expect(generateResult.stderr).toContain("Recorded pass diverged");

      const outputDir = path.join(cwd, ".demohunter/divergent-phase-03");
      await expect(access(path.join(outputDir, "video.mp4"))).rejects.toThrow();
      await expect(access(path.join(outputDir, "chapters.json"))).rejects.toThrow();
    },
    20_000,
  );

  test(
    "rerunning the same tour with a different record format leaves only the selected video artifact",
    async () => {
      const cwd = await makeTempProject();
      const tourPath = "demos/phase-03-generation.tour.ts";

      await writeTempRepoPackageJson(cwd);
      await writeTempRepoConfig(cwd);
      await writeTempRepoSite(cwd);
      await mkdir(path.join(cwd, "demos"), { recursive: true });
      await cp(generationFixturePath, path.join(cwd, tourPath));

      const installResult = await spawnCommand([process.execPath, "install"], cwd);
      expect(installResult.exitCode).toBe(0);

      const firstGenerate = await spawnCommand([process.execPath, cliEntryPoint, "generate", tourPath], cwd);
      expect(firstGenerate.exitCode).toBe(0);

      await writeTempRepoConfig(cwd, { format: "webm" });

      const secondGenerate = await spawnCommand([process.execPath, cliEntryPoint, "generate", tourPath], cwd);
      expect(secondGenerate.exitCode).toBe(0);

      const outputDir = path.join(cwd, ".demohunter/phase-03-generation");
      await access(path.join(outputDir, "video.webm"));
      await expect(access(path.join(outputDir, "video.mp4"))).rejects.toThrow();
      expect((await readdir(outputDir)).sort()).toEqual(["chapters.json", "video.webm"]);
    },
    20_000,
  );
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-generation-contract-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function writeTempRepoPackageJson(cwd: string): Promise<void> {
  await writeFile(
    path.join(cwd, "package.json"),
    `${JSON.stringify(
      {
        name: "phase-03-generation-contract",
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

async function writeTempRepoConfig(
  cwd: string,
  options: {
    format?: "mp4" | "webm";
  } = {},
): Promise<void> {
  const sitePath = path.join(cwd, "site", "index.html");
  const recordBlock = options.format === undefined ? "" : `  record: { format: ${JSON.stringify(options.format)} },\n`;

  await writeFile(
    path.join(cwd, "demohunter.config.ts"),
    `export default {
  baseURL: ${JSON.stringify(pathToFileURL(sitePath).href)},
${recordBlock}};
`,
  );
}

async function writeTempRepoSite(cwd: string): Promise<void> {
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

function createDivergentTourFixture(): string {
  return `import { defineTour } from "@demohunter/sdk";

let runCount = 0;

export default defineTour({
  id: "divergent-phase-03",
  title: "Divergent generation contract",
  async setup({ page }) {
    await page.getByLabel("Email").fill("demo@demohunter.dev");
    await page.getByLabel("Password").fill("demo-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("heading", { name: "Workspace home" }).waitFor();
  },
  async run({ chapter, step, narrate }) {
    runCount += 1;
    await chapter(runCount === 1 ? "Deterministic chapter" : "Diverged chapter");
    await step("Open the billing workspace", async () => {
      await narrate("This fixture intentionally diverges on the recorded pass.");
    });
  },
});
`;
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
