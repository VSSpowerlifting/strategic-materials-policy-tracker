// C3 indexed-lines — 2–4 series rebased to 100 at a stated base period.
// Native line chart (embedded workbook holds the computed index). The raw
// values and the base period live in the fixture; the renderer computes the
// index. End labels and the base-100 reference are positioned, not bound.
import { arr, bool, num, obj, optNum, str, strList } from "../contract";
import { maxItems, minItems, sameLength, uniqueLabels } from "../integrity";
import { C, chartDefaults, fmt, formatCode, hairline, scale } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";
import { spread } from "./slope";

export interface IndexedLinesData {
  /** What the raw values are, e.g. "Output, units". */
  rawUnit: string;
  periods: string[];
  baseIndex: number;
  series: { name: string; values: number[]; highlight: boolean }[];
}

const idx = (v: number, base: number) => Math.round((v / base) * 1000) / 10;

export const indexedLines: Renderer<IndexedLinesData> = {
  id: "indexed-lines",
  parse(d) {
    const o = obj(d, "data");
    return {
      rawUnit: str(o.rawUnit, "data.rawUnit"),
      periods: strList(o.periods, "data.periods"),
      baseIndex: optNum(o.baseIndex, "data.baseIndex") ?? 0,
      series: arr(o.series, "data.series").map((x, i) => {
        const r = obj(x, `data.series[${i}]`);
        return {
          name: str(r.name, `data.series[${i}].name`),
          values: arr(r.values, `data.series[${i}].values`).map((v, j) => num(v, `data.series[${i}].values[${j}]`)),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.series[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.periods.length, 6, "periods"),
      ...maxItems(d.periods.length, 24, "periods"),
      ...uniqueLabels(d.periods, "periods"),
      ...uniqueLabels(d.series.map((s) => s.name), "series names"),
    ];
    if (d.series.length < 2 || d.series.length > 4) {
      issues.push({ rule: "series-count", message: `${d.series.length} series; indexed lines need 2 to 4` });
    }
    if (!Number.isInteger(d.baseIndex) || d.baseIndex < 0 || d.baseIndex >= d.periods.length) {
      issues.push({ rule: "base-period-valid", message: `base period index ${d.baseIndex} is outside the ${d.periods.length} periods` });
    }
    for (const s of d.series) {
      issues.push(...sameLength(s.values, d.periods, `series ${s.name}`));
      if (s.values.some((v) => !(v > 0))) {
        issues.push({ rule: "base-positive", message: `series ${s.name} has a non-positive raw value; an index to base 100 needs positive values` });
      }
    }
    if (d.series.filter((s) => s.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "highlight at most one series per chart" });
    }
    return issues;
  },
  render(h, d) {
    const a = h.area;
    const base = d.periods[d.baseIndex];
    const indexed = d.series.map((s) => ({
      ...s,
      index: s.values.map((v) => idx(v, s.values[d.baseIndex])),
    }));
    const all = indexed.flatMap((s) => s.index);
    const axisMin = Math.floor(Math.min(...all, 100) / 20) * 20;
    const axisMax = Math.ceil(Math.max(...all, 100) / 20) * 20;
    const major = 20;

    const capH = 0.3;
    const chartArea = { x: a.x, y: a.y + capH, w: a.w, h: a.h - capH };
    const labelGutter = 2.1;
    const fx = 0.06;
    const fy = 0.04;
    const fw = (a.w - labelGutter) / a.w - fx;
    const fh = 0.84;
    const px = chartArea.x + fx * chartArea.w;
    const py = chartArea.y + fy * chartArea.h;
    const pw = fw * chartArea.w;
    const ph = fh * chartArea.h;
    const sy = scale(axisMin, axisMax, py + ph, py);

    const colours = indexed.map((s, i) => (s.highlight ? C.accent : [C.neutralDark, C.neutral, C.muted, C.neutralLight][i % 4]));
    h.chart(
      "indexed-lines",
      h.charts.line,
      indexed.map((s) => ({ name: s.name, labels: d.periods, values: s.index })),
      chartDefaults(chartArea, {
        layout: { x: fx, y: fy, w: fw, h: fh },
        chartColors: colours,
        lineSize: 2.5,
        lineDataSymbol: "none",
        valAxisMinVal: axisMin,
        valAxisMaxVal: axisMax,
        valAxisMajorUnit: major,
        valAxisLabelFormatCode: formatCode(0),
        valGridLine: { color: "E9E5DC", size: 0.5 },
        catAxisLabelFrequency: 2,
        catAxisLabelFontSize: 11,
        altText: `Indexed line chart, base = 100 at ${base}`,
      }),
    );

    h.text("axis-caption", "axis", `Index, base = 100 at ${base}`, {
      x: a.x, y: a.y, w: 4.5, h: 0.26, fontSize: 11, bold: true, color: C.ink,
    });
    h.text("raw-caption", "axis", `Computed from raw ${d.rawUnit}`, {
      x: a.x + a.w - 4, y: a.y, w: 4, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });
    // Base-100 reference line, positioned at the index value 100.
    hairline(h, "base-100-line", "annot", px, sy(100) - 0.006, pw, C.neutral);

    const ends = spread(indexed.map((s) => sy(s.index[s.index.length - 1])), 0.32, py, py + ph);
    indexed.forEach((s, i) => {
      const last = s.index[s.index.length - 1];
      h.text(`end-label-${i}`, "label", [
        { text: fmt(last, 1), options: { bold: true } },
        { text: `  ${s.name}`, options: { bold: s.highlight } },
      ], {
        x: px + pw + 0.1, y: ends[i] - 0.15, w: labelGutter - 0.1, h: 0.3, fontSize: 11,
        color: s.highlight ? C.accent : C.ink, valign: "middle",
      });
    });
  },
};
