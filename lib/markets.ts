/**
 * Critical Minerals Market Monitor — pure calculations and validation.
 *
 * Every figure on /markets comes from these functions, applied to the stored
 * series in `data/markets/<dataset>/observations.json`. Rules:
 *
 * - A period is a month ("YYYY-MM") or a year ("YYYY"). A series has one
 *   frequency, and monthly and annual periods are never mixed in one
 *   calculation or on one axis.
 * - A change over k periods compares the value at t with the value at exactly
 *   t−k. If either value is absent, or the source states that its underlying
 *   price source changed inside that interval, the change is `null`. Nothing
 *   is interpolated, carried forward or filled.
 * - A change that touches a value the source marks as an estimate is flagged
 *   `estimated`, and the UI must say so.
 * - Percentages are computed at full precision and rounded only for display.
 * - An indexed view rebases each series to 100 at one stated common period.
 *   A series with no value there, or with a source break after it, is left
 *   out with a reason.
 * - Values in different currencies or units are never put on one absolute
 *   axis or compared directly, and no unit or currency is converted.
 *
 * Nothing here reads the wall clock. "Latest" means the last stored
 * observation, which is an average for a past period, not a live price.
 */

// ── Types ───────────────────────────────────────────────────────────────────
export type Frequency = "monthly" | "annual";
export const FREQUENCIES = ["monthly", "annual"] as const satisfies readonly Frequency[];

export interface Observation {
  period: string;
  value: number;
  /** Present (and true) only when the source marks this value as an estimate. */
  estimated?: true;
}

/** What kind of number a series is. A trade unit value is never called a price. */
export const PRICE_TYPES = ["exchange_benchmark", "price_assessment", "trade_unit_value"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  exchange_benchmark: "Exchange benchmark",
  price_assessment: "Price assessment",
  trade_unit_value: "Trade unit value",
};

export interface SourceBreak {
  /** First period whose value comes from the new underlying source. */
  period: string;
  statedAs: string;
}

export interface MarketSeries {
  id: string;
  datasetId: string;
  materialId: string;
  /** Other materials the benchmark prices jointly (NdPr oxide → praseodymium). */
  relatedMaterialIds: string[];
  label: string;
  benchmark: string;
  priceType: PriceType;
  sourceSeriesName: string;
  sourceUnit: string;
  specification: string;
  /** True when the source marks the series as forecast or projected. */
  forecastFlag: boolean;
  form: string;
  grade: string;
  priceBasis: string;
  deliveryBasis: string | null;
  currency: string;
  unit: string;
  /** Compact unit for axes and cards, e.g. "US$/t". */
  unitShort: string;
  unitNote: string;
  frequency: Frequency;
  aggregation: string;
  underlyingSources: string | null;
  /** Source notes for the series, verbatim, when the source gives them. */
  sourceNotes: string | null;
  sourceBreaks: SourceBreak[];
  firstPeriod: string;
  lastPeriod: string;
  observationCount: number;
  estimatedCount: number;
  missingValueHandling: string;
  limitations: string[];
}

export const LICENSE_KINDS = ["cc-by-4.0", "cc0-1.0", "imf-terms"] as const;
export type LicenseKind = (typeof LICENSE_KINDS)[number];

export interface MarketManifest {
  schemaVersion: 2;
  /** Stable dataset key; also the directory name under data/markets/. */
  datasetId: string;
  releaseId: string;
  title: string;
  shortName: string;
  publisher: string;
  frequency: Frequency;
  sourceFile: {
    url: string;
    fileName: string;
    sha256: string;
    bytes: number;
    format: string;
    /** Verbatim release stamps read from the file (sheet subtitle, update date, …). */
    details: Record<string, string>;
  };
  landingPageUrl: string;
  catalogUrl: string;
  doi: string | null;
  releaseDate: string;
  retrievedOn: string;
  windowStart: string;
  observationCutoff: string;
  nextScheduledRelease: { date: string; statedAs: string; sourceUrl: string } | null;
  updateFrequency: { statedAs: string; sourceUrl: string } | null;
  aggregationBasis: { statedAs: string; note: string; sourceUrl: string };
  license: { kind: LicenseKind; name: string; url: string | null; statedAt: string; termsUrl: string; statedText: string };
  attribution: string;
  changesMade: string;
  thirdPartyNote: string;
  seriesIds: string[];
}

export const COVERAGE_STATUSES = ["annual_only", "joint_only", "no_open_series_identified"] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export interface MarketCoverageGap {
  materialId: string;
  status: CoverageStatus;
  /** What the pinned monthly sources do and do not carry for this material. */
  monthlyCoverage: string;
  gradeDistinctions: string;
  requirementForInclusion: string;
}

