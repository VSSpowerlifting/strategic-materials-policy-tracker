// I4 stage ladder — ordered stages of a process drawn as a rising ladder of steps.
// Each stage shows the date it was reached, or "not yet reached" (hollow, dashed).
// Order is never skipped: a stage reached implies every earlier stage was reached.
// Native shapes: step geometry is derived from the fixture at build time, NOT data-bound.
import { arr, isoDate, obj, str } from "../contract";
import { datesAscending, maxItems, minItems, uniqueLabels } from "../integrity";
import { C, hairline } from "../primitives";
import type { IntegrityIssue, RenderHelpers, Renderer } from "../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface LadderStage {
  label: string;
  /** Date the stage was reached; absent when not yet reached. */
  date?: string;
}
export interface StageLadderData {
  /** Observation date the "reached" status is read at. */
  asOf: string;
  stages: LadderStage[];
}

const longDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const LABEL_MAX = 24;

export const stageLadder: Renderer<StageLadderData> = {
  id: "stage-ladder",
  parse(raw) {
    const o = obj(raw, "data");
    return {
      asOf: isoDate(o.asOf, "data.asOf"),
      stages: arr(o.stages, "data.stages").map((s, i) => {
        const p = `data.stages[${i}]`;
        const so = obj(s, p);
        return {
          label: str(so.label, `${p}.label`),
          date: so.date === undefined || so.date === null ? undefined : isoDate(so.date, `${p}.date`),
        };
      }),
    };
  },
  check(d) {
    const st = d.stages;
    const issues: IntegrityIssue[] = [
      ...minItems(st.length, 4, "stages"),
      ...maxItems(st.length, 6, "stages"),
      ...uniqueLabels(st.map((s) => s.label), "stage labels"),
      ...datesAscending(st.filter((s) => s.date !== undefined).map((s) => s.date as string), "reached stages"),
    ];
    st.forEach((s, i) => {
      if (s.label.length > LABEL_MAX) issues.push({ rule: "label-length", message: `"${s.label}" exceeds ${LABEL_MAX} characters` });
      if (s.date !== undefined && s.date > d.asOf) {
        issues.push({ rule: "reached-after-as-of", message: `"${s.label}" is dated ${s.date}, after the as-of date ${d.asOf}` });
      }
      if (s.date === undefined && st.slice(i + 1).some((later) => later.date !== undefined)) {
        issues.push({ rule: "stage-order", message: `"${s.label}" is not reached but a later stage is` });
      }
    });
    return issues;
  },
  render(h: RenderHelpers, d) {
    const a = h.area;
    const n = d.stages.length;
    const gap = 0.08;
    const colW = (a.w - gap * (n - 1)) / n;
    const base = a.y + a.h;
    const top = a.y + 0.5;
    const minH = 1.15;
    const stepH = (base - top - minH) / (n - 1);
    const reachedCount = d.stages.filter((s) => s.date !== undefined).length;

    // Legend and as-of note.
    let lx = a.x;
    h.shape("legend-reached", "legend", h.shapes.rect, { x: lx, y: a.y + 0.06, w: 0.3, h: 0.15, fill: { color: C.neutralLight }, line: { color: C.neutralDark, width: 0.75 } });
    h.text("legend-reached-label", "legend", "Reached", { x: lx + 0.38, y: a.y, w: 0.9, h: 0.26, fontSize: 11, color: C.ink });
    lx += 1.35;
    h.shape("legend-current", "legend", h.shapes.rect, { x: lx, y: a.y + 0.06, w: 0.3, h: 0.15, fill: { color: C.accent }, line: { color: C.accent, width: 0.75 } });
    h.text("legend-current-label", "legend", "Latest stage reached", { x: lx + 0.38, y: a.y, w: 1.7, h: 0.26, fontSize: 11, color: C.ink });
    lx += 2.2;
    h.shape("legend-pending", "legend", h.shapes.rect, { x: lx, y: a.y + 0.06, w: 0.3, h: 0.15, fill: { color: C.paper }, line: { color: C.neutralDark, width: 1.25, dashType: "dash" } });
    h.text("legend-pending-label", "legend", "Not yet reached", { x: lx + 0.38, y: a.y, w: 1.4, h: 0.26, fontSize: 11, color: C.ink });
    h.text("as-of", "axis", `Status as of ${longDate(d.asOf)}`, {
      x: a.x + a.w - 2.6, y: a.y, w: 2.6, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    d.stages.forEach((s, i) => {
      const x = a.x + i * (colW + gap);
      const hh = minH + i * stepH;
      const y = base - hh;
      const reached = s.date !== undefined;
      const current = reached && i === reachedCount - 1;
      const ink = current ? C.white : C.ink;
      const sub = current ? C.white : C.muted;
      h.shape(`step-${i}`, "data", h.shapes.rect, reached
        ? { x, y, w: colW, h: hh, fill: { color: current ? C.accent : C.neutralLight }, line: { color: current ? C.accent : C.neutralDark, width: 0.75 } }
        : { x, y, w: colW, h: hh, fill: { color: C.paper }, line: { color: C.neutralDark, width: 1.25, dashType: "dash" } });
      h.text(`step-label-${i}`, "label", [
        { text: `STAGE ${i + 1}`, options: { bold: true, fontSize: 11, color: sub, charSpacing: 1, breakLine: true } },
        { text: s.label, options: { bold: true, fontSize: 13, color: ink, breakLine: true } },
        { text: s.date !== undefined ? longDate(s.date) : "not yet reached", options: { fontSize: 11, color: sub } },
      ], { x: x + 0.12, y: y + 0.1, w: colW - 0.2, h: 1.0, valign: "top", paraSpaceAfter: 2 });
    });
    hairline(h, "ladder-base", "axis", a.x, base, a.w, C.neutral);
  },
};
