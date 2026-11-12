// Optional renderer extensions added for FI003 draft 0.9: waterfall emphasis, stacked-bar
// source order and legend widths, criterion-matrix text display, condition-tree label
// placement and convention note, role-matrix ledger, counterparty relationship caption,
// timeline / milestone-strip convention notes and the interpretation heading. Every option
// is opt-in: omitting it parses to undefined, so earlier output is unchanged.
import test from "node:test";
import assert from "node:assert/strict";

import { RENDERERS } from "../scripts/exhibit-system/renderers";

const get = (id: string) => RENDERERS.get(id)!;
const rules = (id: string, raw: unknown) => {
  const r = get(id);
  return r.check(r.parse(raw)).map((i) => i.rule);
};

const bridge = {
  unit: "USD million",
  dp: 0,
  start: { label: "Start", value: 100 },
  steps: [{ label: "Up", delta: 30 }, { label: "Down", delta: -10 }],
  end: { label: "End", value: 120 },
};

test("waterfall emphasis: resolves against step labels; omitted stays undefined", () => {
  const wf = get("waterfall");
  assert.deepEqual(wf.check(wf.parse({ ...bridge, emphasis: ["Up"] })), []);
  assert.ok(rules("waterfall", { ...bridge, emphasis: ["Sideways"] }).includes("accent-resolves"));
  // Start and end are levels, not steps, so they cannot be emphasised.
  assert.ok(rules("waterfall", { ...bridge, emphasis: ["Start"] }).includes("accent-resolves"));
  assert.equal((wf.parse(bridge) as { emphasis?: string[] }).emphasis, undefined);
});

const bars = {
  unit: "USD million",
  dp: 0,
  components: ["Letters of credit", "Remaining capacity"],
  accent: "Remaining capacity",
  rows: [
    { label: "31 Dec 2025", values: [40, 235] },
    { label: "30 Jun 2026", values: [72, 203] },
    { label: "30 Sep 2026", values: [72, 203] },
  ],
};

test("stacked-bar keepOrder and legendWidths: parse, and a width count mismatch is flagged", () => {
  const sb = get("stacked-bar");
  const d = sb.parse({ ...bars, keepOrder: true, legendWidths: [1.75, 2.0] }) as { keepOrder?: boolean; legendWidths?: number[] };
  assert.equal(d.keepOrder, true);
  assert.deepEqual(d.legendWidths, [1.75, 2.0]);
  assert.deepEqual(sb.check(d as never), []);
  assert.ok(rules("stacked-bar", { ...bars, legendWidths: [1.75] }).length > 0);
  const plain = sb.parse(bars) as { keepOrder?: boolean; legendWidths?: number[] };
  assert.equal(plain.keepOrder, undefined);
  assert.equal(plain.legendWidths, undefined);
});

const matrix = {
  options: ["A", "B"],
  accent: "B",
  criteria: [
    { label: "Funding certain", marks: ["Partly", "Meets"] },
    { label: "No dilution", marks: ["Meets", "Does not"] },
  ],
};

test("criterion-matrix display: text parses and checks clean; unknown values throw", () => {
  const cm = get("criterion-matrix");
  const d = cm.parse({ ...matrix, display: "text" }) as { display?: string };
  assert.equal(d.display, "text");
  assert.deepEqual(cm.check(d as never), []);
  assert.throws(() => cm.parse({ ...matrix, display: "glyphs" }));
  assert.equal((cm.parse(matrix) as { display?: string }).display, undefined);
});

const tree = {
  nodes: [
    { id: "n1", label: "Q1", kind: "condition", branches: [{ label: "No", to: "o1" }, { label: "Yes", to: "n2" }] },
    { id: "n2", label: "Q2", kind: "condition", branches: [{ label: "No", to: "o2" }, { label: "Yes", to: "o3" }] },
    { id: "o1", label: "A", kind: "outcome", branches: [] },
    { id: "o2", label: "B", kind: "outcome", branches: [] },
    { id: "o3", label: "C", kind: "outcome", branches: [] },
  ],
};

test("condition-tree labelClear and conventionNote: parse as booleans; omitted stay undefined", () => {
  const ct = get("condition-tree");
  const d = ct.parse({ ...tree, labelClear: true, conventionNote: false }) as { labelClear?: boolean; conventionNote?: boolean };
  assert.equal(d.labelClear, true);
  assert.equal(d.conventionNote, false);
  assert.deepEqual(ct.check(d as never), []);
  assert.throws(() => ct.parse({ ...tree, labelClear: "yes" }));
  const plain = ct.parse(tree) as { labelClear?: boolean; conventionNote?: boolean };
  assert.equal(plain.labelClear, undefined);
  assert.equal(plain.conventionNote, undefined);
});

