import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import * as playwright from "playwright";

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
  tour: {
    id: string;
    title: string;
    run: (context: {
      page: playwright.Page;
      chapter: () => Promise<void>;
      step: (_title: string, fn: () => Promise<void>) => Promise<void>;
      narrate: () => Promise<void>;
    }) => Promise<void> | void;
  };
};

export type SmokeGenerateResult = {
  outputPath: string;
};

export async function smokeGenerate({ loadedConfig, tourFile }: SmokeGenerateInput): Promise<SmokeGenerateResult> {
  const { config } = loadedConfig;
  const browserType = playwright[config.browser];
  const browser = await browserType.launch();

  try {
    const context = await browser.newContext({
      viewport: config.viewport,
    });
    const page = await context.newPage();

    await page.goto(new URL(config.baseURL).href);
    await Promise.resolve(
      tourFile.tour.run({
        page,
        chapter: async () => undefined,
        step: async (_title, fn) => await fn(),
        narrate: async () => undefined,
      }),
    );

    const outputDir = path.join(config.outputDir, tourFile.tour.id);
    const outputPath = path.join(outputDir, "smoke-run.json");

    await mkdir(outputDir, { recursive: true });
    await writeFile(
      outputPath,
      JSON.stringify(
        {
          status: "ok",
          tourId: tourFile.tour.id,
          title: tourFile.tour.title,
          baseURL: config.baseURL,
          browser: config.browser,
          viewport: config.viewport,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    await context.close();

    return { outputPath };
  } finally {
    await browser.close();
  }
}
