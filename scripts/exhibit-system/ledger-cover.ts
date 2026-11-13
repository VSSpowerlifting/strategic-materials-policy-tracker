// cover_ledger: an opt-in research cover whose lead visual is a small
// instrument ledger (added for FI003 draft 1.1).
//
// A research spec may carry `ledger_cover` instead of `cover_lines` or `cover`.
// Without it nothing here runs, so earlier decks and the synthetic gallery
// render byte-identically.
//
// The ledger draws up to three separate instruments on ONE shared scale. Each
// row keeps its own status treatment (cash received, committed capacity, an
// expired commitment), its amount as text and its status line, so the bars are
// a visual aid and never the only carrier of a figure. Rows are never stacked,
// summed or totalled. A row may show one drawn part of its amount (for example
// letters of credit issued under a facility), shaded inside the row's bar.
//
// Cover citations are hyperlinks to the deck's evidence register. The cover has
// no kicker or eyebrow; the series, author, draft and evidence cutoff are a
// plain definition list.

import { arr, ContractError, num, obj, oneOf, optStr, str, strList } from "./contract";
import { C, DRAFT_BADGE, FONT_SERIF, makeHelpers, SLIDE_H, SLIDE_W, TYPE } from "./primitives";
import type { ElementRecord, PptxSlide, TextRun } from "./types";

export const LEDGER_TREATMENTS = ["received", "committed", "lapsed"] as const;
export type LedgerTreatment = (typeof LEDGER_TREATMENTS)[number];

export interface LedgerRow {
  label: string;
  value: number;
  valueText: string;
  status: string;
  treatment: LedgerTreatment;
  /** Legend wording for this row's treatment. */
  key: string;
  /** A drawn part of the row's amount, shaded inside the row's bar. */
  part?: { value: number; label: string };
}

export interface LedgerCover {
  title: string;
  subtitle: string;
  dek: string;
  context?: string;
  /** Definition list under the ledger: term and value pairs (author, draft, evidence cutoff). */
  meta: { term: string; value: string }[];
  attribution: string;
  ledger: { heading: string; unit: string; rows: LedgerRow[] };
  evidence_refs: string[];
}

const LIMITS = {
  title: 40, subtitle: 48, dek: 230, context: 180, term: 16, value: 44, attribution: 190,
  heading: 44, unit: 70, label: 30, valueText: 14, status: 72, key: 30, part: 30,
} as const;

function capped(x: unknown, p: string, max: number): string {
  const s = str(x, p);
  if (s.length > max) throw new ContractError(`${p}: ${s.length} characters exceeds the cover limit of ${max}`);
  return s;
}

/** The deck title a ledger cover sets: its title and subtitle joined as "title: subtitle". */
export function ledgerDeckTitle(c: { title: string; subtitle: string }): string {
  return `${c.title}: ${c.subtitle}`;
}

export function parseLedgerCover(raw: unknown, p: string, deckTitle: string, evidenceIds: readonly string[]): LedgerCover {
  const o = obj(raw, p);
  const title = capped(o.title, `${p}.title`, LIMITS.title);
  const subtitle = capped(o.subtitle, `${p}.subtitle`, LIMITS.subtitle);
  // The cover sets the deck title in two parts; together they must read as the deck title.
  if (ledgerDeckTitle({ title, subtitle }) !== deckTitle) {
    throw new ContractError(`${p}: "title: subtitle" must equal the deck title`);
  }
  const refs = strList(o.evidence_refs, `${p}.evidence_refs`);
  for (const r of refs) if (!evidenceIds.includes(r)) throw new ContractError(`${p}: unresolved evidence reference ${r}`);
  const meta = arr(o.meta, `${p}.meta`).map((v, i) => {
    const mo = obj(v, `${p}.meta[${i}]`);
    return { term: capped(mo.term, `${p}.meta[${i}].term`, LIMITS.term), value: capped(mo.value, `${p}.meta[${i}].value`, LIMITS.value) };
  });
  if (meta.length > 4) throw new ContractError(`${p}.meta: at most 4 entries fit the cover`);
  const context = optStr(o.context, `${p}.context`);
  if (context !== undefined && context.length > LIMITS.context) throw new ContractError(`${p}.context: exceeds ${LIMITS.context} characters`);
  const lo = obj(o.ledger, `${p}.ledger`);
  const rows = arr(lo.rows, `${p}.ledger.rows`, 2).map((r, i): LedgerRow => {
    const rp = `${p}.ledger.rows[${i}]`;
    const ro = obj(r, rp);
    const value = num(ro.value, `${rp}.value`);
    if (!(value > 0)) throw new ContractError(`${rp}.value: must be positive`);
    let part: LedgerRow["part"];
    if (ro.part !== undefined) {
      const po = obj(ro.part, `${rp}.part`);
      const pv = num(po.value, `${rp}.part.value`);
      if (!(pv > 0 && pv < value)) throw new ContractError(`${rp}.part.value: must lie strictly between 0 and the row value`);
      part = { value: pv, label: capped(po.label, `${rp}.part.label`, LIMITS.part) };
    }
    return {
      label: capped(ro.label, `${rp}.label`, LIMITS.label),
      value,
      valueText: capped(ro.valueText, `${rp}.valueText`, LIMITS.valueText),
      status: capped(ro.status, `${rp}.status`, LIMITS.status),
      treatment: oneOf(ro.treatment, LEDGER_TREATMENTS, `${rp}.treatment`),
      key: capped(ro.key, `${rp}.key`, LIMITS.key),
      ...(part ? { part } : {}),
    };
  });
  if (rows.length > 3) throw new ContractError(`${p}.ledger.rows: at most 3 rows fit the cover`);
  if (new Set(rows.map((r) => r.label)).size !== rows.length) throw new ContractError(`${p}.ledger.rows: duplicate row label`);
  return {
    title,
    subtitle,
    dek: capped(o.dek, `${p}.dek`, LIMITS.dek),
    ...(context !== undefined ? { context } : {}),
    meta,
    attribution: capped(o.attribution, `${p}.attribution`, LIMITS.attribution),
    ledger: {
      heading: capped(lo.heading, `${p}.ledger.heading`, LIMITS.heading),
      unit: capped(lo.unit, `${p}.ledger.unit`, LIMITS.unit),
      rows,
    },
    evidence_refs: refs,
  };
}

