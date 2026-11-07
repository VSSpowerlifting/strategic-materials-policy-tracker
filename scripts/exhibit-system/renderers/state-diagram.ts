// J1 state-diagram — the legal or administrative states of one instrument and
// the labelled transitions between them. Native shapes on a deterministic
// grid (snake order over at most two rows); geometry and text are editable,
// nothing is data-bound.
import { arr, isoDate, obj, optStr, str } from "../contract";
import { edgesResolve, maxItems, minItems, uniqueLabels } from "../integrity";
import { C, legendItem } from "../primitives";
import type { IntegrityIssue, RenderHelpers, Renderer } from "../types";

export interface StateDiagramData {
  asOf: string;
  currentId: string;
  states: { id: string; label: string; note?: string }[];
  transitions: { from: string; to: string; label: string }[];
}

/** Straight line from (x1,y1) to (x2,y2); the arrowhead sits at the end point. */
function seg(
  h: RenderHelpers, name: string, x1: number, y1: number, x2: number, y2: number,
  arrow: boolean,
): void {
  h.line(name, "data", {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color: C.neutralDark, width: 1.25, ...(arrow ? { endArrowType: "triangle" } : {}) },
  });
}

/** Polyline through the points; arrowhead on the last segment. */
function path(h: RenderHelpers, name: string, pts: [number, number][]): void {
  for (let i = 0; i < pts.length - 1; i++) {
    seg(h, `${name}-${i}`, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], i === pts.length - 2);
  }
}

