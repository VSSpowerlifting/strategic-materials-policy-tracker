// G2 threshold-scatter — scatter with one or two reference thresholds that divide
// the plot into quadrants. Data-bound: the point cloud. Positioned, not bound:
// threshold hairlines, quadrant captions and point labels (computed from the
// fixture over a fixed inner plot layout).
import { num, obj, oneOf, optStr, str } from "../contract";
import { maxItems, minItems, uniqueLabels } from "../integrity";
import { C, chartDefaults } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";
import {
  type AxisSpec,
  type ScatterPoint,
  axisIssues,
  axisTitles,
  parseAxis,
  parsePoints,
  placeLabel,
  plotGeometry,
  splitSeries,
  xyAxisOptions,
} from "./scatter";

export interface Threshold {
  label: string;
  value: number;
  /** Which side of the threshold counts as a breach. */
  breach: "above" | "below";
}

export interface ThresholdScatterData {
  xAxis: AxisSpec;
  yAxis: AxisSpec;
  xThreshold?: Threshold;
  yThreshold?: Threshold;
  quadrants: { tl: string; tr: string; bl: string; br: string };
  points: ScatterPoint[];
}

function parseThreshold(x: unknown, path: string): Threshold | undefined {
  if (x === undefined || x === null) return undefined;
  const o = obj(x, path);
  return {
    label: str(o.label, `${path}.label`),
    value: num(o.value, `${path}.value`),
    breach: oneOf(optStr(o.breach, `${path}.breach`), ["above", "below"] as const, `${path}.breach`),
  };
}

/** A point is beyond the thresholds when it breaches every threshold supplied. */
export function isBeyond(p: { x: number; y: number }, xt?: Threshold, yt?: Threshold): boolean {
  const okX = xt ? (xt.breach === "above" ? p.x > xt.value : p.x < xt.value) : true;
  const okY = yt ? (yt.breach === "above" ? p.y > yt.value : p.y < yt.value) : true;
  return (xt !== undefined || yt !== undefined) && okX && okY;
}

export const thresholdScatter: Renderer<ThresholdScatterData> = {
  id: "threshold-scatter",
  parse(d) {
    const o = obj(d, "data");
    const q = obj(o.quadrants, "data.quadrants");
    return {
      xAxis: parseAxis(o.xAxis, "data.xAxis"),
      yAxis: parseAxis(o.yAxis, "data.yAxis"),
      xThreshold: parseThreshold(o.xThreshold, "data.xThreshold"),
      yThreshold: parseThreshold(o.yThreshold, "data.yThreshold"),
      quadrants: {
        tl: str(q.tl, "data.quadrants.tl"),
        tr: str(q.tr, "data.quadrants.tr"),
        bl: str(q.bl, "data.quadrants.bl"),
        br: str(q.br, "data.quadrants.br"),
      },
      points: parsePoints(o.points, "data.points"),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.points.length, 6, "points"),
      ...maxItems(d.points.length, 30, "points"),
      ...uniqueLabels(d.points.map((p) => p.label), "point labels"),
      ...axisIssues(d.xAxis, d.yAxis, d.points),
    ];
    if (!d.xThreshold && !d.yThreshold) issues.push({ rule: "threshold-present", message: "at least one threshold is required" });
    if (d.xThreshold && (d.xThreshold.value < d.xAxis.min || d.xThreshold.value > d.xAxis.max)) {
      issues.push({ rule: "threshold-within-axis", message: `x threshold ${d.xThreshold.value} is outside [${d.xAxis.min}, ${d.xAxis.max}]` });
    }
    if (d.yThreshold && (d.yThreshold.value < d.yAxis.min || d.yThreshold.value > d.yAxis.max)) {
      issues.push({ rule: "threshold-within-axis", message: `y threshold ${d.yThreshold.value} is outside [${d.yAxis.min}, ${d.yAxis.max}]` });
    }
    const named = d.points.filter((p) => p.named).length;
    if (named > 6) issues.push({ rule: "labelled-points-limit", message: `${named} labelled points exceed the legible maximum of 6` });
    return issues;
  },
  render(h, d) {
    const g = plotGeometry(h.area, d.xAxis, d.yAxis);
    const flagged = d.points.map((p) => ({ ...p, highlight: isBeyond(p, d.xThreshold, d.yThreshold) }));
    const { data, colors } = splitSeries(flagged, "Within thresholds", "Beyond threshold");
    h.chart(
      "threshold-scatter-plot",
      h.charts.scatter,
      data,
      chartDefaults(g.box, {
        ...xyAxisOptions(d.xAxis, d.yAxis, g),
        catGridLine: { style: "none" },
        valGridLine: { style: "none" },
        lineSize: 0,
        lineDataSymbol: "circle",
        lineDataSymbolSize: 9,
        lineDataSymbolLineSize: 0.75,
        lineDataSymbolLineColor: C.paper,
        chartColors: colors,
        altText: `Scatter chart with reference thresholds, ${d.points.length} points`,
      }),
    );
    axisTitles(h, d.xAxis, d.yAxis, g);

    const { plot } = g;
    const cap = { fontSize: 11, color: C.muted, italic: true, h: 0.26, w: 2.7 };
    h.text("quadrant-tl", "annot", d.quadrants.tl, { ...cap, x: plot.x + 0.08, y: plot.y + 0.04, align: "left" });
    h.text("quadrant-tr", "annot", d.quadrants.tr, { ...cap, x: plot.x + plot.w - cap.w - 0.08, y: plot.y + 0.04, align: "right" });
    h.text("quadrant-bl", "annot", d.quadrants.bl, { ...cap, x: plot.x + 0.08, y: plot.y + plot.h - 0.3, align: "left" });
    h.text("quadrant-br", "annot", d.quadrants.br, { ...cap, x: plot.x + plot.w - cap.w - 0.08, y: plot.y + plot.h - 0.3, align: "right" });

    const dash = { color: C.neutralDark, width: 1, dashType: "dash" };
    if (d.xThreshold) {
      const x = g.sx(d.xThreshold.value);
      h.line("threshold-x-line", "annot", { x, y: plot.y, w: 0, h: plot.h, line: dash });
      h.text("threshold-x-label", "annot", d.xThreshold.label, {
        x: x + 0.06, y: plot.y + 0.34, w: 1.9, h: 0.24, fontSize: 11, bold: true, color: C.neutralDark, align: "left",
      });
    }
    if (d.yThreshold) {
      const y = g.sy(d.yThreshold.value);
      h.line("threshold-y-line", "annot", { x: plot.x, y, w: plot.w, h: 0, line: dash });
      h.text("threshold-y-label", "annot", d.yThreshold.label, {
        x: plot.x + 0.08, y: y - 0.27, w: 1.9, h: 0.24, fontSize: 11, bold: true, color: C.neutralDark, align: "left",
      });
    }
    flagged.forEach((p, i) => {
      if (!p.named) return;
      placeLabel(h, `point-label-${i}`, p.label, g.sx(p.x), g.sy(p.y), 0.11, p.side, {
        color: p.highlight ? C.accent : C.ink, bold: p.highlight, w: 0.9,
      });
    });
  },
};
