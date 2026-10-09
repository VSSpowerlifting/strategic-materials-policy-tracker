import test from "node:test";
import assert from "node:assert/strict";

import { financialAmountOn, totalCommitments } from "@/lib/capital-control";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllJurisdictions, getAllMaterials, getAllOrganizations, getAllProgrammes,
  getAllProjectDesignations, getAllProjects, getAllSources,
  getFinancialCommitmentById,
} from "@/lib/data";
import { validateCapitalControl } from "@/scripts/validate-capital-control";
import type { FinancialCommitment } from "@/lib/types";

const ID = "fin-us-dod-perpetua-stibnite-dpa";
const original = "src-perpetua-sec-dpa-2022";
const definitive = "src-perpetua-sec-dpa-definitization-2023-07-26";
const amendment = "src-perpetua-sec-dpa-amendment-2024-05-02";
const getLoan = () => getFinancialCommitmentById(ID)!;

test("F4-B2: three source-dated versions belong to one and only one Perpetua DPA agreement", () => {
  const c = getLoan();
  assert.ok(c);
  assert.deepEqual(c.financialAmountHistory?.map(x => [x.reason, x.effectiveNotBefore, x.effectiveNoLaterThan, x.sourceId]), [
    ["original", "2022-12-16", "2022-12-16", original],
    ["other", "2023-07-25", "2023-07-25", definitive],
    ["amendment", "2024-05-02", "2024-05-02", amendment],
  ]);
  assert.equal(getAllFinancialCommitments().filter(x => x.id === ID).length, 1);
  assert.deepEqual(c.financialAmountHistory?.at(-1)?.amount, c.amount);
  assert.equal(c.amount?.value, "59200000");
  assert.equal(c.amount?.qualifier, "up_to");
  assert.equal(c.financialAmountHistory?.length, 3);
  assert.deepEqual(c.financialStatusHistory.map(s => [s.status, s.date]), [
    ["contracted", "2022-12-16"],
    ["disbursed", null],
  ]);
});

test("F4-B2: historical ceiling changes only on documented legal operative days", () => {
  const c = getLoan();
  assert.deepEqual(financialAmountOn(c, "2022-12-15"), {kind:"not_yet_evidenced"});
  const intervals = [
    ["2022-12-16", "24800000", original],
    ["2023-07-24", "24800000", original],
    ["2023-07-25", "24812062", definitive],
    ["2024-02-12", "24812062", definitive],
    ["2024-05-01", "24812062", definitive],
    ["2024-05-02", "59200000", amendment],
    ["2026-06-30", "59200000", amendment],
  ] as const;
  for (const [date, amount, sourceId] of intervals) {
    const result = financialAmountOn(c, date);
    assert.equal(result.kind, "quantified", date);
    if (result.kind !== "quantified") continue;
    assert.equal(result.amount.value, amount, date);
    assert.equal(result.amount.currency, "USD");
    assert.equal(result.amount.qualifier, "up_to", date);
    assert.equal(result.sourceId, sourceId);
    assert.equal(result.effectiveNotBefore, result.effectiveNoLaterThan, date);
    assert.equal(result.effectiveNotBeforeEvidence.sourceId, sourceId);
    assert.equal(result.effectiveNoLaterThanEvidence.sourceId, sourceId);
  }
  assert.equal(c.financialAmountHistory![0].note?.includes("$18.6M"), true,
    "2022 reimbursement-availability cap must not replace the original TIA face amount");
  assert.equal(c.financialAmountHistory![2].note?.includes("$59,224,176"), true,
    "precise legal amended ceiling preserved despite canonical rounding");
});

test("F4-B2: the exact 2024 amendment cannot be counted as an additional public commitment", () => {
  const c = getLoan();
  const all = getAllFinancialCommitments();
  const before = totalCommitments([c], all);
  const legacy: FinancialCommitment = { ...c };
  delete legacy.financialAmountHistory;
  const after = totalCommitments([legacy], all);
  assert.deepEqual(before, after,
    "adding amount history must not alter the existing aggregate or create a new grant");
  const usd = before.currencies.find(x => x.currency === "USD");
  assert.ok(usd && usd.status === "summed");
  assert.deepEqual(usd.countedIds, [ID]);
  assert.ok(!c.relationships.some(x => x.relationship === "part_of"),
    "no phantom parent or component financing relationship introduced");
});

const all = getAllFinancialCommitments();
function errors(mutator: (row: FinancialCommitment) => void) {
  const commitments = structuredClone(all);
  const row = commitments.find(c => c.id === ID)!;
  mutator(row);
  const result = validateCapitalControl({
    financialCommitments: commitments,
    controlMeasures: getAllControlMeasures(),
    organizations: getAllOrganizations(),
    projects: getAllProjects(),
    programmes: getAllProgrammes(),
    projectDesignations: getAllProjectDesignations(),
    corpus: {
      events: getAllEvents(), sources: getAllSources(), materials: getAllMaterials(),
      jurisdictions: getAllJurisdictions(),
    },
    today: "2026-10-09",
  });
  return result.errors.filter(x => x.recordId === ID).map(x => x.code + "@" + x.field);
}

test("F4-B2: normal complete history passes existing strict corpus validation", () => {
  assert.deepEqual(errors(() => {}), []);
  for (const sourceId of [original, definitive, amendment]) {
    const source = getAllSources().find(x => x.id === sourceId)!;
    assert.ok(source?.url.startsWith("https://www.sec.gov/Archives/edgar/"));
    assert.ok(getLoan().evidence.some(e => e.sourceId === sourceId && e.supports.includes("amount")));
  }
});

test("F4-B2: reject overlapping dates, detached evidence and canonical-mismatched amount", () => {
  assert.ok(errors(c => { c.financialAmountHistory![1].effectiveNotBefore = "2022-12-16"; })
    .includes("status_chronology@financialAmountHistory[1].effectiveNotBefore"));
  assert.ok(errors(c => { c.financialAmountHistory![2].amount!.value = "59224176"; })
    .includes("incoherent_value@financialAmountHistory"));
  assert.ok(errors(c => { c.financialAmountHistory![2].sourceId = "src-invented-dpa"; })
    .includes("unresolved_reference@financialAmountHistory[2].sourceId"));
  assert.ok(errors(c => { c.financialAmountHistory![0].effectiveNotBeforeEvidence.sourceId = "src-invented-bound"; })
    .includes("unresolved_reference@financialAmountHistory[0].effectiveNotBeforeEvidence.sourceId"));
});

test("F4-B2: non-ISO dates cannot produce a false historic amount", () => {
  for (const bad of ["2024-2-12", "2024-02-30", "2024-05-02T00:00:00Z"]) {
    assert.throws(() => financialAmountOn(getLoan(), bad), RangeError);
  }
});
