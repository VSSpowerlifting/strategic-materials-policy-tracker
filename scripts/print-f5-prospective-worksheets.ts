/**
 * Generate the EXISTING canonical M3 worksheets against a deliberately
 * proposed later corpus cutoff. The changed cutoff changes the actual M3
 * metadata digest, so old decisions cannot be silently recycled.
 *
 * This is NOT the current corpus date, source authentication or a signature.
 * Prints only; no files, access tokens, network calls or seed writes.
 */
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import { getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources } from "../lib/data";
import { isMilestoneIsoDate } from "../lib/project-milestones";
import { buildM3ReviewerPackets, renderM3ReviewerPacketsMarkdown } from "./project-execution-review-packets";

function parse(args: readonly string[]) {
  let proposedCutoff: string | null = null;
  let id: string | null = null;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json" && !json) { json = true; continue; }
    if (args[i] === "--proposed-cutoff" && !proposedCutoff && args[i+1] &&
        !args[i+1].startsWith("--")) { proposedCutoff = args[++i]; continue; }
    if (args[i] === "--id" && !id && args[i+1] && !args[i+1].startsWith("--")) {
      id = args[++i]; continue;
    }
    throw new Error("Usage: npm run review:f5-prospective-worksheets -- --proposed-cutoff YYYY-MM-DD [--id review-m3-2-...] [--json]");
  }
  if (!isMilestoneIsoDate(proposedCutoff) || proposedCutoff < site.lastUpdated)
    throw new Error("An explicit, real proposed cutoff on or after the PUBLIC corpus date is required");
  return {proposedCutoff, id, json};
}

try {
  const {proposedCutoff, id, json} = parse(process.argv.slice(2));
  const packets = buildM3ReviewerPackets(queue, {
    projects: getAllProjects(),
    sources: getAllSources(),
    commitments: getAllFinancialCommitments(),
    corpusCutoff: proposedCutoff,
    publicMilestoneCount: getAllProjectMilestones().length,
  }, id);
  if (json) {
    process.stdout.write(JSON.stringify({
      schemaVersion: "f5-prospective-review-worksheets-1",
      publishedCorpusCutoff: site.lastUpdated,
      proposedCorpusCutoff: proposedCutoff,
      approvedCutoffChange: false,
      publicReleaseAuthorized: false,
      automaticReviewAuthorized: false,
      packet: packets,
    }, null, 2) + "\n");
  } else {
    process.stdout.write([
      "# F5 prepublication source review — PROPOSED CUTOFF ONLY",
      "Current published corpus revision: " + site.lastUpdated,
      "Hypothetical corpus cutoff for this reviewer worksheet: " + proposedCutoff,
      "**NOT an authorized site.lastUpdated change or approval of source claims.**",
      "All decision digests below are bound to the HYPOTHETICAL cutoff; a real reviewer must inspect the full originals and manually attest.",
      "",
      renderM3ReviewerPacketsMarkdown(packets),
    ].join("\n"));
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 2;
}
