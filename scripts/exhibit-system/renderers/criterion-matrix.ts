// K1 criterion-matrix — options x criteria with categorical, source-grounded marks.
// Native table; the mark glyphs are native shapes positioned over the cells
// (their position follows the fixed row heights, they are not table content).
// Never a numeric score, weight or total.
import { arr, obj, oneOf, optStr, str } from "../contract";
import { maxItems, minItems, uniqueLabels } from "../integrity";
import { C, HEAD_CELL } from "../primitives";
import type { IntegrityIssue, Renderer, RenderHelpers, TableCell } from "../types";

export const MARKS = ["Meets", "Partly", "Does not", "Not stated"] as const;
export type Mark = (typeof MARKS)[number];

export interface CriterionMatrixData {
  options: string[];
  accent?: string;
  criteria: { label: string; marks: Mark[] }[];
  /** "marks" (default) draws glyphs and a key; "text" sets the mark words alone, weighted by type. */
  display?: "marks" | "text";
  /** Any weight/score/total-style keys found in the fixture (rejected by check). */
  forbiddenKeys: string[];
}

const FORBIDDEN = /weight|score|total|rank|points|index/i;
const findForbidden = (o: Record<string, unknown>, path: string): string[] =>
  Object.keys(o).filter((k) => FORBIDDEN.test(k)).map((k) => `${path}.${k}`);

export const GLYPH_D = 0.17;

/** Draws a mark glyph (filled / half / hollow / dashed hollow) centred at (cx, cy). */
export function markGlyph(h: RenderHelpers, name: string, mark: Mark, cx: number, cy: number): void {
  const x = cx - GLYPH_D / 2;
  const y = cy - GLYPH_D / 2;
  const base = { x, y, w: GLYPH_D, h: GLYPH_D };
  if (mark === "Meets") {
    h.shape(name, "data", h.shapes.ellipse, { ...base, fill: { color: C.neutralDark }, line: { color: C.neutralDark, width: 1.25 } });
    return;
  }
  h.shape(name, "data", h.shapes.ellipse, {
    ...base,
    fill: { color: C.paper },
    line: { color: mark === "Not stated" ? C.neutral : C.neutralDark, width: 1.25, dashType: mark === "Not stated" ? "sysDash" : "solid" },
  });
  if (mark === "Partly") {
    h.shape(`${name}-half`, "data", h.shapes.pie, {
      ...base, angleRange: [90, 270], fill: { color: C.neutralDark }, line: { color: C.neutralDark, width: 0.5 },
    });
  }
}

export const criterionMatrix: Renderer<CriterionMatrixData> = {
  id: "criterion-matrix",
  parse(d) {
    const o = obj(d, "data");
    const options = arr(o.options, "data.options").map((x, i) => str(x, `data.options[${i}]`));
    const forbiddenKeys = findForbidden(o, "data");
    const criteria = arr(o.criteria, "data.criteria").map((x, i) => {
      const r = obj(x, `data.criteria[${i}]`);
      forbiddenKeys.push(...findForbidden(r, `data.criteria[${i}]`));
      return {
        label: str(r.label, `data.criteria[${i}].label`),
        marks: arr(r.marks, `data.criteria[${i}].marks`).map((m, j) => oneOf(m, MARKS, `data.criteria[${i}].marks[${j}]`)),
      };
    });
    const display = o.display === undefined ? undefined : oneOf(o.display, ["marks", "text"] as const, "data.display");
    return { options, accent: optStr(o.accent, "data.accent"), criteria, ...(display ? { display } : {}), forbiddenKeys };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.options.length, 2, "options"),
      ...maxItems(d.options.length, 4, "options"),
      ...minItems(d.criteria.length, 2, "criteria"),
      ...maxItems(d.criteria.length, 7, "criteria"),
      ...uniqueLabels(d.options, "option labels"),
      ...uniqueLabels(d.criteria.map((c) => c.label), "criterion labels"),
    ];
    if (d.forbiddenKeys.length) {
      issues.push({ rule: "no-numeric-score", message: `weights, scores and totals are not allowed: ${d.forbiddenKeys.join(", ")}` });
    }
    d.criteria.forEach((c) => {
      if (c.marks.length !== d.options.length) {
        issues.push({ rule: "aligned-series", message: `criterion "${c.label}" has ${c.marks.length} marks for ${d.options.length} options` });
      }
      if (c.label.length > 40) issues.push({ rule: "cell-length", message: `criterion label over 40 characters: ${c.label}` });
    });
    d.options.forEach((o) => {
      if (o.length > 20) issues.push({ rule: "cell-length", message: `option label over 20 characters: ${o}` });
    });
    if (d.accent !== undefined && !d.options.includes(d.accent)) {
      issues.push({ rule: "accent-resolves", message: `accent "${d.accent}" is not an option` });
    }
    return issues;
  },
  render(h, d) {
    if (d.display === "text") {
      renderText(h, d);
      return;
    }
    const { x, y } = h.area;
    const labelW = 2.75;
    const optW = Math.min(1.6, (h.area.w - labelW) / d.options.length);
    const headH = 0.55;
    const rowH = 0.5;
    const hdr = (text: string, accent: boolean, align: "left" | "center"): TableCell => ({
      text,
      options: accent ? { bold: true, fontSize: 11, color: C.plate, fill: { color: C.accent }, align, valign: "middle" } : { ...HEAD_CELL, align },
    });
    const rule = { type: "solid", pt: 0.75, color: C.border };
    const none = { type: "none" };
    const rows: TableCell[][] = [
      [hdr("Criterion", false, "left"), ...d.options.map((o) => hdr(o, o === d.accent, "center"))],
      ...d.criteria.map((c, i): TableCell[] => [
        { text: c.label, options: { fontSize: 11, bold: true, color: C.ink, valign: "middle", fill: { color: i % 2 ? C.soft : C.paper }, border: [none, none, rule, none] } },
        ...c.marks.map((m): TableCell => ({
          text: m,
          options: {
            fontSize: 11, color: m === "Not stated" ? C.muted : C.ink, valign: "middle", align: "left",
            margin: [0.04, 0.05, 0.04, 0.52], fill: { color: i % 2 ? C.soft : C.paper }, border: [none, none, rule, none],
          },
        })),
      ]),
    ];
    h.table("criterion-table", rows, {
      x, y, w: labelW + optW * d.options.length, colW: [labelW, ...d.options.map(() => optW)],
      rowH: [headH, ...d.criteria.map(() => rowH)], fontSize: 11,
    });
    d.criteria.forEach((c, i) => {
      c.marks.forEach((m, j) => {
        const cx = x + labelW + optW * j + 0.3;
        const cy = y + headH + rowH * i + rowH / 2;
        markGlyph(h, `mark-${i + 1}-${j + 1}`, m, cx, cy);
      });
    });
    // Key for the four marks, below the table.
    const ky = y + headH + rowH * d.criteria.length + 0.2;
    h.text("mark-key-title", "legend", "Marks", { x, y: ky, w: 0.6, h: 0.26, fontSize: 11, bold: true, color: C.muted, valign: "middle" });
    MARKS.forEach((m, k) => {
      const kx = x + 0.7 + k * 1.55;
      markGlyph(h, `key-${k + 1}`, m, kx + GLYPH_D / 2, ky + 0.13);
      h.text(`key-label-${k + 1}`, "legend", m, { x: kx + 0.27, y: ky, w: 1.2, h: 0.26, fontSize: 11, color: C.ink, valign: "middle" });
    });
  },
};

