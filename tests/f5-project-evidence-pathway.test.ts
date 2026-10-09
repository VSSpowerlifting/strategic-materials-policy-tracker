import test from "node:test";
import assert from "node:assert/strict";

import { buildProjectEvidencePathway } from "@/lib/project-evidence-pathway";
import type { PathwayInputs } from "@/lib/evidence-pathway-contract";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";
import type { ProjectMilestone } from "@/lib/types";

const input = (): PathwayInputs => structuredClone({
  events: getAllEvents(), finances: getAllFinancialCommitments(),
  controls: getAllControlMeasures(), projects: getAllProjects(),
  designations: getAllProjectDesignations(), milestones: getAllProjectMilestones(),
  sources: getAllSources(),
});

test("F5-2: gallium casefile joins three finance rows but no independently reviewed physical milestone yet", () => {
  const data = input(), id = "prj-au-alcoa-sojitz-gallium";
  const r = buildProjectEvidencePathway(id, data);
  assert.equal(r.schemaVersion, "f5-2");
  assert.equal(r.view, "current_corpus_revision");
  assert.equal(r.verifiedCausality, "not_asserted");
  assert.equal(r.historicalCapitalTotals, "not_authorized");
  assert.equal(r.project.id, id);
  assert.deepEqual(r.project.materialIds, ["gallium"]);
  assert.equal(r.reviewGaps.nativePhysical, "no_reviewed_milestones");
  assert.deepEqual(r.nativeMilestones, []);
  assert.equal(r.reviewGaps.absenceMeansInactivity, false);
  assert.equal(r.reviewGaps.directFinanceCount, 3);
  assert.equal(new Set(r.financing.map(f=>f.id)).size, 3);
  assert.equal(r.reviewGaps.legacyPhysicalObservationCount, 3);
  assert.ok(r.financing.every(f=>f.projectRelationship==="directly_attributable"));
  assert.ok(r.financing.every(f=>f.legacyPhysicalObservations.some(s=>
    s.evidence.id==="src-alcoa-wagerup-groundbreaking-2026")));
  assert.ok(r.financing.every(f=>f.attributableAmountAuthorized===false));
  assert.ok(!JSON.stringify(r).includes("financialAmountHistory"));
  assert.ok(!("totalCapital" in r));
});

test("F5-2: Stibnite preserves separate financing instruments and zero inferred construction date", () => {
  const r = buildProjectEvidencePathway("prj-us-stibnite", input());
  const ids = r.financing.map(x=>x.id);
  assert.ok(ids.includes("fin-us-dod-perpetua-stibnite-dpa"));
  assert.ok(ids.includes("fin-us-exim-perpetua-stibnite-2026"));
  assert.equal(r.nativeMilestones.length, 0);
  assert.ok(r.financing.some(f=>f.legacyPhysicalObservations.some(s=>
    s.status==="construction" && s.statusDate===null)));
  assert.ok(r.typedEdges.every(e=>e.causalEffect==="not_asserted"));
  assert.ok(r.policyContexts.every(c=>c.context==="finance_or_designation_parent"));
  assert.equal(r.reviewGaps.absenceMeansInactivity,false);
});

test("F5-2: Narva's existing operational finance note cannot be promoted into a native project milestone", () => {
  const r=buildProjectEvidencePathway("prj-ee-neo-rare-earth-magnet-project",input());
  assert.ok(r.financing.find(x=>x.id==="fin-eu-jtf-2025-neo-magnet-project"));
  assert.equal(r.financing.length,1);
  assert.equal(r.financing[0].recipient,"NPM Narva OÜ");
  assert.ok(r.financing[0].legacyPhysicalObservations.some(s=>
    s.status==="operational" && s.statusDate==="2026-09-14"));
  assert.equal(r.nativeMilestones.length,0);
  assert.equal(r.reviewGaps.nativePhysical,"no_reviewed_milestones");
  assert.ok(r.reviewGaps.hasUnreviewedFinancialAmounts);
  assert.ok(r.project.sources.length>0);
});

test("F5-2: projection remains deterministic under reversed input and does not mutate caller", () => {
  const data=input(), baseline=JSON.stringify(data);
  const id="prj-us-stibnite";
  const a=buildProjectEvidencePathway(id,data);
  const b=buildProjectEvidencePathway(id,{
    events:[...data.events].reverse(), finances:[...data.finances].reverse(),
    controls:[...data.controls].reverse(), projects:[...data.projects].reverse(),
    designations:[...data.designations].reverse(), milestones:[...data.milestones].reverse(),
    sources:[...data.sources].reverse(),
  });
  assert.deepEqual(a,b);
  assert.equal(JSON.stringify(data),baseline);
  assert.deepEqual(a.financing.map(f=>f.id),[...a.financing.map(f=>f.id)].sort());
  assert.deepEqual(a.policyContexts.map(f=>f.id),[...a.policyContexts.map(f=>f.id)].sort());
});

