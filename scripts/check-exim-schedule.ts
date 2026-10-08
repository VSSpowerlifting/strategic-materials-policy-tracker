/**
 * Read-only independent EXIM schedule audit for the M2.4 cron/dispatch.
 * GitHub Actions metadata only, no official site HTTP requests or state writes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EXIM_FIRST_BASELINE_RUN_ID, type EximActionRun } from "../lib/exim-reliability";
import { checkEximSchedule, eximScheduleMarkdown } from "../lib/exim-schedule-watchdog";

const REPO = "VSSpowerlifting/strategic-materials-policy-tracker";
const WORKFLOW = "exim-shadow-monitor.yml";
const OUT = join(process.cwd(), ".monitor-exim-watchdog");
const MAX_PAGES = 10;
type ActionRun = {
  id: number; run_attempt: number; event: string; created_at: string;
  status: string; conclusion: string | null; head_branch: string; path: string;
};
type RunsResponse = { workflow_runs: ActionRun[]; total_count: number };
type ArtifactsResponse = { total_count: number; artifacts: { name: string; expired: boolean }[] };

async function readApi<T>(path: string, token: string): Promise<T> {
  const response = await fetch("https://api.github.com/repos/" + REPO + "/" + path, {
    method: "GET", redirect: "error", signal: AbortSignal.timeout(15_000),
    headers: {
      authorization: "Bearer " + token,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "SMPT-EXIM-independent-schedule-watchdog/1.0",
    },
  });
  if (!response.ok) throw Error("GitHub read-only Actions API failed: HTTP " + response.status);
  const body = await response.text();
  if (body.length > 3_000_000) throw Error("GitHub Actions API exceeds bounded response size");
  return JSON.parse(body) as T;
}
async function getRuns(token: string, checkedAt: string): Promise<EximActionRun[]> {
  const data: ActionRun[] = [];
  let baselineFound = false;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const resp = await readApi<RunsResponse>(
      "actions/workflows/" + WORKFLOW + "/runs?branch=main&per_page=100&page=" + page, token,
    );
    if (!Array.isArray(resp.workflow_runs) ||
        !Number.isSafeInteger(resp.total_count) || resp.total_count < 1 ||
        resp.workflow_runs.length > 100)
      throw Error("EXIM scheduled watchdog malformed Actions run history");
    for (const run of resp.workflow_runs) {
      if (!Number.isSafeInteger(run.id) || run.id < 1 ||
          !Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1 ||
          run.path !== ".github/workflows/" + WORKFLOW ||
          run.head_branch !== "main" ||
          !["schedule", "workflow_dispatch"].includes(run.event) ||
          typeof run.created_at !== "string" ||
          typeof run.status !== "string" ||
          !(run.conclusion === null || typeof run.conclusion === "string"))
        throw Error("EXIM watchdog encountered inconsistent workflow provenance");
      data.push(run);
      if (run.id === EXIM_FIRST_BASELINE_RUN_ID) baselineFound = true;
    }
    if (baselineFound) break;
    if (resp.workflow_runs.length < 100 || page * 100 >= resp.total_count)
      throw Error("EXIM first verified baseline is missing from bounded run history");
  }
  if (!baselineFound) throw Error("EXIM watchdog exceeded 1000 runs without verified baseline");
  const checkedDay = checkedAt.slice(0, 10);
  const output: EximActionRun[] = [];
  for (const run of data) {
    let artifacts: EximActionRun["artifacts"] = [];
    const recentScheduled = run.event === "schedule" &&
      run.created_at.slice(0, 10) >= priorDay(checkedDay, 8);
    if (recentScheduled && run.status === "completed" && run.conclusion === "success") {
      const a = await readApi<ArtifactsResponse>(
        "actions/runs/" + run.id + "/artifacts?per_page=100", token,
      );
      if (!Array.isArray(a.artifacts) || !Number.isSafeInteger(a.total_count) ||
          a.total_count < 0 || a.total_count > 100 || a.artifacts.length !== a.total_count ||
          a.artifacts.some((x) => typeof x.name !== "string" || typeof x.expired !== "boolean"))
        throw Error("EXIM watchdog artifact list missing or truncated for run " + run.id);
      artifacts = a.artifacts.map((x) => ({ name: x.name, expired: x.expired }));
    }
    output.push({
      id: run.id, runAttempt: run.run_attempt,
      event: run.event, createdAt: run.created_at,
      status: run.status, conclusion: run.conclusion,
      artifacts,
    });
  }
  return output;
}
function priorDay(utcDay: string, count: number): string {
  const d = new Date(utcDay + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) throw Error("Invalid current UTC date");
  d.setUTCDate(d.getUTCDate() - count);
  return d.toISOString().slice(0, 10);
}
async function main(): Promise<void> {
  if (process.argv.slice(2).join(" ") === "--check-runtime") {
    if (EXIM_FIRST_BASELINE_RUN_ID !== 37800436243)
      throw Error("EXIM watchdog baseline identity changed");
    process.stdout.write("EXIM independent watchdog startup passed (offline, no API calls or files written)\n");
    return;
  }
  if (process.argv.length !== 2) throw Error("Unexpected watchdog CLI arguments");
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw Error("GITHUB_TOKEN with Actions read permission required");
  const checkedAt = new Date().toISOString();
  const runs = await getRuns(token, checkedAt);
  const result = checkEximSchedule(runs, checkedAt);
  mkdirSync(OUT, { recursive: true, mode: 0o700 });
  writeFileSync(join(OUT, "audit.json"), JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
  const markdown = eximScheduleMarkdown(result);
  writeFileSync(join(OUT, "summary.md"), markdown, { mode: 0o600 });
  process.stdout.write(markdown);
  if (result.needsAttention) process.exitCode = 1;
}
main().catch((e) => {
  process.stderr.write("EXIM independent schedule watchdog failed: " + String(e) + "\n");
  process.exitCode = 1;
});
