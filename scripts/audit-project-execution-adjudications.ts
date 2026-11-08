/**
 * Read local reviewer decisions without altering public records.
 *
 * npm run audit:project-execution-adjudications
 * npm run audit:project-execution-adjudications -- --file research/project-execution/m3-2-adjudications.example.json
 * npm run audit:project-execution-adjudications -- --cohort m3-3 [--file path]
 *
 * The output is a REVIEW PREVIEW, never permission or a command to publish.
 */
import { readFileSync } from "node:fs";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects,
} from "../lib/data";
import { isReviewCohort, loadCohortInputs } from "./project-execution-cohort-inputs";
import type { ProjectExecutionReviewCohort } from "./review-project-execution-pilot";
import { adjudicateProjectExecutionReview } from "./adjudicate-project-execution";

const args = process.argv.slice(2);
const usage = "Usage: npm run audit:project-execution-adjudications -- [--cohort m3-2|m3-3] [--file path-to-local-reviews.json]";
let cohort: ProjectExecutionReviewCohort | null = null;
let fileArg: string | null = null;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const next = args[i + 1];
  if (arg === "--cohort" && cohort === null && next && isReviewCohort(next)) {
    cohort = next; i++; continue;
  }
  if (arg === "--file" && fileArg === null && next && next.trim() && !next.startsWith("--")) {
    fileArg = next; i++; continue;
  }
  console.error(usage);
  process.exit(2);
}
const inputs = loadCohortInputs(cohort ?? "m3-2");
const path = fileArg ?? inputs.defaultAdjudicationPath;
let decisions: unknown;
try {
  decisions = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error("No valid local adjudication decisions at " + path +
    ". Copy " + inputs.exampleAdjudicationPath + " to " +
    inputs.defaultAdjudicationPath + " and review the full original sources.");
  process.exit(2);
}
const report = adjudicateProjectExecutionReview(inputs.queue, decisions, {
  projects: getAllProjects(),
  sources: inputs.sources,
  commitments: getAllFinancialCommitments(),
  corpusCutoff: site.lastUpdated,
  publicMilestoneIds: getAllProjectMilestones().map((m) => m.id),
  cohort: inputs.cohort,
});
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
if (report.errors.length > 0 || report.blocked.length > 0)
  process.exitCode = 1;
