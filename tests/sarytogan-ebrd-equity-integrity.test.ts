import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllFinancialCommitments,
  getAllSources,
  getFinancialCommitmentById,
} from "@/lib/data";
import { organizationRoles, projectStack } from "@/lib/capital-intelligence";

const initialId = "fin-ebrd-2025-sarytogan-equity";
const followonId = "fin-ebrd-2026-sarytogan-topup-equity";
const recipientId = "org-sarytogan";
const projectId = "prj-kz-sarytogan";

test("EBRD Sarytogan original funding is the completed A$5M placement, not a new €3.6M line", () => {
  const row = getFinancialCommitmentById(initialId)!;
  assert.equal(row.recipient, "Sarytogan Graphite Limited");
  assert.deepEqual(row.recipientOrgIds, [recipientId]);
  assert.equal(row.amount?.value, "5000000");
  assert.equal(row.amount?.currency, "AUD");
  assert.equal(row.instrument, "equity");
  assert.deepEqual(row.financialStatusHistory.map((s) => [s.status, s.date]), [
    ["contracted", null],
    ["disbursed", "2025-02-10"],
  ]);
  assert.ok(row.evidence.some((e) => e.sourceId === "src-ebrd-sarytogan-equity-2024" && e.supports.includes("amount")));
  assert.ok(!row.evidence.some((e) => e.sourceId === "src-ec-resourceeu-com-945" && e.supports.includes("amount")));
});

test("the EBRD top-up is a separate completed share placement with precise AUD amount", () => {
  const row = getFinancialCommitmentById(followonId)!;
  assert.equal(row.recipient, "Sarytogan Graphite Limited");
  assert.deepEqual(row.recipientOrgIds, [recipientId]);
  assert.equal(row.amount?.value, "1396581.12");
  assert.equal(row.amount?.currency, "AUD");
  assert.equal(row.amount?.qualifier, "exact");
  assert.equal(row.projectId, projectId);
  assert.equal(row.instrument, "equity");
  assert.equal(row.valueRole, "commitment");
  assert.equal(row.capitalSource, "public");
  assert.deepEqual(row.financialStatusHistory.map((s) => [s.status, s.date]), [
    ["contracted", "2025-11-06"],
    ["disbursed", "2026-04-30"],
  ]);
  assert.deepEqual(row.implementationStatusHistory, []);
  assert.ok(row.evidence.some((e) => e.sourceId === "src-sarytogan-ebrd-topup-received-2026" && e.supports.includes("amount") && e.supports.includes("status")));
});

test("Sarytogan has exactly two EBRD investment lines without Commission-summary double count", () => {
  const rows = getAllFinancialCommitments().filter((row) => row.id.startsWith("fin-ebrd-") && row.id.includes("sarytogan"));
  assert.deepEqual(rows.map((r) => r.id).sort(), [initialId, followonId].sort());
  assert.ok(rows.every((r) => r.amount?.currency === "AUD" && r.providerOrgIds.includes("org-ebrd") && r.providerJurisdiction === null));
  assert.ok(rows.every((r) => r.recipientOrgIds.includes(recipientId)));
  assert.ok(rows.every((r) => !r.relationships.length));
  assert.ok(rows.every((r) => r.notes?.includes("€3.6M")));
  const received = organizationRoles(recipientId).received;
  assert.ok(received.some((r) => r.id === initialId));
  assert.ok(received.some((r) => r.id === followonId));
  const stack = projectStack(projectId)!;
  assert.ok(stack.rows.some((r) => r.id === initialId));
  assert.ok(stack.rows.some((r) => r.id === followonId));
  const sources = getAllSources();
  assert.ok(["src-ebrd-sarytogan-equity-2024", "src-ebrd-sarytogan-psd-54699",
    "src-fasken-sarytogan-ebrd-close-2025", "src-sarytogan-ebrd-topup-received-2026",
    "src-ebrd-sarytogan-followon-2026"].every((id) => sources.some((s) => s.id === id)));
});
