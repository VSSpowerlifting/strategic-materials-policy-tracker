import test from "node:test";
import assert from "node:assert/strict";
import sourcePacket from "../research/f5/thompson-falls-original-and-field-triangulation.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { site } from "../lib/site";
import {
  auditThompsonSourceTriangulation, type ThompsonSourceReviewContext,
} from "../scripts/f5-thompson-original-field-crosscheck";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";

const packet=()=>structuredClone(sourcePacket);
const context=(): ThompsonSourceReviewContext=>({
  m3Queue:structuredClone(queue),
  sources:getAllSources(), projects:getAllProjects(),
  commitments:getAllFinancialCommitments(),
  publicMilestoneCount:getAllProjectMilestones().length,
});
const audit=(v:unknown=packet(),ctx:ThompsonSourceReviewContext=context())=>
  auditThompsonSourceTriangulation(v,ctx);
const messages=(v:unknown=packet(),ctx:ThompsonSourceReviewContext=context())=>
  audit(v,ctx).errors.join("; ");

test("Thompson SEC/local-source triage binds one existing M3 and five original document roles",()=>{
  const r=audit();
  assert.deepEqual(r.errors,[]);
  assert.equal(r.researchCrosscheckConsistent,true);
  assert.equal(r.independentOriginalFieldReportIncluded,true);
  assert.equal(r.originalSourceVerifiedByHuman,false);
  assert.equal(r.existingM3AdjudicationCompleted,false);
  assert.equal(r.publishAuthorized,false);
  assert.equal(new Set(sourcePacket.evidence.map(e=>e.role)).size,5);
  assert.equal(sourcePacket.evidence.find(e=>e.role==="original_local_field_report")?.sourceId,null);
  assert.equal(sourcePacket.evidence.find(e=>e.role==="registered_q2_form10q")?.sourceId,
    "src-usac-2026-q2-10q");
  assert.equal(getAllProjectMilestones().length,0);
});

test("Thompson still uses original human-only M3 packet, not a new positive operational milestone",()=>{
  const w=buildM3ReviewerPackets(structuredClone(queue),{
    projects:getAllProjects(),sources:getAllSources(),
    commitments:getAllFinancialCommitments(),corpusCutoff:site.lastUpdated,
    publicMilestoneCount:getAllProjectMilestones().length,
  },"review-m3-2-thompson-falls-q2-expansion");
  assert.equal(w.worksheets.length,1);
  assert.equal(w.worksheets[0].status,"unsigned_source_review");
  assert.equal(w.worksheets[0].proposedObservation.kind,"construction_progress_reported");
  assert.equal(w.worksheets[0].proposedObservation.scope,"named_facility");
  assert.equal(w.worksheets[0].proposedObservation.occurredOn,null);
  assert.equal(w.worksheets[0].humanAttestationPresent,false);
  assert.equal(w.publicationAuthorized,false);
});

test("Thompson resists misdating a quarterly issuer report or projected nine-furnace operation",()=>{
  const p=packet();(p as {occurredOn:string|null}).occurredOn="2026-06-30";
  assert.match(messages(p),/undated industrial stage/);
  const future=packet();(future as {targetOn:string|null}).targetOn="2026-09-30";
  assert.match(messages(future),/undated industrial stage/);
  const operational=packet();(operational as {proposalKind:string}).proposalKind="operations_started";
  assert.match(messages(operational),/cannot become operating/);
  const expanded=packet();(expanded as {proposalScope:string}).proposalScope="whole_project";
  assert.match(messages(expanded),/cannot become operating/);
  const clock=packet();(clock as {secFilingDate:string}).secFilingDate="2026-06-30";
  assert.match(messages(clock),/clocks conflated/);
});

