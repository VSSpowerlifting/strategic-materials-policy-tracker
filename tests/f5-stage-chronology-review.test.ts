import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import packet from "../research/f5/industrial-stage-chronology-original-publishers.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { getAllProjects,getAllSources,getAllFinancialCommitments,getAllProjectMilestones } from "../lib/data";
import { site } from "../lib/site";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { buildF5StageReviewerSupplement } from "../scripts/f5-stage-chronology-review";

const data=()=>structuredClone(packet);
const refs=()=>({
  queue:structuredClone(queue),
  projects:structuredClone(getAllProjects()),
  sources:structuredClone(getAllSources()),
  commitments:structuredClone(getAllFinancialCommitments()),
  corpusCutoff:site.lastUpdated,
  publicMilestoneCount:getAllProjectMilestones().length,
});
const run=(p:unknown=data(),ctx=refs())=>buildF5StageReviewerSupplement(p,ctx);
const failures=(p:unknown=data(),ctx=refs())=>run(p,ctx).errors.join(" | ");

test("F5 stage supplement reconciles 2 canonical M3 worksheets with 8 original publisher leads",()=>{
  const report=run();
  assert.deepEqual(report.errors,[]);
  assert.ok(report.markdown);
  assert.equal(report.publicationAuthorized,false);
  const w=buildM3ReviewerPackets(queue,{
    projects:getAllProjects(),sources:getAllSources(),commitments:getAllFinancialCommitments(),
    corpusCutoff:site.lastUpdated,publicMilestoneCount:getAllProjectMilestones().length,
  });
  for(const id of ["review-m3-2-thompson-falls-q2-expansion","review-m3-2-cyclic-extended-operations"]){
    const worksheet=w.worksheets.find(x=>x.id===id);
    assert.ok(worksheet);
    assert.equal(worksheet.status,"unsigned_source_review");
    assert.equal(worksheet.proposedObservation.occurredOn,null);
    assert.equal(worksheet.humanAttestationPresent,false);
    assert.ok(report.markdown.includes(worksheet.reviewInputDigestSha256),
      "supplement reuses real M3 digest, not an invented signature");
    assert.ok(report.markdown.includes(id));
  }
  assert.equal(data().cases.reduce((sum,x)=>sum+x.leads.length,0),8);
  assert.equal(getAllProjectMilestones().length,0);
  assert.ok(report.markdown.includes("UNSIGNED RESEARCH"));
  assert.ok(report.markdown.includes("ALL UNCHECKED"));
});

test("Thompson chronology separates 2025 construction, May 2026 commissioning, Q2 reporting and August field report",()=>{
  const c=data().cases.find(x=>x.reviewId==="review-m3-2-thompson-falls-q2-expansion");
  assert.ok(c);
  assert.deepEqual(c.leads.map(x=>x.timeAsStated),["2025-05","2026-05","2026-Q2","by_2026-08-27"]);
  assert.deepEqual(c.leads.map(x=>x.publishedOn),
    ["2025-10-02","2026-06-09","2026-08-11","2026-08-27"]);
  assert.equal(c.occurredOn,null);
  assert.equal(c.exactOperationDayKnown,false);
  assert.match(c.leads[3].limitation,/nor all nine simultaneous operation/);
  assert.ok(c.checksBeforeDecision.some(x=>x.includes("$27M parent")));
});

test("Cyclic chronology refuses Hub100 100t design capacity, CMRDD completion and new 500t CoE merger",()=>{
  const c=data().cases.find(x=>x.reviewId==="review-m3-2-cyclic-extended-operations");
  assert.ok(c);
  assert.equal(c.proposalScope,"funded_activity");
  assert.equal(c.leads[0].publishedOn,"2024-06-06");
  assert.equal(c.leads[1].timeAsStated,"2024-07-17_to_2026-03-31");
  assert.equal(c.leads[2].timeAsStated,"target_2026-Q1");
  assert.equal(c.leads[3].timeAsStated,"2026-03");
  assert.equal(c.leads[3].publishedOn,null);
  assert.ok(c.leads[2].limitation.includes("Planned 500-tonne"));
  assert.ok(c.leads[0].limitation.includes("full actual throughput"));
  assert.equal(c.occurredOn,null);
});

