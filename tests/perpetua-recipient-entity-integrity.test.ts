import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllFinancialCommitments,
  getFinancialCommitmentById,
  getOrganizationById,
  getAllSources,
} from "@/lib/data";
import { organizationRoles } from "@/lib/capital-intelligence";

const subsidiaryId = "org-perpetua-resources-idaho";
const parentId = "org-perpetua-resources-corp";
const ids = [
  "fin-us-dod-perpetua-stibnite-dpa",
  "fin-us-army-perpetua-antimony-otia",
  "fin-us-exim-perpetua-stibnite-2026",
] as const;

test("three existing Perpetua awards resolve to the named legal recipient, not the parent", () => {
  const child = organizationRoles(subsidiaryId);
  const parent = organizationRoles(parentId);

  for (const id of ids) {
    const commitment = getFinancialCommitmentById(id)!;
    assert.equal(commitment.recipient, "Perpetua Resources Idaho, Inc.");
    assert.deepEqual(commitment.recipientOrgIds, [subsidiaryId]);
    assert.ok(child.received.some((row) => row.id === id));
    assert.ok(!parent.received.some((row) => row.id === id));
  }
});

test("Perpetua borrower and guarantor retain distinct legal and corporate identities", () => {
  const subsidiary = getOrganizationById(subsidiaryId)!;
  const parent = getOrganizationById(parentId)!;
  assert.equal(subsidiary.name, "Perpetua Resources Idaho, Inc.");
  assert.equal(parent.name, "Perpetua Resources Corp.");
  assert.equal(parent.countryCode, "CA");
  assert.equal(subsidiary.countryCode, null);
  assert.ok(subsidiary.parents.some((p) => p.organizationId === parentId && p.relationship === "part_of"));
  assert.ok(getAllSources().some((s) => s.id === "src-sec-perpetua-2025-10k"));
  assert.notEqual(subsidiary.id, parent.id);
});

test("recipient association does not modify existing Perpetua amounts or status ladder", () => {
  const dpa = getFinancialCommitmentById(ids[0])!;
  const otia = getFinancialCommitmentById(ids[1])!;
  const exim = getFinancialCommitmentById(ids[2])!;
  assert.equal(dpa.amount?.value, "59200000");
  assert.equal(otia.amount?.value, "27100000");
  assert.equal(exim.amount?.value, "2906000000");
  assert.equal(dpa.financialStatusHistory.at(-1)?.status, "disbursed");
  assert.equal(otia.financialStatusHistory.at(-1)?.status, "partially_disbursed");
  assert.equal(exim.financialStatusHistory.at(-1)?.status, "decided");
  assert.equal(getAllFinancialCommitments().filter((row) => ids.includes(row.id as typeof ids[number])).length, 3);
  assert.match(exim.notes ?? "", /does not imply execution of a loan or guarantee/);
});