const roles = {
  roles: ["Adviser", "Underwriting"],
  orgs: [
    { label: "Bank A", cells: [{ qualifier: "Own account" }, { qualifier: "Joint largest" }] },
    { label: "Bank B", cells: [null, { qualifier: "Smaller share" }] },
    { label: "Bank C", cells: [null, { qualifier: "Smaller share" }] },
  ],
};

test("role-matrix ledger: keyText optional, emphasis column must be a role, ledger-only options flagged elsewhere", () => {
  const rm = get("role-matrix");
  const ledger = { ...roles, layout: { rowHeader: "Bank", showCounts: false, style: "ledger", emptyText: "Not named", emphasisColumn: "Underwriting" } };
  const d = rm.parse(ledger) as { layout?: { style?: string; keyText: string; emptyText?: string; emphasisColumn?: string } };
  assert.equal(d.layout?.style, "ledger");
  assert.equal(d.layout?.keyText, "");
  assert.equal(d.layout?.emptyText, "Not named");
  assert.deepEqual(rm.check(d as never), []);
  assert.ok(rules("role-matrix", { ...ledger, layout: { ...ledger.layout, emphasisColumn: "Agent" } }).includes("accent-resolves"));
  assert.ok(
    rules("role-matrix", { ...roles, layout: { rowHeader: "Bank", keyText: "k", emptyText: "Not named" } }).includes("layout-option"),
  );
  assert.throws(() => rm.parse({ ...roles, layout: { rowHeader: "Bank", keyText: "k", style: "grid" } }));
  // Without a style, keyText stays required as before.
  assert.throws(() => rm.parse({ ...roles, layout: { rowHeader: "Bank" } }));
});

test("counterparty-map showRelationship: parses false; omitted stays undefined", () => {
  const cp = get("counterparty-map");
  const base = {
    hub: "Hub",
    relationship: "Declared links; spokes carry no value.",
    parties: [{ label: "P1", role: "r1" }, { label: "P2", role: "r2" }, { label: "P3", role: "r3" }],
  };
  assert.equal((cp.parse({ ...base, showRelationship: false }) as { showRelationship?: boolean }).showRelationship, false);
  assert.equal((cp.parse(base) as { showRelationship?: boolean }).showRelationship, undefined);
});

test("timeline and milestone strip conventionNote: parse false; omitted stays undefined", () => {
  const tl = get("two-lane-timeline");
  const lanes = {
    lanes: [
      { name: "Financing", events: [{ label: "Equity priced", date: "2025-07-16", kind: "implementation" }, { label: "Revolver signed", date: "2025-08-25", kind: "effective" }] },
      { name: "Context", events: [{ label: "Apple agreement", date: "2025-07-15", kind: "announcement" }, { label: "Commitment expired", date: "2025-08-26", kind: "implementation" }] },
    ],
  };
  assert.equal((tl.parse({ ...lanes, conventionNote: false }) as { conventionNote?: boolean }).conventionNote, false);
  assert.equal((tl.parse(lanes) as { conventionNote?: boolean }).conventionNote, undefined);

  const ms = get("evidence-milestone-strip");
  const strip = {
    milestones: [
      { label: "Equity priced", date: "2025-07-16", state: "reported" },
      { label: "Revolver signed", date: "2025-08-25", state: "reported" },
      { label: "Illustrative delivery", date: "2027-08-15", state: "targeted" },
    ],
  };
  assert.equal((ms.parse({ ...strip, conventionNote: false }) as { conventionNote?: boolean }).conventionNote, false);
  assert.equal((ms.parse(strip) as { conventionNote?: boolean }).conventionNote, undefined);
});

test("exhibit-with-interpretation notesHeading: parses; omitted stays undefined", () => {
  const ei = get("exhibit-with-interpretation");
  const base = {
    unit: "USD million",
    dp: 1,
    columns: ["USD million"],
    rows: [{ label: "Net equity", values: [724.2] }, { label: "Revolver available", values: [203] }],
    notes: [{ ref: 1, text: "Permanent capital." }, { ref: 2, text: "Conditional capacity." }],
  };
  assert.equal((ei.parse({ ...base, notesHeading: "WHAT EACH FIGURE MEANS" }) as { notesHeading?: string }).notesHeading, "WHAT EACH FIGURE MEANS");
  assert.equal((ei.parse(base) as { notesHeading?: string }).notesHeading, undefined);
});
