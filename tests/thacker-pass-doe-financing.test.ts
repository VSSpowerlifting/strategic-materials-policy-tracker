import { test } from "node:test";
import assert from "node:assert/strict";

import { financialStatusOn, legalStandingOn } from "@/lib/capital-control";
import {
  getAllFinancialCommitments,
  getEventById,
  getFinancialCommitmentById,
  getMaterialBySlug,
  getOrganizationById,
  getProjectById,
  getSourceById,
} from "@/lib/data";

const FIN = "fin-us-doe-thacker-pass-atvm-2024";
const EVT = "evt-us-doe-thacker-pass-loan-2024";
const PRJ = "prj-us-thacker-pass-phase1-processing";
const SEC_Q2 = "src-sec-lac-thacker-q2-2026";

test("Thacker Pass is one approximately $2.23B amended DOE loan, not original plus revised facilities", () => {
  const row = getFinancialCommitmentById(FIN);
  assert.ok(row);
  assert.equal(row.eventId, EVT);
  assert.equal(row.instrument, "loan");
  assert.equal(row.valueRole, "commitment");
  assert.equal(row.capitalSource, "public");
  assert.equal(row.providerJurisdiction, "us");
  assert.deepEqual(row.providerOrgIds, ["org-us-doe"]);
  assert.deepEqual(row.recipientOrgIds, ["org-lithium-nevada-llc"]);
  assert.deepEqual(row.amount, {
    value: "2230000000",
    currency: "USD",
    qualifier: "approximately",
    amountAsStated: "$2.23 billion amended expected loan amount ($1.97 billion principal plus approximately $256 million capitalized interest)",
    currencyBasis: "stated",
  });
  assert.deepEqual(row.relationships, []);
  assert.match(row.notes ?? "", /\$2\.26B/);
  assert.match(row.notes ?? "", /\$2\.226B/);
  assert.match(row.notes ?? "", /historically versioned amounts/);
  assert.deepEqual(getAllFinancialCommitments().filter(c =>
    c.providerOrgIds.includes("org-us-doe") && c.recipientOrgIds.includes("org-lithium-nevada-llc")
  ).map(c => c.id), [FIN], "one federal facility, not separate initial/amended/advance rows");
});

test("Thacker Pass has correctly dated contracted and partially disbursed standing", () => {
  const row = getFinancialCommitmentById(FIN)!;
  assert.deepEqual(row.financialStatusHistory.map(e => [e.status, e.date]), [
    ["contracted", "2024-10-28"],
    ["partially_disbursed", "2025-10-20"],
  ]);
  assert.equal(financialStatusOn(row, "2024-10-27"), null);
  assert.equal(financialStatusOn(row, "2024-10-28"), "contracted");
  assert.equal(legalStandingOn(row, "2024-10-28"), "binding");
  assert.equal(financialStatusOn(row, "2025-10-19"), "contracted");
  assert.equal(financialStatusOn(row, "2025-10-20"), "partially_disbursed");
  assert.equal(financialStatusOn(row, "2026-06-30"), "partially_disbursed");
  assert.equal(row.financialStatusHistory[1].sourceId, SEC_Q2);
  assert.match(row.notes ?? "", /\$1\.209B/);
  assert.match(row.notes ?? "", /not additional finance/);
  assert.equal(row.terms.length, 0, "cash advances are not additional facility instruments");
});

test("DOE-funded Phase 1 processing is not the whole Thacker Pass mining development", () => {
  const row = getFinancialCommitmentById(FIN)!;
  const project = getProjectById(PRJ)!;
  assert.equal(row.projectId, PRJ);
  assert.deepEqual(row.stages, ["processing"]);
  assert.deepEqual(row.materialIds, ["lithium"]);
  assert.deepEqual(project.stages, ["processing"]);
  assert.deepEqual(project.sponsorOrgIds, ["org-lithium-nevada-llc"]);
  assert.match(project.notes ?? "", /not the open-pit mine/);
  assert.deepEqual(row.implementationStatusHistory.map(e => [e.status, e.date, e.sourceId]), [
    ["construction", "2026-06-30", SEC_Q2],
  ]);
  assert.ok(!row.implementationStatusHistory.some(e => ["operational", "commissioning"].includes(e.status)));
  assert.ok(row.evidence.some(e => e.sourceId === "src-doe-thacker-pass-nepa-2024" &&
    e.supports.includes("project") && e.supports.includes("stages")));
});

test("original corporate borrower and renamed LLC are one legal recipient, not the listed parent", () => {
  const borrower = getOrganizationById("org-lithium-nevada-llc")!;
  assert.equal(borrower.name, "Lithium Nevada LLC");
  assert.equal(borrower.countryCode, "US");
  assert.ok(borrower.aliases.includes("Lithium Nevada Corp."));
  assert.ok(borrower.evidence.some(e => e.sourceId === "src-sec-lac-thacker-amendment-2025"));
  const lender = getOrganizationById("org-us-doe")!;
  assert.equal(lender.actor, "us");
  assert.equal(lender.kind, "government");
  assert.ok(!getFinancialCommitmentById(FIN)!.recipientOrgIds.includes("org-lithium-americas"));
});

test("Thacker Pass evidence is reachable from event and lithium dossier without phantom draws", () => {
  const event = getEventById(EVT)!;
  assert.equal(event.date, "2024-10-28");
  assert.equal(event.verificationStatus, "verified");
  assert.deepEqual(event.affectedMaterialIds, ["lithium"]);
  assert.ok(event.sourceIds.includes("src-sec-lac-thacker-loan-agreement-2024"));
  assert.ok(event.sourceIds.includes(SEC_Q2));
  const lithium = getMaterialBySlug("lithium")!;
  assert.ok(lithium.eventIds.includes(EVT));
  assert.ok(lithium.sourceIds.includes(SEC_Q2));
  assert.equal(getSourceById(SEC_Q2)?.url,
    "https://www.sec.gov/Archives/edgar/data/1966983/000119312526347826/lac-20260630.htm");
  assert.match(event.summary, /\$1\.209 billion/);
  assert.match(event.analyticalSignificance, /not federal financing of mine development/);
});
