import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildControlsSnapshotBundle } from "../lib/controls-snapshot";
import { buildPublishedControlsSnapshotBundle } from "../lib/published-controls-download";

const [out, ...extra] = process.argv.slice(2);
if (!out || (extra.length && (extra.length !== 1 || extra[0] !== "--live"))) {
  throw new Error("Usage: npm run snapshot:controls -- <new-output-directory> [--live]");
}

// --live is a staging build, not an issued download.
const { manifest, files } = extra[0] === "--live"
  ? buildControlsSnapshotBundle()
  : buildPublishedControlsSnapshotBundle();

// Require a fresh directory. The manifest is written last so consumers can
// check the finished dataset files against its checksums.
mkdirSync(out);
for (const { name, content } of files) writeFileSync(join(out, name), content);
console.log(manifest.datasetVersion);
