import test from "node:test";
import assert from "node:assert/strict";

import { buildProjectDirectory, filterProjectDirectory, UNSTATED } from "@/lib/project-directory";
import { buildIndustrialResponse } from "@/lib/industrial-response";
import {
  getAllFinancialCommitments, getAllOrganizations, getAllProjectDesignations,
  getAllProjects, getAllMaterials,
} from "@/lib/data";
import { site } from "@/lib/site";

const source = () => ({
  projects: structuredClone(getAllProjects()),
  finances: structuredClone(getAllFinancialCommitments()),
  designations: structuredClone(getAllProjectDesignations()),
  organizations: structuredClone(getAllOrganizations()),
});
const built = (data=source())=>buildProjectDirectory(
  data.projects,data.finances,data.designations,data.organizations,site.lastUpdated);
const names=Object.fromEntries(getAllMaterials().map(m=>[m.id,m.nameEn]));

test("project directory returns every unique registered project and matches /response cutoff",()=>{
  const d=source(),before=JSON.stringify(d),rows=built(d);
  assert.equal(rows.length,d.projects.length);
  assert.equal(new Set(rows.map(r=>r.id)).size,d.projects.length);
  assert.equal(JSON.stringify(d),before);
  const response=buildIndustrialResponse(site.lastUpdated,d.finances,d.projects);
  assert.deepEqual(rows.filter(r=>r.governmentCommitmentEvidenced).map(r=>r.id).sort(),
    response.rows.map(r=>r.id).sort());
  for(const r of rows){
    const source=response.rows.find(x=>x.id===r.id);
    assert.deepEqual(r.governmentCommitmentProviders,
      [...new Set((source?.financialEvidence??[]).map(x=>d.finances.find(y=>y.id===x.financialId)!.providerJurisdiction))].sort());
    assert.equal(r.governmentCommitmentProviders.length>0,r.governmentCommitmentEvidenced);
  }
});

test("shared unallocated finance never becomes a direct link or government-backed project",()=>{
  const rows=built();
  const lyon=rows.find(r=>r.id==="prj-lynas-hre-separation")!;
  assert.ok(lyon.sharedUnallocatedFinanceIds.includes("fin-jp-jare-lynas-2023-equity"));
  assert.ok(!lyon.directFinanceIds.includes("fin-jp-jare-lynas-2023-equity"));
  const f=filterProjectDirectory(rows,{relationship:"shared"});
  assert.ok(f.some(r=>r.id===lyon.id));
  assert.ok(f.every(r=>r.sharedUnallocatedFinanceIds.length>0));
  assert.ok(f.every(r=>!r.sharedUnallocatedFinanceIds.some(id=>r.directFinanceIds.includes(id))));
});

test("project filters intersect categories and use OR within project multi-material memberships",()=>{
  const rows=built();
  const q=filterProjectDirectory(rows,{material:"gallium",country:"AU",stage:"processing"},names);
  assert.ok(q.some(r=>r.id==="prj-au-alcoa-sojitz-gallium"));
  assert.ok(q.every(r=>r.materialIds.includes("gallium")&&r.countryCodes.includes("AU")&&r.stages.includes("processing")));
  const polymaterial=rows.find(r=>r.materialIds.length>1)!;
  for(const m of polymaterial.materialIds)assert.ok(filterProjectDirectory(rows,{material:m}).some(r=>r.id===polymaterial.id));
  assert.ok(filterProjectDirectory(rows,{q:"alcoa sojitz"},names).some(r=>r.id==="prj-au-alcoa-sojitz-gallium"));
  assert.ok(filterProjectDirectory(rows,{q:"GALLIUM"},names).some(r=>r.id==="prj-au-alcoa-sojitz-gallium"));
  assert.equal(filterProjectDirectory(rows,{q:"never-find-this-deliberate-token"},names).length,0);
});

test("missing country, stage and material are explicitly filterable without guesses",()=>{
  const rows=built();
  assert.deepEqual(filterProjectDirectory(rows,{material:UNSTATED}).map(r=>r.id),
    rows.filter(r=>r.materialIds.length===0).map(r=>r.id));
  assert.deepEqual(filterProjectDirectory(rows,{stage:UNSTATED}).map(r=>r.id),
    rows.filter(r=>r.stages.length===0).map(r=>r.id));
  assert.deepEqual(filterProjectDirectory(rows,{country:UNSTATED}).map(r=>r.id),
    rows.filter(r=>r.countryCodes.length===0).map(r=>r.id));
  assert.ok(filterProjectDirectory(rows,{material:UNSTATED})
    .some(r=>r.id==="prj-us-mp-mountain-pass-hcl-facilities"));
});

test("one project can have a designation and financing yet remains counted once",()=>{
  const rows=built();
  const overlap=rows.find(r=>r.designationIds.length>0&&r.directFinanceIds.length>0);
  assert.ok(overlap);
  assert.ok(filterProjectDirectory(rows,{relationship:"designation"}).some(r=>r.id===overlap.id));
  assert.ok(filterProjectDirectory(rows,{relationship:"direct"}).some(r=>r.id===overlap.id));
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
});

test("financial role and status respect /response as-of eligibility, not a guessed funding label",()=>{
  const rows=built();
  const yes=filterProjectDirectory(rows,{government:"yes"});
  const no=filterProjectDirectory(rows,{government:"no"});
  assert.equal(yes.length+no.length,rows.length);
  assert.ok(yes.every(r=>r.governmentCommitmentEvidenced));
  assert.ok(no.every(r=>!r.governmentCommitmentEvidenced));
  const d=source();
  const original=d.finances.find(f=>f.projectId&&f.providerJurisdiction&&f.valueRole==="commitment")!;
  original.valueRole="indication";
  const changed=built(d);
  assert.deepEqual(changed.filter(r=>r.governmentCommitmentEvidenced).map(r=>r.id).sort(),
    buildIndustrialResponse(site.lastUpdated,d.finances,d.projects).rows.map(r=>r.id).sort());
});

test("directory stable under shuffled inputs, with invalid identities rejected",()=>{
  const d=source(),a=built(d);
  const b=built({
    projects:[...d.projects].reverse(),finances:[...d.finances].reverse(),
    designations:[...d.designations].reverse(),organizations:[...d.organizations].reverse(),
  });
  assert.deepEqual(a,b);
  const duplicate=source();
  duplicate.projects.push({...duplicate.projects[0]});
  assert.throws(()=>built(duplicate),/duplicate project ID/);
  const missing=source();
  const first=missing.projects.find(p=>p.sponsorOrgIds.length>0)!;
  first.sponsorOrgIds=["org-does-not-exist"];
  assert.throws(()=>built(missing),/unresolved sponsor/);
});

test("product page remains prerendered, navigable, and filter controls have accessible labels",async()=>{
  const fs=await import("node:fs/promises");
  const page=await fs.readFile("app/projects/page.tsx","utf8");
  const explorer=await fs.readFile("components/projects-explorer.tsx","utf8");
  assert.match(page,/ProjectsExplorer/);
  assert.ok(!page.includes("useSearchParams"));
  assert.match(explorer,/aria-live="polite"/);
  assert.match(explorer,/Clear filters/);
  assert.match(explorer,/href=\{\`\/projects\/\$\{p\.id\}\`\}/);
  assert.match(explorer,/governmentCommitmentProviders/);
});