test("Fail closed on fabricated physical dates, different projects, role order or future target promoted",()=>{
  const p=data();
  (p.cases[0] as {occurredOn:string|null}).occurredOn="2026-08-27";
  assert.match(failures(p),/undated physical event scope/);
  const project=data();project.cases[1].projectId="prj-ca-cyclic-kingston-centre-of-excellence";
  assert.match(failures(project),/M3 claim, project/);
  const role=data();role.cases[0].leads[1].role="independent_local_reporting";
  assert.match(failures(role),/source role\/URL\/clock\/scope drift/);
  const clock=data();clock.cases[1].leads[3].publishedOn="2026-03-31";
  assert.match(failures(clock),/source role\/URL\/clock\/scope drift/);
  const future=data();future.cases[1].leads[2].timeAsStated="2026-03";
  assert.match(failures(future),/source role\/URL\/clock\/scope drift/);
});

test("Reject approval-shaped fields, fake original-body verification, source registration or duplicate review",()=>{
  const approval={...data(),reviewedBy:"synthetic"};
  assert.match(failures(approval),/unexpected metadata\/approval field/);
  const authorized=data();authorized.publicationAuthorized=true;
  assert.match(failures(authorized),/no source-authentication, human signoff/);
  const fabricated=data();
  fabricated.cases[0].leads[3].registeredSourceId="src-usac-2026-q2-10q";
  assert.match(failures(fabricated),/source role\/URL\/clock\/scope drift/);
  const dup=data();dup.cases[1]=structuredClone(dup.cases[0]);
  assert.match(failures(dup),/duplicate existing review identity|missing original M3 review/);
  const reporter=data();reporter.cases[0].leads[3].limitation="proves all 9 at rated capacity";
  assert.match(failures(reporter),/source finding\/issuer\/limitation too vague/);
});

test("Registered SEC/NRCan URLs and clocks cannot drift without a new human review",()=>{
  const ctx=refs();const source=ctx.sources.find(x=>x.id==="src-usac-2026-q2-10q");
  assert.ok(source);
  (source as {datePublished:string|null}).datePublished="2026-06-30";
  assert.match(failures(data(),ctx),/registered original publisher URL\/publication clock mismatch/);
  const ctx2=refs();const s2=ctx2.sources.find(x=>x.id==="src-nrcan-cmrdd-programme");
  assert.ok(s2);
  (s2 as {datePublished:string|null}).datePublished="2026-03-31";
  assert.match(failures(data(),ctx2),/registered original publisher URL\/publication clock mismatch/);
  const ctx3=refs();ctx3.publicMilestoneCount=1;
  assert.match(failures(data(),ctx3),/unexpected public milestone\/publication approval/);
  const ctx4=refs();ctx4.projects=ctx4.projects.filter(x=>x.id!=="prj-ca-cyclic-kingston-centre-of-excellence");
  assert.match(failures(data(),ctx4),/distinct Kingston project identities/);
});

test("Invalid canonical M3 verdict fails through original M3 validator; supplement stays deterministic and read-only",()=>{
  const ctx=refs();
  const m=(ctx.queue as typeof queue).find(x=>x.id==="review-m3-2-cyclic-extended-operations");
  assert.ok(m);
  (m as {reviewVerdict:string}).reviewVerdict="approved";
  assert.throws(()=>run(data(),ctx),/M3 review queue invalid/);
  const unchanged=data(),before=JSON.stringify(unchanged);
  assert.deepEqual(run(unchanged),run(unchanged));
  assert.equal(JSON.stringify(unchanged),before);
});

test("Printable handoff actually runs offline, produces no approval tokens and no private file",()=>{
  const p=spawnSync(process.execPath,["--import","tsx","scripts/print-f5-stage-chronology.ts"],{
    encoding:"utf8",timeout:20000,
  });
  assert.equal(p.status,0,p.stderr);
  assert.match(p.stdout,/UNSIGNED RESEARCH/);
  assert.match(p.stdout,/review-m3-2-cyclic-extended-operations/);
  assert.match(p.stdout,/review-m3-2-thompson-falls-q2-expansion/);
  assert.doesNotMatch(p.stdout,/\*\*M3 decision:\*\* APPROVED/);
  assert.doesNotMatch(p.stdout,/reviewedBy:/);
  assert.equal(getAllProjectMilestones().length,0);
});
