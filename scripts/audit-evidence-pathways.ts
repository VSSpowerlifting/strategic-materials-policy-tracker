/**
 * F5-0: deterministic, read-only evidence-pathway coverage audit.
 * npm run audit:pathways
 * npm run audit:pathways -- --json
 * The JSON output is a structural review artifact, not a public claim export.
 */
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { auditEvidencePathways } from "../lib/evidence-pathway-contract";

const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => arg !== "--json")) {
  console.error("Usage: npm run audit:pathways [-- --json]");
  process.exitCode = 2;
} else {
  const report = auditEvidencePathways({
    events: getAllEvents(),
    finances: getAllFinancialCommitments(),
    controls: getAllControlMeasures(),
    projects: getAllProjects(),
    designations: getAllProjectDesignations(),
    milestones: getAllProjectMilestones(),
    sources: getAllSources(),
  });
  if (args[0] === "--json") {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write([
      "F5-0 Structural evidence pathways — read-only",
      "Policy events: " + report.totals.events,
      "Finance rows: " + report.totals.finances,
      "Control clauses: " + report.totals.controls,
      "Registered projects: " + report.totals.projects,
      "Project designations: " + report.totals.designations,
      "Reviewed native milestones: " + report.totals.nativeMilestones,
      "Projects without reviewed native milestones: " + report.totals.projectsWithoutNativeMilestones,
      "Legacy physical observations requiring scope/source review: " + report.totals.legacyObservationsNeedingReview,
      "Typed structural edges: " + report.totals.edges,
      ...report.edgeCounts.map(c => "  " + c.kind + ": " + c.count),
      "Causal claims: NOT AUTHORIZED",
      "Historical financial sums: NOT AUTHORIZED",
      "Unknown physical evidence does not mean inactive industrial activity.",
      "Use --json for sorted source-provenance and project coverage diagnostics.",
    ].join("\n") + "\n");
  }
}
