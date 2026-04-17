import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import * as ts from "typescript";

type LoadedModule = {
  default: unknown;
};

const TYPESCRIPT_MODULE_SUFFIXES = [".ts", ".tsx", ".mts", ".cts"];

export async function loadAuthoredModule(modulePath: string): Promise<LoadedModule> {
  if (!isTypeScriptModulePath(modulePath)) {
    return import(withCacheBust(pathToFileURL(modulePath)).href);
  }

  const tempModulePath = createTempModulePath(modulePath);
  const source = await readFile(modulePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
    fileName: path.basename(modulePath),
  });

  await writeFile(tempModulePath, transpiled.outputText, "utf8");

  try {
    return await import(withCacheBust(pathToFileURL(tempModulePath)).href);
  } finally {
    await rm(tempModulePath, { force: true });
  }
}

function isTypeScriptModulePath(modulePath: string): boolean {
  return TYPESCRIPT_MODULE_SUFFIXES.some((suffix) => modulePath.endsWith(suffix));
}

function createTempModulePath(modulePath: string): string {
  const timestamp = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  const baseName = path.basename(modulePath).replace(/\.[^.]+$/, "");
  return path.join(path.dirname(modulePath), `.demohunter-${baseName}-${timestamp}.mjs`);
}

function withCacheBust(url: URL): URL {
  url.searchParams.set("t", `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return url;
}
