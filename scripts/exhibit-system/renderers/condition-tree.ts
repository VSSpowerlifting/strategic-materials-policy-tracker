// J2 condition-tree — a decision or eligibility tree: condition nodes with named
// branches leading to terminal outcome boxes, laid out left to right by depth.
// Native shapes; geometry and text are editable, nothing is data-bound.
import { arr, obj, oneOf, optStr, str } from "../contract";
import { edgesResolve, maxItems, minItems, uniqueLabels } from "../integrity";
import { C } from "../primitives";
import type { IntegrityIssue, RenderHelpers, Renderer } from "../types";

const KINDS = ["condition", "outcome"] as const;

export interface TreeNode {
  id: string;
  label: string;
  kind: (typeof KINDS)[number];
  branches: { label: string; to: string }[];
}
export interface ConditionTreeData {
  /** Outcome whose route from the root is highlighted (the single accent). */
  highlightOutcomeId?: string;
  /** The first node is the root. */
  nodes: TreeNode[];
}

const MAX_DEPTH = 4;

/** Depth of each node from the root, or null where the structure is not a tree. */
function walk(d: ConditionTreeData): { depth: Map<string, number>; parent: Map<string, string>; issues: IntegrityIssue[] } {
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const depth = new Map<string, number>();
  const parent = new Map<string, string>();
  const issues: IntegrityIssue[] = [];
  const visit = (id: string, dep: number, trail: string[]) => {
    if (trail.includes(id)) {
      issues.push({ rule: "tree-structure", message: `cycle through ${id}` });
      return;
    }
    if (depth.has(id)) {
      issues.push({ rule: "tree-structure", message: `${id} is reached by more than one branch` });
      return;
    }
    depth.set(id, dep);
    for (const b of byId.get(id)?.branches ?? []) {
      if (!byId.has(b.to)) continue;
      parent.set(b.to, id);
      visit(b.to, dep + 1, [...trail, id]);
    }
  };
  if (d.nodes.length) visit(d.nodes[0].id, 0, []);
  for (const n of d.nodes) {
    if (!depth.has(n.id)) issues.push({ rule: "tree-structure", message: `${n.id} is not reachable from the root` });
  }
  return { depth, parent, issues };
}

function seg(h: RenderHelpers, name: string, x1: number, y1: number, x2: number, y2: number, arrow: boolean, accent: boolean): void {
  h.line(name, "data", {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1,
    line: {
      color: accent ? C.accent : C.neutral, width: accent ? 2.25 : 1.25,
      ...(arrow ? { endArrowType: "triangle" } : {}),
    },
  });
}

