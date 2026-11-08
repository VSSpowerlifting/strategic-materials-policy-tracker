// G1 scatter — two continuous measures per item as a native scatter chart.
// Data-bound: the point cloud (embedded workbook). Positioned, not bound: point
// labels, axis titles. The chart's inner plot area is fixed by a manual layout
// so those positioned labels can be computed from the fixture.
import { arr, bool, num, obj, oneOf, optStr, str } from "../contract";
import { maxItems, minItems, uniqueLabels, within } from "../integrity";
import { C, chartDefaults, scale } from "../primitives";
import type { Area, IntegrityIssue, RenderHelpers, Renderer } from "../types";

export interface AxisSpec {
  label: string;
  min: number;
  max: number;
  step: number;
  dp: number;
}

export type Side = "r" | "l" | "t" | "b";

export interface ScatterPoint {
  label: string;
  x: number;
  y: number;
  /** Draw a positioned text label beside the point. */
  named: boolean;
  side: Side;
  highlight: boolean;
}

export interface ScatterData {
  xAxis: AxisSpec;
  yAxis: AxisSpec;
  points: ScatterPoint[];
}

export function parseAxis(x: unknown, path: string): AxisSpec {
  const o = obj(x, path);
  return {
    label: str(o.label, `${path}.label`),
    min: num(o.min, `${path}.min`),
    max: num(o.max, `${path}.max`),
    step: num(o.step, `${path}.step`),
    dp: o.dp === undefined ? 0 : num(o.dp, `${path}.dp`),
  };
}

export function parsePoints(x: unknown, path: string): ScatterPoint[] {
  return arr(x, path).map((p, i) => {
    const r = obj(p, `${path}[${i}]`);
    return {
      label: str(r.label, `${path}[${i}].label`),
      x: num(r.x, `${path}[${i}].x`),
      y: num(r.y, `${path}[${i}].y`),
      named: r.named === undefined ? false : bool(r.named, `${path}[${i}].named`),
      side: r.side === undefined ? "r" : oneOf(optStr(r.side, `${path}[${i}].side`), ["r", "l", "t", "b"] as const, `${path}[${i}].side`),
      highlight: r.highlight === undefined ? false : bool(r.highlight, `${path}[${i}].highlight`),
    };
  });
}

