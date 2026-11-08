// H1 strip-plot — one row per group, every observation drawn as a dot.
// Native shapes on a computed linear scale; values are NOT data-bound.
// Jitter is deterministic (by observation rank within the group), never random.
import { arr, num, numList, obj, str } from "../contract";
import { maxItems, minItems, uniqueLabels, within } from "../integrity";
import { C, fmt, hairline, scale, vline } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface StripData {
  unit: string;
  dp: number;
  axis: { min: number; max: number; step: number };
  groups: { label: string; values: number[] }[];
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Deterministic vertical offsets (in row-height fractions) cycling by rank. */
const JITTER = [0, 0.14, -0.14, 0.28, -0.28];

export const stripPlot: Renderer<StripData> = {
  id: "strip-plot",
  parse(d) {
    const o = obj(d, "data");
    const a = obj(o.axis, "data.axis");
    return {
      unit: str(o.unit, "data.unit"),
      dp: o.dp === undefined ? 0 : num(o.dp, "data.dp"),
      axis: { min: num(a.min, "data.axis.min"), max: num(a.max, "data.axis.max"), step: num(a.step, "data.axis.step") },
      groups: arr(o.groups, "data.groups").map((g, i) => {
        const r = obj(g, `data.groups[${i}]`);
        return { label: str(r.label, `data.groups[${i}].label`), values: numList(r.values, `data.groups[${i}].values`) };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.groups.length, 2, "groups"),
      ...maxItems(d.groups.length, 8, "groups"),
      ...uniqueLabels(d.groups.map((g) => g.label), "group labels"),
      ...within(d.groups.flatMap((g) => g.values), d.axis.min, d.axis.max, "observations"),
    ];
    if (!(d.axis.max > d.axis.min) || !(d.axis.step > 0)) issues.push({ rule: "axis-explicit", message: "axis needs max > min and step > 0" });
    for (const g of d.groups) {
      if (g.values.length < 5) issues.push({ rule: "min-observations", message: `${g.label}: ${g.values.length} observations are too few for a strip` });
      if (g.values.length > 40) issues.push({ rule: "max-observations", message: `${g.label}: ${g.values.length} observations exceed 40 per row` });
    }
    return issues;
  },
  render(h, d) {
    const groups = d.groups.map((g) => ({ ...g, med: median(g.values) })).sort((a, b) => a.med - b.med);
    const labelW = 1.75;
    const statW = 1.55;
    const top = h.area.y + 0.34;
    const bottom = h.area.y + h.area.h - 0.34;
    const x0 = h.area.x + labelW;
    const x1 = h.area.x + h.area.w - statW;
    const sx = scale(d.axis.min, d.axis.max, x0, x1);
    const rowH = (bottom - top) / groups.length;
    const dot = 0.12;

    h.text("unit", "axis", `${d.unit} · each dot is one observation; accent tick is the group median`, {
      x: h.area.x, y: h.area.y, w: h.area.w, h: 0.26, fontSize: 11, color: C.muted,
    });
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
      h.shape(`median-${i}`, "data", h.shapes.rect, {
        x: sx(g.med) - 0.017, y: cy - rowH * 0.42, w: 0.034, h: rowH * 0.84,
        fill: { color: C.accent }, line: { color: C.accent, width: 0 },
      });
      [...g.values].sort((a, b) => a - b).forEach((v, k) => {
        const dy = JITTER[k % JITTER.length] * rowH;
        h.shape(`dot-${i}-${k}`, "data", h.shapes.ellipse, {
          x: sx(v) - dot / 2, y: cy + dy - dot / 2, w: dot, h: dot,
          fill: { color: C.neutral }, line: { color: C.paper, width: 0.5 },
        });
      });
      h.text(`stat-${i}`, "label", `${fmt(g.med, d.dp)} · n = ${g.values.length}`, {
        x: x1 + 0.2, y: cy - 0.15, w: statW - 0.2, h: 0.3, fontSize: 11, color: C.ink, valign: "middle",
      });
    });
  },
};