export const conditionTree: Renderer<ConditionTreeData> = {
  id: "condition-tree",
  parse(d) {
    const o = obj(d, "data");
    return {
      highlightOutcomeId: optStr(o.highlightOutcomeId, "data.highlightOutcomeId"),
      nodes: arr(o.nodes, "data.nodes").map((x, i) => {
        const r = obj(x, `data.nodes[${i}]`);
        return {
          id: str(r.id, `data.nodes[${i}].id`),
          label: str(r.label, `data.nodes[${i}].label`),
          kind: oneOf(r.kind, KINDS, `data.nodes[${i}].kind`),
          branches: arr(r.branches ?? [], `data.nodes[${i}].branches`, 0).map((b, j) => {
            const br = obj(b, `data.nodes[${i}].branches[${j}]`);
            return {
              label: str(br.label, `data.nodes[${i}].branches[${j}].label`),
              to: str(br.to, `data.nodes[${i}].branches[${j}].to`),
            };
          }),
        };
      }),
    };
  },
  check(d) {
    const ids = d.nodes.map((n) => n.id);
    const edges = d.nodes.flatMap((n) => n.branches.map((b) => ({ from: n.id, to: b.to })));
    const { depth, issues: treeIssues } = walk(d);
    const leaves = d.nodes.filter((n) => n.branches.length === 0);
    const issues: IntegrityIssue[] = [
      ...uniqueLabels(ids, "node ids"),
      ...edgesResolve(ids, edges),
      ...treeIssues,
      ...minItems(leaves.length, 3, "outcomes"),
      ...maxItems(leaves.length, 9, "outcomes"),
    ];
    for (const n of d.nodes) {
      if (n.kind === "condition") {
        if (n.branches.length < 2) issues.push({ rule: "branches-complete", message: `condition ${n.id} names ${n.branches.length} branch(es); at least two are needed` });
        issues.push(...uniqueLabels(n.branches.map((b) => b.label), `branch labels of ${n.id}`));
      } else if (n.branches.length > 0) {
        issues.push({ rule: "outcome-terminal", message: `outcome ${n.id} must not have branches` });
      }
    }
    for (const n of d.nodes) {
      if (n.branches.length === 0 && n.kind === "condition") issues.push({ rule: "branches-complete", message: `condition ${n.id} is a leaf` });
    }
    const deepest = Math.max(0, ...depth.values());
    if (deepest > MAX_DEPTH) issues.push({ rule: "max-depth", message: `depth ${deepest} exceeds the legible maximum of ${MAX_DEPTH}` });
    if (d.highlightOutcomeId !== undefined && !d.nodes.some((n) => n.id === d.highlightOutcomeId && n.kind === "outcome")) {
      issues.push({ rule: "highlight-resolves", message: `highlighted outcome ${d.highlightOutcomeId} is not a declared outcome` });
    }
    return issues;
  },
  render(h, d) {
    const A = h.area;
    const byId = new Map(d.nodes.map((n) => [n.id, n]));
    const { depth } = walk(d);
    const maxDepth = Math.max(...depth.values());
    const cols = maxDepth + 1;
    const gap = 0.62;
    const pitch = (A.w + gap) / cols;
    const boxW = pitch - gap;

    // Leaf rows in depth-first order; internal nodes centre on their branches.
    const leafCount = d.nodes.filter((n) => n.branches.length === 0).length;
    const topPad = 0.34;
    const rowH = (A.h - topPad) / leafCount;

    const cy = new Map<string, number>();
    let leaf = 0;
    const place = (id: string): number => {
      const n = byId.get(id);
      if (!n) return 0;
      let y: number;
      if (n.branches.length === 0) {
        y = A.y + topPad + rowH * (leaf + 0.5);
        leaf += 1;
      } else {
        const ys = n.branches.map((b) => place(b.to));
        y = (ys[0] + ys[ys.length - 1]) / 2;
      }
      cy.set(id, y);
      return y;
    };
    place(d.nodes[0].id);

    // Use the vertical space available at each depth, rather than forcing every
    // condition into the smallest terminal box in the whole tree.
    const heightOf = (id: string): number => {
      const peers = d.nodes.filter((n) => depth.get(n.id) === depth.get(id)).map((n) => cy.get(n.id)!).sort((a, b) => a - b);
      const minGap = peers.length > 1 ? Math.min(...peers.slice(1).map((y, i) => y - peers[i])) : 1.1;
      return Math.min(0.92, minGap - 0.1, 2 * (cy.get(id)! - A.y - topPad), 2 * (A.y + A.h - cy.get(id)!));
    };

    // Highlighted route: root to the chosen outcome.
    const onPath = new Set<string>();
    if (d.highlightOutcomeId) {
      const parent = new Map<string, string>();
      for (const n of d.nodes) for (const b of n.branches) parent.set(b.to, n.id);
      let cur: string | undefined = d.highlightOutcomeId;
      while (cur !== undefined) {
        onPath.add(cur);
        cur = parent.get(cur);
      }
    }

    // Legend
    h.shape("legend-path-key", "legend", h.shapes.rect, { x: A.x, y: A.y + 0.07, w: 0.3, h: 0.04, fill: { color: C.accent }, line: { color: C.accent, width: 0 } });
    h.text("legend-path-label", "legend", "Route to the example outcome", { x: A.x + 0.4, y: A.y, w: 2.6, h: 0.26, fontSize: 11, color: C.ink });
    h.text("legend-kind", "legend", "Rounded boxes: conditions · square boxes: outcomes", {
      x: A.x + A.w - 4.5, y: A.y, w: 4.5, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    const xOf = (id: string) => A.x + (depth.get(id) ?? 0) * pitch;
    // Edges: neutral first, then the highlighted route on top.
    for (const pass of [false, true]) {
      d.nodes.forEach((n, i) => {
        n.branches.forEach((b, j) => {
          const accent = onPath.has(n.id) && onPath.has(b.to);
          if (accent !== pass) return;
          const y1 = cy.get(n.id);
          const y2 = cy.get(b.to);
          if (y1 === undefined || y2 === undefined) return;
          const xa = xOf(n.id) + boxW;
          const xb = xOf(b.to);
          const xm = xa + gap / 2;
          const nm = `edge-${i}-${j}`;
          seg(h, `${nm}-a`, xa, y1, xm, y1, false, accent);
          if (Math.abs(y2 - y1) > 0.001) seg(h, `${nm}-b`, xm, y1, xm, y2, false, accent);
          seg(h, `${nm}-c`, xm, y2, xb, y2, true, accent);
        });
      });
    }
    d.nodes.forEach((n, i) => {
      n.branches.forEach((b, j) => {
        const y2 = cy.get(b.to);
        if (y2 === undefined) return;
        const accent = onPath.has(n.id) && onPath.has(b.to);
        h.text(`branch-label-${i}-${j}`, "label", b.label, {
          x: xOf(b.to) - gap + 0.02, y: y2 - 0.27, w: gap - 0.04, h: 0.22,
          fontSize: 11, bold: true, color: accent ? C.accent : C.muted, align: "center", valign: "bottom",
        });
      });
    });

    d.nodes.forEach((n, i) => {
      const y = cy.get(n.id);
      if (y === undefined) return;
      const boxH = heightOf(n.id);
      const hot = onPath.has(n.id);
      const outcome = n.kind === "outcome";
      const final = hot && outcome;
      h.shape(`node-box-${i}`, "data", outcome ? h.shapes.rect : h.shapes.roundRect, {
        x: xOf(n.id), y: y - boxH / 2, w: boxW, h: boxH,
        ...(outcome ? {} : { rectRadius: 0.08 }),
        fill: { color: final ? C.accent : outcome ? C.soft : "FFFFFF" },
        line: { color: final ? C.accent : hot ? C.accent : outcome ? C.neutralDark : C.neutral, width: hot ? 2 : 1.25 },
      });
      h.text(`node-label-${i}`, "label", n.label, {
        x: xOf(n.id) + 0.06, y: y - boxH / 2, w: boxW - 0.12, h: boxH,
        fontSize: 12, bold: outcome, color: final ? "FFFFFF" : C.ink, align: "center", valign: "middle",
      });
    });
  },
};
