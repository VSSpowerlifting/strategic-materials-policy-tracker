/**
 * Filesystem side of the Controls integration feed.
 *
 * `lib/controls-feed.ts` is pure: it turns a snapshot into file contents.
 * This module reads the archived snapshot and a review overlay from disk,
 * writes a release directory and reads one back. A release directory is
 * written once: writing over a directory that holds different content is
 * refused, so a release identity can never come to name two payloads.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  ControlsIntegrityError,
  PUBLISHED_CONTROLS_RELEASES,
  readControlsArchive,
} from "./controls-release-archive";
import { applyReviewOverlay, validateOverlayHeader, type ReviewOverlay } from "./controls-review-overlay";
import {
  buildControlsFeed,
  verifyFeedFiles,
  type FeedBundle,
  type FeedDatasets,
  type FeedManifest,
} from "./controls-feed";
import type { FeedView } from "./controls-standing";

export type LoadedFeed = { manifest: FeedManifest; datasets: FeedDatasets; view: FeedView };

/** Read every `.json` file of a release directory, keyed by file name. */
export function readFeedDir(dir: string): Record<string, string> {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new ControlsIntegrityError(`feed directory is missing: ${dir}`);
  }
  const files: Record<string, string> = {};
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".json")) throw new ControlsIntegrityError(`unexpected file in feed directory: ${name}`);
    files[name] = readFileSync(join(dir, name), "utf8");
  }
  return files;
}

/** Read a release directory and verify it against its own manifest. */
export function loadFeedRelease(dir: string): LoadedFeed {
  const { manifest, datasets } = verifyFeedFiles(readFeedDir(dir));
  return { manifest, datasets, view: { legalStatusCutoff: manifest.legalStatusCutoff, publishedReplayRequiresBaseline: manifest.pendingReview?.publishedReplayRequiresBaseline, datasets } };
}

/**
 * Write a release into a directory. An empty or absent directory is filled;
 * a directory that already holds exactly these files is left alone; anything
 * else is refused.
 */
export function writeFeedDir(dir: string, files: Record<string, string>): "written" | "unchanged" {
  const checkExisting = (): "unchanged" => {
    const names = Object.keys(files).sort();
    const existing = readdirSync(dir).sort();
    if (existing.length === names.length && names.every((name, i) =>
      name === existing[i] && readFileSync(join(dir, name), "utf8") === files[name])) return "unchanged";
    throw new ControlsIntegrityError(`${dir} already holds different content; choose a new release directory`);
  };
  if (existsSync(dir) && readdirSync(dir).length) return checkExisting();
  mkdirSync(dirname(dir), { recursive: true });
  const staging = mkdtempSync(join(dirname(dir), ".controls-feed-"));
  try {
    for (const [name, content] of Object.entries(files)) writeFileSync(join(staging, name), content, "utf8");
    try {
      renameSync(staging, dir);
    } catch (error) {
      // A concurrent writer may already have installed the complete directory.
      if (existsSync(dir) && readdirSync(dir).length) return checkExisting();
      throw error;
    }
    return "written";
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

/** Read and validate a review overlay file. */
export function loadReviewOverlay(path: string): ReviewOverlay {
  if (!existsSync(path)) throw new ControlsIntegrityError(`review overlay is missing: ${path}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new ControlsIntegrityError(`review overlay is not valid JSON: ${path}`);
  }
  const overlay = parsed as ReviewOverlay;
  if (!overlay || typeof overlay !== "object" || !overlay.baseline || !Array.isArray(overlay.operations) || !Array.isArray(overlay.instrumentDates)) {
    throw new ControlsIntegrityError(`review overlay has no baseline, operations or instrumentDates: ${path}`);
  }
  validateOverlayHeader(overlay);
  return overlay;
}

export const latestPublishedAsOf = (): string =>
  PUBLISHED_CONTROLS_RELEASES.map((release) => release.asOf).sort().slice(-1)[0];

export type BuildReleaseOptions = {
  /** Which archived snapshot to build from. Defaults to the latest published one. */
  asOf?: string;
  /** The day the release is assembled. Always stated; never read from a clock. */
  curatedOn: string;
  overlayPath?: string;
  /** Directory of the release this one follows; adds `changes.json`. */
  previousDir?: string;
  root?: string;
};

/** Build a release from the archived snapshot, an optional overlay and an optional previous release. */
export function buildFeedRelease(options: BuildReleaseOptions): FeedBundle {
  const root = options.root ?? process.cwd();
  const snapshot = readControlsArchive(options.asOf ?? latestPublishedAsOf(), root);
  const previous = options.previousDir ? loadFeedRelease(options.previousDir) : undefined;
  if (!options.overlayPath) {
    return buildControlsFeed({ snapshot, curatedOn: options.curatedOn, previous });
  }
  const overlay = loadReviewOverlay(options.overlayPath);
  const result = applyReviewOverlay(snapshot, overlay);
  return buildControlsFeed({
    snapshot: result.snapshot,
    review: { overlay, result },
    curatedOn: options.curatedOn,
    previous,
  });
}