export interface MarketCoverageFile {
  schemaVersion: 2;
  note: string;
  gaps: MarketCoverageGap[];
}

export interface ObservationsFile {
  seriesIds: string[];
  observations: Record<string, Observation[]>;
}

export interface MarketDataset {
  manifest: MarketManifest;
  series: MarketSeries[];
  observations: ObservationsFile;
}

// ── Periods ─────────────────────────────────────────────────────────────────
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const YEAR_RE = /^(\d{4})$/;

export function periodFrequency(p: unknown): Frequency | null {
  if (typeof p !== "string") return null;
  if (MONTH_RE.test(p)) return "monthly";
  if (YEAR_RE.test(p)) return "annual";
  return null;
}

/** A well-formed period, optionally of one frequency. */
export function isValidPeriod(p: unknown, frequency?: Frequency): p is string {
  const f = periodFrequency(p);
  return f !== null && (frequency === undefined || f === frequency);
}

function periodIndex(p: string): { f: Frequency; i: number } {
  const m = MONTH_RE.exec(p);
  if (m) return { f: "monthly", i: Number(m[1]) * 12 + (Number(m[2]) - 1) };
  const y = YEAR_RE.exec(p);
  if (y) return { f: "annual", i: Number(y[1]) };
  throw new Error(`Invalid period "${p}"`);
}

function fromIndex(i: number, f: Frequency): string {
  if (f === "annual") return String(i);
  const y = Math.floor(i / 12);
  return `${y}-${String((i % 12) + 1).padStart(2, "0")}`;
}

/** The period n steps after p (n may be negative), in p's own frequency. */
export function addPeriods(p: string, n: number): string {
  const { f, i } = periodIndex(p);
  return fromIndex(i + n, f);
}

/** Whole periods from a to b (b − a). Throws if their frequencies differ. */
export function periodsBetween(a: string, b: string): number {
  const pa = periodIndex(a);
  const pb = periodIndex(b);
  if (pa.f !== pb.f) throw new Error(`Cannot compare a ${pa.f} period (${a}) with a ${pb.f} period (${b})`);
  return pb.i - pa.i;
}

/** Monthly shorthand kept for readability where only months make sense. */
export function addMonths(p: string, n: number): string {
  if (!isValidPeriod(p, "monthly")) throw new Error(`"${p}" is not a month`);
  return addPeriods(p, n);
}

export function monthsBetween(a: string, b: string): number {
  if (!isValidPeriod(a, "monthly") || !isValidPeriod(b, "monthly")) throw new Error(`"${a}" or "${b}" is not a month`);
  return periodsBetween(a, b);
}

/** Inclusive list of periods from start to end. */
export function periodRange(start: string, end: string): string[] {
  const n = periodsBetween(start, end);
  const out: string[] = [];
  for (let k = 0; k <= n; k++) out.push(addPeriods(start, k));
  return out;
}

// ── Lookups ─────────────────────────────────────────────────────────────────
export function observationAt(obs: readonly Observation[], period: string): Observation | null {
  // Series are short (hundreds of points) and sorted; a linear scan is clear and fast enough.
  for (const o of obs) if (o.period === period) return o;
  return null;
}

export function valueAt(obs: readonly Observation[], period: string): number | null {
  return observationAt(obs, period)?.value ?? null;
}

export function latestObservation(obs: readonly Observation[]): Observation | null {
  return obs.length ? obs[obs.length - 1] : null;
}

/** The source break, if any, that falls inside (from, to]. */
export function breakBetween(breaks: readonly SourceBreak[] | undefined, from: string, to: string): SourceBreak | null {
  for (const b of breaks ?? []) if (b.period > from && b.period <= to) return b;
  return null;
}

// ── Changes ─────────────────────────────────────────────────────────────────
export interface Change {
  fromPeriod: string;
  toPeriod: string;
  fromValue: number;
  toValue: number;
  /** Full-precision percentage change, (to / from − 1) × 100. */
  pct: number;
  /** True when either endpoint is a value the source marks as an estimate. */
  estimated: boolean;
}

/**
 * Percentage change between two named periods. Null if either value is
 * absent or a stated source break falls between them.
 */
export function changeBetween(
  obs: readonly Observation[],
  fromPeriod: string,
  toPeriod: string,
  breaks?: readonly SourceBreak[],
): Change | null {
  const from = observationAt(obs, fromPeriod);
  const to = observationAt(obs, toPeriod);
  if (!from || !to || from.value <= 0) return null;
  if (breakBetween(breaks, fromPeriod, toPeriod)) return null;
  return {
    fromPeriod,
    toPeriod,
    fromValue: from.value,
    toValue: to.value,
    pct: (to.value / from.value - 1) * 100,
    estimated: Boolean(from.estimated || to.estimated),
  };
}

