import test from "node:test";
import assert from "node:assert/strict";
import handoff from "../research/f5/thompson-deq-records-access-handoff.json";
import prior from "../research/f5/thompson-deq-2973-05-permit-review.json";
import decisions from "../research/project-execution/m3-2-adjudications.example.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { getAllSources, getAllProjects, getAllFinancialCommitments, getAllProjectMilestones } from "../lib/data";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { site } from "../lib/site";

const current=()=>structuredClone(handoff);
const m3=()=>buildM3ReviewerPackets(queue,{
  projects:getAllProjects(),sources:getAllSources(),
  commitments:getAllFinancialCommitments(),corpusCutoff:site.lastUpdated,
  publicMilestoneCount:getAllProjectMilestones().length,
},"review-m3-2-thompson-falls-q2-expansion").worksheets[0];

test("records handoff belongs only to existing unsigned Thompson SEC review",()=>{
  const w=m3();
  assert.ok(w);
  assert.equal(handoff.schemaVersion,"f5-5-thompson-deq-public-records-handoff-v1");
  assert.equal(handoff.checkedOn,"2026-10-16");
  assert.equal(handoff.status,"priority_a_submitted_priority_b_draft");
  assert.equal(handoff.scope,"regulator_held_documents_not_human_source_decision");
  assert.equal(handoff.canonicalM3ReviewId,w.id);
  assert.equal(handoff.canonicalProjectId,w.project.id);
  assert.equal(handoff.canonicalSourceId,w.originalSource.id);
  assert.equal(w.status,"unsigned_source_review");
  assert.equal(w.proposedObservation.kind,"construction_progress_reported");
  assert.equal(w.proposedObservation.scope,"named_facility");
  assert.equal(w.proposedObservation.occurredOn,null);
  assert.equal(w.humanAttestationPresent,false);
  assert.equal(getAllProjectMilestones().length,2);
});

test("official permit #2973-05 keeps source testing conditional on unverified all-nine startup",()=>{
  const p=handoff.deqPermit,c=p.sourceTestCondition;
  assert.equal(p.identifier,prior.deqPrimaryOriginal.permitNumber);
  assert.equal(p.predecessor,prior.deqPrimaryOriginal.priorPermitNumber);
  assert.equal(p.url,prior.deqPrimaryOriginal.officialDocumentUrl);
  assert.equal(p.originalPdfPageCount,prior.deqPrimaryOriginal.originalPdfTotalPages);
  assert.equal(p.effectiveOn,prior.deqPrimaryOriginal.permitFinalEffectiveOn);
  assert.equal(p.newReductionUnits+p.newRemeltUnits+p.newOxidizerUnits,9);
  assert.equal(p.existingPermittedUnits,6);
  assert.equal(p.existingLegacyFurnacesInLocalReporting,7);
  assert.equal(p.existingPermittedUnits,prior.unresolvedEquipmentDiscrepancy.deqExistingUnits);
  assert.equal(p.existingLegacyFurnacesInLocalReporting,prior.unresolvedEquipmentDiscrepancy.ledgerLegacyUnits);
  assert.equal(c.locator,"PDF p. 4, Section II.B.1");
  assert.equal(c.trigger,"initial_startup_of_all_new_reduction_remelt_and_oxidizer_furnaces");
  assert.equal(c.statedTimeWindow,"within_60_days_but_no_later_than_180_days_after_trigger");
  assert.equal(c.actualTriggerOn,null);
  assert.equal(c.initialTestCompletedOn,null);
  assert.equal(c.dueDateEstablished,false);
  assert.equal(c.violationEstablished,false);
});

test("de minimis notice is conditional, not fake general initial furnace startup notice",()=>{
  const p=handoff.deqPermit;
  assert.equal(p.deMinimisChangeNotice.locator,"PDF p. 5, Section II.C.2");
  assert.equal(p.deMinimisChangeNotice.onlyIf,"construction_or_improvement_meets_arm_17_8_745_de_minimis_change_conditions");
  assert.equal(p.deMinimisChangeNotice.doesNotEstablish,"general_initial_startup_notice_for_permitted_nine_furnaces");
  assert.equal(p.companyHeldFiveYearRecords.locator,"PDF p. 5, Section II.C.4");
  assert.equal(p.companyHeldFiveYearRecords.noAssumptionThatDeqAlreadyHoldsThem,true);
  assert.equal(p.annualProductionInformation.locator,"PDF p. 4, Section II.C.1");
  assert.equal(p.annualProductionInformation.noAssumptionAnnual2026InventoryFiled,true);
  assert.ok(prior.originalRecordFollowUp.requestTargets.some(x=>
    x.includes("not an unconditional furnace-startup notice requirement")));
  assert.ok(prior.originalRecordFollowUp.requestTargets.every(x=>
    !x.includes("Any notices of startup or material changes submitted")));
});

