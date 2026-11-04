import test from "node:test";
import assert from "node:assert/strict";
import { getAllFinancialCommitments } from "../lib/data";
import { isBackingRow, layerOf, layers } from "../lib/capital-intelligence";
import { publicCommitmentRows } from "../lib/capital-control";
import { explainFinancialRecord } from "../lib/financial-reading";
import type { FinancialCommitment } from "../lib/types";

const makeSelection = (): FinancialCommitment => {
  const original = getAllFinancialCommitments().find(c => c.instrument === "grant" && c.amount !== null);
  assert.ok(original, "A source-backed grant fixture must exist in the corpus");
  return {
    ...structuredClone(original),
    id: "fin-test-selected-applicant",
    valueRole: "selection_proposal",
    financialStatusHistory: [
      { status: "selected_for_negotiations", date: "2026-08-20", sourceId: original.financialStatusHistory[0].sourceId },
    ],
    relationships: [],
  };
};

test("selection-stage funding is a visible but strictly non-summed and non-backing layer", () => {
  const s = makeSelection();
  assert.equal(layerOf(s), "selection_proposal");
  assert.equal(isBackingRow(s), false);
  assert.equal(publicCommitmentRows([s]).length, 0);
  const result = layers([s], [s]);
  assert.equal(result.length, 1);
  assert.equal(result[0].key, "selection_proposal");
  assert.equal(result[0].totals, null, "no numerical public capital total");
});

test("reader copy identifies negotiation and excludes the amount from committed financing", () => {
  const s = makeSelection();
  const reading = explainFinancialRecord(s);
  assert.match(reading.role.label, /Selected for negotiations/);
  assert.match(reading.status.label, /Selected for negotiations/);
  assert.match(reading.payment, /No signed funding agreement/);
  assert.match(reading.boundary, /excluded from committed-capital totals/);
});
