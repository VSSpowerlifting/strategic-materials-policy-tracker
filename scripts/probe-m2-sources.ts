/**
 * Manual, read-only M2.0 candidate discovery. Do NOT put this on a daily
 * schedule: review the evidence before any source reaches the live monitor.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { M2_CANDIDATES, probeM2SourceCandidates } from "../lib/m2-source-probe";

async function main(): Promise<void> {
  if (process.argv.includes("--check-runtime")) {
    if (M2_CANDIDATES.length !== 3) throw Error("Unexpected source candidate count");
    process.stdout.write("M2.0 source-probe CLI runtime check passed (offline, no source fetch or files written)\n");
    return;
  }
  if (process.argv.slice(2).length) throw Error("Unknown M2.0 source probe arguments");
  const report = await probeM2SourceCandidates(new Date().toISOString());
  const dir = join(process.cwd(), ".monitor-probe");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "report.json"), JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  const lines = [
    "## SMPT M2.0 official-source discovery (manual, read-only)",
    "",
    "Checked: \`" + report.checkedAt + "\`. **No source activated, no publication baseline recorded.**",
    "",
    "| Official listing candidate | HTTP | HTML health | Article-shaped links |",
    "| --- | ---: | --- | ---: |",
    ...report.results.map((r) => "| \`" + r.candidateId + "\` | " + (r.status ?? "none") +
      " | " + r.health + " | " + r.candidateLinks + " |"),
    "",
    "This is a **listing/link-shape probe only**. Dates, canonical stable identities, coverage pagination, accessibility over 7/14/30 days, publisher edits and content verification remain unproven. The report contains up to eight official-looking URLs per listing for manual inspection.",
    "",
    "Do not add these candidates to the M1 daily monitoring source IDs or create event/candidate records from this report.",
  ];
  writeFileSync(join(dir, "summary.md"), lines.join("\n") + "\n", { mode: 0o600 });
  process.stdout.write(lines.join("\n") + "\n");
}
main().catch((error) => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
