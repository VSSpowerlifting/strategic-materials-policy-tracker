// I1 two-lane timeline — two jurisdictions' dated measures on one shared date axis.
// Native shapes on a computed date scale (day counts via Date.UTC): positions are
// derived from the fixture at build time, NOT data-bound. Labels are staggered by
// a deterministic descending staircase so no label crosses another label or stem.
import { arr, bool, isoDate, obj, oneOf, str } from "../contract";
import { datesAscending, maxItems, minItems, uniqueLabels } from "../integrity";
import { C, vline } from "../primitives";
import type { RenderHelpers, Renderer } from "../types";

const KINDS = ["announcement", "effective", "implementation"] as const;
type Kind = (typeof KINDS)[number];
const KIND_WORD: Record<Kind, string> = {
  announcement: "announced",
  effective: "effective",
  implementation: "implemented",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface TimelineEvent {
  label: string;
  date: string;
  kind: Kind;
}
export interface TimelineLane {
  name: string;
  events: TimelineEvent[];
}
export interface TwoLaneTimelineData {
  lanes: TimelineLane[];
  /** false omits the reading-convention note (default true). */
  conventionNote?: boolean;
}

const dayNum = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
const longDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const yearOf = (iso: string): number => Number(iso.slice(0, 4));

const MAX_LEVELS = 3;
const LABEL_MAX = 26;
const GAP = 0.1;

const line2 = (e: TimelineEvent): string => `${KIND_WORD[e.kind]} ${longDate(e.date)}`;
// Per-character allowances at 11 pt Archivo. Text boxes have no inset, so an allowance below the set
// width wraps the line and pushes a third line into the next label. 0.075 covers every date line
// (any kind, day and month, years 2020–2030; widest per character: "announced 30 May 2030").
const labelWidth = (e: TimelineEvent): number => Math.max(e.label.length * 0.082, line2(e).length * 0.075) + 0.1;

/** Descending staircase: working right to left, a label sits one level above every later label it would touch. */
function stagger(xs: number[], ws: number[]): number[] {
  const levels = new Array<number>(xs.length).fill(0);
  for (let i = xs.length - 1; i >= 0; i--) {
    let top = -1;
    for (let j = i + 1; j < xs.length; j++) {
      if (xs[j] < xs[i] + 0.07 + ws[i] + GAP) top = Math.max(top, levels[j]);
    }
    levels[i] = top + 1;
  }
  return levels;
}

const GUTTER = 1.25;
function geometry(h: { area: { x: number; w: number } }, d: TwoLaneTimelineData) {
  const all = d.lanes.flatMap((l) => l.events.map((e) => e.date)).sort();
  const y0 = yearOf(all[0]);
  const y1 = yearOf(all[all.length - 1]) + 1;
  const d0 = dayNum(`${y0}-01-01`);
  const d1 = dayNum(`${y1}-01-01`);
  const x0 = h.area.x + GUTTER;
  const x1 = h.area.x + h.area.w;
  const sx = (iso: string) => x0 + ((dayNum(iso) - d0) * (x1 - x0)) / (d1 - d0);
  return { y0, y1, x0, x1, sx };
}

export const twoLaneTimeline: Renderer<TwoLaneTimelineData> = {
  id: "two-lane-timeline",
  parse(raw) {
    const o = obj(raw, "data");
    return {
      ...(o.conventionNote === undefined ? {} : { conventionNote: bool(o.conventionNote, "data.conventionNote") }),
      lanes: arr(o.lanes, "data.lanes", 2).map((l, i) => {
        const lo = obj(l, `data.lanes[${i}]`);
        return {
          name: str(lo.name, `data.lanes[${i}].name`),
          events: arr(lo.events, `data.lanes[${i}].events`).map((e, j) => {
            const p = `data.lanes[${i}].events[${j}]`;
            const eo = obj(e, p);
            return {
              label: str(eo.label, `${p}.label`),
              date: isoDate(eo.date, `${p}.date`),
              kind: oneOf(eo.kind, KINDS, `${p}.kind`),
            };
          }),
        };
      }),
    };
  },
  check(d) {
    const issues = [
      ...minItems(d.lanes.flatMap((l) => l.events).length, 4, "events"),
      ...maxItems(d.lanes.flatMap((l) => l.events).length, 14, "events"),
    ];
    if (d.lanes.length !== 2) issues.push({ rule: "lane-count", message: `expected exactly 2 lanes, found ${d.lanes.length}` });
    d.lanes.forEach((l) => {
      issues.push(...datesAscending(l.events.map((e) => e.date), `${l.name} events`));
      issues.push(...uniqueLabels(l.events.map((e) => `${e.label} (${e.kind})`), `${l.name} events`));
      l.events.forEach((e) => {
        if (e.label.length > LABEL_MAX) {
          issues.push({ rule: "label-length", message: `"${e.label}" exceeds ${LABEL_MAX} characters` });
        }
      });
    });
    if (issues.length === 0) {
      const g = geometry({ area: { x: 0, w: 12.05 } }, d);
      d.lanes.forEach((l) => {
        const xs = l.events.map((e) => g.sx(e.date));
        const ws = l.events.map(labelWidth);
        const lv = stagger(xs, ws);
        if (Math.max(...lv) >= MAX_LEVELS) {
          issues.push({ rule: "label-stagger", message: `${l.name}: labels need more than ${MAX_LEVELS} stagger levels` });
        }
        xs.forEach((x, i) => {
          if (x + 0.07 + ws[i] > g.x1 + 0.05) {
            issues.push({ rule: "label-stagger", message: `${l.name}: label "${l.events[i].label}" runs past the axis end` });
          }
        });
      });
    }
    return issues;
  },
  render(h: RenderHelpers, d) {
    const a = h.area;
    const g = geometry(h, d);
    const zoneTop = a.y + 0.36;
    const zoneH = a.h - 0.4;
    const mid = zoneTop + zoneH / 2;
    const bandH = 0.34;
    const bandTop = mid - bandH / 2;
    const bandBottom = mid + bandH / 2;
    const pitch = 0.44;
    const boxH = 0.38;
    const mk = 0.17;

    // Legend: marker style encodes the type of date.
    let lx = a.x;
    const legend: [Kind, string][] = [
      ["announcement", "Announcement"],
      ["effective", "Effective date"],
      ["implementation", "Implementation"],
    ];
    legend.forEach(([k, text]) => {
      marker(h, `legend-${k}`, "legend", k, lx + 0.09, a.y + 0.13, 0.15, C.neutralDark);
      h.text(`legend-${k}-label`, "legend", text, { x: lx + 0.24, y: a.y, w: 1.45, h: 0.26, fontSize: 11, color: C.ink });
      lx += 1.75;
    });
    if (d.conventionNote !== false) h.text("axis-note", "axis", "Positioned on a day-count scale", {
      x: a.x + a.w - 3.2, y: a.y, w: 3.2, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    // Year gridlines (behind lanes) and the axis band.
    for (let y = g.y0; y <= g.y1; y++) {
      const x = g.sx(`${y}-01-01`);
      vline(h, `year-rule-${y}`, "axis", Math.min(x, g.x1 - 0.012), zoneTop, zoneH, C.soft);
    }
    h.shape("axis-band", "axis", h.shapes.rect, {
      x: g.x0, y: bandTop, w: g.x1 - g.x0, h: bandH, fill: { color: C.soft }, line: { color: C.soft, width: 0 },
    });
    for (let y = g.y0; y < g.y1; y++) {
      const xa = g.sx(`${y}-01-01`);
      const xb = g.sx(`${y + 1}-01-01`);
      h.text(`year-label-${y}`, "axis", String(y), {
        x: xa, y: bandTop, w: xb - xa, h: bandH, fontSize: 11, bold: true, color: C.neutralDark, align: "center", valign: "middle",
      });
    }
    vline(h, "axis-start", "axis", g.x0, bandTop, bandH, C.neutral);

    d.lanes.forEach((lane, li) => {
      const up = li === 0;
      const color = up ? C.neutralDark : C.neutral;
      const xs = lane.events.map((e) => g.sx(e.date));
      const ws = lane.events.map(labelWidth);
      const lv = stagger(xs, ws);
      const laneMidY = up ? (zoneTop + bandTop) / 2 : (bandBottom + zoneTop + zoneH) / 2;
      h.text(`lane-name-${li}`, "label", lane.name, {
        x: a.x, y: laneMidY - 0.25, w: GUTTER - 0.15, h: 0.5, fontSize: 11, bold: true, color: C.neutralDark, valign: "middle",
      });
      lane.events.forEach((e, i) => {
        const level = lv[i];
        const edgeY = up ? bandTop : bandBottom;
        const boxY = up ? bandTop - 0.1 - level * pitch - boxH : bandBottom + 0.1 + level * pitch;
        const stemTop = up ? boxY : edgeY;
        const stemH = up ? edgeY - boxY : boxY + boxH - edgeY;
        vline(h, `stem-${li}-${i}`, "data", xs[i] - 0.006, stemTop, stemH, color);
        marker(h, `marker-${li}-${i}`, "data", e.kind, xs[i], edgeY, mk, color);
        h.text(`event-label-${li}-${i}`, "label", [
          { text: e.label, options: { bold: true, fontSize: 11, color: C.ink, breakLine: true } },
          { text: line2(e), options: { fontSize: 11, color: C.muted } },
        ], { x: xs[i] + 0.07, y: boxY, w: ws[i], h: boxH, valign: up ? "bottom" : "top" });
      });
    });
  },
};

/** Marker encodes the date type: hollow dashed = announced, filled circle = effective, filled diamond = implemented. */
function marker(h: RenderHelpers, name: string, role: "data" | "legend", kind: Kind, cx: number, cy: number, size: number, color: string): void {
  const box = { x: cx - size / 2, y: cy - size / 2, w: size, h: size };
  if (kind === "announcement") {
    h.shape(name, role, h.shapes.ellipse, { ...box, fill: { color: C.paper }, line: { color, width: 1.25, dashType: "dash" } });
  } else if (kind === "effective") {
    h.shape(name, role, h.shapes.ellipse, { ...box, fill: { color }, line: { color, width: 0.75 } });
  } else {
    const s = size * 1.15;
    h.shape(name, role, h.shapes.diamond, { x: cx - s / 2, y: cy - s / 2, w: s, h: s, fill: { color }, line: { color: C.paper, width: 0.75 } });
  }
}
