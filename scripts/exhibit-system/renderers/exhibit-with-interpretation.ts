// K4 exhibit-with-interpretation — a compact native table of key figures with
// numbered interpretation notes beside it. Each note cites a table row by its
// row number; check() enforces that every reference resolves.
import { arr, num, obj, optNum, optStr, str, strList } from "../contract";
import { maxItems, minItems, uniqueLabels } from "../integrity";
import { C, fmt, hairline } from "../primitives";
import type { IntegrityIssue, Renderer, TableCell } from "../types";

export interface InterpretationData {
  unit: string;
  dp: number;
  columns: string[];
  rows: { label: string; values: number[] }[];
  notes: { ref: number; text: string }[];
  /** Heading over the notes (default "READING THE TABLE"). */
  notesHeading?: string;
}

export const exhibitWithInterpretation: Renderer<InterpretationData> = {
  id: "exhibit-with-interpretation",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      columns: strList(o.columns, "data.columns"),
      rows: arr(o.rows, "data.rows").map((x, i) => {
        const r = obj(x, `data.rows[${i}]`);
        return {
          label: str(r.label, `data.rows[${i}].label`),
          values: arr(r.values, `data.rows[${i}].values`).map((v, j) => num(v, `data.rows[${i}].values[${j}]`)),
        };
      }),
      notes: arr(o.notes, "data.notes").map((x, i) => {
        const r = obj(x, `data.notes[${i}]`);
        return { ref: num(r.ref, `data.notes[${i}].ref`), text: str(r.text, `data.notes[${i}].text`) };
      }),
      ...(o.notesHeading === undefined ? {} : { notesHeading: optStr(o.notesHeading, "data.notesHeading") }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.rows.length, 2, "table rows"),
      ...maxItems(d.rows.length, 6, "table rows"),
      ...maxItems(d.columns.length, 2, "value columns (the row-number and label columns make four)"),
      ...minItems(d.notes.length, 2, "interpretation notes"),
      ...maxItems(d.notes.length, 4, "interpretation notes"),
      ...uniqueLabels(d.rows.map((r) => r.label), "row labels"),
    ];
    d.rows.forEach((r) => {
      if (r.values.length !== d.columns.length) {
        issues.push({ rule: "aligned-series", message: `${r.label}: ${r.values.length} values for ${d.columns.length} columns` });
      }
      if (r.label.length > 26) issues.push({ rule: "cell-length", message: `row label over 26 characters: ${r.label}` });
    });
    d.notes.forEach((n) => {
      if (!Number.isInteger(n.ref) || n.ref < 1 || n.ref > d.rows.length) {
        issues.push({ rule: "reference-resolves", message: `note cites row ${n.ref}; the table has rows 1 to ${d.rows.length}` });
      }
      if (n.text.length > 130) issues.push({ rule: "cell-length", message: `note over 130 characters: ${n.text.slice(0, 30)}…` });
    });
    const refs = d.notes.map((n) => n.ref);
    if (new Set(refs).size !== refs.length) {
      issues.push({ rule: "reference-resolves", message: "two notes cite the same row; merge them" });
    }
    return issues;
  },
  render(h, d) {
    const { x, y } = h.area;
    const numW = 0.4;
    const labW = 2.1;
    const valW = 1.3;
    const tableW = numW + labW + valW * d.columns.length;
    const headH = 0.5;
    const rowH = Math.min(0.66, (h.area.h - 0.9) / d.rows.length);
    const rule = { type: "solid", pt: 0.75, color: C.border };
    const none = { type: "none" };
    const hdr = (text: string, align: "left" | "center" | "right"): TableCell => ({
      text, options: { bold: true, fontSize: 11, color: C.paper, fill: { color: C.dark }, align, valign: "middle" },
    });
    const rows: TableCell[][] = [
      [hdr("#", "center"), hdr("Item", "left"), ...d.columns.map((c) => hdr(c, "right"))],
      ...d.rows.map((r, i): TableCell[] => {
        const fill = { color: i % 2 ? C.soft : C.paper };
        return [
          { text: String(i + 1), options: { fontSize: 11, bold: true, color: C.muted, align: "center", valign: "middle", fill, border: [none, none, rule, none] } },
          { text: r.label, options: { fontSize: 11, bold: true, valign: "middle", fill, border: [none, none, rule, none] } },
          ...r.values.map((v): TableCell => ({
            text: fmt(v, d.dp), options: { fontSize: 11, align: "right", valign: "middle", fill, border: [none, none, rule, none] },
          })),
        ];
      }),
    ];
    h.table("figures-table", rows, {
      x, y, w: tableW, colW: [numW, labW, ...d.columns.map(() => valW)], rowH: [headH, ...d.rows.map(() => rowH)], fontSize: 11,
    });
    h.text("table-unit", "label", d.unit, { x, y: y + headH + rowH * d.rows.length + 0.1, w: tableW, h: 0.26, fontSize: 11, color: C.muted });

    // Interpretation block: each note carries the number of the row it cites.
    const bx = x + tableW + 0.4;
    const bw = h.area.x + h.area.w - bx;
    h.text("reading-heading", "annot", d.notesHeading ?? "READING THE TABLE", { x: bx, y, w: bw, h: 0.3, fontSize: 11, bold: true, color: C.muted, charSpacing: 1, valign: "middle" });
    hairline(h, "reading-rule", "annot", bx, y + 0.34, bw);
    const noteH = (h.area.h - 0.5) / d.notes.length;
    d.notes.forEach((n, i) => {
      const ny = y + 0.5 + i * noteH;
      h.text(`note-ref-${i + 1}`, "annot", String(n.ref), {
        x: bx, y: ny + 0.02, w: 0.3, h: 0.3, shape: h.shapes.ellipse, fill: { color: C.neutralDark },
        fontSize: 11, bold: true, color: C.paper, align: "center", valign: "middle",
      });
      h.text(`note-text-${i + 1}`, "annot", n.text, { x: bx + 0.42, y: ny, w: bw - 0.42, h: noteH - 0.1, fontSize: 14, color: C.ink, valign: "top" });
    });
  },
};
