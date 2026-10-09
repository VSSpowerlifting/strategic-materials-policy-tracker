import test from "node:test";
import assert from "node:assert/strict";

import { auditF4AmountCoverage } from "@/lib/f4-amount-coverage";
import { financialAmountOn } from "@/lib/capital-control";
import { getAllFinancialCommitments, getAllSources } from "@/lib/data";
import candidates from "@/research/f4/amount-history-review-queue.json";

const corpus = () => structuredClone(getAllFinancialCommitments());
const sources = () => structuredClone(getAllSources());

test("F4-B: all finance rows classified exactly once without implying total eligibility", () => {
  const r = auditF4AmountCoverage(corpus(), sources(), candidates);
  assert.equal(r.schemaVersion, "f4-b1");
  assert.equal(r.historicalTotals, "not_authorized");
  assert.ok(r.totals.records >= 96);
  assert.equal(r.rows.length, r.totals.records);
  assert.equal(new Set(r.rows.map(row => row.recordId)).size, r.rows.length);
  assert.equal(r.totals.versionsRecorded + r.totals.historyUnreviewed, r.totals.records);
  assert.equal(r.totals.withCurrentAmount + r.totals.withoutCurrentAmount, r.totals.records);
  assert.equal(r.byValueRole.reduce((n, row) => n + row.records, 0), r.totals.records);
  assert.equal(r.byValueRole.reduce((n, row) => n + row.versionsRecorded, 0), r.totals.versionsRecorded);
  assert.equal(r.totals.candidateReviews, candidates.length);
  assert.deepEqual(r.rows.map(x => x.recordId), [...r.rows.map(x => x.recordId)].sort());
  assert.ok(r.rows.every(row => !("sum" in row) && !("historicalAmount" in row)));
});

test("F4-B: Thacker Pass is recorded history; others remain explicitly unreviewed", () => {
  const r = auditF4AmountCoverage(corpus(), sources(), candidates);
  const thacker = r.rows.find(row => row.recordId === "fin-us-doe-thacker-pass-atvm-2024");
  assert.equal(thacker?.history, "versions_recorded");
  assert.equal(thacker?.recordedVersions, 2);
  const neo = r.rows.find(row => row.recordId === "fin-eu-jtf-2025-neo-magnet-project");
  assert.equal(neo?.history, "history_unreviewed");
  assert.equal(neo?.recordedVersions, 0);
  const original = getAllFinancialCommitments().find(row => row.id === neo?.recordId)!;
  assert.equal(financialAmountOn(original, "2023-01-01").kind, "history_unreviewed");
  assert.ok(r.reviewCandidates.every(c => r.rows.some(row =>
    row.recordId === c.recordId && row.history === "history_unreviewed")));
});

test("F4-B: output stable across input order, and does not mutate data or queue", () => {
  const rows = corpus(), refs = sources(), queue = structuredClone(candidates);
  const before = JSON.stringify({ rows, refs, queue });
  const first = auditF4AmountCoverage(rows, refs, queue);
  const reversed = auditF4AmountCoverage([...rows].reverse(), [...refs].reverse(), [...queue].reverse());
  assert.deepEqual(first, reversed);
  assert.equal(JSON.stringify({ rows, refs, queue }), before);
  assert.equal(first.reviewCandidates[0].recordId, "fin-us-dod-perpetua-stibnite-dpa");
});

test("F4-B: unknown, duplicated and already-versioned triage identities fail closed", () => {
  const rows = corpus(), refs = sources();
  const unknown = structuredClone(candidates);
  unknown[0].recordId = "fin-invented-row";
  assert.throws(() => auditF4AmountCoverage(rows, refs, unknown), /not in corpus/);
  assert.throws(() => auditF4AmountCoverage(rows, refs, [...candidates, candidates[0]]), /duplicate F4 review/);
  const reviewed = structuredClone(candidates);
  reviewed[0].recordId = "fin-us-doe-thacker-pass-atvm-2024";
  assert.throws(() => auditF4AmountCoverage(rows, refs, reviewed), /already has amount versions/);
  assert.throws(() => auditF4AmountCoverage([...rows, rows[0]], refs, candidates), /duplicate financing record/);
});

test("F4-B: candidate sources must exist and be explicitly linked to each financial row", () => {
  const rows = corpus(), refs = sources();
  const invalid = structuredClone(candidates);
  invalid[0].evidenceSourceIds = ["src-invented"];
  assert.throws(() => auditF4AmountCoverage(rows, refs, invalid), /triage source missing/);
  const unrelated = refs.find(s => !rows.find(row => row.id === candidates[0].recordId)!
    .evidence.some(e => e.sourceId === s.id))!;
  assert.ok(unrelated);
  const missingLink = structuredClone(candidates);
  missingLink[0].evidenceSourceIds = [unrelated.id];
  assert.throws(() => auditF4AmountCoverage(rows, refs, missingLink), /not linked in row evidence/);
  const empty = structuredClone(candidates);
  empty[0].reviewQuestion = "  ";
  assert.throws(() => auditF4AmountCoverage(rows, refs, empty), /invalid F4 triage fields/);
});

test("F4-B: empty amount-history fields are not mistaken for evidence of review", () => {
  const rows = corpus();
  const target = rows.find(row => row.id === candidates[0].recordId)!;
  target.financialAmountHistory = [];
  assert.throws(() => auditF4AmountCoverage(rows, sources(), candidates), /empty historical amount history/);
});
