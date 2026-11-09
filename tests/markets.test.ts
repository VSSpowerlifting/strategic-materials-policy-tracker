import test from "node:test";
import assert from "node:assert/strict";
import {
  addPeriods,
  changeBetween,
  changeOver,
  changeSummary,
  chooseIndexBase,
  formatNumber,
  formatObservationPeriod,
  formatPct,
  formatPeriod,
  indexSeries,
  isRangeId,
  isStale,
  isValidPeriod,
  periodChangeGrid,
  periodRange,
  periodsBetween,
  rangeWindow,
  rankMovers,
  supportedRanges,
  unitsCompatible,
  validateMarketData,
  valueAt,
  type MarketDataInput,
  type Observation,
} from "@/lib/markets";
import {
  getMarketCoverage,
  getMarketDatasets,
  getMarketSeries,
  getMarketSeriesById,
  getMarketSeriesForMaterial,
  getObservations,
} from "@/lib/market-data";
import materials from "@/data/seed/materials.json";
import { buildMarketsCsv, csvCell, MARKET_CSV_HEADERS } from "@/lib/markets-csv";

const materialIds = new Set((materials as Array<{ id: string }>).map((m) => m.id));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const real = (): MarketDataInput => ({
  datasets: clone(getMarketDatasets()),
  coverage: clone(getMarketCoverage()),
  materialIds,
});
const errorsOf = (input: MarketDataInput) => validateMarketData(input).errors;
const ds = (input: MarketDataInput, id: string) => input.datasets.find((d) => d.manifest.datasetId === id)!;
/** Splits one CSV line (RFC 4180 quoting) for assertions. */
const splitCsv = (line: string): string[] => {
  const out: string[] = [];
  let f = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(f); f = ""; } else f += c;
  }
  out.push(f);
  return out;
};
const obs = (pairs: Array<[string, number, boolean?]>): Observation[] =>
  pairs.map(([period, value, e]) => (e ? { period, value, estimated: true } : { period, value }));

// ── Periods ────────────────────────────────────────────────────────────────
test("periods: months and years are distinct frequencies", () => {
  assert.ok(isValidPeriod("2026-09", "monthly"));
  assert.ok(isValidPeriod("2025", "annual"));
  assert.ok(!isValidPeriod("2025", "monthly"));
  assert.ok(!isValidPeriod("2026-13"));
  assert.equal(addPeriods("2026-01", -1), "2025-12");
  assert.equal(addPeriods("2025", -4), "2021");
  assert.equal(periodsBetween("2021", "2025"), 4);
  assert.deepEqual(periodRange("2023", "2025"), ["2023", "2024", "2025"]);
  assert.throws(() => periodsBetween("2025", "2025-01"), /Cannot compare/);
});

// ── Changes ────────────────────────────────────────────────────────────────
test("changes: exact endpoints, no interpolation, estimate flag carried", () => {
  const o = obs([["2021", 100], ["2022", 120], ["2024", 90], ["2025", 99, true]]);
  const c = changeBetween(o, "2024", "2025")!;
  assert.equal(c.pct.toFixed(6), (10).toFixed(6));
  assert.equal(c.estimated, true);
  assert.equal(changeBetween(o, "2022", "2023"), null, "missing year is not filled");
  assert.equal(changeOver(o, 1, "2023"), null);
  assert.equal(changeBetween(o, "2021", "2022")!.estimated, false);
});

test("changes: a stated source break nulls changes across it", () => {
  const breaks = [{ period: "2022", statedAs: "x" }, { period: "2025", statedAs: "x" }];
  const o = obs([["2021", 158], ["2022", 196], ["2023", 170], ["2024", 167], ["2025", 180, true]]);
  assert.equal(changeBetween(o, "2021", "2022", breaks), null);
  assert.equal(changeBetween(o, "2024", "2025", breaks), null);
  assert.ok(changeBetween(o, "2022", "2024", breaks));
  const sum = changeSummary(o, "annual", breaks);
  assert.equal(sum.changes[0].change, null);
  assert.match(sum.changes[0].reason!, /underlying price source changes in 2025/);
  const grid = periodChangeGrid(o, ["2022", "2023", "2024", "2025"], breaks);
  assert.deepEqual(grid.map((g) => g.change === null), [true, false, false, true]);
});

