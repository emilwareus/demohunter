import { access, copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STARTER_TARGETS = [
  "demohunter.config.ts",
  "demos/sample.tour.ts",
  "demos/sample-site/index.html",
] as const;

export type ScaffoldStarterOptions = {
  force?: boolean;
};

export type ScaffoldResult = {
  createdFiles: string[];
};

export async function scaffoldStarter(
  cwd: string,
  options: ScaffoldStarterOptions = {},
): Promise<ScaffoldResult> {
  const projectRoot = path.resolve(cwd);
  const templateRoot = findTemplateRoot();
  const targets = STARTER_TARGETS.map((relativePath) => ({
    sourcePath: path.join(templateRoot, relativePath),
    targetPath: path.join(projectRoot, relativePath),
  }));

  if (!options.force) {
    for (const target of targets) {
      if (await pathExists(target.targetPath)) {
        throw new Error(`Refusing to overwrite existing file: ${target.targetPath}`);
      }
    }
  }

  for (const target of targets) {
    await mkdir(path.dirname(target.targetPath), { recursive: true });
    await copyFile(target.sourcePath, target.targetPath);
  }

  return {
    createdFiles: targets.map((target) => target.targetPath),
  };
}

function findTemplateRoot(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  let dir = moduleDir;

  while (true) {
    const candidate = path.join(dir, "templates", "starter");

    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(dir);

    if (parent === dir) {
      break;
    }

    dir = parent;
  }

  throw new Error(`Could not locate DemoHunter starter templates from ${moduleDir}.`);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
