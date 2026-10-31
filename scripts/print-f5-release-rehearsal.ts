/**
 * Offline human-gated F5 release rehearsal. ALWAYS nonpublishing.
 *
 * npm run review:f5-release -- --proposed-cutoff 2026-10-17
 * npm run review:f5-release -- --proposed-cutoff 2026-10-17 --file .project-execution-review/adjudications.json --json
 *
 * No approvals are synthesized. Reads only the genuine existing M3 decision
 * ledger; prints an analysis with no reviewer identities or private notes.
 */
import { readFileSync } from "node:fs";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { isMilestoneIsoDate } from "../lib/project-milestones";
import { site } from "../lib/site";
import { rehearseF5Release } from "./f5-release-rehearsal";

const usage = "Usage: npm run review:f5-release -- --proposed-cutoff YYYY-MM-DD [--file PRIVATE-M3-DECISIONS.json] [--json]";
try {
  const args = process.argv.slice(2);
  let proposedCutoff: string | null = null;
  let file = ".project-execution-review/adjudications.json";
  let fileWasSet = false, json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json" && !json) { json = true; continue; }
    if (args[i] === "--proposed-cutoff" && proposedCutoff === null &&
        args[i+1] && !args[i+1].startsWith("--")) { proposedCutoff = args[++i]; continue; }
    if (args[i] === "--file" && !fileWasSet && args[i+1] &&
        !args[i+1].startsWith("--")) { file = args[++i]; fileWasSet = true; continue; }
    throw new Error(usage);
  }
  if (!isMilestoneIsoDate(proposedCutoff) || proposedCutoff < site.lastUpdated)
    throw new Error(usage + "\nA real proposed date on or after the current corpus revision is required.");

  let decisions: unknown;
  try {
    decisions = JSON.parse(readFileSync(file,"utf8"));
  } catch {
    throw new Error("Cannot read valid local M3 decisions. Start with the gitignored .project-execution-review/adjudications.json " +
      "copied from research/project-execution/m3-2-adjudications.example.json; do not commit private review records.");
  }
  const report = rehearseF5Release(queue, decisions, {
    events: getAllEvents(),
    finances: getAllFinancialCommitments(),
    controls: getAllControlMeasures(),
    projects: getAllProjects(),
    designations: getAllProjectDesignations(),
    milestones: getAllProjectMilestones(),
    sources: getAllSources(),
  }, site.lastUpdated, proposedCutoff);

  if (json) {
    process.stdout.write(JSON.stringify(report,null,2) + "\n");
  } else {
    process.stdout.write([
      "F5 PREPUBLICATION RELEASE REHEARSAL — INTERNAL, OFFLINE, NO PUBLICATION",
      "Current published cutoff: " + report.publishedCorpusCutoff,
      "Proposed future cutoff: " + report.proposedCorpusCutoff,
      "Actual registered milestones: " + report.before.publishedMilestoneIds.length,
      "Hypothetical proposed milestone IDs: " + (report.proposedMilestoneIds.length ? report.proposedMilestoneIds.join(", ") : "(none)"),
      "Structural staging eligible: " + report.stagingAllowed,
      "Before casefile QA candidates: " + report.before.structurallyEligiblePilots.join(", "),
      "After casefile QA candidates: " + report.after.structurallyEligiblePilots.join(", "),
      ...report.gateErrors.map(x => "ERROR: " + x),
      ...report.gateBlockers.map(x => "BLOCKED " + x.id + ": " + x.reason),
      "No evidence authentication, public seed modification, review approval or release authorization occurred.",
    ].join("\n") + "\n");
  }
  if (!report.stagingAllowed) process.exitCode = 1;
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 2;
}
