import { test } from "node:test";
import assert from "node:assert/strict";

import { stageLatticeGaps, stageResponseMap } from "@/lib/capital-intelligence";
import { buildLatticeModel, cellKey } from "@/lib/lattice";
import { ALL_KINDS, NO_FILTER, cellView, defaultSelection, governmentRows, isMarked, parseSelection } from "@/lib/lattice-view";
import { getAllControlMeasures, getAllFinancialCommitments, getAllProjectDesignations } from "@/lib/data";
import { site } from "@/lib/site";
import { NO_ITEM_MEASURE_TYPES, SUPPLY_CHAIN_STAGES } from "@/lib/types";
import type { ControlMeasure, FinancialCommitment, ProjectDesignation } from "@/lib/types";

// The lattice model and its off-lattice counts. Fixtures are in-memory partial rows (only the fields the
// helpers read); corpus assertions derive from the seed and never pin a count that a data edit would move.

const ctl = (over: Partial<ControlMeasure>) => ({ measureType: "export_licensing", controlledStages: [], materialIds: [], ...over }) as ControlMeasure;
const fin = (over: Partial<FinancialCommitment>) =>
  ({ valueRole: "commitment", providerJurisdiction: "us", stages: ["processing"], materialIds: ["m"], ...over }) as FinancialCommitment;
const dsg = (over: Partial<ProjectDesignation>) => ({ stages: ["processing"], materialIds: ["m"], ...over }) as ProjectDesignation;

test("control clauses with no stage split into empty-by-rule and could-carry-a-stage; a stage without a material is its own bucket", () => {
  const rule = NO_ITEM_MEASURE_TYPES[0];
  const g = stageLatticeGaps(
    [],
    [
      ctl({ measureType: rule }), // no stage, by rule
      ctl({ measureType: rule }),
      ctl({ measureType: "export_licensing" }), // no stage, type could carry one
      ctl({ controlledStages: ["processing"], materialIds: ["m"] }), // placed
      ctl({ controlledStages: ["processing"], materialIds: [] }), // stage but no tracked material
    ],
    [],
  ).controls;
  assert.deepEqual(g, { total: 5, unplaced: 4, noStage: 3, noStageByRule: 2, noStageOther: 1, noMaterialOnly: 1, placed: 1 });
  assert.equal(g.noStageByRule + g.noStageOther + g.noMaterialOnly + g.placed, g.total);
});

test("capital rows fall into exclusive buckets that sum to the total: other roles, no provider, no stage, placed", () => {
  const g = stageLatticeGaps(
    [
      fin({}), // placed
      fin({ valueRole: "funding_option" }), // an option is placed too
      fin({ valueRole: "program_envelope" }),
      fin({ valueRole: "indication" }),
      fin({ valueRole: "indication" }),
      fin({ providerJurisdiction: null }), // a commitment no tracked government provides
      fin({ stages: [] }),
      fin({ materialIds: [] }),
    ],
    [],
    [],
  ).capital;
  assert.equal(g.total, 8);
  assert.equal(g.placed, 2);
  assert.equal(g.noProvider, 1);
  assert.equal(g.noStageOrMaterial, 2);
  assert.deepEqual(g.otherRoles, { program_envelope: 1, indication: 2 });
  assert.equal(g.otherRoleTotal, 3);
  assert.equal(g.placed + g.noProvider + g.noStageOrMaterial + g.otherRoleTotal, g.total);
});

test("a designation with no stage or no tracked material is unplaced", () => {
  const g = stageLatticeGaps([], [], [dsg({}), dsg({ stages: [] }), dsg({ materialIds: [] })]).designations;
  assert.deepEqual(g, { total: 3, unplaced: 2, placed: 1 });
});

test("corpus: the off-lattice counts agree with what the response map actually places", () => {
  const asOf = site.lastUpdated;
  const g = stageLatticeGaps();
  const map = stageResponseMap(asOf);
  const placedControls = new Set<string>();
  const placedDesignations = new Set<string>();
  for (const row of map.values())
    for (const cell of row.values()) {
      cell.controlIds.forEach((id) => placedControls.add(id));
      cell.designationIds.forEach((id) => placedDesignations.add(id));
    }
  assert.equal(placedControls.size, g.controls.placed);
  assert.equal(g.controls.total, getAllControlMeasures().length);
  assert.equal(placedDesignations.size, g.designations.placed);
  assert.equal(g.designations.total, getAllProjectDesignations().length);
  assert.equal(g.capital.total, getAllFinancialCommitments().length);
  // Empty-by-rule stages are validator-enforced, so no such clause can be in the "could carry a stage" bucket.
  const byRule = getAllControlMeasures().filter((m) => NO_ITEM_MEASURE_TYPES.includes(m.measureType) && m.controlledStages.length === 0);
  assert.equal(byRule.length, g.controls.noStageByRule);
});

