import { afterEach, describe, expect, test } from "bun:test";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Subprocess } from "bun";

import { parsePortableOutputManifest } from "../../packages/manifest/src/index.js";
import { createNarrationRequest, resolveNarrationFromCache } from "../../packages/tts-core/src/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tempRoots: string[] = [];
const serverProcesses: ManagedServer[] = [];
let repoBuildPromise: Promise<void> | undefined;

const EXAMPLES = [
  {
    baseURL: "http://127.0.0.1:3100",
    name: "Next.js",
    projectRoot: path.join(repoRoot, "examples", "nextjs-demo"),
    tourId: "nextjs-demo",
    narrationTexts: [
      "The Next.js example keeps the release brief on one route with stable selectors.",
      "A second state change is enough to prove the tour stays grounded in real app behavior.",
    ],
  },
  {
    baseURL: "http://127.0.0.1:3200",
    name: "Vite",
    projectRoot: path.join(repoRoot, "examples", "vite-demo"),
    tourId: "vite-demo",
    narrationTexts: [
      "The Vite example proves the same workflow against a lightweight client rendered app.",
      "It stays local only, with selectors chosen for demo generation instead of framework showcase depth.",
    ],
  },
] as const;

afterEach(async () => {
  await Promise.all(serverProcesses.splice(0).map((server) => stopServer(server)));
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
  await Promise.all(
    EXAMPLES.map((example) => rm(path.join(example.projectRoot, ".demohunter"), { force: true, recursive: true })),
  );
});

describe("example app contract", () => {
  for (const example of EXAMPLES) {
    test(
      `generates portable output for the ${example.name} example from its own project root`,
      async () => {
        await ensureRepoBuilt();

        const outputRoot = await makeTempRoot(`${example.tourId}-output-`);
        const cacheRoot = path.join(outputRoot, "cache");

        await primeNarrationCache(cacheRoot, example.narrationTexts);

        const stopServer = startServer(example.projectRoot);
        serverProcesses.push(stopServer);

        await waitForReady(example.baseURL);

        const generateResult = await spawnCommand(
          [process.execPath, "run", "generate"],
          example.projectRoot,
          withoutNarrationEnv({
            DEMOHUNTER_EXAMPLE_CACHE_DIR: cacheRoot,
            DEMOHUNTER_EXAMPLE_OUTPUT_DIR: outputRoot,
          }),
        );

        expect(generateResult.exitCode).toBe(0);

        const demoDir = path.join(outputRoot, example.tourId);
        const manifestPath = path.join(demoDir, "manifest.json");
        const chaptersPath = path.join(demoDir, "chapters.json");
        const videoPath = path.join(demoDir, "video.mp4");

        await access(manifestPath);
        await access(chaptersPath);
        await access(videoPath);

        const manifest = parsePortableOutputManifest(JSON.parse(await readFile(manifestPath, "utf8")));
        const chapters = JSON.parse(await readFile(chaptersPath, "utf8")) as Array<{ startMs: number; title: string }>;

        expect(manifest.artifacts.videos.mp4.path).toBe("video.mp4");
        expect(manifest.artifacts.audio).toHaveLength(example.narrationTexts.length);
        expect(chapters).toHaveLength(2);
      },
      60_000,
    );
  }
});

async function ensureRepoBuilt(): Promise<void> {
  repoBuildPromise ??= runRepoCommand(["x", "tsc", "-b", "tsconfig.json", "--pretty", "false"]);
  await repoBuildPromise;
}

async function makeTempRoot(prefix: string): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), `demohunter-${prefix}`));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function primeNarrationCache(cacheDir: string, texts: readonly string[]): Promise<void> {
  for (const [index, text] of texts.entries()) {
    const request = createNarrationRequest({
      provider: "openai",
      model: "gpt-4o-mini-tts",
      voice: "marin",
      format: "mp3",
      sampleRate: 24_000,
      instructions: "Speak clearly, calm, concise, product-demo style.",
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
              bytes: new Uint8Array([index + 1, index + 2, index + 3, index + 4]),
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
      measureDurationMs: async () => 650 + index * 175,
    });
  }
}

type ManagedServer = {
  cwd: string;
  process: Subprocess<"ignore", "ignore", "ignore">;
};

function startServer(cwd: string): ManagedServer {
  const serverProcess = Bun.spawn({
    cmd: [process.execPath, "run", "dev"],
    cwd,
    stdout: "ignore",
    stderr: "ignore",
    env: buildEnv({ CI: "1" }),
  });

  return { cwd, process: serverProcess };
}

async function stopServer(server: ManagedServer): Promise<void> {
  server.process.kill();
  await server.process.exited;
}

async function waitForReady(url: string, timeoutMs = 20_000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Wait for the dev server to accept connections.
    }

    await Bun.sleep(250);
  }

  throw new Error(`Timed out waiting for example app readiness: ${url}`);
}

async function runRepoCommand(args: string[]): Promise<void> {
  const result = await spawnCommand([process.execPath, ...args], repoRoot);

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: bun ${args.join(" ")}`);
  }
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

function withoutNarrationEnv(overrides: Record<string, string | undefined>): Record<string, string | undefined> {
  return {
    DEMOHUNTER_RUN_LIVE_OPENAI_TESTS: undefined,
    OPENAI_API_KEY: undefined,
    ...overrides,
  };
}
