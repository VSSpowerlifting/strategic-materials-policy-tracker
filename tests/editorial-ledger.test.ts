import test from "node:test";
import assert from "node:assert/strict";
import {
  beginCandidate, editorialDecision, emptyPrivateEditorialLedger,
  importReviewQueue, parsePrivateEditorialLedger,
} from "@/scripts/editorial-ledger";
import type { EditorialReviewQueue, EditorialQueueItem } from "@/lib/monitor-editorial-queue";

const id = "a".repeat(64), another = "b".repeat(64);
const sourceId = "watch-ca-nrcan-news";
const key = sourceId + ":" + id;
const run1 = "2026-10-08T12:00:00.000Z";
const run2 = "2026-10-09T12:00:00.000Z";
const observation = (observedAt: string, change: "new" | "revised" = "new", title = "Rare earth materials notice"): EditorialQueueItem => ({
  observationId: id, watchSourceId: sourceId, observedAt, change,
  publicationDate: "2026-10-08", titleAsListed: title,
  officialUrl: "https://www.canada.ca/en/natural-resources-canada/news/notice.html",
  keywordHintOnly: true, exactCitationSourceIds: ["src-existing-1"], reviewStatus: "unreviewed",
});
const queue = (observedAt: string, rows: EditorialQueueItem[]): EditorialReviewQueue => ({
  version: 1, mode: "shadow_unverified_editorial_queue", observedAt, sourcesDegraded: [],
  items: rows, countNew: rows.filter((x) => x.change === "new").length,
  countRevised: rows.filter((x) => x.change === "revised").length, countMatchingCitations: rows.length,
});
function imported() {
  const q = queue(run1, [observation(run1)]);
  return importReviewQueue(emptyPrivateEditorialLedger(), q, "37725000001", JSON.stringify(q)).ledger;
}

test("an official publication becomes one persistent unreviewed entry, with stable source identity", () => {
  const l = imported();
  assert.equal(l.items.length, 1);
  assert.equal(l.items[0].key, key);
  assert.equal(l.items[0].status, "unreviewed");
  assert.equal(l.items[0].firstObservedAt, run1);
  assert.deepEqual(l.items[0].audit, []);
  assert.equal(l.imports.length, 1);
  assert.doesNotMatch(JSON.stringify(l), /proposedEvent|verification.*verified|policyStatus|financialCommitment/);
});

test("the same GitHub artifact is idempotent and tampering an imported run ID fails closed", () => {
  const original = imported(), q = queue(run1, [observation(run1)]);
  const repeat = importReviewQueue(original, q, "37725000001", JSON.stringify(q));
  assert.equal(repeat.duplicateRun, true);
  assert.deepEqual(repeat.ledger, original);
  assert.throws(() => importReviewQueue(original, q, "37725000001", JSON.stringify(q) + " "),
    /different contents/);
});

test("manual disposition requires a named reviewer and substantive reason", () => {
  const base = imported();
  assert.throws(() => editorialDecision(base, key, "investigating", "", "Read original text", run2), /requires reviewer/);
  assert.throws(() => editorialDecision(base, key, "investigating", "Editor", "short", run2), /requires reviewer/);
  assert.throws(() => editorialDecision(base, key, "candidate_started", "Editor", "Initiate immediately", run2), /requires explicit/);
  assert.throws(() => editorialDecision(base, "watch-ca-nrcan-news:" + another,
    "investigating", "Editor", "Read original text", run2), /Unknown observation/);
  const next = editorialDecision(base, key, "investigating", "Editor A", "Read and compare the full primary document", run2);
  assert.equal(base.items[0].status, "unreviewed");
  assert.equal(next.items[0].status, "investigating");
  assert.deepEqual(next.items[0].audit.map((x) => [x.by, x.from, x.to]),
    [["Editor A", "unreviewed", "investigating"]]);
});

