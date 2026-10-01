import assert from "node:assert/strict";
import { test } from "node:test";
import { chronologyLanes, chronologyX, placeMarks, plottedMarks } from "../lib/interplay-chronology";

// Relationships, not dataset sizes: these hold however many records the data grows to.
const marks = plottedMarks();
const lanes = chronologyLanes(marks);
const records = lanes.flatMap((l) => [...l.records.capital, ...l.records.control]);
const change = (m: (typeof marks)[number]) => `${m.kind}|${m.id}|${m.date}|${m.status}`;
const destination = (m: (typeof marks)[number]) => `${m.kind}:${m.id}`;

test("text grouping covers every plotted change exactly once", () => {
  const listed = records.flat().map(change).sort();
  assert.equal(listed.length, marks.length);
  assert.deepEqual(listed, marks.map(change).sort());
  assert.equal(new Set(listed).size, listed.length, "no change listed twice");
  assert.equal(lanes.reduce((n, l) => n + l.changes, 0), marks.length);
});

test("each record destination appears exactly once in the grouped list", () => {
  const destinations = new Set(marks.map(destination));
  assert.equal(records.length, destinations.size);
  assert.deepEqual(new Set(records.map((h) => destination(h[0]))), destinations);
  for (const h of records) assert.ok(h.every((m) => destination(m) === destination(h[0])));
});

test("same-bucket marks never share a plotted position", () => {
  const x = chronologyX();
  const seen = new Set<string>();
  for (const m of placeMarks(marks)) {
    const pos = `${m.jurisdiction}|${m.kind}|${(x(m.date) + m.dx).toFixed(3)}|${m.row}`;
    assert.ok(!seen.has(pos), `coincident mark at ${pos}`);
    seen.add(pos);
  }
  assert.equal(seen.size, marks.length);
});

test("every bucket row is centred on its date, including a partial last row", () => {
  const rows = new Map<string, number[]>();
  for (const m of placeMarks(marks)) {
    const key = `${m.jurisdiction}|${m.kind}|${m.date.slice(0, 7)}|${m.row}`;
    rows.set(key, [...(rows.get(key) ?? []), m.dx]);
  }
  for (const [key, dx] of rows) {
    const mean = dx.reduce((a, b) => a + b, 0) / dx.length;
    assert.ok(Math.abs(mean) < 1e-9, `row ${key} is off-centre by ${mean}px`);
  }
  // Synthetic bucket of 7: a full row of 6 and a lone mark that must sit on its date.
  const seven = placeMarks(Array.from({ length: 7 }, (_, i) => ({ ...marks[0], id: `t${i}` })));
  assert.equal(seven[6].row, 1);
  assert.equal(seven[6].dx, 0);
  // A last row of 3 is symmetric about 0.
  const nine = placeMarks(Array.from({ length: 9 }, (_, i) => ({ ...marks[0], id: `t${i}` })));
  assert.deepEqual(nine.slice(6).map((m) => m.dx), [-5, 0, 5]);
});
