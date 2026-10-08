import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { EXIM_SOURCE_ID } from "@/lib/exim-shadow-monitor";
import { validateAndAdaptEximEditorial } from "@/scripts/exim-editorial-adapter";
import {
  emptyPrivateEditorialLedger, editorialDecision, importReviewQueue, beginCandidate,
} from "@/scripts/editorial-ledger";
import { EXIM_FIRST_BASELINE_RUN_ID } from "@/lib/exim-reliability";
import {
  parseEximSyncPage, planEximSync, type EximSyncRun,
} from "@/scripts/editorial-exim-sync";

const observedAt = "2026-10-09T15:44:00.000Z";
const officialUrl = "https://www.exim.gov/news/exim-source-first-critical-minerals-financing-notice";
const id = createHash("sha256").update(EXIM_SOURCE_ID + "\n" + officialUrl).digest("hex");
const hash = "a".repeat(64);
const title = "EXIM Source-First Critical Minerals Financing Notice";
const listed = (change: "new" | "revised" = "new") => ({
  observationId: id, watchSourceId: EXIM_SOURCE_ID, observedAt, change,
  publicationDate: "2026-10-09", titleAsListed: title, officialUrl,
  keywordHintOnly: true, reviewStatus: "unreviewed",
});
const publisher = (change: "new" | "revised" = "new") => ({
  id, url: officialUrl, title, publicationDate: "2026-10-09",
  fingerprint: hash, keywordHintOnly: true, change,
});
const report = (opts: { change?: "new" | "revised"; baseline?: boolean } = {}) => ({
  version: 1, mode: "shadow_exim_publications_only", sourceId: EXIM_SOURCE_ID,
  observedAt, health: "ok", status: 200, baseline: opts.baseline ?? false,
  observed: 20, pagesRead: 1,
  newCount: opts.baseline || opts.change === "revised" ? 0 : 1,
  revisedCount: opts.baseline ? 0 : opts.change === "revised" ? 1 : 0,
  possibleWindowGap: false, lastSuccessfulAt: observedAt, message: null,
  reviewOnly: opts.baseline ? [] : [publisher(opts.change)],
});
const queue = (opts: { change?: "new" | "revised"; baseline?: boolean } = {}) => ({
  version: 1, mode: "shadow_unverified_exim_editorial_queue",
  observedAt, sourceId: EXIM_SOURCE_ID,
  health: "ok", possibleWindowGap: false,
  items: opts.baseline ? [] : [listed(opts.change)],
});
const receipt = (r: unknown, q: unknown) => JSON.stringify([JSON.stringify(q), JSON.stringify(r)]);
const apiRun = (idValue: number, conclusion: string | null = "success", attempt = 1): EximSyncRun => ({
  id: idValue, status: "completed", conclusion, attempt,
  event: "workflow_dispatch", createdAt: observedAt,
});

test("EXIM source reports convert to unverified private inbox observations, never verified policy claims", () => {
  const r = report(), q = queue();
  const normalized = validateAndAdaptEximEditorial(q, r);
  assert.equal(normalized.mode, "shadow_unverified_editorial_queue");
  assert.equal(normalized.items.length, 1);
  assert.equal(normalized.items[0].watchSourceId, EXIM_SOURCE_ID);
  assert.deepEqual(normalized.items[0].exactCitationSourceIds, []);
  assert.equal(normalized.countMatchingCitations, 0); // Not evaluated.
  assert.equal(normalized.items[0].reviewStatus, "unreviewed");

  // Manual M1 import cannot bypass the independent EXIM report check.
  assert.throws(
    () => importReviewQueue(emptyPrivateEditorialLedger(), normalized, "37802000001", JSON.stringify(q)),
    /Malformed or duplicated observation/,
  );
  const first = importReviewQueue(emptyPrivateEditorialLedger(), normalized, "37802000001",
    receipt(r, q), "exim");
  assert.equal(first.imported, 1);
  assert.equal(first.ledger.items[0].status, "unreviewed");
  assert.equal(first.ledger.items[0].key, EXIM_SOURCE_ID + ":" + id);
  assert.doesNotMatch(JSON.stringify(first.ledger), /bindingCommitment|financingAmount|verifiedPolicyStatus/);
  const repeat = importReviewQueue(first.ledger, normalized, "37802000001",
    receipt(r, q), "exim");
  assert.equal(repeat.duplicateRun, true);
  assert.deepEqual(repeat.ledger, first.ledger);
  assert.throws(() => importReviewQueue(first.ledger, normalized, "37802000001",
    receipt({ ...r, reviewed: true }, q), "exim"), /different contents/);
});

test("baseline and unchanged EXIM replay import only run receipts, never newly found publications", () => {
  const r = report({ baseline: true }), q = queue({ baseline: true });
  const normalized = validateAndAdaptEximEditorial(q, r);
  assert.equal(normalized.items.length, 0);
  const imported = importReviewQueue(emptyPrivateEditorialLedger(), normalized,
    String(EXIM_FIRST_BASELINE_RUN_ID), receipt(r, q), "exim");
  assert.equal(imported.ledger.imports.length, 1);
  assert.equal(imported.ledger.items.length, 0);
  assert.equal(imported.imported, 0);
});