test("change summary horizons follow the frequency", () => {
  assert.deepEqual(changeSummary(obs([["2025", 1]]), "annual").changes.map((c) => c.horizon.id), ["1y", "4y"]);
  assert.deepEqual(changeSummary(obs([["2026-09", 1]]), "monthly").changes.map((c) => c.horizon.id), ["1m", "3m", "12m"]);
});

// ── Ranges & indexing ──────────────────────────────────────────────────────
test("ranges: annual offers only all years; monthly windows end-anchored", () => {
  assert.ok(isRangeId("max", "annual"));
  assert.ok(!isRangeId("12m", "annual"));
  assert.deepEqual(rangeWindow("monthly", "3m", "2026-09", "2005-01"), { start: "2026-06", end: "2026-09", truncated: false });
  assert.deepEqual(rangeWindow("monthly", "10y", "2026-09", "2020-01"), { start: "2020-01", end: "2026-09", truncated: true });
  assert.deepEqual(supportedRanges("monthly", "2026-01", "2026-09"), ["3m", "6m", "max"]);
});

test("indexing: common base, break and missing-base exclusions, estimates kept", () => {
  const a = obs([["2021", 50], ["2022", 60], ["2025", 75, true]]);
  const b = obs([["2022", 10], ["2023", 20], ["2025", 30, true]]);
  const t = obs([["2021", 1], ["2022", 2], ["2023", 3]]);
  const base = chooseIndexBase(
    [{ id: "a", obs: a }, { id: "b", obs: b }, { id: "t", obs: t, breaks: [{ period: "2023", statedAs: "x" }] }],
    "2021",
    "2025",
  );
  assert.equal(base.basePeriod, "2022");
  assert.deepEqual(base.included, ["a", "b"]);
  assert.match(base.excluded.find((e) => e.id === "t")!.reason, /changes in 2023/);
  const ia = indexSeries(a, "2022", "2021", "2025");
  assert.deepEqual(ia.map((o) => o.period), ["2022", "2025"]);
  assert.equal(ia[0].value, 100);
  assert.equal(ia[1].estimated, true);
});

test("units: absolute axis only for identical unit, currency and frequency", () => {
  const m = { currency: "USD", unit: "US$ per metric tonne", frequency: "monthly" as const };
  assert.ok(unitsCompatible([m, { ...m }]));
  assert.ok(!unitsCompatible([m, { ...m, frequency: "annual" }]));
  assert.ok(!unitsCompatible([m, { ...m, unit: "US$ per pound" }]));
  assert.ok(!unitsCompatible([]));
});

test("movers: same endpoints for all; incomparable series listed apart", () => {
  const r = rankMovers(
    [
      { id: "x", obs: obs([["2024", 100], ["2025", 50]]) },
      { id: "y", obs: obs([["2024", 100], ["2025", 110]]) },
      { id: "z", obs: obs([["2025", 1]]) },
    ],
    1,
    "2025",
  );
  assert.deepEqual(r.ranked.map((m) => m.id), ["x", "y"]);
  assert.deepEqual(r.unranked.map((u) => u.id), ["z"]);
});

test("formatting: rounding only at display; estimate marker", () => {
  assert.equal(formatPct(4.95), "+5.0%");
  assert.equal(formatPct(-0.04), "0.0%");
  assert.equal(formatPct(null), "—");
  assert.equal(formatPeriod("2026-09"), "Sep 2026");
  assert.equal(formatPeriod("2025"), "2025");
  assert.equal(formatObservationPeriod({ period: "2025", estimated: true }), "2025e");
  assert.equal(formatObservationPeriod({ period: "2025", estimated: true }, true), "2025 (estimated)");
  assert.equal(formatNumber(1234567.891, 2), "1,234,567.89");
  assert.ok(isStale("2026-08", "2026-09"));
});

