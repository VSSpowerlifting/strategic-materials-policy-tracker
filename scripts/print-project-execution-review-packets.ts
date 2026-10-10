/**
 * Print an M3 source-review worksheet to STDOUT. No files/network/writes.
 *
 * npm run review:m3-packets
 * npm run review:m3-packets -- --id review-m3-2-neo-narva-magnets
 * npm run review:m3-packets -- --json
 */
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { buildM3ReviewerPackets, renderM3ReviewerPacketsMarkdown } from "./project-execution-review-packets";

const args = process.argv.slice(2);
let json = false;
let id: string | null = null;
const usage = "Usage: npm run review:m3-packets -- [--json] [--id review-m3-2-<id>]";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--json" && !json) { json = true; continue; }
  if (arg === "--id" && id === null && args[i + 1] && !args[i + 1].startsWith("--")) {
    id = args[++i]; continue;
  }
  console.error(usage);
  process.exit(2);
}

try {
  const report = buildM3ReviewerPackets(queue, {
    projects: getAllProjects(),
    sources: getAllSources(),
    commitments: getAllFinancialCommitments(),
    corpusCutoff: site.lastUpdated,
    publicMilestoneCount: getAllProjectMilestones().length,
  }, id);
  process.stdout.write(json ?
    JSON.stringify(report, null, 2) + "\n" :
    renderM3ReviewerPacketsMarkdown(report));
} catch (e) {
  console.error("M3 packet generation refused: " +
    (e instanceof Error ? e.message : String(e)));
  process.exitCode = 1;
}
