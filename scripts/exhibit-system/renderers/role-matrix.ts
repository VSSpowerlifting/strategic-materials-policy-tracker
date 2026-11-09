// K2 role-matrix — organisations x roles. Native table; the role marks are
// native circle shapes positioned over the cells (not table content). A cell
// may carry a short qualifier as table text. No amounts, no totals of money.
// Optional `layout` relabels the row header, widens the label column, hides the
// count footer and replaces the key, for row-by-column frameworks whose rows are
// not organisations. Without it the output is unchanged.
import { arr, bool, obj, oneOf, optNum, optStr, str } from "../contract";
import { maxItems, minItems, uniqueLabels } from "../integrity";
import { C, fmt } from "../primitives";
import type { IntegrityIssue, Renderer, RenderHelpers, TableCell } from "../types";

export interface RoleMatrixData {
  roles: string[];
  orgs: { label: string; cells: ({ qualifier?: string } | null)[] }[];
  layout?: {
    rowHeader: string; labelWidth: number; showCounts: boolean; keyText: string;
    /** "ledger" sets the qualifiers as the content: no marks, no key, a light header rule. */
    style?: "marks" | "ledger";
    /** Ledger only: text for a cell with no role (muted). */
    emptyText?: string;
    /** Ledger only: the role column to emphasise (bold ink, soft band). */
    emphasisColumn?: string;
    /** Ledger only: "sentence" lets a cell carry a short consequence (up to 64 characters) and wraps rows taller. */
    cellText?: "short" | "sentence";
  };
}

const DEFAULT_KEY = "Holds the role in the source set; text beside the mark qualifies it. No amounts are shown.";

/** Qualifiers describe a role, never an amount. */
const AMOUNT_LIKE = /\bCU\b|million|billion|%|\bunits?\b|\btonnes?\b/i;

