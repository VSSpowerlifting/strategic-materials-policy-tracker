import test from "node:test";
import assert from "node:assert/strict";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { validateProjectMilestones } from "../lib/project-milestones";
import { PROJECT_MILESTONE_SCOPES, type ProjectMilestone } from "../lib/types";
import { auditProjectExecutionPilot } from "../scripts/review-project-execution-pilot";
import { getAllFinancialCommitments, getAllProjects, getAllSources, getAllProjectMilestones } from "../lib/data";
import { site } from "../lib/site";

const source = {
  id: "src-workstream-fixture", language: "en" as const, confidence: "primary" as const,
  datePublished: "2026-06-01", dateAccessed: "2026-10-02",
};
const refs = {
  projects: [{ id: "prj-stibnite-fixture" }], sources: [source], corpusDate: "2026-10-09",
};
const physical = (patch: Partial<ProjectMilestone> = {}): ProjectMilestone => ({
  id: "mil-workstream-fixture", projectId: "prj-stibnite-fixture", kind: "construction_started",
  claimMode: "occurred", scope: "bounded_project_workstream",
  scopeAsStated: "Burntlog Route site-access construction at Stibnite",
  occurredOn: "2026-05-30", targetOn: null, sourceId: source.id,
  locator: "Issuer June 1 release, project update",
  statementOriginal: "Additional access-road construction began on May 30.",
  statementEn: "Additional access-road construction began on May 30.",
  statementEnSource: "na", reviewedBy: "Human Reviewer", reviewedAt: "2026-10-08",
  note: "Source limits this assertion to access infrastructure, not the complete mine.",
  ...patch,
});

test("bounded project workstream is one canonical, source-qualified construction scope", () => {
  assert.equal(PROJECT_MILESTONE_SCOPES.filter(x => x === "bounded_project_workstream").length, 1);
  assert.deepEqual(validateProjectMilestones([physical()], refs), []);
  assert.deepEqual(validateProjectMilestones([physical({
    scopeAsStated: "early works activities at Stibnite, components not fully specified",
    occurredOn: "2025-10-21",
  })], { ...refs, sources: [{ ...source, datePublished: "2025-10-21" }] }), []);
  assert.deepEqual(getAllProjectMilestones().map(x => x.id), ["mil-au-alcoa-wagerup-groundbreaking-2026-08-24"], "contract tests cannot add another milestone");
});

test("workstream scope rejects output, operating status, commissioning and funded-work completion", () => {
  for (const kind of [
    "production_reported", "operations_started", "commissioning_started",
    "project_cancelled", "operations_suspended", "funded_activity_completed",
  ] as const) {
    const issues = validateProjectMilestones([physical({ kind })], refs).join(" | ");
    assert.match(issues, /bounded_project_workstream permits only scoped construction kinds/, kind);
  }
  for (const scopeAsStated of [null, "", "   "]) {
    const issues = validateProjectMilestones([physical({ scopeAsStated })], refs).join(" | ");
    assert.match(issues, /explicit scopeAsStated/, String(scopeAsStated));
  }
  assert.deepEqual(validateProjectMilestones([physical({ scope: "named_facility" })], refs), [],
    "existing named-facility evidence stays valid");
});

test("workstream construction progress remains undated, occurred and caveated", () => {
  const progress = physical({
    kind: "construction_progress_reported", occurredOn: null,
    note: "Company reports limited road construction progress; no full-project start or completion.",
  });
  assert.deepEqual(validateProjectMilestones([progress], refs), []);
  assert.match(validateProjectMilestones([{
    ...progress, occurredOn: "2026-05-30",
  }], refs).join(" | "), /requires occurredOn: null/);
  assert.match(validateProjectMilestones([{
    ...progress, note: null,
  }], refs).join(" | "), /requires a scoped status caveat/);
  assert.match(validateProjectMilestones([{
    ...progress, claimMode: "planned", targetOn: "2027-01-01",
  }], refs).join(" | "), /requires an occurred observation/);
});

test("future Stibnite queue taxonomy migration cannot silently sign reviews or clear holds", () => {
  const draft = structuredClone(queue);
  const early = draft.find(x => x.id === "review-m3-2-stibnite-early-works")!;
  const road = draft.find(x => x.id === "review-m3-2-stibnite-burntlog")!;
  early.scopeProposal = "bounded_project_workstream";
  early.scopeAsStated = "early works construction at Stibnite; full-project sanction not established";
  road.scopeProposal = "bounded_project_workstream";
  const context = {
    projects: getAllProjects(), sources: getAllSources(),
    commitments: getAllFinancialCommitments(), corpusCutoff: site.lastUpdated,
  };
  const report = auditProjectExecutionPilot(draft, context);
  assert.deepEqual(report.errors, []);
  assert.equal(report.summary.blockedOnTaxonomy, 3);
  assert.equal(early.gate, "taxonomy_blocked");
  assert.equal(road.gate, "taxonomy_blocked");
  assert.equal(early.reviewVerdict, "unreviewed");
  assert.equal(road.reviewVerdict, "unreviewed");
  assert.deepEqual(getAllProjectMilestones().map(x => x.id), ["mil-au-alcoa-wagerup-groundbreaking-2026-08-24"]);
  const illegal = structuredClone(draft);
  illegal.find(x => x.id === early.id)!.kindProposal = "production_reported";
  assert.match(auditProjectExecutionPilot(illegal, context).errors.join(" | "),
    /bounded_project_workstream permits only scoped construction kinds/);
});