test("state official portal, supported agency and fee-waiver evidence never impersonate account or submission",()=>{
  const p=handoff.requestProcess;
  assert.equal(p.authority,"Montana Department of Environmental Quality via Montana Office of Public Information Requests");
  assert.equal(p.deqGuidanceUrl,"https://www.deq.mt.gov/about/public-records");
  assert.equal(p.supportedAgencyListUrl,"https://doa.mt.gov/OPIR/agencies");
  assert.equal(p.portalUrl,"https://mt-pir.arkcase.us/pir/portal/reading-room");
  assert.equal(p.referenceContact,"DEQRecords@mt.gov");
  assert.equal(p.accountMayBeRequired,true);
  assert.equal(p.requestNotSent,false);
  assert.equal(p.currentPriorityARequestState,"Intake");
  assert.equal(p.currentPriorityARequestStatus,"Perfected");
  assert.equal(p.currentPriorityAStatusObservedOn,"2026-10-16");
  assert.equal(p.privateRequestReferenceHeldOutsidePublicRepository,true);
  assert.equal(p.feeWaiverRequested,true);
  assert.equal(p.feeWaiverApproved,false);
  assert.equal(p.feeWaiverDecision,"pending");
  assert.equal(p.feePreference,"estimate_before_processing");
  assert.equal(p.feesAuthorized,false);
  assert.equal(p.recordResponsesReceived,false);
  assert.equal(p.studentFeeWaiverAvailableWithEnrollmentProof,true);
  assert.equal(p.noEnrollmentDocumentsInRepository,true);
  assert.equal(p.feesMayApplyOtherwise,true);
  assert.match(p.agencyTargetResponse,/not a guaranteed/);
  assert.equal(p.archiveCheck.result,"archive_not_fully_queryable_from_available_read_only_web_interface");
  assert.equal(p.archiveCheck.noInferenceOfDocumentAbsence,true);
});

test("one submitted and one draft source-document request retain exact scope and clocks",()=>{
  const a=handoff.requestRounds;
  assert.equal(a.length,2);
  assert.deepEqual(a.map(x=>x.id),[
    "first_priority_initial_source_testing","second_priority_independent_inspection"]);
  assert.deepEqual(a.map(x=>x.priority),[1,2]);
  assert.equal(a[0].status,"submitted_intake_perfected");
  assert.equal(a[0].submittedOn,"2026-10-16");
  assert.equal(a[0].submittedText,"abridged_600_character_portal_description_not_full_research_draft");
  assert.equal(a[0].acknowledgment,"user_supplied_request_status_screenshot");
  assert.equal(a[0].requestReference,"private_vault_only");
  assert.equal(a[0].feeWaiverDecision,"pending");
  assert.equal(a[1].status,"draft_not_submitted");
  assert.ok(a.every(x=>x.permitNumber===handoff.deqPermit.identifier));
  assert.ok(a.every(x=>x.startOn==="2026-05-01" && x.endOn==="2026-10-16"));
  assert.ok(a.every(x=>x.facility.includes("Thompson Falls")));
  assert.ok(a.every(x=>x.subject.includes("#2973-05")));
  assert.ok(a.every(x=>x.body.includes("electronic copies")));
  assert.ok(a.every(x=>x.body.includes("fees")));
  assert.ok(a.every(x=>x.body.includes("If no responsive")));
  assert.ok(a.every(x=>x.doNotClaim.length>=4));
  assert.ok(a.every(x=>x.rationale.length>110));
});

test("first priority requests regulator-held completed tests, protocol records and verified furnace IDs without output inference",()=>{
  const a=handoff.requestRounds[0];
  assert.match(a.body,/Section II.B.1/);
  assert.match(a.body,/source-test protocol submissions/);
  assert.match(a.body,/actual initial-startup or testing dates/);
  assert.match(a.body,/completed test reports/);
  assert.match(a.body,/furnace or emissions-unit ID/);
  assert.match(a.body,/predecessor MAQP #2973-04/);
  assert.ok(a.doNotClaim.includes("all_nine_units_started"));
  assert.ok(a.doNotClaim.includes("test_due_or_overdue"));
  assert.ok(a.doNotClaim.includes("test_passed"));
});

test("inspection follow-up preserves six older permitted vs seven old-building report ambiguity",()=>{
  const b=handoff.requestRounds[1];
  assert.match(b.body,/inspection reports or contemporaneous regulator field-visit notes/);
  assert.match(b.body,/six older units listed in the December 2025 permit/);
  assert.match(b.body,/seven furnaces in the old building/);
  assert.match(b.body,/if any/);
  assert.match(b.body,/do not perform a new compliance assessment/);
  assert.ok(b.doNotClaim.includes("regulator_inspection_has_occurred"));
  assert.ok(b.doNotClaim.includes("legacy_inventory_mismatch_proves_violation"));
  assert.ok(b.doNotClaim.includes("absence_of_inspection_means_no_operation"));
});

test("private source intake and no public mutation survive a deterministic offline review",()=>{
  assert.equal(handoff.publicMilestoneAuthorized,false);
  assert.equal(handoff.humanReviewCompleted,false);
  assert.equal(handoff.recordsObtained,false);
  assert.equal(handoff.recordsRequestSubmitted,true);
  assert.ok(handoff.nextUseOfRecords.whenObtained.includes("gitignored private evidence vault"));
  assert.match(handoff.nextUseOfRecords.reviewer,/existing M3 original-source human adjudication/);
  assert.match(handoff.nextUseOfRecords.publication,/No automatic project-milestone seed/);
  assert.equal(site.lastUpdated,"2026-10-17");
  assert.equal(getAllProjectMilestones().length,2);
  assert.ok(decisions.every(x=>x.verdict==="pending" && x.reviewedBy===null && x.reviewedAt===null));
  const input=current(),before=JSON.stringify(input);
  assert.deepEqual(current(),current());
  assert.equal(JSON.stringify(input),before);
});
