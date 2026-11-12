// J5 dependency-network — a small directed network of dependencies between
// organisations, projects and programmes. Columns are computed layers (longest
// path from a source); order within a column is a deterministic barycentre
// sweep; one highlighted path is drawn in the accent. Native shapes; geometry
// and text are editable, nothing is data-bound.
import { arr, obj, oneOf, strList, str } from "../contract";
import { edgesResolve, inVocabulary, maxItems, minItems, uniqueLabels } from "../integrity";
import { C } from "../primitives";
import type { IntegrityIssue, RenderHelpers, Renderer } from "../types";

const TYPES = ["Organisation", "Project", "Programme"] as const;
type NodeType = (typeof TYPES)[number];

export interface DependencyNetworkData {
  edgeMeaning: string;
  nodes: { id: string; label: string; type: NodeType }[];
  edges: { from: string; to: string }[];
  /** Node ids, in order, along one highlighted path. */
  highlightPath: string[];
}

/** Longest-path layer per node; null when the graph has a cycle. */
function layerOf(d: DependencyNetworkData): Map<string, number> | null {
  const indeg = new Map(d.nodes.map((n) => [n.id, 0]));
  for (const e of d.edges) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  const layer = new Map<string, number>();
  const queue = d.nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
  queue.forEach((id) => layer.set(id, 0));
  let seen = 0;
  while (queue.length) {
    const id = queue.shift() as string;
    seen += 1;
    for (const e of d.edges) {
      if (e.from !== id) continue;
      layer.set(e.to, Math.max(layer.get(e.to) ?? 0, (layer.get(id) ?? 0) + 1));
      indeg.set(e.to, (indeg.get(e.to) ?? 0) - 1);
      if (indeg.get(e.to) === 0) queue.push(e.to);
    }
  }
  return seen === d.nodes.length ? layer : null;
}

/** Order nodes within each layer by barycentre sweeps (stable, deterministic). */
function orderLayers(d: DependencyNetworkData, layer: Map<string, number>): string[][] {
  const depth = Math.max(...layer.values()) + 1;
  const cols: string[][] = Array.from({ length: depth }, () => []);
  for (const n of d.nodes) cols[layer.get(n.id) ?? 0].push(n.id);
  const idx = new Map<string, number>();
  const refresh = () => cols.forEach((c) => c.forEach((id, i) => idx.set(id, i)));
  refresh();
  const sweep = (from: number, to: number, step: number, dir: "in" | "out") => {
    for (let l = from; l !== to; l += step) {
      const key = new Map<string, number>();
      for (const id of cols[l]) {
        const nb = d.edges
          .filter((e) => (dir === "in" ? e.to === id : e.from === id))
          .map((e) => idx.get(dir === "in" ? e.from : e.to) ?? 0);
        key.set(id, nb.length ? nb.reduce((a, b) => a + b, 0) / nb.length : (idx.get(id) ?? 0));
      }
      cols[l].sort((a, b) => (key.get(a) ?? 0) - (key.get(b) ?? 0) || (idx.get(a) ?? 0) - (idx.get(b) ?? 0));
      refresh();
    }
  };
  for (let k = 0; k < 4; k++) {
    sweep(1, depth, 1, "in");
    sweep(depth - 2, -1, -1, "out");
  }
  return cols;
}

