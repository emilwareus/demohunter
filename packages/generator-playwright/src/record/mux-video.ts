import { spawn } from "node:child_process";
import { copyFile, rm } from "node:fs/promises";
import path from "node:path";

import type { RecordFormat } from "@demohunter/sdk";
import type { PortableVideoOutputs, RecordedNarration } from "../execute/generator-types.js";

export type MuxVideoInput = {
  narrations: RecordedNarration[];
  outputDir: string;
  recordFormat: RecordFormat;
  tempScreencastPath: string;
};

type RunCommand = (command: string, args: string[]) => Promise<void>;

export type MuxVideoDependencies = {
  copyFile: typeof copyFile;
  ffmpegCommand: string;
  rm: typeof rm;
  runCommand: RunCommand;
};

const defaultDependencies: MuxVideoDependencies = {
  copyFile,
  ffmpegCommand: "ffmpeg",
  rm,
  runCommand: runProcess,
};

export async function muxVideo(
  input: MuxVideoInput,
  dependencies: Partial<MuxVideoDependencies> = {},
): Promise<PortableVideoOutputs> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const mp4Path = path.join(input.outputDir, "video.mp4");
  const webmPath = path.join(input.outputDir, "video.webm");

  await resolvedDependencies.runCommand(
    resolvedDependencies.ffmpegCommand,
    createMuxArgs({
      narrations: input.narrations,
      outputPath: mp4Path,
      tempScreencastPath: input.tempScreencastPath,
      videoCodecArgs: ["-c:v", "libx264", "-pix_fmt", "yuv420p"],
      audioCodecArgs: ["-c:a", "aac"],
    }),
  );

  if (input.recordFormat === "webm") {
    if (input.narrations.length === 0) {
      await resolvedDependencies.copyFile(input.tempScreencastPath, webmPath);
    } else {
      await resolvedDependencies.runCommand(
        resolvedDependencies.ffmpegCommand,
        createMuxArgs({
          narrations: input.narrations,
          outputPath: webmPath,
          tempScreencastPath: input.tempScreencastPath,
          videoCodecArgs: ["-c:v", "copy"],
          audioCodecArgs: ["-c:a", "libopus"],
        }),
      );
    }

    return {
      mp4: {
        fileName: "video.mp4",
        format: "mp4",
        path: mp4Path,
      },
      webm: {
        fileName: "video.webm",
        format: "webm",
        path: webmPath,
      },
    };
  }

  await resolvedDependencies.rm(webmPath, { force: true });

  return {
    mp4: {
      fileName: "video.mp4",
      format: "mp4",
      path: mp4Path,
    },
  };
}

async function runProcess(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg exited with code ${exitCode ?? "unknown"}: ${stderr.trim() || "unknown error"}`));
    });
  });
}

function createMuxArgs(input: {
  narrations: RecordedNarration[];
  outputPath: string;
  tempScreencastPath: string;
  videoCodecArgs: string[];
  audioCodecArgs: string[];
}): string[] {
  if (input.narrations.length === 0) {
    return [
      "-y",
      "-i",
      input.tempScreencastPath,
      ...input.videoCodecArgs,
      input.outputPath,
    ];
  }

  const delayedLabels = input.narrations.map((_, index) => `[a${index}]`);
  const delayedFilters = input.narrations.map(
    (narration, index) => `[${index + 1}:a]adelay=${Math.max(0, narration.startMs)}:all=true${delayedLabels[index]}`,
  );
  const outputFilter = delayedLabels.length === 1
    ? `${delayedLabels[0]}anull[aout]`
    : `${delayedLabels.join("")}amix=inputs=${delayedLabels.length}:duration=longest:dropout_transition=0[aout]`;

  return [
    "-y",
    "-i",
    input.tempScreencastPath,
    ...input.narrations.flatMap((narration) => ["-i", narration.audioPath]),
    "-filter_complex",
    [...delayedFilters, outputFilter].join(";"),
    "-map",
    "0:v:0",
    "-map",
    "[aout]",
    ...input.videoCodecArgs,
    ...input.audioCodecArgs,
    input.outputPath,
  ];
}
