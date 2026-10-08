/**
 * M2.2 independent EXIM monitoring-run audit.
 * Only reads public/repository GitHub Actions metadata with actions:read.
 * No state writes, no publication import, and no private editorial records.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  auditEximActions, eximReliabilityMarkdown, EXIM_FIRST_BASELINE_RUN_ID,
  type EximActionRun,
} from "../lib/exim-reliability";

const REPO = "VSSpowerlifting/strategic-materials-policy-tracker";
const WORKFLOW = "exim-shadow-monitor.yml";
const OUT_DIR = join(process.cwd(), ".monitor-exim-reliability");
const LIMIT_PAGES = 10;
type ApiRun = {
  id: number; run_attempt: number; event: string; created_at: string;
  status: string; conclusion: string | null; head_branch: string | null;
  path: string;
};
type ApiArtifacts = {
  total_count: number;
  artifacts: { name: string; expired: boolean }[];
};
type ApiRuns = { workflow_runs: ApiRun[] };

async function githubGet<T>(path: string, token: string): Promise<T> {
  const url = "https://api.github.com/repos/" + REPO + "/" + path;
  const signal = AbortSignal.timeout(15_000);
  const response = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal,
    headers: {
      authorization: "Bearer " + token,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "SMPT-EXIM-read-only-reliability-audit/1.0",
    },
  });
  if (!response.ok) throw Error("GitHub Actions metadata request failed HTTP " + response.status);
  const content = await response.text();
  if (content.length > 3_000_000) throw Error("GitHub Actions response exceeded audit bound");
  return JSON.parse(content) as T;
}

async function collectEvidence(token: string): Promise<EximActionRun[]> {
  const runs: ApiRun[] = [];
  let anchorSeen = false;
  for (let page = 1; page <= LIMIT_PAGES; page++) {
    const response = await githubGet<ApiRuns>(
      "actions/workflows/" + WORKFLOW + "/runs?branch=main&per_page=100&page=" + page,
      token,
    );
    if (!Array.isArray(response.workflow_runs))
      throw Error("EXIM Actions listing absent; refusing partial reliability history");
    for (const run of response.workflow_runs) {
      if (run.path !== ".github/workflows/" + WORKFLOW || run.head_branch !== "main")
        throw Error("EXIM Actions listing contains unexpected workflow or branch");
      runs.push(run);
      if (run.id === EXIM_FIRST_BASELINE_RUN_ID) anchorSeen = true;
    }
    if (anchorSeen) break;
    if (response.workflow_runs.length < 100)
      throw Error("Verified EXIM first baseline missing from workflow history");
  }
  if (!anchorSeen) throw Error("EXIM audit exceeded bounded history search before baseline");
  const result: EximActionRun[] = [];
  for (const run of runs) {
    let artifacts: EximActionRun["artifacts"] = [];
    // Check the current and all successful runs for EXACT state/report pair.
    // A failed workflow cannot be accepted as a healthy scheduled observation.
    if (run.status === "completed" && run.conclusion === "success") {
      const info = await githubGet<ApiArtifacts>(
        "actions/runs/" + run.id + "/artifacts?per_page=100", token,
      );
      if (!Array.isArray(info.artifacts) || !Number.isSafeInteger(info.total_count) ||
          info.total_count > 100)
        throw Error("EXIM artifact list missing or truncated for run " + run.id);
      artifacts = info.artifacts.map((a) => ({
        name: a.name, expired: a.expired,
      }));
    }
    result.push({
      id: run.id, runAttempt: run.run_attempt, event: run.event,
      createdAt: run.created_at, status: run.status, conclusion: run.conclusion,
      artifacts,
    });
  }
  return result;
}
async function main(): Promise<void> {
  if (process.argv.slice(2).join(" ") === "--check-runtime") {
    if (EXIM_FIRST_BASELINE_RUN_ID !== 37800436243)
      throw Error("Unexpected verified EXIM baseline identity");
    process.stdout.write("EXIM M2.2 audit runtime verified; no API reads or writes\n");
    return;
  }
  if (process.argv.length !== 2) throw Error("Unsupported M2.2 audit argument");
  const token = process.env.GITHUB_TOKEN;
  const triggerRaw = process.env.SMPT_EXIM_AUDIT_TRIGGER_RUN_ID ?? "";
  if (!token || !/^[1-9]\d*$/.test(triggerRaw) ||
      !Number.isSafeInteger(Number(triggerRaw)))
    throw Error("EXIM audit requires Actions read token and a valid triggering run ID");
  const runs = await collectEvidence(token);
  const audit = auditEximActions(runs, new Date().toISOString(), Number(triggerRaw));
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "audit.json"), JSON.stringify(audit, null, 2) + "\n", { mode: 0o600 });
  const summary = eximReliabilityMarkdown(audit);
  writeFileSync(join(OUT_DIR, "summary.md"), summary, { mode: 0o600 });
  process.stdout.write(summary);
  if (audit.needsAttention) process.exitCode = 1;
}
main().catch((error) => {
  process.stderr.write("EXIM independent reliability audit failed: " + String(error) + "\n");
  process.exitCode = 1;
});
