import path from "node:path";

import { generateTour } from "@demohunter/generator-playwright";
import type { DemoHunterTour } from "@demohunter/sdk";

import { loadConfig } from "../config/load-config.js";
import { loadAuthoredModule } from "../utils/load-authored-module.js";

type TourModule = {
  default: unknown;
};

type GenerateDependencies = {
  generateTour: typeof generateTour;
  importModule: (modulePath: string) => Promise<TourModule>;
  loadConfig: typeof loadConfig;
  log: (message: string) => void;
};

const defaultDependencies: GenerateDependencies = {
  generateTour,
  importModule: loadAuthoredModule,
  loadConfig,
  log: console.log,
};

export async function generateCommand(
  cwd: string,
  tourPath: string,
  dependencies: Partial<GenerateDependencies> = {},
): Promise<void> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const resolvedTourPath = path.resolve(cwd, tourPath);
  let loadedConfig: Awaited<ReturnType<typeof loadConfig>> | undefined;

  try {
    loadedConfig = await resolvedDependencies.loadConfig(cwd);
    const tourModule = await resolvedDependencies.importModule(resolvedTourPath);
    const result = await resolvedDependencies.generateTour({
      loadedConfig,
      tourFile: {
        path: resolvedTourPath,
        tour: readTourDefaultExport(tourModule.default, resolvedTourPath),
      },
    });

    resolvedDependencies.log(result.videoPath);
  } catch (error) {
    throw improveGenerateError({
      cwd,
      error,
      loadedConfig,
    });
  }
}

type TourLike = DemoHunterTour & {
  setup?: unknown;
  teardown?: unknown;
};

function readTourDefaultExport(tourModule: unknown, tourPath: string): DemoHunterTour {
  if (!isTourShape(tourModule)) {
    throw new Error(
      `Tour file must default export an object with string id/title and a run function: ${tourPath}. Export a default tour like { id: "product-overview", title: "Product overview", async run(runtime) {} }.`,
    );
  }

  if (tourModule.setup !== undefined && typeof tourModule.setup !== "function") {
    throw new Error(
      `Tour file has invalid setup export; expected a function when provided: ${tourPath}. Keep setup as async setup(runtime) {} or remove it.`,
    );
  }

  if (tourModule.teardown !== undefined && typeof tourModule.teardown !== "function") {
    throw new Error(
      `Tour file has invalid teardown export; expected a function when provided: ${tourPath}. Keep teardown as async teardown(runtime) {} or remove it.`,
    );
  }

  return tourModule;
}

function improveGenerateError(input: {
  cwd: string;
  error: unknown;
  loadedConfig: Awaited<ReturnType<typeof loadConfig>> | undefined;
}): Error {
  if (!(input.error instanceof Error)) {
    return new Error(String(input.error));
  }

  const message = input.error.message;

  if (message.includes("Could not find demohunter.config.ts")) {
    return new Error(
      `${message}. Run "demohunter init" from an installed DemoHunter CLI, or add demohunter.config.ts before rerunning "demohunter generate".`,
      { cause: input.error },
    );
  }

  if (message.includes("Executable doesn't exist") || message.includes("playwright install")) {
    const browser = input.loadedConfig?.config.browser ?? "chromium";

    return new Error(
      `Playwright could not launch the local browser runtime for DemoHunter. Run "bun x playwright install ${browser}" and retry. DemoHunter does not install browsers automatically.`,
      { cause: input.error },
    );
  }

  if (
    message.includes("spawn ffmpeg ENOENT") ||
    message.includes("spawn ffprobe ENOENT") ||
    message.includes("ffmpeg ENOENT") ||
    message.includes("ffprobe ENOENT")
  ) {
    return new Error(
      'DemoHunter could not find ffmpeg/ffprobe on your PATH. Install ffmpeg, then confirm "ffmpeg -version" and "ffprobe -version" both work before retrying.',
      { cause: input.error },
    );
  }

  if (message.includes("OPENAI_API_KEY")) {
    return new Error(
      `Narration requires uncached OpenAI speech, but OPENAI_API_KEY is not set. Export OPENAI_API_KEY and retry, or rerun after the narration cache has already been populated.\nOriginal error: ${message}`,
      { cause: input.error },
    );
  }

  if (isBaseUrlReachabilityError(message)) {
    const baseURL = input.loadedConfig?.config.baseURL ?? readFirstUrl(message) ?? "your configured baseURL";

    return new Error(
      `DemoHunter could not reach baseURL ${baseURL}. Start your app yourself, confirm that URL is reachable, and then rerun "demohunter generate".`,
      { cause: input.error },
    );
  }

  return input.error;
}

function isBaseUrlReachabilityError(message: string): boolean {
  return (
    message.includes("ERR_CONNECTION_REFUSED") ||
    message.includes("ERR_CONNECTION_TIMED_OUT") ||
    message.includes("ERR_CONNECTION_RESET") ||
    message.includes("ERR_NAME_NOT_RESOLVED") ||
    message.includes("ERR_NETWORK_CHANGED")
  );
}

function readFirstUrl(message: string): string | undefined {
  return message.match(/https?:\/\/\S+/)?.[0];
}

function isTourShape(value: unknown): value is TourLike {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const maybeTour = value as Partial<TourLike>;
  return (
    typeof maybeTour.id === "string" &&
    typeof maybeTour.title === "string" &&
    typeof maybeTour.run === "function"
  );
}
