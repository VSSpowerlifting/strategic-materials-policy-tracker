import { test } from "node:test";
import assert from "node:assert/strict";

import {
  addDecimals,
  ancestorIds,
  compareDecimals,
  controlClocks,
  controlSpans,
  controlStatusOn,
  descendantIds,
  formatDecimalCompact,
  instrumentChronology,
  isEnded,
  materialInterplay,
  materialLedgerRows,
  legalStanding,
  optionState,
  publicCommitmentRows,
  shortInstrumentLabel,
  summarizeCommitment,
  summarizeControl,
  totalCommitments,
} from "@/lib/capital-control";
import { buildCapitalControlSummary } from "@/lib/capital-control-summary";
import {
  buildDataset,
  controlMeasuresCsv,
  controlStatusHistoryCsv,
  financialCommitmentsCsv,
  financialStatusHistoryCsv,
} from "@/lib/export";
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getEventById,
  getFinancialCommitmentById,
  getSourceById,
} from "@/lib/data";
import { site } from "@/lib/site";
import { CONTROL_MEASURE_TYPES, FINANCIAL_STATUSES } from "@/lib/types";
import type { ControlMeasure, FinancialCommitment } from "@/lib/types";
import type { CurrencyTotal, InstrumentSum } from "@/lib/capital-control";

// --- Fixtures -----------------------------------------------------------------

function fin(id: string, over: Partial<FinancialCommitment> = {}): FinancialCommitment {
  return {
    id,
    eventId: "evt-x",
    relationships: [],
    instrument: "grant",
    valueRole: "commitment",
    capitalSource: "public",
    amount: { value: "100", currency: "USD", qualifier: "exact", amountAsStated: "$100", currencyBasis: "issuer_context" },
    provider: null,
    providerJurisdiction: "us",
    providerOrgIds: [],
    legalAuthority: null,
    programmeId: null,
    recipient: null,
    recipientOrgIds: [],
    project: null,
    projectId: null,
    facility: null,
    locations: [],
    stages: [],
    stageAllocation: "not_stated",
    materialIds: [],
    materialAttribution: "not_stated",
    untrackedMaterialsAsStated: [],
    financialStatusHistory: [{ status: "announced", date: "2025-01-01", sourceId: "s" }],
    implementationStatusHistory: [],
    terms: [],
    outcomes: [],
    evidence: [],
    ...over,
  };
}
const part = (id: string, of: string, value: string, over: Partial<FinancialCommitment> = {}) =>
  fin(id, {
    relationships: [{ commitmentId: of, relationship: "part_of", sourceId: "s" }],
    amount: { value, currency: "USD", qualifier: "exact", amountAsStated: value, currencyBasis: "stated" },
    ...over,
  });

// --- Exact decimals -------------------------------------------------------------

test("decimal addition is exact and canonical", () => {
  assert.equal(addDecimals([]), "0");
  assert.equal(addDecimals(["0.1", "0.2"]), "0.3"); // 0.30000000000000004 in floating point
  assert.equal(addDecimals(["163000000000", "180000000000"]), "343000000000");
  assert.equal(addDecimals(["1.25", "2.75"]), "4");
  assert.equal(addDecimals(["9007199254740993", "1"]), "9007199254740994"); // beyond 2^53
  assert.equal(addDecimals(["0.005", "0.005"]), "0.01");
});

test("decimal comparison is exact across scales", () => {
  assert.equal(compareDecimals("10", "9.99"), 1);
  assert.equal(compareDecimals("1.50", "1.5"), 0);
  assert.equal(compareDecimals("0.1", "0.10000001"), -1);
});

test("compact formatting never rounds a digit away", () => {
  assert.equal(formatDecimalCompact("400000000"), "400 million");
  assert.equal(formatDecimalCompact("47668000"), "47.668 million");
  assert.equal(formatDecimalCompact("1200000000"), "1.2 billion");
  assert.equal(formatDecimalCompact("100000000000"), "100 billion");
  assert.equal(formatDecimalCompact("8400"), "8,400");
  assert.equal(formatDecimalCompact("30.03"), "30.03");
  assert.equal(formatDecimalCompact("1000001"), "1.000001 million");
});

// --- Counting rules on fixtures -------------------------------------------------------

/** The single instrument of a fixture currency total; fails if unlike instruments were combined or the total was withheld. */
function sole(cur: CurrencyTotal): InstrumentSum {
  if (cur.status !== "summed") assert.fail(`${cur.currency} total withheld`);
  assert.equal(cur.instruments.length, 1, `${cur.currency} holds ${cur.instruments.length} instruments`);
  return cur.instruments[0];
}

