// A1 ranked-bar — horizontal magnitude bars, sorted, zero baseline, one highlight.
import { arr, bool, num, obj, optNum, str } from "../contract";
import { maxItems, minItems, nonNegative, uniqueLabels } from "../integrity";
import { C, chartDefaults, formatCode } from "../primitives";
import type { Renderer } from "../types";

export interface RankedBarData {
  unit: string;
  dp: number;
  items: { label: string; value: number; highlight: boolean }[];
}

export const rankedBar: Renderer<RankedBarData> = {
  id: "ranked-bar",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      items: arr(o.items, "data.items").map((x, i) => {
        const r = obj(x, `data.items[${i}]`);
        return {
          label: str(r.label, `data.items[${i}].label`),
          value: num(r.value, `data.items[${i}].value`),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.items[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const issues = [
      ...nonNegative(d.items.map((i) => i.value)),
      ...minItems(d.items.length, 3, "bars"),
      ...maxItems(d.items.length, 12, "bars"),
      ...uniqueLabels(d.items.map((i) => i.label)),
    ];
    if (d.items.filter((i) => i.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "highlight at most one result per chart" });
    }
    return issues;
  },
  render(h, d) {
    const items = [...d.items].sort((a, b) => b.value - a.value);
    h.chart(
      "ranked-bars",
      h.charts.bar,
      [{ name: d.unit, labels: items.map((i) => i.label), values: items.map((i) => i.value) }],
      chartDefaults(h.area, {
        barDir: "bar",
        catAxisOrientation: "maxMin",
        valAxisHidden: true,
        valAxisMinVal: 0,
        barGapWidthPct: 55,
        chartColors: items.map((i) => (i.highlight ? C.accent : C.neutral)),
        showValue: true,
        dataLabelPosition: "outEnd",
        dataLabelFormatCode: formatCode(d.dp),
        altText: `Ranked bar chart, ${d.unit}`,
      }),
    );
  },
};
