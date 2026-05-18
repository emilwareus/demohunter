import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type PrepareOutputDirDependencies = {
  access: typeof access;
  mkdir: typeof mkdir;
  writeFile: typeof writeFile;
};

const TOUR_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const OUTPUT_ROOT_GITIGNORE_CONTENT = `# Managed by DemoHunter. Delete this file and the directory to opt out.
*
!.gitignore
`;

const defaultDependencies: PrepareOutputDirDependencies = {
  access,
  mkdir,
  writeFile,
};

export async function prepareOutputDir(
  tourId: string,
  outputRoot: string,
  dependencies: Partial<PrepareOutputDirDependencies> = {},
): Promise<string> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  if (!TOUR_ID_PATTERN.test(tourId)) {
    throw new Error("Tour id must be a lowercase filesystem-safe slug");
  }

  const outputDir = path.join(outputRoot, tourId);
  await resolvedDependencies.mkdir(outputDir, { recursive: true });
  await ensureOutputRootGitignore(outputRoot, resolvedDependencies);

  return outputDir;
}

async function ensureOutputRootGitignore(
  outputRoot: string,
  dependencies: PrepareOutputDirDependencies,
): Promise<void> {
  const gitignorePath = path.join(outputRoot, ".gitignore");

  try {
    await dependencies.access(gitignorePath);
    return;
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  await dependencies.writeFile(gitignorePath, OUTPUT_ROOT_GITIGNORE_CONTENT, "utf8");
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
