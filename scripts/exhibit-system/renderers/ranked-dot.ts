// A2 ranked-dot — Cleveland dot plot: one dot per item on a shared axis that
// need not start at zero. Native shapes on a computed linear scale; values are
// NOT data-bound. The axis range is stated on the slide.
import { arr, bool, num, obj, optNum, str } from "../contract";
import { maxItems, minItems, uniqueLabels, within } from "../integrity";
import { C, fmt, scale, vline } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface RankedDotData {
  unit: string;
  dp: number;
  axisMin: number;
  axisMax: number;
  tickStep: number;
  items: { label: string; value: number; highlight: boolean }[];
}

export const rankedDot: Renderer<RankedDotData> = {
  id: "ranked-dot",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      axisMin: num(o.axisMin, "data.axisMin"),
      axisMax: num(o.axisMax, "data.axisMax"),
      tickStep: num(o.tickStep, "data.tickStep"),
      items: arr(o.items, "data.items").map((x, i) => {
        const r = obj(x, `data.items[${i}]`);
        return {
          label: str(r.label, `data.items[${i}].label`),
          value: num(r.value, `data.items[${i}].value`),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.items[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.items.length, 4, "dots"),
      ...maxItems(d.items.length, 12, "dots"),
      ...uniqueLabels(d.items.map((i) => i.label)),
      ...within(d.items.map((i) => i.value), d.axisMin, d.axisMax, "dot values"),
    ];
    if (!(d.axisMax > d.axisMin) || !(d.tickStep > 0)) {
      issues.push({ rule: "axis-range", message: "axisMax must exceed axisMin and tickStep must be positive" });
    }
    if (d.items.filter((i) => i.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "highlight at most one result per chart" });
    }
    return issues;
  },
  render(h, d) {
    const items = [...d.items].sort((a, b) => b.value - a.value);
    const labelW = 2.1;
    const top = h.area.y + 0.42;
    const bottom = h.area.y + h.area.h - 0.62;
    const x0 = h.area.x + labelW;
    const x1 = h.area.x + h.area.w - 0.75;
    const sx = scale(d.axisMin, d.axisMax, x0, x1);
    const rowH = (bottom - top) / items.length;
    const dot = 0.19;

    h.text("unit", "axis", `${d.unit}`, {
      x: h.area.x, y: h.area.y, w: h.area.w, h: 0.26, fontSize: 10, color: C.muted,
    });

    // Gridlines and tick labels (axis range stated, not hidden).
    const axisDp = Number.isInteger(d.axisMin) && Number.isInteger(d.tickStep) ? 0 : d.dp;
    const ticks: number[] = [];
    for (let v = d.axisMin; v <= d.axisMax + 1e-9; v += d.tickStep) ticks.push(v);
    ticks.forEach((v, i) => {
      vline(h, `grid-${i}`, "axis", sx(v), top - 0.04, bottom - top + 0.04, i === 0 ? C.neutralLight : C.soft);
      h.text(`tick-${i}`, "axis", fmt(v, axisDp), {
        x: sx(v) - 0.4, y: bottom + 0.05, w: 0.8, h: 0.24, fontSize: 10, color: C.muted, align: "center",
      });
    });
    h.text("axis-note", "axis", `Axis runs from ${fmt(d.axisMin, axisDp)} to ${fmt(d.axisMax, axisDp)}; it does not start at zero`, {
      x: x0, y: bottom + 0.32, w: x1 - x0, h: 0.24, fontSize: 10, italic: true, color: C.muted, align: "center",
    });

    items.forEach((it, i) => {
      const cy = top + rowH * (i + 0.5);
      const accent = it.highlight;
      h.text(`row-label-${i}`, "label", it.label, {
        x: h.area.x, y: cy - 0.15, w: labelW - 0.15, h: 0.3, fontSize: 11, bold: accent, color: C.ink, valign: "middle",
      });
      // Guide from the axis start to the dot keeps the eye on the row without implying a zero-based bar.
      h.shape(`guide-${i}`, "axis", h.shapes.rect, {
        x: x0, y: cy - 0.004, w: Math.max(sx(it.value) - x0, 0.001), h: 0.008,
        fill: { color: C.border }, line: { color: C.border, width: 0 },
      });
      h.shape(`dot-${i}`, "data", h.shapes.ellipse, {
        x: sx(it.value) - dot / 2, y: cy - dot / 2, w: dot, h: dot,
        fill: { color: accent ? C.accent : C.neutral }, line: { color: accent ? C.accent : C.neutralDark, width: 0.75 },
      });
      h.text(`value-${i}`, "label", fmt(it.value, d.dp), {
        x: sx(it.value) + 0.16, y: cy - 0.14, w: 0.8, h: 0.28, fontSize: 11, bold: accent, color: C.ink, valign: "middle",
      });
    });
  },
};
