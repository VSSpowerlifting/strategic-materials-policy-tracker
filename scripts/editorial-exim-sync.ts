/**
 * M2.3 EXIM source-only local pull into the existing private M1.3 inbox.
 * No hosted review, API write, candidate approval, or published data changes.
 * Do not run this script inside GitHub Actions or server components.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EXIM_FIRST_BASELINE_RUN_ID } from "../lib/exim-reliability";
import { validateAndAdaptEximEditorial } from "./exim-editorial-adapter";
import { importReviewQueue, type PrivateEditorialLedger } from "./editorial-ledger";

const REPO = "VSSpowerlifting/strategic-materials-policy-tracker";
const WORKFLOW = "exim-shadow-monitor.yml";
const MAX_PAGES = 15;

export type EximSyncRun = {
  id: number; attempt: number; status: string; conclusion: string | null;
  event: string; createdAt: string;
};
export type EximSyncPlan = {
  pending: EximSyncRun[];
  alreadyImported: number;
  inFlight: number;
};
export type EximSyncResult = EximSyncPlan & {
  completed: number; added: number; reopened: number;
};
const object = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const positive = (x: unknown): x is number =>
  typeof x === "number" && Number.isSafeInteger(x) && x > 0;

function gh(args: string[]): string {
  try {
    return execFileSync("gh", args, {
      encoding: "utf8", timeout: 60_000, maxBuffer: 12_000_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT")
      throw Error("GitHub CLI required for EXIM sync. Install gh and run gh auth login.");
    throw Error("Read-only EXIM GitHub CLI request failed; inspect gh auth status, network, and repository permissions.");
  }
}
export function parseEximSyncPage(raw: unknown): { runs: EximSyncRun[]; total: number } {
  if (!object(raw) || !Array.isArray(raw.workflow_runs) ||
      typeof raw.total_count !== "number" || !Number.isSafeInteger(raw.total_count) ||
      raw.total_count < 0)
    throw Error("Malformed EXIM GitHub Actions run list");
  const runs: EximSyncRun[] = [];
  for (const item of raw.workflow_runs) {
    if (!object(item) || !positive(item.id) || !positive(item.run_attempt) ||
        typeof item.status !== "string" ||
        !(item.conclusion === null || typeof item.conclusion === "string") ||
        typeof item.created_at !== "string" ||
        Number.isNaN(Date.parse(item.created_at)) ||
        item.head_branch !== "main" ||
        !["workflow_dispatch", "schedule"].includes(String(item.event)) ||
        (item.path !== undefined && item.path !== ".github/workflows/" + WORKFLOW))
      throw Error("EXIM run metadata has wrong workflow, branch, event or malformed values");
    runs.push({
      id: item.id, attempt: item.run_attempt, status: item.status,
      conclusion: item.conclusion, event: item.event as string,
      createdAt: item.created_at,
    });
  }
  return { runs, total: raw.total_count };
}
export function planEximSync(
  runs: readonly EximSyncRun[], importedRunIds: ReadonlySet<string>,
): EximSyncPlan {
  const seen = new Set<number>(), pending: EximSyncRun[] = [];
  let alreadyImported = 0, inFlight = 0;
  for (const r of [...runs].filter((x) => x.id >= EXIM_FIRST_BASELINE_RUN_ID)
    .sort((a, b) => a.id - b.id)) {
    if (!positive(r.id) || seen.has(r.id)) throw Error("Repeated or invalid EXIM run ID");
    seen.add(r.id);
    if (r.attempt !== 1)
      throw Error("EXIM run " + r.id + " has multiple attempts; reconcile attempt lineage manually");
    if (importedRunIds.has(String(r.id))) { alreadyImported++; continue; }
    if (r.status !== "completed") { inFlight++; continue; }
    if (r.conclusion !== "success")
      throw Error("EXIM run " + r.id + " ended " + r.conclusion +
        "; investigate source health before importing subsequent records");
    pending.push(r);
  }
  if (!seen.has(EXIM_FIRST_BASELINE_RUN_ID) &&
      !importedRunIds.has(String(EXIM_FIRST_BASELINE_RUN_ID))) {
    throw Error("Original EXIM persisted baseline is missing from workflow history; refuse unsupported completeness");
  }
  return { pending, alreadyImported, inFlight };
}
function listRuns(): EximSyncRun[] {
  const rows: EximSyncRun[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const endpoint = "repos/" + REPO + "/actions/workflows/" + WORKFLOW +
      "/runs?branch=main&per_page=100&page=" + page;
    const result = parseEximSyncPage(JSON.parse(gh(["api", endpoint])) as unknown);
    rows.push(...result.runs);
    if (result.runs.length < 100 || rows.length >= result.total) return rows;
  }
  throw Error("EXIM sync history exceeded 1500 runs; refusing a partial import");
}
function artifactFor(run: EximSyncRun): string {
  const api = "repos/" + REPO + "/actions/runs/" + run.id + "/artifacts?per_page=100";
  const data: unknown = JSON.parse(gh(["api", api]));
  if (!object(data) || !Array.isArray(data.artifacts) ||
      typeof data.total_count !== "number" || !Number.isInteger(data.total_count) ||
      data.total_count > 100)
    throw Error("EXIM run artifact list malformed or truncated for " + run.id);
  const names = ["smpt-exim-state-" + run.id + "-" + run.attempt,
    "smpt-exim-report-" + run.id + "-" + run.attempt];
  for (const n of names) {
    const hits = data.artifacts.filter((x: unknown) =>
      object(x) && x.name === n && x.expired === false);
    if (hits.length !== 1)
      throw Error("EXIM run " + run.id + " missing unique unexpired artifact " + n);
  }
  return names[1];
}
function evidenceFor(run: EximSyncRun, artifact: string): {
  queue: unknown; report: unknown; integrityContents: string;
} {
  const temporary = mkdtempSync(join(tmpdir(), "smpt-exim-private-sync-"));
  try {
    gh(["run", "download", String(run.id), "--repo", REPO, "--name", artifact,
      "--dir", temporary]);
    const queueRaw = readFileSync(join(temporary, "editorial-review-queue.json"), "utf8");
    const reportRaw = readFileSync(join(temporary, "report.json"), "utf8");
    if (queueRaw.length > 2_000_000 || reportRaw.length > 2_000_000)
      throw Error("EXIM review artifact size exceeds private-import limit");
    return {
      queue: JSON.parse(queueRaw) as unknown,
      report: JSON.parse(reportRaw) as unknown,
      // Persist receipt of BOTH original evidence bytes, not merely the
      // derived M1.3-shaped queue; any later report/queue tampering is detected.
      integrityContents: JSON.stringify([queueRaw, reportRaw]),
    };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
export function syncEximEditorial(
  current: PrivateEditorialLedger,
  save: (ledger: PrivateEditorialLedger) => void,
  dryRun: boolean,
): EximSyncResult {
  const plan = planEximSync(listRuns(), new Set(current.imports.map((x) => x.runId)));
  if (dryRun) return { ...plan, completed: 0, added: 0, reopened: 0 };
  let existing = current, completed = 0, added = 0, reopened = 0;
  for (const run of plan.pending) {
    const artifact = artifactFor(run);
    const evidence = evidenceFor(run, artifact);
    const normalized = validateAndAdaptEximEditorial(evidence.queue, evidence.report);
    const result = importReviewQueue(existing, normalized, String(run.id),
      evidence.integrityContents, "exim");
    if (result.duplicateRun) throw Error("EXIM sync attempted to reimport an already imported run");
    save(result.ledger);
    existing = result.ledger;
    completed++;
    added += result.imported;
    reopened += result.reopened;
  }
  return { ...plan, completed, added, reopened };
}
