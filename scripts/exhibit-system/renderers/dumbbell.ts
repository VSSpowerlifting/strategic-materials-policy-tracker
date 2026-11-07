// B1 dumbbell — two observations per category on one shared magnitude axis.
// Native shapes on a computed linear scale: geometry and labels are editable,
// values are NOT data-bound (no embedded workbook).
import { arr, num, obj, optNum, str } from "../contract";
import { maxItems, minItems, nonNegative, uniqueLabels } from "../integrity";
import { C, fmt, hairline, scale, vline, niceMax } from "../primitives";
import type { Renderer } from "../types";

export interface DumbbellData {
  unit: string;
  dp: number;
  fromLabel: string;
  toLabel: string;
  axisMax?: number;
  items: { label: string; from: number; to: number }[];
}

export const dumbbell: Renderer<DumbbellData> = {
  id: "dumbbell",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      fromLabel: str(o.fromLabel, "data.fromLabel"),
      toLabel: str(o.toLabel, "data.toLabel"),
      axisMax: optNum(o.axisMax, "data.axisMax"),
      items: arr(o.items, "data.items").map((x, i) => {
        const r = obj(x, `data.items[${i}]`);
        return {
          label: str(r.label, `data.items[${i}].label`),
          from: num(r.from, `data.items[${i}].from`),
          to: num(r.to, `data.items[${i}].to`),
        };
      }),
    };
  },
  check(d) {
    const all = d.items.flatMap((i) => [i.from, i.to]);
    const issues = [
      ...nonNegative(all),
      ...minItems(d.items.length, 3, "rows"),
      ...maxItems(d.items.length, 10, "rows"),
      ...uniqueLabels(d.items.map((i) => i.label)),
    ];
    if (d.axisMax !== undefined && (!(d.axisMax > 0) || Math.max(...all) > d.axisMax)) {
      issues.push({ rule: "bounded-values", message: `axisMax ${d.axisMax} is below the largest value` });
    }
    return issues;
  },
  render(h, d) {
    const items = [...d.items].sort((a, b) => b.to - a.to);
    const labelW = 2.1;
    const valueGutter = 1.55;
    const top = h.area.y + 0.46;
    const bottom = h.area.y + h.area.h - 0.34;
    const x0 = h.area.x + labelW;
    const x1 = h.area.x + h.area.w - valueGutter;
    const max = d.axisMax ?? niceMax(Math.max(...items.flatMap((i) => [i.from, i.to])) * 1.05);
    const sx = scale(0, max, x0, x1);
    const rowH = (bottom - top) / items.length;
    const dot = 0.17;

    [d.fromLabel, d.toLabel].forEach((label, i) => {
      const x = h.area.x + i * 1.9;
      const color = i ? C.accent : C.neutralLight;
      h.shape(`legend-dot-${i}`, "legend", h.shapes.ellipse, { x, y: h.area.y + 0.05, w: dot, h: dot, fill: { color }, line: { color: C.neutralDark, width: 0.75 } });
      h.text(`legend-label-${i}`, "legend", label, { x: x + 0.28, y: h.area.y, w: 1.6, h: 0.26, fontSize: 11 });
    });
    h.text("unit", "axis", d.unit, {
      x: h.area.x + h.area.w - 3.2, y: h.area.y, w: 3.2, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    for (let i = 0; i <= 4; i++) {
      const value = max * i / 4;
      const x = sx(value);
      vline(h, `grid-${i}`, "axis", x, top - 0.06, bottom - top + 0.06, i === 0 ? C.border : C.soft);
      h.text(`tick-${i}`, "axis", fmt(value, Math.max(d.dp, Number.isInteger(value) ? 0 : 1)), {
        x: x - 0.4, y: bottom + 0.04, w: 0.8, h: 0.24, fontSize: 11, color: C.muted, align: "center",
      });
    }

    items.forEach((it, i) => {
      const cy = top + rowH * (i + 0.5);
      if (i > 0) hairline(h, `row-rule-${i}`, "axis", h.area.x, top + rowH * i, h.area.w, C.soft);
      h.text(`row-label-${i}`, "label", it.label, {
        x: h.area.x, y: cy - 0.15, w: labelW - 0.15, h: 0.3, fontSize: 11, color: C.ink, valign: "middle",
      });
      const a = sx(Math.min(it.from, it.to));
      const b = sx(Math.max(it.from, it.to));
      h.shape(`connector-${i}`, "data", h.shapes.rect, {
        x: a, y: cy - 0.015, w: Math.max(b - a, 0.001), h: 0.03,
        fill: { color: C.neutral }, line: { color: C.neutral, width: 0 },
      });
      h.shape(`from-${i}`, "data", h.shapes.ellipse, {
        x: sx(it.from) - dot / 2, y: cy - dot / 2, w: dot, h: dot,
        fill: { color: C.neutralLight }, line: { color: C.neutralDark, width: 0.75 },
      });
      h.shape(`to-${i}`, "data", h.shapes.ellipse, {
        x: sx(it.to) - dot / 2, y: cy - dot / 2, w: dot, h: dot,
        fill: { color: C.accent }, line: { color: C.accent, width: 0.75 },
      });
      const delta = it.to - it.from;
      h.text(`value-${i}`, "label", `${fmt(it.to, d.dp)} (${fmt(delta, d.dp, { sign: true })})`, {
        x: x1 + 0.16, y: cy - 0.14, w: 1.5, h: 0.28, fontSize: 11, color: C.ink, valign: "middle",
      });
    });
  },
};
