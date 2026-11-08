import test from "node:test";
import assert from "node:assert/strict";

import { buildCapitalExecution, dedupePhysicalEvidence } from "@/lib/capital-execution";
import { getFinancialCommitmentById, getProjectById } from "@/lib/data";
import { FINANCIAL_STATUSES, type FinancialCommitment, type FinancialStatus, type ImplementationStatus, type ProjectMilestone } from "@/lib/types";
import { site } from "@/lib/site";

const seed = getFinancialCommitmentById("fin-au-arafura-nolans-2025-equity")!;
const projectA = getProjectById("prj-au-nolans")!;
const projectB = getProjectById("prj-us-stibnite")!;
const src = seed.financialStatusHistory[0].sourceId;
const make = (
  id: string,
  projectId: string,
  status: FinancialStatus,
  physical?: ImplementationStatus,
): FinancialCommitment => ({
  ...structuredClone(seed),
  id,
  projectId,
  associatedProjectIds: undefined,
  relationships: [],
  providerJurisdiction: "us",
  providerOrgIds: [],
  financialStatusHistory: [{ status, date: "2026-09-01", sourceId: src, note: `${status} note` }],
  implementationStatusHistory: physical ? [{ status: physical, date: "2026-08-01", sourceId: src, note: null }] : [],
});

test("dedupePhysicalEvidence keeps one observation per source, status and date", () => {
  const out = dedupePhysicalEvidence([
    { financialId: "fin-a", sourceId: "s1", status: "construction", date: "2026-01-01" },
    { financialId: "fin-b", sourceId: "s1", status: "construction", date: "2026-01-01" },
    { financialId: "fin-b", sourceId: "s1", status: "construction", date: "2026-01-01" },
    { financialId: "fin-c", sourceId: "s1", status: "construction", date: null },
    { financialId: "fin-d", sourceId: "s2", status: "construction", date: "2026-01-01" },
  ]);
  assert.equal(out.length, 3);
  assert.deepEqual(out[0].financialIds, ["fin-a", "fin-b"]);
  assert.deepEqual(out.map((o) => o.sourceId), ["s1", "s1", "s2"]);
});

test("tiers separate reviewed milestones, financing-row status and no usable status", () => {
  const rows = [
    make("fin-fx-a", projectA.id, "contracted", "construction"),
    make("fin-fx-a2", projectA.id, "announced", "construction"),
    make("fin-fx-b", projectB.id, "contracted", "not_stated"),
  ];
  const plain = buildCapitalExecution("2026-10-07", rows, [projectA, projectB], []);
  const byId = new Map(plain.rows.map((r) => [r.id, r]));
  assert.equal(byId.get(projectA.id)!.tier, "financing_row_status");
  assert.equal(byId.get(projectA.id)!.observations.length, 1, "two rows citing one observation count once");
  assert.equal(byId.get(projectB.id)!.tier, "none", "not_stated is not physical evidence");

  const milestone = {
    id: "pms-fixture", projectId: projectB.id, kind: "production_reported", claimMode: "reported",
    scope: "project", scopeAsStated: null, occurredOn: "2026-09-01", targetOn: null, sourceId: src,
    locator: "p. 1", statementOriginal: "x", statementEn: "x", statementEnSource: "na",
    reviewedBy: "fixture", reviewedAt: "2026-10-01", note: null,
  } as unknown as ProjectMilestone;
  const reviewed = buildCapitalExecution("2026-10-07", rows, [projectA, projectB], [milestone]);
  const b = reviewed.rows.find((r) => r.id === projectB.id)!;
  assert.equal(b.tier, "reviewed_milestone");
  assert.equal(b.physical, plain.rows.find((r) => r.id === projectB.id)!.physical, "milestones never move the matrix");
});

test("conditional commitments are non-binding rows grouped in status order, and gaps follow the matrix", () => {
  const rows = [
    make("fin-fx-a", projectA.id, "contracted"),
    make("fin-fx-a2", projectA.id, "decided"),
    make("fin-fx-b", projectB.id, "announced", "construction"),
  ];
  const r = buildCapitalExecution("2026-10-07", rows, [projectA, projectB], []);
  assert.deepEqual(r.conditional.map((c) => c.financialId).sort(), ["fin-fx-a2", "fin-fx-b"]);
  assert.deepEqual(r.conditionalGroups.map((g) => g.status), ["announced", "decided"]);
  assert.equal(r.conditional.find((c) => c.financialId === "fin-fx-a2")!.projectHasBindingInstrument, true);
  assert.equal(r.conditional.find((c) => c.financialId === "fin-fx-a2")!.note, "decided note");
  assert.deepEqual(r.executionGaps.map((x) => x.id), [projectA.id]);
  assert.deepEqual(r.aheadOfBinding.map((x) => x.id), [projectB.id]);
  assert.equal(r.fundedGaps.length, 0);
});

test("live corpus capital-to-execution counts", () => {
  const r = buildCapitalExecution(site.lastUpdated);
  assert.equal(r.rows.length, r.response.governmentProjects);
  assert.equal(r.tierCounts.reviewed_milestone + r.tierCounts.financing_row_status + r.tierCounts.none, r.rows.length);
  assert.equal(r.tierCounts.none, r.response.noPhysicalRecordProjects - r.rows.filter((x) => x.physical === "no_record" && x.tier === "reviewed_milestone").length);
  assert.equal(r.tierCounts.reviewed_milestone, 2);
  // P3-02 moved Thompson Falls to construction_or_later.
  assert.equal(r.executionGaps.length, 13);
  assert.equal(r.fundedGaps.length, 3);
  assert.equal(r.aheadOfBinding.length, 2);
  assert.equal(r.conditional.length, 35);
  assert.equal(r.conditionalProjects, 27);
  for (const g of r.conditionalGroups) assert.ok(FINANCIAL_STATUSES.includes(g.status));
  for (const c of r.conditional) assert.ok(!["contracted", "partially_disbursed", "disbursed"].includes(c.status));
  for (const row of r.rows) assert.ok(row.observations.length <= row.physicalEvidence.length);
  const ucore = r.conditional.filter((c) => c.partOf === "fin-ca-g7-2025-ucore-package").map((c) => c.financialId).sort();
  assert.deepEqual(ucore, ["fin-ca-g7-2025-ucore-feddev", "fin-ca-g7-2025-ucore-nrcan"], "package components name their package");
});
