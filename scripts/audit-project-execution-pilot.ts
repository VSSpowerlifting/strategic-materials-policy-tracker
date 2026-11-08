/**
 * Print a deterministic review-queue audit; never writes to public seed.
 * npm run audit:project-execution-pilot
 * npm run audit:project-execution-pilot -- --cohort m3-3 [--json]
 */
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjects,
  getAllProjectMilestones,
} from "../lib/data";
import { isReviewCohort, loadCohortInputs } from "./project-execution-cohort-inputs";
import {
  auditProjectExecutionPilot, formatPilotAudit, type ProjectExecutionReviewCohort,
} from "./review-project-execution-pilot";
import { PUBLISHED_REVIEWED_MILESTONE_IDS } from "./published-reviewed-milestones";

const args = process.argv.slice(2);
let cohort: ProjectExecutionReviewCohort | null = null;
let bad = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--json") continue; // accepted for compatibility; output is the text audit
  if (args[i] === "--cohort" && cohort === null && args[i + 1] && isReviewCohort(args[i + 1])) {
    cohort = args[++i] as ProjectExecutionReviewCohort; continue;
  }
  bad = true;
}
if (bad) {
  console.error("Usage: npm run audit:project-execution-pilot [-- --cohort m3-2|m3-3] [--json]");
  process.exitCode = 2;
} else {
  const inputs = loadCohortInputs(cohort ?? "m3-2");
  const r = auditProjectExecutionPilot(inputs.queue, {
    projects: getAllProjects(),
    sources: inputs.sources,
    commitments: getAllFinancialCommitments(),
    corpusCutoff: site.lastUpdated,
    cohort: inputs.cohort,
  });
  // Fail closed: review queue cannot replace or populate the public milestone seed.
  // The published seed must equal exactly the human-reviewed baseline: Wagerup
  // and Narva (17 October 2026) plus the six Phase III milestones approved on
  // 8 November 2026 (P3-01 to P3-06). Any other set fails closed.
  const live=getAllProjectMilestones();
  if(JSON.stringify(live.map(m=>m.id))!==JSON.stringify(PUBLISHED_REVIEWED_MILESTONE_IDS)||
     live[0]?.kind!=="groundbreaking_reported"){
    r.errors.push("Pilot audit requires exactly the human-reviewed published milestones (Wagerup, Narva and the six approved Phase III records); do not promote additional queued peers");
  }
  process.stdout.write(formatPilotAudit(r));
  if (r.errors.length > 0) process.exitCode = 1;
}
