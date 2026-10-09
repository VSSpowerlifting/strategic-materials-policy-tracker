import test from "node:test";
import assert from "node:assert/strict";

import { getAllFinancialCommitments, getAllProjects, getFinancialCommitmentById, getProjectById } from "@/lib/data";
import {
  buildIndustrialResponse,
  FUNDED_ACTIVITY_ONLY_PROJECT_ID,
  FINANCE_ROWS,
  PHYSICAL_COLUMNS,
  matrixKey,
} from "@/lib/industrial-response";
import { site } from "@/lib/site";
import type { FinancialCommitment, FinancialStatus, ImplementationStatus } from "@/lib/types";

const seed = getFinancialCommitmentById("fin-au-arafura-nolans-2025-equity")!;
const projectA = getProjectById("prj-au-nolans")!;
const projectB = getProjectById("prj-us-stibnite")!;
const originalSource = seed.financialStatusHistory[0].sourceId;
const make = (
  id: string,
  projectId: string | null,
  status: FinancialStatus = "announced",
  statusDate = "2026-09-01",
  physical?: ImplementationStatus,
): FinancialCommitment => ({
  ...structuredClone(seed),
  id,
  projectId,
  associatedProjectIds: undefined,
  relationships: [],
  providerJurisdiction: "us",
  providerOrgIds: [],
  financialStatusHistory: [{ status, date: statusDate, sourceId: originalSource, note: null }],
  implementationStatusHistory: physical
    ? [{ status: physical, date: null, sourceId: originalSource, note: null }]
    : [],
});

test("industrial-response denominator requires an evidenced, active public commitment with an attributable project", () => {
  const countable = make("fin-fixture-count", projectA.id, "contracted");
  const shared = make("fin-fixture-shared", null, "contracted");
  shared.associatedProjectIds = [projectA.id, projectB.id];
  const privateRow = make("fin-fixture-private", projectB.id, "contracted");
  privateRow.providerJurisdiction = null;
  const envelope = make("fin-fixture-envelope", projectB.id, "authorized");
  envelope.valueRole = "program_envelope";
  const ended = make("fin-fixture-ended", projectB.id, "withdrawn");
  const future = make("fin-fixture-future", projectB.id, "contracted", "2026-10-10");
  const result = buildIndustrialResponse("2026-10-07", [countable, shared, privateRow, envelope, ended, future], [projectA, projectB]);

  assert.equal(result.registryProjects, 2);
  assert.equal(result.governmentProjects, 1);
  assert.deepEqual(result.rows.map((r) => r.id), [projectA.id]);
  assert.equal(result.rows[0].finance, "binding");
  assert.equal(result.associatedButNotAllocatedLinks, 2);
  assert.equal(result.projectlessGovernmentRows, 1, "shared commitment stays unallocated");
  assert.equal(result.bindingProjects, 1);
  assert.equal(result.fundedProjects, 0, "signed is not paid");
});

test("the financial axis respects the evidence date, not a future contract or present-day status", () => {
  const row = make("fin-fixture-history", projectA.id, "announced", "2026-09-01");
  row.financialStatusHistory.push({ status: "contracted", date: "2026-10-09", sourceId: originalSource, note: null });
  const before = buildIndustrialResponse("2026-10-07", [row], [projectA]);
  const after = buildIndustrialResponse("2026-10-10", [row], [projectA]);

  assert.equal(before.rows[0].finance, "binding_not_evidenced");
  assert.equal(before.rows[0].financeDetail, "not_yet_binding");
  assert.deepEqual(before.rows[0].financialEvidence.map((e) => e.status), ["announced"]);
  assert.equal(after.rows[0].finance, "binding");
  assert.deepEqual(after.rows[0].financialEvidence.map((e) => e.status), ["contracted"]);
});

test("physical project activity is independent from the funding row and missing physical status stays unknown", () => {
  const government = make("fin-fixture-gov", projectA.id, "decided");
  const construction = make("fin-fixture-physical", projectA.id, "announced", "2026-09-01", "construction");
  construction.providerJurisdiction = null;
  construction.capitalSource = "private";
  const res = buildIndustrialResponse("2026-10-07", [government, construction], [projectA]);
  assert.equal(res.rows[0].finance, "binding_not_evidenced");
  assert.equal(res.rows[0].physical, "construction_or_later");
  assert.equal(res.rows[0].strictConstruction, true);
  assert.deepEqual(res.rows[0].physicalEvidence.map((e) => e.financialId), [construction.id]);
  assert.equal(res.rows[0].financialEvidence.length, 1, "a private row cannot count as a government commitment");
  const noPhysical = buildIndustrialResponse("2026-10-07", [government], [projectA]);
  assert.equal(noPhysical.rows[0].physical, "no_record");
  assert.equal(noPhysical.noPhysicalRecordProjects, 1);
  const unclear = make("fin-fixture-unclear", projectA.id, "not_stated", "2026-09-01", "not_stated");
  assert.equal(buildIndustrialResponse("2026-10-07", [unclear], [projectA]).rows[0].physical, "no_record");
});

test("funded activity completion is shown but not interpreted as independent facility construction", () => {
  const plant = getProjectById(FUNDED_ACTIVITY_ONLY_PROJECT_ID)!;
  const row = getFinancialCommitmentById("fin-ca-cmrdd-2024-cyclic-materials")!;
  const result = buildIndustrialResponse("2026-10-07", [row], [plant]);
  assert.equal(result.governmentProjects, 1);
  assert.equal(result.reportedExecutionProjects, 1);
  assert.equal(result.strictExecutionProjects, 0);
  assert.equal(result.exceptionalActivityProjects, 1);
  assert.equal(result.rows[0].physical, "construction_or_later");
  assert.equal(result.rows[0].exceptionalActivityOnly, true);
});

test("corpus-wide matrix is exhaustive, disjoint, stable, and directly traceable", () => {
  const all = getAllFinancialCommitments();
  const projects = getAllProjects();
  const result = buildIndustrialResponse(site.lastUpdated, all, projects);
  assert.equal(result.asOf, site.lastUpdated, "matrix uses the declared curated corpus date");
  assert.equal(result.registryProjects, projects.length);
  assert.equal(result.financialRows, all.length);
  assert.ok(result.governmentProjects > 0);
  assert.equal(result.rows.length, result.governmentProjects);
  assert.equal(result.matrix.length, FINANCE_ROWS.length * PHYSICAL_COLUMNS.length);
  assert.deepEqual(result.matrix.map((c) => c.key),
    FINANCE_ROWS.flatMap((f) => PHYSICAL_COLUMNS.map((p) => matrixKey(f, p))));
  assert.equal(result.matrix.reduce((sum, cell) => sum + cell.projects.length, 0), result.governmentProjects);
  assert.equal(new Set(result.rows.map((r) => r.id)).size, result.governmentProjects);
  assert.equal(result.rows.filter((r) => r.finance === "binding").length, result.bindingProjects);
  assert.equal(result.rows.filter((r) => r.physical === "no_record").length, result.noPhysicalRecordProjects);
  assert.ok(result.rows.every((r) => r.financialEvidence.length > 0 && r.financialEvidence.every((e) => e.sourceId && e.financialId)));
  assert.ok(result.rows.every((r) => r.financialIds.every((id) => all.some((c) => c.id === id && c.projectId === r.id))));
  assert.ok(result.strictExecutionProjects <= result.reportedExecutionProjects);
  assert.ok(result.reportedExecutionProjects <= result.governmentProjects);
  assert.equal(result.rows.some((r) => r.id === "prj-kz-sarytogan"), false, "multilateral EBRD equity alone is not a tracked government commitment");
});
