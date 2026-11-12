// Optional renderer extensions added for FI003 draft 0.7: the waterfall share doughnut,
// the role-matrix layout and the chart typeface normalisation. The renderer options are
// opt-in; omitting them leaves earlier output unchanged.
import test from "node:test";
import assert from "node:assert/strict";

import { unifyChartTypeface } from "../scripts/exhibit-system/build-gallery";
import { RENDERERS } from "../scripts/exhibit-system/renderers";
import { shareSlices, type WaterfallData } from "../scripts/exhibit-system/renderers/waterfall";

const wf = RENDERERS.get("waterfall")!;
const rm = RENDERERS.get("role-matrix")!;

const shares = {
  unit: "Million shares",
  dp: 3,
  start: { label: "Before offering", value: 163.478 },
  steps: [{ label: "New shares", delta: 13.591 }],
  end: { label: "Isolated pro forma", value: 177.069 },
  share: { title: "Composition", baseLabel: "Pre-offering basic shares", addedLabel: "New shares" },
};

test("waterfall share: slices total 100% of the end level and match the dilution figures", () => {
  const [base, added] = shareSlices(shares as WaterfallData);
  assert.ok(Math.abs(base + added - 100) < 1e-9);
  assert.equal(added.toFixed(2), "7.68");
  assert.equal(base.toFixed(2), "92.32");
  // The pre-offering denominator gives the other published figure.
  assert.equal(((13.591 / 163.478) * 100).toFixed(2), "8.31");
});

test("waterfall share: passes integrity checks for an increase-only bridge", () => {
  assert.deepEqual(wf.check(wf.parse(shares)), []);
});

test("waterfall share: rejects a doughnut when any movement is a decrease", () => {
  const bad = { ...shares, steps: [{ label: "Up", delta: 20 }, { label: "Down", delta: -6.409 }] };
  assert.ok(wf.check(wf.parse(bad)).some((i) => i.rule === "share-composition"));
});

test("waterfall share: optional, so data without share parses with share undefined", () => {
  const plain: Record<string, unknown> = { ...shares };
  delete plain.share;
  assert.equal((wf.parse(plain) as WaterfallData).share, undefined);
});

test("chart typeface: replaces pptxgenjs's hard-coded Arial with the deck font only", () => {
  const xml = '<a:latin typeface="Arial"/><a:ea typeface="Arial"/><a:latin typeface="Archivo"/>';
  assert.equal(
    unifyChartTypeface(xml),
    '<a:latin typeface="Archivo"/><a:ea typeface="Archivo"/><a:latin typeface="Archivo"/>',
  );
});

const matrix = {
  roles: ["Sponsors", "Lenders"],
  orgs: [
    { label: "A", cells: [{ qualifier: "x" }, { qualifier: "y" }] },
    { label: "B", cells: [{ qualifier: "x" }, { qualifier: "y" }] },
    { label: "C", cells: [{ qualifier: "x" }, { qualifier: "y" }] },
  ],
};

test("role-matrix layout: applies defaults when only required fields are given", () => {
  const d = rm.parse({ ...matrix, layout: { rowHeader: "Consideration", keyText: "Key" } }) as {
    layout: { labelWidth: number; showCounts: boolean };
  };
  assert.equal(d.layout.labelWidth, 2.2);
  assert.equal(d.layout.showCounts, true);
});

test("role-matrix layout: flags a label width outside the allowed range", () => {
  const d = rm.parse({ ...matrix, layout: { rowHeader: "R", keyText: "K", labelWidth: 7 } });
  assert.ok(rm.check(d).some((i) => i.rule === "label-width"));
});

test("role-matrix layout: undefined when omitted", () => {
  assert.equal((rm.parse(matrix) as { layout?: unknown }).layout, undefined);
});
