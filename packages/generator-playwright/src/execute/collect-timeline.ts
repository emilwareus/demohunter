import path from "node:path";

import type { Page } from "playwright";

import { resolveNarrationSegment as defaultResolveNarrationSegment } from "../narration/resolve-narration.js";
import type { SmokeGenerateInput, SmokeTourModule } from "../smoke-generate.js";
import { createSmokeTourRuntime } from "../runtime/create-smoke-tour-runtime.js";
import type {
  CollectedNarration,
  CollectedTimeline,
  CollectedTimelineEntry,
  NarrationSegmentResolver,
  TourRuntimeEvent,
} from "./generator-types.js";

export type CollectTimelineInput = {
  loadedConfig: SmokeGenerateInput["loadedConfig"];
  page: Page;
  tourFile: SmokeTourModule;
  resolveNarrationSegment?: NarrationSegmentResolver;
};

export async function collectTimeline({
  loadedConfig,
  page,
  resolveNarrationSegment = (event) => defaultResolveNarrationSegment({ event, loadedConfig }),
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

  return buildCollectedTimeline(events, resolveNarrationSegment);
}

async function buildCollectedTimeline(
  events: TourRuntimeEvent[],
  resolveNarrationSegment: NarrationSegmentResolver,
): Promise<CollectedTimeline> {
  const entries: CollectedTimelineEntry[] = [];
  const narrations: CollectedTimeline["narrations"] = [];

  for (const [index, event] of events.entries()) {
    const order = index + 1;

    if (event.kind === "narrate") {
      const segment = await resolveNarrationSegment(event);

      if (!Number.isFinite(segment.durationMs) || segment.durationMs < 0) {
        throw new Error(
          `Narration resolver must return a non-negative finite duration: ${segment.durationMs}`,
        );
      }

      const entry: CollectedNarration = {
        event,
        kind: "narration",
        order,
        segment,
      };

      entries.push(entry);
      narrations.push(segment);
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
