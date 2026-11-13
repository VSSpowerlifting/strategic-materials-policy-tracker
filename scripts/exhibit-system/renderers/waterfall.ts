// E1 waterfall — start, signed movements, end; reconciles exactly.
// Native stacked bar: an unfilled helper series floats each movement.
// Optional `share`: a native doughnut beside the bridge showing the end level's
// composition (start vs. the added amount), read from the same start/end inputs.
// Only valid when every movement is an increase, so the slices are the start and
// the sum of the increases and total exactly 100% of the end level.
import { arr, num, obj, optNum, optStr, str, strList } from "../contract";
import { maxItems, nonNegative, reconciles, sumsTo, uniqueLabels } from "../integrity";
import { C, chartDefaults, fmt, legendItem } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface WaterfallData {
  unit: string;
  dp: number;
  start: { label: string; value: number };
  steps: { label: string; delta: number }[];
  end: { label: string; value: number };
  /** Composition doughnut. `centreLabel` sits under the added share; `baseNote` (optional) under the key. */
  share?: { title: string; baseLabel: string; addedLabel: string; centreLabel: string; baseNote?: string };
  /** Step labels whose value labels are set bold (the movements the slide argues from). */
  emphasis?: string[];
  /**
   * Optional key text for the emphasised steps. When given, those steps are drawn as their
   * own data-bound series (hematite for decreases, malachite for increases) with this key;
   * all emphasised steps must then move the same way. Absent, emphasis stays bold-only.
   */
  emphasisLabel?: string;
}

