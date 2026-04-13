import { describe, expect, test } from "bun:test";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const skillRoot = path.join(repoRoot, "skills", "demohunter");

const requiredFiles = [
  path.join(skillRoot, "SKILL.md"),
  path.join(skillRoot, "references", "authoring.md"),
  path.join(skillRoot, "references", "cli.md"),
  path.join(skillRoot, "references", "troubleshooting.md"),
  path.join(skillRoot, "assets", "tour.template.ts"),
] as const;

describe("demohunter skill bundle", () => {
  test("ships the canonical installable skill files", async () => {
    for (const filePath of requiredFiles) {
      await expect(access(filePath)).resolves.toBeUndefined();
    }
  });

  test("ships a template that loads as a real DemoHunter tour module", async () => {
    const templatePath = path.join(skillRoot, "assets", "tour.template.ts");
    const templateModule = await import(pathToFileURL(templatePath).href);

    expect(templateModule.default).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      run: expect.any(Function),
    });
  });
});
