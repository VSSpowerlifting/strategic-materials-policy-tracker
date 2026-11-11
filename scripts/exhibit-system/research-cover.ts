// Optional publication cover for research decks (added for FI003 draft 1.0).
//
// A research spec may carry a `cover` object. It is used instead of the
// generic cover in build-gallery.ts. When a spec has no `cover`, nothing here
// runs and earlier decks render byte-identically.
//
// The cover keeps every publication requirement of the generic one (series,
// research title, author, draft status, evidence cutoff, attribution and the
// DRAFT badge) and adds two optional elements:
//   - a short attributed context line;
//   - a small instrument ledger. Each amount is drawn on one shared scale with
//     its own status treatment. Rows are never stacked or summed, and every
//     amount is also given as text, so the bars are a visual aid only.
// Cover citations are real hyperlinks to the deck's evidence register.

import { arr, ContractError, num, obj, oneOf, optStr, str, strList } from "./contract";
import { C, DRAFT_BADGE, makeHelpers, SLIDE_H, SLIDE_W } from "./primitives";
import type { ElementRecord, PptxSlide, TextRun } from "./types";

export const LEDGER_TREATMENTS = ["received", "committed", "lapsed"] as const;
export type LedgerTreatment = (typeof LEDGER_TREATMENTS)[number];

export interface LedgerRow {
  label: string;
  value: number;
  valueText: string;
  status: string;
  treatment: LedgerTreatment;
  /** A drawn part of the row's amount, e.g. letters of credit within a facility. */
  part?: { value: number; label: string };
}

export interface ResearchCover {
  series: string;
  title: string;
  subtitle: string;
  dek: string;
  context?: string;
  byline: string[];
  attribution: string;
  ledger?: { heading: string; unit: string; rows: LedgerRow[]; key: string };
  evidence_refs: string[];
}

const LIMITS = { series: 48, title: 40, subtitle: 48, dek: 220, context: 170, bylineLine: 60, attribution: 190, heading: 44, unit: 70, label: 34, valueText: 20, status: 64, key: 110, part: 30 };

function capped(x: unknown, p: string, max: number): string {
  const s = str(x, p);
  if (s.length > max) throw new ContractError(`${p}: ${s.length} characters exceeds the cover limit of ${max}`);
  return s;
}

export function parseCover(raw: unknown, p: string, evidenceIds: readonly string[]): ResearchCover {
  const o = obj(raw, p);
  const refs = strList(o.evidence_refs, `${p}.evidence_refs`);
  for (const r of refs) if (!evidenceIds.includes(r)) throw new ContractError(`${p}: unresolved evidence reference ${r}`);
  const byline = arr(o.byline, `${p}.byline`).map((v, i) => capped(v, `${p}.byline[${i}]`, LIMITS.bylineLine));
  if (byline.length > 3) throw new ContractError(`${p}.byline: at most 3 lines`);
  const context = optStr(o.context, `${p}.context`);
  if (context !== undefined && context.length > LIMITS.context) throw new ContractError(`${p}.context: exceeds ${LIMITS.context} characters`);
  let ledger: ResearchCover["ledger"];
  if (o.ledger !== undefined) {
    const lo = obj(o.ledger, `${p}.ledger`);
    const rows = arr(lo.rows, `${p}.ledger.rows`).map((r, i): LedgerRow => {
      const rp = `${p}.ledger.rows[${i}]`;
      const ro = obj(r, rp);
      const value = num(ro.value, `${rp}.value`);
      if (!(value > 0)) throw new ContractError(`${rp}.value: must be positive`);
      let part: LedgerRow["part"];
      if (ro.part !== undefined) {
        const po = obj(ro.part, `${rp}.part`);
        const pv = num(po.value, `${rp}.part.value`);
        if (!(pv > 0 && pv < value)) throw new ContractError(`${rp}.part.value: must lie between 0 and the row value`);
        part = { value: pv, label: capped(po.label, `${rp}.part.label`, LIMITS.part) };
      }
      return {
        label: capped(ro.label, `${rp}.label`, LIMITS.label),
        value,
        valueText: capped(ro.valueText, `${rp}.valueText`, LIMITS.valueText),
        status: capped(ro.status, `${rp}.status`, LIMITS.status),
        treatment: oneOf(ro.treatment, LEDGER_TREATMENTS, `${rp}.treatment`),
        ...(part ? { part } : {}),
      };
    });
    if (rows.length > 3) throw new ContractError(`${p}.ledger.rows: at most 3 rows fit the cover`);
    ledger = {
      heading: capped(lo.heading, `${p}.ledger.heading`, LIMITS.heading),
      unit: capped(lo.unit, `${p}.ledger.unit`, LIMITS.unit),
      key: capped(lo.key, `${p}.ledger.key`, LIMITS.key),
      rows,
    };
  }
  return {
    series: capped(o.series, `${p}.series`, LIMITS.series),
    title: capped(o.title, `${p}.title`, LIMITS.title),
    subtitle: capped(o.subtitle, `${p}.subtitle`, LIMITS.subtitle),
    dek: capped(o.dek, `${p}.dek`, LIMITS.dek),
    ...(context !== undefined ? { context } : {}),
    byline,
    attribution: capped(o.attribution, `${p}.attribution`, LIMITS.attribution),
    ...(ledger ? { ledger } : {}),
    evidence_refs: refs,
  };
}

// Tints on the graphite cover. Measured contrast on C.dark: SOFT ≈ 13:1, QUIET ≈ 8:1.
const SOFT = "D8D3C7";
const QUIET = "AEA796";
const LINE = "3A3732";

interface CoverSlideHost {
  ShapeType: Record<string, string>;
  ChartType: Record<string, string>;
  addSlide(): PptxSlide;
}

