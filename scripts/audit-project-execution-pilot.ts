/**
 * Print a deterministic review-queue audit; never writes to public seed.
 * npm run audit:project-execution-pilot
 */
import queueJson from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjects, getAllSources,
  getAllProjectMilestones,
} from "../lib/data";
import {
  auditProjectExecutionPilot, formatPilotAudit,
} from "./review-project-execution-pilot";

const args = process.argv.slice(2);
if (args.length > 0 && !(args.length === 1 && args[0] === "--json")) {
  console.error("Usage: npm run audit:project-execution-pilot [-- --json]");
  process.exitCode = 2;
} else {
  const r = auditProjectExecutionPilot(queueJson, {
    projects: getAllProjects(),
    sources: getAllSources(),
    commitments: getAllFinancialCommitments(),
    corpusCutoff: site.lastUpdated,
  });
  // Fail closed: review queue cannot replace or populate the public milestone seed.
  if (getAllProjectMilestones().length > 0) {
    r.errors.push("public milestone seed is no longer empty: isolate M3.2 audit before publishing");
  }
  process.stdout.write(formatPilotAudit(r));
  if (r.errors.length > 0) process.exitCode = 1;
}
