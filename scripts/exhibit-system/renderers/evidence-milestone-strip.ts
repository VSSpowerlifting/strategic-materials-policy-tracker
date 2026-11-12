// I3 evidence-milestone strip — one sequence of dated milestones, each tagged with
// an evidence state. Marker style encodes the state (hollow dashed = announced or
// targeted, filled neutral = reported, filled accent = independently verified;
// solid hollow = contractual deadline, dotted hollow = conditional or illustrative).
// Native shapes on a computed date scale (day counts via Date.UTC): positions are
// derived at build time, NOT data-bound. Labels alternate above and below the spine.
import { arr, bool, isoDate, obj, oneOf, str } from "../contract";
import { datesAscending, EVIDENCE_STATES, inVocabulary, maxItems, minItems, uniqueLabels } from "../integrity";
import { C, vline } from "../primitives";
import type { IntegrityIssue, RenderHelpers, Renderer } from "../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface Milestone {
  label: string;
  date: string;
  /** One of EVIDENCE_STATES (validated in check so a bad value is reported, not thrown). */
  state: string;
}
export interface EvidenceStripData {
  milestones: Milestone[];
  /** false omits the reading-convention note (default true). */
  conventionNote?: boolean;
  /** "sentence" sets the state tag in sentence case without tracking (default: tracked capitals). */
  stateCase?: "sentence";
}

const dayNum = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
const longDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const LABEL_MAX = 28;
const GAP = 0.12;
const stateText = (m: Milestone, sentence = false): string => {
  const t = m.state.replace(/-/g, " ");
  return sentence ? t.charAt(0).toUpperCase() + t.slice(1) : t.toUpperCase();
};
const boxW = (m: Milestone): number => Math.max(m.label.length * 0.085, stateText(m).length * 0.08, longDate(m.date).length * 0.07) + 0.1;
const SIDE = 0.95;

function geometry(areaX: number, areaW: number, d: EvidenceStripData) {
  const ds = d.milestones.map((m) => m.date).sort();
  const y0 = Number(ds[0].slice(0, 4));
  const y1 = Number(ds[ds.length - 1].slice(0, 4)) + 1;
  const d0 = dayNum(`${y0}-01-01`);
  const d1 = dayNum(`${y1}-01-01`);
  const x0 = areaX + SIDE;
  const x1 = areaX + areaW - SIDE;
  const sx = (iso: string) => x0 + ((dayNum(iso) - d0) * (x1 - x0)) / (d1 - d0);
  return { y0, y1, x0, x1, sx };
}

