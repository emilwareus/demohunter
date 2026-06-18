import { execFile } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import * as playwright from "playwright";

import { loadConfig } from "../config/load-config.js";

const execFileAsync = promisify(execFile);

const MINIMUM_PLAYWRIGHT_MAJOR = 1;
const MINIMUM_PLAYWRIGHT_MINOR = 61;

function readInstalledPlaywrightVersion(): string | undefined {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("playwright/package.json") as { version?: string };

    return typeof pkg.version === "string" ? pkg.version : undefined;
  } catch {
    return undefined;
  }
}

function isPlaywrightTooOld(version: string): boolean {
  const [major, minor] = version
    .split(".")
    .map((part) => Number.parseInt(part, 10));

  if (!Number.isFinite(major) || !Number.isFinite(minor)) {
    return false;
  }

  if (major < MINIMUM_PLAYWRIGHT_MAJOR) {
    return true;
  }

  return major === MINIMUM_PLAYWRIGHT_MAJOR && minor < MINIMUM_PLAYWRIGHT_MINOR;
}

type DoctorStatus = "pass" | "warn" | "fail";

type DoctorCheck = {
  name: string;
  status: DoctorStatus;
  message: string;
};

type DoctorDependencies = {
  checkCommand: (command: string, args: string[]) => Promise<void>;
  fetch: typeof fetch;
  getPlaywrightVersion: () => string | undefined;
  loadConfig: typeof loadConfig;
  log: (message: string) => void;
  playwright: Pick<typeof playwright, "chromium" | "firefox" | "webkit">;
};

const defaultDependencies: DoctorDependencies = {
  checkCommand: async (command, args) => {
    await execFileAsync(command, args);
  },
  fetch: globalThis.fetch,
  getPlaywrightVersion: readInstalledPlaywrightVersion,
  loadConfig,
  log: console.log,
  playwright,
};

export async function doctorCommand(
  cwd: string,
  dependencies: Partial<DoctorDependencies> = {},
): Promise<void> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const checks: DoctorCheck[] = [];
  const loadedConfig = await runCheck(checks, "config", async () => {
    const loaded = await resolvedDependencies.loadConfig(cwd);

    return {
      message: `Loaded ${path.relative(cwd, loaded.configPath)}`,
      value: loaded,
    };
  });

  await runCheck(checks, "ffmpeg", async () => {
    await resolvedDependencies.checkCommand("ffmpeg", ["-version"]);
    return { message: "ffmpeg is available on PATH" };
  });
  await runCheck(checks, "ffprobe", async () => {
    await resolvedDependencies.checkCommand("ffprobe", ["-version"]);
    return { message: "ffprobe is available on PATH" };
  });

  const playwrightVersion = resolvedDependencies.getPlaywrightVersion();

  if (playwrightVersion === undefined) {
    checks.push({
      name: "playwright version",
      status: "warn",
      message:
        "Could not determine the installed Playwright version; visual effects require Playwright >=1.61",
    });
  } else if (isPlaywrightTooOld(playwrightVersion)) {
    checks.push({
      name: "playwright version",
      status: "warn",
      message: `Playwright ${playwrightVersion} is older than 1.61; cursor, click ripple, and highlight effects may not render`,
    });
  } else {
    checks.push({
      name: "playwright version",
      status: "pass",
      message: `Playwright ${playwrightVersion} satisfies the >=1.61 requirement for visual effects`,
    });
  }

  checks.push(
    process.env.OPENAI_API_KEY
      ? {
          name: "OPENAI_API_KEY",
          status: "pass",
          message: "OPENAI_API_KEY is set for uncached narration",
        }
      : {
          name: "OPENAI_API_KEY",
          status: "warn",
          message: "OPENAI_API_KEY is not set; generation still works when narration is fully cached",
        },
  );

  if (loadedConfig !== undefined) {
    await runCheck(checks, "playwright browser", async () => {
      const browser = await resolvedDependencies.playwright[loadedConfig.config.browser].launch();

      try {
        return { message: `${loadedConfig.config.browser} launched successfully` };
      } finally {
        await browser.close();
      }
    });
    await runCheck(checks, "baseURL", async () => {
      await checkBaseURL(loadedConfig.config.baseURL, resolvedDependencies.fetch);
      return { message: `${loadedConfig.config.baseURL} is reachable` };
    });
    await runCheck(checks, "outputDir", async () => {
      await checkWritableDirectory(loadedConfig.config.outputDir);
      return { message: `${loadedConfig.config.outputDir} is writable` };
    });
    await runCheck(checks, "cacheDir", async () => {
      await checkWritableDirectory(loadedConfig.config.cacheDir);
      return { message: `${loadedConfig.config.cacheDir} is writable` };
    });
  } else {
    checks.push(
      {
        name: "playwright browser",
        status: "fail",
        message: "Skipped because config did not load",
      },
      {
        name: "baseURL",
        status: "fail",
        message: "Skipped because config did not load",
      },
      {
        name: "outputDir",
        status: "fail",
        message: "Skipped because config did not load",
      },
      {
        name: "cacheDir",
        status: "fail",
        message: "Skipped because config did not load",
      },
    );
  }

  const summary = {
    ok: checks.every((check) => check.status !== "fail"),
    checks,
  };

  resolvedDependencies.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    throw new Error("Doctor found failing checks.");
  }
}

async function runCheck<T>(
  checks: DoctorCheck[],
  name: string,
  fn: () => Promise<{ message: string; value?: T }>,
): Promise<T | undefined> {
  try {
    const result = await fn();
    checks.push({
      name,
      status: "pass",
      message: result.message,
    });
    return result.value;
  } catch (error) {
    checks.push({
      name,
      status: "fail",
      message: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

async function checkBaseURL(baseURL: string, fetchImplementation: typeof fetch): Promise<void> {
  const url = new URL(baseURL);

  if (url.protocol === "file:") {
    await access(fileURLToPath(url));
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Unsupported baseURL protocol for doctor: ${url.protocol}`);
  }

  const response = await fetchImplementation(url, {
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`baseURL returned HTTP ${response.status}`);
  }
}

async function checkWritableDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true });
  const checkPath = path.join(directory, `.demohunter-doctor-${process.pid}.tmp`);

  try {
    await writeFile(checkPath, "ok\n", "utf8");
  } finally {
    await rm(checkPath, { force: true });
  }
}
