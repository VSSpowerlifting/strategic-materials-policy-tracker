import test from "node:test";
import assert from "node:assert/strict";

import { financialAmountOn, totalCommitments } from "@/lib/capital-control";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllJurisdictions, getAllMaterials, getAllOrganizations, getAllProgrammes,
  getAllProjectDesignations, getAllProjects, getAllSources,
  getFinancialCommitmentById,
} from "@/lib/data";
import { validateCapitalControl } from "@/scripts/validate-capital-control";
import reconciliation from "@/research/f4/neo-jtf-amount-reconciliation.json";

const GRANT = "fin-eu-jtf-2025-neo-magnet-project";
const BENEFICIARY = "org-npm-narva-ou";
const EIS = "src-eis-npm-narva-jtf-project-grant";
const MINISTRY = "src-estonia-finance-jtf-narva-audit-2025-11";

test("F4-B4: legally named NPM Narva is its own Estonian grantee, never an alias of sponsor Neo", () => {
  const organizations = getAllOrganizations();
  const subsidiary = organizations.find(x => x.id === BENEFICIARY)!;
  const sponsor = organizations.find(x => x.id === "org-neo-performance")!;
  assert.ok(subsidiary && sponsor);
  assert.notEqual(subsidiary.id, sponsor.id);
  assert.equal(subsidiary.name, "NPM Narva OÜ");
  assert.equal(subsidiary.countryCode, "EE");
  assert.equal(subsidiary.kind, "company");
  assert.equal(subsidiary.actor, null);
  assert.deepEqual(subsidiary.parents, [],
    "no invented direct shareholding from group-sponsor language");
  assert.ok(subsidiary.notes?.includes("16493223"));
  assert.ok(subsidiary.notes?.includes("NPM Silmet OÜ"));
  assert.deepEqual(subsidiary.evidence.map(x=>x.sourceId), [EIS, MINISTRY]);
  assert.ok(!sponsor.aliases.includes("NPM Narva OÜ"));
  assert.equal(organizations.filter(x=>x.id===BENEFICIARY).length, 1);
});

test("F4-B4: current financing recipient has government documentary support, not parent-only attribution", () => {
  const grant = getFinancialCommitmentById(GRANT)!;
  assert.equal(grant.recipient, "NPM Narva OÜ");
  assert.deepEqual(grant.recipientOrgIds, [BENEFICIARY]);
  const sources = grant.evidence.filter(e=>e.supports.includes("recipient"));
  assert.deepEqual(sources.map(e=>e.sourceId).sort(), [EIS, MINISTRY].sort());
  assert.ok(grant.evidence.find(e=>e.sourceId==="src-ec-resourceeu-com-945")?.supports.includes("project"));
  assert.ok(!grant.evidence.find(e=>e.sourceId==="src-neo-jtf-award-2022")?.supports.includes("recipient"),
    "parent-group announcement does not prove subsidiary-specific legal grantee");
  assert.ok(grant.notes?.includes("initial November 2022"));
  assert.ok(grant.notes?.includes("NPM Silmet OÜ"));
  assert.equal(grant.projectId, "prj-ee-neo-rare-earth-magnet-project");
  assert.equal(grant.amount?.value, "14800000");
  assert.equal(grant.amount?.qualifier, "approximately");
  assert.equal(grant.financialAmountHistory, undefined,
    "current entity correction cannot silently supply historical amount versions");
  assert.equal(financialAmountOn(grant, "2024-11-28").kind, "history_unreviewed");
});

test("F4-B4: changing current grantee does not change any totals, grant identity or cash interpretation", () => {
  const all = getAllFinancialCommitments();
  const current = getFinancialCommitmentById(GRANT)!;
  const oldGroupLabel = structuredClone(current);
  oldGroupLabel.recipient = "Neo Performance";
  oldGroupLabel.recipientOrgIds = ["org-neo-performance"];
  assert.deepEqual(totalCommitments([oldGroupLabel], all), totalCommitments([current], all));
  const eur = totalCommitments([current], all).currencies.find(x=>x.currency==="EUR");
  assert.ok(eur && eur.status === "summed");
  assert.deepEqual(eur.countedIds, [GRANT]);
  assert.equal(all.filter(x=>x.id===GRANT).length,1);
  assert.deepEqual(current.financialStatusHistory.map(x=>[x.status,x.date]), [
    ["decided", "2022-11-09"], ["partially_disbursed","2025-12-31"],
  ]);
  assert.equal(reconciliation.noPromotion,true);
  assert.equal(reconciliation.historicalTotalsAuthorized,false);
});

test("F4-B4: recipient-history ambiguity remains explicit, not invented as exact grant effective day", () => {
  const res = reconciliation.reconciliation.currentRecipientResolution;
  assert.equal(res.resolution,"current_legal_recipient_corrected");
  assert.equal(res.priorRecipientLabel,"Neo Performance");
  assert.equal(res.canonicalRecipient,"NPM Narva OÜ");
  assert.equal(res.canonicalRecipientOrgId,BENEFICIARY);
  assert.equal(res.entityRegistryNumber,"16493223");
  assert.deepEqual(res.legalIdentitySourceIds,[EIS,MINISTRY]);
  assert.equal(res.historicalOriginalBeneficiary,"NPM Silmet OÜ");
  assert.equal(res.historicalTransferDecision,"11-2/23/3085");
  assert.equal(res.historicalTransferDecisionDate,"2023-11-03");
  assert.equal(res.historicalRecipientEffectiveDayProven,false);
  assert.equal(res.directShareholdingOrIntermediateOwnershipProven,false);
  assert.equal(reconciliation.reconciliation.officialProjectRegister.legalGranteeIdentityReviewRequired,false);
  assert.equal(reconciliation.amendment.exactOperativeDayEstablished,false);
});

test("F4-B4: normal source, organization, finance and status validation remains green", () => {
  const checked = validateCapitalControl({
    financialCommitments:getAllFinancialCommitments(),
    controlMeasures:getAllControlMeasures(),
    organizations:getAllOrganizations(),
    projects:getAllProjects(),
    programmes:getAllProgrammes(),
    projectDesignations:getAllProjectDesignations(),
    corpus:{
      events:getAllEvents(),
      sources:getAllSources(),
      materials:getAllMaterials(),
      jurisdictions:getAllJurisdictions(),
    },
    today:"2026-10-09",
  });
  assert.deepEqual(checked.errors.filter(x=>x.recordId===GRANT || x.recordId===BENEFICIARY), []);
});
