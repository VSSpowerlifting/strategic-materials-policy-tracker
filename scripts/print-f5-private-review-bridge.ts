/** Manual, read-only F5-5 handoff. Reads only explicitly supplied private files. */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { auditF5SourceDrift } from "../lib/f5-source-drift";
import { buildF5PrivateVersionHandoff } from "../lib/f5-source-version-diff";
import { buildM3ReviewerPackets } from "./project-execution-review-packets";
import { buildF5PrivateReviewerBridge, renderF5PrivateReviewerBridge } from "./f5-private-review-bridge";
const usage = "Usage: npm run review:f5-bridge -- --before prior.json --after current.json --source-id ID [--before-body prior.txt --after-body current.txt] [--ledger private-ledger.json] [--ack private-ack.json] [--json]";
function read(path: string, max: number): string {
  if (statSync(path).size > max) throw Error("F5 bridge: private input exceeds limit");
  return readFileSync(path, "utf8");
}
function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--check-runtime") {
    process.stdout.write("F5-5 private review bridge available; no files accessed\n");
    return;
  }
  const required = ["--before", "--after", "--source-id"];
  const keys = [...required, "--before-body", "--after-body", "--ledger", "--ack"];
  const values = new Map<string, string>();
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json" && !json) { json = true; continue; }
    if (!keys.includes(args[i]) || values.has(args[i]) ||
      !args[i + 1] || args[i + 1].startsWith("--")) throw Error(usage);
    values.set(args[i], args[++i]);
  }
  if (required.some(k => !values.has(k)) ||
    values.has("--before-body") !== values.has("--after-body")) throw Error(usage);
  const paths = keys.filter(k => k !== "--source-id" && values.has(k))
    .map(k => resolve(values.get(k)!));
  if (new Set(paths).size !== paths.length)
    throw Error("F5 bridge: distinct private file paths required");
  const sourceId = values.get("--source-id")!;
  const sources = getAllSources();
  const drift = auditF5SourceDrift(
    JSON.parse(read(resolve(values.get("--before")!), 2_000_000)),
    JSON.parse(read(resolve(values.get("--after")!), 2_000_000)), sources,
  );
  const item = drift.cases.find(c => c.sourceId === sourceId);
  if (!item) throw Error("F5 bridge: source absent from audited receipt");
  const m3 = buildM3ReviewerPackets(queue, {
    projects: getAllProjects(), sources,
    commitments: getAllFinancialCommitments(), corpusCutoff: site.lastUpdated,
    publicMilestoneCount: getAllProjectMilestones().length,
  });
  const diff = values.has("--before-body")
    ? buildF5PrivateVersionHandoff(item,
      read(resolve(values.get("--before-body")!), 128_000),
      read(resolve(values.get("--after-body")!), 128_000)) : null;
  const ledger = values.has("--ledger")
    ? JSON.parse(read(resolve(values.get("--ledger")!), 2_000_000)) : null;
  const ack = values.has("--ack")
    ? JSON.parse(read(resolve(values.get("--ack")!), 10_000)) : null;
  const report = buildF5PrivateReviewerBridge(item, m3, ledger, diff, ack);
  process.stdout.write(json ? JSON.stringify(report, null, 2) + "\n" :
    renderF5PrivateReviewerBridge(report));
}
try { main(); } catch (e) {
  process.stderr.write("F5-5 reviewer bridge refused: " +
    (e instanceof Error ? e.message : String(e)) + "\n");
  process.exitCode = 2;
}
