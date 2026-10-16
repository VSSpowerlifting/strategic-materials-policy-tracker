/**
 * Maintainer-operated, offline F5-5 provenance-drift dry run.
 *
 * npm run audit:f5-drift -- --before /private/prior.json --after /private/now.json [--json]
 * This CLI reads ONLY two explicitly supplied local JSON files and the
 * published source registry. It never fetches URLs, saves data, promotes a
 * reviewer candidate, modifies seeds, or runs automatically.
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { getAllSources } from "../lib/data";
import { auditF5SourceDrift, formatF5DriftReceipt } from "../lib/f5-source-drift";

const LIMIT = 2_000_000;
const usage = "Usage: npm run audit:f5-drift -- --before <private-prior.json> --after <private-current.json> [--json]";
function readSnapshots(path: string): unknown {
  const full = resolve(path);
  if (statSync(full).size > LIMIT) throw Error("F5-5 input exceeds 2 MB bounded dry-run limit");
  return JSON.parse(readFileSync(full, "utf8")) as unknown;
}
function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--check-runtime") {
    process.stdout.write("F5-5 offline CLI available; zero files read or written\n");
    return;
  }
  const allowed = new Set(["--before", "--after", "--json"]);
  if (args.some(arg => arg.startsWith("--") && !allowed.has(arg)) ||
      args.filter(x => x === "--before").length !== 1 ||
      args.filter(x => x === "--after").length !== 1 ||
      args.filter(x => x === "--json").length > 1 ||
      (args.length !== 4 && !(args.length === 5 && args.includes("--json"))))
    throw Error(usage);
  const indexBefore = args.indexOf("--before");
  const indexAfter = args.indexOf("--after");
  const beforePath = args[indexBefore + 1], afterPath = args[indexAfter + 1];
  if (!beforePath || !afterPath || beforePath.startsWith("--") || afterPath.startsWith("--") ||
      beforePath === afterPath)
    throw Error(usage + " (inputs must be distinct files)");
  const report = auditF5SourceDrift(readSnapshots(beforePath), readSnapshots(afterPath), getAllSources());
  process.stdout.write(args.includes("--json")
    ? JSON.stringify(report, null, 2) + "\n"
    : formatF5DriftReceipt(report));
}
try { main(); } catch (error) {
  process.stderr.write("F5-5 source drift: " + String(error) + "\n");
  process.exitCode = 2;
}
