// C2 small-multiples — 4–6 mini line charts in a grid on one SHARED value axis.
// One native line chart per panel (each with its own embedded workbook); the
// renderer passes the same axis min/max/major unit to every panel.
import { arr, bool, num, obj, optNum, str, strList } from "../contract";
import { maxItems, minItems, sameLength, uniqueLabels, within } from "../integrity";
import { C, chartDefaults, fmt, formatCode } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface SmallMultiplesData {
  unit: string;
  dp: number;
  axisMin: number;
  axisMax: number;
  majorUnit: number;
  periods: string[];
  panels: { title: string; values: number[]; highlight: boolean }[];
}

export const smallMultiples: Renderer<SmallMultiplesData> = {
  id: "small-multiples",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      axisMin: num(o.axisMin, "data.axisMin"),
      axisMax: num(o.axisMax, "data.axisMax"),
      majorUnit: num(o.majorUnit, "data.majorUnit"),
      periods: strList(o.periods, "data.periods"),
      panels: arr(o.panels, "data.panels").map((x, i) => {
        const r = obj(x, `data.panels[${i}]`);
        return {
          title: str(r.title, `data.panels[${i}].title`),
          values: arr(r.values, `data.panels[${i}].values`).map((v, j) => num(v, `data.panels[${i}].values[${j}]`)),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.panels[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.panels.length, 4, "panels"),
      ...maxItems(d.panels.length, 6, "panels"),
      ...minItems(d.periods.length, 4, "periods"),
      ...uniqueLabels(d.panels.map((p) => p.title), "panel titles"),
      ...uniqueLabels(d.periods, "periods"),
      ...within(d.panels.flatMap((p) => p.values), d.axisMin, d.axisMax, "panel values (shared axis)"),
    ];
    for (const p of d.panels) issues.push(...sameLength(p.values, d.periods, `panel ${p.title}`));
    if (!(d.axisMax > d.axisMin) || !(d.majorUnit > 0)) {
      issues.push({ rule: "axis-range", message: "axisMax must exceed axisMin and majorUnit must be positive" });
    }
    if (d.panels.filter((p) => p.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "highlight at most one panel per exhibit" });
    }
    return issues;
  },
  render(h, d) {
    const a = h.area;
    const n = d.panels.length;
    const cols = n === 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const gapX = 0.3;
    const gapY = 0.14;
    const cellW = (a.w - gapX * (cols - 1)) / cols;
    const cellH = (a.h - gapY * (rows - 1)) / rows;
    const titleH = 0.26;
    const skip = Math.max(d.periods.length - 1, 1);

    d.panels.forEach((p, i) => {
      const cx = a.x + (i % cols) * (cellW + gapX);
      const cy = a.y + Math.floor(i / cols) * (cellH + gapY);
      const col = p.highlight ? C.accent : C.neutralDark;
      h.text(`panel-title-${i}`, "label", p.title, {
        x: cx, y: cy, w: cellW - 0.9, h: titleH, fontSize: 11, bold: true, color: p.highlight ? C.accent : C.ink, valign: "middle",
      });
      h.text(`panel-last-${i}`, "label", fmt(p.values[p.values.length - 1], d.dp), {
        x: cx + cellW - 0.9, y: cy, w: 0.9, h: titleH, fontSize: 11, bold: true, color: col, align: "right", valign: "middle",
      });
      h.chart(
        `panel-${i}`,
        h.charts.line,
        [{ name: p.title, labels: d.periods, values: p.values }],
        chartDefaults({ x: cx, y: cy + titleH, w: cellW, h: cellH - titleH }, {
          chartColors: [col],
          lineSize: p.highlight ? 3 : 2,
          lineDataSymbol: "none",
          valAxisMinVal: d.axisMin,
          valAxisMaxVal: d.axisMax,
          valAxisMajorUnit: d.majorUnit,
          valAxisLabelFormatCode: formatCode(d.dp),
          valAxisLabelFontSize: 9,
          valGridLine: { color: "E9E5DC", size: 0.5 },
          catAxisLabelFrequency: skip,
          catAxisLabelFontSize: 9,
          altText: `Panel ${p.title}, ${d.unit}, shared axis ${d.axisMin} to ${d.axisMax}`,
        }),
      );
    });
  },
};
