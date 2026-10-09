import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {
  DOE_SHADOW_SOURCE_ID, readDoeShadowState, previewDoeShadowTransition,
  type DoeCoverageGate, type DoePublisherObservation,
} from "@/scripts/doe-shadow-state-contract";

const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const url=(i:number)=>"https://www.energy.gov/cmei/articles/verified-doe-release-"+i;
const id=(i:number)=>sha(DOE_SHADOW_SOURCE_ID+"\n"+url(i));
const semantic=(i:number)=>sha("v1 semantic body "+i);
const OBSERVED="2026-10-10T16:00:00Z";
const rows: DoePublisherObservation[]=Array.from({length:20},(_,i)=>({
  officialUrl:url(i),
  title:"Original DOE publication about project example "+i,
  publicationDate:i<10?"2026-10-08":"2026-10-07",
  attributionAsListed:i===5?"Energy.gov":"Office of Critical Minerals and Energy Innovation",
  issuingOffice:i===5?null:"Office of Critical Minerals and Energy Innovation",
  approvedSemanticFingerprint:semantic(i),
  originalHeaderVerified:true,
}));
const state=()=>{
 const saved=Object.fromEntries(Array.from({length:18},(_,i)=>i+2).map(i=>[id(i),semantic(i)]));
 return {
  version:1,sourceId:DOE_SHADOW_SOURCE_ID,semanticVersion:"doe-semantic-v1",
  seen:saved,lastLatestId:id(2),lastSuccessfulAt:"2026-10-09T12:00:00Z",
 };
};
const gate=():DoeCoverageGate=>({
  observedAt:OBSERVED,fullBodyBoundaryCertified:true,sourceUseApproved:true,
  sourceWindowComplete:true,approvedSemanticVersion:"doe-semantic-v1",
  publisherPagesVerified:2,originalArticleHeadersVerified:true,
  priorStateRecoveredFromIndependentArtifact:true,
});
test("never silently bootstraps, resets or substitutes a different source state",()=>{
 assert.throws(()=>readDoeShadowState(null),/restore independently reviewed artifact/);
 assert.throws(()=>readDoeShadowState({}),/restore independently reviewed artifact/);
 assert.throws(()=>readDoeShadowState({...state(),sourceId:"watch-us-exim-news-shadow"}),/restore independently reviewed artifact/);
 assert.throws(()=>readDoeShadowState({...state(),version:2}),/restore independently reviewed artifact/);
 assert.throws(()=>readDoeShadowState({...state(),semanticVersion:"doe-body-candidate-v1"}),/restore independently reviewed artifact/);
 assert.throws(()=>readDoeShadowState({...state(),lastLatestId:sha("absent")}),/missing last-latest anchor/);
 assert.throws(()=>readDoeShadowState({...state(),seen:{}}),/invalid identity map/);
 assert.throws(()=>readDoeShadowState({...state(),unexpectedSourceMetadata:"do not trust"}),/schema mismatch/);
});
test("a fresh verified window makes a preview only, source-review-only observations",()=>{
 const before=state();const unchanged=JSON.stringify(before);
 const preview=previewDoeShadowTransition(before,rows,gate());
 assert.equal(preview.noStateWritten,true);
 assert.equal(preview.status,"would_advance");
 assert.equal(preview.possibleWindowGap,false);
 assert.equal(preview.reviewOnly.length,2);
 assert.equal(preview.reviewOnly.filter(x=>x.change==="new").length,2);
 assert.deepEqual(preview.reviewOnly.map(x=>x.officialUrl),[url(0),url(1)]);
 assert.equal(preview.reviewOnly.filter(x=>x.change==="revised").length,0);
 assert.equal(preview.proposedState.lastLatestId,id(0));
 assert.equal(preview.proposedState.lastSuccessfulAt,OBSERVED);
 assert.equal(Object.keys(preview.proposedState.seen).length,20);
 assert.ok(preview.reviewOnly.every(x=>x.issuingOffice==="Office of Critical Minerals and Energy Innovation"));
 assert.ok(preview.reviewOnly.every(x=>x.reviewStatus==="unreviewed"&&x.cannotPromoteFinancialClaim===true));
 assert.equal(JSON.stringify(before),unchanged,"preview cannot mutate persisted previous memory");
 assert.equal("fundingAmount" in preview.reviewOnly[0],false);
 assert.equal("approvedPolicyEvent" in preview.reviewOnly[0],false);
});
test("verified replay is idempotent and a single body-semantic change flags one review-only revision",()=>{
 const a=previewDoeShadowTransition(state(),rows,gate());
 const later={...gate(),observedAt:"2026-10-11T11:00:00Z"};
 const b=previewDoeShadowTransition(a.proposedState,rows,later);
 assert.equal(b.reviewOnly.length,0);
 const changed=rows.map(x=>({...x}));
 changed[1].approvedSemanticFingerprint=sha("updated project description");
 const c=previewDoeShadowTransition(a.proposedState,changed,later);
 assert.equal(c.reviewOnly.length,1);
 assert.equal(c.reviewOnly[0].change,"revised");
 assert.equal(c.reviewOnly[0].officialUrl,url(1));
});
test("a previously unseen historical article is a gap, not a new publication",()=>{
 const prior=state();
 delete prior.seen[id(12)];
 const before=JSON.stringify(prior);
 const r=previewDoeShadowTransition(prior,rows,gate());
 assert.equal(r.status,"coverage_gap");
 assert.equal(r.reviewOnly.length,0);
 assert.equal(r.possibleWindowGap,true);
 assert.deepEqual(r.proposedState,readDoeShadowState(prior));
 assert.equal(JSON.stringify(prior),before);
});
test("sitewide attribution remains null even on a legitimate prior-body revision",()=>{
 const changed=rows.map(x=>({...x}));
 changed[5].approvedSemanticFingerprint=sha("legitimately amended Energy.gov article");
 const r=previewDoeShadowTransition(state(),changed,gate());
 assert.equal(r.status,"would_advance");
 assert.equal(r.reviewOnly.find(x=>x.officialUrl===url(5))?.change,"revised");
 assert.equal(r.reviewOnly.find(x=>x.officialUrl===url(5))?.attributionAsListed,"Energy.gov");
 assert.equal(r.reviewOnly.find(x=>x.officialUrl===url(5))?.issuingOffice,null);
});
test("equal UTC instants with different fractional formatting cannot advance state",()=>{
 const prior={...state(),lastSuccessfulAt:"2026-10-09T12:00:00.000Z"};
 const equal={...gate(),observedAt:"2026-10-09T12:00:00Z"};
 assert.throws(()=>previewDoeShadowTransition(prior,rows,equal),/unapproved/);
});
test("previous latest ID outside finite publisher window blocks all state advancement",()=>{
 const prior=state();
 const withoutAnchor=rows.filter((_,i)=>i!==2);
 const r=previewDoeShadowTransition(prior,withoutAnchor,gate());
 assert.equal(r.status,"coverage_gap");
 assert.equal(r.possibleWindowGap,true);
 assert.equal(r.noStateWritten,true);
 assert.equal(r.reviewOnly.length,0);
 assert.deepEqual(r.proposedState,readDoeShadowState(prior));
 assert.equal(r.proposedState.lastSuccessfulAt,prior.lastSuccessfulAt);
});
test("all proposed updates require independent body, rights, recovery and completeness approvals",()=>{
 const variants=[
  {...gate(),fullBodyBoundaryCertified:false},
  {...gate(),sourceUseApproved:false},
  {...gate(),sourceWindowComplete:false},
  {...gate(),originalArticleHeadersVerified:false},
  {...gate(),publisherPagesVerified:1},
  {...gate(),approvedSemanticVersion:"doe-semantic-v2"},
  {...gate(),priorStateRecoveredFromIndependentArtifact:false},
  {...gate(),observedAt:"2026-10-09T12:00:00Z"},
  {...gate(),observedAt:"2026-10-09"},
 ];
 for(const g of variants)
  assert.throws(()=>previewDoeShadowTransition(state(),rows,g as DoeCoverageGate),/unapproved/);
});
test("reject duplicate IDs, dishonest sitewide issuer, unknown labels, bad dates and off-host links",()=>{
 const duplicate=rows.slice();duplicate[10]=rows[0];
 assert.throws(()=>previewDoeShadowTransition(state(),duplicate,gate()),/repeated/);
 const bad=[
  {...rows[5],issuingOffice:"Office of Critical Minerals and Energy Innovation"},
  {...rows[5],attributionAsListed:"Third Party"},
  {...rows[5],approvedSemanticFingerprint:"bad"},
  {...rows[5],originalHeaderVerified:false},
  {...rows[5],publicationDate:"2026-02-30"},
  {...rows[5],officialUrl:"https://evil.example/cmei/articles/fake-doe-release"},
  {...rows[5],officialUrl:"https://www.energy.gov/cmei/articles/fake-release?spoof=yes"},
 ];
 for(const item of bad){
  const altered=rows.slice();altered[5]=item as DoePublisherObservation;
  assert.throws(()=>previewDoeShadowTransition(state(),altered,gate()));
 }
});
test("source feed must be bounded and newest-first rather than accepting a partial survey",()=>{
 assert.throws(()=>previewDoeShadowTransition(state(),rows.slice(0,5),gate()),/bounded/);
 const bad=[...rows].reverse();
 assert.throws(()=>previewDoeShadowTransition(state(),bad,gate()),/newest-first/);
});
test("state contract is code-only: no workflow, production collector, writes or auto-approval",()=>{
 const source=readFileSync("scripts/doe-shadow-state-contract.ts","utf8");
 assert.doesNotMatch(source,/writeFileSync|renameSync|readFileSync|fetch\(|github\.token|schedule:|workflow_dispatch:/);
 assert.doesNotMatch(source,/data\/seed|editorial:inbox|PILOT_SOURCE_IDS|monitor:exim/);
 assert.match(source,/never rebaseline/);
 assert.match(source,/reviewStatus: "unreviewed"/);
 assert.match(source,/cannotPromoteFinancialClaim: true/);
 // A pure preview is not a bootstrap/run. The original M2.8 full-body
 // signal is false, so it cannot satisfy the required true gate.
 const body=readFileSync("scripts/doe-cmei-body-proof.ts","utf8");
 assert.match(body,/fullBodyBoundaryConfirmed:false/);
 assert.match(body,/eligibleForRevisionTracking:false/);
});
