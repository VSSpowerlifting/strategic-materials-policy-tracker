// Optional research cover added for FI003 draft 1.0. A research spec may carry a
// `cover`; parseCover enforces its length limits, evidence references and ledger
// rules. A spec without `cover` parses with no cover and keeps the generic cover,
// so earlier decks render unchanged.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { parseCover } from "../scripts/exhibit-system/research-cover";
import { loadResearchDeck } from "../scripts/exhibit-system/research-deck";

const ids = ["S01", "S07"];
const cover = (over: Record<string, unknown> = {}) => ({
  series: "SMPT / FINANCIAL INTELLIGENCE 003",
  title: "MP Materials'\n10X Financing",
  subtitle: "Cash, Covenants, and Construction Risk",
  dek: "A short dek.",
  byline: ["Author", "Research draft", "Evidence to a date"],
  attribution: "Independent research.",
  evidence_refs: ["S01", "S07"],
  ledger: {
    heading: "LEDGER",
    unit: "USD million, one scale",
    key: "Dashed: lapsed.",
    rows: [
      { label: "Commitment", value: 1000, valueText: "≥ $1,000m", status: "Expired undrawn", treatment: "lapsed" },
      { label: "Facility", value: 275, valueText: "$275m", status: "In use for letters of credit", treatment: "committed", part: { value: 72, label: "Letters of credit" } },
    ],
  },
  ...over,
});

test("research cover: a valid cover parses with its ledger", () => {
  const c = parseCover(cover(), "cover", ids);
  assert.equal(c.ledger?.rows.length, 2);
  assert.equal(c.ledger?.rows[1].part?.value, 72);
  assert.equal(c.context, undefined);
});

test("research cover: rejects an unresolved evidence reference", () => {
  assert.throws(() => parseCover(cover({ evidence_refs: ["S99"] }), "cover", ids), /unresolved evidence reference S99/);
});

test("research cover: enforces text limits", () => {
  assert.throws(() => parseCover(cover({ title: "x".repeat(41) }), "cover", ids), /cover limit of 40/);
  assert.throws(() => parseCover(cover({ context: "x".repeat(171) }), "cover", ids), /exceeds 170/);
  assert.throws(() => parseCover(cover({ byline: ["a", "b", "c", "d"] }), "cover", ids), /at most 3 lines/);
});

test("research cover: ledger rows are bounded and parts lie inside their row", () => {
  const base = cover() as { ledger: { rows: Record<string, unknown>[] } };
  const row = base.ledger.rows[1];
  const withPart = (v: number) => cover({ ledger: { ...base.ledger, rows: [{ ...row, part: { value: v, label: "Part" } }] } });
  assert.throws(() => parseCover(withPart(275), "cover", ids), /between 0 and the row value/);
  assert.throws(() => parseCover(withPart(0), "cover", ids), /between 0 and the row value/);
  const four = cover({ ledger: { ...base.ledger, rows: [row, row, row, row] } });
  assert.throws(() => parseCover(four, "cover", ids), /at most 3 rows/);
  const bad = cover({ ledger: { ...base.ledger, rows: [{ ...row, treatment: "summed" }] } });
  assert.throws(() => parseCover(bad, "cover", ids));
});

test("research cover: decks without a cover keep the generic cover", () => {
  const v091 = "research/fi003/presentation/v091/spec.json";
  assert.equal(JSON.parse(readFileSync(v091, "utf8")).cover, undefined);
  assert.equal(loadResearchDeck(v091).cover, undefined);
  assert.ok(loadResearchDeck("research/fi003/presentation/v100/spec.json").cover);
});
