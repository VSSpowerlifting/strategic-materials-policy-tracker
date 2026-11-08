// D3 status-separated-capital — the SMPT signature. Amounts at each transaction
// status sit in separate panels that are never summed. Statuses short of a
// binding commitment are drawn hollow and dashed. Native shapes on a scale
// shared by every panel (one unit): geometry and labels are editable, values
// are NOT data-bound.
import { arr, num, obj, optNum, str, strList } from "../contract";
import { inVocabulary, maxItems, minItems, nonNegative, sameLength, STATUS_TAXONOMY, uniqueLabels } from "../integrity";
import { C, fmt, hairline, legendItem, niceMax, scale, vline } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface StatusCapitalData {
  unit: string;
  dp: number;
  /** Statuses in taxonomy order; each becomes a panel. */
  statuses: string[];
  /** amounts[i] belongs to statuses[i]; null = no amount stated at that status (not zero). */
  rows: { label: string; amounts: (number | null)[] }[];
  /** Keys found at data or row level that name a cross-status total; always an integrity failure. */
  forbiddenKeys: string[];
}

const FORBIDDEN = /^(total|sum|grand_?total|combined|all_?statuses)$/i;
/** Statuses before "binding" are not yet a commitment: drawn hollow and dashed. */
const HOLLOW = new Set<string>(["announcement", "authorization"]);
const TITLE: Record<string, string> = {
  announcement: "Announcement",
  authorization: "Authorization",
  binding: "Binding",
  drawdown: "Drawdown",
  expenditure: "Expenditure",
  operational: "Operational",
};

export const statusSeparatedCapital: Renderer<StatusCapitalData> = {
  id: "status-separated-capital",
  parse(d) {
    const o = obj(d, "data");
    const forbidden = Object.keys(o).filter((k) => FORBIDDEN.test(k));
    const rows = arr(o.rows, "data.rows").map((x, i) => {
      const r = obj(x, `data.rows[${i}]`);
      forbidden.push(...Object.keys(r).filter((k) => FORBIDDEN.test(k)).map((k) => `rows[${i}].${k}`));
      return {
        label: str(r.label, `data.rows[${i}].label`),
        amounts: arr(r.amounts, `data.rows[${i}].amounts`).map((v, j) =>
          v === null ? null : num(v, `data.rows[${i}].amounts[${j}]`),
        ),
      };
    });
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      statuses: strList(o.statuses, "data.statuses"),
      rows,
      forbiddenKeys: forbidden,
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...inVocabulary(d.statuses, STATUS_TAXONOMY, "statuses"),
      ...minItems(d.statuses.length, 3, "status panels"),
      ...maxItems(d.statuses.length, 5, "status panels"),
      ...minItems(d.rows.length, 2, "rows"),
      ...maxItems(d.rows.length, 5, "rows"),
      ...uniqueLabels(d.statuses, "statuses"),
      ...uniqueLabels(d.rows.map((r) => r.label)),
      ...d.rows.flatMap((r) => sameLength(r.amounts, d.statuses, `row "${r.label}" amounts vs statuses`)),
      ...nonNegative(d.rows.flatMap((r) => r.amounts.filter((a): a is number => a !== null))),
    ];
    const order = d.statuses.map((s) => (STATUS_TAXONOMY as readonly string[]).indexOf(s));
    if (order.some((v, i) => i > 0 && v <= order[i - 1])) {
      issues.push({ rule: "status-order", message: "statuses must follow the SMPT status taxonomy order" });
    }
    if (d.forbiddenKeys.length) {
      issues.push({
        rule: "no-cross-status-total",
        message: `amounts at different statuses must never be summed; remove ${d.forbiddenKeys.join(", ")}`,
      });
    }
    return issues;
  },
  render(h, d) {
    const nP = d.statuses.length;
    const labelW = 2.0;
    const panelW = (h.area.w - labelW) / nP;
    const inset = 0.2;
    const valueRoom = 0.7;
    const barMax = panelW - inset - valueRoom - 0.05;
    const all = d.rows.flatMap((r) => r.amounts.filter((a): a is number => a !== null));
    const max = niceMax(Math.max(...all) * 1.02);
    const top = h.area.y + 0.86;
    const bottom = h.area.y + h.area.h - 0.04;
    const rowH = (bottom - top) / d.rows.length;
    const barH = Math.min(0.26, rowH * 0.52);

    let lx = h.area.x;
    lx = legendItem(h, "legend-hollow", lx, h.area.y, "Not yet binding", { line: C.neutralDark, dash: "dash" }, 1.75);
    lx = legendItem(h, "legend-binding", lx, h.area.y, "Binding", { fill: C.neutral }, 1.2);
    legendItem(h, "legend-later", lx, h.area.y, "Drawn or spent", { fill: C.neutralDark }, 1.75);
    h.text("unit", "axis", `${d.unit} · one scale for every panel · "—" = no amount stated`, {
      x: h.area.x + h.area.w - 6.2, y: h.area.y, w: 6.2, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    hairline(h, "header-rule", "axis", h.area.x, top - 0.08, h.area.w, C.border);
    d.statuses.forEach((s, p) => {
      const px = h.area.x + labelW + p * panelW;
      if (p > 0) vline(h, `panel-rule-${p}`, "axis", px - 0.02, h.area.y + 0.38, bottom - h.area.y - 0.38, C.border);
      h.text(`panel-title-${p}`, "label", TITLE[s] ?? s, {
        x: px + inset, y: h.area.y + 0.4, w: panelW - inset, h: 0.26, fontSize: 12, bold: true, color: C.ink,
      });
      h.text(`panel-note-${p}`, "axis", HOLLOW.has(s) ? "not yet binding" : s === "binding" ? "legal commitment" : "money moved", {
        x: px + inset, y: h.area.y + 0.62, w: panelW - inset, h: 0.2, fontSize: 11, color: C.muted,
      });
    });

    const sx = scale(0, max, 0, barMax);
    d.rows.forEach((r, i) => {
      const cy = top + rowH * (i + 0.5);
      if (i > 0) hairline(h, `row-rule-${i}`, "axis", h.area.x, top + rowH * i, h.area.w, C.soft);
      h.text(`row-label-${i}`, "label", r.label, {
        x: h.area.x, y: cy - 0.15, w: labelW - 0.15, h: 0.3, fontSize: 11, color: C.ink, valign: "middle",
      });
      d.statuses.forEach((s, p) => {
        const px = h.area.x + labelW + p * panelW + inset;
        const a = r.amounts[p];
        if (a === null) {
          h.text(`value-${i}-${p}`, "label", "—", {
            x: px, y: cy - 0.14, w: 0.6, h: 0.28, fontSize: 11, color: C.muted, valign: "middle",
          });
          return;
        }
        const w = Math.max(sx(a), 0.02);
        const hollow = HOLLOW.has(s);
        const fill = s === "binding" ? C.neutral : C.neutralDark;
        h.shape(`bar-${i}-${p}`, "data", h.shapes.rect, hollow
          ? { x: px, y: cy - barH / 2, w, h: barH, fill: { color: C.paper, transparency: 100 }, line: { color: C.neutralDark, width: 1.25, dashType: "dash" } }
          : { x: px, y: cy - barH / 2, w, h: barH, fill: { color: fill }, line: { color: fill, width: 0.75 } });
        h.text(`value-${i}-${p}`, "label", fmt(a, d.dp), {
          x: px + w + 0.08, y: cy - 0.14, w: valueRoom - 0.1, h: 0.28, fontSize: 11, color: C.ink, valign: "middle",
        });
      });
    });
  },
};
