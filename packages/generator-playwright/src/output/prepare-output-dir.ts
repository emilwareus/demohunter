import { mkdir } from "node:fs/promises";
import path from "node:path";

type PrepareOutputDirDependencies = {
  cwd: () => string;
  mkdir: typeof mkdir;
};

const TOUR_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const defaultDependencies: PrepareOutputDirDependencies = {
  cwd: () => process.cwd(),
  mkdir,
};

export async function prepareOutputDir(
  tourId: string,
  dependencies: Partial<PrepareOutputDirDependencies> = {},
): Promise<string> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  if (!TOUR_ID_PATTERN.test(tourId)) {
    throw new Error("Tour id must be a lowercase filesystem-safe slug");
  }

  const outputDir = path.join(resolvedDependencies.cwd(), ".demohunter", tourId);
  await resolvedDependencies.mkdir(outputDir, { recursive: true });

  return outputDir;
}
