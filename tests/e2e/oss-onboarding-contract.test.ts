import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = path.join(repoRoot, "packages/cli/src/bin/demohunter.ts");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("oss onboarding contract", () => {
  test("keeps the public docs aligned around one OSS adoption path", async () => {
    const [readme, gettingStarted, troubleshooting] = await Promise.all([
      readFile(path.join(repoRoot, "README.md"), "utf8"),
      readFile(path.join(repoRoot, "docs/getting-started.md"), "utf8"),
      readFile(path.join(repoRoot, "docs/troubleshooting.md"), "utf8"),
    ]);

    expect(readme).toContain("bun x playwright install chromium");
    expect(readme).toContain("examples/vite-demo");
    expect(readme).toContain("skills/demohunter");
    expect(readme).toContain("does not start your app for you");
    expect(gettingStarted).toContain("Start your app yourself before generation.");
    expect(gettingStarted).toContain("bun x demohunter init");
    expect(gettingStarted).toContain("bun run --cwd examples/nextjs-demo generate");
    expect(troubleshooting).toContain("OPENAI_API_KEY");
    expect(troubleshooting).toContain("ffmpeg");
    expect(troubleshooting).toContain("ERR_CONNECTION_REFUSED");
  });

  test("surfaces actionable source-cli guidance for first-run blockers", async () => {
    const missingConfigCwd = await makeTempProject();
    const missingConfig = await runCli(missingConfigCwd, ["generate", "demos/sample.tour.ts"]);
    expect(missingConfig.exitCode).toBe(1);
    expect(missingConfig.stderr).toContain("Could not find demohunter.config.ts");
    expect(missingConfig.stderr).toContain('Run "bun x demohunter init"');

    const invalidTourCwd = await writeProject({
      config: 'export default { baseURL: "http://127.0.0.1:4173" };\n',
      tour: "export default { nope: true };\n",
    });
    const invalidTour = await runCli(invalidTourCwd, ["generate", "demos/sample.tour.ts"]);
    expect(invalidTour.exitCode).toBe(1);
    expect(invalidTour.stderr).toContain("Tour file must default export");
    expect(invalidTour.stderr).toContain("id");
    expect(invalidTour.stderr).toContain("run");

    const unreachableCwd = await writeProject({
      config: 'export default { baseURL: "http://127.0.0.1:4173" };\n',
      tour: 'export default { id: "sample-smoke", title: "Sample", async run() {} };\n',
    });
    const unreachable = await runCli(unreachableCwd, ["generate", "demos/sample.tour.ts"]);
    expect(unreachable.exitCode).toBe(1);
    expect(unreachable.stderr).toContain("DemoHunter could not reach baseURL http://127.0.0.1:4173/");
    expect(unreachable.stderr).toContain('rerun "demohunter generate"');

    const missingKeyCwd = await writeProject({
      config: 'export default { baseURL: "file:///tmp/demohunter-onboarding.html" };\n',
      tour: 'export default { id: "sample-smoke", title: "Sample", async run({ narrate }) { await narrate("Fresh narration"); } };\n',
    });
    const missingKey = await runCli(missingKeyCwd, ["generate", "demos/sample.tour.ts"]);
    expect(missingKey.exitCode).toBe(1);
    expect(missingKey.stderr).toContain("OPENAI_API_KEY");
    expect(missingKey.stderr).toContain("narration cache");
  });
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-oss-onboarding-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function writeProject(input: { config: string; tour: string }): Promise<string> {
  const cwd = await makeTempProject();
  await mkdir(path.join(cwd, "demos"), { recursive: true });
  await writeFile(path.join(cwd, "demohunter.config.ts"), input.config);
  await writeFile(path.join(cwd, "demos", "sample.tour.ts"), input.tour);
  return cwd;
}

async function runCli(
  cwd: string,
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const processResult = Bun.spawn({
    cmd: [process.execPath, cliEntryPoint, ...args],
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: buildEnv(),
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    processResult.exited,
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
  ]);

  return { exitCode, stdout, stderr };
}

function buildEnv(): Record<string, string | undefined> {
  const env = {
    ...process.env,
  } as Record<string, string | undefined>;

  delete env.OPENAI_API_KEY;
  delete env.DEMOHUNTER_RUN_LIVE_OPENAI_TESTS;

  return env;
}
