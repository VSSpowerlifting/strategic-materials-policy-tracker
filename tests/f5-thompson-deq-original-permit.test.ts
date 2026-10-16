import test from "node:test";
import assert from "node:assert/strict";
import permit from "../research/f5/thompson-deq-2973-05-permit-review.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import existingBrief from "../research/f5/thompson-first-human-decision-brief.json";
import triangulation from "../research/f5/thompson-falls-original-and-field-triangulation.json";
import { getAllProjects, getAllSources, getAllProjectMilestones, getAllFinancialCommitments } from "../lib/data";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { site } from "../lib/site";

const original = permit.deqPrimaryOriginal;
const configs = original.engineeringConfigurations;
const items = (prefix: string) => configs.filter(c=>c.equipment.startsWith(prefix));
const units = (prefix:string)=>items(prefix).reduce((sum,c)=>sum+c.units,0);
const worksheet=()=>buildM3ReviewerPackets(queue,{
  projects:getAllProjects(),sources:getAllSources(),
  commitments:getAllFinancialCommitments(), corpusCutoff:site.lastUpdated,
  publicMilestoneCount:getAllProjectMilestones().length,
},"review-m3-2-thompson-falls-q2-expansion").worksheets[0];

test("DEQ original independent record is a regulator permit and NOT an M3 source attestation",()=>{
  assert.equal(permit.schemaVersion,"f5-5-thompson-deq-original-permit-review-v1");
  assert.equal(permit.classification,"independent_government_regulatory_authorization_not_industrial_commissioning");
  assert.equal(permit.originalReviewAuthority,"existing_unsigned_m3_only");
  assert.equal(permit.researchCheckedOn,"2026-10-16");
  assert.equal(permit.registeredInSmptSources,false);
  assert.equal(permit.sourceBodyDownloadedForHash,false);
  assert.equal(permit.humanOriginalDocumentAttested,false);
  assert.equal(permit.humanReviewDecisionRecorded,false);
  assert.equal(permit.publicMilestonePromotionAuthorized,false);
  assert.equal(permit.occurredOn,null);
  assert.equal(permit.editorialDisposition,
    "add_regulator_permitted_scope_as_context_to_existing_unsigned_m3_review_not_a_new_execution_milestone");
});

test("exact same Thompson M3 registry original, named facility and unsigned metadata digest",()=>{
  const w=worksheet();
  assert.ok(w);
  assert.equal(w.id,permit.canonicalM3ReviewId);
  assert.equal(w.project.id,permit.canonicalM3ProjectId);
  assert.equal(w.originalSource.id,permit.canonicalM3SourceId);
  assert.equal(w.proposedObservation.kind,permit.canonicalProposalKind);
  assert.equal(w.proposedObservation.scope,permit.canonicalProposalScope);
  assert.equal(w.proposedObservation.occurredOn,null);
  assert.equal(w.status,"unsigned_source_review");
  assert.equal(w.humanAttestationPresent,false);
  assert.match(w.reviewInputDigestSha256,/^[a-f0-9]{64}$/);
  assert.equal(existingBrief.existingM3ReviewId,w.id);
  assert.equal(existingBrief.primaryOriginal.evidenceSourceId,w.originalSource.id);
  assert.equal(triangulation.canonicalReviewId,w.id);
  assert.equal(getAllProjects().filter(x=>x.id===w.project.id).length,1);
  assert.equal(getAllProjectMilestones().length,0);
});

test("December 2025 DEQ permit #2973-05 is independent but not a newly registered source",()=>{
  assert.equal(original.publisher,"Montana Department of Environmental Quality");
  assert.equal(original.permitNumber,"2973-05");
  assert.equal(original.priorPermitNumber,"2973-04");
  assert.equal(original.officialDocumentUrl,
    "https://deq.mt.gov/files/Air/AirQuality/Documents/ARMpermits/2973-05_FNL.pdf");
  assert.equal(original.originalPdfTotalPages,77);
  assert.equal(original.receivedInitialApplication,"2025-09-03");
  assert.equal(original.applicationComplete,"2025-10-07");
  assert.equal(original.preliminaryDetermination,"2025-11-10");
  assert.equal(original.decisionIssued,"2025-12-05");
  assert.equal(original.permitFinalEffectiveOn,"2025-12-23");
  assert.match(original.facilityLocation,/Sanders County, Montana/);
  assert.ok(getAllSources().every(s=>s.url!==original.officialDocumentUrl));
  assert.ok(getAllSources().every(s=>s.id!=="src-montana-deq-thompson-falls-maqp-2973-05"));
});

