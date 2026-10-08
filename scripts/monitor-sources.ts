/**
 * Run: npm run monitor:pilot
 * Inputs are ONLY the registered official URLs for the two M1 source IDs,
 * and best-effort prior observation state under .monitor-pilot/state.json.
 * Outputs contain PUBLIC official publication metadata and source health;
 * never write seed, candidate or webpage content from this scanner.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAllWatchedSources } from "../lib/data";
import { PILOT_SOURCE_IDS, pilotEndpoint, readMonitorState, runSourcePilot, type PilotReport } from "../lib/source-monitor";

const dir = join(process.cwd(), ".monitor-pilot");
const stateFile = join(dir, "state.json");
const reportFile = join(dir, "report.json");
const summaryFile = join(dir, "summary.md");
const observedAt = new Date().toISOString();

function atomicJson(path: string, value: unknown): void {
  const temp = path + ".tmp";
  writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  renameSync(temp, path);
}
function summary(report: PilotReport): string {
  const lines = [
    "## SMPT M1 source-monitoring pilot (shadow)",
    "",
    "Run at: `" + report.observedAt + "`. This is a **publication observation**, not a verified SMPT policy event.",
    "",
    "| Registered source | Health | Observed | New | Revised | Bootstrap | Possible feed gap |",
    "| --- | --- | ---: | ---: | ---: | --- | --- |",
  ];
  for (const r of report.sources) {
    // Only fixed registered source IDs and finite numeric fields enter Markdown.
    lines.push("| `" + r.sourceId + "` | " + r.health + " | " + r.observed + " | " + r.newCount +
      " | " + r.revisedCount + " | " + (r.baseline ? "yes" : "no") +
      " | " + (r.possibleWindowGap ? "yes" : "no") + " |");
  }
  lines.push("", "Review-only metadata are in the run artifact. Do not automatically create events, change financial rows, or promote private candidates.");
  if (report.degradedSources) lines.push("", "**Warning:** " + report.degradedSources + " source(s) degraded. This run does not establish full coverage; see report.json.");
  if (report.sources.some((r) => r.possibleWindowGap)) lines.push("", "**Warning:** a finite listing may have rolled over; manually review the date gap.");
  if (report.sources.some((r) => r.baseline)) lines.push("", "**Baseline:** a first successful scan is not a newly discovered policy event.");
  return lines.join("\n") + "\n";
}

/**
 * Explicit async entry point: this repository's tsx CLI runs in CommonJS
 * mode, which does not permit top-level await. The runtime check exercises
 * exactly the npm CLI path in CI, without touching networks or output files.
 */
async function main(): Promise<void> {
  const watchlist = getAllWatchedSources();
  if (process.argv.includes("--check-runtime")) {
    for (const id of PILOT_SOURCE_IDS) {
      const source = watchlist.find((entry) => entry.id === id);
      if (!source || source.status !== "active") throw Error("Missing active pilot source: " + id);
      pilotEndpoint(source);
    }
    process.stdout.write("SMPT pilot CLI runtime check passed (offline, no observations written)\n");
    return;
  }

  mkdirSync(dir, { recursive: true });
  const previous = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) as unknown : null;
  const result = await runSourcePilot(watchlist, readMonitorState(previous), observedAt);
  // Always write complete report before advancing durable state. Any failed
  // source retains its prior identity memory. The workflow's final health gate
  // deliberately fails after uploading logs when one source was degraded.
  atomicJson(reportFile, result.report);
  writeFileSync(summaryFile, summary(result.report), "utf8");
  atomicJson(stateFile, result.state);
  process.stdout.write(summary(result.report));
}

void main().catch((e: unknown) => {
  process.stderr.write("SMPT monitoring configuration/state error: " + String(e) + "\n");
  process.exitCode = 2;
});
