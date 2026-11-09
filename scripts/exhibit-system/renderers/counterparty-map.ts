// Equal spokes encode declared links to one focal entity, never flow or value.
import { arr, bool, obj, str } from "../contract";
import { maxItems, minItems, uniqueLabels } from "../integrity";
import { C } from "../primitives";
import type { Renderer } from "../types";

interface CounterpartyData {
  hub: string;
  relationship: string;
  /** false keeps `relationship` in the data and alt text but does not print it above the map. */
  showRelationship?: boolean;
  parties: { label: string; role: string }[];
}
export const counterpartyMap: Renderer<CounterpartyData> = {
  id: "counterparty-map",
  parse(raw) {
    const d = obj(raw, "data");
    return { hub: str(d.hub, "data.hub"), relationship: str(d.relationship, "data.relationship"), ...(d.showRelationship === undefined ? {} : { showRelationship: bool(d.showRelationship, "data.showRelationship") }), parties: arr(d.parties, "data.parties").map((v, i) => {
      const p = obj(v, `data.parties[${i}]`);
      return { label: str(p.label, `data.parties[${i}].label`), role: str(p.role, `data.parties[${i}].role`) };
    }) };
  },
  check(d) {
    const issues = [...minItems(d.parties.length, 4, "counterparties"), ...maxItems(d.parties.length, 8, "counterparties"), ...uniqueLabels([d.hub, ...d.parties.map((p) => p.label)], "entities")];
    for (const p of d.parties) if (p.label.length > 28 || p.role.length > 44) issues.push({ rule: "label-length", message: `${p.label}: use a label of at most 28 characters and a role of at most 44` });
    if (d.hub.length > 28) issues.push({ rule: "label-length", message: "hub label exceeds 28 characters" });
    return issues;
  },
  render(h, d) {
    const a = h.area;
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2 + 0.13;
    const rx = a.w / 2 - 1.45, ry = a.h / 2 - 0.57;
    if (d.showRelationship !== false) h.text("link-meaning", "legend", d.relationship, { x: a.x, y: a.y, w: a.w, h: 0.27, fontSize: 11, color: C.muted });
    const positions = d.parties.map((_, i) => {
      const angle = -Math.PI / 2 + 2 * Math.PI * i / d.parties.length;
      return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
    });
    positions.forEach((p, i) => {
      h.line(`link-${i}`, "data", { x: Math.min(cx, p.x), y: Math.min(cy, p.y), w: Math.abs(p.x - cx), h: Math.abs(p.y - cy), flipH: p.x < cx, flipV: p.y < cy,
        line: { color: C.neutral, width: 1 } });
    });
    positions.forEach((p, i) => {
      h.shape(`label-background-${i}`, "label", h.shapes.rect, { x: p.x - 1.3, y: p.y - 0.34, w: 2.6, h: 0.68, fill: { color: C.paper }, line: { color: C.paper, width: 0 } });
      h.text(`party-${i}`, "label", [{ text: d.parties[i].label + "\n", options: { bold: true, fontSize: 13 } }, { text: d.parties[i].role, options: { fontSize: 11, color: C.muted } }], { x: p.x - 1.3, y: p.y - 0.3, w: 2.6, h: 0.64, align: "center", valign: "middle" });
    });
    h.shape("hub", "data", h.shapes.ellipse, { x: cx - 1.3, y: cy - 0.47, w: 2.6, h: 0.94, fill: { color: C.dark }, line: { color: C.dark, width: 1 } });
    h.text("hub-label", "label", d.hub, { x: cx - 1.15, y: cy - 0.3, w: 2.3, h: 0.6, fontSize: 16, bold: true, color: C.paper, align: "center", valign: "middle" });
  },
};
