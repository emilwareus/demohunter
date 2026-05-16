import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { addSkillCommand, parseSkillTargets } from "./skill.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })));
});

describe("parseSkillTargets", () => {
  test("defaults to every target when no values are passed", () => {
    expect(parseSkillTargets([])).toEqual(["claude", "codex"]);
  });

  test("expands the 'both' alias", () => {
    expect(parseSkillTargets(["both"])).toEqual(["claude", "codex"]);
  });

  test("deduplicates repeated targets", () => {
    expect(parseSkillTargets(["claude", "claude", "codex"])).toEqual(["claude", "codex"]);
  });

  test("rejects cursor (no longer supported)", () => {
    expect(() => parseSkillTargets(["cursor"])).toThrow("Unknown skill target: cursor");
  });

  test("throws on unknown targets", () => {
    expect(() => parseSkillTargets(["windsurf"])).toThrow("Unknown skill target: windsurf");
  });
});

describe("addSkillCommand", () => {
  test("copies the skill bundle into each requested target directory", async () => {
    const cwd = await makeTempProject();

    await addSkillCommand(cwd, { targets: ["claude", "codex"] });

    const claudeSkill = await readFile(
      path.join(cwd, ".claude", "skills", "demohunter", "SKILL.md"),
      "utf8",
    );
    const codexSkill = await readFile(
      path.join(cwd, ".codex", "skills", "demohunter", "SKILL.md"),
      "utf8",
    );

    expect(claudeSkill).toContain("name: demohunter");
    expect(codexSkill).toContain("name: demohunter");

    const claudeTemplate = await readFile(
      path.join(cwd, ".claude", "skills", "demohunter", "assets", "tour.template.ts"),
      "utf8",
    );
    expect(claudeTemplate).toContain('import { defineTour } from "demohunter"');
  });

  test("rejects an empty target list", async () => {
    const cwd = await makeTempProject();

    await expect(addSkillCommand(cwd, { targets: [] })).rejects.toThrow(
      "Usage: demohunter add-skill [--target claude|codex|both]",
    );
  });
});

async function makeTempProject(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "demohunter-skill-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}
