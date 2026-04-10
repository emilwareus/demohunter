import path from "node:path";
import { pathToFileURL } from "node:url";

import { smokeGenerate } from "@demohunter/generator-playwright";

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

type TourLike = {
  id: string;
  title: string;
  run: (...args: unknown[]) => Promise<void> | void;
};

function readTourDefaultExport(tourModule: unknown, tourPath: string): TourLike {
  if (!isTourLike(tourModule)) {
    throw new Error(
      `Tour file must default export an object with string id/title and a run function: ${tourPath}`,
    );
  }

  return tourModule;
}

function isTourLike(value: unknown): value is TourLike {
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
