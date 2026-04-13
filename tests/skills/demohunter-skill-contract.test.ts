import { describe, expect, test } from "bun:test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
      await expect(access(filePath)).resolves.toBeNull();
    }
  });

  test("ships a template that uses the current authoring surface", async () => {
    const templatePath = path.join(skillRoot, "assets", "tour.template.ts");
    const templateSource = await readFile(templatePath, "utf8");

    expect(templateSource).toContain('import { defineTour } from "@demohunter/sdk"');
    expect(templateSource).toContain("export default defineTour({");
    expect(templateSource).toContain("chapter(");
    expect(templateSource).toContain("step(");
    expect(templateSource).toContain("narrate(");
  });
});