export const stateDiagram: Renderer<StateDiagramData> = {
  id: "state-diagram",
  parse(d) {
    const o = obj(d, "data");
    return {
      asOf: isoDate(o.asOf, "data.asOf"),
      currentId: str(o.currentId, "data.currentId"),
      states: arr(o.states, "data.states").map((x, i) => {
        const r = obj(x, `data.states[${i}]`);
        return {
          id: str(r.id, `data.states[${i}].id`),
          label: str(r.label, `data.states[${i}].label`),
          note: optStr(r.note, `data.states[${i}].note`),
        };
      }),
      transitions: arr(o.transitions, "data.transitions").map((x, i) => {
        const r = obj(x, `data.transitions[${i}]`);
        return {
          from: str(r.from, `data.transitions[${i}].from`),
          to: str(r.to, `data.transitions[${i}].to`),
          label: str(r.label, `data.transitions[${i}].label`),
        };
      }),
    };
  },
  check(d) {
    const ids = d.states.map((s) => s.id);
    const issues: IntegrityIssue[] = [
      ...minItems(d.states.length, 3, "states"),
      ...maxItems(d.states.length, 6, "states"),
      ...uniqueLabels(d.states.map((s) => s.label), "state labels"),
      ...uniqueLabels(ids, "state ids"),
      ...edgesResolve(ids, d.transitions),
    ];
    if (!ids.includes(d.currentId)) {
      issues.push({ rule: "current-state-resolves", message: `current state ${d.currentId} is not a declared state` });
    }
    const seen = new Set<string>();
    for (const t of d.transitions) {
      const k = `${t.from}>${t.to}`;
      if (seen.has(k)) issues.push({ rule: "no-duplicate-edges", message: `transition ${t.from}→${t.to} is declared twice` });
      seen.add(k);
    }
    return issues;
  },
  render(h, d) {
    const A = h.area;
    const n = d.states.length;
    const cols = n <= 3 ? n : Math.ceil(n / 2);
    const nodeW = Math.min(2.0, (A.w - (cols - 1) * 1.2) / cols);
    const nodeH = 0.82;
    const gapX = cols > 1 ? (A.w - cols * nodeW) / (cols - 1) : 0;
    const rows = Math.ceil(n / cols);
    const rowGap = 1.6;
    const top = A.y + 0.62 + (rows > 1 ? 0.1 : 1.1);
    const pos = new Map<string, { r: number; c: number; x: number; y: number; cx: number }>();
    d.states.forEach((s, i) => {
      const r = Math.floor(i / cols);
      const j = i % cols;
      const c = r % 2 === 0 ? j : cols - 1 - j;
      const x = A.x + c * (nodeW + gapX);
      pos.set(s.id, { r, c, x, y: top + r * (nodeH + rowGap), cx: x + nodeW / 2 });
    });

    // Legend
    let lx = A.x;
    lx = legendItem(h, "legend-current", lx, A.y, `Current state, as of ${d.asOf}`, { fill: C.accent }, 3.1);
    legendItem(h, "legend-other", lx, A.y, "Other state", { fill: "FFFFFF", line: C.neutral }, 1.5);
    h.text("legend-edge", "legend", "Arrow: transition, labelled by trigger", {
      x: A.x + A.w - 3.1, y: A.y, w: 3.1, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    // Nodes
    d.states.forEach((s, i) => {
      const p = pos.get(s.id);
      if (!p) return;
      const cur = s.id === d.currentId;
      h.shape(`state-box-${i}`, "data", h.shapes.roundRect, {
        x: p.x, y: p.y, w: nodeW, h: nodeH, rectRadius: 0.08,
        fill: { color: cur ? C.accent : "FFFFFF" },
        line: { color: cur ? C.accent : C.neutral, width: 1.25 },
      });
      const runs = [{ text: s.label, options: { bold: true, fontSize: 13, color: cur ? "FFFFFF" : C.ink, breakLine: !!s.note } }];
      if (s.note) runs.push({ text: s.note, options: { bold: false, fontSize: 11, color: cur ? "FFFFFF" : C.muted, breakLine: false } });
      h.text(`state-label-${i}`, "label", runs, {
        x: p.x + 0.06, y: p.y, w: nodeW - 0.12, h: nodeH, align: "center", valign: "middle",
      });
    });

    // Edges
    const has = (a: string, b: string) => d.transitions.some((t) => t.from === a && t.to === b);
    d.transitions.forEach((t, i) => {
      const a = pos.get(t.from);
      const b = pos.get(t.to);
      if (!a || !b) return;
      const name = `edge-${i}`;
      const pair = has(t.to, t.from);
      const lbl = (id: string, text: string, x: number, y: number, w: number, o: Record<string, unknown>) =>
        h.text(id, "label", text, { x, y, w, h: 0.4, fontSize: 11, color: C.ink, ...o });

      if (a.r === b.r && Math.abs(a.c - b.c) === 1) {
        const dir = b.c > a.c ? 1 : -1;
        const off = pair ? (dir > 0 ? -0.14 : 0.14) : 0;
        const y = a.y + nodeH / 2 + off;
        const xa = dir > 0 ? a.x + nodeW : a.x;
        const xb = dir > 0 ? b.x : b.x + nodeW;
        seg(h, name, xa, y, xb, y, true);
        const lw = gapX - 0.1;
        const x = Math.min(xa, xb) + 0.05;
        lbl(`${name}-label`, t.label, x, off <= 0 ? y - 0.43 : y + 0.04, lw, {
          align: "center", valign: off <= 0 ? "bottom" : "top",
        });
      } else if (a.c === b.c && Math.abs(a.r - b.r) === 1) {
        const dir = b.r > a.r ? 1 : -1;
        const off = pair ? (dir > 0 ? -0.14 : 0.14) : 0;
        const x = a.cx + off;
        const ya = dir > 0 ? a.y + nodeH : a.y;
        const yb = dir > 0 ? b.y : b.y + nodeH;
        seg(h, name, x, ya, x, yb, true);
        const midY = (ya + yb) / 2 - 0.2;
        if (off <= 0 && !pair) lbl(`${name}-label`, t.label, x + 0.1, midY, 1.5, { align: "left", valign: "middle" });
        else if (off < 0) lbl(`${name}-label`, t.label, x - 1.6, midY, 1.5, { align: "right", valign: "middle" });
        else lbl(`${name}-label`, t.label, x + 0.1, midY, 1.5, { align: "left", valign: "middle" });
      } else if (a.r !== b.r) {
        // Elbow between rows. Ports nest so a forward/back pair never crosses.
        const down = b.r > a.r;
        const up = down ? a : b; // upper node
        const lo = down ? b : a; // lower node
        const dsg = Math.sign(lo.cx - up.cx) || 1;
        const gapTop = up.y + nodeH;
        const gapBot = lo.y;
        const span = gapBot - gapTop;
        let upPort = dsg * 0.5;
        let loPort = -dsg * 0.5;
        let frac = 0.5;
        if (pair) {
          if (down) { upPort = dsg * 0.35; loPort = -dsg * 0.65; frac = 0.68; }
          else { upPort = dsg * 0.75; loPort = -dsg * 0.25; frac = 0.32; }
        }
        const laneY = gapTop + span * frac;
        const xu = up.cx + upPort;
        const xl = lo.cx + loPort;
        if (down) path(h, name, [[xu, gapTop], [xu, laneY], [xl, laneY], [xl, gapBot]]);
        else path(h, name, [[xl, gapBot], [xl, laneY], [xu, laneY], [xu, gapTop]]);
        const x0 = Math.min(xu, xl) + 0.06;
        const lw = Math.abs(xu - xl) - 0.12;
        const above = !pair || !down;
        lbl(`${name}-label`, t.label, x0, above ? laneY - 0.43 : laneY + 0.04, lw, {
          align: "center", valign: above ? "bottom" : "top",
        });
      }
    });
  },
};