export const evidenceMilestoneStrip: Renderer<EvidenceStripData> = {
  id: "evidence-milestone-strip",
  parse(raw) {
    const o = obj(raw, "data");
    return {
      ...(o.conventionNote === undefined ? {} : { conventionNote: bool(o.conventionNote, "data.conventionNote") }),
      ...(o.stateCase === undefined ? {} : { stateCase: oneOf(str(o.stateCase, "data.stateCase"), ["sentence"] as const, "data.stateCase") }),
      milestones: arr(o.milestones, "data.milestones").map((m, i) => {
        const p = `data.milestones[${i}]`;
        const mo = obj(m, p);
        return { label: str(mo.label, `${p}.label`), date: isoDate(mo.date, `${p}.date`), state: str(mo.state, `${p}.state`) };
      }),
    };
  },
  check(d) {
    const ms = d.milestones;
    const issues: IntegrityIssue[] = [
      ...minItems(ms.length, 4, "milestones"),
      ...maxItems(ms.length, 8, "milestones"),
      ...inVocabulary(ms.map((m) => m.state), EVIDENCE_STATES, "evidence states"),
      ...datesAscending(ms.map((m) => m.date), "milestones"),
      ...uniqueLabels(ms.map((m) => m.label), "milestone labels"),
    ];
    ms.forEach((m) => {
      if (m.label.length > LABEL_MAX) issues.push({ rule: "label-length", message: `"${m.label}" exceeds ${LABEL_MAX} characters` });
    });
    if (ms.filter((m) => m.state === "independently-verified").length > 1) {
      issues.push({ rule: "single-highlight", message: "the accent colour marks at most one independently verified milestone" });
    }
    if (issues.length === 0) {
      const g = geometry(0, 12.05, d);
      for (let i = 2; i < ms.length; i++) {
        const a = g.sx(ms[i - 2].date);
        const b = g.sx(ms[i].date);
        if (b - a < (boxW(ms[i - 2]) + boxW(ms[i])) / 2 + GAP) {
          issues.push({ rule: "label-overlap", message: `labels "${ms[i - 2].label}" and "${ms[i].label}" collide on the same side` });
        }
      }
      ms.forEach((m) => {
        const x = g.sx(m.date);
        if (x - boxW(m) / 2 < -0.01 || x + boxW(m) / 2 > 12.06) issues.push({ rule: "label-overlap", message: `label "${m.label}" runs outside the exhibit` });
      });
    }
    return issues;
  },
  render(h: RenderHelpers, d) {
    const a = h.area;
    const g = geometry(a.x, a.w, d);
    const zoneTop = a.y + 0.38;
    const yearRowH = 0.3;
    const zoneBottom = a.y + a.h - yearRowH;
    const mid = (zoneTop + zoneBottom) / 2;
    const mk = 0.28;
    const boxH = 0.62;
    const stem = 0.3;

    // Legend: marker style encodes the evidence state.
    let lx = a.x;
    const legend: [string, string, MarkerStyle, number][] = [
      ["announced-targeted", "Announced or targeted", "hollow", 2.4],
      ["reported", "Reported", "reported", 1.55],
      ["verified", "Independently verified", "verified", 2.2],
    ];
    // Contract-term states are additive: when a strip uses them, the legend lists only the
    // states present, so no entry lacks a marker. Strips without them render as before.
    const present = new Set(d.milestones.map((m) => markerStyle(m.state)));
    if (present.has("contractual") || present.has("conditional")) {
      legend.push(["contractual", "Contractual deadline", "contractual", 2.15]);
      legend.push(["conditional", "Conditional on a stated term", "conditional", 2.7]);
      const kept = legend.filter(([, , style]) => present.has(style));
      legend.length = 0;
      legend.push(...kept);
    }
    legend.forEach(([key, text, style, w]) => {
      stateMarker(h, `legend-${key}`, "legend", style, lx + 0.12, a.y + 0.13, 0.17);
      h.text(`legend-${key}-label`, "legend", text, { x: lx + 0.32, y: a.y, w: w - 0.32, h: 0.26, fontSize: 11, color: C.ink });
      lx += w;
    });
    if (d.conventionNote !== false) h.text("axis-note", "axis", "Positioned on a day-count scale", {
      x: a.x + a.w - 3.2, y: a.y, w: 3.2, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    // Year gridlines and the year row at the foot of the strip.
    for (let y = g.y0; y <= g.y1; y++) {
      const x = g.sx(`${y}-01-01`);
      vline(h, `year-rule-${y}`, "axis", x - 0.006, zoneTop, zoneBottom - zoneTop + 0.12, C.soft);
    }
    for (let y = g.y0; y < g.y1; y++) {
      const xa = g.sx(`${y}-01-01`);
      const xb = g.sx(`${y + 1}-01-01`);
      h.text(`year-label-${y}`, "axis", String(y), {
        x: xa, y: zoneBottom + 0.06, w: xb - xa, h: yearRowH - 0.06, fontSize: 11, bold: true, color: C.neutralDark, align: "center", valign: "middle",
      });
    }
    h.shape("spine", "axis", h.shapes.rect, { x: g.x0, y: mid - 0.012, w: g.x1 - g.x0, h: 0.024, fill: { color: C.neutral }, line: { color: C.neutral, width: 0 } });

    d.milestones.forEach((m, i) => {
      const x = g.sx(m.date);
      const up = i % 2 === 0;
      const w = boxW(m);
      const verified = m.state === "independently-verified";
      const stemTop = up ? mid - mk / 2 - stem : mid + mk / 2;
      vline(h, `stem-${i}`, "data", x - 0.006, stemTop, stem, C.neutral);
      stateMarker(h, `marker-${i}`, "data", markerStyle(m.state), x, mid, mk);
      const boxY = up ? mid - mk / 2 - stem - boxH : mid + mk / 2 + stem;
      h.text(`milestone-label-${i}`, "label", [
        { text: m.label, options: { bold: true, fontSize: 11, color: C.ink, breakLine: true } },
        { text: stateText(m, d.stateCase === "sentence"), options: { bold: true, fontSize: 11, color: verified ? C.accent : C.muted, ...(d.stateCase === "sentence" ? {} : { charSpacing: 0.5 }), breakLine: true } },
        { text: longDate(m.date), options: { fontSize: 11, color: C.muted } },
      ], { x: x - w / 2, y: boxY, w, h: boxH, align: "center", valign: up ? "bottom" : "top" });
    });
  },
};

type MarkerStyle = "hollow" | "reported" | "verified" | "contractual" | "conditional";
const markerStyle = (state: string): MarkerStyle =>
  state === "independently-verified" ? "verified"
    : state === "reported" ? "reported"
    : state === "contractual" ? "contractual"
    : state === "conditional" ? "conditional"
    : "hollow";

/** Hollow dashed = announced or targeted; filled neutral = reported; filled accent = independently verified;
 *  hollow solid = contractual deadline; hollow dotted = conditional or illustrative. */
function stateMarker(h: RenderHelpers, name: string, role: "data" | "legend", style: MarkerStyle, cx: number, cy: number, size: number): void {
  const box = { x: cx - size / 2, y: cy - size / 2, w: size, h: size };
  if (style === "contractual") {
    h.shape(name, role, h.shapes.ellipse, { ...box, fill: { color: C.paper }, line: { color: C.neutralDark, width: 1.5 } });
  } else if (style === "conditional") {
    h.shape(name, role, h.shapes.ellipse, { ...box, fill: { color: C.paper }, line: { color: C.neutralDark, width: 1.5, dashType: "sysDot" } });
  } else if (style === "hollow") {
    h.shape(name, role, h.shapes.ellipse, { ...box, fill: { color: C.paper }, line: { color: C.neutralDark, width: 1.5, dashType: "dash" } });
  } else if (style === "reported") {
    h.shape(name, role, h.shapes.ellipse, { ...box, fill: { color: C.neutral }, line: { color: C.neutralDark, width: 0.75 } });
  } else {
    h.shape(name, role, h.shapes.ellipse, { ...box, fill: { color: C.accent }, line: { color: C.accent, width: 0.75 } });
  }
}
