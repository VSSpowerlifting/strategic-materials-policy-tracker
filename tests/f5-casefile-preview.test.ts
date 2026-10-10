import test from "node:test";
import assert from "node:assert/strict";

import { buildF5EditorialCasefilePreview } from "@/lib/f5-casefile-preview";
import { F5_PILOT_PROJECT_IDS } from "@/lib/f5-casefile-readiness";
import type { PathwayInputs } from "@/lib/evidence-pathway-contract";
import type { ProjectMilestone } from "@/lib/types";
import { site } from "@/lib/site";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";

const corpus = (): PathwayInputs => structuredClone({
  events: getAllEvents(), finances: getAllFinancialCommitments(),
  controls: getAllControlMeasures(), designations: getAllProjectDesignations(),
  projects: getAllProjects(), milestones: getAllProjectMilestones(),
  sources: getAllSources(),
});

function artificialMilestone(overrides: Partial<ProjectMilestone> = {}): ProjectMilestone {
  return {
    id: "mil-f5-preview-synthetic-narva",
    projectId: "prj-ee-neo-rare-earth-magnet-project",
    kind: "production_reported",
    scope: "named_facility",
    scopeAsStated: "synthetic initial magnet production only",
    claimMode: "occurred",
    occurredOn: null,
    targetOn: null,
    sourceId: "src-neo-commercial-production-2026",
    locator: "TEST ONLY: synthetic review of issuer opening paragraph",
    statementOriginal: "Synthetic test claim only",
    statementEn: "Synthetic test claim only",
    statementEnSource: "na",
    reviewedBy: "synthetic test reviewer; NOT actual human review",
    reviewedAt: "2026-10-07",
    ...overrides,
  };
}

test("F5-3a: actual three pilot drafts are blocked and never serialized as public cases", () => {
  const data = corpus();
  const original = JSON.stringify(data);
  for (const projectId of F5_PILOT_PROJECT_IDS) {
    const draft = buildF5EditorialCasefilePreview(projectId, data, site.lastUpdated);
    assert.equal(draft.schemaVersion, "f5-editorial-casefile-preview-1");
    assert.equal(draft.project.id, projectId);
    assert.equal(draft.corpusCutoff, site.lastUpdated);
    assert.equal(draft.audience, "private_editorial_review_only");
    assert.equal(draft.publicReleaseAuthorized, false);
    assert.equal(draft.autonomouslyApprovedClaims, false);
    assert.equal(draft.policyCausalityAsserted, false);
    assert.equal(draft.historicalMoneyTotalsAuthorized, false);
    assert.equal(draft.readiness.eligibleForManualSourceAndBrowserQa, false);
    assert.ok(draft.readiness.blockers.some(x => x.includes("project-native")));
    assert.deepEqual(draft.lanes.physical.occurred, []);
    assert.deepEqual(draft.lanes.physical.planned, []);
    assert.equal(draft.lanes.physical.occurredEvidence, "no_approved_occurred_claims");
    assert.equal(draft.lanes.physical.absenceMeansInactivity, false);
    assert.ok(draft.project.evidence.length > 0);
  }
  assert.equal(JSON.stringify(data), original, "private preview must not mutate corpus");
});

