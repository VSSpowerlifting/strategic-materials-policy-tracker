// K2 role-matrix — organisations x roles. Native table; the role marks are
// native circle shapes positioned over the cells (not table content). A cell
// may carry a short qualifier as table text. No amounts, no totals of money.
import { arr, obj, optStr, str } from "../contract";
import { maxItems, minItems, uniqueLabels } from "../integrity";
import { C, fmt, HEAD_CELL } from "../primitives";
import type { IntegrityIssue, Renderer, TableCell } from "../types";

export interface RoleMatrixData {
  roles: string[];
  orgs: { label: string; cells: ({ qualifier?: string } | null)[] }[];
}

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
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.roles.length, 2, "roles"),
      ...maxItems(d.roles.length, 5, "roles"),
      ...minItems(d.orgs.length, 3, "organisations"),
      ...maxItems(d.orgs.length, 8, "organisations"),
      ...uniqueLabels(d.roles, "role labels"),
      ...uniqueLabels(d.orgs.map((o) => o.label), "organisation labels"),
    ];
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
        if (q.length > 16) issues.push({ rule: "cell-length", message: `qualifier over 16 characters: ${q}` });
        if (AMOUNT_LIKE.test(q)) issues.push({ rule: "no-amounts-in-roles", message: `qualifier reads as an amount: ${q}` });
      });
    });
    d.roles.forEach((r, j) => {
      if (d.orgs.every((o) => o.cells[j] === null || o.cells[j] === undefined)) {
        issues.push({ rule: "role-held", message: `no organisation holds the role "${r}"` });
      }
      if (r.length > 16) issues.push({ rule: "cell-length", message: `role label over 16 characters: ${r}` });
    });
    return issues;
  },
  render(h, d) {
    const { x, y } = h.area;
    const labelW = 2.2;
    const roleW = (h.area.w - labelW) / d.roles.length;
    const headH = 0.58;
    const rowH = Math.min(0.5, (h.area.h - 1.45) / d.orgs.length);
    const footH = 0.42;
    const rule = { type: "solid", pt: 0.75, color: C.border };
    const none = { type: "none" };
    const hdr = (text: string, align: "left" | "center"): TableCell => ({
      text, options: { ...HEAD_CELL, align },
    });
    const rows: TableCell[][] = [
      [hdr("Organisation", "left"), ...d.roles.map((r) => hdr(r, "center"))],
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
      [
        { text: "Organisations in role", options: { fontSize: 11, bold: true, color: C.muted, valign: "middle", fill: { color: C.paper }, border: [rule, none, none, none] } },
        ...d.roles.map((_, j): TableCell => ({
          text: fmt(d.orgs.filter((o) => o.cells[j]).length),
          options: { fontSize: 11, bold: true, color: C.ink, align: "center", valign: "middle", fill: { color: C.paper }, border: [rule, none, none, none] },
        })),
      ],
    ];
    h.table("role-table", rows, {
      x, y, w: labelW + roleW * d.roles.length, colW: [labelW, ...d.roles.map(() => roleW)],
      rowH: [headH, ...d.orgs.map(() => rowH), footH], fontSize: 11,
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
    h.text("role-key-label", "legend", "Holds the role in the source set; text beside the mark qualifies it. No amounts are shown.", {
      x: x + 0.27, y: ky, w: 7.8, h: 0.26, fontSize: 11, color: C.ink, valign: "middle",
    });
  },
};
