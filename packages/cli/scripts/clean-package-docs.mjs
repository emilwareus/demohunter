import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const packageDocs = ["README.md", "LICENSE", "CHANGELOG.md"];

await Promise.all(packageDocs.map(removeGeneratedDoc));

async function removeGeneratedDoc(fileName) {
  const sourcePath = path.join(repoRoot, fileName);
  const generatedPath = path.join(packageRoot, fileName);

  try {
    const [source, generated] = await Promise.all([
      readFile(sourcePath, "utf8"),
      readFile(generatedPath, "utf8"),
    ]);

    if (source === generated) {
      await rm(generatedPath, { force: true });
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}
