import assert from "node:assert/strict";
import { test } from "node:test";
import { chronologyLanes, chronologyX, placeMarks, plottedMarks } from "../lib/interplay-chronology";

const marks = plottedMarks();
const lanes = chronologyLanes(marks);
const records = lanes.flatMap((l) => [...l.records.capital, ...l.records.control]);

test("chronology plots 140 status changes across 106 distinct records", () => {
  assert.equal(marks.length, 140);
  assert.equal(new Set(marks.map((m) => `${m.kind}:${m.id}`)).size, 106);
});

test("text grouping covers every plotted change exactly once", () => {
  const id = (m: (typeof marks)[number]) => `${m.kind}|${m.id}|${m.date}|${m.status}`;
  const listed = records.flat().map(id).sort();
  assert.equal(listed.length, 140);
  assert.deepEqual(listed, marks.map(id).sort());
  assert.equal(new Set(listed).size, listed.length, "no change listed twice");
});

test("each record destination appears exactly once in the grouped list", () => {
  assert.equal(records.length, 106);
  assert.equal(new Set(records.map((h) => `${h[0].kind}:${h[0].id}`)).size, 106);
  for (const h of records) assert.ok(h.every((m) => m.id === h[0].id && m.kind === h[0].kind));
  assert.equal(lanes.reduce((n, l) => n + l.changes, 0), 140);
});

test("same-bucket marks never share a plotted position", () => {
  const x = chronologyX();
  const seen = new Set<string>();
  for (const m of placeMarks(marks)) {
    const pos = `${m.jurisdiction}|${m.kind}|${(x(m.date) + m.dx).toFixed(3)}|${m.row}`;
    assert.ok(!seen.has(pos), `coincident mark at ${pos}`);
    seen.add(pos);
  }
  assert.equal(seen.size, 140);
});
