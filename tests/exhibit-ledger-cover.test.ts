import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import JSZip from "jszip";
import { LEDGER_GEOMETRY, ledgerDeckTitle, ledgerScale, parseLedgerCover } from "../scripts/exhibit-system/ledger-cover";
import { parseResearchDeck, renderResearchDeck } from "../scripts/exhibit-system/research-deck";
import { loadFixture } from "../scripts/exhibit-system/registry";

// Test-only invented data, never a research product.
const COVER = {
  title: "Ledger cover test",
  subtitle: "Three instruments, one scale",
  dek: "A test-only sentence about three separate instruments.",
  context: "Test-only context.",
  meta: [{ term: "Draft", value: "Test" }, { term: "Evidence to", value: "1 January 2026" }],
  attribution: "Test-only attribution.",
  ledger: {
    heading: "Test ledger",
    unit: "Test units on one scale; not added",
    rows: [
      { label: "Lapsed row", value: 400, valueText: "400", status: "Test status A", treatment: "lapsed", key: "Lapsed" },
      { label: "Received row", value: 300, valueText: "300", status: "Test status B", treatment: "received", key: "Received" },
      { label: "Committed row", value: 100, valueText: "100", status: "Test status C", treatment: "committed", key: "Committed", part: { value: 25, label: "Drawn part" } },
    ],
  },
  evidence_refs: ["E1"],
};
const TITLE = ledgerDeckTitle(COVER);
const IDS = ["E1"];
const clone = () => JSON.parse(JSON.stringify(COVER));

function deck() {
  const fx = loadFixture("dumbbell");
  return {
    classification: "research",
    title: TITLE,
    evidence: [{ id: "E1", url: "https://example.org/test-only", title: "Test-only evidence stub", locator: "Table A" }],
    ledger_cover: clone(),
    slides: [{ pattern: "dumbbell", label: "TEST", exhibit: { title: fx.title, subtitle: fx.subtitle, annotation: fx.annotation, data: fx.data, source: "Test-only evidence stub, Table A", evidence_refs: ["E1"] } }],
  };
}

test("ledger cover parser accepts a valid cover and keeps every row's own treatment", () => {
  const c = parseLedgerCover(clone(), "t", TITLE, IDS);
  assert.deepEqual(c.ledger.rows.map((r) => r.treatment), ["lapsed", "received", "committed"]);
  assert.deepEqual(c.ledger.rows[2].part, { value: 25, label: "Drawn part" });
});

test("ledger cover parser rejects a title mismatch, unresolved refs, bad parts, extra rows and duplicates", () => {
  const badTitle = clone();
  badTitle.subtitle = "Another subtitle";
  assert.throws(() => parseLedgerCover(badTitle, "t", TITLE, IDS), /must equal the deck title/);
  const badRef = clone();
  badRef.evidence_refs = ["missing"];
  assert.throws(() => parseLedgerCover(badRef, "t", TITLE, IDS), /unresolved evidence reference missing/);
  for (const v of [0, 100, 150]) {
    const badPart = clone();
    badPart.ledger.rows[2].part.value = v;
    assert.throws(() => parseLedgerCover(badPart, "t", TITLE, IDS), /strictly between 0 and the row value/);
  }
  const negative = clone();
  negative.ledger.rows[0].value = -1;
  assert.throws(() => parseLedgerCover(negative, "t", TITLE, IDS), /must be positive/);
  const four = clone();
  four.ledger.rows.push({ ...four.ledger.rows[1], label: "Fourth row" });
  assert.throws(() => parseLedgerCover(four, "t", TITLE, IDS), /at most 3 rows/);
  const one = clone();
  one.ledger.rows = one.ledger.rows.slice(0, 1);
  assert.throws(() => parseLedgerCover(one, "t", TITLE, IDS), /at least 2/);
  const dup = clone();
  dup.ledger.rows[1].label = dup.ledger.rows[0].label;
  assert.throws(() => parseLedgerCover(dup, "t", TITLE, IDS), /duplicate row label/);
  const badTreatment = clone();
  badTreatment.ledger.rows[0].treatment = "total";
  assert.throws(() => parseLedgerCover(badTreatment, "t", TITLE, IDS), /treatment/);
  const longStatus = clone();
  longStatus.ledger.rows[0].status = "x".repeat(73);
  assert.throws(() => parseLedgerCover(longStatus, "t", TITLE, IDS), /cover limit of 72/);
});

test("ledger scale draws every row and part on one inches-per-unit scale", () => {
  const c = parseLedgerCover(clone(), "t", TITLE, IDS);
  const s = ledgerScale(c.ledger.rows);
  assert.equal(s.perUnit, LEDGER_GEOMETRY.scaleW / 400);
  assert.equal(s.bars[0].w, LEDGER_GEOMETRY.scaleW);
  c.ledger.rows.forEach((r, i) => assert.ok(Math.abs(s.bars[i].w - r.value * s.perUnit) < 1e-12));
  assert.ok(Math.abs(s.bars[2].partW! - 25 * s.perUnit) < 1e-12);
  assert.equal(s.bars[0].partW, undefined);
});

test("a research deck takes ledger_cover alone, never with cover_lines or cover", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-ledger-parse-"));
  try {
    assert.equal(parseResearchDeck(deck(), "test", dir).ledger_cover?.ledger.rows.length, 3);
    assert.throws(() => parseResearchDeck({ ...deck(), cover_lines: ["x"] }, "test", dir), /give only one cover/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("ledger cover renders native editable shapes with each amount as text and passes the verifier", async () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-ledger-render-"));
  try {
    const input = join(dir, "spec.json");
    writeFileSync(input, JSON.stringify(deck()));
    const out = join(dir, "ledger.pptx");
    const manifestFile = await renderResearchDeck(input, out);
    const zip = await JSZip.loadAsync(readFileSync(out));
    const cover = await zip.file("ppt/slides/slide1.xml")!.async("string");
    assert.doesNotMatch(cover, /<p:pic>/, "the ledger cover carries no raster");
    for (const t of ["Ledger cover test", "Lapsed row", "Received row", "Committed row", "Test status C", "Drawn part"]) {
      assert.match(cover, new RegExp(`<a:t>[^<]*${t}`), t);
    }
    assert.match(cover, /prstDash val="dash"/, "the lapsed row keeps a dashed outline");
    const ok = spawnSync("python3", ["-B", "scripts/exhibit-system/verify_editability.py", "--deck", out, "--manifest", manifestFile], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
