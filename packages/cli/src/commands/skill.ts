import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SKILL_TARGETS = ["claude", "codex"] as const;
export type SkillTarget = (typeof SKILL_TARGETS)[number];

export type AddSkillInput = {
  targets: readonly SkillTarget[];
};

const TARGET_DIRECTORIES: Record<SkillTarget, string> = {
  claude: ".claude/skills/demohunter",
  codex: ".codex/skills/demohunter",
};

export async function addSkillCommand(cwd: string, input: AddSkillInput): Promise<void> {
  if (input.targets.length === 0) {
    throw new Error("Usage: demohunter add-skill [--target claude|codex|both]");
  }

  const sourceRoot = findSkillSourceRoot();

  for (const target of input.targets) {
    const targetDir = path.join(cwd, TARGET_DIRECTORIES[target]);
    await copyDirectory(sourceRoot, targetDir);
    console.log(`Installed demohunter skill into ${TARGET_DIRECTORIES[target]}`);
  }
}

export function parseSkillTargets(rawTargets: readonly string[]): SkillTarget[] {
  if (rawTargets.length === 0) {
    return [...SKILL_TARGETS];
  }

  const seen = new Set<SkillTarget>();

  for (const value of rawTargets) {
    if (value === "both") {
      for (const target of SKILL_TARGETS) {
        seen.add(target);
      }
      continue;
    }

    if (!isSkillTarget(value)) {
      throw new Error(
        `Unknown skill target: ${value}. Supported targets: ${SKILL_TARGETS.join(", ")}, both.`,
      );
    }

    seen.add(value);
  }

  return [...seen];
}

function isSkillTarget(value: string): value is SkillTarget {
  return (SKILL_TARGETS as readonly string[]).includes(value);
}

function findSkillSourceRoot(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  let dir = moduleDir;

  while (true) {
    const candidate = path.join(dir, "skills", "demohunter");

    if (existsSync(path.join(candidate, "SKILL.md"))) {
      return candidate;
    }

    const parent = path.dirname(dir);

    if (parent === dir) {
      break;
    }

    dir = parent;
  }

  throw new Error(`Could not locate the DemoHunter skill bundle from ${moduleDir}.`);
}

async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true });

  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await copyFile(sourcePath, targetPath);
    }
  }
}
