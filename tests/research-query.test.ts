import test from "node:test";
import assert from "node:assert/strict";
import { buildLatticeModel, cellKey } from "../lib/lattice";
import { normalizeResearchQuery, researchQueryHref, researchQueryResult } from "../lib/research-query";
import { getAllFinancialCommitments, getAllControlMeasures, getAllProjectDesignations, getProgrammeById } from "../lib/data";
import { commitmentActor, controlIssuer } from "../lib/capital-control";
import { readFileSync } from "node:fs";
import { site } from "../lib/site";
const model = buildLatticeModel(site.lastUpdated);
const preferred = { slug: "gallium", stage: "processing" } as const;

test("every selected cell reconciles canonical IDs by kind, without context/option/ended inflation", () => {
  for (const m of model.materials) for (const s of model.stages) {
    const q = normalizeResearchQuery(model, `/#${m.slug}:${s.id}`);
    const result = researchQueryResult(model, q);
    const cell = model.cells[cellKey(m.id, s.id)];
    for (const kind of ["commitments", "controls", "designations"] as const) {
      assert.deepEqual(result.recordIds[kind], cell?.[kind] ?? []);
      assert.equal(result.view?.counts[kind] ?? 0, result.recordIds[kind].length);
      assert.equal(new Set(result.recordIds[kind]).size, result.recordIds[kind].length);
    }
    assert.deepEqual(result.optionIds, cell?.options ?? []);
    assert.deepEqual(result.endedIds, cell?.ended ?? []);
  }
});

test("home and destination canonical URLs roundtrip selections, government and kind; preserve unrelated state", () => {
  const home = normalizeResearchQuery(model, "/?government=AU&kind=commitments#@invalid", preferred);
  assert.ok(home.issues.length);
  const query = normalizeResearchQuery(model, "/?material=gallium&stage=processing&government=AU&kind=commitments", preferred);
  assert.deepEqual(query.issues, []);
  for (const destination of ["/", "/compare"]) {
    const href = researchQueryHref(model, query, destination, "/?utm=reader");
    assert.ok(href.includes("utm=reader"));
    assert.ok(href.endsWith("#gallium:processing"));
    const reread = normalizeResearchQuery(model, href, preferred);
    assert.deepEqual(reread, query);
    assert.deepEqual(researchQueryResult(model, reread), researchQueryResult(model, query));
  }
});

test("precise invalid/repeated/empty state never silently widens or selects another cell", () => {
  for (const input of ["/?material=missing&stage=processing", "/?stage=processing", "/?government=XX#gallium:processing", "/?kind=finance#gallium:processing", "/?kind=", "/?material=gallium&material=gallium&stage=processing", "/?material=gallium&stage=processing#tungsten:mining", "/#gallium:unknown", "/#bad"]) {
    const q = normalizeResearchQuery(model, input, preferred);
    assert.ok(q.issues.length, input);
    assert.equal(q.selection, null, input);
    assert.deepEqual(researchQueryResult(model, q).recordIds, { commitments: [], controls: [], designations: [] });
  }
  const blank = model.materials.flatMap(m => model.stages.map(s => ({ m, s }))).find(({ m, s }) => !model.cells[cellKey(m.id, s.id)]);
  assert.ok(blank);
  const q = normalizeResearchQuery(model, `/#${blank.m.slug}:${blank.s.id}`, preferred);
  assert.deepEqual(q.selection, { materialId: blank.m.id, stage: blank.s.id });
  assert.equal(researchQueryResult(model, q).view, null);
  assert.ok(normalizeResearchQuery(model, "/", preferred).selection);
});

test("government is provider/issuer/designator, never project facility geography", () => {
  const finances = new Map(getAllFinancialCommitments().map(f => [f.id, f]));
  const controls = new Map(getAllControlMeasures().map(c => [c.id, c]));
  const designations = new Map(getAllProjectDesignations().map(d => [d.id, d]));
  for (const actor of model.actors) for (const m of model.materials) for (const s of model.stages) {
    const result = researchQueryResult(model, normalizeResearchQuery(model, `/?government=${actor.code}#${m.slug}:${s.id}`));
    for (const id of [...result.recordIds.commitments, ...result.optionIds, ...result.endedIds]) assert.equal(commitmentActor(finances.get(id)!), actor.code);
    for (const id of result.recordIds.controls) assert.equal(controlIssuer(controls.get(id)!), actor.code);
    for (const id of result.recordIds.designations) assert.equal(getProgrammeById(designations.get(id)!.programmeId)!.actor, actor.code);
  }
  const us = researchQueryResult(model, normalizeResearchQuery(model, "/?government=US#gallium:processing"));
  const australianFacility = us.view?.commitments.find(r => r.projects?.some(p => p.id === "prj-au-alcoa-sojitz-gallium"));
  assert.ok(australianFacility, "US provider finance remains visible for an Australian facility");
});


test("query and lattice view runtime imports stay browser-safe", () => {
  for (const path of ["lib/research-query.ts", "lib/lattice-view.ts"]) {
    const source = readFileSync(path, "utf8");
    const runtimeImports = source.split("\n").filter(line => line.startsWith("import ") && !line.startsWith("import type "));
    assert.ok(runtimeImports.every(line => !/from ["']\.\/(data|lattice)["']/.test(line)), path);
  }
});


test("standard focus and analytical section anchors do not invalidate a default selection", () => {
  for (const hash of ["#main-content", "#analytical-view", "#selected-evidence"]) {
    const q = normalizeResearchQuery(model, "/" + hash, preferred);
    assert.deepEqual(q.issues, []);
    assert.deepEqual(q.selection, {materialId:"gallium", stage:"processing"});
  }
});


test("all existing kind-visibility combinations remain supported and shareable", () => {
  for (const kind of ["all", "commitments", "controls", "designations", "commitments,controls", "commitments,designations", "controls,designations", "none"]) {
    const q = normalizeResearchQuery(model, `/?kind=${encodeURIComponent(kind)}#gallium:processing`);
    assert.deepEqual(q.issues, []);
    const result = researchQueryResult(model, q);
    for (const key of ["commitments", "controls", "designations"] as const) {
      assert.equal(result.recordIds[key].length, kind === "all" || kind.split(",").includes(key) ? model.cells["gallium|processing"][key].length : 0);
    }
    assert.deepEqual(normalizeResearchQuery(model, researchQueryHref(model, q, "/compare")), q);
  }
});
