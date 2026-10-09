/**
 * Read-only F5 pilot casefile gate. A green structural receipt still requires
 * human source review, browser/a11y QA and maintainer publication signoff.
 *
 * npm run audit:f5-casefiles
 * npm run audit:f5-casefiles -- --json
 * npm run audit:f5-casefiles -- --strict  (nonzero while evidence gated)
 */
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { auditF5CasefileReadiness } from "../lib/f5-casefile-readiness";
import { site } from "../lib/site";

const args = process.argv.slice(2);
if (args.some(arg => !["--json", "--strict"].includes(arg)) ||
    new Set(args).size !== args.length) {
  console.error("Usage: npm run audit:f5-casefiles [-- --json] [--strict]");
  process.exitCode = 2;
} else {
  const report = auditF5CasefileReadiness({
    events: getAllEvents(),
    finances: getAllFinancialCommitments(),
    controls: getAllControlMeasures(),
    projects: getAllProjects(),
    designations: getAllProjectDesignations(),
    milestones: getAllProjectMilestones(),
    sources: getAllSources(),
  }, site.lastUpdated);

  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write([
      "F5 casefile evidence release-readiness audit — internal, read-only",
      "Curated corpus validation cutoff: " + report.validationCorpusCutoff,
      ...report.pilots.flatMap(p => [
        p.projectId + " (" + p.projectName + ")",
        "  Occurred/target registered milestones: " +
          p.registeredOccurredMilestones + " / " + p.registeredPlannedMilestones,
        "  Legacy financier physical observations (NOT reviewed milestones): " +
          p.legacyFinancePhysicalObservations,
        "  Ready for manual QA: " + (p.eligibleForManualQa ? "candidate only" : "NO"),
        ...p.blockers.map(b => "  BLOCKED: " + b),
      ]),
      "All pilots eligible for manual QA: " + report.allPilotsEligibleForManualQa,
      "Public release: NOT AUTHORIZED; human source review and browser QA required",
      "Missing physical evidence is not evidence of project inactivity.",
    ].join("\n") + "\n");
  }

  if (args.includes("--strict") && !report.allPilotsEligibleForManualQa)
    process.exitCode = 1;
}
