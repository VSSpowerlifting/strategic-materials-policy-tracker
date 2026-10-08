import { test } from "node:test";
import assert from "node:assert/strict";
import { financialStatusOn, legalStandingOn } from "@/lib/capital-control";
import {
  getAllFinancialCommitments, getEventById, getFinancialCommitmentById,
  getOrganizationById, getProjectById, getMaterialBySlug, getSourceById
} from "@/lib/data";

const FIN="fin-us-doe-rhyolite-ridge-guarantee-2025";
const EVT="evt-us-doe-rhyolite-ridge-2025";
const PRO="prj-us-rhyolite-ridge-processing";
const DOE="src-doe-ioneer-rhyolite-2025-close";
const Q2="src-sec-ioneer-rhyolite-q2-2026";
const HY="src-sec-ioneer-rhyolite-halfyear-2026";

test("Rhyolite Ridge records one $996M DOE guarantee, with its components not extra financing", () => {
  const row=getFinancialCommitmentById(FIN)!;
  assert.ok(row);
  assert.equal(row.eventId,EVT);
  assert.equal(row.instrument,"loan_guarantee");
  assert.equal(row.valueRole,"commitment");
  assert.equal(row.capitalSource,"public");
  assert.deepEqual(row.amount,{value:"996000000",currency:"USD",qualifier:"exact",
    amountAsStated:"$996 million loan guarantee ($968 million principal plus $28 million capitalized interest)",currencyBasis:"stated"});
  assert.deepEqual(row.relationships,[]);
  const same=getAllFinancialCommitments().filter(c=>c.recipientOrgIds.includes("org-ioneer-rhyolite-ridge-llc") && c.providerOrgIds.includes("org-us-doe"));
  assert.deepEqual(same.map(c=>c.id),[FIN]);
  assert.match(row.notes??"",/2023 conditional commitment/);
  assert.match(row.notes??"",/not additive/);
});

test("DOE closing is legally contracted, not a finding of paid advances", () => {
  const row=getFinancialCommitmentById(FIN)!;
  assert.deepEqual(row.financialStatusHistory.map(h=>[h.status,h.date,h.sourceId]),[["contracted","2025-01-17",DOE]]);
  assert.equal(financialStatusOn(row,"2025-01-16"),null);
  assert.equal(financialStatusOn(row,"2025-01-17"),"contracted");
  assert.equal(legalStandingOn(row,"2025-01-17"),"binding");
  assert.equal(financialStatusOn(row,"2026-06-30"),"contracted");
  assert.ok(!row.financialStatusHistory.some(h=>["disbursed","partially_disbursed"].includes(h.status)));
  assert.match(row.notes??"",/establishment fees are costs paid by Ioneer/);
  assert.ok(row.evidence.some(e=>e.sourceId===HY && e.supports.includes("status")));
});

test("Rhyolite Ridge guarantee is processing-only and pre-FID, not mine construction", () => {
  const row=getFinancialCommitmentById(FIN)!;
  const project=getProjectById(PRO)!;
  assert.equal(row.projectId,PRO);
  assert.deepEqual(row.stages,["processing"]);
  assert.deepEqual(project.stages,["processing"]);
  assert.deepEqual(row.materialIds,["lithium"]);
  assert.equal(row.materialAttribution,"tracked_only");
  assert.equal(project.materialAttribution,"includes_untracked");
  assert.deepEqual(project.untrackedMaterialsAsStated,["boron"]);
  assert.deepEqual(row.implementationStatusHistory.map(e=>[e.status,e.date,e.sourceId]),[["feasibility",null,Q2]]);
  assert.ok(!row.implementationStatusHistory.some(e=>["construction","operational","commissioning"].includes(e.status)));
  assert.match(project.notes??"",/not open-pit mining/);
});

test("borrower in DOE closing remains distinct from older proposed NEPA counterparty and parent", () => {
  const row=getFinancialCommitmentById(FIN)!;
  assert.deepEqual(row.providerOrgIds,["org-us-doe"]);
  assert.deepEqual(row.recipientOrgIds,["org-ioneer-rhyolite-ridge-llc"]);
  const borrower=getOrganizationById("org-ioneer-rhyolite-ridge-llc")!;
  assert.equal(borrower.name,"Ioneer Rhyolite Ridge LLC");
  assert.equal(borrower.countryCode,"US");
  assert.ok(!borrower.aliases.includes("Rhyolite Ridge Holdings LLC"));
  const listed=getOrganizationById("org-ioneer-ltd")!;
  assert.equal(listed.countryCode,"AU");
  assert.ok(!row.recipientOrgIds.includes("org-ioneer-ltd"));
  assert.ok(row.evidence.some(e=>e.sourceId===DOE && e.supports.includes("recipient")));
});

test("Rhyolite Ridge appears in U.S. event and lithium dossier with registered primary records",()=>{
  const event=getEventById(EVT)!;
  assert.equal(event.date,"2025-01-17");
  assert.equal(event.verificationStatus,"verified");
  assert.deepEqual(event.affectedMaterialIds,["lithium"]);
  assert.ok(event.sourceIds.includes(DOE));
  const material=getMaterialBySlug("lithium")!;
  assert.ok(material.eventIds.includes(EVT));
  assert.ok(material.sourceIds.includes(Q2));
  assert.equal(getSourceById(DOE)?.url,"https://www.energy.gov/edf/articles/doe-announces-996-million-loan-guarantee-ioneer-rhyolite-ridge-advance-domestic");
  assert.equal(getSourceById(HY)?.datePublished,"2026-08-13");
});
