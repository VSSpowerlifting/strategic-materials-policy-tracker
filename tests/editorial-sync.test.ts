import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  FIRST_EDITORIAL_RUN_ID, parseRunPage, planSyncRuns, validateSyncArtifact,
  type SyncRun,
} from "@/scripts/editorial-sync";

const run = (id: number, status = "completed", conclusion: string | null = "success", attempt = 1): SyncRun =>
  ({ id, status, conclusion, attempt, event: "workflow_dispatch", createdAt: "2026-10-08T04:00:00Z" });
const githubRun = (id: number) => ({
  id, run_attempt: 1, status: "completed", conclusion: "success", head_branch: "main",
  event: "workflow_dispatch", created_at: "2026-10-08T04:00:00Z",
});
const report = {
  version: 1, mode: "shadow_review_only", observedAt: "2026-10-08T04:00:00Z",
  allSourcesHealthy: true, degradedSources: 0, newPublications: 1, revisions: 0,
  sources: [
    { sourceId: "watch-ca-nrcan-news", health: "ok", possibleWindowGap: false },
    { sourceId: "watch-us-federal-register-interior", health: "ok", possibleWindowGap: false },
  ],
};
const queue = {
  version: 1, mode: "shadow_unverified_editorial_queue", observedAt: report.observedAt,
  countNew: 1, countRevised: 0, sourcesDegraded: [],
};

test("M1.4 parses only structurally valid main-branch monitor run metadata", () => {
  const raw = { total_count: 2, workflow_runs: [githubRun(37722920588), githubRun(37724488721)] };
  const parsed = parseRunPage(raw);
  assert.equal(parsed.total, 2);
  assert.deepEqual(parsed.runs.map((x) => x.id), [37722920588, 37724488721]);
  assert.throws(() => parseRunPage({ total_count: 2, workflow_runs: "no" }), /malformed/);
  assert.throws(() => parseRunPage({ total_count: 1, workflow_runs: [{ ...githubRun(37722920588), id: "string" }] }), /malformed/);
  assert.throws(() => parseRunPage({ total_count: 1, workflow_runs: [{ ...githubRun(37722920588), head_branch: "feature" }] }), /non-main/);
  assert.throws(() => parseRunPage({ total_count: 1, workflow_runs: [{ ...githubRun(37722920588), event: "pull_request" }] }), /non-main/);
});

test("backfill missed completed runs oldest first and never reimport the existing manual baseline", () => {
  const planned = planSyncRuns(
    [run(37724982482), run(37721756213), run(37724488721), run(37722920588)],
    new Set(["37724982482"]),
  );
  assert.deepEqual(planned.pending.map((x) => x.id), [37722920588, 37724488721]);
  assert.equal(planned.alreadyImported, 1);
  assert.equal(planned.inFlight, 0);
  assert.ok(FIRST_EDITORIAL_RUN_ID > 37721756213);
});

test("failed, cancelled or rerun workflows halt automated review backfill, without claiming completeness", () => {
  assert.throws(() => planSyncRuns([run(37724488721, "completed", "failure")], new Set()), /concluded failure/);
  assert.throws(() => planSyncRuns([run(37724488721, "completed", "cancelled")], new Set()), /concluded cancelled/);
  assert.throws(() => planSyncRuns([run(37724488721, "completed", "success", 2)], new Set()), /rerun/);
  assert.throws(() => planSyncRuns([run(37724488721), run(37724488721)], new Set()), /Duplicate/);
  const plan = planSyncRuns([run(37724488721, "in_progress", null), run(37724982482)], new Set());
  assert.equal(plan.inFlight, 1);
  assert.deepEqual(plan.pending.map((x) => x.id), [37724982482]);
});

test("source-monitor artifacts must reconcile and retain healthy coverage on both registered sources", () => {
  assert.doesNotThrow(() => validateSyncArtifact(queue, report));
  assert.throws(() => validateSyncArtifact(queue, { ...report, allSourcesHealthy: false }), /unhealthy/);
  assert.throws(() => validateSyncArtifact(queue, { ...report, sources: [
    report.sources[0], { ...report.sources[1], possibleWindowGap: true },
  ] }), /coverage gap/);
  assert.throws(() => validateSyncArtifact({ ...queue, countNew: 0 }, report), /reconcile/);
  assert.throws(() => validateSyncArtifact(queue, { ...report, observedAt: "2026-10-09T04:00:00Z" }), /reconcile/);
  assert.throws(() => validateSyncArtifact(queue, { ...report, sources: [report.sources[0], report.sources[0]] }), /unhealthy/);
  assert.throws(() => validateSyncArtifact({ ...queue, sourcesDegraded: ["watch-ca-nrcan-news"] }, report), /unhealthy/);
});

test("local sync remains outside monitoring Actions, published site and private candidate deployments", () => {
  const workflow = readFileSync(".github/workflows/source-monitor-pilot.yml", "utf8");
  const ignore = readFileSync(".gitignore", "utf8");
  const cli = readFileSync("scripts/editorial-sync.ts", "utf8");
  assert.doesNotMatch(workflow, /editorial:inbox|editorial-sync/);
  assert.match(ignore, /\.monitor-editorial\//);
  assert.match(cli, /execFileSync\("gh"/);
  assert.doesNotMatch(cli, /data\/seed\/|candidateId|contents: write|gh\(\["api", "-X", "POST"/);
});

test("local sync entry point starts using npm without gh authentication or file changes", () => {
  const out = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "editorial:inbox", "--", "sync", "--check-runtime"],
    { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 });
  assert.match(out, /editorial sync CLI runtime check passed \(offline, no GitHub calls or files written\)/);
});
