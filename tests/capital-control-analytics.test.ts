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
  materialInterplay,
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
  getSourceById,
} from "@/lib/data";
import { site } from "@/lib/site";
import { CONTROL_MEASURE_TYPES } from "@/lib/types";
import type { ControlMeasure, FinancialCommitment } from "@/lib/types";

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

test("a part is never added to the package it belongs to", () => {
  const all = [fin("pkg", { amount: { value: "71", currency: "GBP", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } }),
    part("eq", "pkg", "36", { amount: { value: "36", currency: "GBP", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
    part("loan", "pkg", "35", { amount: { value: "35", currency: "GBP", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } })];
  const t = totalCommitments(all, all);
  assert.equal(t.currencies.length, 1);
  assert.deepEqual(t.currencies[0].countedIds, ["pkg"]);
  assert.deepEqual(t.currencies[0].nestedIds.sort(), ["eq", "loan"]);
  assert.deepEqual(t.currencies[0].byQualifier, { up_to: "71" });
});

test("parts are counted when their package is outside the scope", () => {
  const pkg = fin("pkg", { valueRole: "program_envelope" });
  const a = part("a", "pkg", "40");
  const b = part("b", "pkg", "60");
  const all = [pkg, a, b];
  const t = totalCommitments([a, b], all);
  assert.deepEqual(t.currencies[0].byQualifier, { exact: "100" });
});

test("currencies are never added together, and qualifiers are kept apart", () => {
  const all = [
    fin("a"),
    fin("b", { amount: { value: "50", currency: "USD", qualifier: "up_to", amountAsStated: "", currencyBasis: "stated" } }),
    fin("c", { amount: { value: "7", currency: "CAD", qualifier: "exact", amountAsStated: "", currencyBasis: "stated" } }),
  ];
  const t = totalCommitments(all, all);
  assert.deepEqual(t.currencies.map((c) => c.currency), ["CAD", "USD"]);
  assert.deepEqual(t.currencies[1].byQualifier, { exact: "100", up_to: "50" });
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
  assert.equal(cur.byQualifier, null);
  assert.equal(cur.binding, null);
  assert.equal(cur.notYetBinding, null);
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
  assert.deepEqual(usd.status === "summed" && usd.byQualifier, { exact: "7" });
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

test("the material matrix counts records only, and folds package parts into the package", () => {
  const grid = materialInterplay(site.lastUpdated);
  const partIds = new Set(getAllFinancialCommitments().filter((c) => c.relationships.some((r) => r.relationship === "part_of")).map((c) => c.id));
  for (const row of grid.values())
    for (const cell of row.values()) {
      assert.ok(cell.capitalIds.every((id) => !partIds.has(id)));
      assert.ok(cell.controlsInForce <= cell.controlIds.length);
    }
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

test("binding and not-yet-binding sums partition each currency total exactly", () => {
  const t = totalCommitments(publicCommitmentRows());
  for (const cur of t.currencies) {
    if (cur.status !== "summed") assert.fail(`${cur.currency} total withheld`);
    for (const q of ["exact", "approximately", "at_least", "up_to"] as const)
      assert.equal(
        addDecimals([cur.binding[q] ?? "0", cur.notYetBinding[q] ?? "0"]),
        cur.byQualifier[q] ?? "0",
        `${cur.currency} ${q}`,
      );
  }
});

test("a conditional loan commitment and a non-binding letter of intent are never counted as binding", () => {
  const t = totalCommitments(publicCommitmentRows());
  const usd = t.currencies.find((c) => c.currency === "USD")!;
  const ids = ["fin-us-osc-vulcan-reelement-2025-joint-commitment", "fin-us-commerce-chips-vulcan-2025-incentives"];
  for (const id of ids) {
    const c = getAllFinancialCommitments().find((x) => x.id === id)!;
    assert.ok(!["contracted", "partially_disbursed", "disbursed"].includes(c.financialStatusHistory.at(-1)!.status), id);
  }
  assert.equal(usd.status, "summed");
  assert.ok(usd.status === "summed" && usd.notYetBinding.exact, "USD has not-yet-binding money");
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
  // The only USD "up to" figure among public commitments was the option; none remains binding.
  assert.ok(usd.status === "summed" && !usd.binding.up_to, "an option leaked into binding USD money");
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
    ["public commitments", [...t.currencies.flatMap((c) => [...c.countedIds, ...c.nestedIds]), ...t.unquantifiedIds]],
    ["envelopes", s.capital.envelopesListedNotSummed.map((r) => r.id)],
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
