import test from "node:test";
import assert from "node:assert/strict";

import { getFinancialCommitmentById, getProjectById } from "@/lib/data";

const equityId = "fin-ca-cgf-marathon-equity-2026";
const noteId = "fin-ca-cgf-marathon-note-2026";
const projectId = "prj-ca-marathon-copper-palladium";
const closeSource = "src-ca-genm-cgf-equity-close-2026";
const buildSource = "src-ca-genm-marathon-construction-2026";

test("CGF equity closing advances its financial lifecycle without double-counting the original approximate commitment", () => {
  const row = getFinancialCommitmentById(equityId)!;
  assert.equal(row.instrument, "equity");
  assert.equal(row.amount?.value, "90000000");
  assert.equal(row.amount?.currency, "CAD");
  assert.equal(row.amount?.qualifier, "approximately");
  assert.deepEqual(row.financialStatusHistory.map((s) => [s.status, s.date]), [
    ["announced", "2026-09-14"],
    ["disbursed", "2026-09-21"],
  ]);
  assert.ok(row.evidence.some((e) => e.sourceId === closeSource && e.supports.includes("amount")));
});

test("Marathon construction uses separate physical evidence with unknown exact commencement day", () => {
  const row = getFinancialCommitmentById(equityId)!;
  assert.deepEqual(row.implementationStatusHistory.map((s) => [s.status, s.date, s.sourceId]), [
    ["construction", null, buildSource],
  ]);
  const project = getProjectById(projectId)!;
  assert.ok(project.evidence.some((e) => e.sourceId === buildSource && e.supports.includes("stages")));
});

test("the distinct CGF convertible note remains at announced status pending its own closing evidence", () => {
  const row = getFinancialCommitmentById(noteId)!;
  assert.equal(row.amount?.value, "50000000");
  assert.deepEqual(row.financialStatusHistory.map((s) => s.status), ["announced"]);
  assert.ok(!row.evidence.some((e) => e.sourceId === closeSource));
});
