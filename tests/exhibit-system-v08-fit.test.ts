// Renderer fixes made for FI003 draft 0.8: the waterfall legend keys only the movements
// the bridge draws, and criterion-matrix rows shrink so the table and its marks key fit
// the exhibit area at the seven-criterion maximum. Test-only invented data.
import test from "node:test";
import assert from "node:assert/strict";

import { makeHelpers } from "../scripts/exhibit-system/primitives";
import { RENDERERS } from "../scripts/exhibit-system/renderers";
import type { ElementRecord, Fixture, PptxSlide } from "../scripts/exhibit-system/types";

function capture(id: string, data: unknown, area = { x: 0.5, y: 1.5, w: 12, h: 5 }) {
  const records: ElementRecord[] = [];
  const tables: { rowH: number[]; y: number }[] = [];
  const shapes: { name: string; y: number; h: number }[] = [];
  const slide = {
    addText() {},
    addChart() {},
    addNotes() {},
    addShape(_t: unknown, o: { objectName: string; y: number; h: number }) { shapes.push({ name: o.objectName, y: o.y, h: o.h }); },
    addTable(_r: unknown, o: { rowH: number[]; y: number }) { tables.push({ rowH: o.rowH, y: o.y }); },
  } as unknown as PptxSlide;
  const r = RENDERERS.get(id)!;
  const d = r.parse(data);
  assert.deepEqual(r.check(d), []);
  r.render(makeHelpers(slide, area, records, { ellipse: "ellipse", pie: "pie", line: "line", rect: "rect" }, { bar: "bar", doughnut: "doughnut" }), d, {} as Fixture);
  return { names: records.map((x) => x.name), tables, shapes, area };
}

const bridge = (steps: { label: string; delta: number }[], end: number) => ({
  unit: "USD m", dp: 1, start: { label: "Start", value: 100 }, steps, end: { label: "End", value: end },
});

test("waterfall legend: an increase-only bridge has no Decrease key", () => {
  const { names } = capture("waterfall", bridge([{ label: "Up", delta: 20 }], 120));
  assert.ok(names.some((n) => n.includes("legend-up")));
  assert.ok(!names.some((n) => n.includes("legend-down")));
});

test("waterfall legend: a decrease-only bridge has no Increase key", () => {
  const { names } = capture("waterfall", bridge([{ label: "Down", delta: -20 }], 80));
  assert.ok(!names.some((n) => n.includes("legend-up")));
  assert.ok(names.some((n) => n.includes("legend-down")));
});

test("waterfall legend: a mixed bridge keys both movements", () => {
  const { names } = capture("waterfall", bridge([{ label: "Up", delta: 20 }, { label: "Down", delta: -5 }], 115));
  assert.ok(names.some((n) => n.includes("legend-up")));
  assert.ok(names.some((n) => n.includes("legend-down")));
});

const matrix = (n: number) => ({
  options: ["A", "B", "C", "D"],
  criteria: Array.from({ length: n }, (_, i) => ({ label: `Criterion ${i + 1}`, marks: ["Meets", "Partly", "Does not", "Not stated"] })),
});

test("criterion matrix: seven criteria and the marks key stay inside the exhibit area", () => {
  // A short area (4 in) forces rows below the 0.5 in ceiling: (4 - 0.55 - 0.5) / 7 ≈ 0.42.
  const { tables, shapes, area } = capture("criterion-matrix", matrix(7), { x: 0.5, y: 1.5, w: 12, h: 4 });
  const rowH = tables[0].rowH;
  assert.ok(rowH.slice(1).every((h) => h < 0.5));
  const keyBottom = Math.max(...shapes.filter((s) => s.name.includes("key-")).map((s) => s.y + s.h));
  assert.ok(keyBottom <= area.y + area.h + 1e-9, `key bottom ${keyBottom} exceeds ${area.y + area.h}`);
});

test("criterion matrix: rows never grow past 0.5 in when there is room", () => {
  const { tables } = capture("criterion-matrix", matrix(2));
  assert.ok(tables[0].rowH.slice(1).every((h) => h === 0.5));
});
