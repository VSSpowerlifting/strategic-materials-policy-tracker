import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildProjectComparison } from "@/lib/project-comparison";
import { buildProjectDirectory } from "@/lib/project-directory";
import {
  getAllFinancialCommitments, getAllOrganizations, getAllProjectDesignations,
  getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";
import { site } from "@/lib/site";
import type { ProjectMilestone } from "@/lib/types";

function corpus() {
  const projects = structuredClone(getAllProjects());
  const finances = structuredClone(getAllFinancialCommitments());
  const designations = structuredClone(getAllProjectDesignations());
  const organizations = structuredClone(getAllOrganizations());
  const sources = structuredClone(getAllSources());
  const milestones = structuredClone(getAllProjectMilestones());
  const directory = buildProjectDirectory(projects, finances, designations, organizations, site.lastUpdated);
  return {projects,finances,designations,organizations,sources,milestones,directory};
}
function built(d=corpus()) {
  return buildProjectComparison(d.directory,d.projects,d.sources,d.milestones);
}

test("comparison is a bijection with the published project directory without changing finance attribution",()=>{
  const d=corpus(), before=JSON.stringify(d), rows=built(d);
  assert.equal(rows.length,d.projects.length);
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
  assert.equal(JSON.stringify(d),before);
  for (const p of rows) {
    const directory=d.directory.find(r=>r.id===p.id)!;
    assert.deepEqual(p.directFinanceIds,directory.directFinanceIds);
    assert.deepEqual(p.sharedUnallocatedFinanceIds,directory.sharedUnallocatedFinanceIds);
    assert.deepEqual(p.designationIds,directory.designationIds);
    assert.deepEqual(p.governmentCommitmentProviders,directory.governmentCommitmentProviders);
    assert.equal(p.governmentCommitmentEvidenced,directory.governmentCommitmentEvidenced);
    assert.ok(p.sharedUnallocatedFinanceIds.every(id=>!p.directFinanceIds.includes(id)));
  }
});

test("known JARE/Lynas shared finance is never a direct grant or investment on comparison",()=>{
  const lynas=built().find(r=>r.id==="prj-lynas-hre-separation")!;
  assert.ok(lynas.sharedUnallocatedFinanceIds.includes("fin-jp-jare-lynas-2023-equity"));
  assert.ok(!lynas.directFinanceIds.includes("fin-jp-jare-lynas-2023-equity"));
});

test("registry citations come from project evidence alone, not financing or private review",()=>{
  const d=corpus(), rows=built(d), sourceIds=new Set(d.sources.map(s=>s.id));
  for(const p of rows) {
    const origin=d.projects.find(r=>r.id===p.id)!;
    assert.deepEqual(p.projectSources.map(s=>s.id).sort(),
      [...new Set(origin.evidence.map(e=>e.sourceId))].sort());
    assert.ok(p.projectSources.every(s=>sourceIds.has(s.id)&&s.title&&s.publisher));
    assert.deepEqual(p.publishedMilestones.map(m=>m.id).sort(),
      d.milestones.filter(m=>m.projectId===p.id).map(m=>m.id).sort());
  }
});

test("a synthetic reviewed public milestone is visible without promoting financier implementation entries",()=>{
  const d=corpus(), project=d.projects.find(p=>p.evidence.length>0)!;
  const sourceId=project.evidence[0].sourceId;
  const m:ProjectMilestone={
    id:"test-reviewed-project-milestone",projectId:project.id,
    kind:"construction_started",claimMode:"occurred",scope:"named_facility",
    scopeAsStated:"test facility",occurredOn:"2025-04-02",targetOn:null,
    sourceId,locator:"paragraph 3",statementOriginal:"Fixture",
    statementEn:"Fixture",statementEnSource:"self",
    reviewedBy:"Test fixture",reviewedAt:"2026-10-10",
  };
  d.milestones.push(m);
  const comparison=built(d).find(p=>p.id===project.id)!;
  assert.equal(comparison.publishedMilestones.filter(x=>x.id===m.id).length,1);
  assert.equal(comparison.publishedMilestones.find(x=>x.id===m.id)?.occurredOn,"2025-04-02");
  const unchanged=built({...d,milestones:[]}).find(p=>p.id===project.id)!;
  assert.deepEqual(unchanged.publishedMilestones,[]);
  assert.deepEqual(unchanged.directFinanceIds,comparison.directFinanceIds);
});

test("comparison fails closed on stale registry IDs, duplicate public milestones and missing citations",()=>{
  const stale=corpus();
  stale.directory[0].name="not the registered project";
  assert.throws(()=>built(stale),/registry mismatch/);
  const missing=corpus();
  const project=missing.projects.find(p=>p.evidence.length>0)!;
  project.evidence[0].sourceId="source-that-does-not-exist";
  assert.throws(()=>built(missing),/unresolved source/);
  const m=corpus();
  const target=m.projects.find(p=>p.evidence.length>0)!;
  const synthetic:ProjectMilestone={
    id:"duplicate-test",projectId:target.id,kind:"production_reported",
    claimMode:"occurred",scope:"whole_project",scopeAsStated:null,
    occurredOn:null,targetOn:null,sourceId:target.evidence[0].sourceId,
    locator:null,statementOriginal:"Fixture",statementEn:"Fixture",
    statementEnSource:"self",reviewedBy:"Test fixture",reviewedAt:"2026-10-11",
  };
  m.milestones.push(synthetic, {...synthetic});
  assert.throws(()=>built(m),/Duplicate published milestone/);
});

test("comparisons are deterministic across seed ordering and require no new data classifier",()=>{
  const d=corpus(), rows=built(d);
  assert.deepEqual(rows,built({
    ...d,
    projects:[...d.projects].reverse(),
    sources:[...d.sources].reverse(),
    milestones:[...d.milestones].reverse(),
    directory:[...d.directory].reverse(),
  }));
});

test("static page uses published projections, deep-linked selectors, source links and legible mobile cards",async()=>{
  const [page,component,index,sitemap,model]=await Promise.all([
    readFile("app/projects/compare/page.tsx","utf8"),
    readFile("components/project-comparison.tsx","utf8"),
    readFile("app/projects/page.tsx","utf8"),
    readFile("app/sitemap.ts","utf8"),
    readFile("lib/project-comparison.ts","utf8"),
  ]);
  assert.match(page,/getAllProjectMilestones\(\)/);
  assert.match(page,/buildProjectDirectory/);
  assert.match(component,/useUrlFilters/);
  assert.match(component,/project-comparison-results/);
  assert.match(component,/lg:grid-cols-2/);
  assert.match(component,/\/sources\//);
  assert.match(component,/kind="capital"/);
  assert.match(index,/href="\/projects\/compare"/);
  assert.match(sitemap,/entry\("\/projects\/compare"/);
  assert.doesNotMatch(page+model,/research\/f5|data\/candidates|private-review/);
  assert.doesNotMatch(page,/useSearchParams/);
});
