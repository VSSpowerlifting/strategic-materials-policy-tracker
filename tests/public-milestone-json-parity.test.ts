import test from "node:test";
import assert from "node:assert/strict";
import { GET as getMilestoneRegister } from "../app/api/v1/project-milestones/route";
import { GET as getProject } from "../app/api/v1/projects/[id]/route";
import { GET as getDataset } from "../app/api/export/dataset.json/route";
import { buildDataset } from "../lib/export";
import {
  getAllProjectMilestones,getAllProjects,getAllFinancialCommitments,
  getProjectMilestonesByProject,getSourceById,getDatasetSummary,
} from "../lib/data";
import { site } from "../lib/site";

const wagerup="prj-au-alcoa-sojitz-gallium";
const milestoneId="mil-au-alcoa-wagerup-groundbreaking-2026-08-24";
const sourceId="src-alcoa-wagerup-groundbreaking-2026";
const project=(id:string)=>getProject(new Request("http://localhost/api/v1/projects/"+id),{
  params:Promise.resolve({id}),
});

test("public register and downloadable JSON expose exactly one genuinely reviewed milestone",async()=>{
  const response=getMilestoneRegister();
  assert.equal(response.status,200);
  assert.match(response.headers.get("content-type")??"",/application\/json/);
  const milestones=await response.json();
  assert.deepEqual(milestones,getAllProjectMilestones());
  assert.deepEqual(milestones.map((x:{id:string})=>x.id),[milestoneId,"mil-ee-neo-narva-commercial-production-reported-2026"]);
  const m=milestones[0];
  assert.equal(m.projectId,wagerup);
  assert.equal(m.sourceId,sourceId);
  assert.equal(m.kind,"groundbreaking_reported");
  assert.equal(m.scope,"named_facility");
  assert.equal(m.claimMode,"occurred");
  assert.equal(m.occurredOn,"2026-08-24");
  assert.equal(m.targetOn,null);
  assert.equal(m.reviewedBy,"Benjamin Yang");
  assert.equal(m.reviewedAt,"2026-10-17");
  assert.equal(site.lastUpdated,"2026-10-17");
  assert.ok(!JSON.stringify(milestones).includes(".project-execution-review"));
  assert.ok(!JSON.stringify(milestones).includes("review-m3-2"));
});

test("full dataset and summary carry only published native project milestones",async()=>{
  const ds=buildDataset();
  assert.deepEqual(ds.projectMilestones,getAllProjectMilestones());
  assert.equal(ds.counts.projectMilestones,2);
  assert.equal(getDatasetSummary().projectMilestones,2);
  const response=getDataset();
  assert.equal(response.status,200);
  const body=await response.json();
  assert.deepEqual(body.projectMilestones,ds.projectMilestones);
  assert.equal(body.counts.projectMilestones,2);
  assert.equal(body.generatedAt,site.lastUpdated);
  assert.ok(!("reviewerAdjudications" in body));
  assert.ok(!("privateReviewQueue" in body));
  assert.equal(body.financialCommitments.length,getAllFinancialCommitments().length);
});

test("project detail API adds source-pinned human evidence without rewriting financial status",async()=>{
  const res=await project(wagerup);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.project.id,wagerup);
  assert.deepEqual(body.reviewedProjectMilestones,getProjectMilestonesByProject(wagerup));
  assert.deepEqual(body.reviewedProjectMilestones.map((x:{id:string})=>x.id),[milestoneId,"mil-ee-neo-narva-commercial-production-reported-2026"]);
  assert.deepEqual(body.reviewedMilestoneSources.map((x:{id:string})=>x.id),[sourceId]);
  assert.deepEqual(body.reviewedMilestoneSources[0],getSourceById(sourceId));
  assert.match(body.reviewedMilestoneEvidenceBasis,/not independent on-site or financial verification/);
  assert.equal(body.reviewedProjectMilestones[0].note.includes("not independently observed sustained works"),true);
  assert.equal(body.latestImplementation===undefined,false,
    "legacy finance-derived implementation remains a separate existing response field");
  assert.ok(Array.isArray(body.layers));
  assert.ok(Array.isArray(body.associatedRowIds));
  assert.ok(Array.isArray(body.sources));
});

test("unsigned industrial projects have empty reviewed arrays, never inferred no-work conclusions",async()=>{
  const unreviewed=getAllProjects().find(p=>p.id!=="prj-au-alcoa-sojitz-gallium");
  assert.ok(unreviewed);
  const res=await project(unreviewed.id);
  assert.equal(res.status,200);
  const data=await res.json();
  assert.deepEqual(data.reviewedProjectMilestones,[]);
  assert.deepEqual(data.reviewedMilestoneSources,[]);
  assert.match(data.reviewedMilestoneEvidenceBasis,/not independent/);
  const missing=await project("prj-no-such-project");
  assert.equal(missing.status,404);
  assert.deepEqual(await missing.json(),{error:"not found",id:"prj-no-such-project"});
});

test("none of the JSON additions create a public Pathways or extra milestone publication",()=>{
  assert.deepEqual(getAllProjectMilestones().map(x=>x.id),[milestoneId,"mil-ee-neo-narva-commercial-production-reported-2026"]);
  const ds=buildDataset();
  assert.ok(!JSON.stringify(ds).includes("review-m3-2-alcoa-wagerup"));
  assert.ok(!JSON.stringify(ds).includes("prj-ca-cyclic-kingston-demonstration-plant-milestone"));
});
