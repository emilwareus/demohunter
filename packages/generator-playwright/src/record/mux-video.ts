import { spawn } from "node:child_process";
import { copyFile, rm } from "node:fs/promises";
import path from "node:path";

import type { RecordFormat } from "@demohunter/sdk";
import type { PortableVideoOutputs } from "../execute/generator-types.js";

export type MuxVideoInput = {
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

  await resolvedDependencies.runCommand(resolvedDependencies.ffmpegCommand, [
    "-y",
    "-i",
    input.tempScreencastPath,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    mp4Path,
  ]);

  if (input.recordFormat === "webm") {
    await resolvedDependencies.copyFile(input.tempScreencastPath, webmPath);

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
