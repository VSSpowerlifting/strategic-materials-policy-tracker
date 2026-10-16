/** Explicit maintainer-only, offline F5-5 text handoff. Reads private files; stdout only. */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { getAllSources } from "../lib/data";
import { auditF5SourceDrift } from "../lib/f5-source-drift";
import { buildF5PrivateVersionHandoff, formatF5PrivateVersionHandoff } from "../lib/f5-source-version-diff";

const usage = "Usage: npm run review:f5-versions -- --before prior.json --after current.json --source-id ID --before-body prior.txt --after-body current.txt [--json]";
function read(path: string, max: number): string {
  if (statSync(path).size > max) throw Error("F5 private handoff: input exceeds bounded limit");
  return readFileSync(path, "utf8");
}
function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--check-runtime") {
    process.stdout.write("F5-5 private handoff available; no files accessed\n"); return;
  }
  const keys = ["--before", "--after", "--source-id", "--before-body", "--after-body"];
  if ((args.length !== 10 && args.length !== 11) ||
      args.some(a => a.startsWith("--") && ![...keys, "--json"].includes(a)) ||
      keys.some(k => args.filter(a => a === k).length !== 1) ||
      args.filter(a => a === "--json").length !== (args.length === 11 ? 1 : 0))
    throw Error(usage);
  const values = keys.map(k => args[args.indexOf(k) + 1]);
  if (values.some(v => !v || v.startsWith("--"))) throw Error(usage);
  const [before, after, sourceId, beforeBody, afterBody] = values;
  const paths = [before, after, beforeBody, afterBody].map(resolve);
  if (new Set(paths).size !== paths.length) throw Error("F5 private handoff: inputs must be distinct files");
  const receipt = auditF5SourceDrift(
    JSON.parse(read(paths[0], 2_000_000)), JSON.parse(read(paths[1], 2_000_000)), getAllSources(),
  );
  const item = receipt.cases.find(c => c.sourceId === sourceId);
  if (!item) throw Error("F5 private handoff: source absent from audited receipt");
  const report = buildF5PrivateVersionHandoff(
    item, read(paths[2], 128_000), read(paths[3], 128_000),
  );
  process.stdout.write(args.includes("--json")
    ? JSON.stringify(report, null, 2) + "\n" : formatF5PrivateVersionHandoff(report));
}
try { main(); } catch (e) {
  process.stderr.write("F5-5 private handoff: " + String(e) + "\n");
  process.exitCode = 2;
}