test("F5-2: nonallocative association remains nonallocative and never authorizes money", () => {
  const data=input(), associated=data.finances.find(f=>f.associatedProjectIds?.length)!;
  assert.ok(associated && associated.associatedProjectIds?.length);
  const pid=associated.associatedProjectIds![0];
  const r=buildProjectEvidencePathway(pid,data);
  const f=r.financing.find(f=>f.id===associated.id)!;
  assert.ok(f);
  assert.equal(f.projectRelationship,"nonallocative_association");
  assert.equal(f.attributableAmountAuthorized,false);
  assert.ok(r.typedEdges.some(e=>e.kind==="nonallocative_finance_project_association" &&
    e.fromId===f.id && e.toId===pid && e.moneyAllocation==="nonallocative"));
  assert.ok(!r.typedEdges.some(e=>e.kind==="allocative_finance_project" &&
    e.fromId===f.id && e.toId===pid));
  assert.ok(!r.financePackageReferences.some(e=>e.projectMoneyAllocation!=="not_asserted"));
});

test("F5-2: government control clauses share the event context but do not become direct impacts", () => {
  const data=input();
  const grant=data.finances.find(f=>f.projectId && data.controls.some(c=>c.eventId===f.eventId));
  assert.ok(grant,"expect at least one event with both grant and controls");
  const r=buildProjectEvidencePathway(grant.projectId!,data);
  const parent=r.policyContexts.find(e=>e.id===grant.eventId)!;
  assert.ok(parent);
  const expected=data.controls.filter(c=>c.eventId===grant.eventId).map(x=>x.id).sort();
  assert.deepEqual(parent.coannouncedControlIds,expected);
  assert.ok(parent.coannouncedControlIds.every(id=>r.typedEdges.some(e=>
    e.kind==="event_control" && e.toId===id && e.fromId===grant.eventId)));
  assert.ok(!JSON.stringify(r).includes("policy_caused_project"));
  assert.equal(r.verifiedCausality,"not_asserted");
});

test("F5-2: synthetic reviewed milestone preserves reporter, event time, publication and reviewer clocks", () => {
  const d=input(),pid="prj-ee-neo-rare-earth-magnet-project",source=d.sources.find(s=>s.id==="src-neo-commercial-production-2026")!;
  const mil:ProjectMilestone={
    id:"mil-f5-fixture-narva-production",
    projectId:pid, kind:"production_reported",claimMode:"occurred",
    scope:"named_facility",scopeAsStated:"initial commercial magnet program",
    occurredOn:"2026-09-14",targetOn:null,
    sourceId:source.id,locator:"issuer release paragraph 1",
    statementOriginal:"F5 test-only synthetic assertion",
    statementEn:"F5 test-only synthetic assertion",statementEnSource:"na",
    reviewedBy:"fictional test reviewer only",reviewedAt:"2026-10-09",
  };
  const r=buildProjectEvidencePathway(pid,{...d,milestones:[...d.milestones,mil]});
  assert.equal(r.nativeMilestones.length,1);
  const m=r.nativeMilestones[0];
  assert.equal(m.claimMode,"occurred");
  assert.equal(m.occurredOn,"2026-09-14");
  assert.equal(m.targetOn,null);
  assert.equal(m.reviewedOn,"2026-10-09");
  assert.equal(m.evidence.publishedOn,source.datePublished);
  assert.equal(m.evidence.firstRegisteredAccessOn,source.dateAccessed);
  assert.equal(m.assertion,"reviewed_project_native");
  assert.equal(r.reviewGaps.nativePhysical,"reviewed_milestones_present");
  assert.ok(!r.financing[0].legacyPhysicalObservations.some(s=>s.status==="reviewed_project_native"));
});

test("F5-2: unknown project, nonexistent source, and broken event relationship all fail closed", () => {
  const d=input();
  assert.throws(()=>buildProjectEvidencePathway("prj-imaginary",d),/unknown project ID/);
  const mutated=input();
  mutated.finances[0].eventId="evt-nonexistent";
  assert.throws(()=>buildProjectEvidencePathway("prj-us-stibnite",mutated),/unresolved finance event/);
  const altered=input();
  altered.projects[0].evidence[0].sourceId="src-nonexistent";
  assert.throws(()=>buildProjectEvidencePathway(altered.projects[0].id,altered),/missing source/);
});

test("F5-2: source records and status evidence are individually inspectable without money sums", () => {
  const d=input(),path=buildProjectEvidencePathway("prj-us-stibnite",d);
  const known=new Map(d.sources.map(s=>[s.id,s]));
  for(const finance of path.financing) {
    for(const status of [...finance.financialStatuses,...finance.legacyPhysicalObservations]){
      assert.equal(status.evidence.url,known.get(status.evidence.id)?.url);
      assert.equal(status.evidence.publishedOn,known.get(status.evidence.id)?.datePublished??null);
    }
  }
  for(const c of path.policyContexts) {
    assert.ok(c.sourceRecords.length);
    assert.ok(c.sourceRecords.every(s=>known.has(s.id)));
  }
  for(const link of path.typedEdges) {
    assert.ok(link.evidence.length>0);
    assert.ok(link.evidence.every(s=>known.has(s.sourceId)));
  }
  assert.equal(path.historicalCapitalTotals,"not_authorized");
  assert.ok(path.limitations.some(s=>s.includes("histor")));
});
