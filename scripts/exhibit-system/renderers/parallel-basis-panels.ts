// E3 parallel-basis-panels — side-by-side panels for figures that sit on
// non-comparable bases. Each panel is its own native bar chart with its own
// zero-based axis and unit label; nothing is shared or totalled across panels.
import { arr, num, obj, optNum, optStr, str } from "../contract";
import { maxItems, minItems, nonNegative, uniqueLabels } from "../integrity";
import { C, chartDefaults, formatCode, niceMax } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface BasisPanel {
  basis: string;
  unit: string;
  dp: number;
  items: { label: string; value: number }[];
}

export interface ParallelBasisData {
  panels: BasisPanel[];
  /** Label of the single highlighted item, repeated across panels (optional). */
  accent?: string;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export const parallelBasisPanels: Renderer<ParallelBasisData> = {
  id: "parallel-basis-panels",
  parse(d) {
    const o = obj(d, "data");
    return {
      accent: optStr(o.accent, "data.accent"),
      panels: arr(o.panels, "data.panels").map((p, i) => {
        const r = obj(p, `data.panels[${i}]`);
        return {
          basis: str(r.basis, `data.panels[${i}].basis`),
          unit: str(r.unit, `data.panels[${i}].unit`),
          dp: optNum(r.dp, `data.panels[${i}].dp`) ?? 0,
          items: arr(r.items, `data.panels[${i}].items`).map((x, j) => {
            const it = obj(x, `data.panels[${i}].items[${j}]`);
            return { label: str(it.label, `data.panels[${i}].items[${j}].label`), value: num(it.value, `data.panels[${i}].items[${j}].value`) };
          }),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.panels.length, 2, "panels"),
      ...maxItems(d.panels.length, 3, "panels"),
      ...uniqueLabels(d.panels.map((p) => norm(p.basis)), "panel bases"),
    ];
    // Same basis in two panels means they are one chart, not parallel bases.
    const seen = new Set<string>();
    for (const p of d.panels) {
      const k = norm(p.basis);
      if (seen.has(k)) {
        issues.push({ rule: "distinct-bases", message: `panels share the basis "${p.basis}"; they belong in one chart` });
      }
      seen.add(k);
    }
    for (const p of d.panels) {
      issues.push(
        ...minItems(p.items.length, 3, `bars in panel "${p.basis}"`),
        ...maxItems(p.items.length, 6, `bars in panel "${p.basis}"`),
        ...uniqueLabels(p.items.map((i) => i.label)),
        ...nonNegative(p.items.map((i) => i.value)),
      );
    }
    if (d.accent !== undefined) {
      for (const p of d.panels) {
        if (!p.items.some((i) => i.label === d.accent)) {
          issues.push({ rule: "single-highlight", message: `accent "${d.accent}" is absent from panel "${p.basis}"` });
        }
      }
    }
    return issues;
  },
  render(h, d) {
    const n = d.panels.length;
    const gap = 0.34;
    const pw = (h.area.w - gap * (n - 1)) / n;
    const headH = 0.62;
    d.panels.forEach((p, i) => {
      const x = h.area.x + i * (pw + gap);
      if (i > 0) {
        h.shape(`panel-rule-${i}`, "axis", h.shapes.rect, {
          x: x - gap / 2, y: h.area.y, w: 0.012, h: h.area.h, fill: { color: C.border }, line: { color: C.border, width: 0 },
        });
      }
      h.text(`panel-basis-${i}`, "label", p.basis, { x, y: h.area.y, w: pw, h: 0.3, fontSize: 12, bold: true, color: C.ink });
      h.text(`panel-unit-${i}`, "axis", p.unit, { x, y: h.area.y + 0.3, w: pw, h: 0.26, fontSize: 11, color: C.muted });
      const max = niceMax(Math.max(...p.items.map((it) => it.value)) * 1.22);
      h.chart(
        `panel-chart-${i}`,
        h.charts.bar,
        [{ name: `${p.basis} (${p.unit})`, labels: p.items.map((it) => it.label), values: p.items.map((it) => it.value) }],
        chartDefaults({ x, y: h.area.y + headH, w: pw, h: h.area.h - headH }, {
          barDir: "bar",
          catAxisOrientation: "maxMin",
          valAxisHidden: true,
          valAxisMinVal: 0,
          valAxisMaxVal: max,
          barGapWidthPct: 55,
          catAxisLabelFontSize: 11,
          chartColors: p.items.map((it) => (it.label === d.accent ? C.accent : C.neutral)),
          showValue: true,
          dataLabelPosition: "outEnd",
          dataLabelFormatCode: formatCode(p.dp),
          altText: `Bar chart, ${p.basis}, ${p.unit}`,
        }),
      );
    });
  },
};
