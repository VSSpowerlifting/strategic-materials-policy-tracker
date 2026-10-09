/**
 * Non-publishing F5-1 original-source review readiness.
 * npm run audit:f5-pilots [-- --json]
 */
import packet from "../research/f5/pilot-source-review.json";
import m3Queue from "../research/project-execution/m3-2-source-review-queue.json";
import { getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources } from "../lib/data";
import { site } from "../lib/site";
import { auditF5PilotReadiness } from "./f5-pilot-readiness";
import type { PendingProjectExecutionRow } from "./adjudicate-project-execution";

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--json")) {
  console.error("Usage: npm run audit:f5-pilots [-- --json]");
  process.exitCode = 2;
} else {
  const report = auditF5PilotReadiness(packet as Parameters<typeof auditF5PilotReadiness>[0], {
    projects: getAllProjects(),
    sources: getAllSources(),
    finances: getAllFinancialCommitments(),
    existingM3Queue: m3Queue as PendingProjectExecutionRow[],
    publicMilestoneIds: getAllProjectMilestones().map(x => x.id),
    corpusCutoff: site.lastUpdated,
  });
  if (args[0] === "--json") {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write([
      "F5-1 source-review pilots (not published / not attested)",
      "Pilot source cases: " + report.totals.cases,
      "Existing M3.2 cases (reused, never duplicated): " + report.totals.existingM3,
      "New source-review leads: " + report.totals.newProposals,
      "Unregistered sources requiring separate verification: " + report.totals.missingRegisteredSources,
      "Existing taxonomy blockers: " + report.totals.taxonomyBlocked,
      "Human review required: " + report.totals.humanReviewRequired,
      "Published project-native milestones: " + report.publicMilestoneCount,
      "Curated site cutoff: " + report.corpusCutoff,
      ...report.cases.map(c => c.id + ": " + c.releaseBlockers.join(", ")),
      "Milestone publication: NOT AUTHORIZED",
      "Use --json to inspect exact source references and release blockers.",
    ].join("\n") + "\n");
  }
  if (report.errors.length) {
    console.error(report.errors.join("\n"));
    process.exitCode = 1;
  }
}