test("unlike instruments are never added: each has its own sums within a currency", () => {
  const all = [
    fin("grant"),
    fin("loan", { instrument: "loan", amount: { value: "50", currency: "USD", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
    fin("guarantee", { instrument: "loan_guarantee", amount: { value: "1300", currency: "USD", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
  ];
  const t = totalCommitments(all, all);
  const usd = t.currencies[0];
  assert.equal(usd.status, "summed");
  if (usd.status !== "summed") return;
  assert.deepEqual(
    usd.instruments.map((i) => [i.instrument, i.byQualifier]),
    [
      ["grant", { exact: "100" }],
      ["loan", { exact: "50" }],
      ["loan_guarantee", { exact: "1300" }],
    ],
  );
  // No figure anywhere in the total adds two instruments together.
  const json = JSON.stringify(usd);
  for (const cross of ["150", "1400", "1350", "1450"]) assert.ok(!json.includes(`"${cross}"`), `a cross-instrument sum ${cross} leaked`);
});

test("a mixed package is listed under its own instrument and its parts are not counted again under theirs", () => {
  const all = [
    fin("pkg", { instrument: "mixed", amount: { value: "71", currency: "GBP", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } }),
    part("eq", "pkg", "36", { instrument: "equity", amount: { value: "36", currency: "GBP", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
    part("ln", "pkg", "35", { instrument: "loan", amount: { value: "35", currency: "GBP", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } }),
  ];
  const t = totalCommitments(all, all);
  const i = sole(t.currencies[0]);
  assert.equal(i.instrument, "mixed");
  assert.deepEqual(i.countedIds, ["pkg"]);
  // A package that combines instruments is listed with its own figure, never summed.
  assert.equal(i.summed, false);
  assert.equal(i.byQualifier, null);
  assert.deepEqual(t.currencies[0].nestedIds.sort(), ["eq", "ln"]);
});

test("a part is never added to the package it belongs to", () => {
  const all = [fin("pkg", { amount: { value: "71", currency: "GBP", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } }),
    part("eq", "pkg", "36", { amount: { value: "36", currency: "GBP", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
    part("loan", "pkg", "35", { amount: { value: "35", currency: "GBP", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } })];
  const t = totalCommitments(all, all);
  assert.equal(t.currencies.length, 1);
  assert.deepEqual(t.currencies[0].countedIds, ["pkg"]);
  assert.deepEqual(t.currencies[0].nestedIds.sort(), ["eq", "loan"]);
  assert.deepEqual(sole(t.currencies[0]).byQualifier, { up_to: "71" });
});

test("parts are counted when their package is outside the scope", () => {
  const pkg = fin("pkg", { valueRole: "program_envelope" });
  const a = part("a", "pkg", "40");
  const b = part("b", "pkg", "60");
  const all = [pkg, a, b];
  const t = totalCommitments([a, b], all);
  assert.deepEqual(sole(t.currencies[0]).byQualifier, { exact: "100" });
});

test("currencies are never added together, and qualifiers are kept apart", () => {
  const all = [
    fin("a"),
    fin("b", { amount: { value: "50", currency: "USD", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } }),
    fin("c", { amount: { value: "7", currency: "CAD", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
  ];
  const t = totalCommitments(all, all);
  assert.deepEqual(t.currencies.map((c) => c.currency), ["CAD", "USD"]);
  assert.deepEqual(sole(t.currencies[1]).byQualifier, { exact: "100", up_to: "50" });
});

test("unlike value roles are refused, not added", () => {
  const all = [fin("a"), fin("b", { valueRole: "program_envelope" })];
  assert.throws(() => totalCommitments(all, all), /unlike value roles/);
});

test("two counted rows sharing a descendant withhold the total", () => {
  // An award drawn from one envelope and part of another: adding both envelopes double-counts it.
  const x = fin("x");
  const y = fin("y");
  const award = fin("award", {
    relationships: [
      { commitmentId: "x", relationship: "drawn_from", sourceId: "s" },
      { commitmentId: "y", relationship: "part_of", sourceId: "s" },
    ],
  });
  const all = [x, y, award];
  const t = totalCommitments([x, y], all);
  const cur = t.currencies[0];
  assert.equal(cur.status, "withheld");
  assert.deepEqual(cur.overlap, { a: "x", b: "y", shared: "award" });
  // No sum of any kind: null, not zero, not partial.
  assert.equal(cur.instruments, null);
  assert.deepEqual(cur.countedIds, ["x", "y"]);
});

test("a withheld currency serializes with no figure a consumer could read as a total", () => {
  const x = fin("x", { amount: { value: "123", currency: "EUR", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } });
  const y = fin("y", { amount: { value: "456", currency: "EUR", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } });
  const ok = fin("ok", { amount: { value: "7", currency: "USD", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } });
  const award = fin("award", {
    relationships: [
      { commitmentId: "x", relationship: "drawn_from", sourceId: "s" },
      { commitmentId: "y", relationship: "part_of", sourceId: "s" },
    ],
  });
  const all = [x, y, ok, award];
  const t = totalCommitments([x, y, ok], all);
  const eur = t.currencies.find((c) => c.currency === "EUR")!;
  const usd = t.currencies.find((c) => c.currency === "USD")!;
  const json = JSON.stringify(eur);
  for (const figure of ["123", "456", "579"]) assert.ok(!json.includes(figure), `withheld EUR entry leaks ${figure}`);
  // One unsafe currency does not withhold another.
  assert.equal(usd.status, "summed");
  assert.deepEqual(sole(usd).byQualifier, { exact: "7" });
});

test("rows without an amount are reported, not valued", () => {
  const all = [fin("floor", { instrument: "price_floor", amount: null })];
  assert.deepEqual(totalCommitments(all, all).unquantifiedIds, ["floor"]);
});

test("ancestors and descendants follow both relationship types transitively", () => {
  const all = [
    fin("top", { valueRole: "lending_authority" }),
    fin("mid", { relationships: [{ commitmentId: "top", relationship: "drawn_from", sourceId: "s" }] }),
    part("leaf", "mid", "5"),
  ];
  assert.deepEqual([...ancestorIds(all[2], all)].sort(), ["mid", "top"]);
  assert.deepEqual([...descendantIds("top", all)].sort(), ["leaf", "mid"]);
});

// --- Counting rules on the real corpus --------------------------------------------------

test("public totals on the corpus: one role, public capital only, no overlap, no double count", () => {
  const all = getAllFinancialCommitments();
  const rows = publicCommitmentRows(all);
  assert.ok(rows.every((c) => c.valueRole === "commitment" && ["public", "public_enterprise"].includes(c.capitalSource)));
  const t = totalCommitments(rows, all);
  for (const cur of t.currencies) {
    assert.equal(cur.status, "summed", `${cur.currency} total withheld`);
    assert.equal(cur.overlap, null, `${cur.currency} totals overlap`);
    for (const id of cur.countedIds) {
      const c = all.find((x) => x.id === id)!;
      const anc = ancestorIds(c, all);
      assert.ok(!cur.countedIds.some((other) => anc.has(other)), `${id} is counted with its own ancestor`);
    }
  }
});

test("no private, own-funds, co-investment or project-cost row is ever public support", () => {
  const ids = new Set(publicCommitmentRows().map((c) => c.id));
  for (const c of getAllFinancialCommitments())
    if (["private_financing", "recipient_own_funds", "expected_co_investment", "total_project_cost"].includes(c.valueRole) || c.capitalSource === "private")
      assert.ok(!ids.has(c.id), `${c.id} leaks into public support`);
});

test("every row's figure is backed by amount evidence from a source that prints it", () => {
  for (const c of getAllFinancialCommitments()) {
    if (!c.amount) continue;
    assert.ok(c.amount.amountAsStated.trim().length > 0, `${c.id}: amountAsStated is empty`);
    const srcs = c.evidence.filter((e) => e.supports.includes("amount")).map((e) => e.sourceId);
    assert.ok(srcs.length > 0, `${c.id}: no amount evidence`);
    for (const s of srcs) assert.ok(getSourceById(s), `${c.id}: ${s} does not resolve`);
  }
});

// --- Controls over time -------------------------------------------------------------------

const ctl = (history: ControlMeasure["statusHistory"]) => ({ statusHistory: history }) as ControlMeasure;

test("status on a date follows the dated history and never runs ahead", () => {
  const m = ctl([
    { status: "scheduled", date: "2025-10-09", sourceId: "s", until: "2025-12-01" },
    { status: "suspended", date: "2025-11-07", sourceId: "s", until: "2026-11-10" },
  ]);
  assert.equal(controlStatusOn(m, "2025-10-08"), null);
  assert.equal(controlStatusOn(m, "2025-10-09"), "scheduled");
  assert.equal(controlStatusOn(m, "2025-11-06"), "scheduled");
  assert.equal(controlStatusOn(m, "2026-01-01"), "suspended");
});

test("undated entries have no place on the time axis", () => {
  const m = ctl([
    { status: "in_force", date: "2024-01-01", sourceId: "s" },
    { status: "suspended", date: null, sourceId: "s" },
  ]);
  assert.deepEqual(controlSpans(m), [{ status: "in_force", from: "2024-01-01", to: null, until: null }]);
  assert.equal(controlStatusOn(m, "2024-06-01"), "suspended");
});

test("clocks count days from the as-of date, not the clock on the wall", () => {
  const a = controlClocks("2026-09-23");
  const b = controlClocks("2026-09-23");
  assert.deepEqual(a.map((x) => x.daysLeft), b.map((x) => x.daysLeft));
  for (const { entry, daysLeft } of a) assert.ok(entry.until && daysLeft === Math.round((Date.parse(entry.until) - Date.parse("2026-09-23")) / 86400000));
  assert.ok(a.every((x, i) => i === 0 || a[i - 1].daysLeft <= x.daysLeft), "clocks are soonest first");
});

test("the Announcement No. 61 clauses are suspended until 10 November 2026 on the as-of date", () => {
  const rows = getAllControlMeasures().filter((m) => m.eventId === "china-rare-earth-expansion-2025-10");
  assert.ok(rows.length >= 3);
  for (const m of rows) {
    assert.equal(controlStatusOn(m, site.lastUpdated), "suspended", m.id);
    assert.equal(m.statusHistory.at(-1)?.until, "2026-11-10", m.id);
  }
});

test("the Announcement No. 62 clauses state the two laws its preamble cites, not the four of the joint Nos. 56-58", () => {
  // No. 62 is MOFCOM's alone: its preamble names the Export Control Law and the Dual-use Items Export Control
  // Regulations, and nothing else. The Foreign Trade Law and the Customs Law belong to Nos. 18, 56, 57 and 58.
  const rows = getAllControlMeasures().filter((m) => m.eventId === "evt-cn-mofcom-62-2025");
  assert.ok(rows.length >= 4);
  const two = "《中华人民共和国出口管制法》《中华人民共和国两用物项出口管制条例》";
  for (const m of rows) assert.ok(!/对外贸易法|海关法/.test(m.legalBasisAsStated ?? ""), m.id);
  for (const id of ["ctl-cn-62-2025-technology-licensing", "ctl-cn-62-2025-production-line-technology-licensing", "ctl-cn-62-2025-overseas-support-ban"])
    assert.equal(rows.find((m) => m.id === id)?.legalBasisAsStated, two, id);
});

// --- Derived views ------------------------------------------------------------------------------

test("the chronology is dated, ordered and complete for dated entries of government rows", () => {
  const marks = instrumentChronology();
  const expected =
    getAllFinancialCommitments()
      .filter((c) => c.providerJurisdiction !== null)
      .reduce((n, c) => n + c.financialStatusHistory.filter((e) => e.date).length, 0) +
    getAllControlMeasures().reduce((n, m) => n + m.statusHistory.filter((e) => e.date).length, 0);
  assert.equal(marks.length, expected);
  assert.ok(marks.every((m, i) => i === 0 || marks[i - 1].date <= m.date));
});

test("the material matrix folds a part into a package it counts in the same cell, and shows every other part", () => {
  const withdrawn = [{ status: "announced" as const, date: "2025-01-01", sourceId: "s" }, { status: "withdrawn" as const, date: "2025-02-01", sourceId: "s" }];
  const on = (...materialIds: string[]) => ({ materialIds });
  const rows = [
    // A standing package with parts: the parts fold in where the package names the material.
    fin("pkg", on("m1")),
    part("pkg-part", "pkg", "40", on("m1")),
    part("pkg-part-ended", "pkg", "5", { ...on("m1"), financialStatusHistory: withdrawn }),
    // An ended package does not hide the part that still stands.
    fin("ended-pkg", { ...on("m2"), financialStatusHistory: withdrawn }),
    part("standing-part", "ended-pkg", "30", on("m2")),
    // A package outside the matrix (private, no government behind it) or under another provider does not hide it either.
    fin("private-pkg", { ...on("m3"), providerJurisdiction: null, capitalSource: "private" }),
    part("part-of-private", "private-pkg", "20", on("m3")),
    fin("eu-pkg", { ...on("m4"), providerJurisdiction: "eu" }),
    part("part-of-eu", "eu-pkg", "20", on("m4")),
    // A package folds a part only at the materials the package itself names.
    fin("wide-pkg", on("m5", "m6")),
    part("wide-part", "wide-pkg", "10", on("m5", "m7")),
  ];
  const grid = materialInterplay(site.lastUpdated, rows, []);
  const at = (m: string, j: "us" | "eu") => grid.get(m)?.get(j)?.capitalIds ?? [];
  assert.deepEqual(at("m1", "us"), ["pkg"], "a part folds into its package; an ended part is not capital at all");
  assert.deepEqual(at("m2", "us"), ["standing-part"], "an ended package hides nothing and is not counted");
  assert.deepEqual(at("m3", "us"), ["part-of-private"]);
  assert.deepEqual(at("m4", "us"), ["part-of-eu"]);
  assert.deepEqual(at("m4", "eu"), ["eu-pkg"]);
  assert.deepEqual(at("m5", "us"), ["wide-pkg"], "package and part cover the same cell: counted once");
  assert.deepEqual(at("m6", "us"), ["wide-pkg"]);
  assert.deepEqual(at("m7", "us"), ["wide-part"], "the part is at a material its package does not name");

  // Against the corpus: no cell holds an ended row, and a part is in a cell only when no counted package of the same
  // provider that names the same material is in it; every other counted row is present.
  const all = getAllFinancialCommitments();
  const byId = new Map(all.map((c) => [c.id, c]));
  const expected = (mat: string, j: string) =>
    all
      .filter((c) => !isEnded(c) && c.providerJurisdiction === j && c.materialIds.includes(mat))
      .filter((c) => !c.relationships.some((r) => {
        const p = byId.get(r.commitmentId);
        return r.relationship === "part_of" && p && !isEnded(p) && p.providerJurisdiction === j && p.materialIds.includes(mat);
      }))
      .map((c) => c.id);
  const real = materialInterplay(site.lastUpdated);
  for (const [mat, row] of real)
    for (const [j, cell] of row) {
      assert.deepEqual([...cell.capitalIds].sort(), expected(mat, j).sort(), `${mat} / ${j}`);
      assert.ok(cell.controlsInForce <= cell.controlIds.length);
    }
});

test("a material's ledger folds a part only into a package it lists in the same state", () => {
  const withdrawn = [{ status: "announced" as const, date: "2025-01-01", sourceId: "s" }, { status: "withdrawn" as const, date: "2025-02-01", sourceId: "s" }];
  const m = (...materialIds: string[]) => ({ materialIds });
  const rows = [
    fin("pkg", m("a")),
    part("pkg-part", "pkg", "1", m("a")),
    part("pkg-part-elsewhere", "pkg", "1", m("a", "b")),
    part("pkg-part-ended", "pkg", "1", { ...m("a"), financialStatusHistory: withdrawn }),
    fin("ended-pkg", { ...m("a"), financialStatusHistory: withdrawn }),
    part("ended-pkg-standing", "ended-pkg", "1", m("a")),
    part("ended-pkg-ended", "ended-pkg", "1", { ...m("a"), financialStatusHistory: withdrawn }),
  ];
  assert.deepEqual(
    materialLedgerRows("a", rows).map((c) => c.id),
    ["pkg", "pkg-part-ended", "ended-pkg", "ended-pkg-standing"],
  );
  assert.deepEqual(materialLedgerRows("b", rows).map((c) => c.id), ["pkg-part-elsewhere"], "the package does not name this material");
});

test("summaries resolve their events and carry only serializable values", () => {
  for (const c of getAllFinancialCommitments()) {
    const s = summarizeCommitment(c);
    assert.equal(s.eventTitle, getEventById(c.eventId)!.titleEn);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (const m of getAllControlMeasures()) {
    const s = summarizeControl(m);
    assert.equal(s.issuer, getEventById(m.eventId)!.jurisdiction);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test("short instrument labels", () => {
  assert.equal(shortInstrumentLabel({ documentNumber: "MOFCOM & GACC Announcement [2025] No. 18", titleEn: "" }), "No. 18/2025");
  assert.equal(shortInstrumentLabel({ documentNumber: "MOFCOM Announcement No. 61 (2025)", titleEn: "" }), "No. 61/2025");
  assert.equal(shortInstrumentLabel({ documentNumber: "Executive Order 14272; 90 FR 16437", titleEn: "" }), "EO 14272");
  assert.equal(shortInstrumentLabel({ documentNumber: null, titleEn: "Short" }), "Short");
});

// --- Exports and API summary ----------------------------------------------------------------------

const dataRows = (csv: string) => csv.replace(/\r\n$/, "").split("\r\n").slice(1);

test("Capital & Control CSVs have one row per record or status entry", () => {
  assert.equal(dataRows(financialCommitmentsCsv()).length, getAllFinancialCommitments().length);
  assert.equal(dataRows(controlMeasuresCsv()).length, getAllControlMeasures().length);
  assert.equal(
    dataRows(financialStatusHistoryCsv()).length,
    getAllFinancialCommitments().reduce((n, c) => n + c.financialStatusHistory.length + c.implementationStatusHistory.length, 0),
  );
  assert.equal(
    dataRows(controlStatusHistoryCsv()).length,
    getAllControlMeasures().reduce((n, m) => n + m.statusHistory.length, 0),
  );
});

test("amounts are exported as canonical decimal strings, never reformatted", () => {
  const csv = financialCommitmentsCsv();
  for (const c of getAllFinancialCommitments()) if (c.amount) assert.ok(csv.includes(`,${c.amount.value},${c.amount.currency},`), c.id);
});

test("the dataset and summary include Capital & Control and are deterministic", () => {
  const d = buildDataset();
  assert.equal(d.counts.financialCommitments, getAllFinancialCommitments().length);
  assert.equal(d.counts.controlMeasures, getAllControlMeasures().length);
  assert.equal(JSON.stringify(buildCapitalControlSummary()), JSON.stringify(buildCapitalControlSummary()));
  const s = buildCapitalControlSummary();
  assert.equal(s.asOf, site.lastUpdated);
  assert.equal(s.capital.rows, getAllFinancialCommitments().length);
  const byStatus = Object.values(s.controls.byStatusAsOf).reduce((a, b) => a + b, 0);
  assert.ok(byStatus <= getAllControlMeasures().length);
});

test("every event with a Capital & Control row still resolves", () => {
  const ids = new Set(getAllEvents().map((e) => e.id));
  for (const r of [...getAllFinancialCommitments(), ...getAllControlMeasures()]) assert.ok(ids.has(r.eventId), r.id);
});

// --- Attribution and binding status --------------------------------------------------------------

test("no private, not-stated or provider-less row is credited to a government", () => {
  for (const c of getAllFinancialCommitments()) {
    const s = summarizeCommitment(c);
    if (c.providerJurisdiction === null) assert.equal(s.actor, null, `${c.id} is credited to ${s.actor}`);
    if (c.capitalSource === "private") assert.equal(s.actor, null, `${c.id}: private capital credited to ${s.actor}`);
  }
  const lanes = new Set(instrumentChronology().filter((m) => m.kind === "capital").map((m) => m.id));
  for (const c of getAllFinancialCommitments()) if (c.providerJurisdiction === null) assert.ok(!lanes.has(c.id), `${c.id} sits in an actor lane`);
  for (const row of materialInterplay(site.lastUpdated).values())
    for (const [j, cell] of row)
      for (const id of cell.capitalIds) assert.equal(getAllFinancialCommitments().find((c) => c.id === id)!.providerJurisdiction, j, id);
});

test("binding and not-yet-binding sums partition each instrument's total exactly", () => {
  const t = totalCommitments(publicCommitmentRows());
  for (const cur of t.currencies) {
    if (cur.status !== "summed") assert.fail(`${cur.currency} total withheld`);
    for (const i of cur.instruments) {
      if (!i.summed) {
        // Listed, never summed: no figure at all, not a zero.
        assert.deepEqual([i.byQualifier, i.binding, i.notYetBinding], [null, null, null], `${cur.currency} ${i.instrument}`);
        continue;
      }
      for (const q of ["exact", "approximately", "at_least", "up_to"] as const)
        assert.equal(
          addDecimals([i.binding[q] ?? "0", i.notYetBinding[q] ?? "0"]),
          i.byQualifier[q] ?? "0",
          `${cur.currency} ${i.instrument} ${q}`,
        );
    }
    // Every counted row sits under exactly one instrument, its own.
    assert.deepEqual(cur.instruments.flatMap((i) => i.countedIds).sort(), [...cur.countedIds].sort(), cur.currency);
  }
});

test("a conditional loan commitment is never counted as binding, and a non-binding letter of intent is not a commitment at all", () => {
  const t = totalCommitments(publicCommitmentRows());
  const usd = t.currencies.find((c) => c.currency === "USD")!;
  const conditional = getAllFinancialCommitments().find((x) => x.id === "fin-us-osc-vulcan-reelement-2025-joint-commitment")!;
  assert.ok(!["contracted", "partially_disbursed", "disbursed"].includes(conditional.financialStatusHistory.at(-1)!.status));
  assert.equal(usd.status, "summed");
  assert.ok(usd.status === "summed" && usd.instruments.some((i) => i.summed && i.notYetBinding.exact), "USD has not-yet-binding money");
  // The CHIPS letter of intent is an indication: in no total, binding or not yet binding.
  const letter = getAllFinancialCommitments().find((x) => x.id === "fin-us-commerce-chips-vulcan-2025-incentives")!;
  assert.equal(letter.valueRole, "indication");
  assert.ok(!publicCommitmentRows().some((c) => c.id === letter.id));
  assert.ok(usd.status === "summed" && !usd.instruments.some((i) => i.countedIds.includes(letter.id)));
});

// --- Funding options ---------------------------------------------------------------

const OPTION = "fin-us-dod-mp-2025-additional-preferred-option";

test("the DoD–MP USD 350M option is a funding option, listed and never summed", () => {
  const all = getAllFinancialCommitments();
  const c = all.find((x) => x.id === OPTION)!;
  assert.equal(c.valueRole, "funding_option");
  assert.deepEqual([c.amount!.value, c.amount!.currency, c.amount!.qualifier], ["350000000", "USD", "up_to"]);
  assert.ok(c.terms.some((t) => t.asStated.includes("committed financing provided by JPMorgan and Goldman Sachs")), "the bank alternative is kept in the filing's words");
  assert.ok(!publicCommitmentRows(all).some((x) => x.id === OPTION));
  const t = totalCommitments(publicCommitmentRows(all), all);
  const usd = t.currencies.find((x) => x.currency === "USD")!;
  assert.ok(!usd.countedIds.includes(OPTION) && !usd.nestedIds.includes(OPTION));
  // The option is in no instrument's sums, binding or not.
  assert.ok(usd.status === "summed" && usd.instruments.every((i) => !i.countedIds.includes(OPTION)), "an option leaked into USD money");
});

test("an executed option records no exercise or payment the corpus does not state", () => {
  const s = optionState(getAllFinancialCommitments().find((x) => x.id === OPTION)!);
  assert.equal(s.executed?.status, "contracted");
  assert.equal(s.executed?.date, "2025-07-09");
  assert.deepEqual(s.exercises, []);
  assert.deepEqual(s.disbursements, []);
  assert.equal(summarizeCommitment(getAllFinancialCommitments().find((x) => x.id === OPTION)!).optionExerciseRecorded, false);
});

test("an exercise is its own commitment drawn from the option, and only paid money reads as disbursed", () => {
  const opt = fin("opt", { valueRole: "funding_option", financialStatusHistory: [{ status: "contracted", date: "2025-01-01", sourceId: "s" }] });
  const ex = fin("ex", {
    relationships: [{ commitmentId: "opt", relationship: "drawn_from", sourceId: "s" }],
    financialStatusHistory: [{ status: "contracted", date: "2025-02-01", sourceId: "s" }],
  });
  const paid = fin("paid", {
    relationships: [{ commitmentId: "opt", relationship: "drawn_from", sourceId: "s" }],
    financialStatusHistory: [{ status: "disbursed", date: "2025-03-01", sourceId: "s" }],
  });
  const all = [opt, ex, paid];
  const s = optionState(opt, all);
  assert.deepEqual(s.exercises.map((e) => e.id), ["ex", "paid"]);
  assert.deepEqual(s.disbursements.map((e) => e.id), ["paid"]);
  // The option is never added to the commitments drawn from it.
  assert.throws(() => totalCommitments([opt, ex], all), /unlike value roles/);
  assert.deepEqual(totalCommitments([ex, paid], all).currencies[0].countedIds, ["ex", "paid"]);
});

test("every financial row lands in exactly one bucket of the summary", () => {
  const s = buildCapitalControlSummary();
  const all = getAllFinancialCommitments();
  const t = totalCommitments(publicCommitmentRows(all), all);
  const buckets: [string, string[]][] = [
    ["public commitments", [...t.currencies.flatMap((c) => [...c.countedIds, ...c.nestedIds]), ...t.unquantifiedIds, ...t.statusNotStatedIds, ...t.endedIds]],
    ["envelopes", s.capital.envelopesListedNotSummed.map((r) => r.id)],
    ["indications", s.capital.indicationsListedNotSummed.map((r) => r.id)],
    ["options", s.capital.fundingOptionsListedNotSummed.map((r) => r.id)],
    ["kept apart", s.capital.keptApartFromPublicSupport.map((r) => r.id)],
  ];
  const seen = new Map<string, string>();
  for (const [name, ids] of buckets)
    for (const id of ids) {
      assert.ok(!seen.has(id), `${id} is in both ${seen.get(id)} and ${name}`);
      seen.set(id, name);
    }
  for (const c of all) assert.ok(seen.has(c.id), `${c.id} is in no summary bucket`);
  assert.equal(seen.size, all.length);
  const opt = s.capital.fundingOptionsListedNotSummed.find((r) => r.id === OPTION)!;
  assert.deepEqual(opt.agreementExecuted, { date: "2025-07-09", sourceId: "src-dod-mp-transaction-agreement-2025" });
  assert.deepEqual([opt.exercisesRecorded, opt.disbursementsRecorded], [[], []]);
  assert.ok(s.countingRules.some((r) => r.includes("withheld")));
});

// --- Proclamation 11001 ------------------------------------------------------------

test("a negotiation mandate is not a control measure: Proclamation 11001 stays an event", () => {
  assert.ok(!(CONTROL_MEASURE_TYPES as readonly string[]).includes("trade_negotiation"));
  assert.ok(getEventById("evt-us-proc-11001-2026"), "the proclamation event remains");
  assert.equal(getAllControlMeasures().filter((m) => m.eventId === "evt-us-proc-11001-2026").length, 0);
  const inv = getAllControlMeasures().find((m) => m.id === "ctl-us-eo-14272-2025-section-232-investigation")!;
  const concluded = inv.statusHistory.at(-1)!;
  assert.equal(concluded.status, "concluded");
  assert.equal(concluded.sourceId, "src-fedreg-proc-11001");
});

const usd = (value: string) => ({ value, currency: "USD", qualifier: "exact" as const, amountAsStated: value, currencyBasis: "stated" as const });
const history = (...statuses: FinancialCommitment["financialStatusHistory"][number]["status"][]) =>
  statuses.map((status, i) => ({ status, date: `2025-0${i + 1}-01`, sourceId: "s" }));

test("an ended or otherwise ineligible package never suppresses a part that still stands", () => {
  // An ended package: its parts are the money that still stands, each counted once.
  const ended = fin("pkg", { amount: usd("300"), financialStatusHistory: history("announced", "withdrawn") });
  const a = part("a", "pkg", "100");
  const b = part("b", "pkg", "200");
  let all = [ended, a, b];
  let t = totalCommitments(all, all);
  assert.deepEqual(t.endedIds, ["pkg"]);
  const cur = t.currencies[0];
  assert.deepEqual([cur.countedIds, cur.nestedIds], [["a", "b"], []]);
  assert.deepEqual(sole(cur).byQualifier, { exact: "300" });

  // A package whose status is not stated is not counted, so it does not hide its parts either.
  const unknown = fin("pkg", { amount: usd("300"), financialStatusHistory: history("not_stated") });
  all = [unknown, a, b];
  t = totalCommitments(all, all);
  assert.deepEqual(t.statusNotStatedIds, ["pkg"]);
  assert.deepEqual(t.currencies[0].countedIds, ["a", "b"]);

  // A package with no amount is listed, not valued, and hides nothing.
  const amountless = fin("pkg", { amount: null });
  all = [amountless, a, b];
  t = totalCommitments(all, all);
  assert.deepEqual(t.unquantifiedIds, ["pkg"]);
  assert.deepEqual(t.currencies[0].countedIds, ["a", "b"]);

  // A package that is itself counted still keeps its parts out, unchanged.
  const live = fin("pkg", { amount: usd("300") });
  all = [live, a, b];
  t = totalCommitments(all, all);
  assert.deepEqual([t.currencies[0].countedIds, t.currencies[0].nestedIds], [["pkg"], ["a", "b"]]);
  assert.deepEqual(sole(t.currencies[0]).byQualifier, { exact: "300" });
});

test("an ineligible middle ancestor does not break the chain to an eligible grandparent", () => {
  const grand = fin("grand", { amount: usd("500") });
  const middle = part("middle", "grand", "300", { financialStatusHistory: history("announced", "lapsed") });
  const child = part("child", "middle", "100");
  const all = [grand, middle, child];
  const t = totalCommitments(all, all);
  const cur = t.currencies[0];
  assert.deepEqual(t.endedIds, ["middle"]);
  assert.deepEqual([cur.countedIds, cur.nestedIds], [["grand"], ["child"]], "the child is inside the grandparent's figure");
  assert.deepEqual(sole(cur).byQualifier, { exact: "500" });
});

test("a status the source does not give is neither binding nor not yet binding, and is never summed", () => {
  const bound = fin("bound", { amount: usd("100"), financialStatusHistory: history("contracted") });
  const pending = fin("pending", { amount: usd("40"), financialStatusHistory: history("announced") });
  const unknown = fin("unknown", { amount: usd("7"), financialStatusHistory: history("not_stated") });
  const all = [bound, pending, unknown];
  const t = totalCommitments(all, all);
  assert.deepEqual(t.statusNotStatedIds, ["unknown"]);
  const inst = sole(t.currencies[0]);
  assert.deepEqual(t.currencies[0].countedIds, ["bound", "pending"]);
  assert.deepEqual([inst.binding, inst.notYetBinding], [{ exact: "100" }, { exact: "40" }]);
  // Nothing of the unknown row's 7 is in any sum.
  assert.equal(JSON.stringify(t.currencies).includes('"7"'), false);
  // On its own it yields no currency at all: there is nothing defensible to sum.
  const alone = totalCommitments([unknown], [unknown]);
  assert.deepEqual([alone.currencies, alone.statusNotStatedIds], [[], ["unknown"]]);
  // legalStanding covers every status exactly once, and only the four terms.
  const standings = FINANCIAL_STATUSES.map((status) => legalStanding(fin("x", { financialStatusHistory: history(status) })));
  assert.deepEqual([...new Set(standings)].sort(), ["binding", "ended", "not_yet_binding", "status_not_stated"]);
  assert.deepEqual(
    FINANCIAL_STATUSES.filter((s) => legalStanding(fin("x", { financialStatusHistory: history(s) })) === "status_not_stated"),
    ["not_stated"],
  );
  // No part of it reaches a binding sum through the back door: the corpus's own not-stated row is listed apart.
  const corpus = totalCommitments(publicCommitmentRows(), getAllFinancialCommitments());
  assert.ok(corpus.statusNotStatedIds.includes("fin-ca-g7-2025-nmg-canada-growth-fund"));
  for (const cur of corpus.currencies) for (const i of cur.instruments ?? []) assert.ok(!i.countedIds.includes("fin-ca-g7-2025-nmg-canada-growth-fund"));
});

test("a draw from an option that has ended is not an exercise, and the summary lists it apart", () => {
  const opt = fin("opt", { valueRole: "funding_option", amount: usd("350"), financialStatusHistory: history("contracted") });
  const draw = (id: string, ...statuses: Parameters<typeof history>) =>
    fin(id, { amount: usd("50"), relationships: [{ commitmentId: "opt", relationship: "drawn_from", sourceId: "s" }], financialStatusHistory: history(...statuses) });
  const dead = draw("dead", "announced", "withdrawn");
  let s = optionState(opt, [opt, dead]);
  assert.deepEqual([s.exercises, s.disbursements].map((l) => l.map((e) => e.id)), [[], []], "a withdrawn draw is not an exercise");
  assert.deepEqual(s.endedExercises.map((e) => e.id), ["dead"]);
  const live = draw("live", "contracted", "partially_disbursed");
  s = optionState(opt, [opt, dead, live]);
  assert.deepEqual(s.exercises.map((e) => e.id), ["live"]);
  assert.deepEqual(s.disbursements.map((e) => e.id), ["live"]);
  assert.deepEqual(s.endedExercises.map((e) => e.id), ["dead"]);
  // The corpus option has no recorded draw of either kind, and the summary says so in its own field.
  const summary = buildCapitalControlSummary();
  const corpusOption = summary.capital.fundingOptionsListedNotSummed.find((r) => r.id === OPTION)!;
  assert.deepEqual([corpusOption.exercisesRecorded, corpusOption.exercisesEnded], [[], []]);
  assert.ok(summary.countingRules.some((r) => r.includes("not_stated")));
  assert.ok(summary.countingRules.some((r) => r.includes("ended draw")));
  assert.ok(Array.isArray(summary.capital.publicCommitmentsStatusNotStated));
});

test("a withdrawn or lapsed commitment is listed as ended and never summed", () => {
  const live = fin("fin-live", { amount: { value: "100", currency: "USD", qualifier: "exact", amountAsStated: "$100", currencyBasis: "stated" } });
  const withdrawn = fin("fin-withdrawn", {
    financialStatusHistory: [
      { status: "announced", date: "2025-01-01", sourceId: "s" },
      { status: "withdrawn", date: "2025-06-01", sourceId: "s" },
    ],
  });
  const lapsed = fin("fin-lapsed", {
    financialStatusHistory: [
      { status: "decided", date: "2025-01-01", sourceId: "s" },
      { status: "lapsed", date: "2025-08-26", sourceId: "s" },
    ],
  });
  const all = [live, withdrawn, lapsed];
  const t = totalCommitments(all, all);
  assert.deepEqual(t.endedIds, ["fin-withdrawn", "fin-lapsed"]);
  assert.equal(t.currencies.length, 1);
  const usd = t.currencies[0];
  assert.equal(usd.status, "summed");
  assert.deepEqual(usd.countedIds, ["fin-live"]);
  assert.deepEqual(sole(usd).byQualifier, { exact: "100" });
});

test("rows whose instrument is not stated are listed, never summed together", () => {
  const all = [
    fin("a", { instrument: "unspecified" }),
    fin("b", { instrument: "unspecified", amount: { value: "50", currency: "USD", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
  ];
  const t = totalCommitments(all, all);
  const i = sole(t.currencies[0]);
  assert.equal(i.instrument, "unspecified");
  assert.equal(i.summed, false);
  assert.deepEqual(i.countedIds, ["a", "b"]);
  assert.ok(!JSON.stringify(t).includes('"150"'), "two unnamed instruments were added together");
});

test("USA Rare Earth's direct funding is instrument-not-stated on the package and all five parts, never a grant sum", () => {
  const AGREEMENT = "src-usar-direct-funding-agreement-2026-06-03";
  const pkg = getFinancialCommitmentById("fin-us-chips-usar-2026-direct-funding")!;
  const parts = getAllFinancialCommitments().filter((c) => c.relationships.some((r) => r.commitmentId === pkg.id && r.relationship === "part_of"));
  assert.equal(parts.length, 5);
  // The executed agreement is a source of its own: the 8-K never says "other transaction" and never says "grant".
  assert.match(getSourceById(AGREEMENT)?.url ?? "", /ea029340201ex10-1\.htm$/);
  for (const c of [pkg, ...parts]) {
    assert.equal(c.instrument, "unspecified", c.id);
    // One reading, one level: every entry that supports the instrument is ambiguous, and the package and its parts agree.
    const instrument = c.evidence.filter((e) => e.supports.includes("instrument"));
    assert.ok(instrument.length >= 2, c.id);
    assert.ok(instrument.every((e) => e.evidence === "ambiguous"), c.id);
    assert.ok(instrument.some((e) => e.sourceId === AGREEMENT), c.id);
    // The instrument is no longer bundled into an explicit entry beside the amount.
    assert.ok(c.evidence.filter((e) => e.evidence === "explicit").every((e) => !e.supports.includes("instrument")), c.id);
  }
  assert.equal(addDecimals(parts.map((c) => c.amount!.value)), pkg.amount!.value);
  // The package is listed under "not specified" in USD, never summed; no grant total carries it, and its parts stay nested.
  const usd = buildCapitalControlSummary().capital.publicCommitmentTotals.find((t) => t.currency === "USD")!;
  if (usd.status !== "summed") assert.fail("the USD total is withheld");
  const inst = (name: string) => usd.instruments.find((i) => i.instrument === name);
  assert.ok(!inst("grant")?.countedIds.includes(pkg.id));
  const unspecified = inst("unspecified")!;
  assert.ok(unspecified.countedIds.includes(pkg.id));
  assert.equal(unspecified.summed, false);
  assert.equal(unspecified.byQualifier, null);
  for (const c of parts) assert.ok(usd.nestedIds.includes(c.id) && !usd.countedIds.includes(c.id), c.id);
});
