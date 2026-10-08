/**
 * M1.4 maintainer-local, pull-only synchronization from GitHub Actions.
 * No private editorial decisions or candidate content are uploaded.
 * Never import this module from site code or the GitHub monitoring workflow.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PILOT_SOURCE_IDS } from "../lib/source-monitor";
import {
  importReviewQueue, type PrivateEditorialLedger,
} from "./editorial-ledger";

const REPOSITORY = "VSSpowerlifting/strategic-materials-policy-tracker";
const WORKFLOW = "source-monitor-pilot.yml";
/** #71's first live run with an M1.1 editorial queue; earlier runs had no queue. */
export const FIRST_EDITORIAL_RUN_ID = 37722920588;
const PAGE_SIZE = 100;
const MAX_PAGES = 15;

export type SyncRun = {
  id: number;
  attempt: number;
  status: string;
  conclusion: string | null;
  event: string;
  createdAt: string;
};
export type SyncPlan = {
  pending: SyncRun[];
  alreadyImported: number;
  inFlight: number;
};
export type SyncResult = SyncPlan & {
  completed: number;
  added: number;
  reopened: number;
};

type RecordValue = Record<string, unknown>;
const object = (x: unknown): x is RecordValue => typeof x === "object" && x !== null && !Array.isArray(x);
const integer = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x > 0;
function gh(args: string[]): string {
  try {
    // No shell, no credential printing. Auth is managed exclusively by 'gh'.
    return execFileSync("gh", args, {
      encoding: "utf8", timeout: 60_000, maxBuffer: 12_000_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const e = error as NodeJS.ErrnoException;
    if (e.code === "ENOENT") throw Error("GitHub CLI not installed. Install 'gh' and run 'gh auth login' on this Mac.");
    throw Error("Read-only GitHub CLI request failed; verify 'gh auth status', network access, and repository permissions.");
  }
}

export function parseRunPage(payload: unknown): { runs: SyncRun[]; total: number } {
  if (!object(payload) || !Array.isArray(payload.workflow_runs) ||
      typeof payload.total_count !== "number" || !Number.isSafeInteger(payload.total_count) ||
      payload.total_count < 0) throw Error("GitHub returned a malformed source-monitor run listing");
  const runs: SyncRun[] = [];
  for (const raw of payload.workflow_runs) {
    if (!object(raw) || !integer(raw.id) || !integer(raw.run_attempt) ||
        typeof raw.status !== "string" ||
        !(raw.conclusion === null || typeof raw.conclusion === "string") ||
        typeof raw.created_at !== "string" || Number.isNaN(Date.parse(raw.created_at)) ||
        typeof raw.head_branch !== "string" || typeof raw.event !== "string") {
      throw Error("GitHub returned malformed workflow run metadata");
    }
    if (raw.head_branch !== "main" || !["schedule", "workflow_dispatch"].includes(raw.event)) {
      throw Error("Unexpected non-main or non-monitoring workflow run in sync listing: " + raw.id);
    }
    runs.push({
      id: raw.id, attempt: raw.run_attempt, status: raw.status,
      conclusion: raw.conclusion, event: raw.event, createdAt: raw.created_at,
    });
  }
  return { runs, total: payload.total_count };
}

/**
 * All completed, not-yet-imported monitoring runs at or after M1.1's first
 * queue must be accounted for. Failed runs are blockers, not silently skipped.
 * Run attempts >1 need manual reconciliation because the M1.3 ledger keys
 * imports by run ID, not run ID + attempt.
 */
export function planSyncRuns(runs: readonly SyncRun[], importedIds: ReadonlySet<string>): SyncPlan {
  const ordered = [...runs].filter((run) => run.id >= FIRST_EDITORIAL_RUN_ID)
    .sort((a, b) => a.id - b.id);
  let alreadyImported = 0, inFlight = 0;
  const seen = new Set<number>();
  const pending: SyncRun[] = [];
  for (const run of ordered) {
    if (seen.has(run.id)) throw Error("Duplicate monitor run in GitHub listing: " + run.id);
    seen.add(run.id);
    if (run.attempt !== 1) {
      throw Error("Monitoring run " + run.id + " was rerun (attempt " + run.attempt +
        "); resolve run-versus-attempt identity manually before syncing");
    }
    if (importedIds.has(String(run.id))) { alreadyImported++; continue; }
    if (run.status !== "completed") { inFlight++; continue; }
    if (run.conclusion !== "success") {
      throw Error("Monitoring run " + run.id + " concluded " + run.conclusion +
        "; inspect its health/coverage report manually before syncing subsequent runs");
    }
    pending.push(run);
  }
  return { pending, alreadyImported, inFlight };
}

export function validateSyncArtifact(
  queue: unknown, report: unknown,
): void {
  if (!object(report) || report.mode !== "shadow_review_only" ||
      report.allSourcesHealthy !== true || report.degradedSources !== 0 ||
      typeof report.observedAt !== "string" || !Array.isArray(report.sources) ||
      report.sources.length !== PILOT_SOURCE_IDS.length ||
      report.sources.some((x: unknown) => !object(x) || x.health !== "ok" || x.possibleWindowGap !== false) ||
      PILOT_SOURCE_IDS.some((id) => !report.sources.some((x: unknown) => object(x) && x.sourceId === id)) ||
      !Number.isInteger(report.newPublications) || !Number.isInteger(report.revisions) ||
      !object(queue) || queue.mode !== "shadow_unverified_editorial_queue" ||
      queue.observedAt !== report.observedAt ||
      queue.countNew !== report.newPublications || queue.countRevised !== report.revisions ||
      !Array.isArray(queue.sourcesDegraded) || queue.sourcesDegraded.length !== 0) {
    throw Error("Monitor artifact is unhealthy, has a coverage gap, or queue/report do not reconcile; manual review required");
  }
}

function listRuns(): SyncRun[] {
  const all: SyncRun[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = "branch=main&per_page=" + PAGE_SIZE + "&page=" + page;
    const url = "repos/" + REPOSITORY + "/actions/workflows/" + WORKFLOW + "/runs?" + params;
    const data = parseRunPage(JSON.parse(gh(["api", url]) as string) as unknown);
    all.push(...data.runs);
    if (data.runs.length < PAGE_SIZE || all.length >= data.total) return all;
  }
  throw Error("Monitoring run list exceeded " + MAX_PAGES * PAGE_SIZE + " entries; refuse partial history. Review pagination policy.");
}

function ensureArtifact(run: SyncRun): string {
  const url = "repos/" + REPOSITORY + "/actions/runs/" + run.id + "/artifacts?per_page=100";
  const payload: unknown = JSON.parse(gh(["api", url]));
  const name = "smpt-source-pilot-" + run.id + "-" + run.attempt;
  if (!object(payload) || !Array.isArray(payload.artifacts)) throw Error("Cannot verify run " + run.id + " artifact listing");
  const matching = payload.artifacts.filter((item: unknown) => object(item) && item.name === name && item.expired === false);
  if (matching.length !== 1) {
    throw Error("Monitoring run " + run.id + " has no uniquely available " + name +
      " artifact. It may have expired (30-day retention); do not declare the inbox caught up.");
  }
  return name;
}
function download(run: SyncRun, artifact: string): { queue: unknown; report: unknown; raw: string } {
  const temporary = mkdtempSync(join(tmpdir(), "smpt-editorial-sync-"));
  try {
    gh(["run", "download", String(run.id), "--repo", REPOSITORY, "--name", artifact, "--dir", temporary]);
    const queuePath = join(temporary, "editorial-review-queue.json");
    const reportPath = join(temporary, "report.json");
    if (!existsSync(queuePath) || !existsSync(reportPath)) {
      throw Error("Monitoring run " + run.id + " artifact lacks the required editorial queue or source-health report");
    }
    const raw = readFileSync(queuePath, "utf8");
    return { raw, queue: JSON.parse(raw) as unknown, report: JSON.parse(readFileSync(reportPath, "utf8")) as unknown };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

export function syncEditorialFromGitHub(
  current: PrivateEditorialLedger,
  save: (next: PrivateEditorialLedger) => void,
  dryRun: boolean,
): SyncResult {
  const runs = listRuns();
  const plan = planSyncRuns(runs, new Set(current.imports.map((item) => item.runId)));
  if (dryRun) return { ...plan, completed: 0, added: 0, reopened: 0 };
  let ledger = current, completed = 0, added = 0, reopened = 0;
  for (const run of plan.pending) {
    const artifactName = ensureArtifact(run);
    const evidence = download(run, artifactName);
    validateSyncArtifact(evidence.queue, evidence.report);
    // This is the same hash-checked, fail-closed model as manual M1.3 imports.
    const result = importReviewQueue(ledger, evidence.queue, String(run.id), evidence.raw);
    if (result.duplicateRun) throw Error("Unexpected already-imported run during sync: " + run.id);
    save(result.ledger);
    ledger = result.ledger;
    completed++;
    added += result.imported;
    reopened += result.reopened;
  }
  return { ...plan, completed, added, reopened };
}
