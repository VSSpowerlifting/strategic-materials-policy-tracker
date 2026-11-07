// D2 percent-stacked — composition of each row as shares of 100%, with the base
// (n) of each row shown so unequal bases are visible. Native 100% stacked bar
// chart (data-bound shares). Row bases are positioned text, not data-bound.
import { arr, num, obj, oneOf, optNum, optStr, str } from "../contract";
import { maxItems, minItems, nonNegative, sameLength, sumsTo, uniqueLabels } from "../integrity";
import { C, chartDefaults, fmt, legendItem } from "../primitives";
import type { Renderer } from "../types";

export interface PercentStackedData {
  unit: string;
  /** What each n counts, e.g. "awards". */
  baseLabel: string;
  /** "shares": values are percentages that sum to 100. "counts": raw counts; shares are derived and n is their sum. */
  input: "shares" | "counts";
  components: string[];
  accent?: string;
  rows: { label: string; n?: number; values: number[] }[];
}

const NEUTRALS = [C.soft, C.neutralLight, C.neutral, C.neutralDark];

interface Row {
  label: string;
  n: number;
  shares: number[];
}

function resolve(d: PercentStackedData): Row[] {
  return d.rows.map((r) => {
    if (d.input === "counts") {
      const n = r.values.reduce((s, v) => s + v, 0);
      return { label: r.label, n, shares: r.values.map((v) => (n > 0 ? (v / n) * 100 : 0)) };
    }
    return { label: r.label, n: r.n ?? 0, shares: r.values };
  });
}

export const percentStacked: Renderer<PercentStackedData> = {
  id: "percent-stacked",
  parse(d) {
    const o = obj(d, "data");
    const components = arr(o.components, "data.components").map((c, i) => str(c, `data.components[${i}]`));
    const accent = optStr(o.accent, "data.accent");
    if (accent !== undefined) oneOf(accent, components, "data.accent");
    return {
      unit: str(o.unit, "data.unit"),
      baseLabel: str(o.baseLabel, "data.baseLabel"),
      input: oneOf(o.input, ["shares", "counts"] as const, "data.input"),
      components,
      accent,
      rows: arr(o.rows, "data.rows").map((x, i) => {
        const r = obj(x, `data.rows[${i}]`);
        return {
          label: str(r.label, `data.rows[${i}].label`),
          n: optNum(r.n, `data.rows[${i}].n`),
          values: arr(r.values, `data.rows[${i}].values`).map((v, j) => num(v, `data.rows[${i}].values[${j}]`)),
        };
      }),
    };
  },
  check(d) {
    const issues = [
      ...minItems(d.rows.length, 3, "bars"),
      ...maxItems(d.rows.length, 6, "bars"),
      ...minItems(d.components.length, 2, "components"),
      ...maxItems(d.components.length, 4, "components"),
      ...uniqueLabels(d.rows.map((r) => r.label)),
      ...uniqueLabels(d.components, "components"),
      ...d.rows.flatMap((r) => sameLength(r.values, d.components, `row "${r.label}" values vs components`)),
      ...nonNegative(d.rows.flatMap((r) => r.values)),
    ];
    if (d.input === "shares") {
      for (const r of d.rows) {
        issues.push(...sumsTo(r.values, 100, `row "${r.label}" shares`, 0.51));
        if (r.n === undefined || !(r.n > 0)) {
          issues.push({ rule: "base-stated", message: `row "${r.label}" needs a positive base n when shares are supplied` });
        }
      }
    } else {
      for (const r of d.rows) {
        if (!(r.values.reduce((s, v) => s + v, 0) > 0)) {
          issues.push({ rule: "base-stated", message: `row "${r.label}" has a zero base; shares are undefined` });
        }
      }
    }
    return issues;
  },
  render(h, d) {
    const key = d.components.length - 1;
    const accentIdx = d.accent ? d.components.indexOf(d.accent) : key;
    const rows = resolve(d).sort((a, b) => b.shares[accentIdx] - a.shares[accentIdx]);
    const n = rows.length;

    let ni = 0;
    const colors = d.components.map((c) => (c === d.accent ? C.gold : NEUTRALS[ni++]));
    let lx = h.area.x;
    d.components.forEach((c, i) => {
      lx = legendItem(h, `legend-${i}`, lx, h.area.y, c, { fill: colors[i], line: C.neutralDark }, 1.55);
    });
    h.text("unit", "axis", d.unit, {
      x: h.area.x + h.area.w - 1.15 - 2.2, y: h.area.y, w: 2.1, h: 0.26, fontSize: 10, color: C.muted, align: "right",
    });

    const baseW = 1.15;
    const note =
      d.input === "counts"
        ? `Shares derived from raw counts; n is the sum of each row's counts.`
        : `Bases differ: each row is its own ${d.baseLabel} total, not a share of one population.`;
    const box = { x: h.area.x, y: h.area.y + 0.4, w: h.area.w, h: h.area.h - 0.4 - 0.34 };
    const lay = { x: 1.55 / box.w, y: 0.02, w: 1 - (1.6 + baseW) / box.w, h: 0.96 };
    h.chart(
      "percent-bars",
      h.charts.bar,
      d.components.map((c, j) => ({ name: c, labels: rows.map((r) => r.label), values: rows.map((r) => Math.round(r.shares[j] * 100) / 100) })),
      chartDefaults(box, {
        barDir: "bar",
        barGrouping: "percentStacked",
        barOverlapPct: 100,
        barGapWidthPct: 38,
        catAxisOrientation: "maxMin",
        valAxisHidden: true,
        valAxisMinVal: 0,
        valAxisMaxVal: 1,
        layout: lay,
        chartColors: colors,
        dataBorder: { pt: 1, color: C.paper },
        showValue: true,
        dataLabelPosition: "ctr",
        dataLabelFontSize: 10,
        dataLabelColor: C.ink,
        dataLabelFormatCode: `[<7]"";0"%"`,
        altText: `100% stacked bar chart of ${d.components.join(", ")}`,
      }),
    );

    const px1 = box.x + (lay.x + lay.w) * box.w;
    const py0 = box.y + lay.y * box.h;
    const rowH = (lay.h * box.h) / n;
    h.text("base-heading", "axis", `Base (${d.baseLabel})`, {
      x: px1 + 0.12, y: h.area.y, w: baseW, h: 0.26, fontSize: 10, bold: true, color: C.muted,
    });
    rows.forEach((r, i) => {
      h.text(`base-${i}`, "label", `n = ${fmt(r.n, 0)}`, {
        x: px1 + 0.12, y: py0 + rowH * (i + 0.5) - 0.14, w: baseW, h: 0.28, fontSize: 11, color: C.ink, valign: "middle",
      });
    });
    h.text("basis-note", "axis", `Labels under 7% omitted. ${note}`, {
      x: h.area.x, y: h.area.y + h.area.h - 0.28, w: h.area.w, h: 0.26, fontSize: 10, color: C.muted,
    });
  },
};
