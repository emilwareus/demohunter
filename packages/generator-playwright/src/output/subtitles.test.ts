import { describe, expect, test } from "bun:test";

import type { NarrationSegment } from "../execute/generator-types.js";
import { serializeNarrationSubtitles } from "./subtitles.js";

describe("serializeNarrationSubtitles", () => {
  test("serializes ordered narration segments into SRT and VTT cues", () => {
    const subtitles = serializeNarrationSubtitles([
      createSegment({
        durationMs: 1_200,
        text: "Open the workspace home page.",
      }),
      createSegment({
        durationMs: 800,
        text: "Highlight the billing summary.",
      }),
    ]);

    expect(subtitles.srt).toBe(
      [
        "1",
        "00:00:00,000 --> 00:00:01,200",
        "Open the workspace home page.",
        "",
        "2",
        "00:00:01,200 --> 00:00:02,000",
        "Highlight the billing summary.",
      ].join("\n"),
    );
    expect(subtitles.vtt).toBe(
      [
        "WEBVTT",
        "",
        "1",
        "00:00:00.000 --> 00:00:01.200",
        "Open the workspace home page.",
        "",
        "2",
        "00:00:01.200 --> 00:00:02.000",
        "Highlight the billing summary.",
      ].join("\n"),
    );
  });

  test("uses narration text only and does not leak chapter labels into captions", () => {
    const subtitles = serializeNarrationSubtitles([
      createSegment({
        chapterTitle: "Billing",
        durationMs: 1_200,
        text: "Explain the invoice view.",
      }),
    ]);

    expect(subtitles.srt).toContain("Explain the invoice view.");
    expect(subtitles.vtt).toContain("Explain the invoice view.");
    expect(subtitles.srt).not.toContain("Billing");
    expect(subtitles.vtt).not.toContain("Billing");
  });
});

function createSegment(segment: Partial<NarrationSegment> & Pick<NarrationSegment, "durationMs" | "text">): NarrationSegment {
  return {
    audioPath: "/tmp/cache/segment.mp3",
    cacheKey: "cache-key",
    chapterTitle: segment.chapterTitle,
    durationMs: segment.durationMs,
    text: segment.text,
  };
}
