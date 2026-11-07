// J3 value-chain-measured — ordered value-chain stages as chevrons with one
// measured quantity per stage beneath, on one zero-based scale and one unit.
// A stage without a measurement says "not measured"; it is never drawn as zero.
// Native shapes on a computed scale; values are NOT data-bound.
import { arr, num, obj, optStr, str } from "../contract";
import { maxItems, minItems, nonNegative, uniqueLabels } from "../integrity";
import { C, fmt, hairline, scale } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface ValueChainData {
  unit: string;
  dp: number;
  highlightStageId?: string;
  stages: { id: string; step: number; label: string; value: number | null }[];
}

export const valueChainMeasured: Renderer<ValueChainData> = {
  id: "value-chain-measured",
  parse(d) {
    const o = obj(d, "data");
    return {
      unit: str(o.unit, "data.unit"),
      dp: o.dp === undefined ? 0 : num(o.dp, "data.dp"),
      highlightStageId: optStr(o.highlightStageId, "data.highlightStageId"),
      stages: arr(o.stages, "data.stages").map((x, i) => {
        const r = obj(x, `data.stages[${i}]`);
        return {
          id: str(r.id, `data.stages[${i}].id`),
          step: num(r.step, `data.stages[${i}].step`),
          label: str(r.label, `data.stages[${i}].label`),
          value: r.value === null || r.value === undefined ? null : num(r.value, `data.stages[${i}].value`),
        };
      }),
    };
  },
  check(d) {
    const measured = d.stages.flatMap((s) => (s.value === null ? [] : [s.value]));
    const issues: IntegrityIssue[] = [
      ...minItems(d.stages.length, 4, "stages"),
      ...maxItems(d.stages.length, 8, "stages"),
      ...uniqueLabels(d.stages.map((s) => s.label), "stage labels"),
      ...uniqueLabels(d.stages.map((s) => s.id), "stage ids"),
      ...nonNegative(measured),
    ];
    for (let i = 1; i < d.stages.length; i++) {
      if (!(d.stages[i].step > d.stages[i - 1].step)) {
        issues.push({ rule: "stages-ordered", message: `stage ${d.stages[i].id} (step ${d.stages[i].step}) does not follow step ${d.stages[i - 1].step}` });
        break;
      }
    }
    if (measured.length < 2) issues.push({ rule: "measured-minimum", message: "at least two stages need a measurement to compare" });
    if (d.highlightStageId !== undefined && !d.stages.some((s) => s.id === d.highlightStageId && s.value !== null)) {
      issues.push({ rule: "highlight-resolves", message: `highlighted stage ${d.highlightStageId} is not a measured stage` });
    }
    return issues;
  },
  render(h, d) {
    const A = h.area;
    const n = d.stages.length;
    const pitch = A.w / n;
    const chevW = pitch + 0.1; // slight overlap lets the points nest
    const chevH = 0.6;
    const baseline = A.y + A.h - 0.34;
    const barTop = A.y + chevH + 0.55; // room for the value label above the tallest bar
    const max = Math.max(...d.stages.flatMap((s) => (s.value === null ? [] : [s.value])));
    const sy = scale(0, max, baseline, barTop);
    const barW = Math.min(1.0, pitch * 0.5);

    d.stages.forEach((s, i) => {
      const x = A.x + i * pitch;
      const cx = x + pitch / 2;
      h.shape(`stage-chevron-${i}`, "data", i === 0 ? h.shapes.homePlate : h.shapes.chevron, {
        x: x - (i === 0 ? 0 : 0.05), y: A.y, w: chevW - (i === n - 1 ? 0.05 : 0) - 0.07, h: chevH,
        fill: { color: C.neutralDark }, line: { color: C.paper, width: 1.5 },
      });
      h.text(`stage-label-${i}`, "label", s.label, {
        x: x + (i === 0 ? 0.12 : 0.3), y: A.y, w: pitch - (i === 0 ? 0.5 : 0.62), h: chevH,
        fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle",
      });
      if (s.value === null) {
        h.text(`value-${i}`, "label", "not measured", {
          x: cx - 0.8, y: baseline - 0.34, w: 1.6, h: 0.28, fontSize: 11, italic: true, color: C.muted,
          align: "center", valign: "middle",
        });
      } else {
        const top = sy(s.value);
        const hot = s.id === d.highlightStageId;
        h.shape(`bar-${i}`, "data", h.shapes.rect, {
          x: cx - barW / 2, y: top, w: barW, h: baseline - top,
          fill: { color: hot ? C.accent : C.neutral }, line: { color: hot ? C.accent : C.neutral, width: 0 },
        });
        h.text(`value-${i}`, "label", fmt(s.value, d.dp), {
          x: cx - 0.6, y: top - 0.3, w: 1.2, h: 0.28, fontSize: 13, bold: true, color: C.ink,
          align: "center", valign: "bottom",
        });
      }
    });
    hairline(h, "baseline-zero", "axis", A.x, baseline, A.w, C.neutralDark);
    h.text("unit", "axis", `${d.unit} · bars start at zero · one scale across stages`, {
      x: A.x, y: baseline + 0.06, w: A.w, h: 0.24, fontSize: 10, color: C.muted, align: "left",
    });
  },
};
