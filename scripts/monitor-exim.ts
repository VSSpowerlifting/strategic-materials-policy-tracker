/**
 * Explicit EXIM shadow entry point, independent of the M1 two-source scanner.
 * The first live bootstrap MUST be manually dispatched and reviewed.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXIM_LISTING, EXIM_SOURCE_ID, readEximState, runEximShadow,
  type EximEditorialQueue, type EximReport,
} from "../lib/exim-shadow-monitor";

const dir = join(process.cwd(), ".monitor-exim");
const stateFile = join(dir, "state.json");
const reportFile = join(dir, "report.json");
const queueFile = join(dir, "editorial-review-queue.json");
const summaryFile = join(dir, "summary.md");
function atomic(path: string, data: unknown): void {
  const temp = path + "." + process.pid + ".tmp";
  writeFileSync(temp, JSON.stringify(data, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  renameSync(temp, path);
}
function summary(report: EximReport, queue: EximEditorialQueue): string {
  return [
    "## SMPT M2.1 EXIM independent shadow monitor",
    "",
    "Run at: " + report.observedAt + ". EXIM releases are NOT verified policy events or commitments.",
    "",
    "| Source | Health | HTTP | Releases | Pages | New | Revised | Bootstrap | Coverage gap |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    "| " + EXIM_SOURCE_ID + " | " + report.health + " | " + (report.status ?? "n/a") +
      " | " + report.observed + " | " + report.pagesRead + " | " + report.newCount +
      " | " + report.revisedCount + " | " + (report.baseline ? "yes" : "no") +
      " | " + (report.possibleWindowGap ? "yes" : "no") + " |",
    "",
    "Editorial listing contains " + queue.items.length + " UNVERIFIED items; keyword matches are hints only.",
    report.health === "ok" && !report.possibleWindowGap
      ? "Release listing and article bodies passed configured checks; this does NOT establish historical completeness."
      : "DEGRADED/UNCERTAIN: inspect report.json before further collection.",
    report.baseline ? "Explicit first-run baseline: no new or revised publications claimed." : "",
    report.message ? "Diagnostic: " + report.message.replace(/[\r\n|]/g, " ").slice(0, 240) : "",
    "",
    "Independent state: separate 30-day Actions artifact. Existing Canada/Interior monitor and candidate ledger unchanged.",
    "EXIM review-only JSON has a distinct schema; it is not yet importable through the M1 local sync command.",
    "Official index: " + EXIM_LISTING,
    "",
  ].filter(Boolean).join("\n") + "\n";
}
async function main(): Promise<void> {
  if (process.argv.includes("--check-runtime")) {
    if (EXIM_SOURCE_ID !== "watch-us-exim-news-shadow" || !EXIM_LISTING.startsWith("https://www.exim.gov/"))
      throw Error("Unexpected EXIM monitoring registration");
    process.stdout.write("M2.1 EXIM CLI runtime check passed (offline, no source fetch or files written)\n");
    return;
  }
  if (process.argv.slice(2).length) throw Error("Unexpected EXIM monitor argument");
  const raw = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) as unknown : null;
  const previous = readEximState(raw);
  const bootstrap = process.env.SMPT_EXIM_BOOTSTRAP === "true";
  if (bootstrap && previous) throw Error("An EXIM baseline already exists: refuse explicit bootstrap and protect continuity");
  if (!bootstrap && !previous) throw Error("No EXIM baseline recovered; do not silently reset. Bootstrap requires explicit manual authorization.");
  const result = await runEximShadow(previous, new Date().toISOString(), bootstrap);
  mkdirSync(dir, { recursive: true });
  atomic(reportFile, result.report);
  atomic(queueFile, result.queue);
  writeFileSync(summaryFile, summary(result.report, result.queue), { mode: 0o600 });
  if (result.report.health === "ok" && !result.report.possibleWindowGap && result.state) {
    atomic(stateFile, result.state);
  }
  process.stdout.write(summary(result.report, result.queue));
  if (result.report.health !== "ok" || result.report.possibleWindowGap) process.exitCode = 1;
}
main().catch((error) => { process.stderr.write("EXIM monitor failed: " + String(error) + "\n"); process.exitCode = 1; });
