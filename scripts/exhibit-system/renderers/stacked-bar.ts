// D1 stacked-bar — absolute composition of a few totals, one additive measure.
// Native horizontal stacked bar chart (data-bound segments). Segment labels are
// native and hidden by a number-format condition where a segment is narrow;
// the total at each bar end is positioned text (not data-bound).
import { arr, num, obj, oneOf, optNum, optStr, str } from "../contract";
import { maxItems, minItems, nonNegative, sameLength, uniqueLabels } from "../integrity";
import { C, chartDefaults, fmt, legendItem } from "../primitives";
import type { Renderer } from "../types";

export interface StackedBarData {
  unit: string;
  dp: number;
  components: string[];
  /** Name of the single highlighted component (optional). */
  accent?: string;
  rows: { label: string; values: number[] }[];
}

/** Light-to-mid neutrals keep ink segment labels legible; the accent component uses gold. */
const NEUTRALS = [C.soft, C.neutralLight, C.neutral, C.neutralDark];

export const stackedBar: Renderer<StackedBarData> = {
  id: "stacked-bar",
  parse(d) {
    const o = obj(d, "data");
    const components = arr(o.components, "data.components").map((c, i) => str(c, `data.components[${i}]`));
    const accent = optStr(o.accent, "data.accent");
    if (accent !== undefined) oneOf(accent, components, "data.accent");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      components,
      accent,
      rows: arr(o.rows, "data.rows").map((x, i) => {
        const r = obj(x, `data.rows[${i}]`);
        return {
          label: str(r.label, `data.rows[${i}].label`),
          values: arr(r.values, `data.rows[${i}].values`).map((v, j) => num(v, `data.rows[${i}].values[${j}]`)),
        };
      }),
    };
  },
  check(d) {
    return [
      ...minItems(d.rows.length, 3, "bars"),
      ...maxItems(d.rows.length, 6, "bars"),
      ...minItems(d.components.length, 2, "components"),
      ...maxItems(d.components.length, 4, "components"),
      ...uniqueLabels(d.rows.map((r) => r.label)),
      ...uniqueLabels(d.components, "components"),
      ...d.rows.flatMap((r) => sameLength(r.values, d.components, `row "${r.label}" values vs components`)),
      ...nonNegative(d.rows.flatMap((r) => r.values)),
    ];
  },
  render(h, d) {
    const rows = d.rows
      .map((r) => ({ ...r, total: r.values.reduce((s, v) => s + v, 0) }))
      .sort((a, b) => b.total - a.total);
    const n = rows.length;
    const maxTotal = Math.max(...rows.map((r) => r.total));
    const axisMax = maxTotal * 1.14;
    const hideBelow = Math.round(axisMax * 0.07 * 10 ** d.dp) / 10 ** d.dp;
    const anyHidden = rows.some((r) => r.values.some((v) => v > 0 && v < hideBelow));

    // Colours: neutrals in order, gold for the single accent component.
    let ni = 0;
    const colors = d.components.map((c) => (c === d.accent ? C.accent : NEUTRALS[ni++]));

    let lx = h.area.x;
    d.components.forEach((c, i) => {
      lx = legendItem(h, `legend-${i}`, lx, h.area.y, c, { fill: colors[i], line: C.neutralDark }, 1.55);
    });
    h.text("unit", "axis", d.unit, {
      x: h.area.x + h.area.w - 2.4, y: h.area.y, w: 2.4, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    const box = { x: h.area.x, y: h.area.y + 0.4, w: h.area.w, h: h.area.h - 0.4 - (anyHidden ? 0.34 : 0.05) };
    const lay = { x: 1.55 / box.w, y: 0.02, w: 1 - 1.6 / box.w, h: 0.96 };
    h.chart(
      "stacked-bars",
      h.charts.bar,
      d.components.map((c, j) => ({ name: c, labels: rows.map((r) => r.label), values: rows.map((r) => r.values[j]) })),
      chartDefaults(box, {
        barDir: "bar",
        barGrouping: "stacked",
        barOverlapPct: 100,
        barGapWidthPct: 38,
        catAxisOrientation: "maxMin",
        valAxisHidden: true,
        valAxisMinVal: 0,
        valAxisMaxVal: axisMax,
        layout: lay,
        chartColors: colors,
        dataBorder: { pt: 1, color: C.paper },
        showValue: true,
        dataLabelPosition: "ctr",
        dataLabelFontSize: 11,
        dataLabelColor: C.ink,
        dataLabelFormatCode: `[<${hideBelow}]"";#,##0${d.dp > 0 ? "." + "0".repeat(d.dp) : ""}`,
        altText: `Stacked bar chart of ${d.components.join(", ")}, ${d.unit}`,
      }),
    );

    // Positioned totals at each bar end (geometry derived from the explicit axis range and plot layout).
    const px0 = box.x + lay.x * box.w;
    const pw = lay.w * box.w;
    const py0 = box.y + lay.y * box.h;
    const rowH = (lay.h * box.h) / n;
    rows.forEach((r, i) => {
      h.text(`total-${i}`, "label", fmt(r.total, d.dp), {
        x: px0 + (r.total / axisMax) * pw + 0.08, y: py0 + rowH * (i + 0.5) - 0.14, w: 0.8, h: 0.28,
        fontSize: 11, bold: true, color: C.ink, valign: "middle",
      });
    });
    if (anyHidden) {
      h.text("label-note", "axis", `Segment labels omitted below ${fmt(hideBelow, d.dp)}; bar-end figure is the row total.`, {
        x: h.area.x, y: h.area.y + h.area.h - 0.28, w: h.area.w, h: 0.26, fontSize: 11, color: C.muted,
      });
    }
  },
};