export const dependencyNetwork: Renderer<DependencyNetworkData> = {
  id: "dependency-network",
  parse(d) {
    const o = obj(d, "data");
    return {
      edgeMeaning: str(o.edgeMeaning, "data.edgeMeaning"),
      nodes: arr(o.nodes, "data.nodes").map((x, i) => {
        const r = obj(x, `data.nodes[${i}]`);
        return {
          id: str(r.id, `data.nodes[${i}].id`),
          label: str(r.label, `data.nodes[${i}].label`),
          type: oneOf(r.type, TYPES, `data.nodes[${i}].type`),
        };
      }),
      edges: arr(o.edges, "data.edges").map((x, i) => {
        const r = obj(x, `data.edges[${i}]`);
        return { from: str(r.from, `data.edges[${i}].from`), to: str(r.to, `data.edges[${i}].to`) };
      }),
      highlightPath: strList(o.highlightPath, "data.highlightPath", 2),
    };
  },
  check(d) {
    const ids = d.nodes.map((n) => n.id);
    const issues: IntegrityIssue[] = [
      ...minItems(d.nodes.length, 4, "nodes"),
      ...maxItems(d.nodes.length, 12, "nodes"),
      ...maxItems(d.edges.length, 20, "edges"),
      ...uniqueLabels(ids, "node ids"),
      ...uniqueLabels(d.nodes.map((n) => n.label), "node labels"),
      ...inVocabulary(d.nodes.map((n) => n.type), TYPES, "node types"),
      ...edgesResolve(ids, d.edges),
    ];
    const seen = new Set<string>();
    for (const e of d.edges) {
      const k = `${e.from}>${e.to}`;
      if (seen.has(k)) issues.push({ rule: "no-duplicate-edges", message: `edge ${e.from}→${e.to} is declared twice` });
      seen.add(k);
    }
    for (let i = 1; i < d.highlightPath.length; i++) {
      if (!seen.has(`${d.highlightPath[i - 1]}>${d.highlightPath[i]}`)) {
        issues.push({ rule: "path-follows-edges", message: `highlighted step ${d.highlightPath[i - 1]}→${d.highlightPath[i]} is not a declared edge` });
      }
    }
    if (issues.some((i) => i.rule === "edges-resolve")) return issues;
    const layer = layerOf(d);
    if (!layer) {
      issues.push({ rule: "no-cycles", message: "the dependency graph contains a cycle" });
    } else {
      for (const e of d.edges) {
        if ((layer.get(e.to) ?? 0) - (layer.get(e.from) ?? 0) !== 1) {
          issues.push({ rule: "edges-adjacent-layers", message: `edge ${e.from}→${e.to} skips a layer; add the intermediate node` });
        }
      }
    }
    return issues;
  },
  render(h, d) {
    const A = h.area;
    const layer = layerOf(d);
    if (!layer) throw new Error("dependency-network: cyclic graph reached render");
    const cols = orderLayers(d, layer);
    const maxRows = Math.max(...cols.map((c) => c.length));
    const nodeW = 2.0;
    const gap = (A.w - cols.length * nodeW) / Math.max(cols.length - 1, 1);
    const top = A.y + 0.42;
    const blockH = A.h - 0.42;
    const slot = blockH / maxRows;
    const nodeH = Math.min(0.66, slot - 0.2);
    const pos = new Map<string, { x: number; cy: number }>();
    cols.forEach((c, l) => {
      c.forEach((id, j) => {
        pos.set(id, { x: A.x + l * (nodeW + gap), cy: top + slot * (j + (maxRows - c.length) / 2 + 0.5) });
      });
    });

    const pathEdges = new Set<string>();
    for (let i = 1; i < d.highlightPath.length; i++) pathEdges.add(`${d.highlightPath[i - 1]}>${d.highlightPath[i]}`);
    const onPath = new Set(d.highlightPath);

    // Legend
    h.shape("legend-path-key", "legend", h.shapes.rect, { x: A.x, y: A.y + 0.07, w: 0.3, h: 0.04, fill: { color: C.accent }, line: { color: C.accent, width: 0 } });
    h.text("legend-path-label", "legend", "Highlighted path", { x: A.x + 0.4, y: A.y, w: 1.6, h: 0.26, fontSize: 11, color: C.ink });
    h.text("legend-edge", "legend", d.edgeMeaning, {
      x: A.x + 2.2, y: A.y, w: A.w - 2.2, h: 0.26, fontSize: 11, color: C.muted, align: "right",
    });

    // Port offsets spread each node's edges along its side, ordered by the far end's height.
    const portY = (id: string, dir: "out" | "in", other: string): number => {
      const me = pos.get(id);
      if (!me) return 0;
      const list = d.edges
        .filter((e) => (dir === "out" ? e.from === id : e.to === id))
        .map((e) => (dir === "out" ? e.to : e.from))
        .sort((a, b) => (pos.get(a)?.cy ?? 0) - (pos.get(b)?.cy ?? 0));
      const m = list.length;
      const step = Math.min(0.2, (nodeH * 0.6) / Math.max(m, 1));
      return me.cy + (list.indexOf(other) - (m - 1) / 2) * step;
    };
    for (const pass of [false, true]) {
      d.edges.forEach((e, i) => {
        const hot = pathEdges.has(`${e.from}>${e.to}`);
        if (hot !== pass) return;
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return;
        const x1 = a.x + nodeW;
        const y1 = portY(e.from, "out", e.to);
        const x2 = b.x;
        const y2 = portY(e.to, "in", e.from);
        h.line(`edge-${i}`, "data", {
          x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
          flipH: x2 < x1, flipV: y2 < y1,
          line: { color: hot ? C.accent : C.neutral, width: hot ? 2.25 : 1.25, endArrowType: "triangle" },
        });
      });
    }

    const shapeFor = (t: NodeType, hh: RenderHelpers): string =>
      t === "Organisation" ? hh.shapes.rect : t === "Project" ? hh.shapes.roundRect : hh.shapes.hexagon;
    d.nodes.forEach((n, i) => {
      const p = pos.get(n.id);
      if (!p) return;
      const hot = onPath.has(n.id);
      h.shape(`node-box-${i}`, "data", shapeFor(n.type, h), {
        x: p.x, y: p.cy - nodeH / 2, w: nodeW, h: nodeH,
        ...(n.type === "Project" ? { rectRadius: 0.1 } : {}),
        fill: { color: C.plate }, line: { color: hot ? C.accent : C.neutral, width: hot ? 2.25 : 1.25 },
      });
      h.text(`node-label-${i}`, "label", [
        { text: n.type.toUpperCase(), options: { fontSize: 11, bold: true, color: C.muted, charSpacing: 1, breakLine: true } },
        { text: n.label, options: { fontSize: 12, bold: true, color: C.ink } },
      ], { x: p.x + (n.type === "Programme" ? 0.2 : 0.08), y: p.cy - nodeH / 2, w: nodeW - (n.type === "Programme" ? 0.4 : 0.16), h: nodeH, align: "center", valign: "middle" });
    });
  },
};
