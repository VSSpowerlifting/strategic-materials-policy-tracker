import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

import { buildF5ComparativeCoverage } from "@/lib/f5-comparative-coverage";
import { buildIndustrialResponse } from "@/lib/industrial-response";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";
import { site } from "@/lib/site";
import type { PathwayInputs } from "@/lib/evidence-pathway-contract";

function corpus(): PathwayInputs {
  return structuredClone({
    events: getAllEvents(), finances: getAllFinancialCommitments(),
    controls: getAllControlMeasures(), projects: getAllProjects(),
    designations: getAllProjectDesignations(), milestones: getAllProjectMilestones(),
    sources: getAllSources(),
  });
}

test("F5-4a registry-wide denominators and /response project parity are explicit", () => {
  const d = corpus(), r = buildF5ComparativeCoverage(d, site.lastUpdated);
  const response = buildIndustrialResponse(site.lastUpdated, d.finances, d.projects);
  assert.equal(r.schemaVersion, "f5-4a");
  assert.equal(r.publicReleaseAuthorized, false);
  assert.equal(r.capitalTotalsAuthorized, false);
  assert.equal(r.causalEffectAuthorized, false);
  assert.equal(r.historicalPhysicalAsOfAuthorized, false);
  assert.equal(r.cohort.distinctSelectedProjects, d.projects.length);
  assert.equal(r.counts.publicResponseEligibleGovernmentProjects, response.governmentProjects);
  assert.equal(r.counts.publicResponseBindingProjects, response.bindingProjects);
  assert.equal(r.counts.publicResponseLegacyReportedConstructionOrLater, response.reportedExecutionProjects);
  assert.deepEqual(r.projects.filter(p => p.publicResponseAtCutoff.eligibleGovernmentProject)
    .map(p => p.projectId).sort(), response.rows.map(p => p.id).sort());
  assert.equal(new Set(r.projects.map(p => p.projectId)).size, d.projects.length);
  assert.equal(r.counts.withoutNativeReviewedMilestone, d.projects.length - 1);
  assert.ok(r.counts.withNativeOccurredMilestone>=1);
  assert.ok(r.counts.withUnreviewedLegacyPhysicalObservation > 0);
  assert.ok(r.projects.every(p => p.lackOfNativeMilestonesMeansInactivity === false));
});

test("F5-4a multi-material project appears twice by material but once in cohort", () => {
  const d = corpus(), p = d.projects.find(p => p.materialIds.length === 1)!;
  const second = d.projects.flatMap(q => q.materialIds).find(id => !p.materialIds.includes(id))!;
  assert.ok(second);
  p.materialIds.push(second);
  const r = buildF5ComparativeCoverage(d, site.lastUpdated);
  assert.equal(r.cohort.distinctSelectedProjects, d.projects.length);
  assert.equal(r.projects.find(row => row.projectId === p.id)?.materialIds.length, 2);
  assert.ok(r.byMaterial.find(m => m.materialId === p.materialIds[0])?.projectIds.includes(p.id));
  assert.ok(r.byMaterial.find(m => m.materialId === second)?.projectIds.includes(p.id));
  assert.ok(r.byMaterial.reduce((n, x) => n + x.projects, 0) >= d.projects.length);
  const filtered = buildF5ComparativeCoverage(d, site.lastUpdated, { materialId: second });
  assert.equal(filtered.cohort.distinctSelectedProjects,
    filtered.projects.filter(row => row.materialIds.includes(second)).length);
});

test("F5-4a nonallocative links never qualify as direct support or duplicate projects", () => {
  const d = corpus();
  const f = d.finances.find(f => f.associatedProjectIds?.length)!;
  assert.ok(f);
  const pid = f.associatedProjectIds![0];
  f.associatedProjectIds!.push(pid);
  const r = buildF5ComparativeCoverage(d, site.lastUpdated);
  const project = r.projects.find(p => p.projectId === pid)!;
  const association = project.financing.filter(x =>
    x.id === f.id && x.relationship === "nonallocative_association");
  assert.equal(association.length, 1);
  assert.ok(association[0].projectLinkSourceIds.length > 0);
  assert.ok(!project.financing.some(x => x.id === f.id && x.relationship === "direct"));
  assert.equal(r.cohort.distinctSelectedProjects, d.projects.length);
});

test("F5-4a records government indications separately from public /response eligibility", () => {
  const d = corpus();
  const f = d.finances.find(f => f.projectId && f.providerJurisdiction &&
    f.valueRole === "commitment")!;
  assert.ok(f);
  f.valueRole = "indication";
  const r = buildF5ComparativeCoverage(d, site.lastUpdated);
  const row = r.projects.find(p => p.projectId === f.projectId)!;
  assert.equal(row.financing.find(x => x.id === f.id)?.valueRole, "indication");
  assert.equal(row.financing.find(x => x.id === f.id)?.relationship, "direct");
  assert.equal(r.counts.publicResponseEligibleGovernmentProjects,
    buildIndustrialResponse(site.lastUpdated, d.finances, d.projects).governmentProjects);
  assert.equal(r.counts.withDirectGovernmentCommitmentReference,
    r.projects.filter(p => p.financing.some(x =>
      x.relationship === "direct" && x.providerJurisdiction !== null && x.valueRole === "commitment")).length);
});