// ── Stored data ────────────────────────────────────────────────────────────
test("stored market data passes validation with no warnings", () => {
  const r = validateMarketData(real());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test("three datasets: World Bank and IMF monthly, USGS annual", () => {
  const d = getMarketDatasets();
  assert.deepEqual(d.map((x) => [x.manifest.datasetId, x.manifest.frequency]), [
    ["wb-pink-sheet", "monthly"],
    ["imf-pcps", "monthly"],
    ["usgs-mcs-2026", "annual"],
  ]);
  assert.deepEqual(d.map((x) => x.manifest.license.kind), ["cc-by-4.0", "imf-terms", "cc0-1.0"]);
  assert.equal(getMarketSeries("annual").length, 25);
  assert.ok(getMarketSeries("monthly").length >= 6);
});

test("USGS: only 2025 is estimated, values match the release", () => {
  for (const s of getMarketSeries("annual")) {
    const o = getObservations(s.id);
    assert.deepEqual(o.map((x) => x.period), ["2021", "2022", "2023", "2024", "2025"], s.id);
    assert.deepEqual(o.map((x) => Boolean(x.estimated)), [false, false, false, false, true], s.id);
  }
  assert.equal(valueAt(getObservations("usgs-ndpr-oxide"), "2022"), 124);
  assert.equal(valueAt(getObservations("usgs-lithium-carbonate"), "2022"), 63700);
  assert.equal(valueAt(getObservations("usgs-germanium-metal"), "2025"), 4100);
  assert.deepEqual(getMarketSeriesById("usgs-tantalite")!.sourceBreaks.map((b) => b.period), ["2022", "2025"]);
});

test("cross-source sanity: IMF cobalt and palladium track USGS annual figures", () => {
  // IMF cobalt is stored in US$/t; USGS reports LME cash in US$/lb. Convert only here, in the test.
  const LB_PER_T = 2204.62262;
  const mean = (id: string, y: string) => {
    const v = getObservations(id).filter((o) => o.period.startsWith(`${y}-`)).map((o) => o.value);
    assert.equal(v.length, 12, `${id} ${y}`);
    return v.reduce((a, b) => a + b, 0) / 12;
  };
  for (const y of ["2021", "2022", "2023", "2024"]) {
    const co = mean("imf-cobalt", y) / LB_PER_T;
    const usgsCo = valueAt(getObservations("usgs-cobalt-lme"), y)!;
    assert.ok(Math.abs(co / usgsCo - 1) < 0.02, `cobalt ${y}: ${co} vs ${usgsCo}`);
    const pd = mean("imf-palladium", y);
    const usgsPd = valueAt(getObservations("usgs-palladium"), y)!;
    assert.ok(Math.abs(pd / usgsPd - 1) < 0.02, `palladium ${y}: ${pd} vs ${usgsPd}`);
  }
});

test("coverage: every material has a monthly series or a stated gap", () => {
  const monthly = new Set(getMarketSeries("monthly").map((s) => s.materialId));
  const gaps = new Map(getMarketCoverage().gaps.map((g) => [g.materialId, g.status]));
  for (const m of materialIds) assert.ok(monthly.has(m) !== gaps.has(m), m);
  assert.equal(gaps.get("praseodymium"), "joint_only");
  assert.equal(gaps.get("ndfeb-magnets"), "no_open_series_identified");
  assert.equal(gaps.get("lithium"), "annual_only");
  assert.ok(getMarketSeriesForMaterial("praseodymium").some((s) => s.id === "usgs-ndpr-oxide"));
});

test("trade unit values are never labelled as prices", () => {
  const uv = getMarketSeries().filter((s) => s.priceType === "trade_unit_value");
  assert.equal(uv.length, 6);
  for (const s of uv) assert.doesNotMatch(`${s.label} ${s.benchmark}`, /\b(price|benchmark|assessment|spot)\b/i, s.id);
});

// ── Validation failures ────────────────────────────────────────────────────
test("validation rejects malformed data", () => {
  const cases: Array<[string, (i: MarketDataInput) => void, RegExp]> = [
    ["gap in years", (i) => ds(i, "usgs-mcs-2026").observations.observations["usgs-antimony"].splice(2, 1), /missing period|observationCount/],
    ["monthly period in annual set", (i) => (ds(i, "usgs-mcs-2026").observations.observations["usgs-antimony"][0].period = "2021-01"), /invalid annual period/],
    ["firm after estimate", (i) => {
      const o = ds(i, "usgs-mcs-2026").observations.observations["usgs-antimony"];
      o[3].estimated = true;
      delete o[4].estimated;
    }, /follows an estimate/],
    ["estimatedCount mismatch", (i) => (ds(i, "usgs-mcs-2026").series[0].estimatedCount = 0), /estimatedCount/],
    ["unit value called a price", (i) => {
      const s = ds(i, "usgs-mcs-2026").series.find((x) => x.priceType === "trade_unit_value")!;
      s.label = "Gallium spot price";
    }, /labelled as a price/],
    ["duplicate id across datasets", (i) => (ds(i, "imf-pcps").series[0].id = ds(i, "wb-pink-sheet").series[0].id), /more than one dataset/],
    ["break outside window", (i) => (ds(i, "usgs-mcs-2026").series.find((s) => s.id === "usgs-tantalite")!.sourceBreaks[0].period = "2021"), /outside the stored window/],
    ["IMF without changes statement", (i) => (ds(i, "imf-pcps").manifest.changesMade = "None."), /statement of changes/],
    ["coverage gap for a monthly material", (i) => i.coverage.gaps.push({ ...i.coverage.gaps[0], materialId: "copper" }), /already has a published monthly series/],
    ["coverage gap holding a number", (i) => ((i.coverage.gaps[0] as unknown as Record<string, unknown>).price = 1), /hold no prices/],
    ["material with no coverage", (i) => i.coverage.gaps.splice(i.coverage.gaps.findIndex((g) => g.materialId === "boron"), 1), /"boron" has no monthly series/],
    ["joint_only wrongly used", (i) => (i.coverage.gaps.find((g) => g.materialId === "lithium")!.status = "joint_only"), /joint_only/],
  ];
  for (const [name, mutate, re] of cases) {
    const input = real();
    mutate(input);
    assert.ok(errorsOf(input).some((e) => re.test(e)), `${name}: ${errorsOf(input).join(" | ")}`);
  }
});

// ── CSV ────────────────────────────────────────────────────────────────────
test("CSV: every source attributed, every row present, estimates and frequency explicit", () => {
  const datasets = getMarketDatasets();
  const csv = buildMarketsCsv(datasets);
  const lines = csv.trimEnd().split("\r\n");
  for (const d of datasets) assert.ok(lines.some((l) => l.startsWith(`# [${d.manifest.datasetId}] `) && l.includes(d.manifest.attribution)));
  const headerAt = lines.findIndex((l) => l === MARKET_CSV_HEADERS.join(","));
  assert.ok(headerAt > 0);
  const rows = lines.slice(headerAt + 1).map(splitCsv);
  assert.ok(rows.every((r) => r.length === MARKET_CSV_HEADERS.length));
  const expected = datasets.reduce((n, d) => n + d.series.reduce((k, s) => k + d.observations.observations[s.id].length, 0), 0);
  assert.equal(rows.length, expected);
  const col = (name: (typeof MARKET_CSV_HEADERS)[number]) => MARKET_CSV_HEADERS.indexOf(name);
  const nd = rows.find((r) => r[0] === "usgs-ndpr-oxide" && r[col("period")] === "2025")!;
  assert.equal(nd[col("estimated")], "true");
  assert.equal(nd[col("frequency")], "annual");
  assert.equal(nd[col("related_material_ids")], "praseodymium");
  assert.equal(nd[col("license")], "CC0 1.0");
  assert.ok(rows.every((r) => r.every((c) => !c.startsWith("="))));
});

test("CSV cells: formula injection defused, decimals kept numeric", () => {
  assert.equal(csvCell("=HYPERLINK(1)"), '"\t=HYPERLINK(1)"');
  assert.equal(csvCell("-12.5"), "-12.5");
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell(null), "");
});

// ---- Explorer UI ----------------------------------------------------------

test("colour slots: a series keeps its slot when another is removed", async () => {
  const { slotsFrom, toggleSlot } = await import("@/components/markets/market-monitor");
  const known = new Set(["a", "b", "c", "d", "e", "f", "g"]);
  const slots = slotsFrom(["a", "zz", "b", "a", "c"], known);
  assert.deepEqual(slots, ["a", "b", "c", null, null, null]);
  const removed = toggleSlot(slots, "b");
  assert.deepEqual(removed, ["a", null, "c", null, null, null]);
  assert.deepEqual(toggleSlot(removed, "d"), ["a", "d", "c", null, null, null]);
  const full = slotsFrom(["a", "b", "c", "d", "e", "f", "g"], known);
  assert.equal(full.includes("g"), false);
  assert.deepEqual(toggleSlot(full, "g"), full, "a seventh series is refused, not assigned a generated hue");
});

test("chart segments: no join across gaps or source breaks; estimated steps drawn apart", async () => {
  const { lineSegments } = await import("@/components/markets/price-chart");
  const periods = ["2021", "2022", "2023", "2024", "2025"];
  const x = (p: string) => Number(p) - 2021;
  const y = (v: number) => v;
  const full = obs([["2021", 1], ["2022", 2], ["2023", 3], ["2024", 4], ["2025", 5, true]]);
  const r = lineSegments(full, periods, [{ period: "2023", statedAs: "new source" }], x, y);
  assert.deepEqual(
    r.segments.map((s) => [s.d, s.estimated]),
    [["M0.0,1.0L1.0,2.0", false], ["M2.0,3.0L3.0,4.0", false], ["M3.0,4.0L4.0,5.0", true]],
  );
  assert.equal(r.singles.length, 0);
  const gap = lineSegments(obs([["2021", 1], ["2023", 3], ["2024", 4]]), periods, [], x, y);
  assert.deepEqual(gap.segments.map((s) => s.d), ["M2.0,3.0L3.0,4.0"]);
  assert.deepEqual(gap.singles.map((s) => s.period), ["2021"]);
});

test("heat scale: round maximum near the 95th percentile", async () => {
  const { heatScaleMax } = await import("@/components/markets/heatmap");
  const row = (pcts: Array<number | null>) => ({
    id: "r", label: "r", color: "#000", dash: undefined, unit: "u", digits: 0,
    cells: pcts.map((pct, i) => ({
      period: String(2000 + i),
      change: pct === null ? null : { fromPeriod: "", toPeriod: "", fromValue: 1, toValue: 1, pct, estimated: false },
    })),
  });
  assert.equal(heatScaleMax([]), 5);
  assert.equal(heatScaleMax([row([1, -1.5, null])]), 2);
  assert.equal(heatScaleMax([row([4, -12, 7])]), 15);
});

test("explorer renders the real series with the default selection and attribution", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { MarketExplorer, DEFAULT_SELECTION } = await import("@/components/markets/market-monitor");
  const { buildMonitorSeries, buildReleaseNotices } = await import("@/components/markets/series");
  const series = buildMonitorSeries();
  const ids = new Set(series.map((s) => s.id));
  for (const id of [...DEFAULT_SELECTION.monthly, ...DEFAULT_SELECTION.annual]) assert.ok(ids.has(id), `default ${id} exists`);
  assert.equal(series.length, getMarketSeries().length);
  const html = renderToStaticMarkup(createElement(MarketExplorer, { series, releaseNotices: buildReleaseNotices() }));
  assert.match(html, /Compare series/);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length >= DEFAULT_SELECTION.monthly.length, true);
  for (const s of series.filter((s) => s.priceType === "trade_unit_value")) {
    assert.doesNotMatch(s.label, /\bprice\b/i, `${s.id} label`);
  }
});
