// A4 range-interval — per item a stated low–high range plus a point estimate.
// Native shapes on a zero-based computed scale; values are NOT data-bound.
import { arr, bool, num, obj, optNum, str } from "../contract";
import { maxItems, minItems, nonNegative, ordered, uniqueLabels } from "../integrity";
import { C, fmt, legendItem, niceMax, scale, vline } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface RangeIntervalData {
  unit: string;
  dp: number;
  axisMax?: number;
  items: { label: string; low: number; point: number; high: number; highlight: boolean }[];
}

export const rangeInterval: Renderer<RangeIntervalData> = {
  id: "range-interval",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      axisMax: optNum(o.axisMax, "data.axisMax"),
      items: arr(o.items, "data.items").map((x, i) => {
        const r = obj(x, `data.items[${i}]`);
        return {
          label: str(r.label, `data.items[${i}].label`),
          low: num(r.low, `data.items[${i}].low`),
          point: num(r.point, `data.items[${i}].point`),
          high: num(r.high, `data.items[${i}].high`),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.items[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...nonNegative(d.items.flatMap((i) => [i.low, i.point, i.high])),
      ...minItems(d.items.length, 3, "ranges"),
      ...maxItems(d.items.length, 8, "ranges"),
      ...uniqueLabels(d.items.map((i) => i.label)),
    ];
    for (const i of d.items) issues.push(...ordered(i.low, i.point, i.high, i.label));
    if (d.axisMax !== undefined && Math.max(...d.items.map((i) => i.high)) > d.axisMax) {
      issues.push({ rule: "bounded-values", message: `axisMax ${d.axisMax} is below the largest high value` });
    }
    if (d.items.filter((i) => i.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "highlight at most one result per chart" });
    }
    return issues;
  },
  render(h, d) {
    const items = [...d.items].sort((a, b) => b.point - a.point);
    const labelW = 2.1;
    const top = h.area.y + 0.5;
    const bottom = h.area.y + h.area.h - 0.34;
    const x0 = h.area.x + labelW;
    const x1 = h.area.x + h.area.w - 0.6;
    const max = d.axisMax ?? niceMax(Math.max(...items.map((i) => i.high)) * 1.05);
    const sx = scale(0, max, x0, x1);
    const rowH = (bottom - top) / items.length;
    const barH = 0.2;
    const mark = 0.2;

    let lx = h.area.x;
    lx = legendItem(h, "legend-range", lx, h.area.y, "Stated range", { fill: C.neutralLight, line: C.neutral }, 1.7);
    legendItem(h, "legend-point", lx, h.area.y, "Point estimate", { fill: C.neutralDark }, 1.9);
    h.text("unit", "axis", d.unit, {
      x: h.area.x + h.area.w - 3.2, y: h.area.y, w: 3.2, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    const step = max / 5;
    for (let k = 0; k <= 5; k++) {
      const v = step * k;
      vline(h, k === 0 ? "baseline-zero" : `grid-${k}`, "axis", sx(v), top - 0.06, bottom - top + 0.06, k === 0 ? C.neutralLight : C.soft);
      h.text(`axis-tick-${k}`, "axis", fmt(v, d.dp), {
        x: sx(v) - 0.4, y: bottom + 0.04, w: 0.8, h: 0.24, fontSize: 11, color: C.muted, align: "center",
      });
    }

    items.forEach((it, i) => {
      const cy = top + rowH * (i + 0.5);
      const accent = it.highlight;
      h.text(`row-label-${i}`, "label", it.label, {
        x: h.area.x, y: cy - 0.15, w: labelW - 0.15, h: 0.3, fontSize: 11, bold: accent, color: C.ink, valign: "middle",
      });
      const a = sx(it.low);
      const b = sx(it.high);
      h.shape(`range-${i}`, "data", h.shapes.rect, {
        x: a, y: cy - barH / 2, w: Math.max(b - a, 0.02), h: barH,
        fill: { color: accent ? C.accent : C.neutralLight, transparency: accent ? 55 : 0 },
        line: { color: accent ? C.accent : C.neutral, width: 0.75 },
      });
      h.shape(`point-${i}`, "data", h.shapes.diamond, {
        x: sx(it.point) - mark / 2, y: cy - mark / 2 - 0.005, w: mark, h: mark + 0.01,
        fill: { color: accent ? C.accent : C.neutralDark }, line: { color: C.paper, width: 0.75 },
      });
      h.text(`low-${i}`, "label", fmt(it.low, d.dp), {
        x: a - 0.62, y: cy - 0.14, w: 0.54, h: 0.28, fontSize: 11, color: C.muted, align: "right", valign: "middle",
      });
      h.text(`high-${i}`, "label", fmt(it.high, d.dp), {
        x: b + 0.08, y: cy - 0.14, w: 0.54, h: 0.28, fontSize: 11, color: C.muted, valign: "middle",
      });
      h.text(`point-label-${i}`, "label", fmt(it.point, d.dp), {
        x: sx(it.point) - 0.35, y: cy - mark / 2 - 0.25, w: 0.7, h: 0.22, fontSize: 11, bold: true, color: accent ? C.accent : C.ink, align: "center", valign: "bottom",
      });
    });
  },
};