/** Geometry of cover_ledger on the 13.333 × 7.5 in slide. */
export const LEDGER_GEOMETRY = {
  left: 0.8,
  right: SLIDE_W - 0.8,
  /** Bars start here; the common zero line sits on it. */
  barX: 4.1,
  /** Width of the largest row's bar; every bar uses the same inches-per-unit. */
  scaleW: 6.9,
  rowTop: 4.24,
  rowPitch: 0.62,
  barH: 0.24,
} as const;

/** Inches per unit and each row's bar (and part) width, all on one scale. */
export function ledgerScale(rows: readonly LedgerRow[]): { perUnit: number; bars: { w: number; partW?: number }[] } {
  const max = Math.max(...rows.map((r) => r.value));
  const perUnit = LEDGER_GEOMETRY.scaleW / max;
  return {
    perUnit,
    bars: rows.map((r) => ({ w: r.value * perUnit, ...(r.part ? { partW: r.part.value * perUnit } : {}) })),
  };
}

interface CoverHost {
  ShapeType: Record<string, string>;
  ChartType: Record<string, string>;
  addSlide(): PptxSlide;
}

const TREATMENT_STYLE: Record<LedgerTreatment, { fill?: string; line: string; dash: string; width: number }> = {
  received: { fill: C.accent, line: C.accent, dash: "solid", width: 1 },
  committed: { line: C.ink, dash: "solid", width: 1.25 },
  lapsed: { line: C.negative, dash: "dash", width: 1.5 },
};

