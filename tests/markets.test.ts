import test from "node:test";
import assert from "node:assert/strict";
import {
  addMonths,
  changeBetween,
  changeOver,
  changeSummary,
  chooseIndexBase,
  formatNumber,
  formatPeriod,
  formatPct,
  indexSeries,
  isRangeId,
  isStale,
  isValidPeriod,
  monthlyChangeGrid,
  monthsBetween,
  periodRange,
  rangeWindow,
  rankMovers,
  supportedRanges,
  unitsCompatible,
  validateMarketData,
  type MarketDataInput,
  type Observation,
} from "@/lib/markets";
import { getMarketCoverage, getMarketManifest, getMarketSeries, getObservations } from "@/lib/market-data";
import materials from "@/data/seed/materials.json";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { heatScaleMax, type HeatRow } from "@/components/markets/heatmap";
import { MarketMonitor, type MonitorGap } from "@/components/markets/market-monitor";
import type { MonitorSeries } from "@/components/markets/types";
import { buildMarketsCsv, MARKET_CSV_HEADERS } from "@/lib/markets-csv";

const materialIds = new Set((materials as Array<{ id: string }>).map((m) => m.id));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const real = (): MarketDataInput => ({
  manifest: clone(getMarketManifest()),
  series: clone(getMarketSeries()),
  observations: { seriesIds: [...getMarketManifest().seriesIds], observations: Object.fromEntries(getMarketSeries().map((s) => [s.id, clone(getObservations(s.id))])) },
  coverage: clone(getMarketCoverage()),
  materialIds,
});
const hasError = (input: MarketDataInput, re: RegExp) => validateMarketData(input).errors.some((e) => re.test(e));
const obs = (start: string, values: number[]): Observation[] => values.map((value, i) => ({ period: addMonths(start, i), value }));
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

