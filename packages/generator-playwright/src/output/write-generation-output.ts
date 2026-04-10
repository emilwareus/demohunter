import { copyFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { MuxedVideoArtifact } from "../record/mux-video.js";

export type GenerationChapter = {
  title: string;
  startMs: number;
};

export type WriteGenerationOutputInput = {
  chapters: GenerationChapter[];
  finalVideo: MuxedVideoArtifact;
  outputDir: string;
};

type WriteGenerationOutputDependencies = {
  copyFile: typeof copyFile;
  rm: typeof rm;
  writeFile: typeof writeFile;
};

export type WriteGenerationOutputResult = {
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
  const staleVideoPaths = ["video.mp4", "video.webm"]
    .map((fileName) => path.join(input.outputDir, fileName))
    .filter((candidatePath) => path.resolve(candidatePath) !== path.resolve(videoPath));

  await Promise.all(staleVideoPaths.map((candidatePath) => resolvedDependencies.rm(candidatePath, { force: true })));

  if (path.resolve(input.finalVideo.path) !== path.resolve(videoPath)) {
    await resolvedDependencies.copyFile(input.finalVideo.path, videoPath);
  }

  await resolvedDependencies.writeFile(chaptersPath, JSON.stringify(input.chapters, null, 2));

  return {
    chaptersPath,
    outputDir: input.outputDir,
    videoPath,
  };
}
