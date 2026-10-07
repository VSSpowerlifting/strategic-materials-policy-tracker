import test from "node:test";
import assert from "node:assert/strict";

import { getAllFinancialCommitments, getFinancialCommitmentById, getProjectById } from "@/lib/data";
import { projectStack } from "@/lib/capital-intelligence";
import { financialCommitmentsCsv, projectsCsv } from "@/lib/export";

const shared: Record<string, string[]> = {
  "fin-jp-jare-lynas-2023-equity": ["prj-au-lynas-heavy-ree-separation", "prj-au-lynas-light-ree-expansion"],
  "fin-us-dod-mp-2025-company-cash": ["prj-us-mountain-pass-hcl-recommissioning", "prj-us-mountain-pass-samarium", "prj-us-mp-independence-expansion"],
  "fin-us-dow-usac-antimony-2026": ["prj-us-usac-alaska-antimony-integration", "prj-us-usac-thompson-falls-expansion"],
};

test("shared financing is linked but not allocated to individual project stacks", () => {
  for (const [rowId, ids] of Object.entries(shared)) {
    const row = getFinancialCommitmentById(rowId)!;
    assert.equal(row.projectId, null);
    assert.deepEqual(row.associatedProjectIds, ids);
    for (const id of ids) {
      assert.ok(getProjectById(id));
      const stack = projectStack(id)!;
      assert.ok(stack.sharedRows.some((c) => c.id === rowId));
      assert.ok(!stack.rows.some((c) => c.id === rowId));
      assert.ok(!stack.layers.flatMap((l) => l.rows).some((c) => c.id === rowId));
    }
  }
});

test("ordinary singly attributed commitments remain singly attributed", () => {
  const row = getFinancialCommitmentById("fin-us-dod-mp-2025-samarium-loan")!;
  assert.equal(row.projectId, "prj-us-mountain-pass-samarium");
  assert.deepEqual(row.associatedProjectIds ?? [], []);
  assert.ok(projectStack(row.projectId)!.rows.some((c) => c.id === row.id));
});

test("only three curated rows use non-allocative associations", () => {
  const associated = getAllFinancialCommitments().filter((c) => c.associatedProjectIds?.length).map((c) => c.id);
  assert.deepEqual(associated, Object.keys(shared).sort());
});

test("CSV exports distinguish shared rows and preserve original columns", () => {
  const finance = financialCommitmentsCsv();
  const projects = projectsCsv();
  assert.ok(finance.split("\n")[0].includes("associatedProjectIds"));
  assert.ok(projects.split("\n")[0].includes("sharedCapitalRowIds"));
  for (const id of Object.keys(shared)) assert.ok(finance.includes(id));
  for (const id of shared["fin-us-dow-usac-antimony-2026"]) assert.ok(projects.includes(id));
});
