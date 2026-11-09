/**
 * Critical Minerals Market Monitor — pure calculations and validation.
 *
 * Every figure on /markets comes from these functions, applied to one stored
 * series per benchmark (`data/markets/observations.json`). Rules:
 *
 * - Periods are "YYYY-MM" months. A change over k months compares the value
 *   at period t with the value at exactly t−k; if either month is absent the
 *   change is `null`. Nothing is interpolated, carried forward or filled.
 * - Percentages are computed at full precision and rounded only for display.
 * - An indexed view rebases each series to 100 at one stated common month.
 *   A series with no value at that month is left out, with a reason.
 * - Values in different currencies or units are never put on one absolute
 *   axis or compared directly.
 *
 * Nothing here reads the wall clock. "Latest" means the last stored
 * observation, which is a monthly average for a past month, not a live price.
 */

// ── Types ───────────────────────────────────────────────────────────────────
export interface Observation {
  period: string;
  value: number;
}

export interface MarketSeries {
  id: string;
  materialId: string;
  label: string;
  benchmark: string;
  sourceSeriesName: string;
  sourceUnit: string;
  specification: string;
  worldBankForecastFlag: boolean;
  form: string;
  grade: string;
  priceBasis: string;
  currency: string;
  unit: string;
  unitNote: string;
  frequency: string;
  aggregation: string;
  underlyingSources: string | null;
  firstPeriod: string;
  lastPeriod: string;
  observationCount: number;
  missingValueHandling: string;
  limitations: string[];
}

export interface MarketManifest {
  schemaVersion: number;
  datasetId: string;
  title: string;
  publisher: string;
  workbook: {
    url: string;
    fileName: string;
    sha256: string;
    bytes: number;
    sheet: string;
    sheetSubtitle: string;
    updatedText: string;
  };
  landingPageUrl: string;
  catalogUrl: string;
  pinkSheetPdfUrl: string;
  releaseDate: string;
  retrievedOn: string;
  windowStart: string;
  observationCutoff: string;
  nextScheduledRelease: { date: string; statedAs: string; sourceUrl: string };
  updateFrequency: { statedAs: string; sourceUrl: string };
  aggregationBasis: { statedAs: string; note: string; sourceUrl: string };
  license: { name: string; url: string; statedAt: string; termsUrl: string };
  attribution: string;
  changesMade: string;
  thirdPartyNote: string;
  seriesIds: string[];
}

export interface MarketCoverageGap {
  materialId: string;
  status: "no_open_series_identified";
  worldBankCoverage: string;
  gradeDistinctions: string;
  requirementForInclusion: string;
}

export interface MarketCoverageFile {
  schemaVersion: number;
  note: string;
  gaps: MarketCoverageGap[];
}

export interface ObservationsFile {
  seriesIds: string[];
  observations: Record<string, Observation[]>;
}

// ── Periods ─────────────────────────────────────────────────────────────────
const PERIOD_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isValidPeriod(p: unknown): p is string {
  return typeof p === "string" && PERIOD_RE.test(p);
}

