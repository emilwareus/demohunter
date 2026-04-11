import { copyFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NarrationSegment } from "../execute/generator-types.js";
import type { MuxedVideoArtifact } from "../record/mux-video.js";
import { serializeNarrationSubtitles } from "./subtitles.js";

export type GenerationChapter = {
  title: string;
  startMs: number;
};

export type WriteGenerationOutputInput = {
  chapters: GenerationChapter[];
  finalVideo: MuxedVideoArtifact;
  narrations: NarrationSegment[];
  outputDir: string;
};

type WriteGenerationOutputDependencies = {
  copyFile: typeof copyFile;
  rm: typeof rm;
  writeFile: typeof writeFile;
};

export type WriteGenerationOutputResult = {
  captionsSrtPath: string;
  captionsVttPath: string;
  chaptersPath: string;
  outputDir: string;
  videoPath: string;
};

const defaultDependencies: WriteGenerationOutputDependencies = {
  copyFile,
  rm,
  writeFile,
};

export async function writeGenerationOutput(
  input: WriteGenerationOutputInput,
  dependencies: Partial<WriteGenerationOutputDependencies> = {},
): Promise<WriteGenerationOutputResult> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const videoPath = path.join(input.outputDir, input.finalVideo.fileName);
  const chaptersPath = path.join(input.outputDir, "chapters.json");
  const captionsSrtPath = path.join(input.outputDir, "captions.srt");
  const captionsVttPath = path.join(input.outputDir, "captions.vtt");
  const staleVideoPaths = ["video.mp4", "video.webm"]
    .map((fileName) => path.join(input.outputDir, fileName))
    .filter((candidatePath) => path.resolve(candidatePath) !== path.resolve(videoPath));
  const subtitles = serializeNarrationSubtitles(input.narrations);

  await Promise.all(staleVideoPaths.map((candidatePath) => resolvedDependencies.rm(candidatePath, { force: true })));

  if (path.resolve(input.finalVideo.path) !== path.resolve(videoPath)) {
    await resolvedDependencies.copyFile(input.finalVideo.path, videoPath);
  }

  await resolvedDependencies.writeFile(chaptersPath, JSON.stringify(input.chapters, null, 2));
  await Promise.all([
    resolvedDependencies.writeFile(captionsSrtPath, subtitles.srt),
    resolvedDependencies.writeFile(captionsVttPath, subtitles.vtt),
  ]);

  return {
    captionsSrtPath,
    captionsVttPath,
    chaptersPath,
    outputDir: input.outputDir,
    videoPath,
  };
}
