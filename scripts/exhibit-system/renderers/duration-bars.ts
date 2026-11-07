// I5 duration bars — elapsed time between two dated stages per item, as bars that
// start at zero days and are sorted by duration. Native shapes on a computed linear
// scale (day counts via Date.UTC): lengths are derived at build time, NOT data-bound.
// The two stage dates are written under each item name so the bar stays checkable.
import { arr, isoDate, obj, str } from "../contract";
import { dateOrder, maxItems, minItems, uniqueLabels } from "../integrity";
import { C, fmt, legendItem, niceMax, scale, vline, hairline } from "../primitives";
import type { IntegrityIssue, RenderHelpers, Renderer } from "../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DurationItem {
  label: string;
  from: string;
  to: string;
}
export interface DurationBarsData {
  fromLabel: string;
  toLabel: string;
  items: DurationItem[];
}

const dayNum = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
const longDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const days = (it: DurationItem): number => dayNum(it.to) - dayNum(it.from);
const LABEL_MAX = 28;

export const durationBars: Renderer<DurationBarsData> = {
  id: "duration-bars",
  parse(raw) {
    const o = obj(raw, "data");
    return {
      fromLabel: str(o.fromLabel, "data.fromLabel"),
      toLabel: str(o.toLabel, "data.toLabel"),
      items: arr(o.items, "data.items").map((x, i) => {
        const p = `data.items[${i}]`;
        const r = obj(x, p);
        return { label: str(r.label, `${p}.label`), from: isoDate(r.from, `${p}.from`), to: isoDate(r.to, `${p}.to`) };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.items.length, 3, "items"),
      ...maxItems(d.items.length, 10, "items"),
      ...uniqueLabels(d.items.map((i) => i.label), "item labels"),
    ];
    d.items.forEach((i) => {
      issues.push(...dateOrder(i.from, i.to, i.label));
      if (i.label.length > LABEL_MAX) issues.push({ rule: "label-length", message: `"${i.label}" exceeds ${LABEL_MAX} characters` });
    });
    return issues;
  },
  render(h: RenderHelpers, d) {
    const a = h.area;
    const items = [...d.items].sort((p, q) => days(q) - days(p) || p.label.localeCompare(q.label));
    const labelW = 2.55;
    const valueW = 1.85;
    const top = a.y + 0.5;
    const bottom = a.y + a.h - 0.34;
    const x0 = a.x + labelW;
    const x1 = a.x + a.w - valueW;
    const max = niceMax(days(items[0]));
    const sx = scale(0, max, x0, x1);
    const rowH = (bottom - top) / items.length;
    const barH = Math.min(0.28, rowH * 0.5);

    legendItem(h, "legend-measure", a.x, a.y, `Elapsed days, ${d.fromLabel} to ${d.toLabel}`, { fill: C.neutral }, 4.6);

    // Zero baseline.
    vline(h, "baseline-zero", "axis", x0, top - 0.06, bottom - top + 0.06, C.neutral);
    h.text("axis-zero", "axis", "0", { x: x0 - 0.3, y: bottom + 0.04, w: 0.6, h: 0.24, fontSize: 10, color: C.muted, align: "center" });
    h.text("axis-max", "axis", `${fmt(max)} days`, { x: x1 - 0.7, y: bottom + 0.04, w: 1.4, h: 0.24, fontSize: 10, color: C.muted, align: "center" });
    h.text("axis-note", "axis", "Bars start at zero days", { x: x0 + 0.5, y: bottom + 0.04, w: 2.4, h: 0.24, fontSize: 10, color: C.muted, align: "left" });

    items.forEach((it, i) => {
      const cy = top + rowH * (i + 0.5);
      const n = days(it);
      if (i > 0) hairline(h, `row-rule-${i}`, "axis", a.x, top + rowH * i, a.w, C.soft);
      h.text(`row-label-${i}`, "label", [
        { text: it.label, options: { fontSize: 11, color: C.ink, breakLine: true } },
        { text: `${longDate(it.from)} → ${longDate(it.to)}`, options: { fontSize: 9, color: C.muted } },
      ], { x: a.x, y: cy - 0.22, w: labelW - 0.15, h: 0.44, valign: "middle" });
      const color = i === 0 ? C.accent : C.neutral;
      h.shape(`bar-${i}`, "data", h.shapes.rect, {
        x: x0, y: cy - barH / 2, w: Math.max(sx(n) - x0, 0.012), h: barH, fill: { color }, line: { color, width: 0 },
      });
      h.text(`value-${i}`, "label", [
        { text: `${fmt(n)} days`, options: { bold: true, fontSize: 11, color: C.ink } },
        { text: `  ${fmt(n / 30.4375, 1)} mo`, options: { fontSize: 10, color: C.muted } },
      ], { x: sx(n) + 0.1, y: cy - 0.14, w: valueW + 0.5, h: 0.28, valign: "middle" });
    });
  },
};
