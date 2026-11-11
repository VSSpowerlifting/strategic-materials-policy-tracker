import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../app/page";
import MaterialsPage from "../app/materials/page";
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
const materialsView = renderToStaticMarkup(createElement(MaterialsPage));

test("the materials page draws the strip from real counts above the material-stage browser", () => {
  assert.match(materialsView, /Where the records sit along the supply chain/);
  for (const s of chain) assert.ok(materialsView.includes(s.label), s.label);
  assert.match(materialsView, /id="browse"/);
  assert.ok(materialsView.indexOf('id="chain-heading"') < materialsView.indexOf('id="browse"'));
  assert.equal(materialsView.split('id="chain-heading"').length, 2);
});

test("the homepage links each material", () => {
  for (const m of getAllMaterials()) assert.ok(view.includes(`href="/materials/${m.slug}"`), m.slug);
});
