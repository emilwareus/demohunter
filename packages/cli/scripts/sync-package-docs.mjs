import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const packageDocs = ["README.md", "LICENSE", "CHANGELOG.md"];

await Promise.all(
  packageDocs.map((fileName) => copyFile(path.join(repoRoot, fileName), path.join(packageRoot, fileName))),
);