export const roleMatrix: Renderer<RoleMatrixData> = {
  id: "role-matrix",
  parse(d) {
    const o = obj(d, "data");
    return {
      roles: arr(o.roles, "data.roles").map((r, i) => str(r, `data.roles[${i}]`)),
      orgs: arr(o.orgs, "data.orgs").map((x, i) => {
        const r = obj(x, `data.orgs[${i}]`);
        return {
          label: str(r.label, `data.orgs[${i}].label`),
          cells: arr(r.cells, `data.orgs[${i}].cells`).map((c, j) => {
            if (c === null) return null;
            const co = obj(c, `data.orgs[${i}].cells[${j}]`);
            return { qualifier: optStr(co.qualifier, `data.orgs[${i}].cells[${j}].qualifier`) };
          }),
        };
      }),
      layout: o.layout === undefined ? undefined : (() => {
        const l = obj(o.layout, "data.layout");
        const style = l.style === undefined ? undefined : oneOf(l.style, ["marks", "ledger"] as const, "data.layout.style");
        const ledger = style === "ledger";
        const emptyText = optStr(l.emptyText, "data.layout.emptyText");
        const emphasisColumn = optStr(l.emphasisColumn, "data.layout.emphasisColumn");
        const cellText = l.cellText === undefined ? undefined : oneOf(l.cellText, ["short", "sentence"] as const, "data.layout.cellText");
        return {
          rowHeader: str(l.rowHeader, "data.layout.rowHeader"),
          labelWidth: optNum(l.labelWidth, "data.layout.labelWidth") ?? 2.2,
          showCounts: l.showCounts === undefined ? true : bool(l.showCounts, "data.layout.showCounts"),
          keyText: ledger && l.keyText === undefined ? "" : str(l.keyText, "data.layout.keyText"),
          ...(style ? { style } : {}),
          ...(emptyText !== undefined ? { emptyText } : {}),
          ...(emphasisColumn !== undefined ? { emphasisColumn } : {}),
          ...(cellText !== undefined ? { cellText } : {}),
        };
      })(),
    };
  },
  check(d) {
    const lw = d.layout?.labelWidth;
    const issues: IntegrityIssue[] = [
      ...(lw !== undefined && (lw < 1.5 || lw > 5.5) ? [{ rule: "label-width", message: `label width ${lw} outside 1.5-5.5 in` }] : []),
      ...minItems(d.roles.length, 2, "roles"),
      ...maxItems(d.roles.length, 5, "roles"),
      ...minItems(d.orgs.length, 3, "organisations"),
      ...maxItems(d.orgs.length, 8, "organisations"),
      ...uniqueLabels(d.roles, "role labels"),
      ...uniqueLabels(d.orgs.map((o) => o.label), "organisation labels"),
    ];
    const maxCell = d.layout?.cellText === "sentence" ? 64 : 16;
    d.orgs.forEach((o) => {
      if (o.cells.length !== d.roles.length) {
        issues.push({ rule: "aligned-series", message: `${o.label}: ${o.cells.length} cells for ${d.roles.length} roles` });
      }
      if (o.cells.every((c) => c === null)) {
        issues.push({ rule: "role-held", message: `${o.label} holds no role; drop the row or record its role` });
      }
      o.cells.forEach((c) => {
        const q = c?.qualifier;
        if (q === undefined) return;
        if (q.length > maxCell) issues.push({ rule: "cell-length", message: `qualifier over ${maxCell} characters: ${q}` });
        if (AMOUNT_LIKE.test(q)) issues.push({ rule: "no-amounts-in-roles", message: `qualifier reads as an amount: ${q}` });
      });
    });
    const em = d.layout?.emphasisColumn;
    if (em !== undefined && !d.roles.includes(em)) issues.push({ rule: "accent-resolves", message: `emphasis column "${em}" is not a role` });
    if (d.layout?.style !== "ledger" && (d.layout?.emptyText !== undefined || em !== undefined || d.layout?.cellText !== undefined)) {
      issues.push({ rule: "layout-option", message: "emptyText, emphasisColumn and cellText apply to the ledger style only" });
    }
    d.roles.forEach((r, j) => {
      if (d.orgs.every((o) => o.cells[j] === null || o.cells[j] === undefined)) {
        issues.push({ rule: "role-held", message: `no organisation holds the role "${r}"` });
      }
      if (r.length > 16) issues.push({ rule: "cell-length", message: `role label over 16 characters: ${r}` });
    });
    return issues;
  },
  render(h, d) {
    if (d.layout?.style === "ledger") {
      renderLedger(h, d);
      return;
    }
    const { x, y } = h.area;
    const labelW = d.layout?.labelWidth ?? 2.2;
    const showCounts = d.layout?.showCounts ?? true;
    const roleW = (h.area.w - labelW) / d.roles.length;
    const headH = 0.58;
    const rowH = Math.min(0.5, (h.area.h - 1.45) / d.orgs.length);
    const footH = showCounts ? 0.42 : 0;
    const rule = { type: "solid", pt: 0.75, color: C.border };
    const none = { type: "none" };
    const hdr = (text: string, align: "left" | "center"): TableCell => ({
      text, options: { bold: true, fontSize: 11, color: C.paper, fill: { color: C.dark }, align, valign: "middle" },
    });
    const rows: TableCell[][] = [
      [hdr(d.layout?.rowHeader ?? "Organisation", "left"), ...d.roles.map((r) => hdr(r, "center"))],
      ...d.orgs.map((o, i): TableCell[] => [
        { text: o.label, options: { fontSize: 11, bold: true, valign: "middle", fill: { color: i % 2 ? C.soft : C.paper }, border: [none, none, rule, none] } },
        ...o.cells.map((c): TableCell => ({
          text: c?.qualifier ?? "",
          options: {
            fontSize: 11, color: C.muted, valign: "middle", align: "left", margin: [0.02, 0.02, 0.02, 0.34],
            fill: { color: i % 2 ? C.soft : C.paper }, border: [none, none, rule, none],
          },
        })),
      ]),
    ];
    if (showCounts) rows.push(
      [
        { text: "Organisations in role", options: { fontSize: 11, bold: true, color: C.muted, valign: "middle", fill: { color: C.paper }, border: [rule, none, none, none] } },
        ...d.roles.map((_, j): TableCell => ({
          text: fmt(d.orgs.filter((o) => o.cells[j]).length),
          options: { fontSize: 11, bold: true, color: C.ink, align: "center", valign: "middle", fill: { color: C.paper }, border: [rule, none, none, none] },
        })),
      ],
    );
    h.table("role-table", rows, {
      x, y, w: labelW + roleW * d.roles.length, colW: [labelW, ...d.roles.map(() => roleW)],
      rowH: [headH, ...d.orgs.map(() => rowH), ...(showCounts ? [footH] : [])], fontSize: 11,
    });
    const dia = 0.17;
    d.orgs.forEach((o, i) => {
      o.cells.forEach((c, j) => {
        if (!c) return;
        h.shape(`role-mark-${i + 1}-${j + 1}`, "data", h.shapes.ellipse, {
          x: x + labelW + roleW * j + 0.1, y: y + headH + rowH * i + rowH / 2 - dia / 2, w: dia, h: dia,
          fill: { color: C.neutralDark }, line: { color: C.neutralDark, width: 1 },
        });
      });
    });
    const ky = y + headH + rowH * d.orgs.length + footH + 0.18;
    h.shape("role-key-mark", "legend", h.shapes.ellipse, { x, y: ky + 0.045, w: dia, h: dia, fill: { color: C.neutralDark }, line: { color: C.neutralDark, width: 1 } });
    h.text("role-key-label", "legend", d.layout?.keyText ?? DEFAULT_KEY, {
      x: x + 0.27, y: ky, w: d.layout ? Math.min(h.area.w - 0.27, 9.6) : 7.8, h: 0.26, fontSize: 11, color: C.ink, valign: "middle",
    });
  },
};

