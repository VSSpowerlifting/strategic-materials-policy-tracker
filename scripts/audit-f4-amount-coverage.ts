/**
 * Deterministic source-corpus coverage receipt. Writes stdout only, never seed.
 * npm run audit:f4
 * npm run audit:f4 -- --json
 */
import candidates from "../research/f4/amount-history-review-queue.json";
import { getAllFinancialCommitments, getAllSources } from "../lib/data";
import { auditF4AmountCoverage } from "../lib/f4-amount-coverage";

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--json")) {
  console.error("Usage: npm run audit:f4 [-- --json]");
  process.exitCode = 2;
} else {
  const report = auditF4AmountCoverage(getAllFinancialCommitments(), getAllSources(), candidates);
  if (args[0] === "--json") {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    const t = report.totals;
    process.stdout.write([
      "F4-B historical amount coverage (read-only, current checked-out corpus)",
      "Financial records: " + t.records,
      "Structured amount histories recorded: " + t.versionsRecorded,
      "Historical amount histories unreviewed: " + t.historyUnreviewed,
      "Current amount present / absent: " + t.withCurrentAmount + " / " + t.withoutCurrentAmount,
      "Research candidates (not approved revisions): " + t.candidateReviews,
      ...report.byValueRole.map(g => "  " + g.role + ": " + g.versionsRecorded + "/" + g.records + " versions recorded"),
      "Historical totals: NOT AUTHORIZED",
      "Run with --json for per-record coverage and source-linked triage questions.",
    ].join("\n") + "\n");
  }
}