// ── The stored data ─────────────────────────────────────────────────────────
test("stored market data passes validation with no errors or warnings", () => {
  const r = validateMarketData(real());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test("stored series are the three World Bank base metals through the stated cutoff", () => {
  const m = getMarketManifest();
  assert.deepEqual(m.seriesIds, ["wb-aluminum", "wb-copper", "wb-nickel"]);
  assert.equal(m.observationCutoff, "2026-10");
  for (const s of getMarketSeries()) {
    assert.equal(s.lastPeriod, m.observationCutoff);
    assert.equal(getObservations(s.id).length, periodRange(s.firstPeriod, s.lastPeriod).length);
  }
});

test("known changes match hand-computed values from the Pink Sheet", () => {
  const cu = getObservations("wb-copper");
  const ni = getObservations("wb-nickel");
  const al = getObservations("wb-aluminum");
  // Copper Oct 2026 14508 vs Sep 14474, Jul 13543, Oct 2025 10740.
  close(changeOver(cu, 1)!.pct, (14508 / 14474 - 1) * 100);
  close(changeOver(cu, 3)!.pct, (14508 / 13543 - 1) * 100);
  close(changeOver(cu, 12)!.pct, (14508 / 10740 - 1) * 100);
  assert.equal(formatPct(changeOver(cu, 1)!.pct, 2), "+0.23%");
  assert.equal(formatPct(changeOver(cu, 3)!.pct, 2), "+7.13%");
  assert.equal(formatPct(changeOver(cu, 12)!.pct, 2), "+35.08%");
  assert.equal(formatPct(changeOver(ni, 1)!.pct, 2), "−5.44%");
  assert.equal(formatPct(changeOver(al, 1)!.pct, 2), "−6.76%");
  const sum = changeSummary(cu);
  assert.equal(sum.latest?.period, "2026-10");
  assert.equal(sum.m3?.fromPeriod, "2026-07");
  assert.equal(sum.y1?.fromPeriod, "2025-10");
});

test("the 3M indexed view ends at the same figure as the 3M change", () => {
  const cu = getObservations("wb-copper");
  const w = rangeWindow("3m", "2026-10", "2005-01");
  assert.deepEqual(w, { start: "2026-07", end: "2026-10", truncated: false });
  const idx = indexSeries(cu, w.start, w.start, w.end);
  assert.equal(idx[0].value, 100);
  close(idx.at(-1)!.value - 100, changeOver(cu, 3)!.pct);
});

// ── Periods ─────────────────────────────────────────────────────────────────
test("period helpers reject invalid months and cross year boundaries", () => {
  for (const bad of ["2026-13", "2026-00", "2026-1", "26-01", "2026/01", "", null, 202601]) assert.equal(isValidPeriod(bad), false);
  assert.equal(isValidPeriod("2026-01"), true);
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(addMonths("2025-11", 3), "2026-02");
  assert.equal(monthsBetween("2025-10", "2026-10"), 12);
  assert.deepEqual(periodRange("2025-11", "2026-02"), ["2025-11", "2025-12", "2026-01", "2026-02"]);
});

// ── Changes ─────────────────────────────────────────────────────────────────
test("a change across a missing month is null, never interpolated", () => {
  const s = [
    { period: "2026-01", value: 100 },
    { period: "2026-03", value: 120 },
  ];
  assert.equal(changeOver(s, 1), null); // Feb absent
  close(changeBetween(s, "2026-01", "2026-03")!.pct, 20);
  assert.equal(changeOver([], 1), null);
});

test("a non-positive base yields no change", () => {
  assert.equal(changeBetween(obs("2026-01", [0, 10]), "2026-01", "2026-02"), null);
  assert.equal(changeBetween(obs("2026-01", [-5, 10]), "2026-01", "2026-02"), null);
});

test("percentage direction and magnitude are right", () => {
  const s = obs("2026-01", [200, 150, 300]);
  assert.equal(changeBetween(s, "2026-01", "2026-02")!.pct, -25);
  assert.equal(changeBetween(s, "2026-02", "2026-03")!.pct, 100);
});

// ── Windows ─────────────────────────────────────────────────────────────────
test("range windows truncate at the earliest month and say so", () => {
  assert.deepEqual(rangeWindow("12m", "2026-10", "2026-01"), { start: "2026-01", end: "2026-10", truncated: true });
  assert.deepEqual(rangeWindow("max", "2026-10", "2005-01"), { start: "2005-01", end: "2026-10", truncated: false });
  assert.deepEqual(supportedRanges("2026-01", "2026-10"), ["3m", "6m", "max"]);
  assert.ok(supportedRanges("2005-01", "2026-10").includes("10y"));
  assert.equal(isRangeId("6m"), true);
  assert.equal(isRangeId("2y"), false);
});

// ── Indexing ────────────────────────────────────────────────────────────────
test("series with different start dates are rebased at the latest common first month", () => {
  const a = obs("2026-01", [100, 110, 120, 130]);
  const b = obs("2026-03", [50, 60]);
  const base = chooseIndexBase([{ id: "a", obs: a }, { id: "b", obs: b }], "2026-01", "2026-04");
  assert.equal(base.basePeriod, "2026-03");
  assert.deepEqual(base.included, ["a", "b"]);
  assert.equal(base.explanation, null);
  const ia = indexSeries(a, base.basePeriod!, "2026-01", "2026-04");
  assert.deepEqual(ia.map((o) => o.period), ["2026-03", "2026-04"]);
  close(ia[1].value, (130 / 120) * 100);
  assert.deepEqual(indexSeries(b, base.basePeriod!, "2026-01", "2026-04").map((o) => o.value), [100, 120]);
});

test("a series missing the common base month is excluded with a reason", () => {
  const a = obs("2026-01", [100, 110, 120, 130]);
  const c = [
    { period: "2026-01", value: 10 },
    { period: "2026-04", value: 12 },
  ];
  const b = obs("2026-03", [50, 60]);
  const base = chooseIndexBase([{ id: "a", obs: a }, { id: "b", obs: b }, { id: "c", obs: c }], "2026-01", "2026-04");
  assert.equal(base.basePeriod, "2026-03");
  assert.deepEqual(base.included, ["a", "b"]);
  assert.equal(base.excluded.length, 1);
  assert.equal(base.excluded[0].id, "c");
  assert.match(base.excluded[0].reason, /2026-03/);
});

test("no common base month produces an explanation, not a chart", () => {
  const a = [{ period: "2026-01", value: 1 }];
  const b = [{ period: "2026-02", value: 1 }];
  const r = chooseIndexBase([{ id: "a", obs: a }, { id: "b", obs: b }], "2026-01", "2026-02");
  // Base is Feb (latest first); a has no Feb value, b does → b alone is included.
  assert.deepEqual(r.included, ["b"]);
  const none = chooseIndexBase([{ id: "a", obs: a }], "2026-05", "2026-06");
  assert.equal(none.basePeriod, null);
  assert.ok(none.explanation);
  const disjoint = chooseIndexBase(
    [
      { id: "a", obs: [{ period: "2026-01", value: 1 }, { period: "2026-03", value: 1 }] },
      { id: "b", obs: [{ period: "2026-02", value: 1 }, { period: "2026-04", value: 1 }] },
    ],
    "2026-01",
    "2026-04",
  );
  // Base = Feb; a lacks Feb → only b included. Never a fabricated base.
  assert.deepEqual(disjoint.included, ["b"]);
  assert.equal(indexSeries([{ period: "2026-01", value: 1 }], "2026-02", "2026-01", "2026-02").length, 0);
});

// ── Units ───────────────────────────────────────────────────────────────────
test("incompatible units or currencies never share an absolute axis", () => {
  assert.equal(unitsCompatible([{ currency: "USD", unit: "US$ per metric tonne" }, { currency: "USD", unit: "US$ per metric tonne" }]), true);
  assert.equal(unitsCompatible([{ currency: "USD", unit: "US$ per metric tonne" }, { currency: "USD", unit: "US$ per kg" }]), false);
  assert.equal(unitsCompatible([{ currency: "USD", unit: "US$ per metric tonne" }, { currency: "CNY", unit: "US$ per metric tonne" }]), false);
  assert.equal(unitsCompatible([]), false);
  assert.equal(unitsCompatible(getMarketSeries()), true);
});

// ── Heatmap and movers ──────────────────────────────────────────────────────
test("heatmap cells are month-on-month changes with gaps left empty", () => {
  const s = [
    { period: "2026-01", value: 100 },
    { period: "2026-02", value: 110 },
    { period: "2026-04", value: 99 },
  ];
  const grid = monthlyChangeGrid(s, periodRange("2026-01", "2026-04"));
  assert.equal(grid[0].change, null); // no December
  close(grid[1].change!.pct, 10);
  assert.equal(grid[2].change, null); // March absent
  assert.equal(grid[3].change, null); // March absent as prior
});

test("movers rank by absolute change, break ties by id, and list missing endpoints apart", () => {
  const r = rankMovers(
    [
      { id: "up", obs: obs("2026-01", [100, 105]) },
      { id: "down", obs: obs("2026-01", [100, 90]) },
      { id: "tie", obs: obs("2026-01", [100, 95]) },
      { id: "also", obs: obs("2026-01", [100, 105]) },
      { id: "short", obs: obs("2026-02", [10]) },
    ],
    1,
    "2026-02",
  );
  assert.deepEqual(r.ranked.map((m) => m.id), ["down", "also", "tie", "up"]);
  assert.deepEqual(r.unranked.map((u) => u.id), ["short"]);
  assert.match(r.unranked[0].reason, /2026-01/);
});

// ── Staleness and formatting ────────────────────────────────────────────────
test("a series ending before the cutoff is stale", () => {
  assert.equal(isStale("2026-09", "2026-10"), true);
  assert.equal(isStale("2026-10", "2026-10"), false);
});

test("display formatting rounds only at the end and uses a true minus", () => {
  assert.equal(formatPct(5.4449), "+5.4%");
  assert.equal(formatPct(-5.444, 2), "−5.44%");
  assert.equal(formatPct(-0.04), "0.0%");
  assert.equal(formatPct(null), "—");
  assert.equal(formatPct(Number.NaN), "—");
  assert.equal(formatNumber(14508), "14,508");
  assert.equal(formatNumber(1234567.891, 2), "1,234,567.89");
  assert.equal(formatNumber(-3061), "−3,061");
});

// ── Validation failures ─────────────────────────────────────────────────────
test("validation rejects a duplicate period", () => {
  const d = real();
  const cu = d.observations.observations["wb-copper"];
  cu.splice(5, 0, { ...cu[5] });
  assert.ok(hasError(d, /duplicate period/));
});

test("validation rejects an invalid date", () => {
  const d = real();
  d.observations.observations["wb-copper"][3].period = "2005-13";
  assert.ok(hasError(d, /invalid period "2005-13"/));
  const m = real();
  m.manifest.releaseDate = "2026-02-30";
  assert.ok(hasError(m, /releaseDate .* not a real/));
});

test("validation rejects a missing period", () => {
  const d = real();
  d.observations.observations["wb-nickel"].splice(10, 1);
  assert.ok(hasError(d, /missing period\(s\)/));
});

test("validation rejects non-positive and non-finite values", () => {
  for (const v of [0, -1, Number.NaN]) {
    const d = real();
    d.observations.observations["wb-aluminum"][7].value = v;
    assert.ok(hasError(d, /positive finite number/), `value ${v}`);
  }
});

test("validation rejects an incompatible unit", () => {
  const d = real();
  d.series[0].unit = "US$ per kg";
  assert.ok(hasError(d, /unit basis/));
  const c = real();
  c.series[1].currency = "EUR";
  assert.ok(hasError(c, /unit basis/));
});

test("validation rejects invalid and unknown ids", () => {
  const d = real();
  d.series[0].id = "WB Aluminium";
  assert.ok(hasError(d, /id must match/));
  const m = real();
  m.series[0].materialId = "unobtainium";
  assert.ok(hasError(m, /materialId "unobtainium"/));
  const o = real();
  o.observations.observations["wb-zinc"] = [{ period: "2026-01", value: 1 }];
  assert.ok(hasError(o, /"wb-zinc" is not a series id/));
  const dup = real();
  dup.series[2].id = dup.series[1].id;
  assert.ok(hasError(dup, /duplicate id/));
});

test("validation rejects missing metadata", () => {
  const d = real();
  d.series[0].benchmark = "";
  assert.ok(hasError(d, /missing benchmark/));
  const l = real();
  l.series[0].limitations = [];
  assert.ok(hasError(l, /limitations/));
  const m = real();
  m.manifest.attribution = " ";
  assert.ok(hasError(m, /missing attribution/));
  const lic = real();
  lic.manifest.license.name = "All rights reserved";
  assert.ok(hasError(lic, /licence/));
  const sha = real();
  sha.manifest.workbook.sha256 = "abc";
  assert.ok(hasError(sha, /sha256/));
});

test("validation rejects metadata that disagrees with the observations", () => {
  const d = real();
  d.series[1].lastPeriod = "2026-09";
  assert.ok(hasError(d, /lastPeriod 2026-09 ≠/));
  const c = real();
  c.series[1].observationCount = 1;
  assert.ok(hasError(c, /observationCount/));
  const o = real();
  o.manifest.seriesIds = [...o.manifest.seriesIds].reverse();
  assert.ok(hasError(o, /manifest.seriesIds/));
});

test("an observation after the cutoff is an error; one ending before it is a stale warning", () => {
  const late = real();
  late.manifest.observationCutoff = "2026-09";
  late.manifest.releaseDate = "2026-10-03";
  late.manifest.retrievedOn = "2026-10-09";
  assert.ok(hasError(late, /after the stated cutoff/));
  const stale = real();
  const ni = stale.observations.observations["wb-nickel"];
  ni.pop();
  stale.series[2].lastPeriod = ni.at(-1)!.period;
  stale.series[2].observationCount = ni.length;
  const r = validateMarketData(stale);
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => /labelled stale/.test(w)));
});