/** Change over exactly `lag` periods ending at `period` (defaults to the last observation). */
export function changeOver(obs: readonly Observation[], lag: number, period?: string, breaks?: readonly SourceBreak[]): Change | null {
  const end = period ?? latestObservation(obs)?.period;
  if (!end) return null;
  return changeBetween(obs, addPeriods(end, -lag), end, breaks);
}

/** Why a change could not be computed, in plain language; null when it can be. */
export function changeGapReason(
  obs: readonly Observation[],
  fromPeriod: string,
  toPeriod: string,
  breaks?: readonly SourceBreak[],
): string | null {
  if (!observationAt(obs, toPeriod)) return `No value for ${formatPeriod(toPeriod)}.`;
  if (!observationAt(obs, fromPeriod)) return `No value for ${formatPeriod(fromPeriod)}.`;
  const b = breakBetween(breaks, fromPeriod, toPeriod);
  if (b) return `The source's underlying price source changes in ${formatPeriod(b.period)}.`;
  return null;
}

export interface Horizon {
  id: string;
  label: string;
  lag: number;
}

/** Change horizons shown on cards, by frequency. */
export const HORIZONS: Record<Frequency, readonly Horizon[]> = {
  monthly: [
    { id: "1m", label: "1M", lag: 1 },
    { id: "3m", label: "3M", lag: 3 },
    { id: "12m", label: "12M", lag: 12 },
  ],
  annual: [
    { id: "1y", label: "1Y", lag: 1 },
    { id: "4y", label: "4Y", lag: 4 },
  ],
};

export interface ChangeSummary {
  latest: Observation | null;
  changes: Array<{ horizon: Horizon; change: Change | null; reason: string | null }>;
}

export function changeSummary(obs: readonly Observation[], frequency: Frequency, breaks?: readonly SourceBreak[]): ChangeSummary {
  const latest = latestObservation(obs);
  return {
    latest,
    changes: HORIZONS[frequency].map((horizon) => {
      if (!latest) return { horizon, change: null, reason: "No observations." };
      const from = addPeriods(latest.period, -horizon.lag);
      const change = changeBetween(obs, from, latest.period, breaks);
      return { horizon, change, reason: change ? null : changeGapReason(obs, from, latest.period, breaks) };
    }),
  };
}

// ── Windows ─────────────────────────────────────────────────────────────────
export interface RangeDef {
  id: string;
  label: string;
  /** Length in periods of the series' frequency; null = everything stored. */
  periods: number | null;
}

export const RANGES: Record<Frequency, readonly RangeDef[]> = {
  monthly: [
    { id: "3m", label: "3M", periods: 3 },
    { id: "6m", label: "6M", periods: 6 },
    { id: "12m", label: "12M", periods: 12 },
    { id: "3y", label: "3Y", periods: 36 },
    { id: "5y", label: "5Y", periods: 60 },
    { id: "10y", label: "10Y", periods: 120 },
    { id: "max", label: "Max", periods: null },
  ],
  annual: [{ id: "max", label: "All years", periods: null }],
};

export function isRangeId(v: unknown, frequency: Frequency): v is string {
  return RANGES[frequency].some((r) => r.id === v);
}

/**
 * The window a range covers, ending at `end`. An N-period range starts N
 * periods before `end`, so the 3M window runs Jul → Oct and its indexed change
 * equals the 3M endpoint change. "max" starts at `earliest`.
 */
export function rangeWindow(
  frequency: Frequency,
  rangeId: string,
  end: string,
  earliest: string,
): { start: string; end: string; truncated: boolean } {
  const r = RANGES[frequency].find((x) => x.id === rangeId);
  if (!r) throw new Error(`Unknown ${frequency} range "${rangeId}"`);
  if (r.periods === null) return { start: earliest, end, truncated: false };
  const wanted = addPeriods(end, -r.periods);
  return wanted < earliest ? { start: earliest, end, truncated: true } : { start: wanted, end, truncated: false };
}

/** Which ranges a dataset spanning [earliest, end] can fully support. */
export function supportedRanges(frequency: Frequency, earliest: string, end: string): string[] {
  const span = periodsBetween(earliest, end);
  return RANGES[frequency].filter((r) => r.periods === null || r.periods <= span).map((r) => r.id);
}

export function windowObservations(obs: readonly Observation[], start: string, end: string): Observation[] {
  return obs.filter((o) => o.period >= start && o.period <= end);
}

