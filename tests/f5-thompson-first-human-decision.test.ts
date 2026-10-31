import test from "node:test";
import assert from "node:assert/strict";
import brief from "../research/f5/thompson-first-human-decision-brief.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import example from "../research/project-execution/m3-2-adjudications.example.json";
import { getAllSources,getAllProjects,getAllFinancialCommitments,getAllProjectMilestones } from "../lib/data";
import { site } from "../lib/site";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";

const m3Id = "review-m3-2-thompson-falls-q2-expansion";
const m3SourceId = "src-usac-2026-q2-10q";
const projectId = "prj-us-usac-thompson-falls-expansion";
const sheet = () => buildM3ReviewerPackets(queue,{
  projects:getAllProjects(), sources:getAllSources(),
  commitments:getAllFinancialCommitments(),
  corpusCutoff:site.lastUpdated,publicMilestoneCount:getAllProjectMilestones().length,
},m3Id).worksheets[0];

test("first Thompson milestone brief remains one canonical, unsigned M3 construction-progress proposal",()=>{
  const w=sheet();
  assert.ok(w);
  assert.equal(brief.schemaVersion,"f5-5-thompson-human-decision-brief-v1");
  assert.equal(brief.status,"unsigned_original_source_research_for_existing_m3");
  assert.equal(brief.existingM3ReviewId,m3Id);
  assert.equal(brief.existingProjectId,projectId);
  assert.equal(brief.existingSourceId,m3SourceId);
  assert.equal(brief.candidateKind,w.proposedObservation.kind);
  assert.equal(brief.candidateScope,w.proposedObservation.scope);
  assert.equal(brief.claimMode,w.proposedObservation.claimMode);
  assert.equal(brief.occurredOn,w.proposedObservation.occurredOn);
  assert.equal(brief.targetOn,w.proposedObservation.targetOn);
  assert.equal(w.status,"unsigned_source_review");
  assert.equal(w.humanAttestationPresent,false);
  assert.equal(queue.filter(x=>x.id===m3Id).length,1);
  assert.equal(brief.publicationAuthorized,false);
});

test("no fake human review, source-body proof, digest, milestone ID or public milestone seed",()=>{
  assert.equal(brief.humanOriginalDocumentAttested,false);
  assert.equal(brief.sourceBodyArchived,false);
  assert.equal(brief.humanReviewer,null);
  assert.equal(brief.humanReviewDate,null);
  assert.equal(brief.reviewInputDigestSha256,null);
  assert.equal(brief.proposedMilestoneId,null);
  assert.equal(brief.publicationAuthorized,false);
  assert.match(sheet().reviewInputDigestSha256,/^[0-9a-f]{64}$/);
  assert.equal(sheet().digestMeaning,"registry_metadata_fingerprint_not_archived_document_hash");
  assert.equal(getAllProjectMilestones().length,2);
  assert.ok(example.every(x=>x.verdict==="pending" && x.reviewedBy===null &&
    x.reviewedAt===null && x.reviewInputDigestSha256===null));
  assert.equal(site.lastUpdated,"2026-10-17",
    "a future reviewer cannot backdate source inspection to existing curated cutoff");
});

test("original SEC Note 9/16 anchors have correct period, filing and registry clocks",()=>{
  const s=getAllSources().filter(x=>x.id===m3SourceId);
  assert.equal(s.length,1);
  assert.equal(s[0].url,brief.primaryOriginal.url);
  assert.equal(s[0].datePublished,brief.primaryOriginal.filingPublishedOn);
  assert.equal(s[0].datePublished,"2026-08-11");
  assert.equal(s[0].dateAccessed,"2026-10-02");
  assert.equal(brief.primaryOriginal.accountingPeriodEndsOn,"2026-06-30");
  assert.equal(brief.primaryOriginal.filingType,"Form 10-Q");
  assert.match(brief.primaryOriginal.claimLocator,/Note 16/);
  assert.match(brief.primaryOriginal.claimLocator,/Note 9/);
  assert.equal(brief.primaryOriginal.evidenceSourceId,m3SourceId);
  assert.equal(brief.primaryOriginal.issuer,"United States Antimony Corporation");
  assert.match(brief.candidateStatement,/during the second quarter/);
  assert.doesNotMatch(brief.candidateStatement,/fully operational|commissioned all nine|March 25/);
});

test("Thompson scope is an individual expansion, not an authorized whole-project status",()=>{
  const projects=getAllProjects().filter(x=>x.id===projectId);
  assert.equal(projects.length,1);
  assert.equal(brief.candidateScope,"named_facility");
  assert.equal(brief.candidateKind,"construction_progress_reported");
  assert.equal(brief.occurredOn,null);
  const original=queue.find(x=>x.id===m3Id);
  assert.ok(original);
  assert.equal(original.kindProposal,brief.candidateKind);
  assert.equal(original.scopeProposal,brief.candidateScope);
  assert.equal(original.sourceId,brief.existingSourceId);
  assert.equal(original.reviewVerdict,"unreviewed");
  assert.equal(original.relatedFinanceIds.length,0);
  assert.equal(original.gate,"human_source_review");
  assert.match(brief.candidateNote,/not a dated completion/);
  assert.match(brief.candidateNote,/not.*full nine-furnace operation/);
  assert.ok(brief.candidateNote.length<=700,"draft note must fit existing M3 milestone note limit");
});

