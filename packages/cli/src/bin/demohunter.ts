#!/usr/bin/env node

import { initCommand } from "../commands/init.js";

export async function runCli(argv: string[], cwd = process.cwd()): Promise<void> {
  const [command, ...rest] = argv;

  switch (command) {
    case "init":
      await initCommand(cwd, { force: rest.includes("--force") });
      return;
    default:
      throw new Error("Usage: demohunter init [--force]");
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
