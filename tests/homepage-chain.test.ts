import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../app/page";
import { getAllMaterials } from "../lib/data";
import { CHAIN_STAGES, chainStageCounts } from "../lib/homepage-chain";
import { buildLatticeModel } from "../lib/lattice";
import { cellKey } from "../lib/lattice-view";
import { site } from "../lib/site";
import type { SupplyChainStage } from "../lib/types";

const model = buildLatticeModel(site.lastUpdated);
const { chain, outside } = chainStageCounts(model);

/** The reference count: distinct ids of one kind across every material's cell at a stage. */
const distinct = (stage: SupplyChainStage, kind: "commitments" | "controls" | "designations") => {
  const ids = new Set<string>();
  for (const m of model.materials) for (const id of model.cells[cellKey(m.id, stage)]?.[kind] ?? []) ids.add(id);
  return ids.size;
};

test("the chain lists every physical stage, in order", () => {
  assert.deepEqual(chain.map((s) => s.stage), [...CHAIN_STAGES]);
});

test("each stage count is the distinct union of lattice cell ids, kind by kind", () => {
  for (const s of [...chain, ...outside]) {
    for (const kind of ["commitments", "controls", "designations"] as const) {
      assert.equal(s[kind], distinct(s.stage, kind), `${s.stage} ${kind}`);
    }
  }
});

test("kinds are never summed into a total", () => {
  for (const s of [...chain, ...outside]) {
    assert.deepEqual(Object.keys(s).sort(), ["commitments", "controls", "designations", "label", "stage"]);
  }
});

test("off-chain stages appear only when they hold records", () => {
  for (const s of outside) assert.ok(s.commitments + s.controls + s.designations > 0, s.stage);
});

const view = renderToStaticMarkup(createElement(Home));

test("the homepage links to the full material and comparison tools instead of rendering the entire lattice", () => {
  assert.doesNotMatch(view, /Where the records sit along the supply chain/);
  assert.doesNotMatch(view, /id="browse"/);
  assert.match(view, /href="\/materials"/);
  assert.match(view, /href="\/compare"/);
  assert.ok(getAllMaterials().length > 0);
  assert.ok(chain.length > 0, "the detailed stage data remains available for the dedicated tools");
});
