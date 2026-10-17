import test from "node:test";
import assert from "node:assert/strict";
import research from "../research/f5/cyclic-kingston-original-publisher-crosscheck.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { auditCyclicOriginalPublisherCrosscheck, type CyclicSourceCrosscheckContext } from "../scripts/f5-cyclic-original-publisher-crosscheck";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { site } from "../lib/site";

const ctx = () => ({
  m3Queue: structuredClone(queue),
  sources: getAllSources().map(s => ({
    id:s.id, url:s.url, datePublished:s.datePublished ?? null,
    dateAccessed:s.dateAccessed ?? "",
  })),
  projects: getAllProjects(),
  commitments: getAllFinancialCommitments().map(f => ({
    id:f.id, projectId:f.projectId, amount:f.amount,
    implementationStatusHistory:f.implementationStatusHistory,
  })),
  publicMilestoneCount: getAllProjectMilestones().length,
});
const input = () => structuredClone(research);
const run = (p: unknown = input(), c: CyclicSourceCrosscheckContext = ctx()) => auditCyclicOriginalPublisherCrosscheck(p,c);

test("Cyclic F5-5 original publisher crosscheck: source-registered, unsigned and nonpublishing", () => {
  const report=run();
  assert.deepEqual(report.errors,[]);
  assert.equal(report.registryCrosscheckConsistent,true);
  assert.equal(report.originalSourceAuthenticated,false);
  assert.equal(report.humanReviewed,false);
  assert.equal(report.publicPublicationAuthorized,false);
  assert.equal(research.sourceChecks.length,5);
  assert.equal(new Set(research.sourceChecks.map(x=>x.role)).size,5);
  assert.equal(research.sourceIndependence,
    "single_federal_reporting_chain_no_independent_physical_inspection");
  assert.equal(research.reportedCompletionMonth,"2026-03");
  assert.equal(research.occurredOn,null);
  assert.equal(getAllProjectMilestones().length, 1);
});

test("Cyclic F5-5 crosscheck uses existing human M3 authority and one funded-activity boundary", () => {
  const c=ctx();
  const packets=buildM3ReviewerPackets(c.m3Queue,{
    projects:getAllProjects(), sources:getAllSources(), commitments:getAllFinancialCommitments(),
    corpusCutoff:site.lastUpdated, publicMilestoneCount:c.publicMilestoneCount,
  },research.canonicalReviewId);
  assert.equal(packets.worksheets.length,1);
  const w=packets.worksheets[0];
  assert.equal(w.id,"review-m3-2-cyclic-extended-operations");
  assert.equal(w.status,"unsigned_source_review");
  assert.equal(w.humanAttestationPresent,false);
  assert.equal(w.proposedObservation.kind,"funded_activity_completed");
  assert.equal(w.proposedObservation.scope,"funded_activity");
  assert.equal(w.proposedObservation.occurredOn,null);
  assert.equal(packets.publicationAuthorized,false);
  const source=getAllSources().find(s=>s.id==="src-nrcan-cmrdd-programme");
  assert.equal(source?.datePublished,null);
  assert.equal(source?.dateAccessed,"2026-10-07");
  const fin=getAllFinancialCommitments().find(f=>f.id==="fin-ca-cmrdd-2024-cyclic-materials");
  assert.equal(fin?.amount?.value,"4893125");
  assert.equal(fin?.financialStatusHistory.at(-1)?.status,"contracted");
});

test("Cyclic F5-5 crosscheck refuses event-day invention or reinterpretation as plant operation", () => {
  const exactDay=input();
  (exactDay as {occurredOn:string|null}).occurredOn="2026-03-31";
  assert.match(run(exactDay).errors.join(" "),/day was fabricated/);
  const wholeProject=input();
  (wholeProject as {proposalScope:string}).proposalScope="whole_project";
  assert.match(run(wholeProject).errors.join(" "),/funded-activity scope/);
  const changed=input();
  (changed as {interpretation:string}).interpretation="commercial_plant_operational";
  assert.match(run(changed).errors.join(" "),/overstates funded activity/);
  const approved=input();
  (approved as {humanAttestationPresent:boolean}).humanAttestationPresent=true;
  assert.match(run(approved).errors.join(" "),/cannot be promoted/);
});

test("Cyclic F5-5 crosscheck refuses co-mingled grant identities, false independence and publisher URL drift", () => {
  const c=ctx();
  const wrongFin={...c,commitments:c.commitments.map(f=>f.id===research.canonicalFinanceId
    ? {...f, amount:{...f.amount,value:"5000000"}} : f)};
  assert.match(run(input(),wrongFin).errors.join(" "),/finance\/activity boundary changed/);
  const fakeSource=input();
  fakeSource.sourceChecks[0].url="https://example.org/press-release";
  assert.match(run(fakeSource).errors.join(" "),/official URL changed/);
  const promoted=input();
  (promoted as {sourceIndependence:string}).sourceIndependence="independent_site_visit";
  assert.match(run(promoted).errors.join(" "),/cannot become independent physical corroboration/);
  const changedRole=input();
  changedRole.sourceChecks[4].registeredSourceId="src-nrcan-cmrdd-programme";
  assert.match(run(changedRole).errors.join(" "),/source identity changed/);
  const duplicated=input();
  duplicated.sourceChecks[1].role="program_status";
  assert.match(run(duplicated).errors.join(" "),/duplicate source role/);
});

test("Cyclic F5-5 crosscheck rejects registry/queue drift and approval-shaped extra fields", () => {
  const c=ctx();
  c.m3Queue[1].reviewVerdict="approved" as (typeof c.m3Queue)[number]["reviewVerdict"];
  assert.match(run(input(),c).errors.join(" "),/canonical M3 source\/claim\/gate drifted/);
  const extra={...input(), reviewedBy:"synthetic reviewer"};
  assert.match(run(extra).errors.join(" "),/unexpected or absent top-level fields/);
  const afterPublication={...ctx(),publicMilestoneCount:2};
  assert.match(run(input(),afterPublication).errors.join(" "),/public project milestones changed/);
  assert.deepEqual(run(input()),run(input()),"audit is deterministic");
});
