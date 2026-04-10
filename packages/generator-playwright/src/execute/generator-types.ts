import type {
  AssertVisibleOptions,
  HighlightOptions,
  NarrateOptions,
  SnapshotOptions,
  WaitForStableOptions,
} from "@demohunter/sdk";

export const TOUR_RUNTIME_EVENT_KINDS = [
  "chapter",
  "step-start",
  "step-end",
  "narrate",
  "wait-for-stable",
  "highlight",
  "snapshot",
  "assert-visible",
] as const;

export type TourRuntimeEvent =
  | {
      kind: "chapter";
      title: string;
      chapterTitle: string;
      outputDir: string;
      id?: string;
    }
  | {
      kind: "step-start" | "step-end";
      title: string;
      chapterTitle?: string;
    }
  | ({
      kind: "narrate";
      text: string;
      chapterTitle?: string;
    } & NarrateOptions)
  | ({
      kind: "wait-for-stable";
      chapterTitle?: string;
    } & WaitForStableOptions & { state: "load" | "domcontentloaded" | "networkidle" })
  | ({
      kind: "highlight";
      chapterTitle?: string;
    } & HighlightOptions)
  | ({
      kind: "snapshot";
      chapterTitle?: string;
    } & SnapshotOptions)
  | ({
      kind: "assert-visible";
      chapterTitle?: string;
    } & AssertVisibleOptions);

export type NarrationRuntimeEvent = Extract<TourRuntimeEvent, { kind: "narrate" }>;
export type NonNarrationRuntimeEvent = Exclude<TourRuntimeEvent, { kind: "narrate" }>;

export type NarrationDurationResolver = (event: NarrationRuntimeEvent) => number | Promise<number>;

export type CollectedNarration = {
  kind: "narration";
  order: number;
  text: string;
  chapterTitle?: string;
  durationMs: number;
  event: NarrationRuntimeEvent;
};

export type CollectedTimelineEvent = {
  kind: "event";
  order: number;
  event: NonNarrationRuntimeEvent;
};

export const COLLECTED_TIMELINE_ENTRY_KINDS = ["event", "narration"] as const;

export type CollectedTimelineEntry = CollectedTimelineEvent | CollectedNarration;

export type CollectedTimeline = {
  entries: CollectedTimelineEntry[];
  narrations: CollectedNarration[];
};