test("F5-4a provider filter includes associations but calls them nonallocative", () => {
  const d = corpus();
  const f = d.finances.find(f => f.associatedProjectIds?.length && f.providerJurisdiction)!;
  assert.ok(f);
  const r = buildF5ComparativeCoverage(d, site.lastUpdated,
    { providerJurisdiction: f.providerJurisdiction! });
  assert.ok(r.projects.some(p => p.projectId === f.associatedProjectIds![0]));
  assert.ok(r.projects.every(p => p.financing.some(x =>
    x.providerJurisdiction === f.providerJurisdiction)));
  assert.equal(new Set(r.projects.map(p => p.projectId)).size, r.projects.length);
});

test("F5-4a milestone mode and separate clocks survive synthetic source-reviewed fixtures", () => {
  const d = corpus(), p = d.projects[0], src = d.sources[0];
  const fixture = {
    id: "mil-fixture-reviewed-occurrence", projectId: p.id,
    kind: "construction_started", claimMode: "occurred", scope: "named_facility",
    scopeAsStated: "synthetic fixture", occurredOn: "2026-01-01", targetOn: null,
    sourceId: src.id, locator: "fixture", statementOriginal: "Fixture",
    statementEn: "Fixture", statementEnSource: "na",
    reviewedBy: "synthetic tester", reviewedAt: "2026-10-01",
  } as const;
  const r = buildF5ComparativeCoverage(
    { ...d, milestones: [...d.milestones, fixture] }, "2026-02-01");
  const row = r.projects.find(row => row.projectId === p.id)!;
  assert.deepEqual(row.nativeOccurredMilestoneIds, [...new Set([...d.milestones.filter(m=>m.projectId===p.id&&m.claimMode==="occurred").map(m=>m.id),"mil-fixture-reviewed-occurrence"])].sort());
  assert.deepEqual(row.nativePlannedMilestoneIds, []);
  assert.ok(row.structuralSourceIds.includes(src.id));
  assert.equal(r.counts.withNativeOccurredMilestone, 1);
  assert.equal(r.historicalPhysicalAsOfAuthorized, false,
    "even an earlier legal query must not backdate a reviewed milestone");
});

test("F5-4a all project/edge/current finance source citations must resolve", () => {
  const d = corpus();
  const before = JSON.stringify(d);
  const a = buildF5ComparativeCoverage(d, site.lastUpdated);
  assert.equal(JSON.stringify(d), before, "audit must never mutate corpus");
  const sourceIds = new Set(d.sources.map(s => s.id));
  assert.ok(a.projects.every(p => p.structuralSourceIds.every(id => sourceIds.has(id))));
  assert.ok(a.projects.every(p => p.financing.every(f =>
    f.projectLinkSourceIds.every(id => sourceIds.has(id)) &&
    (f.currentFinancialStatus === null || sourceIds.has(f.currentFinancialStatus.sourceId)))));
  const reverse = {
    events: [...d.events].reverse(), finances: [...d.finances].reverse(),
    controls: [...d.controls].reverse(), projects: [...d.projects].reverse(),
    designations: [...d.designations].reverse(), milestones: [...d.milestones].reverse(),
    sources: [...d.sources].reverse(),
  };
  assert.deepEqual(a, buildF5ComparativeCoverage(reverse, site.lastUpdated));
  const broken = corpus();
  broken.projects[0].evidence[0].sourceId = "src-imaginary";
  assert.throws(() => buildF5ComparativeCoverage(broken, site.lastUpdated),
    /unresolved project source/);
});

