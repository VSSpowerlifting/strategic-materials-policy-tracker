// H3 histogram — contiguous, equal-width bins as a native column chart with a
// small gap. Data-bound: bin counts (embedded workbook). Positioned, not bound:
// bin-edge labels, the optional reference line and axis titles, computed over a
// fixed inner plot layout.
import { arr, num, obj, optNum, str } from "../contract";
import { binsContiguous, maxItems, minItems, nonNegative } from "../integrity";
import { C, chartDefaults, fmt, niceMax, scale } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";
import { axisTitles, plotGeometry } from "./scatter";

export interface HistogramData {
  /** What is binned, with unit (x axis). */
  measure: string;
  /** What is counted (y axis). */
  countLabel: string;
  dp: number;
  bins: { from: number; to: number; count: number }[];
  reference?: { label: string; value: number };
}

export const histogram: Renderer<HistogramData> = {
  id: "histogram",
  parse(d) {
    const o = obj(d, "data");
    const ref = o.reference === undefined || o.reference === null ? undefined : obj(o.reference, "data.reference");
    return {
      measure: str(o.measure, "data.measure"),
      countLabel: str(o.countLabel, "data.countLabel"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      bins: arr(o.bins, "data.bins").map((b, i) => {
        const r = obj(b, `data.bins[${i}]`);
        return { from: num(r.from, `data.bins[${i}].from`), to: num(r.to, `data.bins[${i}].to`), count: num(r.count, `data.bins[${i}].count`) };
      }),
      reference: ref ? { label: str(ref.label, "data.reference.label"), value: num(ref.value, "data.reference.value") } : undefined,
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...binsContiguous(d.bins),
      ...minItems(d.bins.length, 5, "bins"),
      ...maxItems(d.bins.length, 16, "bins"),
      ...nonNegative(d.bins.map((b) => b.count), "counts-nonnegative"),
    ];
    if (d.bins.some((b) => !Number.isInteger(b.count))) issues.push({ rule: "counts-whole", message: "bin counts must be whole numbers" });
    const w = d.bins[0].to - d.bins[0].from;
    if (d.bins.some((b) => Math.abs(b.to - b.from - w) > 1e-9)) {
      issues.push({ rule: "bins-equal-width", message: "bins must share one width so column area equals frequency" });
    }
    if (d.reference) {
      const lo = d.bins[0].from;
      const hi = d.bins[d.bins.length - 1].to;
      if (d.reference.value < lo || d.reference.value > hi) {
        issues.push({ rule: "threshold-within-axis", message: `reference ${d.reference.value} is outside [${lo}, ${hi}]` });
      }
    }
    return issues;
  },
  render(h, d) {
    const lo = d.bins[0].from;
    const hi = d.bins[d.bins.length - 1].to;
    const width = d.bins[0].to - d.bins[0].from;
    const yMax = niceMax(Math.max(...d.bins.map((b) => b.count)) * 1.12);
    const xAxis = { label: `${d.measure}; bin width ${fmt(width, d.dp)}, lower edge inclusive`, min: lo, max: hi, step: width, dp: d.dp };
    const yAxis = { label: d.countLabel, min: 0, max: yMax, step: yMax / 4, dp: 0 };
    const g = plotGeometry(h.area, xAxis, yAxis);
    h.chart(
      "histogram-bins",
      h.charts.bar,
      [{ name: d.countLabel, labels: d.bins.map((b) => `${fmt(b.from, d.dp)}–${fmt(b.to, d.dp)}`), values: d.bins.map((b) => b.count) }],
      chartDefaults(g.box, {
        layout: g.layout,
        barDir: "col",
        barGapWidthPct: 6,
        chartColors: [C.neutral],
        catAxisLabelPos: "none",
        valAxisHidden: true,
        valAxisMinVal: 0,
        valAxisMaxVal: yMax,
        showValue: true,
        dataLabelPosition: "outEnd",
        dataLabelFontSize: 11,
        dataLabelFormatCode: "#,##0",
        altText: `Histogram of ${d.measure}, ${d.bins.length} bins of width ${width}`,
      }),
    );
    axisTitles(h, xAxis, yAxis, g);

    const n = d.bins.length;
    const edgeX = scale(0, n, g.plot.x, g.plot.x + g.plot.w);
    for (let i = 0; i <= n; i++) {
      const v = i === n ? d.bins[n - 1].to : d.bins[i].from;
      h.text(`edge-label-${i}`, "axis", fmt(v, d.dp), {
        x: edgeX(i) - 0.35, y: g.plot.y + g.plot.h + 0.05, w: 0.7, h: 0.24, fontSize: 11, color: C.muted, align: "center",
      });
    }
    if (d.reference) {
      const x = g.sx(d.reference.value);
      h.line("reference-line", "annot", { x, y: g.plot.y, w: 0, h: g.plot.h, line: { color: C.accent, width: 1.5, dashType: "dash" } });
      h.text("reference-label", "annot", d.reference.label, {
        x: x + 0.08, y: g.plot.y + 0.02, w: 1.9, h: 0.26, fontSize: 11, bold: true, color: C.accent, align: "left",
      });
    }
  },
};
