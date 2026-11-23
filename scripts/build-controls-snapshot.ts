import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildControlsSnapshotBundle } from "../lib/controls-snapshot";

const [out, ...extra] = process.argv.slice(2);
if (!out || extra.length) throw new Error("Usage: npm run snapshot:controls -- <new-output-directory>");

const { manifest, files } = buildControlsSnapshotBundle();

// Require a fresh directory. The manifest is written last so consumers can
// check the finished dataset files against its checksums.
mkdirSync(out);
for (const { name, content } of files) writeFileSync(join(out, name), content);
console.log(manifest.datasetVersion);