/** Slice percentages of the end level: [start share, added share], unrounded. */
export function shareSlices(d: WaterfallData): [number, number] {
  const added = d.end.value - d.start.value;
  return [(d.start.value / d.end.value) * 100, (added / d.end.value) * 100];
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
      ...(o.emphasis === undefined ? {} : { emphasis: strList(o.emphasis, "data.emphasis") }),
      ...(o.emphasisLabel === undefined ? {} : { emphasisLabel: str(o.emphasisLabel, "data.emphasisLabel") }),
      ...(o.share === undefined ? {} : { share: parseShare(o.share) }),
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
    const issues: IntegrityIssue[] = [
      ...reconciles(d.start.value, d.steps.map((s) => s.delta), d.end.value),
      ...nonNegative([d.start.value, d.end.value, ...levels], "bridge-levels-nonnegative"),
      ...maxItems(d.steps.length, 8, "movements"),
      ...uniqueLabels([d.start.label, ...d.steps.map((s) => s.label), d.end.label]),
    ];
    if (d.share) {
      if (d.steps.some((s) => s.delta <= 0) || d.end.value <= 0) {
        issues.push({ rule: "share-composition", message: "a share doughnut needs increases only and a positive end level" });
      } else {
        issues.push(...sumsTo(shareSlices(d), 100, "share slices", 1e-9));
        issues.push(...sumsTo([d.start.value, d.end.value - d.start.value], d.end.value, "share slice values", 1e-9));
        // The two printed percentages must also add to 100.00, not only the unrounded slices.
        issues.push(...sumsTo(shareSlices(d).map((p) => Number(p.toFixed(2))), 100, "printed share labels", 1e-9));
      }
    }
    for (const em of d.emphasis ?? []) {
      if (!d.steps.some((s) => s.label === em)) issues.push({ rule: "accent-resolves", message: `emphasis "${em}" is not a step label` });
    }
    if (d.emphasisLabel !== undefined) {
      const signs = new Set(d.steps.filter((s) => (d.emphasis ?? []).includes(s.label)).map((s) => Math.sign(s.delta)));
      if (!d.emphasis?.length) issues.push({ rule: "accent-resolves", message: "emphasisLabel needs at least one emphasised step" });
      else if (signs.size !== 1 || signs.has(0)) issues.push({ rule: "accent-resolves", message: "emphasised steps with a key must all be increases or all decreases" });
    }
    return issues;
  },
  render(h, d) {
    const labels = [d.start.label, ...d.steps.map((s) => s.label), d.end.label];
    const helper: number[] = [0];
    const up: number[] = [0];
    const down: number[] = [0];
    const total: number[] = [d.start.value];
    // Emphasised steps leave the up/down series for their own keyed series (only with emphasisLabel).
    const keyed = d.emphasisLabel !== undefined;
    const em: number[] = [0];
    let run = d.start.value;
    for (const s of d.steps) {
      const next = run + s.delta;
      const isEm = keyed && (d.emphasis ?? []).includes(s.label);
      helper.push(Math.min(run, next));
      up.push(!isEm && s.delta > 0 ? s.delta : 0);
      down.push(!isEm && s.delta < 0 ? -s.delta : 0);
      em.push(isEm ? Math.abs(s.delta) : 0);
      total.push(0);
      run = next;
    }
    helper.push(0);
    up.push(0);
    down.push(0);
    em.push(0);
    total.push(d.end.value);
    const emIsDecrease = d.steps.some((s) => (d.emphasis ?? []).includes(s.label) && s.delta < 0);
    const emColor = emIsDecrease ? C.negative : C.accent;

    const legendH = 0.34;
    // With a share doughnut the bridge keeps the left 58% (arithmetic), the doughnut the right (composition).
    const bridgeW = d.share ? h.area.w * 0.58 : h.area.w;
    const area = { ...h.area, w: bridgeW, y: h.area.y + legendH, h: h.area.h - legendH - 0.36 };
    // Explicit plot layout (category labels get a fixed band below it) so the value row can be
    // centred on each column; an automatic plot area drifts from evenly divided label boxes.
    const catBand = 0.5;
    const lay = { x: 0.005, y: 0.02, w: 0.99, h: Math.max(0.5, 0.98 - catBand / area.h) };
    h.chart(
      "bridge",
      h.charts.bar,
      [
        { name: "helper: float offset (keep)", labels, values: helper },
        { name: "Total", labels, values: total },
        { name: "Increase", labels, values: up },
        { name: "Decrease", labels, values: down },
        ...(keyed ? [{ name: d.emphasisLabel as string, labels, values: em }] : []),
      ],
      chartDefaults(area, {
        barDir: "col",
        barGrouping: "stacked",
        barOverlapPct: 100,
        barGapWidthPct: 45,
        valAxisHidden: true,
        valAxisMinVal: 0,
        chartColors: ["transparent", C.neutralDark, C.neutral, C.neutralLight, ...(keyed ? [emColor] : [])],
        catAxisLabelFontSize: 11,
        layout: lay,
        altText: `Waterfall bridge, ${d.unit}`,
      }),
      true,
    );
    // Value labels as native text under each column: avoids stacked-label clutter and keeps one numeric grammar.
    const n = labels.length;
    const px0 = area.x + lay.x * area.w;
    const colW = (lay.w * area.w) / n;
    const values = [d.start.value, ...d.steps.map((s) => s.delta), d.end.value];
    values.forEach((v, i) => {
      const signed = i > 0 && i < n - 1;
      h.text(`value-${i}`, "label", fmt(v, d.dp, { sign: signed }), {
        x: px0 + i * colW, y: area.y + area.h + 0.04, w: colW, h: 0.28,
        fontSize: 11, bold: !signed || (d.emphasis ?? []).includes(labels[i]), align: "center", color: C.ink,
      });
    });
    let x = h.area.x;
    x = legendItem(h, "legend-total", x, h.area.y, "Level", { fill: C.neutralDark }, 1.2);
    // Key only the movements the bridge actually draws.
    if (up.some((v) => v > 0)) x = legendItem(h, "legend-up", x, h.area.y, "Increase", { fill: C.neutral }, 1.4);
    if (down.some((v) => v > 0)) x = legendItem(h, "legend-down", x, h.area.y, "Decrease", { fill: C.neutralLight }, 1.4);
    if (keyed) legendItem(h, "legend-emphasis", x, h.area.y, d.emphasisLabel as string, { fill: emColor }, 2.2);
    const unitW = d.share ? 1.6 : 3;
    h.text("unit", "axis", d.unit, {
      x: h.area.x + bridgeW - unitW, y: h.area.y, w: unitW, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });
    if (d.share) renderShare(h, d, d.share, h.area.x + bridgeW + 0.35, h.area.x + h.area.w);
  },
};

