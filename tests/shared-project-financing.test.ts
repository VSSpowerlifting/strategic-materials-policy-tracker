import test from "node:test";
import assert from "node:assert/strict";

import { projectStack, coInvestments } from "@/lib/capital-intelligence";
import { getFinancialCommitmentById, getProjectById } from "@/lib/data";

test("MP's company cash is associated with four projects without becoming project-attributed capital", () => {
  const row = getFinancialCommitmentById("fin-us-dod-mp-2025-company-cash")!;
  assert.equal(row.projectId, null);
  assert.deepEqual(row.associatedProjectIds, [
    "prj-us-mp-10x-facility",
    "prj-us-mountain-pass-samarium",
    "prj-us-mp-independence-expansion",
    "prj-us-mp-mountain-pass-hcl-facilities",
  ]);
  assert.equal(row.amount?.value, "600000000");
  assert.equal(row.valueRole, "recipient_own_funds");

  for (const id of row.associatedProjectIds ?? []) {
    assert.ok(getProjectById(id), id);
    const stack = projectStack(id)!;
    assert.ok(stack.associatedRows.some((c) => c.id === row.id), id);
    assert.ok(!stack.rows.some((c) => c.id === row.id), id);
    assert.ok(!stack.layers.some((l) => l.rows.some((c) => c.id === row.id)), id);
  }
  assert.ok(!coInvestments().some((c) => c.rowIds.includes(row.id)));
});

test("Lynas' AUD200 million equity remains unsplit across two growth-plan projects", () => {
  const row = getFinancialCommitmentById("fin-jp-jare-lynas-2023-equity")!;
  assert.equal(row.projectId, null);
  assert.deepEqual(row.associatedProjectIds, ["prj-lynas-lre-capacity-expansion", "prj-lynas-hre-separation"]);
  assert.equal(row.amount?.value, "200000000");
  assert.equal(row.amount?.currency, "AUD");

  const lre = getProjectById("prj-lynas-lre-capacity-expansion")!;
  assert.deepEqual(lre.locations, []);
  assert.deepEqual(lre.stages, []);
  assert.deepEqual(lre.materialIds, ["rare-earth-elements"]);

  const hre = getProjectById("prj-lynas-hre-separation")!;
  assert.deepEqual(hre.locations, []);
  assert.deepEqual(hre.stages, ["separation"]);
  assert.deepEqual(hre.materialIds, ["rare-earth-elements", "dysprosium", "terbium"]);

  for (const id of row.associatedProjectIds ?? []) {
    const stack = projectStack(id)!;
    assert.ok(stack.associatedRows.some((c) => c.id === row.id), id);
    assert.ok(!stack.rows.some((c) => c.id === row.id), id);
  }
});

test("unclassified MP hydrochloric-acid infrastructure is not manufactured into a rare-earth material project", () => {
  const p = getProjectById("prj-us-mp-mountain-pass-hcl-facilities")!;
  assert.deepEqual(p.stages, []);
  assert.deepEqual(p.materialIds, []);
  assert.equal(p.materialAttribution, "not_stated");
  assert.match(p.notes ?? "", /deliberately left without a tracked material/);
});
