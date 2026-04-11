import { readdir, rm } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";

import type { NarrationRequest } from "../contracts.js";
import { NARRATION_CACHE_SCHEMA_VERSION } from "./cache-key.js";
import {
  inspectNarrationCacheMetadataFile,
  NARRATION_CACHE_METADATA_EXTENSION,
  type NarrationCacheInspection,
} from "./cache-store.js";

export type ListNarrationCacheEntriesOptions = {
  cacheDir: string;
  currentVersion?: number;
};

export type NarrationCacheListEntry = {
  key: string;
  status: "ready" | "invalid" | "obsolete";
  issue: string | null;
  version: number | null;
  request: NarrationRequest | null;
  audioPath: string | null;
  metadataPath: string;
  byteSize: number | null;
  durationMs: number | null;
};

export type PruneNarrationCacheOptions = {
  cacheDir: string;
  currentVersion?: number;
};

export type PrunedNarrationCacheArtifact = {
  path: string;
  reason: string;
};

export type PruneNarrationCacheResult = {
  kept: NarrationCacheListEntry[];
  removed: PrunedNarrationCacheArtifact[];
};

export type ClearNarrationCacheOptions = {
  cacheDir: string;
};

export async function listNarrationCacheEntries(
  options: ListNarrationCacheEntriesOptions,
): Promise<NarrationCacheListEntry[]> {
  const cacheDir = resolveCacheDir(options.cacheDir);
  const metadataPaths = await findMetadataPaths(cacheDir);
  const inspections = await Promise.all(
    metadataPaths.map((metadataPath) =>
      inspectNarrationCacheMetadataFile({
        cacheDir,
        metadataPath,
        currentVersion: options.currentVersion ?? NARRATION_CACHE_SCHEMA_VERSION,
      })),
  );

  return inspections
    .map(toNarrationCacheListEntry)
    .sort(compareListEntries);
}

export async function pruneNarrationCache(
  options: PruneNarrationCacheOptions,
): Promise<PruneNarrationCacheResult> {
  const cacheDir = resolveCacheDir(options.cacheDir);
  const removed: PrunedNarrationCacheArtifact[] = [];
  const entries = await listNarrationCacheEntries({
    cacheDir,
    currentVersion: options.currentVersion,
  });
  const kept = entries.filter((entry) => entry.status === "ready");
  const keptAudioFiles = new Set(
    kept
      .map((entry) => entry.audioPath)
      .filter((audioPath): audioPath is string => audioPath !== null)
      .map((audioPath) => basename(audioPath)),
  );

  for (const entry of entries) {
    if (entry.status === "ready") {
      continue;
    }

    await removeIfPresent(entry.metadataPath, entry.issue ?? "Invalid cache metadata.", removed, cacheDir);
    await removeIfPresent(entry.audioPath, entry.issue ?? "Invalid cache audio.", removed, cacheDir);
  }

  const rootEntries = await readCacheRoot(cacheDir);

  for (const rootEntry of rootEntries) {
    if (rootEntry.isDirectory()) {
      continue;
    }

    if (rootEntry.name.endsWith(NARRATION_CACHE_METADATA_EXTENSION)) {
      continue;
    }

    if (keptAudioFiles.has(rootEntry.name)) {
      continue;
    }

    await removeIfPresent(
      resolve(cacheDir, rootEntry.name),
      "Orphaned cache artifact without healthy metadata.",
      removed,
      cacheDir,
    );
  }

  removed.sort((left, right) => left.path.localeCompare(right.path));

  return {
    kept,
    removed,
  };
}

export async function clearNarrationCache(
  options: ClearNarrationCacheOptions,
): Promise<void> {
  const cacheDir = resolveCacheDir(options.cacheDir);

  await rm(cacheDir, { recursive: true, force: true });
}

function toNarrationCacheListEntry(inspection: NarrationCacheInspection): NarrationCacheListEntry {
  if (inspection.status === "ready") {
    return {
      key: inspection.entry.key,
      status: "ready",
      issue: null,
      version: inspection.entry.metadata.version,
      request: inspection.entry.metadata.request,
      audioPath: inspection.entry.audioPath,
      metadataPath: inspection.entry.metadataPath,
      byteSize: inspection.entry.byteSize,
      durationMs: inspection.entry.durationMs,
    };
  }

  return {
    key: inspection.key,
    status: inspection.status,
    issue: inspection.issue,
    version: inspection.version,
    request: null,
    audioPath: inspection.audioPath,
    metadataPath: inspection.metadataPath,
    byteSize: null,
    durationMs: null,
  };
}

async function removeIfPresent(
  path: string | null,
  reason: string,
  removed: PrunedNarrationCacheArtifact[],
  cacheDir: string,
): Promise<void> {
  if (path === null || !isWithinDirectory(cacheDir, resolve(path))) {
    return;
  }

  const resolvedPath = resolve(path);

  await rm(resolvedPath, { force: true, recursive: true });
  removed.push({
    path: resolvedPath,
    reason,
  });
}

async function findMetadataPaths(cacheDir: string): Promise<string[]> {
  const rootEntries = await readCacheRoot(cacheDir);

  return rootEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(NARRATION_CACHE_METADATA_EXTENSION))
    .map((entry) => resolve(cacheDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

async function readCacheRoot(cacheDir: string) {
  return await readdir(cacheDir, { withFileTypes: true }).catch((error: unknown) => {
    if (
      typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  });
}

function resolveCacheDir(cacheDir: string): string {
  if (cacheDir.trim().length === 0) {
    throw new Error("Narration cache directory must not be empty.");
  }

  return resolve(cacheDir);
}

function isWithinDirectory(directory: string, target: string): boolean {
  if (directory === target) {
    return true;
  }

  const normalizedDirectory = directory.endsWith(sep) ? directory : `${directory}${sep}`;

  return target.startsWith(normalizedDirectory);
}

function compareListEntries(left: NarrationCacheListEntry, right: NarrationCacheListEntry): number {
  return left.key.localeCompare(right.key) || left.metadataPath.localeCompare(right.metadataPath);
}
