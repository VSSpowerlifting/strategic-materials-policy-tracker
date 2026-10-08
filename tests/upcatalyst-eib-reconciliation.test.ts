import { test } from "node:test";
import assert from "node:assert/strict";
import { financialStatusOn } from "@/lib/capital-control";
import { getAllFinancialCommitments, getFinancialCommitmentById, getSourceById } from "@/lib/data";

const ID = "fin-eu-eib-2025-up-catalyst-loan";
const SOURCE = "src-eib-up-catalyst-green-graphite-20240127";

test("EIB Up Catalyst €18M loan is signed on 2024-12-20, not presumed paid", () => {
  const loan = getFinancialCommitmentById(ID);
  assert.ok(loan);
  assert.equal(loan.instrument, "loan");
  assert.equal(loan.capitalSource, "public_enterprise");
  assert.deepEqual(loan.amount, {
    value: "18000000", currency: "EUR", qualifier: "exact",
    amountAsStated: "€18,000,000 signed 20 December 2024", currencyBasis: "stated"
  });
  assert.equal(loan.financialStatusHistory.length, 1);
  assert.equal(loan.financialStatusHistory[0].status, "contracted");
  assert.equal(loan.financialStatusHistory[0].date, "2024-12-20");
  assert.equal(loan.financialStatusHistory[0].sourceId, SOURCE);
  assert.equal(financialStatusOn(loan, "2024-12-19"), null);
  assert.equal(financialStatusOn(loan, "2024-12-20"), "contracted");
  assert.deepEqual(loan.implementationStatusHistory, []);
  assert.deepEqual(loan.providerOrgIds, ["org-eu-eib"]);
  assert.deepEqual(loan.recipientOrgIds, ["org-up-catalyst"]);
  assert.equal(loan.recipient, "UP CATALYST OU");
  assert.equal(getSourceById(SOURCE)?.url, "https://www.eib.org/en/projects/all/20240127");
  assert.ok(loan.evidence.some(e => e.sourceId === SOURCE && e.evidence === "explicit" &&
    e.supports.includes("amount") && e.supports.includes("status") && e.supports.includes("recipient")));
});

test("EIB venture debt is not double-booked to the CO2Graphite project", () => {
  const loan = getFinancialCommitmentById(ID)!;
  assert.equal(loan.projectId, null);
  assert.match(loan.project ?? "", /GREEN GRAPHITE/);
  assert.deepEqual(loan.stages, ["processing", "research_development"]);
  assert.equal(loan.stageAllocation, "multi_stage_unallocated");
  assert.equal(loan.materialAttribution, "includes_untracked");
  assert.deepEqual(loan.untrackedMaterialsAsStated, ["multi-walled carbon nanotubes (MWCNTs)"]);
  const sameRecipientProvider = getAllFinancialCommitments().filter(c =>
    c.providerOrgIds.includes("org-eu-eib") && c.recipientOrgIds.includes("org-up-catalyst"));
  assert.deepEqual(sameRecipientProvider.map(c => c.id), [ID]);
});
