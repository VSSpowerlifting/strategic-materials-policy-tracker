/**
 * One-off official DOE CMEI evidence probe.
 * This is NOT a shadow collector and must never write policy/candidate data.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runDoeCmeiPreflight, type DoeForensicReport } from "../lib/doe-cmei-forensics";

const OUT = join(process.cwd(), ".monitor-doe-preflight");

export function summary(r: DoeForensicReport): string {
  return [
    "## SMPT M2.5 — DOE CMEI publisher-shape forensics",
    "",
    "Checked " + r.checkedAt + " (UTC). **" + r.status + "**. Monitoring eligible: **NO**.",
    "",
    "| Official listing page | HTTP | Possible article paths | H1 hint |",
    "| --- | ---: | ---: | --- |",
    ...r.pages.map((p) =>
      "| " + p.requestedUrl + " | " + p.status +
      " | " + p.anchorCandidates.length + " | " +
      (p.headingHint ?? "unavailable").replace(/\|/g, "\\|") + " |"),
    "",
    "Unique paths across two page samples: " + r.listedAcrossPages +
      "; duplicated paths: " + r.overlapBetweenPages + ".",
    "",
    "| Sample purpose | HTTP | H1 hint | Possible date tokens |",
    "| --- | ---: | --- | --- |",
    ...r.articles.map((p) =>
      "| " + p.role + " | " + p.status + " | " +
      (p.headingHint ?? "unavailable").replace(/\|/g, "\\|") +
      " | " + p.unpairedVisibleDateHints.slice(0, 3).join(", ") + " |"),
    "",
    "### Cautions and missing evidence",
    ...r.warnings.map((x) => "- " + x),
    "",
    "- DOE listing article shapes may include sidebar/global anchors, not unique article cards.",
    "- Date-token and H1 evidence must be manually scoped to actual publisher article DOM.",
    "- The mining-project selection announcement is not evidence of executed loans or paid awards.",
    "- No collector activation, stable source ID, identity state, human review decisions, or publication.",
    "",
    "Full bounded diagnostics are attached as report.json.",
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  if (process.argv.slice(2).join(" ") === "--check-runtime") {
    process.stdout.write("DOE CMEI preflight initialized (offline, no network or state writes)\n");
    return;
  }
  if (process.argv.length !== 2) throw Error("Unsupported DOE CMEI preflight arguments");
  const result = await runDoeCmeiPreflight(new Date().toISOString());
  mkdirSync(OUT, { recursive: true, mode: 0o700 });
  writeFileSync(join(OUT, "report.json"), JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
  const text = summary(result);
  writeFileSync(join(OUT, "summary.md"), text, { mode: 0o600 });
  process.stdout.write(text);
  if (result.status !== "observed_forensic_only") process.exitCode = 1;
}
main().catch((e) => {
  process.stderr.write("DOE CMEI preflight could not establish source forensics: " + String(e) + "\n");
  process.exitCode = 1;
});