test("model: every cell id resolves to a record of the right kind, and each row is in one capital field", () => {
  const m = buildLatticeModel(site.lastUpdated);
  assert.ok(Object.keys(m.cells).length > 0);
  const capitalField = new Map<string, string>();
  for (const [key, cell] of Object.entries(m.cells)) {
    const [mat, stage] = key.split("|");
    assert.ok(m.materials.some((x) => x.id === mat), `${key}: material is listed`);
    assert.ok(m.stages.some((x) => x.id === stage), `${key}: stage is listed`);
    for (const [ids, kind] of [[cell.commitments, "commitment"], [cell.options, "commitment"], [cell.ended, "commitment"], [cell.controls, "control"], [cell.designations, "designation"]] as const)
      for (const id of ids) assert.equal(m.records[id]?.kind, kind, `${key}: ${id}`);
    for (const [ids, field] of [[cell.commitments, "capital"], [cell.options, "option"], [cell.ended, "ended"]] as const)
      for (const id of ids) {
        assert.equal(capitalField.get(id) ?? field, field, `${id} sits in one field`);
        capitalField.set(id, field);
      }
  }
});

test("model: cell counts equal the response map's, options and ended rows are never in the commitment list", () => {
  const asOf = site.lastUpdated;
  const m = buildLatticeModel(asOf);
  const map = stageResponseMap(asOf);
  for (const [mat, row] of map)
    for (const [stage, cell] of row) {
      const x = m.cells[cellKey(mat, stage)];
      assert.deepEqual([...x.commitments], [...cell.capitalIds].sort());
      assert.deepEqual([...x.options], [...cell.optionIds].sort());
      assert.deepEqual([...x.ended], [...cell.endedIds].sort());
      assert.equal(x.controls.length, cell.controlIds.length);
      assert.equal(x.designations.length, cell.designationIds.length);
    }
});

test("model: records with no stage are listed per material, never in a cell, and each resolves", () => {
  const m = buildLatticeModel(site.lastUpdated);
  const inCells = new Set(Object.values(m.cells).flatMap((c) => [...c.commitments, ...c.options, ...c.ended, ...c.controls, ...c.designations]));
  const controls = new Map(getAllControlMeasures().map((c) => [c.id, c]));
  const commitments = new Map(getAllFinancialCommitments().map((c) => [c.id, c]));
  const designations = new Map(getAllProjectDesignations().map((d) => [d.id, d]));
  let listed = 0;
  for (const [mat, u] of Object.entries(m.unstaged)) {
    for (const id of u.controls) {
      assert.equal(controls.get(id)!.controlledStages.length, 0, id);
      assert.ok(controls.get(id)!.materialIds.includes(mat), id);
      assert.equal(m.records[id]?.kind, "control");
      listed++;
    }
    for (const id of u.commitments) {
      assert.equal(commitments.get(id)!.stages.length, 0, id);
      assert.equal(m.records[id]?.kind, "commitment");
    }
    for (const id of u.designations) {
      assert.equal(designations.get(id)!.stages.length, 0, id);
      assert.equal(m.records[id]?.kind, "designation");
    }
    // A record with no stage has none to sit at, so it is in no cell at all.
    for (const id of [...u.controls, ...u.commitments, ...u.designations]) assert.ok(!inCells.has(id), `${id} is in a cell`);
  }
  assert.ok(listed > 0, "at least one stageless clause is listed against a tracked material");
});

test("model: stage columns are exactly the occupied stages, in vocabulary order", () => {
  const m = buildLatticeModel(site.lastUpdated);
  const occupied = new Set(Object.keys(m.cells).map((k) => k.split("|")[1]));
  assert.deepEqual(
    m.stages.map((s) => s.id),
    SUPPLY_CHAIN_STAGES.filter((s) => occupied.has(s)),
  );
});