function parseShare(raw: unknown): NonNullable<WaterfallData["share"]> {
  const sh = obj(raw, "data.share");
  const baseNote = optStr(sh.baseNote, "data.share.baseNote");
  return {
    title: str(sh.title, "data.share.title"),
    baseLabel: str(sh.baseLabel, "data.share.baseLabel"),
    addedLabel: str(sh.addedLabel, "data.share.addedLabel"),
    centreLabel: str(sh.centreLabel, "data.share.centreLabel"),
    ...(baseNote === undefined ? {} : { baseNote }),
  };
}

function renderShare(
  h: Parameters<Renderer<WaterfallData>["render"]>[0],
  d: WaterfallData,
  sh: NonNullable<WaterfallData["share"]>,
  x0: number,
  x1: number,
): void {
  // Trim binary float noise (177.069 - 163.478 -> 13.590999...) so the embedded workbook shows the input precision.
  const added = Number((d.end.value - d.start.value).toFixed(9));
  const [basePct, addedPct] = shareSlices(d);
  const w = x1 - x0;
  const top = h.area.y;
  // Hairline divider marks the move from arithmetic (left) to composition (right).
  h.line("share-divider", "frame", {
    x: x0 - 0.18, y: top, w: 0, h: h.area.h - 0.1, line: { color: C.border, width: 0.75 },
  });
  h.text("share-title", "axis", sh.title, {
    x: x0, y: top, w, h: 0.26, fontSize: 11, color: C.muted,
  });
  const size = Math.min(w, h.area.h - 1.55);
  const cx = x0 + (w - size) / 2;
  h.chart(
    "share",
    h.charts.doughnut,
    [{ name: sh.title, labels: [sh.baseLabel, sh.addedLabel], values: [d.start.value, added] }],
    chartDefaults({ x: cx, y: top + 0.34, w: size, h: size }, {
      holeSize: 62,
      chartColors: [C.neutralDark, C.accent],
      dataBorder: { pt: 1, color: C.paper },
      showValue: false,
      showPercent: false,
      showLabel: false,
      altText: `Doughnut: ${sh.addedLabel} ${addedPct.toFixed(2)}%, ${sh.baseLabel} ${basePct.toFixed(2)}% of ${fmt(d.end.value, d.dp)} ${d.unit.toLowerCase()}`,
    }),
  );
  // Centre figure: the added share.
  h.text("share-centre", "label", [
    { text: `${addedPct.toFixed(2)}%`, options: { fontSize: 20, bold: true, color: C.ink, breakLine: true } },
    { text: sh.centreLabel, options: { fontSize: 11, color: C.muted } },
  ], { x: cx, y: top + 0.34 + size / 2 - 0.36, w: size, h: 0.72, align: "center", valign: "middle" });
  let y = top + 0.34 + size + 0.14;
  const rows: [string, string, number, string][] = [
    ["share-added", C.accent, addedPct, sh.addedLabel],
    ["share-base", C.neutralDark, basePct, sh.baseLabel],
  ];
  for (const [name, fill, pct, label] of rows) {
    legendItem(h, name, x0, y, `${pct.toFixed(2)}%  ${label}`, { fill }, w);
    y += 0.3;
  }
  if (sh.baseNote) {
    h.text("share-base-note", "axis", sh.baseNote, {
      x: x0, y: y + 0.02, w, h: 0.26, fontSize: 11, color: C.muted,
    });
  }
}
