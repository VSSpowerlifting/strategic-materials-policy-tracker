import test from "node:test";
import assert from "node:assert/strict";

import reconciliation from "@/research/f4/neo-jtf-amount-reconciliation.json";
import queue from "@/research/f4/amount-history-review-queue.json";
import { financialAmountOn, totalCommitments } from "@/lib/capital-control";
import { auditF4AmountCoverage } from "@/lib/f4-amount-coverage";
import { getAllFinancialCommitments, getAllSources, getFinancialCommitmentById } from "@/lib/data";

const id = "fin-eu-jtf-2025-neo-magnet-project";
const amendment = "src-neo-aif-2025-jtf-nov2024-amendment";
const commission = "src-ec-estonia-neo-narva-jtf-147";
const later = "src-neo-aif-2026";
const eis = "src-eis-npm-narva-jtf-project-grant";

test("F4-B3: Neo history remains blocked while amended values differ", () => {
  const row = getFinancialCommitmentById(id)!;
  assert.ok(row);
  assert.equal(reconciliation.determination, "history_promotion_blocked");
  assert.equal(reconciliation.noPromotion, true);
  assert.equal(reconciliation.historicalTotalsAuthorized, false);
  assert.equal(row.financialAmountHistory, undefined);
  assert.equal(financialAmountOn(row, "2022-11-09").kind, "history_unreviewed");
  assert.equal(financialAmountOn(row, "2024-11-15").kind, "history_unreviewed");
  assert.equal(financialAmountOn(row, "2026-10-09").kind, "history_unreviewed");
  assert.equal(row.amount?.value, "14800000");
  assert.equal(row.amount?.currency, "EUR");
  assert.equal(row.amount?.qualifier, "approximately");
  assert.equal(reconciliation.reconciliation.currentCanonicalValue, row.amount.value);
  assert.equal(reconciliation.reconciliation.outcome, "not_adjudicated");
  assert.equal(reconciliation.reconciliation.discrepancyEUR, "100000");
  assert.deepEqual(row.financialStatusHistory.map(x=>[x.status,x.date]),[
    ["decided", "2022-11-09"],
    ["partially_disbursed", "2025-12-31"],
  ]);
});

test("F4-B3: November 2024 is a bounded reported month, not a made-up operative day", () => {
  const m = reconciliation.amendment;
  assert.equal(m.establishedMonth, "2024-11");
  assert.equal(m.earliestPossibleDate, "2024-11-01");
  assert.equal(m.latestPossibleDate, "2024-11-30");
  assert.equal(m.exactOperativeDayEstablished, false);
  assert.equal(m.supportingSourceId, amendment);
  assert.ok(reconciliation.reconciliation.requiredBeforePromotion.length >= 3);
});

test("F4-B3: five source observations distinguish original, issuer, Commission, official EIS, and latest values", () => {
  const sourceIds = reconciliation.reportedAmounts.map(x=>x.sourceId);
  assert.equal(new Set(sourceIds).size, 5);
  assert.deepEqual(reconciliation.reportedAmounts.map(x=>x.eurValue), [
    "18700000", "14700000", "14700000", "14790898", "14800000",
  ]);
  assert.deepEqual(reconciliation.reportedAmounts.map(x=>x.qualifier), [
    "up_to", "approximately", "approximately", "exact", "approximately",
  ]);
  const registered = new Map(getAllSources().map(x=>[x.id,x]));
  const row = getFinancialCommitmentById(id)!;
  for(const sourceId of sourceIds) {
    assert.ok(registered.has(sourceId), sourceId + " missing from primary-source registry");
    assert.ok(row.evidence.some(ref => ref.sourceId === sourceId),
      sourceId + " must be independently linked to Neo source evidence");
  }
  assert.equal(registered.get(amendment)?.url,
    "https://www.neomaterials.com/wp-content/uploads/2025/03/Neo-AIF-2025-vF.pdf");
  assert.equal(registered.get(amendment)?.datePublished, "2025-03-18");
  assert.equal(registered.get(commission)?.language, "et",
    "keep official Estonian-language evidence identified accurately, not as English");
  assert.equal(registered.get(commission)?.datePublished, null,
    "unknown European Commission web publication date must not be fabricated");
  assert.equal(registered.get(eis)?.language, "et");
  assert.equal(registered.get(eis)?.datePublished, null);
  assert.equal(registered.get(later)?.url,
    "https://www.neomaterials.com/wp-content/uploads/2026/03/NPM-AIF-2026.pdf");
});

