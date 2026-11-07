// E2 sources-and-uses — two stacked columns that must total the same amount.
// Native stacked column chart; each component is its own series so the
// workbook carries every figure. Labels are native text beside the columns.
import { arr, num, obj, optNum, str } from "../contract";
import { maxItems, nonNegative, totalsMatch, uniqueLabels } from "../integrity";
import { C, chartDefaults, fmt } from "../primitives";
import type { Renderer } from "../types";

interface Component { label: string; value: number }
export interface SourcesUsesData {
  unit: string;
  dp: number;
  sources: Component[];
  uses: Component[];
}

const components = (x: unknown, path: string): Component[] =>
  arr(x, path).map((v, i) => {
    const r = obj(v, `${path}[${i}]`);
    return { label: str(r.label, `${path}[${i}].label`), value: num(r.value, `${path}[${i}].value`) };
  });

const SOURCE_TONES = [C.neutralDark, C.neutral, C.neutralLight, C.soft];
const USE_TONES = [C.accent, C.gold, "D9BD84", "EADCBC"];

export const sourcesAndUses: Renderer<SourcesUsesData> = {
  id: "sources-and-uses",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: optNum(o.dp, "data.dp") ?? 0,
      sources: components(o.sources, "data.sources"),
      uses: components(o.uses, "data.uses"),
    };
  },
  check(d) {
    const s = d.sources.reduce((a, c) => a + c.value, 0);
    const u = d.uses.reduce((a, c) => a + c.value, 0);
    return [
      ...nonNegative([...d.sources, ...d.uses].map((c) => c.value)),
      ...totalsMatch(s, u, "sources total vs uses total"),
      ...maxItems(d.sources.length, 4, "source components"),
      ...maxItems(d.uses.length, 4, "use components"),
      ...uniqueLabels(d.sources.map((c) => c.label), "source labels"),
      ...uniqueLabels(d.uses.map((c) => c.label), "use labels"),
    ];
  },
  render(h, d) {
    const total = d.sources.reduce((a, c) => a + c.value, 0);
    const chartW = 4.4;
    const area = { x: h.area.x + 1.9, y: h.area.y + 0.1, w: chartW, h: h.area.h - 0.5 };
    const cats = ["Sources", "Uses"];
    const series = [
      ...d.sources.map((c) => ({ name: `Source: ${c.label}`, labels: cats, values: [c.value, 0] })),
      ...d.uses.map((c) => ({ name: `Use: ${c.label}`, labels: cats, values: [0, c.value] })),
    ];
    h.chart(
      "sources-uses",
      h.charts.bar,
      series,
      chartDefaults(area, {
        barDir: "col",
        barGrouping: "stacked",
        barOverlapPct: 100,
        barGapWidthPct: 70,
        valAxisHidden: true,
        valAxisMinVal: 0,
        valAxisMaxVal: total,
        catAxisLabelFontSize: 12,
        chartColors: [
          ...d.sources.map((_, i) => SOURCE_TONES[i % SOURCE_TONES.length]),
          ...d.uses.map((_, i) => USE_TONES[i % USE_TONES.length]),
        ],
        dataBorder: { pt: 1, color: C.paper },
        altText: `Sources and uses, ${d.unit}`,
      }),
    );
    // Plot-area geometry approximation for side labels: pptxgenjs reserves the category axis band at the bottom.
    const plotTop = area.y + 0.12;
    const plotBottom = area.y + area.h - 0.42;
    const ky = (plotBottom - plotTop) / total;
    const place = (list: Component[], side: "left" | "right") => {
      let acc = 0;
      list.forEach((c, i) => {
        const mid = plotBottom - (acc + c.value / 2) * ky;
        acc += c.value;
        const x = side === "left" ? h.area.x : area.x + area.w + 0.05;
        h.text(`${side === "left" ? "source" : "use"}-label-${i}`, "label", [
          { text: c.label, options: { fontSize: 11, color: C.ink, breakLine: true } },
          { text: fmt(c.value, d.dp), options: { fontSize: 11, bold: true, color: C.ink } },
        ], { x, y: mid - 0.24, w: 1.85, h: 0.48, align: side === "left" ? "right" : "left", valign: "middle" });
      });
    };
    place(d.sources, "left");
    place(d.uses, "right");
    h.text("total", "label", `Total ${fmt(total, d.dp)} on each side · ${d.unit}`, {
      x: area.x, y: h.area.y + h.area.h - 0.34, w: chartW, h: 0.26, fontSize: 10, color: C.muted, align: "center",
    });
  },
};
