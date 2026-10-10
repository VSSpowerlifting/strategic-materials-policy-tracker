import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import type { PathwayInputs } from "@/lib/evidence-pathway-contract";
import type { ProjectMilestone } from "@/lib/types";
import {
  buildF5ObservatoryScaffold, formatF5ObservatoryScaffold,
  F5_OBSERVATORY_COHORT,
} from "@/lib/f5-observatory-scaffold";
import { site } from "@/lib/site";
import {
  getAllControlMeasures,getAllEvents,getAllFinancialCommitments,
  getAllProjectDesignations,getAllProjectMilestones,getAllProjects,getAllSources,
} from "@/lib/data";

const corpus=():PathwayInputs=>structuredClone({
  events:getAllEvents(),finances:getAllFinancialCommitments(),controls:getAllControlMeasures(),
  designations:getAllProjectDesignations(),projects:getAllProjects(),
  milestones:getAllProjectMilestones(),sources:getAllSources(),
});
const build=(data:PathwayInputs=corpus())=>buildF5ObservatoryScaffold(data,site.lastUpdated);

test("F5 Observatory: four exact pilot and comparator projects, internal only and missing milestones disclosed",()=>{
  const data=corpus(),frozen=JSON.stringify(data),r=build(data);
  assert.equal(r.schemaVersion,"f5-observatory-prepublication-1");
  assert.equal(r.audience,"internal_research_and_design");
  assert.equal(r.view,"current_corpus_revision");
  assert.equal(r.cohortSize,4);
  assert.equal(r.cases.length,4);
  assert.deepEqual(r.cases.map(c=>c.comparison.projectId),
    [...F5_OBSERVATORY_COHORT.map(c=>c.projectId)].sort());
  assert.deepEqual(r.cases.map(c=>c.comparison.track).filter(x=>x==="extended_comparator"),
    ["extended_comparator"]);
  assert.equal(r.curatedCorpusCutoff,site.lastUpdated);
  assert.equal(r.nextGate,"source_adjudication");
  assert.equal(r.sourceReviewedCasefilesReadyForManualQa,0);
  assert.equal(r.allCasefilesEligibleForManualQa,false);
  assert.equal(r.publicReleaseAuthorized,false);
  assert.equal(r.editorialClaimsAutomaticallyApproved,false);
  assert.equal(r.inferredCausalityAuthorized,false);
  assert.equal(r.attributableCapitalTotalsAuthorized,false);
  assert.equal(r.historicalAsOfAnalysisAuthorized,false);
  assert.equal(r.architecture.publicationRouteEnabled,false);
  assert.deepEqual(r.architecture.casefileLanes,
    ["policy","finance","designations","physical"]);
  assert.ok(r.cases.every(c=>c.comparison.registeredReviewedOccurredClaims===0));
  assert.ok(r.cases.every(c=>c.comparison.occurredEvidence==="no_approved_occurred_claims"));
  assert.ok(r.cases.every(c=>c.comparison.missingEvidenceDoesNotMeanFailure));
  assert.ok(r.cases.every(c=>c.comparison.blockers.some(x=>x.includes("project-native"))));
  assert.ok(r.cases.every(c=>c.draft.publicReleaseAuthorized===false));
  assert.deepEqual(getAllProjectMilestones(),[]);
  assert.equal(JSON.stringify(data),frozen,"scaffold must not modify public data");
});

