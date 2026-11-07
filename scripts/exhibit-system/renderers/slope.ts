// B2 slope — two-period slope chart, 3–8 items, one accent line.
// Native shapes (lines, dots, text) on a computed scale; values are NOT
// data-bound. End labels get a simple vertical de-collision.
import { arr, bool, num, obj, optNum, str } from "../contract";
import { maxItems, minItems, uniqueLabels } from "../integrity";
import { C, fmt, scale } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface SlopeData {
  unit: string;
  dp: number;
  fromLabel: string;
  toLabel: string;
  items: { label: string; from: number; to: number; highlight: boolean }[];
}

/** Push positions apart so neighbours are at least `gap` apart, staying inside [lo, hi]. */
export function spread(ys: number[], gap: number, lo: number, hi: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y || a.i - b.i);
  const out = order.map((o) => Math.min(Math.max(o.y, lo), hi));
  for (let k = 1; k < out.length; k++) out[k] = Math.max(out[k], out[k - 1] + gap);
  const last = out.length - 1;
  if (out[last] > hi) {
    out[last] = hi;
    for (let k = last - 1; k >= 0; k--) out[k] = Math.min(out[k], out[k + 1] - gap);
  }
  const res = new Array<number>(ys.length).fill(0);
  order.forEach((o, k) => {
    res[o.i] = out[k];
  });
  return res;
}

export const slope: Renderer<SlopeData> = {
  id: "slope",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      fromLabel: str(o.fromLabel, "data.fromLabel"),
      toLabel: str(o.toLabel, "data.toLabel"),
      items: arr(o.items, "data.items").map((x, i) => {
        const r = obj(x, `data.items[${i}]`);
        return {
          label: str(r.label, `data.items[${i}].label`),
          from: num(r.from, `data.items[${i}].from`),
          to: num(r.to, `data.items[${i}].to`),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.items[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.items.length, 3, "lines"),
      ...maxItems(d.items.length, 8, "lines"),
      ...uniqueLabels(d.items.map((i) => i.label)),
    ];
    if (d.items.filter((i) => i.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "highlight at most one result per chart" });
    }
    if (d.fromLabel === d.toLabel) {
      issues.push({ rule: "distinct-periods", message: "the two observation labels must differ" });
    }
    return issues;
  },
  render(h, d) {
    const a = h.area;
    const top = a.y + 0.62;
    const bottom = a.y + a.h - 0.5;
    const leftX = a.x + 2.7;
    const rightX = a.x + 6.0;
    const all = d.items.flatMap((i) => [i.from, i.to]);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const sy = scale(lo, hi, bottom, top); // larger value → higher on slide
    const gap = 0.3;
    const dot = 0.13;

    h.text("unit", "axis", d.unit, { x: a.x, y: a.y, w: a.w, h: 0.26, fontSize: 11, color: C.muted });
    h.text("col-from", "axis", d.fromLabel, {
      x: leftX - 1.0, y: a.y + 0.3, w: 2.0, h: 0.28, fontSize: 12, bold: true, color: C.ink, align: "center",
    });
    h.text("col-to", "axis", d.toLabel, {
      x: rightX - 1.0, y: a.y + 0.3, w: 2.0, h: 0.28, fontSize: 12, bold: true, color: C.ink, align: "center",
    });
    h.text("scale-note", "axis", `Vertical positions are linear in value, from ${fmt(lo, d.dp)} (bottom) to ${fmt(hi, d.dp)} (top); no zero baseline`, {
      x: a.x, y: a.y + a.h - 0.28, w: a.w, h: 0.26, fontSize: 11, italic: true, color: C.muted,
    });

    const leftY = spread(d.items.map((i) => sy(i.from)), gap, top, bottom);
    const rightY = spread(d.items.map((i) => sy(i.to)), gap, top, bottom);

    // Draw neutral lines first so the accent line sits on top.
    const order = d.items.map((_, i) => i).sort((p, q) => Number(d.items[p].highlight) - Number(d.items[q].highlight));
    for (const i of order) {
      const it = d.items[i];
      const accent = it.highlight;
      const y0 = sy(it.from);
      const y1 = sy(it.to);
      h.line(`slope-${i}`, "data", {
        x: leftX, y: Math.min(y0, y1), w: rightX - leftX, h: Math.abs(y1 - y0),
        flipV: y1 < y0,
        line: { color: accent ? C.accent : C.neutral, width: accent ? 3 : 1.5 },
      });
      for (const [tag, x, y] of [["from", leftX, y0], ["to", rightX, y1]] as const) {
        h.shape(`dot-${tag}-${i}`, "data", h.shapes.ellipse, {
          x: x - dot / 2, y: y - dot / 2, w: dot, h: dot,
          fill: { color: accent ? C.accent : C.neutralDark }, line: { color: C.paper, width: 0.75 },
        });
      }
    }
    d.items.forEach((it, i) => {
      const accent = it.highlight;
      const colour = accent ? C.accent : C.ink;
      h.text(`end-left-${i}`, "label", [
        { text: `${it.label}  `, options: { bold: accent } },
        { text: fmt(it.from, d.dp), options: { bold: true } },
      ], {
        x: a.x, y: leftY[i] - 0.14, w: leftX - a.x - 0.16, h: 0.28, fontSize: 11, color: colour, align: "right", valign: "middle",
      });
      h.text(`end-right-${i}`, "label", [
        { text: fmt(it.to, d.dp), options: { bold: true } },
        { text: `  ${it.label}`, options: { bold: accent } },
      ], {
        x: rightX + 0.16, y: rightY[i] - 0.14, w: a.x + a.w - rightX - 0.16, h: 0.28, fontSize: 11, color: colour, valign: "middle",
      });
    });
  },
};
