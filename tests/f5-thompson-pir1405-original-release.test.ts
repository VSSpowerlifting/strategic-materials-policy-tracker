import test from "node:test";
import assert from "node:assert/strict";
import receipt from "../research/f5/thompson-pir1405-original-documents.json";
import request from "../research/f5/thompson-deq-records-access-handoff.json";
import deq from "../research/f5/thompson-deq-2973-05-permit-review.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import decisions from "../research/project-execution/m3-2-adjudications.example.json";
import { getAllProjects,getAllSources,getAllFinancialCommitments,getAllProjectMilestones } from "../lib/data";
import { site } from "../lib/site";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";

const m3=()=>buildM3ReviewerPackets(queue,{
 projects:getAllProjects(),sources:getAllSources(),commitments:getAllFinancialCommitments(),
 corpusCutoff:site.lastUpdated,publicMilestoneCount:getAllProjectMilestones().length,
},"review-m3-2-thompson-falls-q2-expansion").worksheets[0];

test("PIR release explicitly remains an unsigned supplement to current real M3 reviewer authority",()=>{
 const w=m3();
 assert.ok(w);
 assert.equal(receipt.schemaVersion,"f5-5-thompson-pir1405-original-documents-v1");
 assert.equal(receipt.analyzedOn,"2026-10-16");
 assert.equal(receipt.m3.canonicalReviewId,w.id);
 assert.equal(receipt.m3.canonicalProjectId,w.project.id);
 assert.equal(receipt.m3.canonicalSourceId,w.originalSource.id);
 assert.equal(w.proposedObservation.kind,"construction_progress_reported");
 assert.equal(w.proposedObservation.scope,"named_facility");
 assert.equal(w.proposedObservation.occurredOn,null);
 assert.equal(w.humanAttestationPresent,false);
 assert.equal(receipt.m3.reviewerVerdict,"unreviewed");
 assert.equal(receipt.m3.reviewerName,null);
 assert.equal(receipt.m3.reviewedAt,null);
 assert.equal(receipt.publicationAuthorized,false);
 assert.equal(getAllProjectMilestones().length,1);
});

test("six actual PDF byte hashes from user-supplied archive are not certified agency source signatures",()=>{
 const rel=receipt.release,members=receipt.archiveMembers;
 assert.equal(rel.number,"26-PIR-1405");
 assert.equal(rel.readingRoomPublishedOn,"2026-06-26");
 assert.equal(rel.archiveName,"26-PIR-1405.zip");
 assert.equal(rel.bundleSha256,"b52e8a48848dd16fd4e906fd45dc8fc53ddfba65ce9c45353e2329fd9aca895f");
 assert.equal(rel.artifactOrigin,"user_uploaded_copy_of_public_reading_room_release");
 assert.equal(rel.originalDirectPortalBytesIndependentlyDownloaded,false);
 assert.equal(rel.officialReceiptOrDigitalSignatureChecked,false);
 assert.equal(rel.localSha256Verified,true);
 assert.equal(rel.archiveTotalDocuments,6);
 assert.equal(rel.archiveTotalPdfPages,555);
 assert.equal(members.length,6);
 assert.equal(members.reduce((n,d)=>n+d.pages,0),555);
 assert.equal(new Set(members.map(d=>d.name)).size,6);
 assert.ok(members.every(d=>/^[0-9a-f]{64}$/.test(d.sha256)));
 assert.ok(members.every(d=>d.bytes>0 && d.pages>0));
 assert.equal(members.find(x=>x.name==="2973-05_2025_09_03_APP.pdf")?.sha256,
   "e4e19d689b77517def8e7d230e1bef1eb1872692114e611bc7fece5e5bcc5a8a");
 assert.equal(members.find(x=>x.name==="2973-05.pdf")?.sha256,
   "372ca4d6fbf9f19efe662d9da27634a2aac7af7b2f31fd8dc5a2bd59aad534af");
 assert.equal(members.find(x=>x.name==="2973-05_DD.pdf")?.pages,76);
 assert.equal(members.find(x=>x.name==="2973-05_PD.pdf")?.pages,61);
 assert.ok(members.every(d=>d.originalDocumentOn.startsWith("2025-")));
});

test("released 2025 permit and administrative records cannot prove 2026 new furnace commissioning",()=>{
 const rel=receipt.release;
 assert.equal(rel.contains2026PostStartupTests,false);
 assert.equal(rel.contains2026RegulatorInspection,false);
 assert.equal(rel.originalPdfBytesCommittedToGit,false);
 assert.equal(rel.originalReleaseIsProofOfOperations,false);
 assert.equal(receipt.physicalMilestoneDisposition,
  "no_new_completed_source_test_or_commissioning_event_supported");
 assert.equal(receipt.decisionEvidence[0].key,"permit_initial_incomplete");
 assert.equal(receipt.decisionEvidence[0].source,"2973-04_2025_09_11_INC.pdf");
 assert.equal(receipt.decisionEvidence[0].page,1);
 assert.match(receipt.decisionEvidence[0].observed,/incomplete for missing/);
 assert.equal(receipt.archiveMembers.find(x=>x.name==="2973-05_2025_10_06_BACT.pdf")?.pages,24);
});