test("Thompson rejects independent journalism being treated as an all-nine operating certificate",()=>{
  const full=packet();
  (full as {localReportDoesNotEstablishAllFurnacesRunning:boolean}).localReportDoesNotEstablishAllFurnacesRunning=false;
  assert.match(messages(full),/independence/);
  const self=packet();(self as {sameCompanySourcesNotIndependent:boolean}).sameCompanySourcesNotIndependent=false;
  assert.match(messages(self),/independence/);
  const field=packet();
  field.evidence[4].finding="all_nine_furnaces_operational";
  assert.match(messages(field),/interpretation mismatch/);
  const fabricated=packet();
  field.evidence[4].sourceId="src-usac-2026-q2-10q";
  assert.match(messages(field),/source registration/);
  const forged=packet();
  forged.editorialHandoff.additionalEvidenceRegistration="automatically_registered";
  assert.match(messages(forged),/source registration bypass/);
});

test("Thompson rejects invalid publisher URLs, duplicate roles, fabricated source clocks and omitted caveats",()=>{
  const url=packet();url.evidence[4].url="https://example.com/fieldvisit";
  assert.match(messages(url),/original URL mismatch/);
  const repeated=packet();repeated.evidence[3].role="original_local_field_report";
  assert.match(messages(repeated),/duplicate evidence role/);
  const date=packet();date.evidence[3].documentDate="2026-08-11";
  assert.match(messages(date),/document clock/);
  const missing=packet();missing.editorialHandoff.doNotInfer.pop();
  assert.match(messages(missing),/lost prohibition/);
  const tooVague=packet();tooVague.evidence[4].limitation="n/a";
  assert.match(messages(tooVague),/limitation missing/);
});

test("Thompson private review gate cannot be bypassed by signed metadata, claims or a changed M3 queue",()=>{
  const signed={...packet(),reviewedBy:"Test Reviewer",reviewedAt:"2026-10-16"};
  assert.match(messages(signed),/possible approval authority/);
  const hacked=packet();
  (hacked as {publicPublicationAuthorized:boolean}).publicPublicationAuthorized=true;
  assert.match(messages(hacked),/no content authentication/);
  const other=context(),m=other.m3Queue.find(x=>x.id==="review-m3-2-thompson-falls-q2-expansion");
  assert.ok(m);
  (m as {reviewVerdict:string}).reviewVerdict="approved";
  assert.match(messages(packet(),other),/existing M3 unsigned review/);
  const approval=context();approval.publicMilestoneCount=1;
  assert.match(messages(packet(),approval),/no public project-native milestone/);
});

test("Thompson preserves parent/child DPA amounts, partial-disbursement and no automatic payment allocation",()=>{
  const actual=context();
  const p=actual.commitments.find(c=>c.id==="fin-us-dow-usac-antimony-2026");
  const m=actual.commitments.find(c=>c.id==="fin-us-dow-usac-antimony-2026-thompson-falls");
  const a=actual.commitments.find(c=>c.id==="fin-us-dow-usac-antimony-2026-alaska");
  assert.equal(p?.amount?.value,"27000000");
  assert.equal(m?.amount?.value,"20000000");
  assert.equal(a?.amount?.value,"7000000");
  assert.equal(p?.financialStatusHistory.at(-1)?.status,"partially_disbursed");
  assert.equal(m?.implementationStatusHistory.length,0);
  const altered=context();
  const item=altered.commitments.find(c=>c.id==="fin-us-dow-usac-antimony-2026-thompson-falls");
  assert.ok(item);
  (item as {amount:{value:string}}).amount={value:"27000000"};
  assert.match(messages(packet(),altered),/Montana \$20M allocation/);
});

test("Thompson rejects altered source registry and supports deterministic offline audit",()=>{
  const bad=context();
  const source=bad.sources.find(x=>x.id==="src-usac-2026-q2-10q");
  assert.ok(source);
  (source as {datePublished:string}).datePublished="2026-06-30";
  assert.match(messages(packet(),bad),/source and existing published\/access clocks/);
  const a=packet(),copy=JSON.stringify(a);
  assert.deepEqual(audit(a),audit(a));
  assert.equal(JSON.stringify(a),copy);
  assert.equal(getAllProjectMilestones().length,0);
});
