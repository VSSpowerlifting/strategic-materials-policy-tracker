// C1 annotated-line — one time series with 1–3 dated event markers.
// Native line chart (embedded workbook) with a manual inner plot layout and an
// explicit value axis, so marker positions are deterministic. Markers and their
// labels are positioned native shapes, NOT bound to the chart data.
import { arr, bool, isoDate, num, obj, optNum, str } from "../contract";
import { datesAscending, maxItems, minItems, uniqueLabels, within } from "../integrity";
import { C, chartDefaults, fmt, formatCode, scale, vline } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface AnnotatedLineData {
  unit: string;
  dp: number;
  axisMin: number;
  axisMax: number;
  majorUnit: number;
  tickEvery: number;
  points: { date: string; value: number }[];
  events: { date: string; label: string; highlight: boolean }[];
}

const DAY = 86_400_000;
const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export const annotatedLine: Renderer<AnnotatedLineData> = {
  id: "annotated-line",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      axisMin: num(o.axisMin, "data.axisMin"),
      axisMax: num(o.axisMax, "data.axisMax"),
      majorUnit: num(o.majorUnit, "data.majorUnit"),
      tickEvery: optNum(o.tickEvery, "data.tickEvery") ?? 3,
      points: arr(o.points, "data.points").map((x, i) => {
        const r = obj(x, `data.points[${i}]`);
        return { date: isoDate(r.date, `data.points[${i}].date`), value: num(r.value, `data.points[${i}].value`) };
      }),
      events: arr(o.events, "data.events").map((x, i) => {
        const r = obj(x, `data.events[${i}]`);
        return {
          date: isoDate(r.date, `data.events[${i}].date`),
          label: str(r.label, `data.events[${i}].label`),
          highlight: r.highlight === undefined ? false : bool(r.highlight, `data.events[${i}].highlight`),
        };
      }),
    };
  },
  check(d) {
    const dates = d.points.map((p) => p.date);
    const issues: IntegrityIssue[] = [
      ...minItems(d.points.length, 8, "points"),
      ...maxItems(d.points.length, 24, "points"),
      ...datesAscending(dates, "series dates"),
      ...uniqueLabels(dates, "series dates"),
      ...within(d.points.map((p) => p.value), d.axisMin, d.axisMax, "series values"),
      ...datesAscending(d.events.map((e) => e.date), "event dates"),
    ];
    if (d.events.length < 1 || d.events.length > 3) {
      issues.push({ rule: "event-count", message: `${d.events.length} event markers; use 1 to 3` });
    }
    if (!(d.axisMax > d.axisMin) || !(d.majorUnit > 0)) {
      issues.push({ rule: "axis-range", message: "axisMax must exceed axisMin and majorUnit must be positive" });
    }
    if (dates.length > 0) {
      const first = dates[0];
      const last = dates[dates.length - 1];
      for (const e of d.events) {
        if (e.date < first || e.date > last) {
          issues.push({ rule: "event-in-range", message: `event ${e.date} lies outside the series span ${first} to ${last}` });
        }
      }
    }
    if (d.events.filter((e) => e.highlight).length > 1) {
      issues.push({ rule: "single-highlight", message: "highlight at most one event per chart" });
    }
    return issues;
  },
  render(h, d) {
    const a = h.area;
    const n = d.points.length;
    // Inner plot rectangle as fractions of the chart frame (manual layout, so geometry is known).
    const fx = 0.055;
    const fy = 0.2;
    const fw = 0.925;
    const fh = 0.64;
    const px = a.x + fx * a.w;
    const py = a.y + fy * a.h;
    const pw = fw * a.w;
    const ph = fh * a.h;
    const sy = scale(d.axisMin, d.axisMax, py + ph, py);

    h.chart(
      "series-line",
      h.charts.line,
      [{ name: d.unit, labels: d.points.map((p) => p.date.slice(0, 7)), values: d.points.map((p) => p.value) }],
      chartDefaults(a, {
        layout: { x: fx, y: fy, w: fw, h: fh },
        chartColors: [C.neutralDark],
        lineSize: 2.5,
        lineDataSymbol: "none",
        valAxisMinVal: d.axisMin,
        valAxisMaxVal: d.axisMax,
        valAxisMajorUnit: d.majorUnit,
        valAxisLabelFormatCode: formatCode(d.dp),
        valGridLine: { color: "E9E5DC", size: 0.5 },
        catAxisLabelFrequency: d.tickEvery,
        catAxisLabelFontSize: 10,
        altText: `Line chart with dated event markers, ${d.unit}`,
      }),
    );

    h.text("unit", "axis", d.unit, { x: a.x, y: a.y, w: 4, h: 0.24, fontSize: 10, color: C.muted });

    // Event markers: positioned by date, interpolated between the surrounding observations.
    const times = d.points.map((p) => t(p.date));
    const slot = pw / n;
    const xAt = (iso: string): number => {
      const ti = t(iso);
      let k = 0;
      while (k < n - 2 && times[k + 1] <= ti) k++;
      const span = Math.max(times[k + 1] - times[k], DAY);
      const frac = Math.min(Math.max((ti - times[k]) / span, 0), 1);
      return px + (k + frac + 0.5) * slot;
    };
    d.events.forEach((e, i) => {
      const x = xAt(e.date);
      const col = e.highlight ? C.accent : C.neutralDark;
      vline(h, `event-line-${i}`, "annot", x - 0.006, py - 0.12, ph + 0.12, col);
      const right = x + 0.08 + 2.3 > a.x + a.w;
      h.text(`event-label-${i}`, "annot", [
        { text: `${e.date}\n`, options: { bold: true, fontSize: 10, color: col } },
        { text: e.label, options: { fontSize: 11, color: C.ink } },
      ], {
        x: right ? x - 2.38 : x + 0.08, y: a.y + 0.02, w: 2.3, h: 0.62,
        align: right ? "right" : "left", valign: "top",
      });
    });

    // First, last and lowest observation labelled; positioned, not bound.
    const vals = d.points.map((q) => q.value);
    const lowAt = vals.indexOf(Math.min(...vals));
    const ends: [string, number, number][] = [
      ["first", 0, -0.3],
      ["last", n - 1, -0.3],
    ];
    if (lowAt > 0 && lowAt < n - 1) ends.push(["low", lowAt, 0.1]);
    for (const [tag, k, dy] of ends) {
      const v = d.points[k].value;
      h.text(`value-${tag}`, "label", fmt(v, d.dp), {
        x: px + (k + 0.5) * slot - 0.4, y: sy(v) + dy, w: 0.8, h: 0.24, fontSize: 11, bold: true, color: C.ink, align: "center",
      });
    }
  },
};