test("separate EXIM source and queue records fail closed on drift, mismatched bodies and unsafe URLs", () => {
  const q = queue(), r = report();
  const rejected: [unknown, unknown][] = [
    [{ ...q, health: "invalid_response" }, r],
    [q, { ...r, health: "blocked" }],
    [q, { ...r, status: 429 }],
    [q, { ...r, possibleWindowGap: true }],
    [{ ...q, observedAt: "2026-10-08T00:00:00Z" }, r],
    [q, { ...r, newCount: 99 }],
    [{ ...q, items: [listed(), listed()] }, { ...r, newCount: 2, reviewOnly: [publisher(), publisher()] }],
    [{ ...q, items: [{ ...listed(), observationId: "b".repeat(64) }] }, r],
    [{ ...q, items: [{ ...listed(), officialUrl: "https://evil.example/news/example" }] }, r],
    [{ ...q, items: [{ ...listed(), officialUrl: officialUrl + "?ref=1" }] }, r],
    [{ ...q, items: [{ ...listed(), publicationDate: "2026-02-30" }] }, r],
    [{ ...q, items: [{ ...listed(), titleAsListed: "A different EXIM headline" }] }, r],
    [{ ...q, items: [{ ...listed(), reviewStatus: "verified" }] }, r],
    [q, { ...r, reviewOnly: [{ ...publisher(), fingerprint: "truncated" }] }],
    [queue(), { ...r, sourceId: "watch-us-federal-register-interior" }],
    [queue({ baseline: true }), { ...r, baseline: true, newCount: 1 }],
  ];
  for (const [candidateQueue, candidateReport] of rejected) {
    assert.throws(
      () => validateAndAdaptEximEditorial(candidateQueue, candidateReport),
      undefined, "EXIM input must fail closed: " + JSON.stringify([candidateQueue, candidateReport]).slice(0, 200));
  }
});

test("revised EXIM publication reopens disposition with private audit; candidate remains human-gated", () => {
  const normalized = validateAndAdaptEximEditorial(queue(), report());
  let l = importReviewQueue(emptyPrivateEditorialLedger(), normalized,
    "37810000001", receipt(report(), queue()), "exim").ledger;
  const key = EXIM_SOURCE_ID + ":" + id;
  l = editorialDecision(l, key, "already_covered", "Editor",
    "Verified the existing policy register already covers the underlying measure", "2026-10-10T00:00:00Z");
  const r2 = { ...report({ change: "revised" }), observedAt: "2026-10-11T14:00:00Z" };
  const q2 = { ...queue({ change: "revised" }), observedAt: r2.observedAt,
    items: [{ ...listed("revised"), observedAt: r2.observedAt }] };
  const next = importReviewQueue(l, validateAndAdaptEximEditorial(q2, r2),
    "37810000002", receipt(r2, q2), "exim");
  assert.equal(next.reopened, 1);
  assert.equal(next.ledger.items.length, 1);
  assert.equal(next.ledger.items[0].status, "unreviewed");
  assert.equal(next.ledger.items[0].audit[0].to, "already_covered");
  assert.equal(next.ledger.items[0].audit[1].by, "system:source-revision");
  assert.throws(
    () => beginCandidate(next.ledger, key, "cand-exim-example", "Editor",
      "2026-10-12T12:00:00Z", true), /needs_verification/);
  const ready = editorialDecision(next.ledger, key, "needs_verification", "Editor",
    "I read the source and need to verify any claimed legal or financial effect", "2026-10-12T12:00:00Z");
  const draft = beginCandidate(ready, key, "cand-exim-example", "Editor",
    "2026-10-12T13:00:00Z", true);
  assert.equal(draft.candidate.proposedEvent.jurisdiction, "us");
  assert.equal(draft.candidate.status, "draft");
  assert.equal(draft.candidate.promotion.promoted, false);
  assert.equal(draft.candidate.verification.verdict, "pending");
});

test("EXIM GitHub sync starts from first verified baseline and never silently skips later failure", () => {
  const first = EXIM_FIRST_BASELINE_RUN_ID, replay = first + 1;
  const source = { total_count: 2, workflow_runs: [
    { id: first, run_attempt: 1, status: "completed", conclusion: "success",
      event: "workflow_dispatch", created_at: observedAt, head_branch: "main",
      path: ".github/workflows/exim-shadow-monitor.yml" },
  ] };
  assert.deepEqual(parseEximSyncPage(source).runs.map((x) => x.id), [first]);
  assert.throws(() => parseEximSyncPage({ ...source, workflow_runs: [{ ...source.workflow_runs[0], head_branch: "feature" }] }),
    /wrong workflow/);
  assert.deepEqual(planEximSync([apiRun(first), apiRun(replay)], new Set()).pending.map(x => x.id),
    [first, replay]);
  assert.equal(planEximSync([apiRun(first), apiRun(replay)], new Set([String(first)]))
    .pending.length, 1);
  assert.throws(() => planEximSync([apiRun(first), apiRun(replay, "failure")], new Set()),
    /ended failure/);
  assert.throws(() => planEximSync([apiRun(first), apiRun(replay, "success", 2)], new Set()),
    /multiple attempts/);
  assert.throws(() => planEximSync([apiRun(first), apiRun(first)], new Set()),
    /Repeated/);
  assert.throws(() => planEximSync([apiRun(replay)], new Set()),
    /Original EXIM persisted baseline/);
});

test("M2.3 local sync is opt-in and cannot run through public Actions or write policy data", () => {
  const m1Workflow = readFileSync(".github/workflows/source-monitor-pilot.yml", "utf8");
  const eximWorkflow = readFileSync(".github/workflows/exim-shadow-monitor.yml", "utf8");
  const sync = readFileSync("scripts/editorial-exim-sync.ts", "utf8");
  assert.doesNotMatch(m1Workflow + eximWorkflow, /sync-exim|editorial-exim-sync/);
  assert.match(sync, /execFileSync\("gh"/);
  assert.doesNotMatch(sync, /git push|data\/seed|contents: write|gh\(\["api", "-X", "POST"/);
  const local = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "editorial:inbox", "--", "sync-exim", "--check-runtime"],
    { encoding: "utf8", timeout: 20_000 });
  assert.match(local, /offline, no GitHub calls or files written/);
});
