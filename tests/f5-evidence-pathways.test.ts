import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

import {
  auditEvidencePathways, PATHWAY_EDGE_KINDS, type PathwayInputs,
} from "@/lib/evidence-pathway-contract";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";
import type { ProjectMilestone } from "@/lib/types";

const corpus = (): PathwayInputs => structuredClone({
  events: getAllEvents(),
  finances: getAllFinancialCommitments(),
  controls: getAllControlMeasures(),
  projects: getAllProjects(),
  designations: getAllProjectDesignations(),
  milestones: getAllProjectMilestones(),
  sources: getAllSources(),
});

test("F5-0: complete checked-out corpus is represented only as source-linked structural relationships", () => {
  const input = corpus();
  const report = auditEvidencePathways(input);
  assert.equal(report.schemaVersion, "f5-0");
  assert.equal(report.readOnly, true);
  assert.equal(report.causalClaimsAuthorized, false);
  assert.equal(report.historicalCapitalTotalsAuthorized, false);
  assert.equal(report.totals.events, input.events.length);
  assert.equal(report.totals.finances, input.finances.length);
  assert.equal(report.totals.controls, input.controls.length);
  assert.equal(report.totals.projects, input.projects.length);
  assert.equal(report.totals.designations, input.designations.length);
  assert.equal(report.totals.sources, input.sources.length);
  assert.equal(report.totals.nativeMilestones, input.milestones.length);
  assert.equal(report.projects.length, input.projects.length);
  assert.equal(report.totals.projectsWithoutNativeMilestones,
    report.projects.filter(p=>p.nativeMilestoneIds.length === 0).length);
  assert.equal(report.edgeCounts.reduce((n, c)=>n+c.count,0),report.totals.edges);
  assert.deepEqual(report.edgeCounts.map(c=>c.kind),[...PATHWAY_EDGE_KINDS]);
  assert.equal(report.totals.edges,report.edges.length);
  assert.ok(report.edges.every(e=>e.causalEffect==="not_asserted" && e.evidence.length > 0));
  const knownSources = new Set(input.sources.map(s=>s.id));
  assert.ok(report.edges.every(e=>e.evidence.every(s=>knownSources.has(s.sourceId))));
  assert.ok(report.projects.every(p=>p.physicalReview==="native_milestones_not_yet_recorded"),
    "current empty milestone seed must not be mistaken for verified facility execution");
  assert.ok(report.totals.legacyObservationsNeedingReview > 0);
  assert.equal(report.physicalClock,"native_source_claims_not_current_revision_status");
  assert.ok(!JSON.stringify(report).includes('"financialAmountHistory"'));
  assert.ok(!JSON.stringify(report).includes('"summed"'));
});

test("F5-0: output is deterministic independent of original array ordering and does not mutate seeds", () => {
  const data = corpus(), unchanged=JSON.stringify(data);
  const first=auditEvidencePathways(data);
  const reverse:PathwayInputs={
    events:[...data.events].reverse(),
    finances:[...data.finances].reverse(),
    controls:[...data.controls].reverse(),
    projects:[...data.projects].reverse(),
    designations:[...data.designations].reverse(),
    milestones:[...data.milestones].reverse(),
    sources:[...data.sources].reverse(),
  };
  assert.deepEqual(first,auditEvidencePathways(reverse));
  assert.equal(JSON.stringify(data),unchanged);
  assert.deepEqual(first.projects.map(p=>p.projectId),
    [...first.projects.map(p=>p.projectId)].sort());
});

test("F5-0: source provenance is source-specific, not automatically policy-causal", () => {
  const data=corpus(), report=auditEvidencePathways(data);
  const index=new Map(data.sources.map(s=>[s.id,s]));
  for(const edge of report.edges){
    for(const citation of edge.evidence){
      const s=index.get(citation.sourceId)!;
      assert.equal(citation.sourcePublishedOn,s.datePublished??null);
      assert.equal(citation.sourceAccessedOn,s.dateAccessed);
    }
    assert.ok(!["policy_caused_project","material_similarity","temporal_correlation"].includes(edge.kind));
  }
  assert.ok(report.limitations.some(s=>s.includes("causation")));
  assert.ok(report.limitations.some(s=>s.includes("candidate")));
});