test("model: amounts keep the source's currency and qualifier and no cell carries a money total", () => {
  const m = buildLatticeModel(site.lastUpdated);
  for (const r of Object.values(m.records)) {
    if (r.kind !== "commitment" || !r.amount) continue;
    const c = getAllFinancialCommitments().find((x) => x.id === r.id)!;
    assert.equal(r.amount.currency, c.amount!.currency);
    assert.equal(r.amount.asStated, c.amount!.amountAsStated);
  }
  for (const cell of Object.values(m.cells)) assert.deepEqual(Object.keys(cell).sort(), ["commitments", "controls", "designations", "ended", "options"]);
});

test("model: it survives a JSON round trip unchanged (it is passed to a client component)", () => {
  const m = buildLatticeModel(site.lastUpdated);
  assert.deepEqual(JSON.parse(JSON.stringify(m)), m);
});

// --- View logic ---------------------------------------------------------------------------------

test("view: turning a kind off removes it and only it; the government filter keeps only that government's records", () => {
  const m = buildLatticeModel(site.lastUpdated);
  let checked = 0;
  for (const mat of m.materials)
    for (const st of m.stages) {
      const all = cellView(m, mat.id, st.id);
      if (!all) continue;
      checked++;
      const noControls = cellView(m, mat.id, st.id, { kinds: { ...ALL_KINDS, controls: false }, actor: "all" });
      assert.equal(noControls?.counts.controls ?? 0, 0);
      assert.equal(noControls?.counts.commitments ?? 0, all.counts.commitments);
      assert.equal(noControls?.counts.designations ?? 0, all.counts.designations);
      for (const a of m.actors) {
        const v = cellView(m, mat.id, st.id, { kinds: ALL_KINDS, actor: a.code });
        for (const r of [...(v?.commitments ?? []), ...(v?.controls ?? []), ...(v?.designations ?? [])]) assert.equal(r.actor, a.code);
      }
    }
  assert.ok(checked > 0);
});

test("view: per government, counts add back to the unfiltered cell for each kind (no record lost or doubled)", () => {
  const m = buildLatticeModel(site.lastUpdated);
  for (const mat of m.materials) {
    const rows = governmentRows(m, mat.id);
    for (const st of m.stages) {
      const all = cellView(m, mat.id, st.id);
      for (const kind of ["commitments", "controls", "designations"] as const) {
        const split = rows.reduce((n, r) => n + (r.cells[st.id]?.[kind] ?? 0), 0);
        assert.equal(split, all?.counts[kind] ?? 0, `${mat.id} ${st.id} ${kind}`);
      }
    }
  }
});

test("view: an option or an ended row alone does not mark a cell", () => {
  const m = buildLatticeModel(site.lastUpdated);
  for (const mat of m.materials)
    for (const st of m.stages) {
      const v = cellView(m, mat.id, st.id, NO_FILTER);
      if (v && !isMarked(v)) assert.ok(v.options.length + v.ended.length > 0);
    }
});

test("view: a selection hash resolves only to a marked cell, by id or slug, and rubbish resolves to null", () => {
  const m = buildLatticeModel(site.lastUpdated);
  const mat = m.materials.find((x) => x.slug === "tungsten")!;
  assert.deepEqual(parseSelection(m, `#${mat.id}:processing`), { materialId: mat.id, stage: "processing" });
  assert.deepEqual(parseSelection(m, `#${mat.slug}:processing`), { materialId: mat.id, stage: "processing" });
  assert.equal(parseSelection(m, "#tungsten:no_such_stage"), null);
  assert.equal(parseSelection(m, "#nothing:processing"), null);
  assert.equal(parseSelection(m, ""), null);
  assert.equal(parseSelection(m, "#<script>"), null);
});

test("view: the default selection is the preferred cell when it holds a record, otherwise the first marked cell", () => {
  const m = buildLatticeModel(site.lastUpdated);
  const tungsten = m.materials.find((x) => x.slug === "tungsten")!;
  assert.deepEqual(defaultSelection(m, { slug: "tungsten", stage: "processing" }), { materialId: tungsten.id, stage: "processing" });
  const fallback = defaultSelection(m, { slug: "no-such-material", stage: "processing" });
  assert.ok(fallback && isMarked(cellView(m, fallback.materialId, fallback.stage)));
  assert.equal(defaultSelection({ ...m, materials: [], cells: {} }), null);
});