test("F5-4a CLI rejects invalid filter, prints read-only summary and JSON contract", () => {
  const base = ["--import", "tsx", "scripts/audit-f5-coverage.ts"];
  const res = execFileSync(process.execPath, [...base, "--json"],
    { cwd: process.cwd(), encoding: "utf8" });
  const report = JSON.parse(res);
  assert.equal(report.schemaVersion, "f5-4a");
  assert.equal(report.publicReleaseAuthorized, false);
  const brief = execFileSync(process.execPath, base, { cwd: process.cwd(), encoding: "utf8" });
  assert.ok(brief.includes("Unique project denominator"));
  assert.ok(brief.includes("No capital totals"));
  const bad = spawnSync(process.execPath, [...base, "--provider", "moon"],
    { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Unknown provider/);
});

test("F5-4b optional horizon separates publisher and SMPT access clocks, without rewriting cohorts", () => {
  const d = corpus();
  const ordinary = buildF5ComparativeCoverage(d, site.lastUpdated);
  const project = ordinary.projects.find(p => p.structuralSourceIds.length >= 2)!;
  assert.ok(project);
  const a = d.sources.find(s => s.id === project.structuralSourceIds[0])!;
  const b = d.sources.find(s => s.id === project.structuralSourceIds[1])!;
  a.datePublished = "2020-01-01";
  a.dateAccessed = "2026-10-01"; // published before the horizon; recorded access afterward
  b.datePublished = null;
  b.dateAccessed = "2020-01-01"; // access recorded before; publication day unknown
  const report = buildF5ComparativeCoverage(d, site.lastUpdated, {}, "2024-01-01");
  const row = report.projects.find(p => p.projectId === project.projectId)!;
  assert.equal(report.cohort.distinctSelectedProjects, ordinary.cohort.distinctSelectedProjects);
  assert.deepEqual(report.projects.map(p => p.projectId), ordinary.projects.map(p => p.projectId));
  assert.ok(row.sourceHorizon?.publishedOnOrBeforeSourceIds.includes(a.id));
  assert.ok(row.sourceHorizon?.accessedAfterSourceIds.includes(a.id));
  assert.ok(row.sourceHorizon?.publicationDateUnknownSourceIds.includes(b.id));
  assert.ok(row.sourceHorizon?.accessedOnOrBeforeSourceIds.includes(b.id));
  assert.equal(row.sourceHorizon?.historicalKnownAsOfAuthorized, false);
  assert.equal(report.selectedCohortSourceHorizon?.historicalKnownAsOfAuthorized, false);
  assert.equal(report.historicalPhysicalAsOfAuthorized, false);
});

test("F5-4b source coverage is provenance-addressable and deduplicated across shared sources", () => {
  const d = corpus();
  const horizon = buildF5ComparativeCoverage(d, site.lastUpdated, {}, "2026-01-01");
  const union = [...new Set(horizon.projects.flatMap(p => p.structuralSourceIds))].sort();
  const global = horizon.selectedCohortSourceHorizon!;
  assert.deepEqual(global.distinctSourceIds, union);
  assert.equal(global.publishedOnOrBeforeSourceIds.length + global.publishedAfterSourceIds.length +
    global.publicationDateUnknownSourceIds.length, union.length);
  assert.equal(global.accessedOnOrBeforeSourceIds.length + global.accessedAfterSourceIds.length, union.length);
  assert.ok(global.distinctSourceIds.length <= horizon.projects.reduce(
    (n, p) => n + p.structuralSourceIds.length, 0));
  assert.ok(horizon.projects.every(p => p.sourceHorizon?.horizon === "2026-01-01"));
  const material = d.projects[0].materialIds[0];
  const filtered = buildF5ComparativeCoverage(d, site.lastUpdated, { materialId: material }, "2026-01-01");
  assert.deepEqual(filtered.selectedCohortSourceHorizon?.distinctSourceIds,
    [...new Set(filtered.projects.flatMap(p => p.structuralSourceIds))].sort());
  assert.ok(filtered.selectedCohortSourceHorizon!.distinctSourceIds.length <= union.length);
});

test("F5-4b source horizon is opt-in, deterministic, and rejects impossible dates", () => {
  const d = corpus();
  const original = JSON.stringify(d);
  const report = buildF5ComparativeCoverage(d, site.lastUpdated, {}, "2026-05-10");
  assert.equal(JSON.stringify(d), original);
  assert.deepEqual(report, buildF5ComparativeCoverage({
    events: [...d.events].reverse(), finances: [...d.finances].reverse(),
    controls: [...d.controls].reverse(), projects: [...d.projects].reverse(),
    designations: [...d.designations].reverse(), milestones: [...d.milestones].reverse(),
    sources: [...d.sources].reverse(),
  }, site.lastUpdated, {}, "2026-05-10"));
  assert.equal(buildF5ComparativeCoverage(d, site.lastUpdated).selectedCohortSourceHorizon, null);
  assert.ok(buildF5ComparativeCoverage(d, site.lastUpdated).projects.every(p => p.sourceHorizon === null));
  for (const invalid of ["2026-02-30", "2026-13-01", "October 2026", "2026-01-1"]) {
    assert.throws(() => buildF5ComparativeCoverage(d, site.lastUpdated, {}, invalid),
      /invalid ISO calendar date/);
  }
  assert.throws(() => buildF5ComparativeCoverage(d, "2026-02-30"), /invalid ISO calendar date/);
});

test("F5-4b CLI exposes source horizon without conflating with legal as-of", () => {
  const cmd = ["--import", "tsx", "scripts/audit-f5-coverage.ts"];
  const result = JSON.parse(execFileSync(process.execPath,
    [...cmd, "--json", "--source-horizon", "2024-06-01"],
    { cwd: process.cwd(), encoding: "utf8" }));
  assert.equal(result.publicResponseLegalAsOf, site.lastUpdated);
  assert.equal(result.sourceObservationHorizon, "2024-06-01");
  assert.ok(result.selectedCohortSourceHorizon.distinctSourceIds.length > 0);
  assert.equal(result.selectedCohortSourceHorizon.historicalKnownAsOfAuthorized, false);
  const text = execFileSync(process.execPath, [...cmd, "--source-horizon", "2024-06-01"],
    { cwd: process.cwd(), encoding: "utf8" });
  assert.match(text, /Source horizon/);
  assert.match(text, /NOT historical knowledge/);
  const bad = spawnSync(process.execPath, [...cmd, "--source-horizon", "2024-02-31"],
    { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /invalid ISO calendar date/);
});
