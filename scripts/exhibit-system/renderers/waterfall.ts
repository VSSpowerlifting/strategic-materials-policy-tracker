// E1 waterfall — start, signed movements, end; reconciles exactly.
// Native stacked bar: an unfilled helper series floats each movement.
import { arr, num, obj, optNum, str } from "../contract";
import { maxItems, nonNegative, reconciles, uniqueLabels } from "../integrity";
import { C, chartDefaults, fmt, legendItem } from "../primitives";
import type { Renderer } from "../types";

export interface WaterfallData {
  unit: string;
  dp: number;
  start: { label: string; value: number };
  steps: { label: string; delta: number }[];
  end: { label: string; value: number };
}

export const waterfall: Renderer<WaterfallData> = {
  id: "waterfall",
  parse(d) {
    const o = obj(d, "data");
    const s = obj(o.start, "data.start");
    const e = obj(o.end, "data.end");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      start: { label: str(s.label, "data.start.label"), value: num(s.value, "data.start.value") },
      steps: arr(o.steps, "data.steps").map((x, i) => {
        const r = obj(x, `data.steps[${i}]`);
        return { label: str(r.label, `data.steps[${i}].label`), delta: num(r.delta, `data.steps[${i}].delta`) };
      }),
      end: { label: str(e.label, "data.end.label"), value: num(e.value, "data.end.value") },
    };
  },
  check(d) {
    // Running level must stay non-negative so floats sit above the zero baseline.
    const levels: number[] = [d.start.value];
    let run = d.start.value;
    for (const s of d.steps) {
      run += s.delta;
      levels.push(run);
    }
    return [
      ...reconciles(d.start.value, d.steps.map((s) => s.delta), d.end.value),
      ...nonNegative([d.start.value, d.end.value, ...levels], "bridge-levels-nonnegative"),
      ...maxItems(d.steps.length, 8, "movements"),
      ...uniqueLabels([d.start.label, ...d.steps.map((s) => s.label), d.end.label]),
    ];
  },
  render(h, d) {
    const labels = [d.start.label, ...d.steps.map((s) => s.label), d.end.label];
    const helper: number[] = [0];
    const up: number[] = [0];
    const down: number[] = [0];
    const total: number[] = [d.start.value];
    let run = d.start.value;
    for (const s of d.steps) {
      const next = run + s.delta;
      helper.push(Math.min(run, next));
      up.push(s.delta > 0 ? s.delta : 0);
      down.push(s.delta < 0 ? -s.delta : 0);
      total.push(0);
      run = next;
    }
    helper.push(0);
    up.push(0);
    down.push(0);
    total.push(d.end.value);

    const legendH = 0.34;
    const area = { ...h.area, y: h.area.y + legendH, h: h.area.h - legendH - 0.36 };
    h.chart(
      "bridge",
      h.charts.bar,
      [
        { name: "helper: float offset (keep)", labels, values: helper },
        { name: "Total", labels, values: total },
        { name: "Increase", labels, values: up },
        { name: "Decrease", labels, values: down },
      ],
      chartDefaults(area, {
        barDir: "col",
        barGrouping: "stacked",
        barOverlapPct: 100,
        barGapWidthPct: 45,
        valAxisHidden: true,
        valAxisMinVal: 0,
        chartColors: ["transparent", C.neutralDark, C.neutral, C.neutralLight],
        catAxisLabelFontSize: 11,
        altText: `Waterfall bridge, ${d.unit}`,
      }),
      true,
    );
    // Value labels as native text under each column: avoids stacked-label clutter and keeps one numeric grammar.
    const n = labels.length;
    const colW = area.w / n;
    const values = [d.start.value, ...d.steps.map((s) => s.delta), d.end.value];
    values.forEach((v, i) => {
      const signed = i > 0 && i < n - 1;
      h.text(`value-${i}`, "label", fmt(v, d.dp, { sign: signed }), {
        x: area.x + i * colW, y: area.y + area.h + 0.04, w: colW, h: 0.28,
        fontSize: 11, bold: !signed, align: "center", color: C.ink,
      });
    });
    let x = h.area.x;
    x = legendItem(h, "legend-total", x, h.area.y, "Level", { fill: C.neutralDark }, 1.2);
    x = legendItem(h, "legend-up", x, h.area.y, "Increase", { fill: C.neutral }, 1.4);
    legendItem(h, "legend-down", x, h.area.y, "Decrease", { fill: C.neutralLight }, 1.4);
    h.text("unit", "axis", d.unit, {
      x: h.area.x + h.area.w - 3, y: h.area.y, w: 3, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });
  },
};
