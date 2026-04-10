import path from "node:path";
import { pathToFileURL } from "node:url";

import { smokeGenerate } from "@demohunter/generator-playwright";
import type { DemoHunterTour } from "@demohunter/sdk";

import { loadConfig } from "../config/load-config.js";

type TourModule = {
  default: unknown;
};

type GenerateDependencies = {
  importModule: (href: string) => Promise<TourModule>;
  loadConfig: typeof loadConfig;
  log: (message: string) => void;
  smokeGenerate: typeof smokeGenerate;
};

const defaultDependencies: GenerateDependencies = {
  importModule: (href) => import(href),
  loadConfig,
  log: console.log,
  smokeGenerate,
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
  const loadedConfig = await resolvedDependencies.loadConfig(cwd);
  const resolvedTourPath = path.resolve(cwd, tourPath);
  const tourModule = await resolvedDependencies.importModule(pathToFileURL(resolvedTourPath).href);
  const result = await resolvedDependencies.smokeGenerate({
    loadedConfig,
    tourFile: {
      path: resolvedTourPath,
      tour: readTourDefaultExport(tourModule.default, resolvedTourPath),
    },
  });

  resolvedDependencies.log(result.outputPath);
}

type TourLike = DemoHunterTour & {
  setup?: unknown;
  teardown?: unknown;
};

function readTourDefaultExport(tourModule: unknown, tourPath: string): DemoHunterTour {
  if (!isTourShape(tourModule)) {
    throw new Error(
      `Tour file must default export an object with string id/title and a run function: ${tourPath}`,
    );
  }

  if (tourModule.setup !== undefined && typeof tourModule.setup !== "function") {
    throw new Error(`Tour file has invalid setup export; expected a function when provided: ${tourPath}`);
  }

  if (tourModule.teardown !== undefined && typeof tourModule.teardown !== "function") {
    throw new Error(`Tour file has invalid teardown export; expected a function when provided: ${tourPath}`);
  }

  return tourModule;
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
