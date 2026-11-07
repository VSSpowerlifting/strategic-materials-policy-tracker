import test from "node:test";
import assert from "node:assert/strict";
import { getFinancialCommitmentById, getEventById } from "../lib/data";
import { currentFinancialStatus, publicCommitmentRows } from "../lib/capital-control";

const get = (suffix: string) => getFinancialCommitmentById(`fin-us-dod-mp-2025-${suffix}`)!;

test("MP financing takeout preserves the expired commitment and separates corporate private capital", () => {
  const bank = get("bank-financing");
  const equity = get("public-equity");
  const revolver = get("corporate-revolver");
  assert.equal(currentFinancialStatus(bank), "lapsed");
  assert.equal(currentFinancialStatus(equity), "disbursed");
  assert.equal(equity.amount?.value, "724200000", "reported net proceeds, not gross offering value");
  assert.equal(currentFinancialStatus(revolver), "contracted", "capacity does not establish a draw");
  assert.equal(revolver.amount?.value, "275000000");
  for (const row of [equity, revolver]) {
    assert.equal(row.valueRole, "private_financing");
    assert.equal(row.projectId, null, "corporate financing has no full 10X allocation");
    assert.equal(row.associatedProjectIds?.length ?? 0, 0);
    assert.equal(row.relationships.length, 0, "replacement is not a part_of or drawn_from relationship");
  }
  assert.deepEqual(publicCommitmentRows([bank, equity, revolver]), []);
});

test("PPA reported cash supports payment status without inventing a total or payment date", () => {
  const ppa = get("price-floor");
  assert.equal(ppa.amount, null, "open-ended agreement is not valued from a receipt");
  assert.equal(currentFinancialStatus(ppa), "partially_disbursed");
  assert.equal(ppa.financialStatusHistory.at(-1)?.date, null);
  assert.equal(ppa.financialStatusHistory.at(-1)?.sourceId, "src-mp-10q-2026-q3");
  assert.ok(ppa.notes?.includes("$110.9 million"));
  assert.ok(ppa.notes?.includes("$8.109 million"));
  assert.equal(get("magnet-offtake").amount, null);
  assert.equal(currentFinancialStatus(get("magnet-offtake")), "contracted");
});

test("TSIF manufacturing support excludes corporate-operations money and noncash recognition as a draw", () => {
  const grant = getFinancialCommitmentById("fin-us-texas-mp-2026-tsif")!;
  assert.equal(grant.amount?.value, "53457500", "exact Texas announcement, not aggregate incentives");
  assert.equal(grant.projectId, "prj-us-mp-10x-facility");
  assert.equal(grant.instrument, "grant");
  assert.equal(currentFinancialStatus(grant), "contracted");
  assert.equal(grant.financialStatusHistory.at(-1)?.date, null, "May agreement has no verified day");
  assert.deepEqual(grant.materialIds, ["ndfeb-magnets"]);
  assert.equal(getEventById(grant.eventId)?.lifecycle.publishedAt, null);
  assert.ok(grant.notes?.includes("noncash"));
  assert.ok(grant.notes?.includes("TEF corporate-operations grant is excluded"));
  assert.deepEqual(publicCommitmentRows([get("public-equity"), get("corporate-revolver"), grant]).map(r => r.id), [grant.id]);
});