// ── Indexing ────────────────────────────────────────────────────────────────
export interface IndexBase {
  basePeriod: string | null;
  included: string[];
  excluded: Array<{ id: string; reason: string }>;
  /** Plain-language reason when no common base period exists. */
  explanation: string | null;
}

export interface IndexInput {
  id: string;
  obs: readonly Observation[];
  breaks?: readonly SourceBreak[];
}

/**
 * Choose the common base period for an indexed view of `series` over
 * [start, end]: the latest of the series' first observations inside the
 * window. Series without a value at that period, or whose underlying source
 * changes after it inside the window, are excluded with a reason.
 */
export function chooseIndexBase(series: readonly IndexInput[], start: string, end: string): IndexBase {
  const firsts = series.map((s) => ({ s, first: windowObservations(s.obs, start, end)[0]?.period ?? null }));
  const excluded: IndexBase["excluded"] = firsts
    .filter((f) => f.first === null)
    .map((f) => ({ id: f.s.id, reason: "No observation inside the selected window." }));
  const withData = firsts.filter((f): f is { s: IndexInput; first: string } => f.first !== null);
  if (withData.length === 0) {
    return { basePeriod: null, included: [], excluded, explanation: "No selected series has an observation inside the selected window." };
  }
  const basePeriod = withData.map((f) => f.first).sort().at(-1)!;
  const included: string[] = [];
  for (const { s } of withData) {
    const b = breakBetween(s.breaks, basePeriod, end);
    if (valueAt(s.obs, basePeriod) === null) {
      excluded.push({ id: s.id, reason: `No observation for the common base period ${formatPeriod(basePeriod)}.` });
    } else if (b) {
      excluded.push({ id: s.id, reason: `Its underlying price source changes in ${formatPeriod(b.period)}, so it is not rebased across that change.` });
    } else {
      included.push(s.id);
    }
  }
  if (included.length === 0) {
    return {
      basePeriod: null,
      included,
      excluded,
      explanation: "The selected series share no period with a comparable value, so they cannot be rebased to a common date.",
    };
  }
  return { basePeriod, included, excluded, explanation: null };
}

/** Rebase to 100 at `basePeriod`. Returns [] if the base value is absent. Estimate flags carry over. */
export function indexSeries(obs: readonly Observation[], basePeriod: string, start: string, end: string): Observation[] {
  const base = valueAt(obs, basePeriod);
  if (base === null || base <= 0) return [];
  return windowObservations(obs, start, end)
    .filter((o) => o.period >= basePeriod)
    .map((o) => (o.estimated ? { period: o.period, value: (o.value / base) * 100, estimated: true } : { period: o.period, value: (o.value / base) * 100 }));
}

// ── Units ───────────────────────────────────────────────────────────────────
/** Absolute values may share an axis only if frequency, currency and unit are identical. */
export function unitsCompatible(series: ReadonlyArray<Pick<MarketSeries, "currency" | "unit" | "frequency">>): boolean {
  if (series.length === 0) return false;
  const [a] = series;
  return series.every((s) => s.currency === a.currency && s.unit === a.unit && s.frequency === a.frequency);
}

// ── Heatmap ─────────────────────────────────────────────────────────────────
export interface HeatCell {
  period: string;
  /** Change on the previous period; null when either is absent or a source break falls between. */
  change: Change | null;
}

export function periodChangeGrid(obs: readonly Observation[], periods: readonly string[], breaks?: readonly SourceBreak[]): HeatCell[] {
  return periods.map((period) => ({ period, change: changeBetween(obs, addPeriods(period, -1), period, breaks) }));
}

// ── Movers ──────────────────────────────────────────────────────────────────
export interface Mover {
  id: string;
  change: Change;
}

/**
 * Rank series by the size of their change over exactly `lag` periods ending
 * at `end` (largest absolute move first; ties by id). Every series is
 * measured over the same two periods. Series without both endpoints, or with
 * a source break between them, are listed apart, not ranked.
 */
export function rankMovers(
  series: readonly IndexInput[],
  lag: number,
  end: string,
): { ranked: Mover[]; unranked: Array<{ id: string; reason: string }> } {
  const ranked: Mover[] = [];
  const unranked: Array<{ id: string; reason: string }> = [];
  const from = addPeriods(end, -lag);
  for (const s of series) {
    const change = changeBetween(s.obs, from, end, s.breaks);
    if (change) ranked.push({ id: s.id, change });
    else unranked.push({ id: s.id, reason: changeGapReason(s.obs, from, end, s.breaks) ?? "Not comparable." });
  }
  ranked.sort((a, b) => Math.abs(b.change.pct) - Math.abs(a.change.pct) || a.id.localeCompare(b.id));
  return { ranked, unranked };
}

