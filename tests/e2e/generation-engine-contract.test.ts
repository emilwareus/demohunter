import { afterEach, describe, expect, test } from "bun:test";
import { access, cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parsePortableOutputManifest } from "../../packages/manifest/src/index.js";
import { createNarrationRequest, resolveNarrationFromCache } from "../../packages/tts-core/src/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cliEntryPoint = path.join(repoRoot, "packages/cli/src/bin/demohunter.ts");
const narrationFixturePath = path.join(repoRoot, "tests/fixtures/tours/phase-04-narration.tour.ts");
const tempRoots: string[] = [];

const NARRATION_SAMPLE_RATE = 24_000;
const NARRATION_TEXTS = [
  "The billing workspace keeps invoices, exports, and credits together.",
  "Each replay stays strict because narration timing comes from cached audio.",
  "Caption files are emitted from narration segments only, not from overlay labels.",
] as const;
const NARRATION_DURATIONS_MS = [750, 1_100, 900] as const;
const DEFAULT_TTS_INSTRUCTIONS = "Speak clearly, calm, concise, product-demo style.";

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("generation engine contract", () => {
  test(
    "runs a narrated phase 4 tour through the source cli, emits captions, and reruns offline from cache",
    async () => {
      const cwd = await makeTempProject();
      const tourPath = "demos/phase-04-narration.tour.ts";

      await setupNarrationProject(cwd, tourPath);

      const installResult = await spawnCommand([process.execPath, "install"], cwd);
      expect(installResult.exitCode).toBe(0);

      await primeNarrationCache(cwd);

      const listResult = await runCli(cwd, ["cache", "list"], unsetNarrationEnv());
      expect(listResult.exitCode).toBe(0);

      const listedEntries = parseJson<{ entries: Array<{ status: string }> }>(listResult.stdout);
      expect(listedEntries.entries).toHaveLength(NARRATION_TEXTS.length);
      expect(listedEntries.entries.every((entry) => entry.status === "ready")).toBe(true);

      const generateResult = await runCli(cwd, ["generate", tourPath], unsetNarrationEnv());
      expect(generateResult.exitCode).toBe(0);

      const outputDir = path.join(cwd, ".demohunter/phase-04-narration");
      const chaptersPath = path.join(outputDir, "chapters.json");
      const captionsSrtPath = path.join(outputDir, "captions.srt");
      const captionsVttPath = path.join(outputDir, "captions.vtt");
      const manifestPath = path.join(outputDir, "manifest.json");
      const posterPath = path.join(outputDir, "poster.jpg");
      const videoPath = path.join(outputDir, "video.mp4");
      const audioDir = path.join(outputDir, "audio");
      const chapters = JSON.parse(await readFile(chaptersPath, "utf8")) as Array<{
        startMs: number;
        title: string;
      }>;
      const captionsSrt = await readFile(captionsSrtPath, "utf8");
      const captionsVtt = await readFile(captionsVttPath, "utf8");
      const manifest = parsePortableOutputManifest(
        JSON.parse(await readFile(manifestPath, "utf8")),
      );

      await access(videoPath);
      await access(posterPath);
      expect(chapters.map((chapter) => chapter.title)).toEqual(["Workspace Overview", "Payment History"]);
      expect(captionsSrt).toBe(createExpectedSrt());
      expect(captionsVtt).toBe(createExpectedVtt());
      expect(captionsSrt).not.toContain("Workspace Overview");
      expect(captionsSrt).not.toContain("Payment History");
      expect(manifest.playback.durationMs).toBeGreaterThan(0);
      expect(manifest.artifacts.poster.captureTimestampMs).toBe(1_000);
      expect(manifest.manifestVersion).toBe(1);
      expect(manifest.artifacts.videos.mp4.path).toBe("video.mp4");
      expect(manifest.artifacts.poster.path).toBe("poster.jpg");
      expect(manifest.artifacts.audio).toHaveLength(NARRATION_TEXTS.length);
      expect(manifest.artifacts.audio.every((artifact) => artifact.path.startsWith("audio/"))).toBe(true);
      const artifactPaths = collectManifestArtifactPaths(manifest);
      expect(artifactPaths.every((artifactPath) => !artifactPath.startsWith("/"))).toBe(true);
      expect(artifactPaths.every((artifactPath) => !artifactPath.includes(cwd))).toBe(true);
      expect(
        manifest.timeline.narrations.every(
          (narration, index, narrations) =>
            narration.endMs === narration.startMs + narration.durationMs &&
            (index === 0 || narration.startMs >= narrations[index - 1]!.endMs),
        ),
      ).toBe(true);
      expect((await readdir(outputDir)).sort()).toEqual([
        "audio",
        "captions.srt",
        "captions.vtt",
        "chapters.json",
        "manifest.json",
        "poster.jpg",
        "video.mp4",
      ]);
      expect((await readdir(audioDir)).length).toBe(NARRATION_TEXTS.length);
      await expectVideoToContainAudio(videoPath, cwd);

      const rerunResult = await runCli(cwd, ["generate", tourPath], unsetNarrationEnv());
      expect(rerunResult.exitCode).toBe(0);
    },
    30_000,
  );

  test(
    "fails clearly when narration is uncached and OPENAI_API_KEY is absent",
    async () => {
      const cwd = await makeTempProject();
      const tourPath = "demos/phase-04-narration.tour.ts";

      await setupNarrationProject(cwd, tourPath);

      const installResult = await spawnCommand([process.execPath, "install"], cwd);
      expect(installResult.exitCode).toBe(0);

      const generateResult = await runCli(cwd, ["generate", tourPath], unsetNarrationEnv());

      expect(generateResult.exitCode).toBe(1);
      expect(generateResult.stderr).toContain("Unable to resolve narration segment");
      expect(generateResult.stderr).toContain("OPENAI_API_KEY");

      const outputDir = path.join(cwd, ".demohunter/phase-04-narration");
      await expect(access(path.join(outputDir, "video.mp4"))).rejects.toThrow();
      await expect(access(path.join(outputDir, "captions.srt"))).rejects.toThrow();
    },
    20_000,
  );

  test(
    "prunes corrupt cache artifacts, preserves healthy entries, and clears the local cache root",
    async () => {
      const cwd = await makeTempProject();
      const tourPath = "demos/phase-04-narration.tour.ts";

      await setupNarrationProject(cwd, tourPath);

      const installResult = await spawnCommand([process.execPath, "install"], cwd);
      expect(installResult.exitCode).toBe(0);

      await primeNarrationCache(cwd);
      await writeCorruptCacheArtifacts(cwd);

      const pruneResult = await runCli(cwd, ["cache", "prune"], unsetNarrationEnv());
      expect(pruneResult.exitCode).toBe(0);

      const pruned = parseJson<{
        kept: Array<{ key: string }>;
        removed: Array<{ path: string; reason: string }>;
      }>(pruneResult.stdout);
      expect(pruned.kept).toHaveLength(NARRATION_TEXTS.length);
      expect(pruned.removed.map((artifact) => path.basename(artifact.path)).sort()).toEqual([
        "broken.json",
        "broken.mp3",
      ]);

      const generateResult = await runCli(cwd, ["generate", tourPath], unsetNarrationEnv());
      expect(generateResult.exitCode).toBe(0);

      const clearResult = await runCli(cwd, ["cache", "clear"], unsetNarrationEnv());
      expect(clearResult.exitCode).toBe(0);
      expect(parseJson<{ cleared: boolean }>(clearResult.stdout).cleared).toBe(true);

      const listAfterClear = await runCli(cwd, ["cache", "list"], unsetNarrationEnv());
      expect(listAfterClear.exitCode).toBe(0);
      expect(parseJson<{ entries: Array<unknown> }>(listAfterClear.stdout).entries).toEqual([]);
    },
    30_000,
  );
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-generation-contract-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function setupNarrationProject(cwd: string, tourPath: string): Promise<void> {
  await writeTempRepoPackageJson(cwd);
  await writeTempRepoConfig(cwd);
  await writeTempRepoSite(cwd);
  await mkdir(path.join(cwd, "demos"), { recursive: true });
  await cp(narrationFixturePath, path.join(cwd, tourPath));
}

async function writeTempRepoPackageJson(cwd: string): Promise<void> {
  await writeFile(
    path.join(cwd, "package.json"),
    `${JSON.stringify(
      {
        name: "phase-04-generation-contract",
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

async function writeTempRepoConfig(cwd: string): Promise<void> {
  const sitePath = path.join(cwd, "site", "index.html");

  await writeFile(
    path.join(cwd, "demohunter.config.ts"),
    `export default {
  baseURL: ${JSON.stringify(pathToFileURL(sitePath).href)},
};
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
    <title>Phase 4 Generation Contract</title>
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

async function runCli(
  cwd: string,
  args: string[],
  envOverrides: Record<string, string | undefined> = {},
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return spawnCommand([process.execPath, cliEntryPoint, ...args], cwd, envOverrides);
}

async function spawnCommand(
  cmd: string[],
  cwd: string,
  envOverrides: Record<string, string | undefined> = {},
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const processResult = Bun.spawn({
    cmd,
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: buildEnv(envOverrides),
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    processResult.exited,
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
  ]);

  return { exitCode, stdout, stderr };
}

async function primeNarrationCache(cwd: string): Promise<void> {
  const cacheDir = path.join(cwd, ".demohunter", "cache");

  for (const [index, text] of NARRATION_TEXTS.entries()) {
    const request = createNarrationRequest({
      provider: "openai",
      model: "gpt-4o-mini-tts",
      voice: "marin",
      format: "mp3",
      sampleRate: NARRATION_SAMPLE_RATE,
      instructions: DEFAULT_TTS_INSTRUCTIONS,
      text,
    });

    await resolveNarrationFromCache({
      cacheDir,
      request,
      provider: {
        async synthesize(currentRequest) {
          return {
            request: currentRequest,
            output: {
              kind: "bytes",
              bytes: await createSilentMp3Bytes(NARRATION_DURATIONS_MS[index] ?? 500),
            },
            metadata: {
              provider: currentRequest.provider,
              model: currentRequest.model,
              voice: currentRequest.voice,
              format: currentRequest.format,
              sampleRate: currentRequest.sampleRate,
            },
          };
        },
      },
      measureDurationMs: async () => NARRATION_DURATIONS_MS[index] ?? 500,
    });
  }
}

async function writeCorruptCacheArtifacts(cwd: string): Promise<void> {
  const cacheDir = path.join(cwd, ".demohunter", "cache");

  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, "broken.json"), "{broken json", "utf8");
  await writeFile(path.join(cacheDir, "broken.mp3"), new Uint8Array([9, 9, 9]));
}

function buildEnv(overrides: Record<string, string | undefined>): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key];
      continue;
    }

    env[key] = value;
  }

  return env;
}

