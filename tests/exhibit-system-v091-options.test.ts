// Optional role-matrix ledger cell length added for FI003 draft 0.9.1. `cellText: "sentence"`
// allows explanatory cells up to 64 characters and taller rows; omitting it parses to
// undefined and keeps the 16-character qualifier limit, so earlier output is unchanged.
import test from "node:test";
import assert from "node:assert/strict";

import { RENDERERS } from "../scripts/exhibit-system/renderers";

const rm = RENDERERS.get("role-matrix")!;
const rules = (raw: unknown) => rm.check(rm.parse(raw)).map((i) => i.rule);

const sixty = "May borrow up to the remaining capacity if draw terms are met";
const base = (cells: string, layout: Record<string, unknown>) => ({
  roles: ["With revolver", "Equity only"],
  layout: { rowHeader: "Situation", showCounts: false, style: "ledger", ...layout },
  orgs: [
    { label: "Overrun", cells: [{ qualifier: cells }, { qualifier: "New raise" }] },
    { label: "Unused cost", cells: [{ qualifier: "Fee" }, { qualifier: "None" }] },
    { label: "Repayment", cells: [{ qualifier: "By maturity" }, { qualifier: "None" }] },
  ],
});

test("role-matrix cellText sentence: accepts a 60-character cell", () => {
  assert.ok(sixty.length >= 60 && sixty.length <= 64);
  const d = rm.parse(base(sixty, { cellText: "sentence" })) as { layout?: { cellText?: string } };
  assert.equal(d.layout?.cellText, "sentence");
  assert.deepEqual(rm.check(d as never), []);
});

test("role-matrix cellText: short mode and the default keep the 16-character limit", () => {
  const seventeen = "Seventeen chars!!";
  assert.equal(seventeen.length, 17);
  assert.ok(rules(base(seventeen, { cellText: "short" })).length > 0);
  assert.ok(rules(base(seventeen, {})).length > 0);
  assert.ok(rules(base("x".repeat(65), { cellText: "sentence" })).length > 0);
});

test("role-matrix cellText: ledger-only, unknown values throw, omitted stays undefined", () => {
  const marks = { ...base("Fee", {}), layout: { rowHeader: "Situation", keyText: "k", cellText: "sentence" } };
  assert.ok(rules(marks).includes("layout-option"));
  assert.throws(() => rm.parse(base("Fee", { cellText: "paragraph" })));
  assert.equal((rm.parse(base("Fee", {})) as { layout?: { cellText?: string } }).layout?.cellText, undefined);
});
