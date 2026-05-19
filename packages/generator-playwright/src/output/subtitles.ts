import type { NarrationSegment, RecordedNarration } from "../execute/generator-types.js";

export type SerializedNarrationSubtitles = {
  srt: string;
  vtt: string;
};

export function serializeNarrationSubtitles(
  narrations: Array<NarrationSegment | RecordedNarration>,
): SerializedNarrationSubtitles {
  return {
    srt: serializeCues(narrations, { delimiter: ",", header: "" }),
    vtt: serializeCues(narrations, { delimiter: ".", header: "WEBVTT\n\n" }),
  };
}

function serializeCues(
  narrations: Array<NarrationSegment | RecordedNarration>,
  options: { delimiter: "," | "."; header: string },
): string {
  let elapsedMs = 0;
  const cues = narrations.map((segment, index) => {
    const startMs = "startMs" in segment ? segment.startMs : elapsedMs;
    const endMs = "endMs" in segment ? segment.endMs : startMs + segment.durationMs;
    elapsedMs = Math.max(elapsedMs, endMs);

    return [
      `${index + 1}`,
      `${formatTimestamp(startMs, options.delimiter)} --> ${formatTimestamp(endMs, options.delimiter)}`,
      segment.text,
    ].join("\n");
  });

  return `${options.header}${cues.join("\n\n")}`.trimEnd();
}

function formatTimestamp(durationMs: number, delimiter: "," | "."): string {
  const hours = Math.floor(durationMs / 3_600_000);
  const minutes = Math.floor((durationMs % 3_600_000) / 60_000);
  const seconds = Math.floor((durationMs % 60_000) / 1_000);
  const milliseconds = durationMs % 1_000;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":") + `${delimiter}${milliseconds.toString().padStart(3, "0")}`;
}