test("F5-3a: financial, designation, and parent-policy lanes never invent capital or causality", () => {
  const draft = buildF5EditorialCasefilePreview(
    "prj-us-stibnite", corpus(), site.lastUpdated);
  assert.ok(draft.lanes.finance.length > 0);
  assert.ok(draft.lanes.policy.length > 0);
  for (const f of draft.lanes.finance) {
    assert.equal(f.allocationOrProjectCashSumAuthorized, false);
    assert.ok(["directly_attributable", "nonallocative_association"].includes(f.relationship));
    assert.ok(!("amount" in f), "no amounts appear in editorial preview finance objects");
    assert.ok(!("legacyPhysicalObservations" in f),
      "financier observations are counts only, not physical-status source claims");
    assert.ok(f.evidence.length > 0);
    for (const src of f.evidence) assert.match(src.url, /^https?:\/\//);
  }
  for (const p of draft.lanes.policy) {
    assert.equal(p.context, "finance_or_designation_parent");
    assert.ok(!("verifiedCausality" in p));
  }
  assert.ok(draft.lanes.designations.every(d => d.recognitionNotMoney));
  assert.ok(draft.lanes.financePackageReferences.every(p =>
    p.projectMoneyAllocation === "not_asserted"));
  assert.ok(draft.lanes.physical.legacyFinanceObservationsAwaitingReview >= 0);
  assert.ok(draft.limitations.some(x => x.includes("Coannounced controls")));
});

test("F5-3a: synthetically reviewed unknown-day production is not backdated to issuer day", () => {
  const data = corpus();
  const fake = artificialMilestone();
  assert.ok(data.sources.some(s => s.id === fake.sourceId));
  const draft = buildF5EditorialCasefilePreview(fake.projectId,
    {...data, milestones: [fake]}, site.lastUpdated);
  assert.equal(draft.lanes.physical.occurred.length, 1);
  assert.equal(draft.lanes.physical.planned.length, 0);
  const recorded = draft.lanes.physical.occurred[0];
  assert.equal(recorded.occurredOn, null);
  assert.equal(recorded.evidence.publishedOn, "2026-09-14");
  assert.equal(recorded.evidence.locator, fake.locator);
  assert.equal(recorded.reviewedOn, fake.reviewedAt);
  assert.equal(recorded.speakerStatementOriginal, fake.statementOriginal);
  assert.equal(draft.lanes.physical.occurredEvidence, "registered_reviewed_claims");
  assert.equal(draft.readiness.eligibleForManualSourceAndBrowserQa, true);
  assert.equal(draft.publicReleaseAuthorized, false,
    "synthetic structurally valid metadata cannot authorize a real public casefile");
});

test("F5-3a: unknown occurrence day sorts AFTER known dates, not as earliest", () => {
  const unknown = artificialMilestone();
  const dated = artificialMilestone({
    id: "mil-f5-preview-z-dated-narva",
    occurredOn: "2026-09-01",
  });
  const data = corpus();
  const draft = buildF5EditorialCasefilePreview(unknown.projectId,
    {...data, milestones: [unknown, dated]}, site.lastUpdated);
  assert.deepEqual(draft.lanes.physical.occurred.map(m => m.id),
    [dated.id, unknown.id], "null must not be treated as a timestamp before known dates");
  assert.equal(draft.lanes.physical.occurred[1].occurredOn, null);
  assert.equal(draft.publicReleaseAuthorized, false);
});

test("F5-3a: planned synthetic target never passes the occurred-claim gate", () => {
  const fake = artificialMilestone({
    claimMode: "planned", occurredOn: null, targetOn: "2027-04-01",
  });
  const draft = buildF5EditorialCasefilePreview(fake.projectId,
    {...corpus(), milestones: [fake]}, site.lastUpdated);
  assert.equal(draft.lanes.physical.occurred.length, 0);
  assert.equal(draft.lanes.physical.planned.length, 1);
  assert.equal(draft.lanes.physical.planned[0].targetOn, "2027-04-01");
  assert.equal(draft.lanes.physical.occurredEvidence, "no_approved_occurred_claims");
  assert.equal(draft.readiness.eligibleForManualSourceAndBrowserQa, false);
  assert.equal(draft.publicReleaseAuthorized, false);
});

test("F5-3a: invalid milestones and invented corpus cutoffs fail closed", () => {
  const data = corpus();
  assert.throws(() => buildF5EditorialCasefilePreview("prj-not-real", data,
    site.lastUpdated), /unknown project ID/);
  assert.throws(() => buildF5EditorialCasefilePreview(
    "prj-us-stibnite", data, "2026-02-30"), /invalid corpus cutoff/);
  assert.throws(() => buildF5EditorialCasefilePreview(
    "prj-ee-neo-rare-earth-magnet-project",
    {...data, milestones: [artificialMilestone({sourceId:"invented-source"})]},
    site.lastUpdated), /invalid published milestone contract/);
  assert.throws(() => buildF5EditorialCasefilePreview(
    "prj-ee-neo-rare-earth-magnet-project",
    {...data, milestones: [artificialMilestone({reviewedBy:""})]},
    site.lastUpdated), /invalid published milestone contract/);
});

test("F5-3a: registered seed order cannot change a draft, and there is no user-facing exposure", () => {
  const data = corpus();
  const projectId = "prj-au-alcoa-sojitz-gallium";
  const a = buildF5EditorialCasefilePreview(projectId, data, site.lastUpdated);
  const b = buildF5EditorialCasefilePreview(projectId, {
    ...data,
    finances: [...data.finances].reverse(),
    events: [...data.events].reverse(),
    sources: [...data.sources].reverse(),
  }, site.lastUpdated);
  assert.deepEqual(a, b);
  assert.equal(a.audience, "private_editorial_review_only");
  assert.equal(a.publicReleaseAuthorized, false);
});
