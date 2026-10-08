import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllFinancialCommitments,
  getFinancialCommitmentById,
  getOrganizationById,
} from "@/lib/data";
import { organizationRoles } from "@/lib/capital-intelligence";

const rowId = "fin-us-exim-perpetua-stibnite-2026";
const lenderId = "org-us-exim";
const borrowerId = "org-perpetua-resources-idaho";

test("the Perpetua authorized direct-loan provider resolves to EXIM, not an intermediary", () => {
  const row = getFinancialCommitmentById(rowId)!;
  const exim = getOrganizationById(lenderId)!;
  assert.equal(exim.name, "Export-Import Bank of the United States");
  assert.equal(exim.kind, "public_financier");
  assert.equal(exim.countryCode, "US");
  assert.equal(exim.actor, "us");
  assert.equal(row.provider, exim.name);
  assert.deepEqual(row.providerOrgIds, [lenderId]);
  assert.deepEqual(row.recipientOrgIds, [borrowerId]);
  assert.ok(row.evidence.some((e) => e.sourceId === "src-exim-stibnite-board-2026" && e.supports.includes("provider")));
  assert.ok(organizationRoles(lenderId).provided.some((r) => r.id === rowId));
  assert.ok(!organizationRoles(lenderId).received.some((r) => r.id === rowId));
  assert.ok(organizationRoles(borrowerId).received.some((r) => r.id === rowId));
});

test("provider-link integrity preserves EXIM's authorization without inventing signed or disbursed capital", () => {
  const row = getFinancialCommitmentById(rowId)!;
  assert.equal(row.amount?.value, "2906000000");
  assert.equal(row.amount?.currency, "USD");
  assert.equal(row.valueRole, "commitment");
  assert.equal(row.capitalSource, "public");
  assert.equal(row.instrument, "loan");
  assert.equal(row.providerJurisdiction, "us");
  assert.deepEqual(row.financialStatusHistory.map((s) => [s.status, s.date]), [["decided", "2026-05-21"]]);
  assert.equal(getAllFinancialCommitments().filter((r) => r.id === rowId).length, 1);
  assert.ok(!row.financialStatusHistory.some((s) => s.status === "contracted" || s.status === "disbursed"));
});

test("unidentified programme-wide providers remain explicit rather than guessed as agencies", () => {
  for (const id of [
    "fin-eu-jtf-2025-neo-magnet-project",
    "fin-eu-resourceeu-2025-eu-funds",
    "fin-in-ncmm-2025-psu-investment",
  ]) {
    assert.deepEqual(getFinancialCommitmentById(id)!.providerOrgIds, []);
  }
});
