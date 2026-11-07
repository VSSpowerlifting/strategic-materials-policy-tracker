// I2 swimlane — 3 to 6 lanes (actors or instruments), dated periods as bars and
// point events as diamonds on one quarterly date axis. Native shapes on a computed
// date scale (day counts via Date.UTC): positions are derived at build time, NOT
// data-bound. Planned (not yet in effect) periods are drawn hollow and dashed.
import { arr, bool, isoDate, obj, oneOf, str } from "../contract";
import { dateOrder, maxItems, minItems, uniqueLabels } from "../integrity";
import { C, vline } from "../primitives";
import type { IntegrityIssue, RenderHelpers, Renderer } from "../types";

const ITEM_TYPES = ["period", "point"] as const;
type ItemType = (typeof ITEM_TYPES)[number];

export interface SwimItem {
  type: ItemType;
  label: string;
  /** Period start, or the date of a point event. */
  start: string;
  /** Period end (periods only). */
  end?: string;
  /** Period not yet in effect: drawn hollow and dashed. */
  planned: boolean;
  highlight: boolean;
}
export interface SwimLane {
  name: string;
  items: SwimItem[];
}
export interface SwimlaneData {
  lanes: SwimLane[];
}

const dayNum = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
const quarterStart = (iso: string): { y: number; q: number } => {
  const [y, m] = iso.split("-").map(Number);
  return { y, q: Math.floor((m - 1) / 3) };
};
const qIso = (y: number, q: number): string => {
  const yy = y + Math.floor(q / 4);
  return `${yy}-${String(((q % 4) * 3) + 1).padStart(2, "0")}-01`;
};

const LABEL_MAX = 24;
const GUTTER = 1.4;
const labelW = (s: string): number => s.length * 0.076 + 0.08;
const endOf = (it: SwimItem): string => it.end ?? it.start;

function geometry(areaX: number, areaW: number, d: SwimlaneData) {
  const dates = d.lanes.flatMap((l) => l.items.flatMap((i) => [i.start, endOf(i)])).sort();
  const first = quarterStart(dates[0]);
  const last = quarterStart(dates[dates.length - 1]);
  const q0 = first.y * 4 + first.q;
  const q1 = last.y * 4 + last.q + 1;
  const d0 = dayNum(qIso(Math.floor(q0 / 4), q0 % 4));
  const d1 = dayNum(qIso(Math.floor(q1 / 4), q1 % 4));
  const x0 = areaX + GUTTER;
  const x1 = areaX + areaW;
  const sx = (iso: string) => x0 + ((dayNum(iso) - d0) * (x1 - x0)) / (d1 - d0);
  return { q0, q1, x0, x1, sx };
}

/** Left edge and width of an item's label (anchored at the item's start). */
function labelSpan(sx: (iso: string) => number, it: SwimItem): [number, number] {
  const a = it.type === "point" ? sx(it.start) - 0.09 : sx(it.start);
  return [a, a + labelW(it.label)];
}

