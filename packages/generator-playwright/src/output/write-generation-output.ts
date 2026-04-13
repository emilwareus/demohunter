import { copyFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  PortableVideoOutputs,
  RecordedNarration,
} from "../execute/generator-types.js";
import { serializeNarrationSubtitles } from "./subtitles.js";

export type GenerationChapter = {
  title: string;
  startMs: number;
};

export type WriteGenerationOutputInput = {
  tourId: string;
  tourTitle: string;
  videos: PortableVideoOutputs;
  chapters: GenerationChapter[];
  recordedNarrations: RecordedNarration[];
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
  const videoPath = path.join(input.outputDir, input.videos.mp4.fileName);
  const chaptersPath = path.join(input.outputDir, "chapters.json");
  const captionsSrtPath = path.join(input.outputDir, "captions.srt");
  const captionsVttPath = path.join(input.outputDir, "captions.vtt");
  const videoArtifacts = [input.videos.mp4, input.videos.webm].filter((artifact) => artifact !== undefined);
  const expectedVideoPaths = new Set(
    videoArtifacts.map((artifact) => path.resolve(path.join(input.outputDir, artifact.fileName))),
  );
  const staleVideoPaths = ["video.mp4", "video.webm"]
    .map((fileName) => path.join(input.outputDir, fileName))
    .filter((candidatePath) => !expectedVideoPaths.has(path.resolve(candidatePath)));
  const subtitles = serializeNarrationSubtitles(input.recordedNarrations);

  await Promise.all(staleVideoPaths.map((candidatePath) => resolvedDependencies.rm(candidatePath, { force: true })));

  await Promise.all(
    videoArtifacts.map(async (artifact) => {
      const destinationPath = path.join(input.outputDir, artifact.fileName);

      if (path.resolve(artifact.path) !== path.resolve(destinationPath)) {
        await resolvedDependencies.copyFile(artifact.path, destinationPath);
      }
    }),
  );

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
    videoPath: path.join(input.outputDir, "video.mp4"),
  };
}