export function researchCoverSlide(
  pptx: CoverSlideHost,
  cover: ResearchCover,
  records: ElementRecord[],
  links: { id: string; label: string; url: string }[],
  notes: string,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: C.dark };
  const h = makeHelpers(slide, { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }, records, pptx.ShapeType, pptx.ChartType);
  const L = 0.8;
  const TW = 7.2; // text column width

  h.text("cover-series", "frame", cover.series, { x: L, y: 0.62, w: 7.6, h: 0.3, fontSize: 12, bold: true, color: C.gold, charSpacing: 1.5 });
  h.text("cover-notice", "frame", DRAFT_BADGE, { x: 8.55, y: 0.62, w: 4.0, h: 0.3, fontSize: 10, bold: true, color: C.gold, align: "right", charSpacing: 1 });

  // One paragraph with soft breaks, so the research title reads as a single heading.
  // A "\n" in the title marks the intended display break.
  const titleRuns: TextRun[] = cover.title.split("\n").map((t, i) => ({
    text: t,
    options: { fontSize: 44, bold: true, color: C.paper, ...(i ? { softBreakBefore: true } : {}) },
  }));
  titleRuns.push({ text: cover.subtitle, options: { fontSize: 26, bold: false, color: SOFT, softBreakBefore: true } });
  h.text("cover-title", "frame", titleRuns, { x: L, y: 1.3, w: TW, h: 2.05, valign: "top", lineSpacingMultiple: 1.0, fit: "none" });

  h.shape("cover-rule", "frame", h.shapes.rect, { x: L, y: 3.55, w: 0.9, h: 0.045, fill: { color: C.gold }, line: { color: C.gold, width: 0 } });
  h.text("cover-dek", "frame", cover.dek, { x: L, y: 3.78, w: TW, h: 0.92, fontSize: 15, color: SOFT, valign: "top", lineSpacingMultiple: 1.1 });
  if (cover.context) {
    h.text("cover-context", "frame", cover.context, { x: L, y: 4.82, w: TW, h: 0.5, fontSize: 12, color: QUIET, valign: "top" });
  }

  h.text("cover-byline", "frame", cover.byline.map((t, i): TextRun => ({
    text: t,
    options: i === 0 ? { fontSize: 15, bold: true, color: C.paper } : { fontSize: 12, color: SOFT, softBreakBefore: true },
  })), { x: L, y: 5.6, w: TW, h: 0.82, valign: "top", paraSpaceAfter: 2 });

  const runs: TextRun[] = [{ text: `${cover.attribution}  Sources: `, options: { color: QUIET } }];
  links.forEach((l, i) => {
    if (i) runs.push({ text: ", ", options: { color: QUIET } });
    runs.push({ text: l.label, options: { color: C.gold, underline: { style: "sng" }, hyperlink: { url: l.url, tooltip: l.label } } });
  });
  h.text("cover-attribution", "frame", runs, { x: L, y: 6.7, w: 11.75, h: 0.5, fontSize: 10, color: QUIET, valign: "top" });

  const lg = cover.ledger;
  if (lg) {
    const X = 8.55;
    const W = 4.0;
    h.shape("ledger-divider", "frame", h.shapes.rect, { x: 8.05, y: 1.45, w: 0.012, h: 4.95, fill: { color: LINE }, line: { color: LINE, width: 0 } });
    h.text("ledger-heading", "frame", lg.heading, { x: X, y: 1.42, w: W, h: 0.28, fontSize: 10, bold: true, color: C.gold, charSpacing: 1 });
    h.text("ledger-unit", "frame", lg.unit, { x: X, y: 1.72, w: W, h: 0.3, fontSize: 10, color: QUIET, valign: "top" });
    const max = Math.max(...lg.rows.map((r) => r.value));
    const sx = (v: number) => (v / max) * W;
    lg.rows.forEach((r, i) => {
      const y = 2.22 + i * 1.3;
      const n = `ledger-${i + 1}`;
      h.text(`${n}-label`, "frame", r.label, { x: X, y, w: W - 1.5, h: 0.28, fontSize: 12, color: SOFT, valign: "top" });
      h.text(`${n}-value`, "frame", r.valueText, {
        x: X + W - 1.6, y: y - 0.06, w: 1.6, h: 0.38, fontSize: 18, bold: true, align: "right", valign: "top",
        color: r.treatment === "received" ? C.gold : C.paper,
      });
      const by = y + 0.42;
      const bw = sx(r.value);
      if (r.treatment === "received") {
        h.shape(`${n}-bar`, "data", h.shapes.rect, { x: X, y: by, w: bw, h: 0.16, fill: { color: C.gold }, line: { color: C.gold, width: 0 } });
      } else {
        h.shape(`${n}-bar`, "data", h.shapes.rect, {
          x: X, y: by, w: bw, h: 0.16, fill: { color: C.dark },
          line: { color: r.treatment === "lapsed" ? C.neutral : SOFT, width: 1, ...(r.treatment === "lapsed" ? { dashType: "dash" } : {}) },
        });
      }
      if (r.part) {
        h.shape(`${n}-part`, "data", h.shapes.rect, { x: X, y: by, w: sx(r.part.value), h: 0.16, fill: { color: C.neutral }, line: { color: SOFT, width: 1 } });
      }
      h.text(`${n}-status`, "frame", r.status, { x: X, y: by + 0.24, w: W, h: 0.3, fontSize: 10, color: QUIET, valign: "top" });
    });
    h.text("ledger-key", "frame", lg.key, { x: X, y: 2.22 + lg.rows.length * 1.3 + 0.05, w: W, h: 0.5, fontSize: 10, color: QUIET, valign: "top" });
  }
  slide.addNotes(notes);
}