// ── Currency status ─────────────────────────────────────────────────────────
/**
 * A series is current only if its last observation is its dataset's stated
 * cutoff period. Anything older is stale and must be labelled as such.
 */
export function isStale(lastPeriod: string, observationCutoff: string): boolean {
  return lastPeriod < observationCutoff;
}

// ── Display formatting (rounding happens only here) ─────────────────────────
export function formatPct(pct: number | null | undefined, digits = 1): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return "—";
  const rounded = Number(pct.toFixed(digits));
  if (rounded === 0) return `${(0).toFixed(digits)}%`;
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(digits)}%`;
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-10" → "Oct 2026" ("October 2026" with `long`); "2025" → "2025". Invalid input is returned as is. */
export function formatPeriod(p: string, long = false): string {
  const m = MONTH_RE.exec(p);
  if (m) return `${(long ? MONTH_FULL : MONTH_ABBR)[Number(m[2]) - 1]} ${m[1]}`;
  return p;
}

/** Period label with the estimate marker the source implies: "2025" → "2025e". */
export function formatObservationPeriod(o: Pick<Observation, "period" | "estimated">, long = false): string {
  return `${formatPeriod(o.period, long)}${o.estimated ? (long ? " (estimated)" : "e") : ""}`;
}

/** Thousands-grouped number without locale drift between server and browser. */
export function formatNumber(value: number, digits = 0): string {
  const [int, frac] = Math.abs(value).toFixed(digits).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "−" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

/** Decimal places needed to show a series' stored values without losing digits (max 2). */
export function valueDigits(obs: readonly Observation[]): number {
  let d = 0;
  for (const o of obs) {
    const frac = String(o.value).split(".")[1];
    if (frac) d = Math.max(d, Math.min(frac.length, 2));
  }
  return d;
}

// ── Validation ──────────────────────────────────────────────────────────────
/** Every pinned release in data/markets/, in display order. The loader and `npm run validate` both read this list. */
export const MARKET_DATASET_IDS = ["wb-pink-sheet", "imf-pcps", "usgs-mcs-2026"] as const;

export interface MarketDataInput {
  datasets: MarketDataset[];
  coverage: MarketCoverageFile;
  materialIds: ReadonlySet<string>;
}

const SERIES_ID_RE = /^(wb|imf|usgs)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATASET_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUIRED_SERIES_TEXT = [
  "id",
  "datasetId",
  "materialId",
  "label",
  "benchmark",
  "sourceSeriesName",
  "sourceUnit",
  "specification",
  "form",
  "grade",
  "priceBasis",
  "currency",
  "unit",
  "unitShort",
  "unitNote",
  "aggregation",
  "missingValueHandling",
] as const satisfies ReadonlyArray<keyof MarketSeries>;

/** Words a trade unit value series may not be described with. */
const PRICE_WORDS_RE = /\b(price|benchmark|assessment|spot)\b/i;

function isIsoDate(s: unknown): boolean {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isHttpsUrl(s: unknown): boolean {
  return typeof s === "string" && /^https:\/\/[^\s]+$/.test(s);
}

function nonEmpty(s: unknown): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function validateDataset(d: MarketDataset, materialIds: ReadonlySet<string>, errors: string[], warnings: string[]) {
  const { manifest, series, observations } = d;
  const where0 = `markets ${manifest?.datasetId ?? "(dataset)"}`;
  const f = manifest.frequency;

  // Manifest
  if (manifest.schemaVersion !== 2) errors.push(`${where0} manifest: schemaVersion must be 2`);
  if (!DATASET_ID_RE.test(manifest.datasetId ?? "")) errors.push(`${where0} manifest: datasetId must be kebab-case`);
  if (!FREQUENCIES.includes(f)) errors.push(`${where0} manifest: frequency "${f}" is not monthly or annual`);
  for (const key of ["releaseId", "title", "shortName", "publisher", "attribution", "changesMade", "thirdPartyNote"] as const) {
    if (!nonEmpty(manifest[key])) errors.push(`${where0} manifest: missing ${key}`);
  }
  for (const key of ["releaseDate", "retrievedOn"] as const) {
    if (!isIsoDate(manifest[key])) errors.push(`${where0} manifest: ${key} "${manifest[key]}" is not a real YYYY-MM-DD date`);
  }
  if (manifest.nextScheduledRelease !== null) {
    if (!isIsoDate(manifest.nextScheduledRelease?.date)) errors.push(`${where0} manifest: nextScheduledRelease.date is not a real date`);
    else if (manifest.nextScheduledRelease.date <= manifest.releaseDate) errors.push(`${where0} manifest: nextScheduledRelease is not after releaseDate`);
  }
  if (isIsoDate(manifest.releaseDate) && isIsoDate(manifest.retrievedOn) && manifest.retrievedOn < manifest.releaseDate) {
    errors.push(`${where0} manifest: retrievedOn precedes releaseDate`);
  }
  if (!isValidPeriod(manifest.observationCutoff, f)) errors.push(`${where0} manifest: observationCutoff "${manifest.observationCutoff}" is not a ${f} period`);
  if (!isValidPeriod(manifest.windowStart, f)) errors.push(`${where0} manifest: windowStart "${manifest.windowStart}" is not a ${f} period`);
  if (isValidPeriod(manifest.observationCutoff, f) && isIsoDate(manifest.releaseDate)) {
    const releasePeriod = f === "monthly" ? manifest.releaseDate.slice(0, 7) : manifest.releaseDate.slice(0, 4);
    if (manifest.observationCutoff >= releasePeriod) {
      errors.push(`${where0} manifest: observationCutoff is not before the release period (an average cannot be published before its period ends)`);
    }
  }
  for (const [label, url] of [
    ["sourceFile.url", manifest.sourceFile?.url],
    ["landingPageUrl", manifest.landingPageUrl],
    ["catalogUrl", manifest.catalogUrl],
    ["license.statedAt", manifest.license?.statedAt],
    ["license.termsUrl", manifest.license?.termsUrl],
    ...(manifest.updateFrequency === null ? [] : ([["updateFrequency.sourceUrl", manifest.updateFrequency?.sourceUrl]] as const)),
    ["aggregationBasis.sourceUrl", manifest.aggregationBasis?.sourceUrl],
  ] as const) {
    if (!isHttpsUrl(url)) errors.push(`${where0} manifest: ${label} is not an https URL`);
  }
  if (manifest.license?.url !== null && !isHttpsUrl(manifest.license?.url)) errors.push(`${where0} manifest: license.url is not an https URL or null`);
  if (manifest.doi !== null && !/^10\.\d{4,}\/\S+$/.test(manifest.doi ?? "")) errors.push(`${where0} manifest: doi "${manifest.doi}" is not a DOI`);
  if (!/^[0-9a-f]{64}$/.test(manifest.sourceFile?.sha256 ?? "")) errors.push(`${where0} manifest: sourceFile.sha256 is not a SHA-256 hex digest`);
  if (!Number.isInteger(manifest.sourceFile?.bytes) || manifest.sourceFile.bytes <= 0) errors.push(`${where0} manifest: sourceFile.bytes must be a positive integer`);
  if (!LICENSE_KINDS.includes(manifest.license?.kind)) errors.push(`${where0} manifest: license.kind "${manifest.license?.kind}" is not a reviewed licence`);
  if (!nonEmpty(manifest.license?.statedText)) errors.push(`${where0} manifest: license.statedText must quote the licence statement`);
  if (manifest.license?.kind === "cc-by-4.0" && !manifest.license.name.includes("CC BY 4.0")) errors.push(`${where0} manifest: CC BY licence name mismatch`);
  if (manifest.license?.kind === "cc0-1.0" && !manifest.license.name.includes("CC0")) errors.push(`${where0} manifest: CC0 licence name mismatch`);
  if (manifest.license?.kind === "imf-terms" && !/International Monetary Fund/.test(manifest.attribution ?? "")) {
    errors.push(`${where0} manifest: IMF terms require attribution to the International Monetary Fund`);
  }
  if (manifest.license?.kind === "imf-terms" && !/transform|calculat/i.test(manifest.changesMade ?? "")) {
    errors.push(`${where0} manifest: IMF terms require an explicit statement of changes made`);
  }

  // Series metadata
  const ids = new Set<string>();
  for (const s of series) {
    const where = `markets series ${s.id ?? "(no id)"}`;
    if (!SERIES_ID_RE.test(s.id ?? "")) errors.push(`${where}: id must match ${SERIES_ID_RE}`);
    if (ids.has(s.id)) errors.push(`${where}: duplicate id`);
    ids.add(s.id);
    for (const key of REQUIRED_SERIES_TEXT) if (!nonEmpty(s[key])) errors.push(`${where}: missing ${key}`);
    if (s.datasetId !== manifest.datasetId) errors.push(`${where}: datasetId "${s.datasetId}" ≠ manifest "${manifest.datasetId}"`);
    if (s.frequency !== f) errors.push(`${where}: frequency "${s.frequency}" ≠ dataset frequency "${f}"`);
    if (!PRICE_TYPES.includes(s.priceType)) errors.push(`${where}: priceType "${s.priceType}" is not one of ${PRICE_TYPES.join(", ")}`);
    if (s.priceType === "trade_unit_value" && PRICE_WORDS_RE.test(`${s.label} ${s.benchmark}`)) {
      errors.push(`${where}: a trade unit value is labelled as a price, benchmark or assessment`);
    }
    if (!Array.isArray(s.limitations) || s.limitations.length === 0) errors.push(`${where}: limitations must be a non-empty list`);
    if (!materialIds.has(s.materialId)) errors.push(`${where}: materialId "${s.materialId}" is not a material in data/seed/materials.json`);
    if (!Array.isArray(s.relatedMaterialIds)) errors.push(`${where}: relatedMaterialIds must be a list`);
    else for (const m of s.relatedMaterialIds) {
      if (!materialIds.has(m)) errors.push(`${where}: related material "${m}" is not in data/seed/materials.json`);
      if (m === s.materialId) errors.push(`${where}: related material repeats materialId`);
    }
    if (!/^[A-Z]{3}$/.test(s.currency ?? "")) errors.push(`${where}: currency "${s.currency}" is not an ISO code`);
    if (s.forecastFlag) errors.push(`${where}: the source marks this as a forecast series`);
    if (!Array.isArray(s.sourceBreaks)) errors.push(`${where}: sourceBreaks must be a list`);
    else {
      let prev = "";
      for (const b of s.sourceBreaks) {
        if (!isValidPeriod(b.period, f)) errors.push(`${where}: source break period "${b.period}" is not a ${f} period`);
        if (!nonEmpty(b.statedAs)) errors.push(`${where}: source break ${b.period} lacks the source's statement`);
        if (b.period <= prev) errors.push(`${where}: source breaks out of order`);
        prev = b.period;
      }
    }
  }
  if (JSON.stringify(manifest.seriesIds ?? []) !== JSON.stringify(series.map((s) => s.id))) {
    errors.push(`${where0}: manifest.seriesIds does not list series.json in order`);
  }
  if (JSON.stringify(observations.seriesIds) !== JSON.stringify(manifest.seriesIds)) {
    errors.push(`${where0}: observations.json seriesIds do not match the manifest`);
  }
  for (const k of Object.keys(observations.observations ?? {})) if (!ids.has(k)) errors.push(`${where0} observations: "${k}" is not a series id`);

  // Observations
  for (const s of series) {
    const where = `markets observations ${s.id}`;
    const obs = observations.observations?.[s.id];
    if (!Array.isArray(obs) || obs.length === 0) {
      errors.push(`${where}: no observations`);
      continue;
    }
    const seen = new Set<string>();
    let prev: string | null = null;
    let ok = true;
    let estimated = 0;
    let seenEstimate = false;
    for (const o of obs) {
      if (!isValidPeriod(o.period, f)) {
        errors.push(`${where}: invalid ${f} period "${o.period}"`);
        ok = false;
        continue;
      }
      if (seen.has(o.period)) {
        errors.push(`${where}: duplicate period ${o.period}`);
        ok = false;
      }
      seen.add(o.period);
      if (typeof o.value !== "number" || !Number.isFinite(o.value) || o.value <= 0) {
        errors.push(`${where}: value at ${o.period} must be a positive finite number`);
        ok = false;
      }
      const extra = Object.keys(o).filter((k) => !["period", "value", "estimated"].includes(k));
      if (extra.length) errors.push(`${where}: unexpected field(s) ${extra.join(", ")} at ${o.period}`);
      if ("estimated" in o && o.estimated !== true) errors.push(`${where}: estimated at ${o.period} must be true or absent`);
      if (o.estimated) {
        estimated++;
        seenEstimate = true;
      } else if (seenEstimate) {
        errors.push(`${where}: a firm value at ${o.period} follows an estimate`);
      }
      if (prev !== null) {
        if (o.period <= prev) {
          errors.push(`${where}: ${o.period} out of order after ${prev}`);
          ok = false;
        } else if (periodsBetween(prev, o.period) !== 1) {
          errors.push(`${where}: missing period(s) between ${prev} and ${o.period}`);
          ok = false;
        }
      }
      prev = o.period;
    }
    if (!ok) continue;
    if (obs[0].period !== s.firstPeriod) errors.push(`${where}: firstPeriod ${s.firstPeriod} ≠ first observation ${obs[0].period}`);
    if (obs.at(-1)!.period !== s.lastPeriod) errors.push(`${where}: lastPeriod ${s.lastPeriod} ≠ last observation ${obs.at(-1)!.period}`);
    if (obs.length !== s.observationCount) errors.push(`${where}: observationCount ${s.observationCount} ≠ ${obs.length}`);
    if (estimated !== s.estimatedCount) errors.push(`${where}: estimatedCount ${s.estimatedCount} ≠ ${estimated}`);
    for (const b of s.sourceBreaks ?? []) {
      if (!(b.period > s.firstPeriod && b.period <= s.lastPeriod)) errors.push(`${where}: source break ${b.period} is outside the stored window`);
    }
    if (isValidPeriod(manifest.windowStart, f) && obs[0].period < manifest.windowStart) {
      errors.push(`${where}: starts before the manifest windowStart ${manifest.windowStart}`);
    }
    if (isValidPeriod(manifest.observationCutoff, f)) {
      if (s.lastPeriod > manifest.observationCutoff) errors.push(`${where}: lastPeriod ${s.lastPeriod} is after the stated cutoff`);
      else if (isStale(s.lastPeriod, manifest.observationCutoff)) {
        warnings.push(`${where}: last observation ${s.lastPeriod} is older than the dataset cutoff ${manifest.observationCutoff}; it will be labelled stale`);
      }
    }
  }
}

