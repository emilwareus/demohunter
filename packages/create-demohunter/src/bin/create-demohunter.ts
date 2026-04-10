#!/usr/bin/env node

import { scaffoldStarter } from "../scaffold.js";

async function main(): Promise<void> {
  try {
    const result = await scaffoldStarter(process.cwd(), {
      force: process.argv.slice(2).includes("--force"),
    });

    for (const createdFile of result.createdFiles) {
      console.log(createdFile);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

void main();
