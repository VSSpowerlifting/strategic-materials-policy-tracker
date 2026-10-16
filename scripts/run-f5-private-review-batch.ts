/**
 * Local-only batch of provenance drift -> existing private M3/M1 review.
 * No remote access, writes, seed promotion, monitor or workflow dispatch.
 */
import {
  lstatSync, readFileSync, realpathSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { buildM3ReviewerPackets } from "./project-execution-review-packets";
import {
  buildF5PrivateReviewBatch, renderF5PrivateReviewBatch,
} from "./f5-review-batch";

const usage = "Usage: npm run review:f5-batch -- --sequence PRIVATE_SEQUENCE.json [--bodies PRIVATE_PATH_MANIFEST.json] [--ledger PRIVATE_LEDGER.json] [--ack PRIVATE_ACKS.json] [--require-content-diffs] [--json]";
function file(path: string, max: number): string {
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > max)
    throw Error("F5 batch: input must be a regular bounded file; no symlinks");
  return readFileSync(path, "utf8");
}
/** Manually identified body files must be confined to the manifest directory. */
function privateBodyPath(manifest: string, name: unknown): string {
  if (typeof name !== "string" || !name || isAbsolute(name) || name.includes("\0") ||
      name.includes("\\"))
    throw Error("F5 batch: body path must be relative to private manifest directory");
  const base = realpathSync(dirname(manifest));
  const target = resolve(base, name);
  const subpath = relative(base, target);
  if (!subpath || subpath === ".." || subpath.startsWith(".." + sep) ||
      isAbsolute(subpath))
    throw Error("F5 batch: body path escapes private manifest directory");
  const info = lstatSync(target);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 128_000 ||
      realpathSync(target) !== target)
    throw Error("F5 batch: body must be a regular bounded non-symlink file");
  return target;
}
const object = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x);
function readBodyPairs(path: string, otherFiles: string[]) {
  const raw: unknown = JSON.parse(file(path, 64_000));
  if (!object(raw) || raw.schemaVersion !== "f5-5-private-body-paths-1" ||
      !Array.isArray(raw.entries) || raw.entries.length > 128 ||
      Object.keys(raw).sort().join("|") !== "entries|schemaVersion")
    throw Error("F5 batch: invalid private body-path manifest");
  const paths = new Set(otherFiles.concat([path]));
  const rows: {reviewKey: string; beforeText: string; afterText: string}[] = [];
  for (const x of raw.entries) {
    if (!object(x) || typeof x.reviewKey !== "string" ||
        typeof x.beforePath !== "string" || typeof x.afterPath !== "string" ||
        Object.keys(x).sort().join("|") !== "afterPath|beforePath|reviewKey")
      throw Error("F5 batch: invalid private body-pair manifest row");
    const before = privateBodyPath(path, x.beforePath);
    const after = privateBodyPath(path, x.afterPath);
    if (before === after || paths.has(before) || paths.has(after))
      throw Error("F5 batch: body inputs must be distinct from each other and from manifests");
    paths.add(before); paths.add(after);
    rows.push({
      reviewKey: x.reviewKey,
      beforeText: file(before, 128_000),
      afterText: file(after, 128_000),
    });
  }
  return rows;
}
function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--check-runtime") {
    process.stdout.write("F5-5 private multi-capture reviewer batch available; no files accessed\n");
    return;
  }
  let json = false, strict = false;
  const fields = new Map<string, string>();
  const allowed = ["--sequence", "--bodies", "--ledger", "--ack"];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json" && !json) { json = true; continue; }
    if (a === "--require-content-diffs" && !strict) { strict = true; continue; }
    if (!allowed.includes(a) || fields.has(a) ||
        !args[i + 1] || args[i + 1].startsWith("--"))
      throw Error(usage);
    fields.set(a, args[++i]);
  }
  if (!fields.has("--sequence")) throw Error(usage);
  const paths = new Map([...fields].map(([key, val]) => [key, resolve(val)]));
  const distinct = [...paths.values()];
  if (new Set(distinct).size !== distinct.length)
    throw Error("F5 batch: all local inputs must have distinct paths");
  const sequence = JSON.parse(file(paths.get("--sequence")!, 4_000_000));
  const ledger = paths.has("--ledger")
    ? JSON.parse(file(paths.get("--ledger")!, 2_000_000)) : null;
  const acknowledgments = paths.has("--ack")
    ? JSON.parse(file(paths.get("--ack")!, 64_000)) : null;
  const bodies = paths.has("--bodies")
    ? readBodyPairs(paths.get("--bodies")!, distinct) : null;
  const report = buildF5PrivateReviewBatch({
    sequence, sources: getAllSources(),
    m3: buildM3ReviewerPackets(queue, {
      projects: getAllProjects(), sources: getAllSources(),
      commitments: getAllFinancialCommitments(), corpusCutoff: site.lastUpdated,
      publicMilestoneCount: getAllProjectMilestones().length,
    }),
    privateLedger: ledger, bodyPairs: bodies,
    acknowledgments, requireContentDiffs: strict,
  });
  process.stdout.write(json ? JSON.stringify(report, null, 2) + "\n" :
    renderF5PrivateReviewBatch(report));
}
try { main(); } catch (e) {
  process.stderr.write("F5-5 private review batch refused: " +
    (e instanceof Error ? e.message : String(e)) + "\n");
  process.exitCode = 2;
}
