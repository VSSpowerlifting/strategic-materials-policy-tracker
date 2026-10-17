import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import template from "../research/project-execution/m3-2-adjudications.example.json";
import { getAllFinancialCommitments,getAllProjectMilestones,getAllProjects,getAllSources } from "../lib/data";
import { site } from "../lib/site";
import {
  parseGuidedReviewArgs,privateReviewPathFor,prepareGuidedReview,buildGuidedPrivateDecisions,
  type GuidedReviewRefs,type HumanReviewInput,
} from "../scripts/f5-guided-private-review";
import type {PendingProjectExecutionRow,SourceReviewDecision} from "../scripts/adjudicate-project-execution";

const narva="review-m3-2-neo-narva-magnets";
const records=queue as PendingProjectExecutionRow[];
const refs=():GuidedReviewRefs=>({
  projects:getAllProjects(),sources:getAllSources(),commitments:getAllFinancialCommitments(),
  currentPublicMilestones:getAllProjectMilestones(),currentPublicCutoff:site.lastUpdated,
});
const choices=(over:Partial<HumanReviewInput>={}):HumanReviewInput=>({
  verdict:"approved",reviewedBy:"SYNTHETIC REGRESSION TEST (not a real reviewer)",
  reviewedAt:"2026-10-17",
  rationale:"Synthetic test only: the original issuer reports an initial commercial production phase; actual start day was not independently established.",
  checks:{fullSourceRead:true,quotedPassageMatches:true,scopeIsExplicit:true,eventAndEvidenceDatesSeparated:true,noFinancingOrOperationsInference:true},
  proposedMilestoneId:"mil-ee-neo-narva-initial-commercial-output-reported",
  manuallyCopiedDigest:prepareGuidedReview(records,refs(),narva,"2026-10-17").worksheet.reviewInputDigestSha256,
  ...over,
});
const review=(over:Partial<HumanReviewInput>={},t=template as unknown as SourceReviewDecision[],r=refs(),cutoff="2026-10-17",today="2026-10-17")=>
  buildGuidedPrivateDecisions(records,t,r,narva,cutoff,today,choices(over));

test("review session always uses one canonical gitignored per-candidate path",()=>{
  assert.equal(privateReviewPathFor(narva),".project-execution-review/review-m3-2-neo-narva-magnets.adjudications.json");
  assert.throws(()=>privateReviewPathFor("../../data/seed/project-milestones.json"),/Invalid canonical review ID/);
  assert.throws(()=>privateReviewPathFor("review-m3-2-nearby/secret"),/Invalid canonical review ID/);
  assert.deepEqual(parseGuidedReviewArgs(["--id",narva,"--proposed-cutoff","2026-10-17"]),{id:narva,proposedCutoff:"2026-10-17"});
  assert.deepEqual(parseGuidedReviewArgs(["--proposed-cutoff","2026-10-17","--id",narva]),{id:narva,proposedCutoff:"2026-10-17"});
  assert.throws(()=>parseGuidedReviewArgs(["--id",narva]),/explicit real proposed cutoff/);
  assert.throws(()=>parseGuidedReviewArgs(["--id",narva,"--proposed-cutoff","2026-02-30"]),/explicit real proposed cutoff/);
  assert.throws(()=>parseGuidedReviewArgs(["--id",narva,"--id",narva,"--proposed-cutoff","2026-10-17"]),/Usage:/);
});

test("one already published Wagerup is unavailable for accidental second review",()=>{
  assert.deepEqual(getAllProjectMilestones().map(x=>x.id),["mil-au-alcoa-wagerup-groundbreaking-2026-08-24"]);
  assert.throws(()=>prepareGuidedReview(records,refs(),"review-m3-2-alcoa-wagerup","2026-10-17"),/Already published/);
  assert.equal(site.lastUpdated,"2026-10-17");
});

test("unresolved taxonomy cannot be approved by a guided checklist",()=>{
  assert.throws(()=>prepareGuidedReview(records,refs(),"review-m3-2-inl-demonstration","2026-10-17"),/TAXONOMY BLOCKED/);
  assert.throws(()=>prepareGuidedReview(records,refs(),"review-m3-2-stibnite-burntlog","2026-10-17"),/TAXONOMY BLOCKED/);
  assert.throws(()=>prepareGuidedReview(records,refs(),"review-m3-2-no-such-case","2026-10-17"),/Unknown source-review ID/);
  assert.throws(()=>prepareGuidedReview(records,refs(),narva,"2026-10-16"),/CURRENT public corpus revision/);
  assert.throws(()=>prepareGuidedReview(records,refs(),narva,"2026-10-32"),/CURRENT public corpus revision/);
});

