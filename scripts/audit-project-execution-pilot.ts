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
  const live=getAllProjectMilestones();
  if(live.length!==2||live[0]?.id!=="mil-au-alcoa-wagerup-groundbreaking-2026-08-24"||
     live[1]?.id!=="mil-ee-neo-narva-commercial-production-reported-2026"||
     live[0]?.kind!=="groundbreaking_reported"){
    r.errors.push("M3.2 audit requires exactly the human-reviewed Wagerup and Narva milestones; do not promote additional queued peers");
  }
  process.stdout.write(formatPilotAudit(r));
  if (r.errors.length > 0) process.exitCode = 1;
}