function unsetNarrationEnv(): Record<string, string | undefined> {
  return {
    DEMOHUNTER_RUN_LIVE_OPENAI_TESTS: undefined,
    OPENAI_API_KEY: undefined,
  };
}

function parseJson<T>(input: string): T {
  return JSON.parse(input.trim()) as T;
}

function createExpectedSrt(): string {
  return [
    "1",
    "00:00:00,000 --> 00:00:00,750",
    NARRATION_TEXTS[0],
    "",
    "2",
    "00:00:00,750 --> 00:00:01,850",
    NARRATION_TEXTS[1],
    "",
    "3",
    "00:00:01,850 --> 00:00:02,750",
    NARRATION_TEXTS[2],
  ].join("\n");
}

function createExpectedVtt(): string {
  return [
    "WEBVTT",
    "",
    "1",
    "00:00:00.000 --> 00:00:00.750",
    NARRATION_TEXTS[0],
    "",
    "2",
    "00:00:00.750 --> 00:00:01.850",
    NARRATION_TEXTS[1],
    "",
    "3",
    "00:00:01.850 --> 00:00:02.750",
    NARRATION_TEXTS[2],
  ].join("\n");
}

function collectManifestArtifactPaths(
  manifest: ReturnType<typeof parsePortableOutputManifest>,
): string[] {
  return [
    manifest.artifacts.videos.mp4.path,
    manifest.artifacts.videos.webm?.path,
    manifest.artifacts.poster.path,
    manifest.artifacts.captions.srt.path,
    manifest.artifacts.captions.vtt.path,
    manifest.artifacts.chapters.path,
    ...manifest.artifacts.audio.map((artifact) => artifact.path),
  ].filter((artifactPath): artifactPath is string => artifactPath !== undefined);
}

async function expectVideoToContainAudio(videoPath: string, cwd: string): Promise<void> {
  const probe = await spawnCommand(
    ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "csv=p=0", videoPath],
    cwd,
  );

  expect(probe.exitCode).toBe(0);
  expect(probe.stdout.trim()).toContain("audio");
}

async function createSilentMp3Bytes(durationMs: number): Promise<Uint8Array> {
  const processResult = Bun.spawn({
    cmd: [
      "ffmpeg",
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=channel_layout=mono:sample_rate=24000",
      "-t",
      `${durationMs / 1000}`,
      "-q:a",
      "9",
      "-f",
      "mp3",
      "pipe:1",
    ],
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, bytes, stderr] = await Promise.all([
    processResult.exited,
    new Response(processResult.stdout).arrayBuffer(),
    new Response(processResult.stderr).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr || `ffmpeg failed with exit code ${exitCode}`);
  }

  return new Uint8Array(bytes);
}
