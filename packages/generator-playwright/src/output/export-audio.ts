import { basename, extname, join } from "node:path";
import { copyFile, mkdir } from "node:fs/promises";

import type { RecordedNarration } from "../execute/generator-types.js";

export type ExportedNarrationAudio = {
  cacheKey: string;
  durationMs: number;
  outputPath: string;
};

type ExportAudioDependencies = {
  copyFile: typeof copyFile;
  mkdir: typeof mkdir;
};

const defaultDependencies: ExportAudioDependencies = {
  copyFile,
  mkdir,
};

export async function exportAudio(
  outputDir: string,
  narrations: RecordedNarration[],
  dependencies: Partial<ExportAudioDependencies> = {},
): Promise<ExportedNarrationAudio[]> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  if (narrations.length === 0) {
    return [];
  }

  const audioDir = join(outputDir, "audio");
  await resolvedDependencies.mkdir(audioDir, { recursive: true });

  const exported = new Map<string, ExportedNarrationAudio>();

  for (const narration of narrations) {
    if (exported.has(narration.audioPath)) {
      continue;
    }

    const fileName = `${basename(narration.audioPath, extname(narration.audioPath))}${extname(narration.audioPath)}`;
    const outputPath = join(audioDir, fileName);
    await resolvedDependencies.copyFile(narration.audioPath, outputPath);
    exported.set(narration.audioPath, {
      cacheKey: narration.cacheKey,
      durationMs: narration.durationMs,
      outputPath,
    });
  }

  return [...exported.values()];
}