function periodIndex(p: string): number {
  const m = PERIOD_RE.exec(p);
  if (!m) throw new Error(`Invalid period "${p}"`);
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

function fromIndex(i: number): string {
  const y = Math.floor(i / 12);
  const m = (i % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function addMonths(p: string, n: number): string {
  return fromIndex(periodIndex(p) + n);
}

/** Whole months from a to b (b − a). */
export function monthsBetween(a: string, b: string): number {
  return periodIndex(b) - periodIndex(a);
}

/** Inclusive list of months from start to end. */
export function periodRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let i = periodIndex(start); i <= periodIndex(end); i++) out.push(fromIndex(i));
  return out;
}

// ── Lookups ─────────────────────────────────────────────────────────────────
export function valueAt(obs: readonly Observation[], period: string): number | null {
  // Series are short (hundreds of points) and sorted; a linear scan is clear and fast enough.
  for (const o of obs) if (o.period === period) return o.value;
  return null;
}

export function latestObservation(obs: readonly Observation[]): Observation | null {
  return obs.length ? obs[obs.length - 1] : null;
}

// ── Changes ─────────────────────────────────────────────────────────────────
export interface Change {
  fromPeriod: string;
  toPeriod: string;
  fromValue: number;
  toValue: number;
  /** Full-precision percentage change, (to / from − 1) × 100. */
  pct: number;
}

/** Percentage change between two named months. Null if either value is absent. */
export function changeBetween(obs: readonly Observation[], fromPeriod: string, toPeriod: string): Change | null {
  const fromValue = valueAt(obs, fromPeriod);
  const toValue = valueAt(obs, toPeriod);
  if (fromValue === null || toValue === null || fromValue <= 0) return null;
  return { fromPeriod, toPeriod, fromValue, toValue, pct: (toValue / fromValue - 1) * 100 };
}

/** Change over exactly `lag` months ending at `period` (defaults to the last observation). */
export function changeOver(obs: readonly Observation[], lag: number, period?: string): Change | null {
  const end = period ?? latestObservation(obs)?.period;
  if (!end) return null;
  return changeBetween(obs, addMonths(end, -lag), end);
}

export interface ChangeSummary {
  latest: Observation | null;
  m1: Change | null;
  m3: Change | null;
  y1: Change | null;
}

export function changeSummary(obs: readonly Observation[]): ChangeSummary {
  return { latest: latestObservation(obs), m1: changeOver(obs, 1), m3: changeOver(obs, 3), y1: changeOver(obs, 12) };
}

// ── Windows ─────────────────────────────────────────────────────────────────
export const RANGES = [
  { id: "3m", label: "3M", months: 3 },
  { id: "6m", label: "6M", months: 6 },
  { id: "12m", label: "12M", months: 12 },
  { id: "3y", label: "3Y", months: 36 },
  { id: "5y", label: "5Y", months: 60 },
  { id: "10y", label: "10Y", months: 120 },
  { id: "max", label: "Max", months: null },
] as const;

export type RangeId = (typeof RANGES)[number]["id"];

export function isRangeId(v: unknown): v is RangeId {
  return RANGES.some((r) => r.id === v);
}

/**
 * The window a range covers, ending at `end`. An N-month range starts N months
 * before `end`, so the 3M window runs Jul → Oct and its indexed change equals
 * the 3M endpoint change. "max" starts at `earliest`.
 */
export function rangeWindow(range: RangeId, end: string, earliest: string): { start: string; end: string; truncated: boolean } {
  const r = RANGES.find((x) => x.id === range)!;
  if (r.months === null) return { start: earliest, end, truncated: false };
  const wanted = addMonths(end, -r.months);
  return wanted < earliest ? { start: earliest, end, truncated: true } : { start: wanted, end, truncated: false };
}

/** Which ranges a dataset spanning [earliest, end] can fully support. */
export function supportedRanges(earliest: string, end: string): RangeId[] {
  const span = monthsBetween(earliest, end);
  return RANGES.filter((r) => r.months === null || r.months <= span).map((r) => r.id);
}

export function windowObservations(obs: readonly Observation[], start: string, end: string): Observation[] {
  return obs.filter((o) => o.period >= start && o.period <= end);
}

// ── Indexing ────────────────────────────────────────────────────────────────
export interface IndexBase {
  basePeriod: string | null;
  included: string[];
  excluded: Array<{ id: string; reason: string }>;
  /** Plain-language reason when no common base month exists. */
  explanation: string | null;
}

/**
 * Choose the common base month for an indexed view of `series` over
 * [start, end]: the latest of the series' first observations inside the
 * window. Series without a value at that month are excluded with a reason.
 */
export function chooseIndexBase(
  series: ReadonlyArray<{ id: string; obs: readonly Observation[] }>,
  start: string,
  end: string,
): IndexBase {
  const firsts: Array<{ id: string; first: string | null }> = series.map((s) => ({
    id: s.id,
    first: windowObservations(s.obs, start, end)[0]?.period ?? null,
  }));
  const withData = firsts.filter((f) => f.first !== null) as Array<{ id: string; first: string }>;
  const excluded: IndexBase["excluded"] = firsts
    .filter((f) => f.first === null)
    .map((f) => ({ id: f.id, reason: "No observation inside the selected window." }));
  if (withData.length === 0) {
    return { basePeriod: null, included: [], excluded, explanation: "No series has an observation inside the selected window." };
  }
  const basePeriod = withData.map((f) => f.first).sort().at(-1)!;
  const included: string[] = [];
  for (const f of withData) {
    const s = series.find((x) => x.id === f.id)!;
    if (valueAt(s.obs, basePeriod) === null) {
      excluded.push({ id: f.id, reason: `No observation for the common base month ${basePeriod}.` });
    } else {
      included.push(f.id);
    }
  }
  if (included.length === 0) {
    return {
      basePeriod: null,
      included,
      excluded,
      explanation: "The series in this window share no month with a value, so they cannot be rebased to a common date.",
    };
  }
  return { basePeriod, included, excluded, explanation: null };
}

/** Rebase to 100 at `basePeriod`. Returns [] if the base value is absent. */
export function indexSeries(obs: readonly Observation[], basePeriod: string, start: string, end: string): Observation[] {
  const base = valueAt(obs, basePeriod);
  if (base === null || base <= 0) return [];
  return windowObservations(obs, start, end)
    .filter((o) => o.period >= basePeriod)
    .map((o) => ({ period: o.period, value: (o.value / base) * 100 }));
}

// ── Units ───────────────────────────────────────────────────────────────────
/** Absolute values may share an axis only if currency and unit are identical. */
export function unitsCompatible(series: ReadonlyArray<Pick<MarketSeries, "currency" | "unit">>): boolean {
  if (series.length === 0) return false;
  return series.every((s) => s.currency === series[0].currency && s.unit === series[0].unit);
}

// ── Heatmap ─────────────────────────────────────────────────────────────────
export interface HeatCell {
  period: string;
  /** Month-on-month change; null when this month or the prior month is absent. */
  change: Change | null;
}

export function monthlyChangeGrid(obs: readonly Observation[], periods: readonly string[]): HeatCell[] {
  return periods.map((period) => ({ period, change: changeBetween(obs, addMonths(period, -1), period) }));
}

// ── Movers ──────────────────────────────────────────────────────────────────
export interface Mover {
  id: string;
  change: Change;
}

/**
 * Rank series by the size of their change over exactly `months` months ending
 * at `end` (largest absolute move first; ties by id). Series without both
 * endpoints are listed apart, not ranked.
 */
export function rankMovers(
  series: ReadonlyArray<{ id: string; obs: readonly Observation[] }>,
  months: number,
  end: string,
): { ranked: Mover[]; unranked: Array<{ id: string; reason: string }> } {
  const ranked: Mover[] = [];
  const unranked: Array<{ id: string; reason: string }> = [];
  const from = addMonths(end, -months);
  for (const s of series) {
    const change = changeBetween(s.obs, from, end);
    if (change) ranked.push({ id: s.id, change });
    else unranked.push({ id: s.id, reason: `No observation for ${valueAt(s.obs, from) === null ? from : end}.` });
  }
  ranked.sort((a, b) => Math.abs(b.change.pct) - Math.abs(a.change.pct) || a.id.localeCompare(b.id));
  return { ranked, unranked };
}

// ── Currency status ─────────────────────────────────────────────────────────
/**
 * A series is current only if its last observation is the dataset's stated
 * cutoff month. Anything older is stale and must be labelled as such.
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

/** "2026-10" → "Oct 2026" (or "October 2026" with `long`). Invalid input is returned as is. */
export function formatPeriod(p: string, long = false): string {
  const m = PERIOD_RE.exec(p);
  if (!m) return p;
  return `${(long ? MONTH_FULL : MONTH_ABBR)[Number(m[2]) - 1]} ${m[1]}`;
}

/** Thousands-grouped number without locale drift between server and browser. */
export function formatNumber(value: number, digits = 0): string {
  const [int, frac] = Math.abs(value).toFixed(digits).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "−" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

// ── Validation ──────────────────────────────────────────────────────────────
export interface MarketDataInput {
  manifest: MarketManifest;
  series: MarketSeries[];
  observations: ObservationsFile;
  coverage: MarketCoverageFile;
  materialIds: ReadonlySet<string>;
}

const SERIES_ID_RE = /^wb-[a-z]+$/;
const REQUIRED_SERIES_TEXT: Array<keyof MarketSeries> = [
  "id",
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
  "unitNote",
  "frequency",
  "aggregation",
  "missingValueHandling",
];

function isIsoDate(s: unknown): boolean {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isHttpsUrl(s: unknown): boolean {
  return typeof s === "string" && /^https:\/\/[^\s]+$/.test(s);
}

/**
 * Checks the market files for every failure the monitor must refuse to show:
 * malformed or duplicate periods, gaps, non-positive values, metadata that
 * does not match the observations, unknown materials, units that differ from
 * the stated basis, and coverage-gap entries that carry figures.
 */
export function validateMarketData(input: MarketDataInput): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { manifest, series, observations, coverage, materialIds } = input;

  // Manifest
  for (const key of ["datasetId", "title", "publisher", "attribution", "changesMade", "thirdPartyNote"] as const) {
    if (typeof manifest[key] !== "string" || !manifest[key].trim()) errors.push(`markets manifest: missing ${key}`);
  }
  for (const key of ["releaseDate", "retrievedOn"] as const) {
    if (!isIsoDate(manifest[key])) errors.push(`markets manifest: ${key} "${manifest[key]}" is not a real YYYY-MM-DD date`);
  }
  if (!isIsoDate(manifest.nextScheduledRelease?.date)) errors.push("markets manifest: nextScheduledRelease.date is not a real date");
  if (isIsoDate(manifest.releaseDate) && isIsoDate(manifest.retrievedOn) && manifest.retrievedOn < manifest.releaseDate) {
    errors.push("markets manifest: retrievedOn precedes releaseDate");
  }
  if (!isValidPeriod(manifest.observationCutoff)) errors.push(`markets manifest: observationCutoff "${manifest.observationCutoff}" is not YYYY-MM`);
  if (!isValidPeriod(manifest.windowStart)) errors.push(`markets manifest: windowStart "${manifest.windowStart}" is not YYYY-MM`);
  if (isValidPeriod(manifest.observationCutoff) && isIsoDate(manifest.releaseDate) && manifest.observationCutoff >= manifest.releaseDate.slice(0, 7)) {
    errors.push("markets manifest: observationCutoff is not before the release month (a monthly average cannot be published before its month ends)");
  }
  for (const [label, url] of [
    ["workbook.url", manifest.workbook?.url],
    ["landingPageUrl", manifest.landingPageUrl],
    ["catalogUrl", manifest.catalogUrl],
    ["license.url", manifest.license?.url],
    ["license.statedAt", manifest.license?.statedAt],
    ["license.termsUrl", manifest.license?.termsUrl],
  ] as const) {
    if (!isHttpsUrl(url)) errors.push(`markets manifest: ${label} is not an https URL`);
  }
  if (!/^[0-9a-f]{64}$/.test(manifest.workbook?.sha256 ?? "")) errors.push("markets manifest: workbook.sha256 is not a SHA-256 hex digest");
  if (!manifest.license?.name?.includes("CC BY 4.0")) {
    errors.push("markets manifest: licence is not the CC BY 4.0 licence the export and attribution rely on");
  }

  // Series metadata
  const seriesIds = new Set<string>();
  for (const s of series) {
    const where = `markets series ${s.id ?? "(no id)"}`;
    if (!SERIES_ID_RE.test(s.id ?? "")) errors.push(`${where}: id must match ${SERIES_ID_RE}`);
    if (seriesIds.has(s.id)) errors.push(`${where}: duplicate id`);
    seriesIds.add(s.id);
    for (const key of REQUIRED_SERIES_TEXT) {
      const v = s[key];
      if (typeof v !== "string" || !v.trim()) errors.push(`${where}: missing ${key}`);
    }
    if (!Array.isArray(s.limitations) || s.limitations.length === 0) errors.push(`${where}: limitations must be a non-empty list`);
    if (!materialIds.has(s.materialId)) errors.push(`${where}: materialId "${s.materialId}" is not a material in data/seed/materials.json`);
    if (s.currency !== "USD" || s.unit !== "US$ per metric tonne" || s.sourceUnit !== "($/mt)") {
      errors.push(`${where}: unit basis "${s.currency} / ${s.unit} / ${s.sourceUnit}" differs from the stated USD per metric tonne`);
    }
    if (s.frequency !== "monthly" || s.aggregation !== "monthly average") errors.push(`${where}: must be a monthly average series`);
    if (s.worldBankForecastFlag) errors.push(`${where}: the World Bank marks this as a forecast series`);
  }
  const manifestIds = [...(manifest.seriesIds ?? [])];
  if (JSON.stringify(manifestIds) !== JSON.stringify(series.map((s) => s.id))) {
    errors.push("markets: manifest.seriesIds does not list series.json in order");
  }
  if (JSON.stringify(observations.seriesIds) !== JSON.stringify(manifestIds)) {
    errors.push("markets: observations.json seriesIds do not match the manifest");
  }
  const obsKeys = Object.keys(observations.observations ?? {});
  for (const k of obsKeys) if (!seriesIds.has(k)) errors.push(`markets observations: "${k}" is not a series id`);

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
    for (const o of obs) {
      if (!isValidPeriod(o.period)) {
        errors.push(`${where}: invalid period "${o.period}"`);
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
      if (prev !== null) {
        if (o.period <= prev) {
          errors.push(`${where}: ${o.period} out of order after ${prev}`);
          ok = false;
        } else if (monthsBetween(prev, o.period) !== 1) {
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
    if (isValidPeriod(manifest.windowStart) && obs[0].period < manifest.windowStart) {
      errors.push(`${where}: starts before the manifest windowStart ${manifest.windowStart}`);
    }
    if (isValidPeriod(manifest.observationCutoff)) {
      if (s.lastPeriod > manifest.observationCutoff) errors.push(`${where}: lastPeriod ${s.lastPeriod} is after the stated cutoff`);
      else if (isStale(s.lastPeriod, manifest.observationCutoff)) {
        warnings.push(`${where}: last observation ${s.lastPeriod} is older than the dataset cutoff ${manifest.observationCutoff}; it will be labelled stale`);
      }
    }
  }

  // Coverage gaps (materials without a publishable series)
  const covered = new Set(series.map((s) => s.materialId));
  const gapIds = new Set<string>();
  for (const c of coverage.gaps ?? []) {
    const where = `markets coverage gap ${c.materialId}`;
    if (!materialIds.has(c.materialId)) errors.push(`${where}: not a material in data/seed/materials.json`);
    if (covered.has(c.materialId)) errors.push(`${where}: already has a published series`);
    if (gapIds.has(c.materialId)) errors.push(`${where}: duplicate`);
    gapIds.add(c.materialId);
    if (c.status !== "no_open_series_identified") errors.push(`${where}: unknown status "${c.status}"`);
    for (const key of ["worldBankCoverage", "gradeDistinctions", "requirementForInclusion"] as const) {
      if (typeof c[key] !== "string" || !c[key].trim()) errors.push(`${where}: missing ${key}`);
    }
    const extra = Object.keys(c).filter((k) => !["materialId", "status", "worldBankCoverage", "gradeDistinctions", "requirementForInclusion"].includes(k));
    if (extra.length) errors.push(`${where}: unexpected field(s) ${extra.join(", ")} — coverage-gap entries hold no prices`);
    if (Object.values(c).some((v) => typeof v === "number")) errors.push(`${where}: holds a number; coverage-gap entries hold no prices`);
  }

  return { errors, warnings };
}
