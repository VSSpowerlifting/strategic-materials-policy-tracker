// K3 option-profile — 2 to 4 options as columns of short structured facts.
// Native table; every cell has a strict character limit so no row reflows.
import { arr, isoDate, obj, oneOf, str } from "../contract";
import { dateOrder, inVocabulary, maxItems, minItems, STATUS_TAXONOMY, uniqueLabels } from "../integrity";
import { C, HEAD_CELL } from "../primitives";
import type { IntegrityIssue, Renderer, TableCell } from "../types";

export interface OptionProfileData {
  options: {
    label: string;
    instrument: string;
    status: string;
    start: string;
    end: string;
    conditions: string;
    open: string;
  }[];
}

export const LIMITS = { label: 26, instrument: 48, conditions: 64, open: 64 } as const;

export const optionProfile: Renderer<OptionProfileData> = {
  id: "option-profile",
  parse(d) {
    const o = obj(d, "data");
    return {
      options: arr(o.options, "data.options").map((x, i) => {
        const p = `data.options[${i}]`;
        const r = obj(x, p);
        return {
          label: str(r.label, `${p}.label`),
          instrument: str(r.instrument, `${p}.instrument`),
          status: oneOf(r.status, STATUS_TAXONOMY, `${p}.status`),
          start: isoDate(r.start, `${p}.start`),
          end: isoDate(r.end, `${p}.end`),
          conditions: str(r.conditions, `${p}.conditions`),
          open: str(r.open, `${p}.open`),
        };
      }),
    };
  },
  check(d) {
    const issues: IntegrityIssue[] = [
      ...minItems(d.options.length, 2, "options"),
      ...maxItems(d.options.length, 4, "options"),
      ...uniqueLabels(d.options.map((o) => o.label), "option labels"),
      ...inVocabulary(d.options.map((o) => o.status), STATUS_TAXONOMY, "status"),
    ];
    d.options.forEach((o) => {
      issues.push(...dateOrder(o.start, o.end, `${o.label} timing`));
      (["label", "instrument", "conditions", "open"] as const).forEach((k) => {
        if (o[k].length > LIMITS[k]) {
          issues.push({ rule: "cell-length", message: `${o.label}.${k} is ${o[k].length} characters; limit ${LIMITS[k]}` });
        }
      });
    });
    return issues;
  },
  render(h, d) {
    const { x, y, w } = h.area;
    const labelW = 1.55;
    const colW = (w - labelW) / d.options.length;
    const rule = { type: "solid", pt: 0.75, color: C.border };
    const none = { type: "none" };
    const hdr = (text: string, align: "left" | "center" = "left"): TableCell => ({
      text, options: { ...HEAD_CELL, align },
    });
    const fields: [string, (o: OptionProfileData["options"][number]) => string][] = [
      ["Instrument", (o) => o.instrument],
      ["Status", (o) => o.status.charAt(0).toUpperCase() + o.status.slice(1)],
      ["Timing", (o) => `${o.start} to ${o.end}`],
      ["Conditions", (o) => o.conditions],
      ["Open question", (o) => o.open],
    ];
    const rows: TableCell[][] = [
      [hdr("Option"), ...d.options.map((o) => hdr(o.label))],
      ...fields.map(([name, get], i): TableCell[] => [
        { text: name, options: { fontSize: 11, bold: true, color: C.muted, valign: "middle", fill: { color: C.paper }, border: [none, none, rule, none] } },
        ...d.options.map((o): TableCell => ({
          text: get(o),
          options: {
            fontSize: 11, color: C.ink, valign: "middle", fill: { color: i % 2 ? C.soft : C.paper },
            margin: [0.05, 0.12, 0.05, 0.12], border: [none, none, rule, none], bold: name === "Status",
          },
        })),
      ]),
    ];
    h.table("profile-table", rows, {
      x, y, w, colW: [labelW, ...d.options.map(() => colW)], rowH: [0.42, ...fields.map(() => 0.58)], fontSize: 11,
    });
  },
};