test("F4-B3: coverage audit and human triage both keep Neo unresolved", () => {
  const rows = getAllFinancialCommitments(), sources = getAllSources();
  const report = auditF4AmountCoverage(rows, sources, queue);
  assert.equal(report.historicalTotals, "not_authorized");
  assert.equal(report.rows.find(x=>x.recordId===id)?.history, "history_unreviewed");
  const candidate = queue.find(x=>x.recordId===id)!;
  assert.ok(candidate);
  assert.deepEqual(candidate.evidenceSourceIds, reconciliation.reportedAmounts.map(x=>x.sourceId));
  assert.ok(candidate.reviewQuestion.includes("November 2024"));
  assert.ok(candidate.limitation.includes("€14.7M"));
  assert.ok(candidate.limitation.includes("€14.8M"));
  assert.equal(rows.filter(x=>x.id===id).length,1);
});

test("F4-B3: no undocumented cash or additional legal grant is inferred", () => {
  const row = getFinancialCommitmentById(id)!;
  assert.ok(row.evidence.some(e=>e.sourceId===commission && e.supports.includes("amount")));
  assert.ok(!row.evidence.some(e=>e.sourceId===commission && e.supports.includes("status")),
    "EC project narrative cannot source a paid / disbursed status");
  assert.ok(!row.financialAmountHistory);
  assert.ok(reconciliation.reconciliation.requiredBeforePromotion.some(x=>x.includes("reimbursement")));
});

test("F4-B3: provenance enrichment does not alter canonical financial accounting", () => {
  const all = getAllFinancialCommitments();
  const reviewed = getFinancialCommitmentById(id)!;
  const withoutResearch = structuredClone(reviewed);
  withoutResearch.evidence = withoutResearch.evidence.filter(e =>
    e.sourceId !== amendment && e.sourceId !== commission && e.sourceId !== eis);
  const after = totalCommitments([reviewed], all);
  const before = totalCommitments([withoutResearch], all);
  assert.deepEqual(after, before, "adding historical evidence cannot alter present money totals");
  const eur = after.currencies.find(x => x.currency === "EUR");
  assert.ok(eur && eur.status === "summed");
  assert.deepEqual(eur.countedIds, [id]);
});

test("F4-B3: official EIS register is source-backed award amount, NOT amendment timing or cash", () => {
  const row = getFinancialCommitmentById(id)!;
  const verified = reconciliation.reconciliation.officialProjectRegister;
  assert.equal(verified.awardAmountEUR, "14790898");
  assert.equal(verified.beneficiary, "NPM Narva OÜ");
  assert.equal(verified.beneficiaryRegistration, "16493223");
  assert.equal(verified.eligibleProjectCostEUR, "63327184");
  assert.equal(verified.currentAwardSnapshotNotOperativeHistoricalVersion, true);
  assert.equal(verified.legalGranteeIdentityReviewRequired, true);
  assert.equal(verified.distanceFromCanonicalRoundedEUR, "9102");
  assert.equal(verified.distanceFromEarlier147EstimateEUR, "90898");
  assert.equal(row.recipient, "Neo Performance",
    "existing parent recipient must not silently be rewritten without a separate legal-entity review");
  assert.deepEqual(row.recipientOrgIds, ["org-neo-performance"]);
  assert.equal(row.amount?.value, "14800000");
  assert.equal(row.financialAmountHistory, undefined);
  const citation = row.evidence.find(e => e.sourceId === eis)!;
  assert.ok(citation.supports.includes("amount"));
  assert.ok(!citation.supports.includes("recipient"),
    "EIS identifies a legal subsidiary, not the currently stated parent-company recipient");
  assert.ok(!citation.supports.includes("status"),
    "award listing does not certify disbursement");
  assert.ok(citation.locator?.includes("14 790 898"));
});
