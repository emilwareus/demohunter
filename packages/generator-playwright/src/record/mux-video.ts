import { spawn } from "node:child_process";
import { copyFile } from "node:fs/promises";
import path from "node:path";

import type { RecordFormat } from "@demohunter/sdk";

export type MuxVideoInput = {
  outputDir: string;
  recordFormat: RecordFormat;
  tempScreencastPath: string;
};

export type MuxedVideoArtifact = {
  format: RecordFormat;
  fileName: "video.mp4" | "video.webm";
  path: string;
};

type RunCommand = (command: string, args: string[]) => Promise<void>;

export type MuxVideoDependencies = {
  copyFile: typeof copyFile;
  ffmpegCommand: string;
  runCommand: RunCommand;
};

const defaultDependencies: MuxVideoDependencies = {
  copyFile,
  ffmpegCommand: "ffmpeg",
  runCommand: runProcess,
};

export async function muxVideo(
  input: MuxVideoInput,
  dependencies: Partial<MuxVideoDependencies> = {},
): Promise<MuxedVideoArtifact> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  if (input.recordFormat === "webm") {
    const outputPath = path.join(input.outputDir, "video.webm");
    await resolvedDependencies.copyFile(input.tempScreencastPath, outputPath);

    return {
      format: "webm",
      fileName: "video.webm",
      path: outputPath,
    };
  }

  const outputPath = path.join(input.outputDir, "video.mp4");
  await resolvedDependencies.runCommand(resolvedDependencies.ffmpegCommand, [
    "-y",
    "-i",
    input.tempScreencastPath,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    outputPath,
  ]);

  return {
    format: "mp4",
    fileName: "video.mp4",
    path: outputPath,
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
