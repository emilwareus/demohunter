#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateCommand } from "../commands/generate.js";
import { initCommand } from "../commands/init.js";

type CliDependencies = {
  initCommand: typeof initCommand;
  generateCommand: typeof generateCommand;
};

const defaultDependencies: CliDependencies = {
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
    case "generate": {
      const [tourPath] = rest;
      if (!tourPath) {
        throw new Error("Usage: demohunter generate <tour-file>");
      }
      await dependencies.generateCommand(cwd, tourPath);
      return;
    }
    default:
      throw new Error("Usage: demohunter <init|generate> [options]");
  }
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

function isExecutedAsEntrypoint(): boolean {
  return Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isExecutedAsEntrypoint()) {
  void main();
}