export function ledgerCoverSlide(
  pptx: CoverHost,
  cover: LedgerCover,
  records: ElementRecord[],
  links: { label: string; url: string }[],
  notes: string,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  const h = makeHelpers(slide, { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }, records, pptx.ShapeType, pptx.ChartType);
  const G = LEDGER_GEOMETRY;
  const W = G.right - G.left;

  h.text("cover-notice", "frame", DRAFT_BADGE, {
    x: G.right - 3.4, y: 0.42, w: 3.4, h: 0.26, fontSize: TYPE.footnote, bold: true, color: C.muted, align: "right",
  });
  h.text("cover-title", "frame", cover.title, {
    x: G.left, y: 0.6, w: W - 3.0, h: 0.86, fontSize: 44, fontFace: FONT_SERIF, color: C.ink, valign: "bottom",
  });
  h.text("cover-subtitle", "frame", cover.subtitle, {
    x: G.left, y: 1.5, w: W, h: 0.42, fontSize: 20, color: C.muted, valign: "top",
  });
  // Hairline rule with the site's centred registration tick.
  h.shape("cover-rule", "frame", h.shapes.rect, {
    x: G.left, y: 2.08, w: W, h: 0.015, fill: { color: C.border }, line: { color: C.border, width: 0 },
  });
  h.shape("cover-rule-tick", "frame", h.shapes.rect, {
    x: G.left + W / 2 - 0.006, y: 2.08 - 0.05, w: 0.012, h: 0.115, fill: { color: C.borderStrong }, line: { color: C.borderStrong, width: 0 },
  });
  h.text("cover-dek", "frame", cover.dek, {
    x: G.left, y: 2.28, w: W, h: 0.64, fontSize: 16, color: C.ink, valign: "top", lineSpacingMultiple: 1.05,
  });
  if (cover.context) {
    h.text("cover-context", "frame", cover.context, {
      x: G.left, y: 2.98, w: W, h: 0.42, fontSize: 12, color: C.muted, valign: "top",
    });
  }

  // Ledger.
  const { ledger } = cover;
  h.text("ledger-heading", "frame", ledger.heading, {
    x: G.left, y: 3.56, w: W, h: 0.28, fontSize: 14, bold: true, color: C.ink, valign: "top",
  });
  h.text("ledger-unit", "axis", ledger.unit, {
    x: G.left, y: 3.84, w: W, h: 0.24, fontSize: TYPE.dense, color: C.muted, valign: "top",
  });
  const scale = ledgerScale(ledger.rows);
  const lastBottom = G.rowTop + G.rowPitch * (ledger.rows.length - 1) + G.barH;
  ledger.rows.forEach((r, i) => {
    const y = G.rowTop + G.rowPitch * i;
    const { w, partW } = scale.bars[i];
    const st = TREATMENT_STYLE[r.treatment];
    // The common zero is marked beside each bar only, so it never runs through a status line.
    h.line(`ledger-zero-${i + 1}`, "axis", {
      x: G.barX, y: y - 0.06, w: 0, h: G.barH + 0.12, line: { color: C.borderStrong, width: 1 },
    });
    h.text(`ledger-label-${i + 1}`, "label", r.label, {
      x: G.left, y: y - 0.03, w: G.barX - G.left - 0.2, h: 0.3, fontSize: 13, bold: true, color: C.ink, valign: "middle",
    });
    h.shape(`ledger-bar-${i + 1}`, "data", h.shapes.rect, {
      x: G.barX, y, w, h: G.barH,
      fill: st.fill ? { color: st.fill } : { color: C.paper, transparency: 100 },
      line: { color: st.line, width: st.width, dashType: st.dash },
      altText: `${r.label}: ${r.valueText}. ${r.status}`,
    });
    if (r.part && partW !== undefined) {
      h.shape(`ledger-part-${i + 1}`, "data", h.shapes.rect, {
        x: G.barX, y, w: partW, h: G.barH,
        fill: { color: C.neutral }, line: { color: st.line, width: st.width },
        altText: `${r.part.label}: part of ${r.label}`,
      });
    }
    h.text(`ledger-value-${i + 1}`, "label", r.valueText, {
      x: G.barX + w + 0.14, y: y - 0.03, w: 1.5, h: 0.3, fontSize: 13, bold: true, color: C.ink, valign: "middle",
    });
    h.text(`ledger-status-${i + 1}`, "label", r.status, {
      x: G.barX, y: y + G.barH + 0.04, w: G.right - G.barX, h: 0.24, fontSize: TYPE.dense, color: C.muted, valign: "top",
    });
  });

  // Key: one swatch per row treatment, then the drawn part.
  const ky = lastBottom + 0.42;
  let kx = G.barX;
  const swatch = (name: string, label: string, style: { fill?: string; line: string; dash: string; width: number }, width: number) => {
    h.shape(`${name}-key`, "legend", h.shapes.rect, {
      x: kx, y: ky + 0.06, w: 0.3, h: 0.14,
      fill: style.fill ? { color: style.fill } : { color: C.paper, transparency: 100 },
      line: { color: style.line, width: style.width, dashType: style.dash },
    });
    h.text(`${name}-label`, "legend", label, { x: kx + 0.38, y: ky, w: width - 0.38, h: 0.26, fontSize: TYPE.dense, color: C.ink, valign: "middle" });
    kx += width;
  };
  ledger.rows.forEach((r, i) => {
    swatch(`ledger-key-${i + 1}`, r.key, TREATMENT_STYLE[r.treatment], 1.95);
    if (r.part) swatch(`ledger-key-${i + 1}-part`, r.part.label, { fill: C.neutral, line: TREATMENT_STYLE[r.treatment].line, dash: "solid", width: 1 }, 1.95);
  });

  // Definition list: term (muted) then value (ink), on one line.
  const metaRuns: TextRun[] = [];
  cover.meta.forEach((m, i) => {
    metaRuns.push({ text: `${i ? "     " : ""}${m.term}  `, options: { color: C.muted } });
    metaRuns.push({ text: m.value, options: { color: C.ink, bold: true } });
  });
  h.text("cover-meta", "frame", metaRuns, { x: G.left, y: 6.5, w: W, h: 0.26, fontSize: TYPE.dense, valign: "top" });

  const sourceRuns: TextRun[] = [{ text: "Sources: ", options: { color: C.faint } }];
  links.forEach((l, i) => {
    if (i) sourceRuns.push({ text: "; ", options: { color: C.faint } });
    sourceRuns.push({ text: l.label, options: { color: C.accent, underline: { style: "sng" }, hyperlink: { url: l.url, tooltip: l.label } } });
  });
  sourceRuns.push({ text: `. ${cover.attribution}`, options: { color: C.faint } });
  h.text("cover-sources", "frame", sourceRuns, { x: G.left, y: 6.86, w: W, h: 0.44, fontSize: TYPE.footnote, valign: "top" });

  slide.addNotes(notes);
}
