import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Locator, Page } from "playwright";

import type {
  AssertVisibleOptions,
  ChapterOptions,
  DemoHunterLifecycleContext,
  DemoHunterRunContext,
  HighlightOptions,
  NarrateOptions,
  DemoHunterNarrateWhile,
  DemoHunterNarrationTimeline,
  SnapshotOptions,
  WaitForStableOptions,
} from "./runtime-types.js";
import * as sdk from "./index.js";
import { defineTour } from "./tour.js";

function expectType<T>(_value: T): void {}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

async function buildSdk(): Promise<void> {
  const processResult = Bun.spawn({
    cmd: [process.execPath, "x", "tsc", "-b", "packages/sdk/tsconfig.json", "--pretty", "false"],
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    processResult.exited,
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr || stdout || "SDK build failed");
  }
}

describe("defineTour", () => {
  test("ships a dedicated runtime types module for the authored contract", async () => {
    await expect(import("./runtime-types.js")).resolves.toBeDefined();
  });

  test("re-exports defineTour from the sdk entrypoint and exposes runtime types in dist declarations", async () => {
    expect(sdk.defineTour).toBe(defineTour);
    await buildSdk();

    const declarationPath = path.join(repoRoot, "packages/sdk/dist/index.d.ts");
    const declarations = await readFile(declarationPath, "utf8");

    expect(declarations).toContain('from "./runtime-types.js"');
    expect(declarations).toContain("DemoHunterLifecycleContext");
    expect(declarations).toContain("DemoHunterRunContext");
    expect(declarations).toContain("ChapterOptions");
    expect(declarations).toContain("NarrateOptions");
    expect(declarations).toContain("DemoHunterNarrateWhile");
    expect(declarations).toContain("DemoHunterNarrationTimeline");
    expect(declarations).toContain("WaitForStableOptions");
    expect(declarations).toContain("HighlightOptions");
    expect(declarations).toContain("SnapshotOptions");
    expect(declarations).toContain("AssertVisibleOptions");
    expect(declarations).toContain("DemoHunterTour");
  });

  test("returns the authored object unchanged while supporting top-level lifecycle hooks", async () => {
    const setup = async (_context: DemoHunterLifecycleContext) => {};
    const run = async (_context: DemoHunterRunContext) => {};
    const teardown = async (_context: DemoHunterLifecycleContext) => {};

    const authored = { id: "billing-overview", title: "Billing overview", setup, run, teardown };
    const tour = defineTour(authored);

    expect(tour).toBe(authored);
    expect(tour.setup).toBe(setup);
    expect(tour.run).toBe(run);
    expect(tour.teardown).toBe(teardown);
  });

  test("exposes Playwright-native helper types directly on the run context", async () => {
    const locator = {} as Locator;
    const page = {} as Page;
    const config = {
      baseURL: "http://localhost:3000",
      browser: "chromium" as const,
      cacheDir: ".demohunter/cache",
      holdPaddingMs: 300,
      outputDir: ".demohunter",
      record: {
        format: "mp4" as const,
        showActions: true,
        showChapters: true,
      },
      tts: {
        format: "mp3",
        instructions: "Speak clearly.",
        model: "gpt-4o-mini-tts",
        provider: "openai" as const,
        voice: "marin",
      },
      viewport: {
        height: 900,
        width: 1440,
      },
    };
    const goto = async () => null;

    const run = async ({
      config,
      goto,
      page,
      chapter,
      step,
      narrate,
      narrateWhile,
      waitForStable,
      highlight,
      snapshot,
      assertVisible,
    }: DemoHunterRunContext) => {
      expectType<typeof config>(config);
      expectType<(url: string | URL, options?: Parameters<Page["goto"]>[1]) => ReturnType<Page["goto"]>>(goto);
      expectType<Page>(page);
      expectType<(title: string, options?: ChapterOptions) => Promise<void>>(chapter);
      expectType<(title: string, fn: () => Promise<void> | void) => Promise<void>>(step);
      expectType<(text: string, options?: NarrateOptions) => Promise<void>>(narrate);
      expectType<DemoHunterNarrateWhile>(narrateWhile);
      expectType<(options?: WaitForStableOptions) => Promise<void>>(waitForStable);
      expectType<(target: Locator, options?: HighlightOptions) => Promise<void>>(highlight);
      expectType<(options?: SnapshotOptions) => Promise<void>>(snapshot);
      expectType<(target: Locator, options?: AssertVisibleOptions) => Promise<void>>(assertVisible);

      await chapter("Billing", { id: "billing" });
      await step("Open billing", async () => {
        await narrate("This is the billing dashboard.", {
          cacheKeyHint: "billing-dashboard",
          instructions: "Speak clearly.",
          voice: "marin",
        });
        await narrateWhile("Now the dashboard updates while narration continues.", async ({ sleep }) => {
          expectType<DemoHunterNarrationTimeline["sleep"]>(sleep);
          await sleep(750);
        });
        await waitForStable({ state: "networkidle", timeoutMs: 5000 });
        await highlight(locator, { name: "Primary CTA", paddingPx: 12 });
        await snapshot({ name: "billing-dashboard" });
        await assertVisible(locator, { timeoutMs: 1500 });
      });
    };

    const setup = async ({ page }: DemoHunterLifecycleContext) => {
      expectType<Page>(page);
    };

    const teardown = async ({ page }: DemoHunterLifecycleContext) => {
      expectType<Page>(page);
    };

    await run({
      config,
      goto,
      page,
      chapter: async () => undefined,
      step: async (_title, fn) => {
        await fn();
      },
      narrate: async () => undefined,
      narrateWhile: async (_text, fn) => fn({ sleep: async () => undefined }),
      waitForStable: async () => undefined,
      highlight: async () => undefined,
      snapshot: async () => undefined,
      assertVisible: async () => undefined,
    });

    await setup({ config, goto, page });
    await teardown({ config, goto, page });
  });
});