test("a cutoff in or after the release month is rejected", () => {
  const d = real();
  d.manifest.observationCutoff = "2026-11";
  assert.ok(hasError(d, /not before the release month/));
});

test("coverage-gap entries may hold no figures and no covered material", () => {
  const n = real();
  (n.coverage.gaps[0] as unknown as Record<string, unknown>).latestPrice = 123;
  assert.ok(hasError(n, /holds a number/));
  assert.ok(hasError(n, /unexpected field/));
  const c = real();
  c.coverage.gaps[0].materialId = "copper";
  assert.ok(hasError(c, /already has a published series/));
  const dup = real();
  dup.coverage.gaps.push(clone(dup.coverage.gaps[0]));
  assert.ok(hasError(dup, /duplicate/));
});

// ── Formatting, scale, export and render ────────────────────────────────────

test("formatPeriod gives short and long month labels without a day", () => {
  assert.equal(formatPeriod("2026-10"), "Oct 2026");
  assert.equal(formatPeriod("2026-10", true), "October 2026");
  assert.equal(formatPeriod("2025-01"), "Jan 2025");
});

test("heat scale defaults to 5% with no changes and rounds the 95th percentile up to a step", () => {
  const row = (pcts: Array<number | null>): HeatRow => ({
    id: "x",
    label: "X",
    color: "red",
    dash: undefined,
    unit: "u",
    cells: pcts.map((pct, i) => ({
      period: addMonths("2025-01", i),
      change: pct === null ? null : { pct, fromPeriod: "2024-12", toPeriod: "2025-01", fromValue: 1, toValue: 1 },
    })) as HeatRow["cells"],
  });
  assert.equal(heatScaleMax([]), 5);
  assert.equal(heatScaleMax([row([null, null])]), 5);
  assert.equal(heatScaleMax([row([1, -1.5, 0.5])]), 2);
  assert.equal(heatScaleMax([row([1, -4, 2])]), 5);
  assert.equal(heatScaleMax([row([12, -60])]), 60);
});

