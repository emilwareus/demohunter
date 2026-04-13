import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

import type { PortableArtifactDescriptor, PortableChecksum } from "./schema.js";
import { toPortableRelativePath } from "./paths.js";

export const PORTABLE_CHECKSUM_ALGORITHM = "sha256";

export async function createPortableFileChecksum(filePath: string): Promise<PortableChecksum> {
  const [fileContents, fileStats] = await Promise.all([readFile(filePath), stat(filePath)]);
  const hex = createHash(PORTABLE_CHECKSUM_ALGORITHM).update(fileContents).digest("hex");

  return {
    algorithm: PORTABLE_CHECKSUM_ALGORITHM,
    byteSize: fileStats.size,
    hex,
  };
}

export async function createPortableArtifactDescriptor(input: {
  outputDir: string;
  filePath: string;
  mediaType: string;
}): Promise<PortableArtifactDescriptor> {
  return {
    path: toPortableRelativePath(input.outputDir, input.filePath),
    mediaType: input.mediaType,
    checksum: await createPortableFileChecksum(input.filePath),
  };
}
