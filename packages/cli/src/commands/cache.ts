import {
  clearNarrationCache,
  listNarrationCacheEntries,
  pruneNarrationCache,
} from "@demohunter/tts-core";

import { loadConfig } from "../config/load-config.js";

export type CacheAction = "list" | "prune" | "clear";

export type CacheCommandInput = {
  action: CacheAction;
};

type CacheCommandDependencies = {
  clearNarrationCache: typeof clearNarrationCache;
  listNarrationCacheEntries: typeof listNarrationCacheEntries;
  loadConfig: typeof loadConfig;
  log: (message: string) => void;
  pruneNarrationCache: typeof pruneNarrationCache;
};

const defaultDependencies: CacheCommandDependencies = {
  clearNarrationCache,
  listNarrationCacheEntries,
  loadConfig,
  log: console.log,
  pruneNarrationCache,
};

export async function cacheCommand(
  cwd: string,
  input: CacheCommandInput,
  dependencies: Partial<CacheCommandDependencies> = {},
): Promise<void> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const loadedConfig = await resolvedDependencies.loadConfig(cwd);
  const { cacheDir } = loadedConfig.config;

  switch (input.action) {
    case "list": {
      const entries = await resolvedDependencies.listNarrationCacheEntries({ cacheDir });
      resolvedDependencies.log(
        JSON.stringify(
          {
            cacheDir,
            entries,
          },
          null,
          2,
        ),
      );
      return;
    }
    case "prune": {
      const result = await resolvedDependencies.pruneNarrationCache({ cacheDir });
      resolvedDependencies.log(
        JSON.stringify(
          {
            cacheDir,
            ...result,
          },
          null,
          2,
        ),
      );
      return;
    }
    case "clear":
      await resolvedDependencies.clearNarrationCache({ cacheDir });
      resolvedDependencies.log(
        JSON.stringify(
          {
            cacheDir,
            cleared: true,
          },
          null,
          2,
        ),
      );
      return;
  }
}
