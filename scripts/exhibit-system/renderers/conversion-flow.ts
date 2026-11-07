// J4 conversion-flow — a quantified stepwise conversion. Rectangle height is
// proportional to the quantity on one zero-based scale; each step shows the
// carried quantity and a loss stub, and must reconcile (in = out + loss).
// The quantified alternative to an unquantified Sankey. Native shapes on a
// computed scale; values are NOT data-bound.
import { arr, num, obj, str } from "../contract";
import { maxItems, minItems, nonNegative, reconciles, uniqueLabels } from "../integrity";
import { C, fmt } from "../primitives";
import type { IntegrityIssue, Renderer } from "../types";

export interface ConversionFlowData {
  unit: string;
  dp: number;
  input: { label: string; value: number };
  steps: { process: string; label: string; out: number; loss: number }[];
}

export const conversionFlow: Renderer<ConversionFlowData> = {
  id: "conversion-flow",
  parse(d) {
    const o = obj(d, "data");
    const inp = obj(o.input, "data.input");
    return {
      unit: str(o.unit, "data.unit"),
      dp: o.dp === undefined ? 0 : num(o.dp, "data.dp"),
      input: { label: str(inp.label, "data.input.label"), value: num(inp.value, "data.input.value") },
      steps: arr(o.steps, "data.steps").map((x, i) => {
        const r = obj(x, `data.steps[${i}]`);
        return {
          process: str(r.process, `data.steps[${i}].process`),
          label: str(r.label, `data.steps[${i}].label`),
          out: num(r.out, `data.steps[${i}].out`),
          loss: num(r.loss, `data.steps[${i}].loss`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.steps.length, 2, "steps"),
      ...maxItems(d.steps.length, 5, "steps"),
      ...uniqueLabels([d.input.label, ...d.steps.map((s) => s.label)], "stage labels"),
      ...nonNegative([d.input.value, ...d.steps.flatMap((s) => [s.out, s.loss])]),
    ];
    let prev = d.input.value;
    d.steps.forEach((s, i) => {
      for (const r of reconciles(s.out, [s.loss], prev)) {
        issues.push({ rule: r.rule, message: `step ${i + 1} (${s.process}): ${r.message.replace(/^start/, "output")}` });
      }
      prev = s.out;
    });
    return issues;
  },
  render(h, d) {
    const A = h.area;
    const cols = d.steps.length + 1;
    const colW = 1.3;
    const gap = (A.w - cols * colW) / (cols - 1);
    const headH = 0.82; // column label + value label
    const top = A.y + headH;
    const flowH = 2.15;
    const k = flowH / d.input.value;
    const colX = (i: number) => A.x + i * (colW + gap);
    const qty = [d.input.value, ...d.steps.map((s) => s.out)];
    const names = [d.input.label, ...d.steps.map((s) => s.label)];

    // Connectors first (behind the columns): carried band and loss stub per step.
    d.steps.forEach((s, i) => {
      const x = colX(i) + colW;
      const inH = qty[i] * k;
      const outH = s.out * k;
      h.shape(`carry-band-${i}`, "data", h.shapes.rect, {
        x, y: top, w: gap, h: outH, fill: { color: C.neutralLight }, line: { color: C.neutralLight, width: 0 },
      });
      h.text(`process-${i}`, "label", s.process, {
        x: x + 0.05, y: top, w: gap - 0.1, h: Math.min(outH, 0.6), fontSize: 11, bold: true, color: C.ink,
        align: "center", valign: "middle",
      });
      h.shape(`loss-stub-${i}`, "data", h.shapes.rect, {
        x, y: top + outH, w: gap, h: s.loss * k, fill: { color: C.soft }, line: { color: C.neutral, width: 0.75 },
      });
      const pct = qty[i] > 0 ? (s.loss / qty[i]) * 100 : 0;
      h.text(`loss-label-${i}`, "label", [
        { text: fmt(-s.loss, d.dp), options: { bold: true, fontSize: 12, color: C.ink, breakLine: true } },
        { text: `${fmt(pct, 1)}% of step input`, options: { fontSize: 11, color: C.muted } },
      ], { x: x - 0.1, y: top + inH + 0.05, w: gap + 0.2, h: 0.46, align: "center", valign: "top" });
    });

    qty.forEach((v, i) => {
      const last = i === qty.length - 1;
      h.shape(`column-${i}`, "data", h.shapes.rect, {
        x: colX(i), y: top, w: colW, h: v * k,
        fill: { color: last ? C.accent : C.neutral }, line: { color: last ? C.accent : C.neutral, width: 0 },
      });
      h.text(`column-label-${i}`, "label", names[i], {
        x: colX(i) - 0.2, y: A.y, w: colW + 0.4, h: 0.26, fontSize: 11, bold: true, color: C.ink, align: "center", valign: "bottom",
      });
      h.text(`column-value-${i}`, "label", fmt(v, d.dp), {
        x: colX(i), y: A.y + 0.3, w: colW, h: 0.4, fontSize: 16, bold: true, color: last ? C.accent : C.ink, align: "center", valign: "middle",
      });
    });
    h.text("unit", "axis", `${d.unit} · height proportional to quantity from zero · each step: in = out + loss`, {
      x: A.x + 0.0, y: A.y + A.h - 0.26, w: A.w, h: 0.24, fontSize: 11, color: C.muted, align: "right",
    });
  },
};