test("CSV export carries attribution, one row per stored observation and CRLF line ends", () => {
  const manifest = getMarketManifest();
  const series = getMarketSeries();
  const csv = buildMarketsCsv(manifest, series, getObservations);
  assert.ok(csv.endsWith("\r\n"));
  const lines = csv.slice(0, -2).split("\r\n");
  const preamble = lines.filter((l) => l.startsWith("# "));
  assert.ok(preamble.some((l) => l.includes("CC BY 4.0")));
  assert.ok(preamble.some((l) => /not investment advice and not a forecast/.test(l)));
  const header = lines[preamble.length];
  assert.equal(header, MARKET_CSV_HEADERS.join(","));
  const rows = lines.slice(preamble.length + 1);
  const expected = series.reduce((n, s) => n + getObservations(s.id).length, 0);
  assert.equal(rows.length, expected);
  assert.ok(rows.every((r) => r.endsWith(",CC BY 4.0")));
  assert.ok(!csv.includes("\n\n"));
});

test("the monitor renders defined terms, the export link and gaps without prices", () => {
  const series: MonitorSeries[] = getMarketSeries().map((s) => ({
    id: s.id,
    materialId: s.materialId,
    materialName: s.label,
    materialHref: `/materials/${s.materialId}`,
    label: s.label,
    benchmark: s.benchmark,
    unit: s.unit,
    currency: s.currency,
    priceBasis: s.priceBasis,
    aggregation: s.aggregation,
    firstPeriod: s.firstPeriod,
    lastPeriod: s.lastPeriod,
    obs: getObservations(s.id),
  }));
  const gaps: MonitorGap[] = getMarketCoverage().gaps.map((g) => ({
    materialId: g.materialId,
    materialName: g.materialId,
    materialHref: null,
    worldBankCoverage: g.worldBankCoverage,
    gradeDistinctions: g.gradeDistinctions,
    requirementForInclusion: g.requirementForInclusion,
  }));
  const html = renderToStaticMarkup(
    createElement(MarketMonitor, { series, gaps, cutoff: "2026-10", nextReleaseDate: "2026-12-02" }),
  );
  assert.ok(html.includes('href="/api/export/markets.csv"'));
  assert.match(html, /monthly benchmark average/i);
  assert.match(html, /indexed/i);
  for (const s of series) assert.ok(html.includes(s.label));
  const gapBlocks = html.split('border-dashed border-border-strong px-3 py-2.5').slice(1);
  assert.equal(gapBlocks.length, gaps.length);
  for (const block of gapBlocks) {
    const item = block.slice(0, block.indexOf("</li>"));
    assert.ok(item.includes("No open series identified"));
    assert.ok(!/US\$|USD|\/mt|per tonne/i.test(item), "a coverage gap must not show a price");
  }
});

test("an empty monitor renders an unavailable state rather than a chart", () => {
  const html = renderToStaticMarkup(
    createElement(MarketMonitor, { series: [], gaps: [], cutoff: "2026-10", nextReleaseDate: "2026-12-02" }),
  );
  assert.ok(!html.includes("<path"));
});
