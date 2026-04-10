import path from "node:path";

import type { Page } from "playwright";

import type { SmokeGenerateInput, SmokeTourModule } from "../smoke-generate.js";
import { createSmokeTourRuntime } from "../runtime/create-smoke-tour-runtime.js";
import type {
  CollectedNarration,
  CollectedTimeline,
  CollectedTimelineEntry,
  NarrationDurationResolver,
  TourRuntimeEvent,
} from "./generator-types.js";

export type CollectTimelineInput = {
  loadedConfig: SmokeGenerateInput["loadedConfig"];
  page: Page;
  tourFile: SmokeTourModule;
  resolveNarrationDuration?: NarrationDurationResolver;
};

const resolveSilentNarrationDuration: NarrationDurationResolver = () => 0;

export async function collectTimeline({
  loadedConfig,
  page,
  resolveNarrationDuration = resolveSilentNarrationDuration,
  tourFile,
}: CollectTimelineInput): Promise<CollectedTimeline> {
  const { config } = loadedConfig;
  const outputDir = path.join(config.outputDir, tourFile.tour.id);
  const events: TourRuntimeEvent[] = [];
  const runtime = createSmokeTourRuntime({
    onEvent: (event) => {
      events.push(event);
    },
    outputDir,
    page,
  });

  await page.goto(new URL(config.baseURL).href);

  let primaryError: unknown;

  try {
    await Promise.resolve(tourFile.tour.setup?.(runtime));
    await Promise.resolve(tourFile.tour.run(runtime));
  } catch (error) {
    primaryError = error;
  } finally {
    try {
      await Promise.resolve(tourFile.tour.teardown?.(runtime));
    } catch (teardownError) {
      if (primaryError === undefined) {
        throw teardownError;
      }
    }

    if (primaryError !== undefined) {
      throw primaryError;
    }
  }

  return buildCollectedTimeline(events, resolveNarrationDuration);
}

async function buildCollectedTimeline(
  events: TourRuntimeEvent[],
  resolveNarrationDuration: NarrationDurationResolver,
): Promise<CollectedTimeline> {
  const entries: CollectedTimelineEntry[] = [];
  const narrations: CollectedNarration[] = [];

  for (const [index, event] of events.entries()) {
    const order = index + 1;

    if (event.kind === "narrate") {
      const durationMs = await resolveNarrationDuration(event);

      if (!Number.isFinite(durationMs) || durationMs < 0) {
        throw new Error(`Narration duration resolver must return a non-negative finite duration: ${durationMs}`);
      }

      const entry: CollectedNarration = {
        chapterTitle: event.chapterTitle,
        durationMs,
        event,
        kind: "narration",
        order,
        text: event.text,
      };

      entries.push(entry);
      narrations.push(entry);
      continue;
    }

    entries.push({
      event,
      kind: "event",
      order,
    });
  }

  return {
    entries,
    narrations,
  };
}
