import path from "node:path";

export function toPortableRelativePath(outputDir: string, filePath: string): string {
  const resolvedOutputDir = path.resolve(outputDir);
  const resolvedFilePath = path.resolve(filePath);
  const relativePath = path.relative(resolvedOutputDir, resolvedFilePath);
  const normalizedPath = relativePath.split(path.sep).join("/");

  if (normalizedPath.length === 0) {
    throw new Error("Portable artifact path must not be empty.");
  }

  if (path.isAbsolute(normalizedPath)) {
    throw new Error("Portable artifact path must be output-root-relative.");
  }

  if (normalizedPath === ".." || normalizedPath.startsWith("../")) {
    throw new Error("Portable artifact path must stay within the output directory.");
  }

  return normalizedPath;
}
