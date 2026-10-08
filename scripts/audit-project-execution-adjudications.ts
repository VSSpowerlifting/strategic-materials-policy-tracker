/**
 * Read local reviewer decisions without altering public records.
 *
 * npm run audit:project-execution-adjudications
 * npm run audit:project-execution-adjudications -- --file research/project-execution/m3-2-adjudications.example.json
 *
 * The output is a REVIEW PREVIEW, never permission or a command to publish.
 */
import { readFileSync } from "node:fs";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { adjudicateProjectExecutionReview } from "./adjudicate-project-execution";

const args = process.argv.slice(2);
const defaultPath = ".project-execution-review/adjudications.json";
let path = defaultPath;
if (args.length > 0) {
  if (args.length !== 2 || args[0] !== "--file" || !args[1].trim()) {
    console.error("Usage: npm run audit:project-execution-adjudications -- [--file path-to-local-reviews.json]");
    process.exit(2);
  }
  path = args[1];
}
let decisions: unknown;
try {
  decisions = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error("No valid local adjudication decisions at " + path +
    ". Copy research/project-execution/m3-2-adjudications.example.json " +
    "to .project-execution-review/adjudications.json and review the full original sources.");
  process.exit(2);
}
const report = adjudicateProjectExecutionReview(queue, decisions, {
  projects: getAllProjects(),
  sources: getAllSources(),
  commitments: getAllFinancialCommitments(),
  corpusCutoff: site.lastUpdated,
  publicMilestoneIds: getAllProjectMilestones().map((m) => m.id),
});
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
if (report.errors.length > 0 || report.blocked.length > 0)
  process.exitCode = 1;
