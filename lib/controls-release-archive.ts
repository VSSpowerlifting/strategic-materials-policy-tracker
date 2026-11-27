/**
 * Immutable archive of published Controls snapshots.
 *
 * `lib/controls-snapshot.ts` builds a snapshot from the live record, so its
 * output moves whenever the record does. A consumer who loaded an earlier
 * release needs that release to stay reproducible after the record advances.
 * Each published release is therefore kept, byte for byte, under
 * `data/releases/controls/<asOf>/`, and this module reads it back and checks
 * every file against the identity pinned here.
 *
 * Nothing in this file reads a clock. A release is named by its `asOf` date
 * and identified by the digest of its four dataset files.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CONTROLS_DATASET_FILES = [
  "control-clauses.json",
  "policy-events.json",
  "control-status-history.json",
  "sources.json",
] as const;
export type ControlsDatasetFile = (typeof CONTROLS_DATASET_FILES)[number];

export type JsonObject = Record<string, unknown>;

export type ControlsSnapshotManifest = {
  datasetVersion: string;
  schemaVersion: number;
  asOf: string;
  sourceDatasetVersion: string;
  datasets: Record<string, { rows: number; sha256: string }>;
};

/** The four datasets of one snapshot, parsed. Rows stay loosely typed on purpose. */
export type ControlsSnapshotRows = {
  clauses: JsonObject[];
  events: JsonObject[];
  statusHistory: JsonObject[];
  sources: JsonObject[];
};

export type ControlsSnapshot = {
  manifest: ControlsSnapshotManifest;
  /** Exact file contents, keyed by dataset file name. */
  contents: Record<ControlsDatasetFile, string>;
  rows: ControlsSnapshotRows;
};

/**
 * Releases that have been published. `datasetVersion` is the identity a
 * consumer recorded; `zipSha256` is the published download; `sourceCommit` is
 * the commit whose record rebuilds the release.
 */
export const PUBLISHED_CONTROLS_RELEASES = [
  {
    asOf: "2026-11-12",
    datasetVersion:
      "smpt-controls-v1-2026-11-12-be5b774228b6206368a6873fee5ab3945b116e346be85ef54e3aa4ab4a6b8ecb",
    manifestSha256: "02b6444bc90d6102600cb3be795c924b333edd1a61277950c588b0177e8aa6d0",
    zipSha256: "40e142cc257d04ade1f2b36aa573872d3322bd5b7b1b15bc6dd666a20d403b55",
    sourceCommit: "ecffb92c1b2bdbcfb6c560d0573b6a0666642e8a",
  },
] as const;

export class ControlsIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ControlsIntegrityError";
  }
}

export const sha256Hex = (text: string | Uint8Array): string =>
  createHash("sha256").update(text).digest("hex");

/** The serialisation every Controls artefact uses: two-space JSON and one final newline. */
export const stableJson = (value: unknown): string => JSON.stringify(value, null, 2) + "\n";

/** Recompute a snapshot's dataset table and identity from its file contents. */
export function snapshotIdentity(
  contents: Record<ControlsDatasetFile, string>,
  schemaVersion: number,
  asOf: string,
): { datasetVersion: string; datasets: ControlsSnapshotManifest["datasets"] } {
  const datasets: ControlsSnapshotManifest["datasets"] = {};
  for (const name of CONTROLS_DATASET_FILES) {
    const rows: unknown = JSON.parse(contents[name]);
    if (!Array.isArray(rows)) throw new ControlsIntegrityError(`${name} is not a JSON array`);
    datasets[name] = { rows: rows.length, sha256: sha256Hex(contents[name]) };
  }
  return {
    datasets,
    datasetVersion: `smpt-controls-v${schemaVersion}-${asOf}-${sha256Hex(stableJson(datasets))}`,
  };
}