test("human-entered Narva review yields one PRIVATE proposal without a manufactured production start date",()=>{
  const before=JSON.stringify(getAllProjectMilestones());
  const decisions=review();
  assert.equal(decisions.length,7);
  assert.equal(decisions.filter(x=>x.verdict==="approved").length,1);
  assert.equal(decisions.find(x=>x.id===narva)?.verdict,"approved");
  assert.equal(decisions[0].verdict,"pending","Wagerup original historical receipt is not copied into a future session");
  assert.ok(decisions.filter(x=>x.id!==narva).every(x=>x.verdict==="pending"));
  assert.equal(decisions.find(x=>x.id===narva)?.proposedMilestoneId,"mil-ee-neo-narva-initial-commercial-output-reported");
  assert.equal(JSON.stringify(getAllProjectMilestones()),before,"pure review must never mutate published seed");
  assert.equal(records.find(x=>x.id===narva)?.occurredOn,null,"unknown true first production day remains unknown");
});

test("rejected / needs_more_evidence are real recorded decisions, NOT source approvals",()=>{
  for(const verdict of ["rejected","needs_more_evidence"] as const){
    const result=review({verdict,proposedMilestoneId:null,checks:{fullSourceRead:true,quotedPassageMatches:false,scopeIsExplicit:false,eventAndEvidenceDatesSeparated:true,noFinancingOrOperationsInference:true}});
    assert.equal(result.find(x=>x.id===narva)?.verdict,verdict);
    assert.equal(result.find(x=>x.id===narva)?.proposedMilestoneId,null);
    assert.equal(result.filter(x=>x.verdict==="approved").length,0);
  }
});

test("no checkbox, reviewer identity, verdict, rationale or attestation can be auto-assumed",()=>{
  assert.throws(()=>review({checks:{...choices().checks,fullSourceRead:false}}),/all five/);
  assert.throws(()=>review({reviewedBy:"  "}),/type their actual full name/);
  assert.throws(()=>review({rationale:""}),/write a nonempty/);
  assert.throws(()=>review({verdict:"pending" as HumanReviewInput["verdict"]}),/explicitly choose/);
  assert.throws(()=>review({manuallyCopiedDigest:"f".repeat(64)}),/Manually entered input fingerprint differs/);
  assert.throws(()=>review({proposedMilestoneId:"mil-au-alcoa-wagerup-groundbreaking-2026-08-24"}),/already exists/);
});

test("never backdate a source review to fit an already published cutoff",()=>{
  assert.throws(()=>review({reviewedAt:"2026-10-18"}),/future/);
  assert.throws(()=>review({reviewedAt:"2026-10-18"},template as unknown as SourceReviewDecision[],refs(),"2026-10-18","2026-10-18"),/fingerprint differs/);
  assert.throws(()=>review({reviewedAt:"2026-10-18"},template as unknown as SourceReviewDecision[],refs(),"2026-10-17","2026-10-18"),/exceeds proposed cutoff/);
});

test("public corpus/source/finance or worksheet changes invalidate previously copied metadata fingerprint",()=>{
  const old=choices().manuallyCopiedDigest;
  const changed:GuidedReviewRefs={...refs(),currentPublicMilestones:[]};
  assert.notEqual(prepareGuidedReview(records,changed,narva,"2026-10-17").worksheet.reviewInputDigestSha256,old);
  assert.throws(()=>review({manuallyCopiedDigest:old},template as unknown as SourceReviewDecision[],changed),/fingerprint differs/);
  const modified=structuredClone(records);
  modified.find(x=>x.id===narva)!.statementOriginal="Synthetic altered issuer statement";
  assert.notEqual(prepareGuidedReview(modified,refs(),narva,"2026-10-17").worksheet.reviewInputDigestSha256,old);
});

test("never overwrite or launder earlier original human decision into another review session",()=>{
  const historical=structuredClone(template) as unknown as SourceReviewDecision[];
  historical[0].verdict="approved";
  historical[0].reviewedBy="HISTORICAL PRIVATE SIGNOFF FIXTURE";
  assert.throws(()=>review({},historical),/canonical all-pending template/);
});

test("CI and noninteractive pipes cannot create fake source-review decisions",()=>{
  const id="review-m3-2-neo-narva-magnets";
  const run=spawnSync(process.execPath,["--import","tsx","scripts/run-f5-guided-private-review.ts","--id",id,"--proposed-cutoff","2026-10-17"],{
    encoding:"utf8",input:"approved\nSYNTHETIC\n2026-10-17\ny\ny\ny\ny\ny\nshortcut\n",
  });
  assert.notEqual(run.status,0);
  assert.match(run.stderr,/interactive human TTY/);
  assert.doesNotMatch(run.stdout,/Private human decision saved/);
});