/**
 * Type weight carries the mark in text display: strengths bold, partial marks regular, gaps
 * and unknowns muted. The words themselves separate "Does not" from "Not stated"; no italic,
 * because the token family ships no italic face and a synthesized slant reads as an error.
 */
const TEXT_STYLE: Record<Mark, { bold: boolean; color: string }> = {
  Meets: { bold: true, color: C.ink },
  Partly: { bold: false, color: C.ink },
  "Does not": { bold: false, color: C.muted },
  "Not stated": { bold: false, color: C.muted },
};

/**
 * Text display: no glyphs and no key. A graphite header rule replaces the filled band, the
 * accent option is carried by its header colour, a malachite rule and a soft column band, and
 * each mark word is weighted so strengths and gaps read without a legend.
 */
function renderText(h: RenderHelpers, d: CriterionMatrixData): void {
  const { x, y } = h.area;
  const labelW = 2.95;
  const optW = Math.min(1.5, (h.area.w - labelW) / d.options.length);
  const headH = 0.6;
  const rowH = Math.min(0.48, (h.area.h - headH - 0.1) / d.criteria.length);
  const rule = { type: "solid", pt: 0.75, color: C.border };
  const headRule = { type: "solid", pt: 1.25, color: C.ink };
  const accentRule = { type: "solid", pt: 2.5, color: C.accent };
  const none = { type: "none" };
  const hdr = (text: string, accent: boolean, align: "left" | "center"): TableCell => ({
    text,
    options: {
      bold: true, fontSize: 12, color: accent ? C.accent : C.ink, fill: { color: accent ? C.soft : C.paper },
      align, valign: "bottom", border: [none, none, accent ? accentRule : headRule, none],
    },
  });
  const rows: TableCell[][] = [
    [hdr("Criterion", false, "left"), ...d.options.map((o) => hdr(o, o === d.accent, "center"))],
    ...d.criteria.map((c): TableCell[] => [
      { text: c.label, options: { fontSize: 12, bold: false, color: C.ink, valign: "middle", fill: { color: C.paper }, border: [none, none, rule, none] } },
      ...c.marks.map((m, j): TableCell => ({
        text: m,
        options: {
          fontSize: 12, ...TEXT_STYLE[m], valign: "middle", align: "center",
          fill: { color: d.options[j] === d.accent ? C.soft : C.paper }, border: [none, none, rule, none],
        },
      })),
    ]),
  ];
  h.table("criterion-table", rows, {
    x, y, w: labelW + optW * d.options.length, colW: [labelW, ...d.options.map(() => optW)],
    rowH: [headH, ...d.criteria.map(() => rowH)], fontSize: 12,
  });
}