test("newly revised listing reopens a prior decision with audit retained, without duplicate records", () => {
  const reviewed = editorialDecision(imported(), key, "already_covered",
    "Editor B", "This document appears already coded; check on future revisions", run2);
  const later = "2026-10-10T12:00:00.000Z";
  const nextQueue = queue(later, [observation(later, "revised", "Rare earth materials notice (amended)")]);
  const import2 = importReviewQueue(reviewed, nextQueue, "37725000002", JSON.stringify(nextQueue));
  assert.equal(import2.imported, 0);
  assert.equal(import2.reopened, 1);
  assert.equal(import2.alreadyKnown, 1);
  assert.equal(import2.ledger.items.length, 1);
  const entry = import2.ledger.items[0];
  assert.equal(entry.status, "unreviewed");
  assert.equal(entry.titleAsListed, "Rare earth materials notice (amended)");
  assert.equal(entry.changes.length, 2);
  assert.equal(entry.audit.length, 2);
  assert.equal(entry.audit[0].to, "already_covered");
  assert.equal(entry.audit[1].by, "system:source-revision");
});

test("importing older artifacts out of order never rewinds later observation or review notes", () => {
  const newest = "2026-10-11T12:00:00.000Z";
  const ahead = queue(newest, [observation(newest, "revised", "Latest update")]);
  const ledger = importReviewQueue(imported(), ahead, "37725000005", JSON.stringify(ahead)).ledger;
  const older = queue(run2, [observation(run2, "revised", "Stale revised title")]);
  const result = importReviewQueue(ledger, older, "37725000003", JSON.stringify(older));
  assert.equal(result.skippedOld, 1);
  assert.equal(result.ledger.items[0].titleAsListed, "Latest update");
  assert.equal(result.ledger.items[0].lastObservedAt, newest);
});

test("candidate handoff is explicit, private, draft-only, with no asserted policy effect", () => {
  const base = imported();
  assert.throws(() => beginCandidate(base, key, "cand-rareearths-2026", "Editor", run2, true),
    /needs_verification/);
  const ready = editorialDecision(base, key, "needs_verification", "Editor",
    "I reviewed the source listing and will verify the underlying document", run2);
  assert.throws(() => beginCandidate(ready, key, "cand-rareearths-2026", "Editor", run2, false),
    /full original official source was opened/);
  const { ledger, candidate } = beginCandidate(ready, key, "cand-rareearths-2026",
    "Editor", run2, true);
  assert.equal(ready.items[0].status, "needs_verification");
  assert.equal(ledger.items[0].status, "candidate_started");
  assert.equal(ledger.items[0].candidateId, "cand-rareearths-2026");
  assert.equal(candidate.status, "draft");
  assert.equal(candidate.verification.verdict, "pending");
  assert.equal(candidate.classification.confidence, "low");
  assert.equal(candidate.promotion.promoted, false);
  assert.equal(candidate.proposedEvent.jurisdiction, "canada");
  assert.equal(candidate.proposedEvent.intakeMode, "monitored");
  assert.equal(candidate.proposedEvent.date, undefined);
  assert.equal(candidate.proposedEvent.policyStatus, undefined);
  assert.equal(candidate.proposedSources, undefined);
  assert.match(candidate.reviewerNotes ?? "", /UNVERIFIED/);
  assert.throws(() => beginCandidate(ledger, key, "cand-another-2026", "Editor", run2, true),
    /needs_verification/);
});

test("reject duplicate, corrupt or wrong-mode imports and tampering with ledger", () => {
  const q = queue(run1, [observation(run1)]);
  assert.throws(() => importReviewQueue(emptyPrivateEditorialLedger(), { ...q, mode: "public_policy" },
    "37725000004", JSON.stringify(q)), /Not a valid/);
  assert.throws(() => importReviewQueue(emptyPrivateEditorialLedger(),
    { ...q, items: [observation(run1), observation(run1)], countNew: 2 },
    "37725000004", JSON.stringify(q)), /Malformed or duplicated/);
  assert.throws(() => importReviewQueue(emptyPrivateEditorialLedger(),
    queue(run1, [{ ...observation(run1), officialUrl: "http://example.com/doc" }]),
    "37725000004", JSON.stringify(q)), /Malformed or duplicated/);
  assert.throws(() => parsePrivateEditorialLedger({ ...imported(), version: 0 }), /corrupt/);
  const l = imported();
  l.items[0].status = "candidate_started";
  assert.throws(() => parsePrivateEditorialLedger(l), /Invalid private ledger/);
});