export function axisIssues(x: AxisSpec, y: AxisSpec, pts: { x: number; y: number }[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  for (const a of [x, y]) {
    if (!(a.max > a.min) || !(a.step > 0)) issues.push({ rule: "axis-explicit", message: `axis "${a.label}" needs max > min and step > 0` });
  }
  issues.push(...within(pts.map((p) => p.x), x.min, x.max, "x values"), ...within(pts.map((p) => p.y), y.min, y.max, "y values"));
  return issues;
}

export interface PlotGeometry {
  /** Chart frame passed to the native chart. */
  box: Area;
  /** Inner plot rectangle, inches. */
  plot: Area;
  /** Manual inner layout, fractions of the chart frame. */
  layout: { x: number; y: number; w: number; h: number };
  sx: (v: number) => number;
  sy: (v: number) => number;
}

/** Fixes the chart's inner plot area so overlays can be positioned from data. */
export function plotGeometry(area: Area, xAxis: AxisSpec, yAxis: AxisSpec, opts: { top?: number; bottom?: number } = {}): PlotGeometry {
  const top = opts.top ?? 0.3;
  const bottom = opts.bottom ?? 0.3;
  const box: Area = { x: area.x, y: area.y + top, w: area.w, h: area.h - top - bottom };
  const left = 0.55;
  const right = 0.2;
  const padTop = 0.1;
  const padBottom = 0.36;
  const plot: Area = { x: box.x + left, y: box.y + padTop, w: box.w - left - right, h: box.h - padTop - padBottom };
  return {
    box,
    plot,
    layout: { x: left / box.w, y: padTop / box.h, w: plot.w / box.w, h: plot.h / box.h },
    sx: scale(xAxis.min, xAxis.max, plot.x, plot.x + plot.w),
    sy: scale(yAxis.min, yAxis.max, plot.y + plot.h, plot.y),
  };
}

/** Native axis options shared by the XY families. */
export function xyAxisOptions(xAxis: AxisSpec, yAxis: AxisSpec, g: PlotGeometry): Record<string, unknown> {
  return {
    layout: g.layout,
    catAxisMinVal: xAxis.min,
    catAxisMaxVal: xAxis.max,
    catAxisMajorUnit: xAxis.step,
    valAxisMinVal: yAxis.min,
    valAxisMaxVal: yAxis.max,
    valAxisMajorUnit: yAxis.step,
    valAxisHidden: false,
    catAxisLineShow: true,
    valAxisLineShow: true,
    valAxisLineColor: C.border,
    catAxisLabelFontSize: 11,
    catAxisLabelColor: C.muted,
    valAxisLabelFontSize: 11,
    valAxisLabelFormatCode: yAxis.dp > 0 ? `#,##0.${"0".repeat(yAxis.dp)}` : "#,##0",
    catGridLine: { color: C.soft, size: 0.5, style: "solid" },
    valGridLine: { color: C.soft, size: 0.5, style: "solid" },
    plotArea: { fill: { color: C.paper } },
  };
}

export function axisTitles(h: RenderHelpers, xAxis: AxisSpec, yAxis: AxisSpec, g: PlotGeometry): void {
  h.text("axis-title-y", "axis", `${yAxis.label} (vertical)`, {
    x: h.area.x, y: h.area.y, w: h.area.w, h: 0.26, fontSize: 11, color: C.muted,
  });
  h.text("axis-title-x", "axis", `${xAxis.label} (horizontal)`, {
    x: g.plot.x, y: h.area.y + h.area.h - 0.27, w: g.plot.w, h: 0.26, fontSize: 11, color: C.muted, align: "right",
  });
}

/** Positioned label beside a mark. `gap` is the clearance from the mark centre. */
export function placeLabel(
  h: RenderHelpers,
  name: string,
  text: string,
  cx: number,
  cy: number,
  gap: number,
  side: Side,
  opts: { color?: string; bold?: boolean; w?: number } = {},
): void {
  const w = opts.w ?? 1.3;
  const hh = 0.24;
  const pos =
    side === "r" ? { x: cx + gap, y: cy - hh / 2, align: "left" }
    : side === "l" ? { x: cx - gap - w, y: cy - hh / 2, align: "right" }
    : side === "t" ? { x: cx - w / 2, y: cy - gap - hh, align: "center" }
    : { x: cx - w / 2, y: cy + gap, align: "center" };
  h.text(name, "label", text, {
    x: pos.x, y: pos.y, w, h: hh, fontSize: 11, color: opts.color ?? C.ink, bold: opts.bold ?? false, align: pos.align, valign: "middle",
  });
}

/** Two-series split (neutral / accent) over one shared X column; blanks are NaN (written as empty cells). */
export function splitSeries(
  points: { x: number; y: number; highlight: boolean }[],
  neutralName: string,
  accentName: string,
): { data: { name: string; values: number[] }[]; colors: string[] } {
  const xs = points.map((p) => p.x);
  const base = { name: neutralName, values: points.map((p) => (p.highlight ? Number.NaN : p.y)) };
  const hi = points.some((p) => p.highlight);
  const data = [{ name: "X", values: xs }, base];
  const colors: string[] = [C.neutral];
  if (hi) {
    data.push({ name: accentName, values: points.map((p) => (p.highlight ? p.y : Number.NaN)) });
    colors.push(C.accent);
  }
  return { data, colors };
}

export const scatter: Renderer<ScatterData> = {
  id: "scatter",
  parse(d) {
    const o = obj(d, "data");
    return { xAxis: parseAxis(o.xAxis, "data.xAxis"), yAxis: parseAxis(o.yAxis, "data.yAxis"), points: parsePoints(o.points, "data.points") };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.points.length, 6, "points"),
      ...maxItems(d.points.length, 30, "points"),
      ...uniqueLabels(d.points.map((p) => p.label), "point labels"),
      ...axisIssues(d.xAxis, d.yAxis, d.points),
    ];
    const named = d.points.filter((p) => p.named || p.highlight).length;
    if (named > 6) issues.push({ rule: "labelled-points-limit", message: `${named} labelled points exceed the legible maximum of 6` });
    if (d.points.filter((p) => p.highlight).length > 1) issues.push({ rule: "single-accent", message: "at most one point may carry the accent" });
    return issues;
  },
  render(h, d) {
    const g = plotGeometry(h.area, d.xAxis, d.yAxis);
    const { data, colors } = splitSeries(d.points, "Sites", "Highlighted site");
    h.chart(
      "scatter-plot",
      h.charts.scatter,
      data,
      chartDefaults(g.box, {
        ...xyAxisOptions(d.xAxis, d.yAxis, g),
        lineSize: 0,
        lineDataSymbol: "circle",
        lineDataSymbolSize: 9,
        lineDataSymbolLineSize: 0.75,
        lineDataSymbolLineColor: C.paper,
        chartColors: colors,
        altText: `Scatter chart of ${d.yAxis.label} against ${d.xAxis.label}, ${d.points.length} points`,
      }),
    );
    axisTitles(h, d.xAxis, d.yAxis, g);
    d.points.forEach((p, i) => {
      if (!p.named && !p.highlight) return;
      placeLabel(h, `point-label-${i}`, p.label, g.sx(p.x), g.sy(p.y), 0.11, p.side, {
        color: p.highlight ? C.accent : C.ink,
        bold: p.highlight,
        w: 0.9,
      });
    });
  },
};
