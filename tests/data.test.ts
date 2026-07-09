import { test } from "node:test";
import assert from "node:assert/strict";

import {
  getAllEvents,
  getEventById,
  getEventsByActor,
  getEventsByMaterial,
  getRelatedEvents,
  getAllMaterials,
  getMaterialBySlug,
  getMaterialsByIds,
  getAllJurisdictions,
  getJurisdictionByCode,
  getJurisdictionById,
  getAllSources,
  getSourceById,
  getSourcesByIds,
  getDatasetSummary,
  getAllFramingClaims,
  getFramingByEvent,
} from "@/lib/data";
import type { JurisdictionCode } from "@/lib/types";

test("events load and are sorted most-recent-first", () => {
  const e = getAllEvents();
  assert.ok(e.length > 0);
  for (let i = 1; i < e.length; i++) assert.ok(e[i - 1].date >= e[i].date, `unsorted at ${i}`);
});

test("getEventById round-trips and misses cleanly", () => {
  const e = getAllEvents()[0];
  assert.equal(getEventById(e.id)?.id, e.id);
  assert.equal(getEventById("does-not-exist"), undefined);
});

test("getEventsByActor returns only that actor", () => {
  for (const j of getAllJurisdictions())
    for (const e of getEventsByActor(j.id as JurisdictionCode)) assert.equal(e.jurisdiction, j.id);
});

test("getEventsByMaterial only returns events affecting that material", () => {
  for (const m of getAllMaterials())
    for (const e of getEventsByMaterial(m.id)) assert.ok(e.affectedMaterialIds.includes(m.id));
});

test("related events exclude self and share at least one material", () => {
  for (const e of getAllEvents())
    for (const r of getRelatedEvents(e)) {
      assert.notEqual(r.id, e.id);
      assert.ok(r.affectedMaterialIds.some((m) => e.affectedMaterialIds.includes(m)));
    }
});

test("getRelatedEvents respects the limit", () => {
  for (const e of getAllEvents()) assert.ok(getRelatedEvents(e, 3).length <= 3);
});

test("material slug lookup round-trips; getMaterialsByIds preserves and filters", () => {
  const all = getAllMaterials();
  const m = all[0];
  assert.equal(getMaterialBySlug(m.slug)?.id, m.id);
  assert.equal(getMaterialsByIds([m.id, "nope"]).length, 1);
});

test("jurisdiction code lookup is case-insensitive; id lookup is exact", () => {
  const j = getAllJurisdictions()[0];
  assert.equal(getJurisdictionByCode(j.code.toLowerCase())?.id, j.id);
  assert.equal(getJurisdictionByCode(j.code.toUpperCase())?.id, j.id);
  assert.equal(getJurisdictionById(j.id)?.code, j.code);
});

test("source lookups round-trip", () => {
  const s = getAllSources()[0];
  assert.equal(getSourceById(s.id)?.id, s.id);
  assert.equal(getSourcesByIds([s.id, "nope"]).length, 1);
});

test("framing-by-event only returns claims for that event", () => {
  for (const e of getAllEvents())
    for (const f of getFramingByEvent(e.id)) assert.equal(f.eventId, e.id);
});

test("dataset summary equals loaded counts", () => {
  const s = getDatasetSummary();
  assert.equal(s.events, getAllEvents().length);
  assert.equal(s.framingClaims, getAllFramingClaims().length);
  assert.equal(s.materials, getAllMaterials().length);
  assert.equal(s.jurisdictions, getAllJurisdictions().length);
  assert.equal(s.sources, getAllSources().length);
});
