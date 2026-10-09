import test from "node:test";
import assert from "node:assert/strict";

import {
  auditF5CasefileReadiness, F5_PILOT_PROJECT_IDS,
} from "@/lib/f5-casefile-readiness";
import type { PathwayInputs } from "@/lib/evidence-pathway-contract";
import type { ProjectMilestone } from "@/lib/types";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";

const TODAY = "2026-10-09";
const corpus = (): PathwayInputs => structuredClone({
  events: getAllEvents(),
  finances: getAllFinancialCommitments(),
  controls: getAllControlMeasures(),
  designations: getAllProjectDesignations(),
  projects: getAllProjects(),
  milestones: getAllProjectMilestones(),
  sources: getAllSources(),
});

function fixture(data: PathwayInputs, overrides: Partial<ProjectMilestone> = {}): ProjectMilestone {
  assert.ok(data.sources.some(s => s.id === "src-neo-commercial-production-2026"));
  return {
    id: "mil-f5-readiness-fixture-narva",
    projectId: "prj-ee-neo-rare-earth-magnet-project",
    kind: "production_reported",
    claimMode: "occurred",
    scope: "named_facility",
    scopeAsStated: "initial commercial magnet program (synthetic test only)",
    occurredOn: "2026-09-14",
    targetOn: null,
    sourceId: "src-neo-commercial-production-2026",
    locator: "test-only issuer release paragraph 1",
    statementOriginal: "Synthetic assertion for contract tests only",
    statementEn: "Synthetic assertion for contract tests only",
    statementEnSource: "na",
    reviewedBy: "synthetic fixture reviewer, NOT a real attestation",
    reviewedAt: TODAY,
    ...overrides,
  };
}

test("F5 readiness: the three actual pilot casefiles remain blocked without native milestones", () => {
  const data = corpus();
  const frozen = JSON.stringify(data);
  const report = auditF5CasefileReadiness(data, TODAY);
  assert.equal(report.schemaVersion, "f5-casefile-gate-1");
  assert.equal(report.view, "current_corpus_revision");
  assert.equal(report.validationCorpusCutoff, TODAY);
  assert.deepEqual(report.pilots.map(p => p.projectId), [...F5_PILOT_PROJECT_IDS]);
  assert.equal(report.allPilotsEligibleForManualQa, false);
  assert.equal(report.nextGate, "milestone_evidence_review");
  assert.equal(report.publicReleaseAuthorized, false);
  assert.equal(report.autonomousMilestoneApprovalAuthorized, false);
  assert.equal(report.inferredCausalityAuthorized, false);
  assert.equal(report.historicalFinancialTotalsAuthorized, false);
  assert.ok(report.pilots.every(p => p.registeredOccurredMilestones === 0));
  assert.ok(report.pilots.every(p => p.eligibleForManualQa === false));
  assert.ok(report.pilots.every(p => p.blockers.some(s => s.includes("project-native"))));
  assert.ok(report.pilots.some(p => p.legacyFinancePhysicalObservations > 0));
  assert.ok(!("amount" in report.pilots[0]));
  assert.equal(JSON.stringify(data), frozen, "read-only audit must not mutate seed");
});

test("F5 readiness: one synthetic structurally valid reviewed entry advances ONLY one pilot", () => {
  const data = corpus();
  const mil = fixture(data);
  const report = auditF5CasefileReadiness({...data, milestones: [mil]}, TODAY);
  const narva = report.pilots.find(p => p.projectId === mil.projectId)!;
  assert.equal(narva.registeredOccurredMilestones, 1);
  assert.equal(narva.occurredWithSourcePinpoint, 1);
  assert.equal(narva.eligibleForManualQa, true);
  assert.deepEqual(narva.blockers, []);
  assert.equal(report.pilots.filter(p => p.eligibleForManualQa).length, 1);
  assert.equal(report.allPilotsEligibleForManualQa, false);
  assert.equal(report.publicReleaseAuthorized, false);
});

test("F5 readiness: planned targets cannot clear an occurred milestone gate", () => {
  const data = corpus();
  const planned = fixture(data, {
    claimMode: "planned", occurredOn: null, targetOn: "2027-04-01",
  });
  const report = auditF5CasefileReadiness({...data, milestones: [planned]}, TODAY);
  const narva = report.pilots.find(p => p.projectId === planned.projectId)!;
  assert.equal(narva.registeredPlannedMilestones, 1);
  assert.equal(narva.registeredOccurredMilestones, 0);
  assert.equal(narva.eligibleForManualQa, false);
  assert.equal(report.publicReleaseAuthorized, false);
});

test("F5 readiness: an allowed null source locator still blocks external casefile QA", () => {
  const data = corpus();
  const mil = fixture(data, {locator: null});
  const report = auditF5CasefileReadiness({...data, milestones: [mil]}, TODAY);
  const narva = report.pilots.find(p => p.projectId === mil.projectId)!;
  assert.equal(narva.registeredOccurredMilestones, 1);
  assert.equal(narva.occurredWithSourcePinpoint, 0);
  assert.equal(narva.eligibleForManualQa, false);
  assert.ok(narva.blockers.some(s => s.includes("source locator")));
});

test("F5 readiness: invalid or unreviewed assertion metadata fails closed", () => {
  const data = corpus();
  assert.throws(() => auditF5CasefileReadiness({...data, milestones: [
    fixture(data, {reviewedBy: ""}),
  ]}, TODAY), /invalid published milestone contract/);
  assert.throws(() => auditF5CasefileReadiness({...data, milestones: [
    fixture(data, {occurredOn: "2026-10-10"}),
  ]}, TODAY), /after corpus cutoff|after reviewer date|later than/);
  assert.throws(() => auditF5CasefileReadiness({...data, milestones: [
    fixture(data, {scope: "whole_project", scopeAsStated: "incorrect broad scope"}),
  ]}, TODAY), /whole_project requires scopeAsStated: null/);
});

test("F5 readiness: no empty or duplicate pilots and no invented historical cutoff", () => {
  const data = corpus();
  assert.throws(() => auditF5CasefileReadiness(data, "2026-02-30"), /invalid corpus cutoff/);
  assert.throws(() => auditF5CasefileReadiness(data, TODAY, []), /nonempty and unique/);
  assert.throws(() => auditF5CasefileReadiness(data, TODAY, [
    "prj-us-stibnite", "prj-us-stibnite",
  ]), /nonempty and unique/);
  assert.throws(() => auditF5CasefileReadiness(data, TODAY, ["prj-not-real"]),
    /unknown project ID/);
});

test("F5 readiness: pilot order cannot affect report and cannot grant automatic release", () => {
  const data = corpus();
  const a = auditF5CasefileReadiness(data, TODAY, [...F5_PILOT_PROJECT_IDS].reverse());
  const b = auditF5CasefileReadiness(data, TODAY);
  assert.deepEqual(a, b);
  assert.equal(a.publicReleaseAuthorized, false);
  assert.ok(a.limitations.some(s => s.includes("maintainer signoff")));
});
