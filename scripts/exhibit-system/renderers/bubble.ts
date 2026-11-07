// G3 bubble — a third measure encoded as bubble area on a scatter plane.
// Data-bound: x, y and size (native bubble chart, embedded workbook).
// Positioned, not bound: bubble labels, axis titles and the size legend, whose
// reference circles are drawn shapes sized with PowerPoint's default bubble
// scale (largest bubble diameter = 25% of the shorter plot side, area-proportional).
import { arr, bool, num, obj, str } from "../contract";
import { maxItems, minItems, uniqueLabels, within } from "../integrity";
import { C, chartDefaults, fmt } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";
import { type AxisSpec, axisIssues, axisTitles, parseAxis, placeLabel, plotGeometry, xyAxisOptions } from "./scatter";

export interface Bubble {
  label: string;
  x: number;
  y: number;
  size: number;
  highlight: boolean;
}

export interface BubbleData {
  xAxis: AxisSpec;
  yAxis: AxisSpec;
  sizeLabel: string;
  sizeUnit: string;
  /** Two reference sizes drawn in the legend. */
  legendSizes: number[];
  bubbles: Bubble[];
}

const LEGEND_W = 1.8;

export const bubble: Renderer<BubbleData> = {
  id: "bubble",
  parse(d) {
    const o = obj(d, "data");
    return {
      xAxis: parseAxis(o.xAxis, "data.xAxis"),
      yAxis: parseAxis(o.yAxis, "data.yAxis"),
      sizeLabel: str(o.sizeLabel, "data.sizeLabel"),
      sizeUnit: str(o.sizeUnit, "data.sizeUnit"),
      legendSizes: arr(o.legendSizes, "data.legendSizes", 2).map((v, i) => num(v, `data.legendSizes[${i}]`)),
      bubbles: arr(o.bubbles, "data.bubbles").map((b, i) => {
        const r = obj(b, `data.bubbles[${i}]`);
        return {
          label: str(r.label, `data.bubbles[${i}].label`),
          x: num(r.x, `data.bubbles[${i}].x`),
          y: num(r.y, `data.bubbles[${i}].y`),
          size: num(r.size, `data.bubbles[${i}].size`),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.bubbles[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.bubbles.length, 3, "bubbles"),
      ...maxItems(d.bubbles.length, 12, "bubbles"),
      ...uniqueLabels(d.bubbles.map((b) => b.label), "bubble labels"),
      ...axisIssues(d.xAxis, d.yAxis, d.bubbles),
    ];
    const sizes = [...d.bubbles.map((b) => b.size), ...d.legendSizes];
    if (sizes.some((s) => !(s > 0))) issues.push({ rule: "sizes-positive", message: "every bubble size and legend size must be greater than zero" });
    const max = Math.max(...d.bubbles.map((b) => b.size));
    issues.push(...within(d.legendSizes, 0, max, "legend sizes (must not exceed the largest bubble)"));
    if (d.legendSizes.length !== 2) issues.push({ rule: "size-legend-two", message: "the size legend needs exactly two reference sizes" });
    if (d.bubbles.filter((b) => b.highlight).length > 1) issues.push({ rule: "single-accent", message: "at most one bubble may carry the accent" });
    return issues;
  },
  render(h, d) {
    const chartArea = { ...h.area, w: h.area.w - LEGEND_W };
    const g = plotGeometry(chartArea, d.xAxis, d.yAxis);
    const hi = d.bubbles.some((b) => b.highlight);
    const nan = Number.NaN;
    const data = [
      { name: "X", values: d.bubbles.map((b) => b.x) },
      {
        name: "Projects",
        values: d.bubbles.map((b) => (b.highlight ? nan : b.y)),
        sizes: d.bubbles.map((b) => (b.highlight ? nan : b.size)),
      },
      ...(hi
        ? [{
            name: "Highlighted project",
            values: d.bubbles.map((b) => (b.highlight ? b.y : nan)),
            sizes: d.bubbles.map((b) => (b.highlight ? b.size : nan)),
          }]
        : []),
    ];
    h.chart(
      "bubble-plot",
      h.charts.bubble,
      data,
      chartDefaults(g.box, {
        ...xyAxisOptions(d.xAxis, d.yAxis, g),
        chartColors: hi ? [C.neutral, C.accent] : [C.neutral],
        chartColorsOpacity: 70,
        dataBorder: { pt: 0.75, color: C.neutralDark },
        altText: `Bubble chart: ${d.yAxis.label} against ${d.xAxis.label}, bubble area shows ${d.sizeLabel}`,
      }),
    );
    axisTitles(h, d.xAxis, d.yAxis, g);

    const maxSize = Math.max(...d.bubbles.map((b) => b.size));
    const maxDiam = 0.25 * Math.min(g.plot.w, g.plot.h);
    const diam = (s: number) => maxDiam * Math.sqrt(s / maxSize);
    d.bubbles.forEach((b, i) => {
      placeLabel(h, `bubble-label-${i}`, b.label, g.sx(b.x), g.sy(b.y), diam(b.size) / 2 + 0.05, "r", {
        color: b.highlight ? C.accent : C.ink, bold: b.highlight, w: 0.9,
      });
    });

    // Size legend: two reference circles, right column.
    const lx = h.area.x + h.area.w - LEGEND_W + 0.1;
    h.text("size-legend-title", "legend", `Bubble area: ${d.sizeLabel}`, {
      x: lx, y: g.plot.y, w: LEGEND_W - 0.1, h: 0.5, fontSize: 10, bold: true, color: C.ink, valign: "top",
    });
    const refs = [...d.legendSizes].sort((a, b) => a - b);
    let cy = g.plot.y + 0.7;
    refs.forEach((s, i) => {
      const dm = diam(s);
      cy += i === 0 ? 0 : diam(refs[0]) / 2 + 0.2 + dm / 2;
      h.shape(`size-legend-circle-${i}`, "legend", h.shapes.ellipse, {
        x: lx, y: cy - dm / 2, w: dm, h: dm,
        fill: { color: C.neutral, transparency: 70 }, line: { color: C.neutralDark, width: 0.75 },
      });
      h.text(`size-legend-value-${i}`, "legend", `${fmt(s, 0)} ${d.sizeUnit}`, {
        x: lx + dm + 0.08, y: cy - 0.13, w: LEGEND_W - dm - 0.2, h: 0.26, fontSize: 10, color: C.ink, valign: "middle",
      });
    });
    const noteY = cy + diam(refs[refs.length - 1]) / 2 + 0.2;
    h.text("size-legend-note", "legend", "Legend circles are drawn shapes, approximate to the chart scale.", {
      x: lx, y: noteY, w: LEGEND_W - 0.1, h: 0.7, fontSize: 9, color: C.muted, valign: "top",
    });
  },
};
