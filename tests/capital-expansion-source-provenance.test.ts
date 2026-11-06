import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllMaterials,
  getFinancialCommitmentById,
  getEventById,
} from "@/lib/data";

test("an issuer-specific filing is cited only for its supported financing, not unrelated materials in a shared event", () => {
  const eximSource = "src-us-exim-minerals-roundtable-2026";
  const westwaterSource = "src-us-westwater-sec-exim-2026";
  const event = getEventById("evt-us-exim-critical-minerals-2026-08")!;

  // This event reports graphite, tantalum/niobium and boron financing together.
  assert.ok(event.sourceIds.includes(eximSource));
  assert.ok(event.sourceIds.includes(westwaterSource));

  const materials = getAllMaterials();
  for (const id of ["tantalum", "niobium", "boron"]) {
    const material = materials.find((m) => m.id === id)!;
    assert.ok(material.sourceIds.includes(eximSource), `${id}: EXIM announcement`);
    assert.ok(!material.sourceIds.includes(westwaterSource), `${id}: unrelated Westwater SEC filing`);
  }

  const westwater = getFinancialCommitmentById("fin-us-exim-westwater-2026")!;
  assert.deepEqual(westwater.materialIds, ["graphite"]);
  assert.ok(westwater.evidence.some((e) => e.sourceId === westwaterSource));
});
