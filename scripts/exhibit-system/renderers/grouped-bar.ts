// A3 grouped-bar — 2–3 series per category on one zero-based axis.
// Native clustered column chart with an embedded workbook.
import { arr, num, obj, optNum, str, strList } from "../contract";
import { maxItems, minItems, nonNegative, sameLength, uniqueLabels } from "../integrity";
import { C, chartDefaults, formatCode, legendItem, niceMax } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface GroupedBarData {
  unit: string;
  dp: number;
  series: string[];
  categories: { label: string; values: number[] }[];
}

export const groupedBar: Renderer<GroupedBarData> = {
  id: "grouped-bar",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      series: strList(o.series, "data.series"),
      categories: arr(o.categories, "data.categories").map((x, i) => {
        const r = obj(x, `data.categories[${i}]`);
        return {
          label: str(r.label, `data.categories[${i}].label`),
          values: arr(r.values, `data.categories[${i}].values`).map((v, j) => num(v, `data.categories[${i}].values[${j}]`)),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...nonNegative(d.categories.flatMap((c) => c.values)),
      ...minItems(d.categories.length, 2, "categories"),
      ...maxItems(d.categories.length, 6, "categories"),
      ...uniqueLabels(d.categories.map((c) => c.label)),
      ...uniqueLabels(d.series, "series names"),
    ];
    if (d.series.length < 2 || d.series.length > 3) {
      issues.push({ rule: "series-count", message: `${d.series.length} series; grouped bars need 2 or 3` });
    }
    for (const c of d.categories) issues.push(...sameLength(c.values, d.series, `category ${c.label}`));
    return issues;
  },
  render(h, d) {
    const colours = [C.neutralDark, C.neutral, C.neutralLight];
    const legendH = 0.36;
    const area = { ...h.area, y: h.area.y + legendH, h: h.area.h - legendH };
    const max = niceMax(Math.max(...d.categories.flatMap((c) => c.values)) * 1.08);
    h.chart(
      "grouped-bars",
      h.charts.bar,
      d.series.map((name, s) => ({
        name,
        labels: d.categories.map((c) => c.label),
        values: d.categories.map((c) => c.values[s] ?? 0),
      })),
      chartDefaults(area, {
        barDir: "col",
        barGrouping: "clustered",
        barGapWidthPct: 60,
        barOverlapPct: -5,
        valAxisHidden: true,
        valAxisMinVal: 0,
        valAxisMaxVal: max,
        chartColors: colours.slice(0, d.series.length),
        showValue: true,
        dataLabelPosition: "outEnd",
        dataLabelFontSize: 11,
        dataLabelFormatCode: formatCode(d.dp),
        altText: `Grouped bar chart, ${d.unit}`,
      }),
    );
    let x = h.area.x;
    d.series.forEach((name, s) => {
      x = legendItem(h, `legend-${s}`, x, h.area.y, name, { fill: colours[s] }, 1.9);
    });
    h.text("unit", "axis", d.unit, {
      x: h.area.x + h.area.w - 3.2, y: h.area.y, w: 3.2, h: 0.26, fontSize: 10, color: C.muted, align: "right",
    });
  },
};
