// F1 tornado — one-at-a-time sensitivity of a model output around its base case.
// Native stacked bar of deviations from the base (data-bound); the outcome
// values at bar ends, the base-case label and the model-output tag are
// positioned shapes/text (not data-bound).
import { arr, num, obj, optStr, str } from "../contract";
import { maxItems, minItems, ordered, uniqueLabels } from "../integrity";
import { C, chartDefaults, fmt, legendItem, niceMax } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface TornadoData {
  /** Measure, unit and "model output" qualifier. */
  unit: string;
  dp: number;
  baseLabel: string;
  base: number;
  /** Optional wording for the below-base / above-base legend. */
  lowLabel?: string;
  highLabel?: string;
  drivers: { label: string; low: number; high: number }[];
}

export const tornado: Renderer<TornadoData> = {
  id: "tornado",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: Math.max(0, Math.round(o.dp === undefined ? 0 : num(o.dp, "data.dp"))),
      baseLabel: str(o.baseLabel, "data.baseLabel"),
      base: num(o.base, "data.base"),
      lowLabel: optStr(o.lowLabel, "data.lowLabel"),
      highLabel: optStr(o.highLabel, "data.highLabel"),
      drivers: arr(o.drivers, "data.drivers").map((x, i) => {
        const r = obj(x, `data.drivers[${i}]`);
        return {
          label: str(r.label, `data.drivers[${i}].label`),
          low: num(r.low, `data.drivers[${i}].low`),
          high: num(r.high, `data.drivers[${i}].high`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.drivers.length, 3, "drivers"),
      ...maxItems(d.drivers.length, 8, "drivers"),
      ...uniqueLabels(d.drivers.map((x) => x.label), "drivers"),
    ];
    for (const x of d.drivers) {
      // Outcomes are the model's minimum and maximum for that driver: low ≤ base ≤ high.
      issues.push(...ordered(x.low, d.base, x.high, `driver "${x.label}"`));
    }
    return issues;
  },
  render(h, d) {
    const drivers = [...d.drivers].sort((a, b) => b.high - b.low - (a.high - a.low));
    const n = drivers.length;
    const maxDev = Math.max(...drivers.flatMap((x) => [d.base - x.low, x.high - d.base]));
    const M = niceMax(maxDev * 1.45);

    let lx = h.area.x;
    lx = legendItem(h, "legend-low", lx, h.area.y, d.lowLabel ?? "Outcome below base", { fill: C.neutralLight, line: C.neutralDark }, 2.1);
    legendItem(h, "legend-high", lx, h.area.y, d.highLabel ?? "Outcome above base", { fill: C.neutral }, 2.0);
    h.shape("model-tag-box", "annot", h.shapes.rect, {
      x: h.area.x + h.area.w - 2.75, y: h.area.y - 0.01, w: 2.75, h: 0.28,
      fill: { color: C.paper, transparency: 100 }, line: { color: C.neutralDark, width: 0.75, dashType: "dash" },
    });
    h.text("model-tag", "annot", "MODEL OUTPUT — illustrative", {
      x: h.area.x + h.area.w - 2.75, y: h.area.y - 0.01, w: 2.75, h: 0.28, fontSize: 10, bold: true, color: C.neutralDark, align: "center", valign: "middle", charSpacing: 1,
    });

    const top = 0.78;
    const box = { x: h.area.x, y: h.area.y + top, w: h.area.w, h: h.area.h - top - 0.02 };
    const lay = { x: 2.7 / box.w, y: 0.02, w: 1 - 2.8 / box.w, h: 0.96 };
    const lows = drivers.map((x) => x.low - d.base);
    const highs = drivers.map((x) => x.high - d.base);
    h.chart(
      "tornado-bars",
      h.charts.bar,
      [
        { name: "Downside: outcome minus base", labels: drivers.map((x) => x.label), values: lows },
        { name: "Upside: outcome minus base", labels: drivers.map((x) => x.label), values: highs },
      ],
      chartDefaults(box, {
        barDir: "bar",
        barGrouping: "stacked",
        barOverlapPct: 100,
        barGapWidthPct: 42,
        catAxisOrientation: "maxMin",
        catAxisLabelPos: "low",
        catAxisLineColor: C.ink,
        valAxisHidden: true,
        valAxisMinVal: -M,
        valAxisMaxVal: M,
        layout: lay,
        chartColors: [C.neutralLight, C.neutral],
        dataBorder: { pt: 0.75, color: C.neutralDark },
        showValue: false,
        altText: `Tornado chart of model output sensitivity around a base of ${fmt(d.base, d.dp)}`,
      }),
    );

    const px0 = box.x + lay.x * box.w;
    const pw = lay.w * box.w;
    const py0 = box.y + lay.y * box.h;
    const rowH = (lay.h * box.h) / n;
    const at = (dev: number) => px0 + ((dev + M) / (2 * M)) * pw;
    drivers.forEach((x, i) => {
      const cy = py0 + rowH * (i + 0.5);
      h.text(`low-value-${i}`, "label", fmt(x.low, d.dp), {
        x: at(x.low - d.base) - 0.78, y: cy - 0.14, w: 0.7, h: 0.28, fontSize: 11, color: C.ink, align: "right", valign: "middle",
      });
      h.text(`high-value-${i}`, "label", fmt(x.high, d.dp), {
        x: at(x.high - d.base) + 0.08, y: cy - 0.14, w: 0.7, h: 0.28, fontSize: 11, color: C.ink, valign: "middle",
      });
    });
    h.text("base-label", "axis", `${d.baseLabel}: ${fmt(d.base, d.dp)}`, {
      x: at(0) - 1.5, y: box.y - 0.3, w: 3, h: 0.26, fontSize: 10, bold: true, color: C.ink, align: "center",
    });
    h.text("unit", "axis", d.unit, {
      x: h.area.x, y: h.area.y + 0.3, w: 2.6, h: 0.26, fontSize: 10, color: C.muted,
    });
  },
};
