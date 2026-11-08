/**
 * Print an M3 source-review worksheet to STDOUT. No files/network/writes.
 *
 * npm run review:m3-packets
 * npm run review:m3-packets -- --id review-m3-2-neo-narva-magnets
 * npm run review:m3-packets -- --json
 * npm run review:m3-packets -- --cohort m3-3
 */
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects,
} from "../lib/data";
import { isReviewCohort, loadCohortInputs } from "./project-execution-cohort-inputs";
import type { ProjectExecutionReviewCohort } from "./review-project-execution-pilot";
import { buildM3ReviewerPackets, renderM3ReviewerPacketsMarkdown } from "./project-execution-review-packets";

const args = process.argv.slice(2);
let json = false;
let id: string | null = null;
let cohort: ProjectExecutionReviewCohort | null = null;
const usage = "Usage: npm run review:m3-packets -- [--cohort m3-2|m3-3] [--json] [--id review-<cohort>-<id>]";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--json" && !json) { json = true; continue; }
  if (arg === "--id" && id === null && args[i + 1] && !args[i + 1].startsWith("--")) {
    id = args[++i]; continue;
  }
  if (arg === "--cohort" && cohort === null && args[i + 1] && isReviewCohort(args[i + 1])) {
    cohort = args[++i] as ProjectExecutionReviewCohort; continue;
  }
  console.error(usage);
  process.exit(2);
}

try {
  const inputs = loadCohortInputs(cohort ?? "m3-2");
  const report = buildM3ReviewerPackets(inputs.queue, {
    projects: getAllProjects(),
    sources: inputs.sources,
    commitments: getAllFinancialCommitments(),
    corpusCutoff: site.lastUpdated,
    publicMilestoneCount: getAllProjectMilestones().length,
    cohort: inputs.cohort,
  }, id);
  process.stdout.write(json ?
    JSON.stringify(report, null, 2) + "\n" :
    renderM3ReviewerPacketsMarkdown(report));
} catch (e) {
  console.error("M3 packet generation refused: " +
    (e instanceof Error ? e.message : String(e)));
  process.exitCode = 1;
}
