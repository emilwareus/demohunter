import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import type { Page } from "playwright";

import type { SmokeGenerateInput, SmokeTourModule } from "../smoke-generate.js";
import { createSmokeTourRuntime } from "../runtime/create-smoke-tour-runtime.js";
import type { SmokeRuntime } from "../runtime/create-smoke-tour-runtime.js";
import type { CollectedTimeline, CollectedTimelineEntry, TourRuntimeEvent } from "./generator-types.js";

export type ReplayTimelineInput = {
  loadedConfig: SmokeGenerateInput["loadedConfig"];
  onMatchedEvent?: (event: TourRuntimeEvent, index: number) => void;
  page: Page;
  timeline: CollectedTimeline;
  tourFile: SmokeTourModule;
  waitForTimeout?: (durationMs: number) => Promise<void>;
};

type ReplayTimelineErrorCause = {
  actual?: TourRuntimeEvent;
  expected?: TourRuntimeEvent;
  index: number;
  reason: "extra-event" | "mismatch" | "missing-event";
};

export class ReplayTimelineError extends Error {
  override cause: ReplayTimelineErrorCause;

  constructor(message: string, cause: ReplayTimelineErrorCause) {
    super(message, { cause });
    this.name = "ReplayTimelineError";
    this.cause = cause;
  }
}

export async function replayTimeline({
  loadedConfig,
  onMatchedEvent,
  page,
  timeline,
  tourFile,
  waitForTimeout,
}: ReplayTimelineInput): Promise<void> {
  const { config } = loadedConfig;
  const outputDir = path.join(config.outputDir, tourFile.tour.id);
  const replayWait = waitForTimeout ?? ((durationMs: number) => page.waitForTimeout(durationMs));
  let nextExpectedIndex = 0;
  let pendingNarrationWaitMs: number | undefined;
  const runtime = createReplayRuntime({
    config,
    outputDir,
    page,
    replayWait,
    timeline,
    onMatchedEvent,
    updatePendingNarrationWait: (durationMs) => {
      pendingNarrationWaitMs = durationMs;
    },
    updateReplayPosition: () => {
      nextExpectedIndex += 1;
    },
    getReplayPosition: () => nextExpectedIndex,
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

    assertReplayComplete(timeline.entries, nextExpectedIndex);

    if (pendingNarrationWaitMs !== undefined) {
      pendingNarrationWaitMs = undefined;
    }
  }
}

function createReplayRuntime(args: {
  config: ReplayTimelineInput["loadedConfig"]["config"];
  onMatchedEvent?: (event: TourRuntimeEvent, index: number) => void;
  outputDir: string;
  page: Page;
  replayWait: (durationMs: number) => Promise<void>;
  timeline: CollectedTimeline;
  getReplayPosition: () => number;
  updateReplayPosition: () => void;
  updatePendingNarrationWait: (durationMs: number | undefined) => void;
}): SmokeRuntime {
  const runtime = createSmokeTourRuntime({
    onEvent: (actualEvent) => {
      const expectedEntry = args.timeline.entries[args.getReplayPosition()];
      const index = args.getReplayPosition() + 1;

      if (expectedEntry === undefined) {
        throw new ReplayTimelineError(
          `Recorded pass diverged at entry ${index}: received unexpected ${describeEvent(actualEvent)} after the collected timeline was exhausted.`,
          {
            actual: actualEvent,
            index,
            reason: "extra-event",
          },
        );
      }

      const expectedEvent = expectedEntry.event;

      if (!isDeepStrictEqual(actualEvent, expectedEvent)) {
        throw new ReplayTimelineError(
          `Recorded pass diverged at entry ${index}: expected ${describeEvent(expectedEvent)} but received ${describeEvent(actualEvent)}.`,
          {
            actual: actualEvent,
            expected: expectedEvent,
            index,
            reason: "mismatch",
          },
        );
      }

      args.onMatchedEvent?.(actualEvent, index);
      args.updateReplayPosition();

      if (expectedEntry.kind === "narration") {
        args.updatePendingNarrationWait(expectedEntry.segment.durationMs + args.config.holdPaddingMs);
        return;
      }

      args.updatePendingNarrationWait(undefined);
    },
    outputDir: args.outputDir,
    page: args.page,
  });
  const baseNarrate = runtime.narrate.bind(runtime);

  runtime.narrate = async (text, options) => {
    args.updatePendingNarrationWait(undefined);
    await baseNarrate(text, options);

    const expectedEntry = args.timeline.entries[args.getReplayPosition() - 1];

    if (expectedEntry?.kind !== "narration") {
      throw new ReplayTimelineError(
        `Recorded pass diverged at entry ${args.getReplayPosition()}: narration wait could not be resolved from the collected timeline.`,
        {
          actual: {
            chapterTitle: expectedEntry?.event.chapterTitle,
            kind: "narrate",
            text,
            ...options,
          },
          expected: expectedEntry?.event,
          index: args.getReplayPosition(),
          reason: "mismatch",
        },
      );
    }

    await args.replayWait(expectedEntry.segment.durationMs + args.config.holdPaddingMs);
  };

  return runtime;
}

function assertReplayComplete(entries: CollectedTimelineEntry[], nextExpectedIndex: number): void {
  if (nextExpectedIndex === entries.length) {
    return;
  }

  const expectedEntry = entries[nextExpectedIndex];
  const expectedEvent = expectedEntry.event;
  const index = nextExpectedIndex + 1;

  throw new ReplayTimelineError(
    `Recorded pass diverged at entry ${index}: expected ${describeEvent(expectedEvent)} but the recorded pass ended before emitting it.`,
    {
      expected: expectedEvent,
      index,
      reason: "missing-event",
    },
  );
}

function describeEvent(event: TourRuntimeEvent): string {
  const chapter = event.chapterTitle === undefined ? "unscoped" : event.chapterTitle;

  switch (event.kind) {
    case "chapter":
      return `chapter "${event.title}" in chapter "${chapter}"`;
    case "step-start":
    case "step-end":
      return `${event.kind} "${event.title}" in chapter "${chapter}"`;
    case "narrate":
      return `narration "${event.text}" in chapter "${chapter}"`;
    default:
      return `${event.kind} event in chapter "${chapter}"`;
  }
}
