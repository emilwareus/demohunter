import path from "node:path";
import { pathToFileURL } from "node:url";

import { smokeGenerate } from "@demohunter/generator-playwright";

import { loadConfig } from "../config/load-config.js";

export async function generateCommand(cwd: string, tourPath: string): Promise<void> {
  const loadedConfig = await loadConfig(cwd);
  const resolvedTourPath = path.resolve(cwd, tourPath);
  const tourModule = await import(pathToFileURL(resolvedTourPath).href);
  const result = await smokeGenerate({
    loadedConfig,
    tourFile: {
      path: resolvedTourPath,
      tour: tourModule.default,
    },
  });

  console.log(result.outputPath);
}