test("F5 Observatory: every case has four noncausal lanes and a deduplicated source index",()=>{
  const r=build();
  assert.ok(r.cases.every(c=>c.sourceIndex.length>0));
  for(const c of r.cases){
    const m=c.comparison,d=c.draft;
    assert.equal(m.projectId,d.project.id);
    assert.equal(m.policyRecordReferences,d.lanes.policy.length);
    assert.equal(m.directFinancialInstrumentReferences+m.nonallocativeFinancialAssociations,
      d.lanes.finance.length);
    assert.equal(m.financialPackageReferences,d.lanes.financePackageReferences.length);
    assert.equal(m.designationReferences,d.lanes.designations.length);
    assert.equal(m.registeredReviewedOccurredClaims,d.lanes.physical.occurred.length);
    assert.equal(m.registeredReviewedPlannedClaims,d.lanes.physical.planned.length);
    assert.equal(m.allocationOrMonetaryTotalAuthorized,false);
    assert.equal(m.financialCausalityAuthorized,false);
    assert.ok(!("amount" in m) && !("projectCapitalTotal" in m));
    assert.ok(!("totalDisbursed" in d));
    assert.ok(d.lanes.finance.every(f=>
      f.allocationOrProjectCashSumAuthorized===false && !("amount" in f)));
    assert.ok(d.lanes.designations.every(x=>x.recognitionNotMoney));
    assert.ok(d.lanes.financePackageReferences.every(x=>x.projectMoneyAllocation==="not_asserted"));
    assert.ok(d.lanes.policy.every(x=>x.context==="finance_or_designation_parent"));
    assert.deepEqual(c.sourceIndex.map(x=>x.sourceId),
      [...new Set(c.sourceIndex.map(x=>x.sourceId))].sort());
    assert.ok(c.sourceIndex.every(x=>x.inLanes.length>0 &&
      x.inLanes.every(y=>["project","policy","finance","designation","physical"].includes(y))));
    assert.ok(c.sourceIndex.every(x=>/^https?:\/\//.test(x.url)));
  }
  assert.ok(r.cases.some(c=>c.comparison.unreviewedLegacyPhysicalObservations>0));
  assert.match(formatF5ObservatoryScaffold(r),/NOT AUTHORIZED/);
});

test("F5 Observatory: an artificial reviewed physical row advances only Narva to manual QA",()=>{
  const data=corpus();
  const synthetic:ProjectMilestone={
    id:"mil-f5-observatory-synthetic-narva",
    projectId:"prj-ee-neo-rare-earth-magnet-project",
    kind:"production_reported",claimMode:"occurred",
    scope:"named_facility",scopeAsStated:"synthetic Narva manufacturing scope",
    occurredOn:null,targetOn:null,sourceId:"src-neo-commercial-production-2026",
    locator:"TEST ONLY: issuer release opening",statementOriginal:"Synthetic only",
    statementEn:"Synthetic only",statementEnSource:"na",
    reviewedBy:"synthetic test reviewer; not an actual person",reviewedAt:"2026-10-07",
  };
  const r=build({...data,milestones:[synthetic]});
  const narva=r.cases.find(x=>x.comparison.projectId===synthetic.projectId)!;
  assert.equal(narva.comparison.registeredReviewedOccurredClaims,1);
  assert.equal(narva.comparison.manualSourceAndBrowserQaCandidate,true);
  assert.equal(narva.comparison.occurredEvidence,"registered_reviewed_claims");
  assert.equal(narva.draft.lanes.physical.occurred[0].occurredOn,null);
  assert.equal(narva.draft.lanes.physical.occurred[0].evidence.publishedOn,"2026-09-14");
  assert.ok(narva.sourceIndex.some(x=>x.sourceId===synthetic.sourceId&&x.inLanes.includes("physical")));
  assert.equal(r.sourceReviewedCasefilesReadyForManualQa,1);
  assert.equal(r.nextGate,"source_adjudication");
  assert.equal(r.publicReleaseAuthorized,false);
  assert.equal(getAllProjectMilestones().length,0);
});

test("F5 Observatory: failures and non-observation are not a proxy for success, delay or inactivity",()=>{
  const r=build();
  const serialized=JSON.stringify(r);
  assert.ok(!serialized.includes("projectSuccessScore"));
  assert.ok(!serialized.includes("policyImpactScore"));
  assert.ok(!serialized.includes("attributableUsdTotal"));
  assert.ok(r.limitations.some(x=>x.includes("not a historical")));
  assert.ok(r.limitations.some(x=>x.includes("not establish real-world industrial inactivity")));
  assert.ok(r.requiredHumanChecks.some(x=>x.includes("mobile, tablet and desktop")));
  assert.ok(r.requiredHumanChecks.some(x=>x.includes("Keyboard navigation")));
  assert.ok(r.requiredHumanChecks.some(x=>x.includes("Maintainer explicitly approves")));
});

test("F5 Observatory: determinism across reordered seed and cohort inputs",()=>{
  const c=corpus(),frozen=JSON.stringify(c);
  const normal=buildF5ObservatoryScaffold(c,site.lastUpdated,F5_OBSERVATORY_COHORT);
  const reversed=buildF5ObservatoryScaffold({
    events:[...c.events].reverse(),finances:[...c.finances].reverse(),
    controls:[...c.controls].reverse(),designations:[...c.designations].reverse(),
    projects:[...c.projects].reverse(),milestones:[...c.milestones].reverse(),
    sources:[...c.sources].reverse(),
  },site.lastUpdated,[...F5_OBSERVATORY_COHORT].reverse());
  assert.deepEqual(reversed,normal);
  assert.equal(JSON.stringify(c),frozen);
  assert.equal(formatF5ObservatoryScaffold(reversed),formatF5ObservatoryScaffold(normal));
});

test("F5 Observatory: reject duplicate/unknown project, future claims, invalid cutoff or invented QA authority",()=>{
  const c=corpus();
  assert.throws(()=>buildF5ObservatoryScaffold(c,"2026-02-30"),/invalid corpus cutoff/);
  assert.throws(()=>buildF5ObservatoryScaffold(c,site.lastUpdated,[]),/cohort must use/);
  assert.throws(()=>buildF5ObservatoryScaffold(c,site.lastUpdated,
    [F5_OBSERVATORY_COHORT[0],F5_OBSERVATORY_COHORT[0]]),/cohort must use/);
  assert.throws(()=>buildF5ObservatoryScaffold(c,site.lastUpdated,
    [{projectId:"prj-does-not-exist",track:"initial_pilot",researchQuestion:"test"}]),
    /unknown project ID/);
  assert.throws(()=>buildF5ObservatoryScaffold(c,site.lastUpdated,
    [{projectId:F5_OBSERVATORY_COHORT[0].projectId,track:"unknown" as "initial_pilot",
      researchQuestion:"test"}]),/cohort must use/);
  const invalid:ProjectMilestone={
    id:"mil-f5-bad",projectId:"prj-ee-neo-rare-earth-magnet-project",
    kind:"production_reported",claimMode:"occurred",
    scope:"named_facility",scopeAsStated:"synthetic",
    occurredOn:"2026-10-10",targetOn:null,
    sourceId:"src-neo-commercial-production-2026",locator:"synthetic",
    statementOriginal:"synthetic",statementEn:"synthetic",statementEnSource:"na",
    reviewedBy:"synthetic",reviewedAt:"2026-10-09",
  };
  assert.throws(()=>build({...c,milestones:[invalid]}),/invalid published milestone contract/);
  assert.equal(getAllProjectMilestones().length,0);
});

test("F5 Observatory CLI: JSON, readable summary and strict reviewer gate; reject publication flags",()=>{
  const cli=["--import","tsx","scripts/audit-f5-observatory.ts"];
  const json=execFileSync(process.execPath,[...cli,"--json"],{encoding:"utf8"});
  assert.deepEqual(JSON.parse(json),build());
  const human=execFileSync(process.execPath,cli,{encoding:"utf8"});
  assert.equal(human,formatF5ObservatoryScaffold(build()));
  assert.match(human,/INTERNAL PREPUBLICATION SCAFFOLD/);
  const project="prj-us-usac-thompson-falls-expansion";
  const one=execFileSync(process.execPath,[...cli,"--json","--project",project],{encoding:"utf8"});
  const parsed=JSON.parse(one);
  assert.equal(parsed.cohortSize,4,"one-project selector cannot hide total cohort coverage");
  assert.equal(parsed.cases.length,1);
  assert.equal(parsed.cases[0].comparison.projectId,project);
  assert.equal(parsed.publicReleaseAuthorized,false);
  const strict=spawnSync(process.execPath,[...cli,"--strict","--json"],{encoding:"utf8"});
  assert.equal(strict.status,1,"strict reviewer gate must be nonzero while four cases unreviewed");
  assert.deepEqual(JSON.parse(strict.stdout),build());
  for(const bad of [["--publish"],["--approve"],["--json","--json"],["--project"],["--project","not-an-id"]]){
    const out=spawnSync(process.execPath,[...cli,...bad],{encoding:"utf8"});
    assert.equal(out.status,2,bad.join(" "));
    assert.match(out.stderr,/Usage: npm run audit:f5-observatory/);
    assert.equal(out.stdout,"");
  }
  const outsider=spawnSync(process.execPath,[...cli,"--project","prj-unknown-project"],{encoding:"utf8"});
  assert.equal(outsider.status,1);
  assert.match(outsider.stderr,/outside the approved internal Observatory cohort/);
  assert.equal(outsider.stdout,"");
});