test("all nine applicant proposed unit IDs are correctly grouped and one-to-one paired with baghouses",()=>{
 const u=receipt.engineeringUnits;
 assert.equal(u.source,"2973-05_2025_09_03_APP.pdf");
 assert.match(u.locator,/PDF page 6/);
 assert.equal(u.configurationStatus,"proposed_at_september_2025_application_not_as_built");
 const f=u.newFurnaces;
 assert.equal(f.length,9);
 assert.equal(f.filter(x=>x.category==="reduction").length,5);
 assert.equal(f.filter(x=>x.category==="remelt").length,2);
 assert.equal(f.filter(x=>x.category==="oxidizer").length,2);
 assert.deepEqual(f.map(x=>x.id),[
  "RF-1500","RF-1600","RF-1700","RF-1800","RF-1900",
  "RFF-2000","RFF-2100","OFF-2200","OFF-2300"
 ]);
 assert.deepEqual(f.map(x=>x.baghouseId),[
  "BH-1500","BH-1600","BH-1700","BH-1800","BH-1900",
  "BH-2000","BH-2100","BH-2200","BH-2300"
 ]);
 assert.equal(new Set(f.map(x=>x.id)).size,9);
 assert.equal(new Set(f.map(x=>x.baghouseId)).size,9);
 assert.equal(deq.deqPrimaryOriginal.engineeringConfigurations.filter(x=>x.equipment.startsWith("new_")).reduce((n,x)=>n+x.units,0),9);
});

test("BACT burner shorthand is explicitly distinct from applicant source-unit identification",()=>{
 const s=receipt.engineeringUnits.alternateBurnerShorthand;
 assert.equal(s.source,"2973-05_2025_10_06_BACT.pdf");
 assert.match(s.locator,/PDF page 4/);
 assert.deepEqual(s.ids,["RF-2000","RF-2100","RF-2200","RF-2300"]);
 assert.ok(s.ids.every(x=>!receipt.engineeringUnits.newFurnaces.some(y=>y.id===x)));
 assert.match(s.interpretation,/shorthand differs from RFF\/OFF/);
 assert.equal(receipt.engineeringUnits.applicantPotentialEmissionsModel.assumedYearHours,8760);
 assert.equal(receipt.engineeringUnits.applicantPotentialEmissionsModel.actualOperatingHoursKnown,false);
 assert.equal(receipt.engineeringUnits.applicantPotentialEmissionsModel.actualThroughputEstablished,false);
});

test("regulator denies applicant's shortcut and requires initial testing of all new furnace units",()=>{
 const entry=receipt.decisionEvidence.find(x=>x.key==="initial_testing_all_new");
 assert.ok(entry);
 assert.equal(entry.source,"2973-05.pdf");
 assert.equal(entry.page,11);
 assert.equal(entry.type,"agency_response_to_applicant_comment");
 assert.match(entry.observed,/all new furnace units/);
 assert.match(entry.limit,/does not verify results/);
 assert.equal(deq.deqPrimaryOriginal.permitDoesNotContain.completedAllNewFurnacesTestReport,null);
 assert.equal(request.deqPermit.sourceTestCondition.actualTriggerOn,null);
 assert.equal(request.deqPermit.sourceTestCondition.violationEstablished,false);
});

test("public commenter allegation and applicant reply are distinct, contested claims",()=>{
 const allegation=receipt.decisionEvidence.find(x=>x.key==="public_comment_prior_operations");
 const rebuttal=receipt.decisionEvidence.find(x=>x.key==="company_response_older_units");
 assert.ok(allegation && rebuttal);
 assert.equal(allegation.type,"contested_public_comment_not_agency_factual_finding");
 assert.equal(rebuttal.type,"applicant_party_response_not_independent_site_verification");
 assert.equal(allegation.page,19);
 assert.equal(rebuttal.page,19);
 assert.match(rebuttal.observed,/decommissions two older units/);
 assert.match(rebuttal.limit,/not a verified physical retirement date/);
 assert.equal(deq.unresolvedEquipmentDiscrepancy.deqExistingUnits,6);
 assert.equal(deq.unresolvedEquipmentDiscrepancy.ledgerLegacyUnits,7);
 assert.equal(deq.unresolvedEquipmentDiscrepancy.reconciliation,
 "unresolved_different_equipment_inventory_or_definition");
});

test("submitted source-test request and draft inspection followup avoid duplicate 2025 release",()=>{
 const rr=request.requestRounds;
 assert.equal(request.requestProcess.priorPublicReleaseId,receipt.release.number);
 assert.equal(request.requestProcess.priorReleaseReviewedOn,receipt.analyzedOn);
 assert.equal(request.requestProcess.priorReleaseResult,"six_2025_permitting_documents_no_2026_test_or_inspection_report");
 assert.equal(request.requestProcess.priorReleaseAvoidDuplicateRequest,true);
 assert.equal(rr.length,2);
 for(const row of rr){
  assert.ok(["submitted_intake_perfected","draft_not_submitted"].includes(row.status));
  assert.equal(row.startOn,"2026-05-01");
  assert.equal(row.endOn,"2026-10-16");
  assert.ok(row.body.includes(receipt.release.number));
  assert.match(row.body,/avoid/);
  for(const furnace of receipt.engineeringUnits.newFurnaces){
   assert.ok(row.body.includes(furnace.id),`${row.id}: missing ${furnace.id}`);
  }
  assert.ok(row.body.includes("BH-2300"));
 }
 assert.equal(request.recordsRequestSubmitted,true);
 assert.equal(rr[0].status,"submitted_intake_perfected");
 assert.equal(rr[1].status,"draft_not_submitted");
 assert.equal(rr[0].requestReference,"private_vault_only");
 assert.equal(request.recordsObtained,false);
 assert.equal(request.publicMilestoneAuthorized,false);
 assert.equal(request.humanReviewCompleted,false);
 assert.equal(site.lastUpdated,"2026-10-17");
 assert.ok(decisions.every(x=>x.verdict==="pending"));
 assert.equal(getAllProjectMilestones().length,1);
});
