import { copyFile, writeFile } from "node:fs/promises";
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
  writeFile: typeof writeFile;
};

export type WriteGenerationOutputResult = {
  chaptersPath: string;
  outputDir: string;
  videoPath: string;
};

const defaultDependencies: WriteGenerationOutputDependencies = {
  copyFile,
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