/**
 * Checks the market files for every failure the monitor must refuse to show:
 * malformed, duplicate or missing periods, mixed frequencies, non-positive
 * values, misplaced estimate flags, metadata that does not match the
 * observations, unknown materials, unreviewed licences, unit values labelled
 * as prices, series ids reused across datasets, and coverage-gap entries that
 * disagree with the series actually published or carry figures.
 */
export function validateMarketData(input: MarketDataInput): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { datasets, coverage, materialIds } = input;

  const datasetIds = new Set<string>();
  const allIds = new Set<string>();
  for (const d of datasets) {
    if (datasetIds.has(d.manifest.datasetId)) errors.push(`markets: duplicate dataset ${d.manifest.datasetId}`);
    datasetIds.add(d.manifest.datasetId);
    for (const s of d.series) {
      if (allIds.has(s.id)) errors.push(`markets: series id ${s.id} appears in more than one dataset`);
      allIds.add(s.id);
    }
    validateDataset(d, materialIds, errors, warnings);
  }

  // Coverage: every material either has a monthly series or an entry here saying why not.
  const all = datasets.flatMap((d) => d.series);
  const monthly = new Set(all.filter((s) => s.frequency === "monthly").map((s) => s.materialId));
  const annual = new Set(all.filter((s) => s.frequency === "annual").map((s) => s.materialId));
  const joint = new Set(all.flatMap((s) => s.relatedMaterialIds ?? []));
  const gapIds = new Set<string>();
  if (coverage.schemaVersion !== 2) errors.push("markets coverage: schemaVersion must be 2");
  for (const c of coverage.gaps ?? []) {
    const where = `markets coverage gap ${c.materialId}`;
    if (!materialIds.has(c.materialId)) errors.push(`${where}: not a material in data/seed/materials.json`);
    if (monthly.has(c.materialId)) errors.push(`${where}: already has a published monthly series`);
    if (gapIds.has(c.materialId)) errors.push(`${where}: duplicate`);
    gapIds.add(c.materialId);
    if (!COVERAGE_STATUSES.includes(c.status)) errors.push(`${where}: unknown status "${c.status}"`);
    if (c.status === "annual_only" && !annual.has(c.materialId)) errors.push(`${where}: marked annual_only but has no annual series of its own`);
    if (c.status === "joint_only" && (annual.has(c.materialId) || !joint.has(c.materialId))) {
      errors.push(`${where}: marked joint_only but is not covered only through a joint benchmark`);
    }
    if (c.status === "no_open_series_identified" && (annual.has(c.materialId) || joint.has(c.materialId))) {
      errors.push(`${where}: marked no_open_series_identified but a series covers it`);
    }
    for (const key of ["monthlyCoverage", "gradeDistinctions", "requirementForInclusion"] as const) {
      if (!nonEmpty(c[key])) errors.push(`${where}: missing ${key}`);
    }
    const extra = Object.keys(c).filter((k) => !["materialId", "status", "monthlyCoverage", "gradeDistinctions", "requirementForInclusion"].includes(k));
    if (extra.length) errors.push(`${where}: unexpected field(s) ${extra.join(", ")} — coverage-gap entries hold no prices`);
    if (Object.values(c).some((v) => typeof v === "number")) errors.push(`${where}: holds a number; coverage-gap entries hold no prices`);
  }
  for (const m of materialIds) {
    if (!monthly.has(m) && !gapIds.has(m)) errors.push(`markets coverage: material "${m}" has no monthly series and no coverage-gap entry`);
  }

  return { errors, warnings };
}