export const swimlane: Renderer<SwimlaneData> = {
  id: "swimlane",
  parse(raw) {
    const o = obj(raw, "data");
    return {
      lanes: arr(o.lanes, "data.lanes").map((l, i) => {
        const lo = obj(l, `data.lanes[${i}]`);
        return {
          name: str(lo.name, `data.lanes[${i}].name`),
          items: arr(lo.items, `data.lanes[${i}].items`).map((e, j) => {
            const p = `data.lanes[${i}].items[${j}]`;
            const eo = obj(e, p);
            const type = oneOf(eo.type, ITEM_TYPES, `${p}.type`);
            const start = isoDate(type === "point" ? eo.date : eo.start, `${p}.${type === "point" ? "date" : "start"}`);
            return {
              type,
              label: str(eo.label, `${p}.label`),
              start,
              end: type === "period" ? isoDate(eo.end, `${p}.end`) : undefined,
              planned: eo.planned === undefined ? false : bool(eo.planned, `${p}.planned`),
              highlight: eo.highlight === undefined ? false : bool(eo.highlight, `${p}.highlight`),
            };
          }),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.lanes.length, 3, "lanes"),
      ...maxItems(d.lanes.length, 6, "lanes"),
      ...uniqueLabels(d.lanes.map((l) => l.name), "lane names"),
      ...uniqueLabels(d.lanes.flatMap((l) => l.items.map((i) => i.label)), "item labels"),
    ];
    if (d.lanes.flatMap((l) => l.items).filter((i) => i.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "at most one item may carry the accent highlight" });
    }
    d.lanes.forEach((l) => {
      l.items.forEach((i) => {
        if (i.end !== undefined) issues.push(...dateOrder(i.start, i.end, `${l.name} / ${i.label}`));
        if (i.label.length > LABEL_MAX) issues.push({ rule: "label-length", message: `"${i.label}" exceeds ${LABEL_MAX} characters` });
      });
    });
    if (issues.length === 0) {
      const g = geometry(0, 12.05, d);
      d.lanes.forEach((l) => {
        const items = [...l.items].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
        for (let i = 1; i < items.length; i++) {
          if (items[i].start < endOf(items[i - 1])) {
            issues.push({ rule: "lane-overlap", message: `${l.name}: "${items[i - 1].label}" and "${items[i].label}" overlap in time` });
          }
          if (labelSpan(g.sx, items[i])[0] < labelSpan(g.sx, items[i - 1])[1] + 0.05) {
            issues.push({ rule: "label-overlap", message: `${l.name}: labels "${items[i - 1].label}" and "${items[i].label}" collide` });
          }
        }
        const last = items[items.length - 1];
        if (labelSpan(g.sx, last)[1] > g.x1 + 0.02) {
          issues.push({ rule: "label-overlap", message: `${l.name}: label "${last.label}" runs past the axis end` });
        }
      });
    }
    return issues;
  },
  render(h: RenderHelpers, d) {
    const a = h.area;
    const g = geometry(a.x, a.w, d);
    const headTop = a.y + 0.32;
    const lanesTop = headTop + 0.5;
    const lanesBottom = a.y + a.h - 0.02;
    const laneH = Math.min((lanesBottom - lanesTop) / d.lanes.length, 0.72);
    const gridBottom = lanesTop + laneH * d.lanes.length;
    const hasHighlight = d.lanes.some((l) => l.items.some((i) => i.highlight));
    const barH = Math.min(0.27, laneH * 0.4);

    // Legend.
    let lx = a.x;
    h.shape("legend-period", "legend", h.shapes.rect, { x: lx, y: a.y + 0.06, w: 0.3, h: 0.15, fill: { color: C.neutral }, line: { color: C.neutral, width: 0.75 } });
    h.text("legend-period-label", "legend", "Period in effect", { x: lx + 0.38, y: a.y, w: 1.4, h: 0.26, fontSize: 10, color: C.ink });
    lx += 1.85;
    h.shape("legend-planned", "legend", h.shapes.rect, { x: lx, y: a.y + 0.06, w: 0.3, h: 0.15, fill: { color: C.paper }, line: { color: C.neutralDark, width: 1.25, dashType: "dash" } });
    h.text("legend-planned-label", "legend", "Planned period", { x: lx + 0.38, y: a.y, w: 1.3, h: 0.26, fontSize: 10, color: C.ink });
    lx += 1.75;
    h.shape("legend-point", "legend", h.shapes.diamond, { x: lx + 0.07, y: a.y + 0.04, w: 0.19, h: 0.19, fill: { color: C.neutralDark }, line: { color: C.paper, width: 0.75 } });
    h.text("legend-point-label", "legend", "Point event", { x: lx + 0.38, y: a.y, w: 1.1, h: 0.26, fontSize: 10, color: C.ink });
    lx += 1.5;
    if (hasHighlight) {
      h.shape("legend-highlight", "legend", h.shapes.rect, { x: lx, y: a.y + 0.06, w: 0.3, h: 0.15, fill: { color: C.accent }, line: { color: C.accent, width: 0.75 } });
      h.text("legend-highlight-label", "legend", "Longest period", { x: lx + 0.38, y: a.y, w: 1.3, h: 0.26, fontSize: 10, color: C.ink });
    }
    h.text("axis-note", "axis", "Positioned on a day-count scale", {
      x: a.x + a.w - 3.2, y: a.y, w: 3.2, h: 0.26, fontSize: 10, color: C.muted, align: "right",
    });

    // Quarter gridlines and headers (year row, quarter row).
    for (let q = g.q0; q <= g.q1; q++) {
      const x = g.sx(qIso(Math.floor(q / 4), q % 4));
      const yearEdge = q % 4 === 0;
      vline(h, `grid-${q}`, "axis", Math.min(x, g.x1 - 0.012), headTop + (yearEdge ? 0 : 0.24), gridBottom - headTop - (yearEdge ? 0 : 0.24), yearEdge ? C.neutralLight : C.soft);
      if (q < g.q1) {
        const xb = g.sx(qIso(Math.floor((q + 1) / 4), (q + 1) % 4));
        h.text(`quarter-label-${q}`, "axis", `Q${(q % 4) + 1}`, {
          x, y: headTop + 0.25, w: xb - x, h: 0.22, fontSize: 10, color: C.muted, align: "center", valign: "middle",
        });
        if (yearEdge) {
          const xe = g.sx(qIso(Math.floor(q / 4) + 1, 0));
          h.text(`year-label-${Math.floor(q / 4)}`, "axis", String(Math.floor(q / 4)), {
            x: x + 0.06, y: headTop, w: Math.min(xe, g.x1) - x - 0.06, h: 0.24, fontSize: 11, bold: true, color: C.neutralDark, valign: "middle",
          });
        }
      }
    }
    h.shape("header-rule", "axis", h.shapes.rect, { x: a.x, y: lanesTop - 0.02, w: a.w, h: 0.015, fill: { color: C.neutral }, line: { color: C.neutral, width: 0 } });

    d.lanes.forEach((lane, li) => {
      const top = lanesTop + laneH * li;
      if (li > 0) h.shape(`lane-rule-${li}`, "axis", h.shapes.rect, { x: a.x, y: top, w: a.w, h: 0.01, fill: { color: C.border }, line: { color: C.border, width: 0 } });
      h.text(`lane-name-${li}`, "label", lane.name, {
        x: a.x, y: top, w: GUTTER - 0.1, h: laneH, fontSize: 11, bold: true, color: C.neutralDark, valign: "middle",
      });
      const barY = top + 0.09;
      lane.items.forEach((it, ii) => {
        const x = g.sx(it.start);
        const color = it.highlight ? C.accent : C.neutral;
        if (it.type === "period") {
          const w = Math.max(g.sx(endOf(it)) - x, 0.04);
          h.shape(`period-${li}-${ii}`, "data", h.shapes.rect, it.planned
            ? { x, y: barY, w, h: barH, fill: { color: C.paper }, line: { color: C.neutralDark, width: 1.25, dashType: "dash" } }
            : { x, y: barY, w, h: barH, fill: { color }, line: { color, width: 0.75 } });
        } else {
          const s = barH * 1.05;
          h.shape(`point-${li}-${ii}`, "data", h.shapes.diamond, {
            x: x - s / 2, y: barY + (barH - s) / 2, w: s, h: s, fill: { color: it.highlight ? C.accent : C.neutralDark }, line: { color: C.paper, width: 0.75 },
          });
        }
        const [lx0] = labelSpan(g.sx, it);
        h.text(`item-label-${li}-${ii}`, "label", it.label, {
          x: lx0, y: barY + barH + 0.03, w: labelW(it.label), h: 0.22, fontSize: 10, color: C.ink, valign: "top",
        });
      });
    });
  },
};
