#!/usr/bin/env node

import { generateCommand } from "../commands/generate.js";
import { initCommand } from "../commands/init.js";

export async function runCli(argv: string[], cwd = process.cwd()): Promise<void> {
  const [command, ...rest] = argv;

  switch (command) {
    case "init":
      await initCommand(cwd, { force: rest.includes("--force") });
      return;
    case "generate": {
      const [tourPath] = rest;
      if (!tourPath) {
        throw new Error("Usage: demohunter generate <tour-file>");
      }
      await generateCommand(cwd, tourPath);
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

void main();