test("six different industrial and financial denominators cannot be merged into an invented award",()=>{
  const facts=brief.primaryOriginal.accountingFacts;
  assert.equal(facts.length,5);
  const key=(s:string)=>facts.find(x=>x.key===s);
  assert.equal(key("assets_placed_in_service")?.valueUsdApprox,"4100000");
  assert.equal(key("gross_construction_in_progress")?.valueUsdApprox,"29000000");
  assert.equal(key("estimated_total_corporate_expansion_capex")?.valueUsdApprox,"39000000");
  assert.equal(key("q2_incurred_company_expansion_costs")?.valueUsdApprox,"33000000");
  assert.equal(key("substantial_construction_progress")?.asOf,"2026-Q2");
  const fs=getAllFinancialCommitments();
  const original=(id:string)=>fs.filter(x=>x.id===id);
  const parent=original("fin-us-dow-usac-antimony-2026");
  const montana=original("fin-us-dow-usac-antimony-2026-thompson-falls");
  const alaska=original("fin-us-dow-usac-antimony-2026-alaska");
  assert.equal(parent.length,1);
  assert.equal(montana.length,1);
  assert.equal(alaska.length,1);
  assert.equal(parent[0].amount?.value,"27000000");
  assert.equal(montana[0].amount?.value,"20000000");
  assert.equal(alaska[0].amount?.value,"7000000");
  assert.equal(montana[0].projectId,projectId);
  assert.equal(parent[0].projectId,null);
  assert.equal(parent[0].financialStatusHistory.at(-1)?.status,"partially_disbursed");
  assert.equal(parent[0].financialStatusHistory.at(-1)?.date,null);
  assert.equal(montana[0].implementationStatusHistory.length,0);
  assert.equal(alaska[0].implementationStatusHistory.length,0);
  assert.match(brief.candidateNote,/distinct bases/);
});

test("five human review decisions are concrete and not simulated checklist attestations",()=>{
  assert.equal(brief.requiredReviewerDecisions.length,5);
  assert.ok(brief.requiredReviewerDecisions.every(x=>x.length>95));
  assert.match(brief.requiredReviewerDecisions[0],/full SEC original Notes 9 and 16/);
  assert.match(brief.requiredReviewerDecisions[2],/DIBC-approved grant milestones/);
  assert.match(brief.requiredReviewerDecisions[4],/gitignored adjudications/);
  assert.match(brief.decisionRecommendation,/pending_real_human_m3_review/);
  assert.equal(brief.unresolved.length,6);
  assert.ok(brief.unresolved.includes("human_source_reviewer_attestation"));
  assert.ok(brief.unresolved.includes("curated_corpus_cutoff_advance_and_publication_approval"));
});

test("source-role clock and evidence independence stay distinct from SEC canonical citation",()=>{
  const leads=brief.disambiguatingOriginals;
  assert.equal(leads.length,4);
  assert.deepEqual(leads.map(x=>x.key),[
    "financier_milestone_acceptance","q2_management_outlook",
    "independent_seven_of_nine_field_reporting","earlier_construction_started_month",
  ]);
  assert.equal(leads[0].reportedPeriod,"2026-03-25");
  assert.equal(leads[0].publishedOn,"2026-08-11");
  assert.match(leads[0].finding,/not three physical plant commissioning milestones/);
  assert.equal(leads[1].reportedPeriod,"2026-Q3_target");
  assert.match(leads[1].finding,/outlook rather than an achieved/);
  assert.equal(leads[2].publishedOn,"2026-08-27");
  assert.match(leads[2].finding,/not concurrently/);
  assert.equal(leads[3].reportedPeriod,"2025-05");
  assert.equal(leads[3].publishedOn,"2025-10-02");
  assert.ok(leads.every(x=>x.url.startsWith("https://")));
  assert.ok(leads.every(x=>x.url!==brief.primaryOriginal.url));
  assert.ok(leads.every(x=>x.caution.length>=70));
  assert.ok(getAllSources().every(s=>s.url!==leads[2].url),
    "independent newspaper evidence remains an unregistered lead, not a silently registered M3 original");
});

test("candidate cannot silently become a duplicate public industrial milestone",()=>{
  assert.equal(brief.proposedMilestoneId,null);
  assert.equal(getAllProjectMilestones().length,2);
  assert.equal(queue.filter(x=>x.projectId===projectId && x.sourceId===m3SourceId).length,1);
  assert.equal(brief.humanReviewer,null);
  const clone=structuredClone(brief);
  assert.deepEqual(clone,brief);
  assert.equal(brief.reviewInputDigestSha256,null,
    "candidate sidecar cannot represent the current M3 metadata fingerprint as a human signoff");
});
