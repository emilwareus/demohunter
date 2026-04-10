import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { DemoHunterTour } from "@demohunter/sdk";
import * as playwright from "playwright";
import type { BrowserType, Page } from "playwright";

import { createSmokeTourRuntime } from "./runtime/create-smoke-tour-runtime.js";

export type SmokeGenerateInput = {
  loadedConfig: {
    projectRoot: string;
    configPath: string;
    config: {
      baseURL: string;
      outputDir: string;
      cacheDir: string;
      browser: "chromium" | "firefox" | "webkit";
      viewport: { width: number; height: number };
      holdPaddingMs: number;
      record: { showActions: boolean; showChapters: boolean };
      tts: {
        provider: "openai";
        model: string;
        voice: string;
        format: string;
        instructions: string;
      };
    };
  };
  tourFile: SmokeTourModule;
};

export type SmokeTourModule = {
  path: string;
  tour: DemoHunterTour;
};

export type SmokeGenerateResult = {
  outputPath: string;
};

type BrowserTypeMap = Record<"chromium" | "firefox" | "webkit", Pick<BrowserType, "launch">>;

type SmokeGenerateDependencies = {
  mkdir: typeof mkdir;
  now: () => Date;
  playwright: BrowserTypeMap;
  writeFile: typeof writeFile;
};

const defaultDependencies: SmokeGenerateDependencies = {
  mkdir,
  now: () => new Date(),
  playwright,
  writeFile,
};

export async function smokeGenerate(
  { loadedConfig, tourFile }: SmokeGenerateInput,
  dependencies: Partial<SmokeGenerateDependencies> = {},
): Promise<SmokeGenerateResult> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const { config } = loadedConfig;
  const browserType = resolvedDependencies.playwright[config.browser];
  const browser = await browserType.launch();
  let context: Awaited<ReturnType<typeof browser.newContext>> | undefined;

  try {
    context = await browser.newContext({
      viewport: config.viewport,
    });
    const page = await context.newPage();
    const outputDir = path.join(config.outputDir, tourFile.tour.id);
    const runtime = createSmokeTourRuntime({
      outputDir,
      page,
    });

    await page.goto(new URL(config.baseURL).href);
    await Promise.resolve(tourFile.tour.setup?.(runtime));
    await Promise.resolve(tourFile.tour.run(runtime));
    await Promise.resolve(tourFile.tour.teardown?.(runtime));

    const outputPath = path.join(outputDir, "smoke-run.json");

    await resolvedDependencies.mkdir(outputDir, { recursive: true });
    await resolvedDependencies.writeFile(
      outputPath,
      JSON.stringify(
        {
          status: "ok",
          tourId: tourFile.tour.id,
          title: tourFile.tour.title,
          baseURL: config.baseURL,
          browser: config.browser,
          viewport: config.viewport,
          generatedAt: resolvedDependencies.now().toISOString(),
        },
        null,
        2,
      ),
    );

    return { outputPath };
  } finally {
    await context?.close();
    await browser.close();
  }
}
