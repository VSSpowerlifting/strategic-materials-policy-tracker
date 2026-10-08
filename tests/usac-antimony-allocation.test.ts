import test from "node:test";
import assert from "node:assert/strict";

import { currentFinancialStatus, totalCommitments, childLinks } from "@/lib/capital-control";
import { projectStack } from "@/lib/capital-intelligence";
import { getAllFinancialCommitments, getFinancialCommitmentById, getProjectById } from "@/lib/data";

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
