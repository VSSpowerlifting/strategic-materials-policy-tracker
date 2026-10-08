import test from "node:test";
import assert from "node:assert/strict";

import { currentFinancialStatus, totalCommitments, childLinks } from "@/lib/capital-control";
import { projectStack } from "@/lib/capital-intelligence";
import { getAllFinancialCommitments, getFinancialCommitmentById, getProjectById, getSourceById } from "@/lib/data";

const parentId = "fin-us-dow-usac-antimony-2026";
const thompsonId = "fin-us-dow-usac-antimony-2026-thompson-falls";
const alaskaId = "fin-us-dow-usac-antimony-2026-alaska";

test("company-disclosed USAC allocation divides the existing $27M award without adding a second $27M", () => {
  const all = getAllFinancialCommitments();
  const parent = getFinancialCommitmentById(parentId)!;
  const thompson = getFinancialCommitmentById(thompsonId)!;
  const alaska = getFinancialCommitmentById(alaskaId)!;
  assert.equal(parent.amount?.value, "27000000");
  assert.deepEqual([thompson.amount?.value, alaska.amount?.value], ["20000000", "7000000"]);
  assert.deepEqual([thompson.amount?.currency, alaska.amount?.currency], ["USD", "USD"]);
  assert.deepEqual(
    [thompson, alaska].map((c) => c.relationships.map((r) => [r.relationship, r.commitmentId])),
    [[["part_of", parentId]], [["part_of", parentId]]],
  );
  assert.deepEqual(
    childLinks(parentId).filter((x) => x.relationship === "part_of").map((x) => x.commitment.id).sort(),
    [alaskaId, thompsonId],
  );
  const totals = totalCommitments([parent, thompson, alaska], all);
  const usd = totals.currencies.find((c) => c.currency === "USD");
  assert.ok(usd && usd.status === "summed");
  assert.deepEqual(usd.countedIds, [parentId]);
  assert.deepEqual([...usd.nestedIds].sort(), [alaskaId, thompsonId]);
  const grant = usd.instruments.find((c) => c.instrument === "grant");
  assert.ok(grant && grant.summed);
  assert.equal(grant.byQualifier.exact, "27000000");
});

test("Thompson Falls has its own partially paid capital stack, without attributing the parent", () => {
  const row = getFinancialCommitmentById(thompsonId)!;
  assert.equal(row.projectId, "prj-us-usac-thompson-falls-expansion");
  assert.equal(currentFinancialStatus(row), "partially_disbursed");
  assert.equal(row.financialStatusHistory.at(-1)?.date, null);
  assert.match(row.financialStatusHistory.at(-1)?.note ?? "", /12\.8M/);
  const stack = projectStack(row.projectId)!;
  assert.ok(stack.rows.some((c) => c.id === row.id));
  assert.ok(stack.rows.every((c) => c.id !== parentId));
  assert.deepEqual(getProjectById(row.projectId)!.stages, ["processing", "refining"]);
});

test("Alaska has a decided $7M award allocation, not a fabricated payment or named mine", () => {
  const row = getFinancialCommitmentById(alaskaId)!;
  assert.equal(currentFinancialStatus(row), "decided");
  assert.deepEqual(row.stages, ["mining"]);
  assert.equal(row.projectId, "prj-us-usac-alaska-antimony-feedstock");
  assert.deepEqual(getProjectById(row.projectId)!.locations, [
    { countryCode: "US", subnational: "Alaska", asStated: "Alaska" },
  ]);
  assert.equal(row.financialStatusHistory.length, 1);
  assert.doesNotMatch(row.notes ?? "", /Nolan Creek/);
});

test("MP and Lynas remain non-allocative while USAC has individually evidenced parts", () => {
  for (const id of ["fin-jp-jare-lynas-2023-equity", "fin-us-dod-mp-2025-company-cash"]) {
    const row = getFinancialCommitmentById(id)!;
    assert.equal(row.projectId, null);
    assert.ok((row.associatedProjectIds?.length ?? 0) >= 2);
  }
  for (const id of [thompsonId, alaskaId]) {
    const row = getFinancialCommitmentById(id)!;
    assert.equal(row.associatedProjectIds, undefined);
  }
});

test("Q2 SEC source confirms Thompson Falls construction and partial asset service without full completion", () => {
  const row = getFinancialCommitmentById(thompsonId)!;
  const project = getProjectById(row.projectId!)!;
  const physical = row.implementationStatusHistory;
  assert.equal(physical.length, 1);
  assert.deepEqual([physical[0].status, physical[0].date, physical[0].sourceId], [
    "construction", null, "src-usac-2026-q2-10q",
  ]);
  assert.match(physical[0].note ?? "", /substantially completed during Q2/);
  assert.match(physical[0].note ?? "", /\$4\.1M/);
  assert.match(physical[0].note ?? "", /\$29M/);
  assert.ok(!physical.some((s) => ["operational", "completed", "commissioning"].includes(s.status)));
  assert.equal(row.lifecycleReview?.implementationStatusCheckedAt, "2026-10-08");
  assert.equal(row.lifecycleReview?.financialStatusCheckedAt, null);
  assert.ok(project.evidence.some((e) =>
    e.sourceId === "src-usac-2026-q2-10q" && e.evidence === "explicit" && e.supports.includes("stages")
  ));
  assert.match(project.notes ?? "", /not justify marking the whole grant-funded scope operational or completed/);
  assert.equal(getSourceById("src-usac-2026-q2-10q")?.url,
    "https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm");
  assert.deepEqual(projectStack(row.projectId!)!.latestImplementation, {
    status: "construction", date: null, rowId: thompsonId, sourceId: "src-usac-2026-q2-10q",
  });
});

test("Physical refresh never double-counts the $27M parent or alters financial lifecycle", () => {
  const parent = getFinancialCommitmentById(parentId)!;
  const thompson = getFinancialCommitmentById(thompsonId)!;
  const alaska = getFinancialCommitmentById(alaskaId)!;
  assert.deepEqual(parent.implementationStatusHistory, []);
  assert.deepEqual(alaska.implementationStatusHistory, []);
  assert.deepEqual(thompson.financialStatusHistory.map((s) => [s.status, s.date]), [
    ["decided", "2026-02-24"], ["partially_disbursed", null],
  ]);
  assert.match(thompson.financialStatusHistory.at(-1)?.note ?? "", /\$12\.8M/);
  const totals = totalCommitments([parent, thompson, alaska], getAllFinancialCommitments());
  const usd = totals.currencies.find((c) => c.currency === "USD");
  assert.ok(usd && usd.status === "summed");
  assert.deepEqual(usd.countedIds, [parentId]);
  assert.deepEqual([...usd.nestedIds].sort(), [alaskaId, thompsonId]);
});