function parseRows(contents: Record<ControlsDatasetFile, string>): ControlsSnapshotRows {
  const read = (name: ControlsDatasetFile) => JSON.parse(contents[name]) as JsonObject[];
  return {
    clauses: read("control-clauses.json"),
    events: read("policy-events.json"),
    statusHistory: read("control-status-history.json"),
    sources: read("sources.json"),
  };
}

/** Build a snapshot object from four file contents and a manifest, verifying both. */
export function verifySnapshot(
  manifest: ControlsSnapshotManifest,
  contents: Record<ControlsDatasetFile, string>,
): ControlsSnapshot {
  const identity = snapshotIdentity(contents, manifest.schemaVersion, manifest.asOf);
  for (const name of CONTROLS_DATASET_FILES) {
    const stated = manifest.datasets[name];
    const actual = identity.datasets[name];
    if (!stated) throw new ControlsIntegrityError(`manifest lists no entry for ${name}`);
    if (stated.sha256 !== actual.sha256) {
      throw new ControlsIntegrityError(
        `${name} does not match its manifest: expected sha256 ${stated.sha256}, found ${actual.sha256}`,
      );
    }
    if (stated.rows !== actual.rows) {
      throw new ControlsIntegrityError(
        `${name} does not match its manifest: expected ${stated.rows} rows, found ${actual.rows}`,
      );
    }
  }
  if (identity.datasetVersion !== manifest.datasetVersion) {
    throw new ControlsIntegrityError(
      `manifest datasetVersion ${manifest.datasetVersion} does not match its datasets (${identity.datasetVersion})`,
    );
  }
  return { manifest, contents, rows: parseRows(contents) };
}

export const controlsArchiveDir = (asOf: string, root: string = process.cwd()): string =>
  join(root, "data", "releases", "controls", asOf);

/**
 * Read one archived release and verify it against its own manifest and against
 * the identity pinned in `PUBLISHED_CONTROLS_RELEASES`.
 */
export function readControlsArchive(asOf: string, root: string = process.cwd()): ControlsSnapshot {
  const pinned = PUBLISHED_CONTROLS_RELEASES.find((release) => release.asOf === asOf);
  if (!pinned) throw new ControlsIntegrityError(`no published Controls release is pinned for ${asOf}`);
  const dir = controlsArchiveDir(asOf, root);
  if (!existsSync(dir)) throw new ControlsIntegrityError(`archive directory is missing: ${dir}`);
  const rawManifest = readFileSync(join(dir, "manifest.json"), "utf8");
  const manifest = JSON.parse(rawManifest) as ControlsSnapshotManifest;
  if (manifest.datasetVersion !== pinned.datasetVersion) {
    throw new ControlsIntegrityError(
      `archived manifest for ${asOf} states ${manifest.datasetVersion}; the pinned release is ${pinned.datasetVersion}`,
    );
  }
  const contents = {} as Record<ControlsDatasetFile, string>;
  for (const name of CONTROLS_DATASET_FILES) contents[name] = readFileSync(join(dir, name), "utf8");
  const snapshot = verifySnapshot(manifest, contents);
  if (sha256Hex(rawManifest) !== pinned.manifestSha256) {
    throw new ControlsIntegrityError("archived manifest bytes differ from the published manifest");
  }
  return snapshot;
}

/** Serialise parsed rows back into the four snapshot files and their manifest. */
export function snapshotFromRows(
  rows: ControlsSnapshotRows,
  base: Pick<ControlsSnapshotManifest, "schemaVersion" | "asOf" | "sourceDatasetVersion">,
): ControlsSnapshot {
  const contents: Record<ControlsDatasetFile, string> = {
    "control-clauses.json": stableJson(rows.clauses),
    "policy-events.json": stableJson(rows.events),
    "control-status-history.json": stableJson(rows.statusHistory),
    "sources.json": stableJson(rows.sources),
  };
  const identity = snapshotIdentity(contents, base.schemaVersion, base.asOf);
  return {
    manifest: { datasetVersion: identity.datasetVersion, ...base, datasets: identity.datasets },
    contents,
    rows: parseRows(contents),
  };
}
