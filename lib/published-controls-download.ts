/**
 * The downloadable research snapshot is a published artifact, not a fresh
 * view of mutable seed records. Targeted corrections must not change it.
 * Admit a new pinned artifact explicitly before moving this pointer.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLS_DATASET_FILES,
  ControlsIntegrityError,
  PUBLISHED_CONTROLS_RELEASES,
  readControlsArchive,
  sha256Hex,
  stableJson,
} from "./controls-release-archive";

export const PUBLIC_CONTROLS_DOWNLOAD_AS_OF = "2026-11-12";
const COMPANION_HASHES = {
  "README.md": "d4cb7952ea71eba90c1914da746b55a6607db3283b39e519ae71c6d8c5c39d73",
  "worked_example.py": "cfbd323adf8e5723209b89b14f15242facd861d1d12dc06d8f6751bfae5e37e5",
} as const;

/** Do not import the live dataset builder here. The release has its own pin. */
export function buildPublishedControlsSnapshotBundle(root = process.cwd()) {
  const snapshot = readControlsArchive(PUBLIC_CONTROLS_DOWNLOAD_AS_OF, root);
  const pin = PUBLISHED_CONTROLS_RELEASES.find(
    (release) => release.asOf === PUBLIC_CONTROLS_DOWNLOAD_AS_OF,
  );
  if (!pin) throw new ControlsIntegrityError("published download has no release pin");
  const manifest = stableJson(snapshot.manifest);
  if (sha256Hex(manifest) !== pin.manifestSha256) {
    throw new ControlsIntegrityError("published download manifest serialization changed");
  }
  const files = CONTROLS_DATASET_FILES.map((name) => ({
    name: String(name), content: snapshot.contents[name],
  }));
  for (const name of Object.keys(COMPANION_HASHES) as (keyof typeof COMPANION_HASHES)[]) {
    const content = readFileSync(join(root, "docs/engineering/controls-snapshot", name), "utf8");
    if (sha256Hex(content) !== COMPANION_HASHES[name]) {
      throw new ControlsIntegrityError(`published download companion ${name} differs from the original release`);
    }
    files.push({ name, content });
  }
  files.push({ name: "manifest.json", content: manifest });
  return { manifest: snapshot.manifest, files, zipSha256: pin.zipSha256 };
}
