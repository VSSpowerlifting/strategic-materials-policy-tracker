// H2 box-interval — per group, min-max whisker, interquartile box and median line,
// from five stated numbers. Native shapes on a computed linear scale; values are
// NOT data-bound (no embedded workbook).
import { arr, num, obj, str } from "../contract";
import { maxItems, minItems, ordered, uniqueLabels, within } from "../integrity";
import { C, fmt, hairline, legendItem, scale, vline } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface BoxGroup {
  label: string;
  n: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface BoxData {
  unit: string;
  dp: number;
  axis: { min: number; max: number; step: number };
  groups: BoxGroup[];
}

export const boxInterval: Renderer<BoxData> = {
  id: "box-interval",
  parse(d) {
    const o = obj(d, "data");
    const a = obj(o.axis, "data.axis");
    return {
      unit: str(o.unit, "data.unit"),
      dp: o.dp === undefined ? 0 : num(o.dp, "data.dp"),
      axis: { min: num(a.min, "data.axis.min"), max: num(a.max, "data.axis.max"), step: num(a.step, "data.axis.step") },
      groups: arr(o.groups, "data.groups").map((g, i) => {
        const r = obj(g, `data.groups[${i}]`);
        const p = `data.groups[${i}]`;
        return {
          label: str(r.label, `${p}.label`),
          n: num(r.n, `${p}.n`),
          min: num(r.min, `${p}.min`),
          q1: num(r.q1, `${p}.q1`),
          median: num(r.median, `${p}.median`),
          q3: num(r.q3, `${p}.q3`),
          max: num(r.max, `${p}.max`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.groups.length, 2, "groups"),
      ...maxItems(d.groups.length, 8, "groups"),
      ...uniqueLabels(d.groups.map((g) => g.label), "group labels"),
    ];
    if (!(d.axis.max > d.axis.min) || !(d.axis.step > 0)) issues.push({ rule: "axis-explicit", message: "axis needs max > min and step > 0" });
    for (const g of d.groups) {
      issues.push(
        ...ordered(g.min, g.q1, g.median, g.label).map((i) => ({ ...i, message: `${g.label}: min ≤ q1 ≤ median violated` })),
        ...ordered(g.q1, g.median, g.q3, g.label).map((i) => ({ ...i, message: `${g.label}: q1 ≤ median ≤ q3 violated` })),
        ...ordered(g.median, g.q3, g.max, g.label).map((i) => ({ ...i, message: `${g.label}: median ≤ q3 ≤ max violated` })),
        ...within([g.min, g.q1, g.median, g.q3, g.max], d.axis.min, d.axis.max, `${g.label} summary values`),
      );
      if (!Number.isInteger(g.n) || g.n < 5) issues.push({ rule: "min-observations", message: `${g.label}: n = ${g.n}; quartiles need a whole-number n of at least 5` });
    }
    return issues;
  },
  render(h, d) {
    const groups = [...d.groups].sort((a, b) => a.median - b.median);
    const labelW = 1.75;
    const statW = 1.15;
    const top = h.area.y + 0.4;
    const bottom = h.area.y + h.area.h - 0.34;
    const x0 = h.area.x + labelW;
    const x1 = h.area.x + h.area.w - statW;
    const sx = scale(d.axis.min, d.axis.max, x0, x1);
    const rowH = (bottom - top) / groups.length;
    const boxH = Math.min(0.36, rowH * 0.55);

    h.text("unit", "axis", d.unit, { x: h.area.x, y: h.area.y, w: 2.9, h: 0.26, fontSize: 11, color: C.muted });
    let lx = h.area.x + 2.9;
    lx = legendItem(h, "legend-whisker", lx, h.area.y, "Min to max", { fill: C.neutralDark }, 1.3);
    lx = legendItem(h, "legend-box", lx, h.area.y, "Interquartile range", { fill: C.neutralLight, line: C.neutralDark }, 1.85);
    legendItem(h, "legend-median", lx, h.area.y, "Median", { fill: C.accent }, 1.0);

    for (let v = d.axis.min, k = 0; v <= d.axis.max + 1e-9; v += d.axis.step, k++) {
      vline(h, `grid-${k}`, "axis", sx(v), top - 0.04, bottom - top + 0.04, C.soft);
      h.text(`axis-tick-${k}`, "axis", fmt(v, d.dp), {
        x: sx(v) - 0.4, y: bottom + 0.05, w: 0.8, h: 0.24, fontSize: 11, color: C.muted, align: "center",
      });
    }
    h.text("axis-stat-head", "axis", "Median · n", {
      x: x1 + 0.2, y: top - 0.3, w: statW - 0.2, h: 0.24, fontSize: 11, bold: true, color: C.muted,
    });

    groups.forEach((g, i) => {
      const cy = top + rowH * (i + 0.5);
      if (i > 0) hairline(h, `row-rule-${i}`, "axis", h.area.x, top + rowH * i, h.area.w, C.soft);
      h.text(`row-label-${i}`, "label", g.label, {
        x: h.area.x, y: cy - 0.15, w: labelW - 0.15, h: 0.3, fontSize: 11, color: C.ink, valign: "middle",
      });
      h.shape(`whisker-${i}`, "data", h.shapes.rect, {
        x: sx(g.min), y: cy - 0.008, w: Math.max(sx(g.max) - sx(g.min), 0.001), h: 0.016,
        fill: { color: C.neutralDark }, line: { color: C.neutralDark, width: 0 },
      });
      for (const [k, v] of [["min", g.min], ["max", g.max]] as const) {
        h.shape(`whisker-cap-${k}-${i}`, "data", h.shapes.rect, {
          x: sx(v) - 0.008, y: cy - boxH * 0.3, w: 0.016, h: boxH * 0.6,
          fill: { color: C.neutralDark }, line: { color: C.neutralDark, width: 0 },
        });
      }
      h.shape(`box-${i}`, "data", h.shapes.rect, {
        x: sx(g.q1), y: cy - boxH / 2, w: Math.max(sx(g.q3) - sx(g.q1), 0.001), h: boxH,
        fill: { color: C.neutralLight }, line: { color: C.neutralDark, width: 1 },
      });
      h.shape(`median-${i}`, "data", h.shapes.rect, {
        x: sx(g.median) - 0.02, y: cy - boxH / 2 - 0.04, w: 0.04, h: boxH + 0.08,
        fill: { color: C.accent }, line: { color: C.accent, width: 0 },
      });
      h.text(`stat-${i}`, "label", `${fmt(g.median, d.dp)} · n = ${g.n}`, {
        x: x1 + 0.2, y: cy - 0.15, w: statW - 0.2, h: 0.3, fontSize: 11, color: C.ink, valign: "middle",
      });
    });
  },
};
