// F2 sensitivity-grid — two-way sensitivity of a model output as a native table.
// Rows = values of driver A, columns = values of driver B, cells = model output,
// shaded on one restrained sequential ramp; the base case is outlined.
import { arr, num, obj, optNum, str, strList } from "../contract";
import { maxItems, minItems, sameLength, uniqueLabels } from "../integrity";
import { C, fmt } from "../primitives";
import type { IntegrityIssue, Renderer, TableCell } from "../types";

export interface SensitivityGridData {
  /** Output measure and unit, labelled as model output. */
  unit: string;
  dp: number;
  rowDriver: { name: string; values: string[] };
  colDriver: { name: string; values: string[] };
  /** cells[r][c] is the output at rowDriver.values[r] and colDriver.values[c]. */
  cells: number[][];
  base: { row: string; col: string };
}

/** Pale to gold tints; the lowest stop stays visibly darker than the paper. Ink text stays legible at every stop. */
const RAMP = ["ECE6D9", "E4D3AE", "D9BD84", C.gold];

function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}
function shade(t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  const f = x - i;
  const a = hex(RAMP[i]);
  const b = hex(RAMP[i + 1]);
  return a
    .map((v, k) => Math.round(v + (b[k] - v) * f).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export const sensitivityGrid: Renderer<SensitivityGridData> = {
  id: "sensitivity-grid",
  parse(d) {
    const o = obj(d, "data");
    const rd = obj(o.rowDriver, "data.rowDriver");
    const cd = obj(o.colDriver, "data.colDriver");
    const b = obj(o.base, "data.base");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      rowDriver: { name: str(rd.name, "data.rowDriver.name"), values: strList(rd.values, "data.rowDriver.values") },
      colDriver: { name: str(cd.name, "data.colDriver.name"), values: strList(cd.values, "data.colDriver.values") },
      cells: arr(o.cells, "data.cells").map((r, i) =>
        arr(r, `data.cells[${i}]`).map((v, j) => num(v, `data.cells[${i}][${j}]`)),
      ),
      base: { row: str(b.row, "data.base.row"), col: str(b.col, "data.base.col") },
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.rowDriver.values.length, 3, "row values"),
      ...maxItems(d.rowDriver.values.length, 7, "row values"),
      ...minItems(d.colDriver.values.length, 3, "column values"),
      ...maxItems(d.colDriver.values.length, 7, "column values"),
      ...uniqueLabels(d.rowDriver.values, "row values"),
      ...uniqueLabels(d.colDriver.values, "column values"),
      ...sameLength(d.cells, d.rowDriver.values, "grid rows vs row values"),
      ...d.cells.flatMap((r, i) => sameLength(r, d.colDriver.values, `grid row ${i} vs column values`)),
    ];
    if (!d.rowDriver.values.includes(d.base.row) || !d.colDriver.values.includes(d.base.col)) {
      issues.push({ rule: "base-in-grid", message: `base case (${d.base.row}, ${d.base.col}) is not a cell of the grid` });
    }
    return issues;
  },
  render(h, d) {
    const R = d.rowDriver.values.length;
    const K = d.colDriver.values.length;
    const all = d.cells.flat();
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const br = d.rowDriver.values.indexOf(d.base.row);
    const bc = d.colDriver.values.indexOf(d.base.col);

    h.text("unit", "axis", d.unit, { x: h.area.x, y: h.area.y, w: 4.5, h: 0.26, fontSize: 10, color: C.muted });
    h.shape("model-tag-box", "annot", h.shapes.rect, {
      x: h.area.x + h.area.w - 2.75, y: h.area.y - 0.01, w: 2.75, h: 0.28,
      fill: { color: C.paper, transparency: 100 }, line: { color: C.neutralDark, width: 0.75, dashType: "dash" },
    });
    h.text("model-tag", "annot", "MODEL OUTPUT — illustrative", {
      x: h.area.x + h.area.w - 2.75, y: h.area.y - 0.01, w: 2.75, h: 0.28, fontSize: 10, bold: true, color: C.neutralDark, align: "center", valign: "middle", charSpacing: 1,
    });

    const grid = { color: C.paper, pt: 1.5, type: "solid" };
    const head = (text: string, extra: Record<string, unknown> = {}): TableCell => ({
      text,
      options: { bold: true, fontSize: 11, color: C.ink, fill: { color: C.soft }, align: "center", valign: "middle", border: grid, ...extra },
    });
    const rows: TableCell[][] = [];
    const first: TableCell[] = [
      { text: "", options: { fill: { color: C.paper }, border: grid } },
      head(`${d.colDriver.name} →`, { colspan: K, fill: { color: C.paper }, color: C.muted, fontSize: 10 }),
    ];
    rows.push(first);
    rows.push([head(`${d.rowDriver.name} ↓`, { align: "left", fontSize: 10 }), ...d.colDriver.values.map((v) => head(v))]);
    d.cells.forEach((r, i) => {
      rows.push([
        head(d.rowDriver.values[i], { align: "left", fontSize: 11 }),
        ...r.map((v, j): TableCell => {
          const isBase = i === br && j === bc;
          return {
            text: fmt(v, d.dp),
            options: {
              fontSize: 12,
              bold: isBase,
              color: C.ink,
              align: "center",
              valign: "middle",
              fill: { color: shade(hi === lo ? 0 : (v - lo) / (hi - lo)) },
              border: isBase ? { color: C.accent, pt: 3, type: "solid" } : grid,
            },
          };
        }),
      ]);
    });
    const labelW = 2.15;
    const tableTop = h.area.y + 0.4;
    const rowHs = [0.3, 0.42, ...Array.from({ length: R }, () => 0.5)];
    h.table("sensitivity-table", rows, {
      x: h.area.x, y: tableTop, w: h.area.w,
      colW: [labelW, ...Array.from({ length: K }, () => (h.area.w - labelW) / K)],
      rowH: rowHs,
      margin: [0, 0.08, 0, 0.1],
    });

    // Sequential key: low to high output, plus the base-case marker.
    const keyY = tableTop + rowHs.reduce((s, v) => s + v, 0) + 0.2;
    const steps = 8;
    const kw = 0.3;
    h.text("key-low", "legend", fmt(lo, d.dp), { x: h.area.x, y: keyY, w: 0.6, h: 0.24, fontSize: 10, color: C.muted, align: "right", valign: "middle" });
    for (let s = 0; s < steps; s++) {
      h.shape(`key-${s}`, "legend", h.shapes.rect, {
        x: h.area.x + 0.68 + s * kw, y: keyY + 0.04, w: kw, h: 0.16, fill: { color: shade(s / (steps - 1)) }, line: { color: C.paper, width: 0 },
      });
    }
    h.text("key-high", "legend", fmt(hi, d.dp), { x: h.area.x + 0.76 + steps * kw, y: keyY, w: 0.6, h: 0.24, fontSize: 10, color: C.muted, valign: "middle" });
    h.shape("key-base-box", "legend", h.shapes.rect, {
      x: h.area.x + 3.9, y: keyY + 0.03, w: 0.3, h: 0.18, fill: { color: C.paper, transparency: 100 }, line: { color: C.accent, width: 2.25 },
    });
    h.text("key-base-label", "legend", `Base case: ${d.base.row}, ${d.base.col}`, {
      x: h.area.x + 4.3, y: keyY, w: 4.4, h: 0.24, fontSize: 10, color: C.ink, valign: "middle",
    });
  },
};