test("DEQ scope pinning: nine new 3.0 MMBtu/hr and six old 0.85 MMBtu/hr, not 15 new furnaces",()=>{
  assert.equal(units("new_"),9);
  assert.equal(units("existing_"),6);
  assert.deepEqual(items("new_").map(x=>[x.equipment,x.units]),[
    ["new_reduction_furnace",5],["new_remelt_furnace",2],["new_oxidizer_furnace",2],
  ]);
  assert.deepEqual(items("existing_").map(x=>[x.equipment,x.units]),[
    ["existing_reduction_furnace",4],["existing_remelt_furnace",1],["existing_oxidizer_furnace",1],
  ]);
  assert.ok(items("new_").every(x=>x.thermalInputMMBtuPerHourEach===3));
  assert.ok(items("existing_").every(x=>x.thermalInputMMBtuPerHourEach===0.85));
  assert.ok(configs.every(x=>x.units>0 && Number.isFinite(x.thermalInputMMBtuPerHourEach)));
  assert.equal(configs.length,6);
});

test("DEQ engineering pages capture corrected applicant/DEQ counts and testing-only obligations",()=>{
  const loc=original.locators;
  assert.deepEqual(loc.map(x=>x.pageIndex),[0,2,4,4,7,9]);
  assert.match(loc[1].section,/Section I.B/);
  assert.match(loc[2].section,/Section II.B.1/);
  assert.match(loc[3].section,/Section II.C.1/);
  assert.match(loc[5].finding,/Applicant corrected an earlier mix-up/);
  assert.match(loc[2].finding,/Initial EPA method source testing required/);
  assert.match(loc[3].finding,/annual emissions inventory requests/);
  assert.ok(loc.every(x=>x.pageIndex>=0 && x.pageIndex<original.originalPdfTotalPages));
  assert.deepEqual(original.permitDoesNotContain,{
    verifiedCommissioningDate:null, completedAllNewFurnacesTestReport:null,
    independentObservedOutputTonnes:null,actualNineFurnaceSimultaneousOperation:null,
  });
});

test("the six old permitted versus seven old reported ambiguity is explicit and unresolved",()=>{
  const reporter=permit.separateOriginalPhysicalReporting;
  assert.equal(reporter.url,
    "https://www.scledger.net/story/2026/08/27/news/usac-capacity-expands-with-new-t-falls-facility/14209.html");
  assert.equal(reporter.datePublished,"2026-08-27");
  assert.equal(reporter.reporterDescribedNewUnits,9);
  assert.equal(reporter.reportedNewUnitsOperational,7);
  assert.equal(reporter.reporterQualifiesNotAllSimultaneously,true);
  assert.equal(reporter.reporterDescribedLegacyFurnaces,7);
  assert.equal(reporter.actualSiteVisitDay,null);
  assert.equal(reporter.originalOnSiteReportNotGovernmentInspection,true);
  assert.equal(reporter.originalReportNotRegisteredAsM3Source,true);
  assert.equal(permit.unresolvedEquipmentDiscrepancy.deqExistingUnits,6);
  assert.equal(permit.unresolvedEquipmentDiscrepancy.ledgerLegacyUnits,7);
  assert.equal(permit.unresolvedEquipmentDiscrepancy.reconciliation,
    "unresolved_different_equipment_inventory_or_definition");
  assert.match(permit.unresolvedEquipmentDiscrepancy.editorialStop,/Do not quietly equate six/);
  assert.match(permit.unresolvedEquipmentDiscrepancy.editorialStop,/do not assert permit noncompliance/);
});

test("original-source edges cannot turn regulatory authorization into audited physical completion",()=>{
  assert.deepEqual(permit.sourceEvidenceEdges.map(x=>x.from),[
    "montana_deq_permit_2973_05","local_2026_08_27_field_report","sec_2026_q2_10q",
  ]);
  assert.equal(permit.sourceEvidenceEdges[0].supports,"permitted_nine_new_units_and_emissions_conditions");
  assert.equal(permit.sourceEvidenceEdges[0].doesNotSupport,"all_new_units_commissioned_or_realized_output");
  assert.equal(permit.sourceEvidenceEdges[1].doesNotSupport,"all_nine_operating_together_or_nameplate_tonnage");
  assert.equal(permit.sourceEvidenceEdges[2].doesNotSupport,"exact_commissioning_day_or_full_capacity");
  assert.equal(site.lastUpdated,"2026-10-09");
  assert.equal(getAllProjectMilestones().length,0);
});

test("genuine regulator followup identified without claiming records obtained or request sent",()=>{
  const todo=permit.originalRecordFollowUp;
  assert.equal(todo.status,"possible_public_records_request_not_submitted");
  assert.equal(todo.targetAgency,"Montana DEQ Air Quality Field Services / Records");
  assert.equal(todo.permitNumber,"2973-05");
  assert.equal(todo.suggestedWindowStart,"2026-05-01");
  assert.equal(todo.suggestedWindowEnd,"2026-10-16");
  assert.equal(todo.requestTargets.length,4);
  assert.ok(todo.requestTargets.some(x=>x.includes("source-test protocols")));
  assert.ok(todo.requestTargets.some(x=>x.includes("inspection reports")));
  assert.ok(todo.requestTargets.some(x=>x.includes("de minimis changes")));
  assert.ok(todo.requestTargets.some(x=>x.includes("not an unconditional furnace-startup notice requirement")));
  assert.ok(todo.requestTargets.some(x=>x.includes("production or emissions inventory")));
  assert.match(todo.materialStillAbsent,/does not prove it does not exist/);
});