test("F5-0: associations never become allocative project backing", () => {
  const data=corpus(), project=data.projects[0];
  const associated=data.projects[1];
  const row=data.finances.find(f=>f.projectId && f.evidence.some(e=>e.supports.includes("project")))!;
  assert.ok(project && associated && row);
  row.associatedProjectIds=[associated.id, associated.id];
  if (row.projectId===associated.id) {
    row.associatedProjectIds=[project.id,project.id];
  }
  const target=row.associatedProjectIds[0];
  const report=auditEvidencePathways(data);
  const related=report.edges.filter(e=>e.fromId===row.id && e.toId===target);
  assert.equal(related.filter(e=>e.kind==="nonallocative_finance_project_association").length,1,
    "duplicated association input is deduplicated, not double counted");
  assert.ok(!related.some(e=>e.kind==="allocative_finance_project"));
  assert.equal(related[0].moneyAllocation,"nonallocative");
  const projectRecord=report.projects.find(x=>x.projectId===target)!;
  assert.ok(projectRecord.associatedFinanceIds.includes(row.id));
  assert.ok(!projectRecord.attributableFinanceIds.includes(row.id));
  assert.ok(report.edges.some(e=>e.fromId===row.id &&
    e.toId===row.projectId && e.kind==="allocative_finance_project"));
});

test("F5-0: evidence graph fails closed on missing IDs and uncited assertions", () => {
  const missingProject=corpus(), row=missingProject.finances.find(f=>f.projectId)!;
  row.projectId="prj-fabricated-never-reviewed";
  assert.throws(()=>auditEvidencePathways(missingProject),/F5 unresolved finance project/);

  const missingEvent=corpus();
  missingEvent.controls[0].eventId="evt-not-a-real-event";
  assert.throws(()=>auditEvidencePathways(missingEvent),/F5 unresolved control event/);

  const duplicate=corpus();
  assert.throws(()=>auditEvidencePathways({...duplicate, projects:[...duplicate.projects,duplicate.projects[0]]}),/duplicate project ID/);

  const lostCitation=corpus();
  lostCitation.finances[0].evidence=[];
  assert.throws(()=>auditEvidencePathways(lostCitation),/uncited structural edge/);

  const missingSource=corpus();
  missingSource.finances[0].evidence[0].sourceId="src-imaginary";
  assert.throws(()=>auditEvidencePathways(missingSource),/F5 unresolved source/);

  const brokenParent=corpus();
  brokenParent.finances[0].relationships.push({
    commitmentId:"fin-fabricated-parent",relationship:"part_of",sourceId:brokenParent.sources[0].id,
  });
  assert.throws(()=>auditEvidencePathways(brokenParent),/F5 unresolved finance parent/);
});

test("F5-0: native milestone is a separate reviewed, scoped and mode-specific assertion", () => {
  const data=corpus(), project=data.projects[0], source=data.sources[0];
  const milestone:ProjectMilestone={
    id:"mil-f5-fixture",projectId:project.id,kind:"construction_started",
    claimMode:"planned",scope:"named_facility",scopeAsStated:"source test fixture",
    occurredOn:null,targetOn:"2027-09-30",sourceId:source.id,
    locator:"test source paragraph",statementOriginal:"test fixture",statementEn:"test fixture",
    statementEnSource:"na",reviewedBy:"test reviewer",reviewedAt:"2026-10-09",
  };
  const withMilestone={...data,milestones:[...data.milestones,milestone]};
  const report=auditEvidencePathways(withMilestone);
  const edge=report.edges.find(e=>e.kind==="reviewed_project_milestone");
  assert.deepEqual([edge?.fromId,edge?.toId],[project.id,milestone.id]);
  assert.equal(report.totals.nativeMilestones,1);
  assert.equal(report.totals.nativePlanned,1);
  assert.equal(report.totals.nativeOccurred,0);
  assert.equal(report.projects.find(p=>p.projectId===project.id)?.physicalReview,
    "native_milestones_recorded");
  milestone.occurredOn="2026-09-20";
  assert.throws(()=>auditEvidencePathways(withMilestone),/conflates occurred and target clocks/);
  milestone.occurredOn=null;
  milestone.reviewedBy="  ";
  assert.throws(()=>auditEvidencePathways(withMilestone),/milestone lacks reviewer/);
});

test("F5-0: actual CLI is read-only, machine-readable and rejects unknown options", () => {
  const command=process.execPath;
  const json=execFileSync(command,["--import","tsx","scripts/audit-evidence-pathways.ts","--json"],{
    cwd:process.cwd(),encoding:"utf8",
  });
  const parsed=JSON.parse(json);
  assert.equal(parsed.schemaVersion,"f5-0");
  assert.equal(parsed.totals.projects,getAllProjects().length);
  const summary=execFileSync(command,["--import","tsx","scripts/audit-evidence-pathways.ts"],{
    cwd:process.cwd(),encoding:"utf8",
  });
  assert.ok(summary.includes("Causal claims: NOT AUTHORIZED"));
  assert.ok(summary.includes("Historical financial sums: NOT AUTHORIZED"));
  const failed=spawnSync(command,["--import","tsx","scripts/audit-evidence-pathways.ts","--publish"],{
    cwd:process.cwd(),encoding:"utf8",
  });
  assert.equal(failed.status,2);
  assert.ok(failed.stderr.includes("Usage:"));
});
