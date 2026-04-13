#!/usr/bin/env bun

import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cacheCommand } from "../commands/cache.js";
import { generateCommand } from "../commands/generate.js";
import { initCommand } from "../commands/init.js";

type CliDependencies = {
  cacheCommand: typeof cacheCommand;
  initCommand: typeof initCommand;
  generateCommand: typeof generateCommand;
};

const defaultDependencies: CliDependencies = {
  cacheCommand,
  initCommand,
  generateCommand,
};

export async function runCli(
  argv: string[],
  cwd = process.cwd(),
  dependencies: CliDependencies = defaultDependencies,
): Promise<void> {
  const [command, ...rest] = argv;

  switch (command) {
    case "init":
      await dependencies.initCommand(cwd, { force: rest.includes("--force") });
      return;
    case "cache": {
      const [action, ...extraArgs] = rest;
      if (!isCacheAction(action) || extraArgs.length > 0) {
        throw new Error("Usage: demohunter cache <list|prune|clear>");
      }
      await dependencies.cacheCommand(cwd, { action });
      return;
    }
    case "generate": {
      const [tourPath] = rest;
      if (!tourPath) {
        throw new Error("Usage: demohunter generate <tour-file>");
      }
      await dependencies.generateCommand(cwd, tourPath);
      return;
    }
    default:
      throw new Error("Usage: demohunter <init|generate|cache> [options]");
  }
}

function isCacheAction(action: string | undefined): action is "list" | "prune" | "clear" {
  return action === "list" || action === "prune" || action === "clear";
}

async function main(): Promise<void> {
  try {
    await runCli(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

export function isExecutedAsEntrypoint(
  argvPath = process.argv[1],
  entryUrl = import.meta.url,
  resolveRealPath: (filePath: string) => string = resolveRealBinPath,
): boolean {
  if (!argvPath) {
    return false;
  }

  return resolveRealPath(path.resolve(argvPath)) === resolveRealPath(fileURLToPath(entryUrl));
}

function resolveRealBinPath(filePath: string): string {
  try {
    return realpathSync.native(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

if (isExecutedAsEntrypoint()) {
  void main();
}
