import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import example from "../research/project-execution/m3-2-adjudications.example.json";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";
import { site } from "@/lib/site";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { rehearseF5Release } from "../scripts/f5-release-rehearsal";
import type { SourceReviewDecision } from "../scripts/adjudicate-project-execution";

const proposed = "2026-10-17";
const corpus = () => ({
  events: getAllEvents(), finances: getAllFinancialCommitments(),
  controls: getAllControlMeasures(), projects: getAllProjects(),
  designations: getAllProjectDesignations(), milestones: getAllProjectMilestones(),
  sources: getAllSources(),
});
const worksheet = (cutoff:string,id:string) => buildM3ReviewerPackets(queue, {
  projects: getAllProjects(),
  sources: getAllSources(),
  commitments: getAllFinancialCommitments(),
  corpusCutoff: cutoff,
  publicMilestoneCount: getAllProjectMilestones().length,
}, id).worksheets[0];

function syntheticDecision(id:string, cutoff:string=proposed) {
  // Public example intentionally infers null-only fields; simulated approvals
  // exist in memory exclusively and use the real M3 decision shape.
  const decisions = structuredClone(example) as unknown as SourceReviewDecision[];
  const x=decisions.find(d=>d.id===id);
  assert.ok(x);
  x.verdict="approved";
  x.reviewedBy="SYNTHETIC FIXTURE — NEVER AN ACTUAL SOURCE REVIEW";
  x.reviewedAt=cutoff;
  x.rationale="Test-only original-source acceptance, never a true review or a publication authorization.";
  x.proposedMilestoneId="mil-test-only-"+id.replace("review-m3-2-","");
  x.reviewInputDigestSha256=worksheet(cutoff,id).reviewInputDigestSha256;
  for(const key of Object.keys(x.checks) as (keyof typeof x.checks)[])
    x.checks[key]=true;
  return decisions;
}

test("real published corpus and unsigned canonical examples remain blocked from casefile release",()=>{
  const before=JSON.stringify(corpus());
  const report=rehearseF5Release(queue,example,corpus(),site.lastUpdated,proposed);
  assert.equal(report.publicationAuthorized,false);
  assert.equal(report.automaticApprovalAuthorized,false);
  assert.equal(report.completeOriginalSourceVerificationProven,false);
  assert.equal(report.stagingAllowed,true,"pending verdicts are valid but cannot promote evidence");
  assert.deepEqual(report.proposedMilestoneIds,[]);
  assert.deepEqual(report.after.stagedMilestoneIds,report.before.publishedMilestoneIds);
  assert.ok(!report.after.structurallyEligiblePilots.includes("prj-au-alcoa-sojitz-gallium"));
  assert.equal(JSON.stringify(corpus()),before,"never mutate public seed records");
});

test("hypothetical human-approved Wagerup construction can advance ONLY structural manual-QA candidacy",()=>{
  const decisions=syntheticDecision("review-m3-2-alcoa-wagerup");
  const before=JSON.stringify(corpus());
  const r=rehearseF5Release(queue,decisions,corpus(),site.lastUpdated,proposed);
  assert.deepEqual(r.gateErrors,[]);
  assert.deepEqual(r.gateBlockers,[]);
  assert.equal(r.stagingAllowed,true);
  assert.deepEqual(r.proposedMilestoneIds,["mil-test-only-alcoa-wagerup"]);
  assert.ok(r.after.structurallyEligiblePilots.includes("prj-au-alcoa-sojitz-gallium"));
  assert.equal(r.publicationAuthorized,false);
  assert.equal(r.candidateSeedWritesAuthorized,false);
  assert.equal(r.completeOriginalSourceVerificationProven,false);
  assert.equal(JSON.stringify(corpus()),before,"the rehearsal cannot touch data/seed");
});

test("metadata digest signed against current cutoff is stale under the newly proposed cutoff",()=>{
  const decisions=syntheticDecision("review-m3-2-alcoa-wagerup");
  decisions[0].reviewInputDigestSha256=worksheet(site.lastUpdated,"review-m3-2-alcoa-wagerup").reviewInputDigestSha256;
  const r=rehearseF5Release(queue,decisions,corpus(),site.lastUpdated,proposed);
  assert.equal(r.stagingAllowed,false);
  assert.ok(r.gateErrors.some(x=>/fingerprint differs/.test(x)));
  assert.deepEqual(r.proposedMilestoneIds,[]);
  assert.deepEqual(r.after.stagedMilestoneIds,r.before.publishedMilestoneIds);
});

test("a taxonomy-blocked M3 review stays blocked even with synthetic all-true human checkboxes",()=>{
  const decisions=syntheticDecision("review-m3-2-stibnite-burntlog");
  const r=rehearseF5Release(queue,decisions,corpus(),site.lastUpdated,proposed);
  assert.equal(r.stagingAllowed,false);
  assert.ok(r.gateBlockers.some(x=>x.id==="review-m3-2-stibnite-burntlog" &&
    /taxonomy/i.test(x.reason)));
  assert.deepEqual(r.proposedMilestoneIds,[]);
});

test("invalid cutoff and backdating fail instead of auto-advancing site.lastUpdated",()=>{
  assert.throws(()=>rehearseF5Release(queue,example,corpus(),site.lastUpdated,"2026-02-30"),/real ISO/);
  assert.throws(()=>rehearseF5Release(queue,example,corpus(),site.lastUpdated,"2026-10-08"),/backdate/);
});

test("a malformed decision aborts all hypothetical staging, even when another row is approved",()=>{
  const decisions=syntheticDecision("review-m3-2-alcoa-wagerup");
  decisions[1].id="review-m3-2-not-real";
  const r=rehearseF5Release(queue,decisions,corpus(),site.lastUpdated,proposed);
  assert.equal(r.stagingAllowed,false);
  assert.ok(r.gateErrors.length>0);
  assert.deepEqual(r.proposedMilestoneIds,[]);
});

test("all new release tools remain scripts-only and contain no public seed write, network or approval switch",()=>{
  const files=["scripts/f5-release-rehearsal.ts","scripts/print-f5-release-rehearsal.ts",
    "scripts/print-f5-prospective-worksheets.ts"];
  for(const path of files){
    const s=readFileSync(path,"utf8");
    assert.doesNotMatch(s,/from ["'](?:node:fs\/promises|fs\/promises)["']/);
    assert.doesNotMatch(s,/writeFileSync\s*\(|renameSync\s*\(|mkdirSync\s*\(|fetch\s*\(/);
    assert.doesNotMatch(s,/--publish|--approve|--promote/);
  }
});
