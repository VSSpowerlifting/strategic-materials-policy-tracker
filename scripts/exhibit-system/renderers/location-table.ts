// K5 location-table — the plain alternative to a decorative map: sites listed
// by jurisdiction in a native table, with group header rows. No coordinates,
// no map graphic, no total across capacity units.
import { arr, obj, oneOf, optNum, str } from "../contract";
import { inVocabulary, maxItems, minItems, STATUS_TAXONOMY, uniqueLabels } from "../integrity";
import { C, fmt, HEAD_CELL } from "../primitives";
import type { IntegrityIssue, Renderer, TableCell } from "../types";

export interface LocationTableData {
  sites: {
    id: string;
    jurisdiction: string;
    region: string;
    stage: string;
    status: string;
    capacity: number | null;
    unit: string;
  }[];
}

export const locationTable: Renderer<LocationTableData> = {
  id: "location-table",
  parse(d) {
    const o = obj(d, "data");
    return {
      sites: arr(o.sites, "data.sites").map((x, i) => {
        const p = `data.sites[${i}]`;
        const r = obj(x, p);
        return {
          id: str(r.id, `${p}.id`),
          jurisdiction: str(r.jurisdiction, `${p}.jurisdiction`),
          region: str(r.region, `${p}.region`),
          stage: str(r.stage, `${p}.stage`),
          status: oneOf(r.status, STATUS_TAXONOMY, `${p}.status`),
          capacity: optNum(r.capacity, `${p}.capacity`) ?? null,
          unit: str(r.unit, `${p}.unit`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.sites.length, 3, "sites"),
      ...maxItems(d.sites.length, 10, "sites"),
      ...uniqueLabels(d.sites.map((s) => s.id), "site ids"),
      ...inVocabulary(d.sites.map((s) => s.status), STATUS_TAXONOMY, "status"),
      ...maxItems(new Set(d.sites.map((s) => s.jurisdiction)).size, 4, "jurisdiction groups"),
    ];
    for (let i = 1; i < d.sites.length; i++) {
      const a = d.sites[i - 1];
      const b = d.sites[i];
      if (a.jurisdiction > b.jurisdiction || (a.jurisdiction === b.jurisdiction && a.id > b.id)) {
        issues.push({ rule: "sorted-order", message: `sites must be sorted by jurisdiction then id; ${b.id} follows ${a.id}` });
        break;
      }
    }
    d.sites.forEach((s) => {
      if (s.capacity !== null && s.capacity < 0) issues.push({ rule: "magnitude-nonnegative", message: `${s.id} capacity is negative` });
      if (s.region.length > 22 || s.stage.length > 20 || s.unit.length > 26) {
        issues.push({ rule: "cell-length", message: `${s.id}: region ≤22, stage ≤20, unit ≤26 characters` });
      }
    });
    return issues;
  },
  render(h, d) {
    const { x, y, w } = h.area;
    const widths = [1.0, 1.75, 1.5, 1.45, 1.0, 2.05];
    const scaleK = w / widths.reduce((a, b) => a + b, 0);
    const colW = widths.map((v) => v * scaleK);
    const rule = { type: "solid", pt: 0.5, color: C.border };
    const none = { type: "none" };
    const hdr = (text: string, align: "left" | "right" = "left"): TableCell => ({
      text, options: { ...HEAD_CELL, align },
    });
    const rows: TableCell[][] = [[hdr("Site"), hdr("Region"), hdr("Stage"), hdr("Status"), hdr("Capacity", "right"), hdr("Capacity unit")]];
    const groups = [...new Set(d.sites.map((s) => s.jurisdiction))];
    for (const g of groups) {
      const members = d.sites.filter((s) => s.jurisdiction === g);
      rows.push([
        {
          text: `${g}  ·  ${members.length} ${members.length === 1 ? "site" : "sites"}`,
          options: { colspan: 6, bold: true, fontSize: 11, color: C.ink, fill: { color: C.soft }, valign: "middle", border: [rule, none, rule, none] },
        },
      ]);
      for (const s of members) {
        const cell = (text: string, extra: Record<string, unknown> = {}): TableCell => ({
          text, options: { fontSize: 11, valign: "middle", fill: { color: C.paper }, border: [none, none, rule, none], ...extra },
        });
        rows.push([
          cell(s.id, { bold: true }),
          cell(s.region),
          cell(s.stage),
          cell(s.status.charAt(0).toUpperCase() + s.status.slice(1)),
          s.capacity === null ? cell("Not stated", { align: "right", color: C.muted }) : cell(fmt(s.capacity), { align: "right" }),
          cell(s.unit, { color: C.muted }),
        ]);
      }
    }
    h.table("location-table", rows, { x, y, w, colW, rowH: Math.min(0.32, h.area.h / rows.length), fontSize: 11, margin: [0.03, 0.08, 0.03, 0.08] });
  },
};
