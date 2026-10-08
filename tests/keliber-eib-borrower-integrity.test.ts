import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllFinancialCommitments,
  getFinancialCommitmentById,
  getOrganizationById,
  getAllSources,
} from "@/lib/data";
import { projectStack, organizationRoles } from "@/lib/capital-intelligence";

const id = "fin-eu-eib-2024-keliber-loan";

test("the executed EIB facility identifies Keliber Technology Oy, not Keliber Oy, as borrower", () => {
  const c = getFinancialCommitmentById(id)!;
  assert.equal(c.recipient, "Keliber Technology Oy");
  assert.deepEqual(c.recipientOrgIds, ["org-keliber-technology-oy"]);
  assert.equal(c.projectId, "prj-fi-keliber-lithium");
  assert.equal(c.amount?.value, "150000000");
  assert.equal(c.amount?.currency, "EUR");
  assert.equal(c.instrument, "loan");
  assert.deepEqual(c.financialStatusHistory.map((s) => [s.status, s.date]), [["contracted", "2024-08-20"]]);
  assert.ok(c.evidence.some((e) => e.sourceId === "src-sec-keliber-eib-facility-agreement-2024" && e.supports.includes("recipient")));
});

test("the legal borrower receives the EIB capital row in organization views; the guarantor does not", () => {
  const borrower = organizationRoles("org-keliber-technology-oy");
  const guarantor = organizationRoles("org-keliber-oy");
  assert.ok(borrower.received.some((c) => c.id === id));
  assert.ok(!guarantor.received.some((c) => c.id === id));
  assert.notEqual(getOrganizationById("org-keliber-oy")?.id, getOrganizationById("org-keliber-technology-oy")?.id);
  assert.ok(projectStack("prj-fi-keliber-lithium")!.rows.some((c) => c.id === id));
});

test("the distinct EIB Natixis signature is acknowledged but not fabricated as a second direct Keliber loan", () => {
  const c = getFinancialCommitmentById(id)!;
  assert.match(c.notes ?? "", /Natixis/);
  assert.match(c.notes ?? "", /not recorded as a second direct Keliber loan/);
  assert.ok(getAllSources().some((s) => s.id === "src-eib-lending-report-2024"));
  assert.equal(
    getAllFinancialCommitments().filter((x) => x.id !== id && /eib.*keliber|keliber.*eib/i.test(x.id)).length,
    0,
  );
});