/**
 * Ledger style: the qualifier text is the content. No marks and no key; the header is a
 * rule rather than a dark band; empty cells say so in muted type; one column may be
 * emphasised. The count footer still follows layout.showCounts.
 */
function renderLedger(h: RenderHelpers, d: RoleMatrixData): void {
  const l = d.layout!;
  const { x, y } = h.area;
  const labelW = l.labelWidth;
  const roleW = (h.area.w - labelW) / d.roles.length;
  const headH = 0.5;
  const footH = l.showCounts ? 0.42 : 0;
  // Sentence cells wrap to two lines, so their rows may grow; short cells keep the 0.9 geometry.
  const rowH = Math.min(l.cellText === "sentence" ? 0.86 : 0.56, (h.area.h - headH - footH - 0.1) / d.orgs.length);
  const rule = { type: "solid", pt: 0.75, color: C.border };
  const headRule = { type: "solid", pt: 1.25, color: C.ink };
  const none = { type: "none" };
  const isEm = (j: number) => d.roles[j] === l.emphasisColumn;
  const hdr = (text: string, em: boolean): TableCell => ({
    text,
    options: {
      bold: true, fontSize: 12, color: em ? C.accent : C.ink, fill: { color: em ? C.soft : C.paper }, align: "left", valign: "bottom",
      border: [none, none, em ? { type: "solid", pt: 2.5, color: C.accent } : headRule, none],
    },
  });
  const rows: TableCell[][] = [
    [hdr(l.rowHeader, false), ...d.roles.map((r, j) => hdr(r, isEm(j)))],
    ...d.orgs.map((o): TableCell[] => [
      { text: o.label, options: { fontSize: 12, bold: true, color: C.ink, valign: "middle", fill: { color: C.paper }, border: [none, none, rule, none] } },
      ...o.cells.map((c, j): TableCell => {
        const empty = !c;
        return {
          text: empty ? (l.emptyText ?? "") : (c.qualifier ?? ""),
          options: {
            fontSize: 12, bold: !empty && isEm(j), color: empty ? C.muted : C.ink, valign: "middle", align: "left",
            fill: { color: isEm(j) ? C.soft : C.paper }, border: [none, none, rule, none],
          },
        };
      }),
    ]),
  ];
  if (l.showCounts) rows.push([
    { text: "Organisations in role", options: { fontSize: 11, bold: true, color: C.muted, valign: "middle", fill: { color: C.paper }, border: [rule, none, none, none] } },
    ...d.roles.map((_, j): TableCell => ({
      text: fmt(d.orgs.filter((o) => o.cells[j]).length),
      options: { fontSize: 11, bold: true, color: C.ink, align: "left", valign: "middle", fill: { color: C.paper }, border: [rule, none, none, none] },
    })),
  ]);
  h.table("role-table", rows, {
    x, y, w: labelW + roleW * d.roles.length, colW: [labelW, ...d.roles.map(() => roleW)],
    rowH: [headH, ...d.orgs.map(() => rowH), ...(l.showCounts ? [footH] : [])], fontSize: 12,
  });
}
