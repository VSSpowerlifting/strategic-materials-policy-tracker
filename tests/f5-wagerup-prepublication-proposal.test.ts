import test from "node:test";
import assert from "node:assert/strict";
import candidate from "../research/project-execution/release-candidates/wagerup-groundbreaking-2026-10-17.json";
import reviewQueue from "../research/project-execution/m3-2-source-review-queue.json";
import {buildM3ReviewerPackets} from "../scripts/project-execution-review-packets";
import {auditF5CasefileReadiness} from "../lib/f5-casefile-readiness";
import {validateProjectMilestones} from "../lib/project-milestones";
import {site} from "../lib/site";
import {
  getAllControlMeasures,getAllEvents,getAllFinancialCommitments,
  getAllProjectDesignations,getAllProjectMilestones,getAllProjects,getAllSources,
} from "../lib/data";

const reviewId="review-m3-2-alcoa-wagerup";
const milestoneId="mil-au-alcoa-wagerup-groundbreaking-2026-08-24";
const pid="prj-au-alcoa-sojitz-gallium";
const sourceId="src-alcoa-wagerup-groundbreaking-2026";

test("supervised release publishes exactly one source-reviewed Wagerup claim, not unsigned peers",()=>{
  const milestones=getAllProjectMilestones();
  assert.deepEqual(milestones.map(x=>x.id),[milestoneId,"mil-ee-neo-narva-commercial-production-reported-2026"]);
  assert.equal(site.lastUpdated,"2026-10-17");
  assert.equal(candidate.proposedCorpusCutoff,site.lastUpdated);
  assert.equal(candidate.publishedCorpusCutoffAtPreparation,"2026-10-09");
  assert.equal(candidate.proposedProjectMilestones.length,1);
  assert.deepEqual(milestones[0],candidate.proposedProjectMilestones[0],
    "approved public entry must match reviewed release-candidate fields exactly");
  assert.equal(milestones[0].reviewedBy,"Benjamin Yang");
  assert.equal(milestones[0].reviewedAt,"2026-10-17");
  assert.equal(milestones[0].kind,"groundbreaking_reported");
  assert.equal(milestones[0].scope,"named_facility");
  assert.equal(milestones[0].claimMode,"occurred");
  assert.equal(milestones[0].occurredOn,"2026-08-24");
  assert.equal(milestones[0].targetOn,null);
  assert.equal(milestones[0].projectId,pid);
  assert.equal(milestones[0].sourceId,sourceId);
  assert.deepEqual(milestones.filter(x=>x.projectId!=="prj-au-alcoa-sojitz-gallium").map(x=>x.id),["mil-ee-neo-narva-commercial-production-reported-2026"]);
  assert.ok(milestones[0].note?.includes("not independently observed sustained works"));
});

test("Wagerup public source citation and exact M3 claim must not drift beyond approved grounding",()=>{
  const claim=reviewQueue.find(x=>x.id===reviewId);assert.ok(claim);
  assert.equal(claim.kindProposal,"groundbreaking_reported");
  assert.equal(claim.gate,"human_source_review");
  assert.equal(claim.reviewVerdict,"unreviewed",
    "tracked source-review queue stays unsigned rather than publicly exposing private adjudication");
  const mil=getAllProjectMilestones()[0];
  for(const field of ["projectId","sourceId","claimMode","occurredOn","targetOn","statementOriginal",
      "statementEn","statementEnSource","locator","scopeAsStated","editorialCaution"] as const){
    if(field==="editorialCaution")assert.equal(mil.note,claim.editorialCaution);
    else assert.equal(mil[field],claim[field],field);
  }
  const source=getAllSources().find(x=>x.id===sourceId);assert.ok(source);
  assert.equal(source.publisher,"Alcoa Corporation");
  assert.equal(source.datePublished,"2026-08-24");
  assert.equal(source.dateAccessed,"2026-10-02");
  assert.match(source.url,/news\.alcoa\.com/);
  assert.ok(!("amount" in mil),"financing is a separate source/claim lane");
});

test("historical original-source fingerprint pins ZERO-milestone prepublication input, not self-referential published count",()=>{
  const historical=buildM3ReviewerPackets(reviewQueue,{
    projects:getAllProjects(),sources:getAllSources(),
    commitments:getAllFinancialCommitments(),
    corpusCutoff:candidate.proposedCorpusCutoff,
    publicMilestoneCount:0,
  },reviewId).worksheets[0];
  assert.equal(candidate.reviewInputMetadataSha256,historical.reviewInputDigestSha256);
  assert.match(candidate.reviewInputMetadataSha256,/^[0-9a-f]{64}$/);
  assert.equal(historical.proposedObservation.kind,"groundbreaking_reported");
  assert.equal(historical.humanAttestationPresent,false,
    "metadata fingerprint is not signature, editorial adjudication came from user's local human review");
  assert.equal(candidate.reviewReceiptProvenance.includes("LOCAL"),true);
  assert.equal(candidate.reviewReceiptProvenance.includes("NOT an independently accessible"),true);
});

test("one approved native milestone passes exact cutoff validation but failed at old 2026-10-09 cutoff",()=>{
  const milestone=getAllProjectMilestones()[0];
  const refs={projects:getAllProjects(),sources:getAllSources()};
  assert.deepEqual(validateProjectMilestones([milestone],{...refs,corpusDate:site.lastUpdated}),[]);
  assert.match(validateProjectMilestones([milestone],{...refs,corpusDate:"2026-10-09"}).join(" | "),
    /reviewedAt is after corpus cutoff/);
  assert.deepEqual(validateProjectMilestones([], {...refs,corpusDate:site.lastUpdated}),[],
    "empty records remain structurally valid in isolated prepublication simulations");
});

test("Wagerup enters only MANUAL casefile QA, not automatic public pathway release or finance causality",()=>{
  const corpus={
    events:getAllEvents(),finances:getAllFinancialCommitments(),
    controls:getAllControlMeasures(),designations:getAllProjectDesignations(),
    projects:getAllProjects(),milestones:getAllProjectMilestones(),sources:getAllSources(),
  };
  const frozen=JSON.stringify(corpus);
  const actual=auditF5CasefileReadiness(corpus,site.lastUpdated);
  assert.deepEqual(actual.pilots.filter(x=>x.eligibleForManualQa).map(x=>x.projectId).sort(),[pid,"prj-ee-neo-rare-earth-magnet-project"].sort());
  assert.equal(actual.pilots.find(x=>x.projectId===pid)?.registeredOccurredMilestones,1);
  assert.equal(actual.allPilotsEligibleForManualQa,false);
  assert.equal(actual.publicReleaseAuthorized,false);
  assert.equal(actual.autonomousMilestoneApprovalAuthorized,false);
  assert.equal(actual.inferredCausalityAuthorized,false);
  assert.equal(actual.historicalFinancialTotalsAuthorized,false);
  assert.equal(JSON.stringify(corpus),frozen);
});
