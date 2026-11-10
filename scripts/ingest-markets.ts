/**
 * Deterministic ingest for the Critical Minerals Market Monitor (/markets).
 *
 * Reads a local copy of the World Bank "CMO-Historical-Data-Monthly.xlsx"
 * workbook (the Pink Sheet monthly history), verifies it against the pinned
 * SHA-256, and writes the frozen, versioned files in `data/markets/wb-pink-sheet/`:
 *
 *   manifest.json      release, licence, attribution, cutoff, changes made
 *   series.json        per-series metadata (benchmark, grade, unit, limits)
 *   observations.json  monthly values, one array per series, oldest first
 *
 * The IMF and USGS datasets have their own ingests (`ingest-markets-imf.ts`,
 * `ingest-markets-usgs.ts`). `data/markets/coverage-gaps.json` (materials
 * without a redistributable monthly series) is hand-maintained.
 *
 * Usage:
 *   npm run ingest:markets -- /path/to/CMO-Historical-Data-Monthly.xlsx
 *
 * The workbook itself is not committed. Nothing here reads the wall clock:
 * the retrieval date and cutoff are constants, so the same workbook always
 * produces byte-identical output. A new World Bank release means updating the
 * pinned constants below deliberately, then re-running and reviewing the diff.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

// ── Pinned release ──────────────────────────────────────────────────────────
const DATASET_ID = "wb-pink-sheet";
const WORKBOOK_URL =
  "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx";
const WORKBOOK_SHA256 = "3c8d9d8dbb48342fdbf24777c39a8ce8964cc2fd0958f72f6779e6e4ad99cde2";
const WORKBOOK_BYTES = 587760;
const UPDATED_ROW_TEXT = "Updated on November 03, 2026";
const RELEASE_DATE = "2026-11-03";
const RETRIEVED_ON = "2026-11-09";
/** Last monthly observation this release is expected to contain. */
const OBSERVATION_CUTOFF = "2026-10";
/**
 * First stored month. The World Bank describes the aluminum and nickel series
 * as LME settlement prices "beginning 2005; previously cash price". Starting
 * the stored window in January 2005 keeps every stored observation on one
 * stated price basis for the stored exchange series.
 */
const WINDOW_START = "2005-01";

const PRICES_SHEET = "Monthly Prices";
const DESCRIPTION_SHEET = "Description";
const HEADER_ROW = 5;
const UNIT_ROW = 6;
const FIRST_DATA_ROW = 7;

interface SeriesSpec {
  id: string;
  materialId: string;
  label: string;
  /** Exact header text in the Monthly Prices sheet. */
  header: string;
  /** Exact unit text in the row under the header. */
  sourceUnit: string;
  /** Leading text of the matching Description-sheet entry. */
  descriptionPrefix: string;
  benchmark: string;
  priceType: "exchange_benchmark" | "price_assessment";
  form: string;
  grade: string;
  priceBasis: string;
  limitations: string[];
  sourceBreaks?: Array<{ period: string; statedAs: string }>;
}

const COMMON_LIMITATIONS = [
  "Monthly averages smooth intra-month moves; a month's figure is not a price on any single day.",
  "Nominal US dollars, not adjusted for inflation; long-window changes include general price-level change.",
  "An exchange benchmark for one grade and delivery basis. Prices paid in contracts for other grades, forms or locations can differ.",
];

const SERIES: SeriesSpec[] = [
  {
    id: "wb-aluminum",
    materialId: "aluminium",
    label: "Aluminium",
    header: "Aluminum",
    sourceUnit: "($/mt)",
    descriptionPrefix: "Aluminum (LME)",
    benchmark: "LME primary aluminium",
    priceType: "exchange_benchmark",
    form: "Unalloyed primary ingots",
    grade: "High grade, minimum 99.7% purity",
    priceBasis: "LME settlement price (cash price before 2005)",
    limitations: [...COMMON_LIMITATIONS],
  },
  {
    id: "wb-copper",
    materialId: "copper",
    label: "Copper",
    header: "Copper",
    sourceUnit: "($/mt)",
    descriptionPrefix: "Copper (LME)",
    benchmark: "LME copper, grade A",
    priceType: "exchange_benchmark",
    form: "Cathodes and wire bar shapes",
    grade: "Grade A, minimum 99.9935% purity",
    priceBasis: "LME settlement price",
    limitations: [...COMMON_LIMITATIONS],
  },
  {
    id: "wb-nickel",
    materialId: "nickel",
    label: "Nickel",
    header: "Nickel",
    sourceUnit: "($/mt)",
    descriptionPrefix: "Nickel (LME)",
    benchmark: "LME nickel",
    priceType: "exchange_benchmark",
    form: "Cathodes",
    grade: "Minimum 99.8% purity",
    priceBasis: "LME settlement price (cash price before 2005)",
    limitations: [
      ...COMMON_LIMITATIONS,
      "A refined-metal benchmark. Nickel intermediates and chemicals used in batteries (for example sulphate or mixed hydroxide precipitate) trade on separate terms.",
    ],
  },
  {
    id: "wb-tin",
    materialId: "tin",
    label: "Tin",
    header: "Tin",
    sourceUnit: "($/mt)",
    descriptionPrefix: "Tin (LME)",
    benchmark: "LME refined tin",
    priceType: "exchange_benchmark",
    form: "Refined tin",
    grade: "99.85% purity",
    priceBasis: "LME settlement price",
    
    limitations: ["Monthly averages smooth intra-month moves; a month's figure is not a price on any single day.","Nominal US dollars, not adjusted for inflation; long-window changes include general price-level change.","An exchange benchmark for one grade and delivery basis. Prices paid in contracts for other grades, forms or locations can differ."],
  },
  {
    id: "wb-zinc",
    materialId: "zinc",
    label: "Zinc",
    header: "Zinc",
    sourceUnit: "($/mt)",
    descriptionPrefix: "Zinc (LME)",
    benchmark: "LME high-grade zinc",
    priceType: "exchange_benchmark",
    form: "Refined zinc",
    grade: "Minimum 99.95% purity",
    priceBasis: "LME settlement price",
    
    limitations: ["Monthly averages smooth intra-month moves; a month's figure is not a price on any single day.","Nominal US dollars, not adjusted for inflation; long-window changes include general price-level change.","An exchange benchmark for one grade and delivery basis. Prices paid in contracts for other grades, forms or locations can differ.","The refined-zinc settlement benchmark is distinct from zinc concentrate and downstream products."],
  },
  {
    id: "wb-lead",
    materialId: "lead",
    label: "Lead",
    header: "Lead",
    sourceUnit: "($/mt)",
    descriptionPrefix: "Lead (LME)",
    benchmark: "LME refined lead",
    priceType: "exchange_benchmark",
    form: "Refined lead",
    grade: "99.97% purity",
    priceBasis: "LME settlement price",
    
    limitations: ["Monthly averages smooth intra-month moves; a month's figure is not a price on any single day.","Nominal US dollars, not adjusted for inflation; long-window changes include general price-level change.","An exchange benchmark for one grade and delivery basis. Prices paid in contracts for other grades, forms or locations can differ."],
  },
  {
    id: "wb-platinum",
    materialId: "platinum",
    label: "Platinum",
    header: "Platinum",
    sourceUnit: "($/troy oz)",
    descriptionPrefix: "Platinum,",
    benchmark: "Platinum spot average",
    priceType: "price_assessment",
    form: "Plate or ingot",
    grade: "Minimum 99.95% purity",
    priceBasis: "Spot average of daily rates (from June 2025); previously London afternoon fixing",
    sourceBreaks: [{ period: "2025-06", statedAs: "The World Bank changed platinum from the UK London afternoon fixing to the spot average of daily rates beginning June 2025." }],
    limitations: ["Monthly averages smooth intra-month moves; a month's figure is not a price on any single day.","Nominal US dollars, not adjusted for inflation; long-window changes include general price-level change.","The stated platinum quotation changes in June 2025; trends and returns do not join across that price-basis break.","Platinum spot and metal contract prices for other specifications or places may differ."],
  },
];

// ── XLSX helpers ────────────────────────────────────────────────────────────
function fail(message: string): never {
  console.error(`✗ ingest-markets: ${message}`);
  process.exit(1);
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

function colIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0];
  if (!letters) fail(`bad cell reference ${ref}`);
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

type Cell = { kind: "string"; text: string } | { kind: "number"; raw: string } | { kind: "empty" };
type Row = Map<number, Cell>;

function parseSharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decodeXml([...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );
}

function parseSheet(xml: string, shared: string[]): Map<number, Row> {
  const rows = new Map<number, Row>();
  for (const rm of xml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const r = Number(rm[1]);
    if (rows.has(r)) fail(`duplicate sheet row ${r}`);
    const row: Row = new Map();
    const body = rm[2] ?? "";
    for (const cm of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const inner = cm[2] ?? "";
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let cell: Cell = { kind: "empty" };
      if (type === "s" && v !== undefined) {
        const text = shared[Number(v)];
        if (text === undefined) fail(`shared string ${v} missing (cell ${ref})`);
        cell = { kind: "string", text };
      } else if (type === "inlineStr") {
        cell = { kind: "string", text: decodeXml([...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")) };
      } else if (type === "str" && v !== undefined) {
        cell = { kind: "string", text: decodeXml(v) };
      } else if ((type === undefined || type === "n") && v !== undefined) {
        cell = { kind: "number", raw: v };
      }
      row.set(colIndex(ref), cell);
    }
    rows.set(r, row);
  }
  return rows;
}

function cellText(row: Row | undefined, col: number): string | null {
  const c = row?.get(col);
  if (!c || c.kind === "empty") return null;
  return c.kind === "string" ? c.text.trim() : c.raw;
}

async function readSheets(zip: JSZip): Promise<Map<string, string>> {
  const wb = await zip.file("xl/workbook.xml")?.async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!wb || !rels) fail("workbook.xml or its relationships are missing");
  const targets = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = m[0].match(/\bId="([^"]+)"/)?.[1];
    const target = m[0].match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) targets.set(id, target.replace(/^\/?(xl\/)?/, "xl/"));
  }
  const sheets = new Map<string, string>();
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = m[0].match(/\bname="([^"]+)"/)?.[1];
    const rid = m[0].match(/\br:id="([^"]+)"/)?.[1];
    if (name && rid && targets.has(rid)) sheets.set(decodeXml(name), targets.get(rid)!);
  }
  return sheets;
}

/** "2026M10" → "2026-10". Anything else is a hard failure. */
function toPeriod(label: string): string {
  const m = label.match(/^(\d{4})M(\d{2})$/);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) fail(`unrecognised period label "${label}"`);
  return `${m[1]}-${m[2]}`;
}

function nextPeriod(p: string): string {
  const [y, m] = p.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Strip binary float noise ("152.30000000000001" → "152.3") without rounding real digits. */
function normaliseValue(raw: string, where: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) fail(`non-numeric value "${raw}" at ${where}`);
  if (n <= 0) fail(`non-positive value ${raw} at ${where}`);
  return Number(String(n));
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const path = process.argv[2];
  if (!path) fail("pass the path to CMO-Historical-Data-Monthly.xlsx");
  const buf = readFileSync(path);
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== WORKBOOK_SHA256) {
    fail(`SHA-256 mismatch: got ${sha}, pinned ${WORKBOOK_SHA256}. A new release needs its constants updated deliberately.`);
  }
  if (buf.length !== WORKBOOK_BYTES) fail(`size ${buf.length} ≠ pinned ${WORKBOOK_BYTES}`);

  const zip = await JSZip.loadAsync(buf);
  const sheets = await readSheets(zip);
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  if (!sharedXml) fail("sharedStrings.xml missing");
  const shared = parseSharedStrings(sharedXml);

  const load = async (name: string) => {
    const target = sheets.get(name);
    const xml = target ? await zip.file(target)?.async("string") : undefined;
    if (!xml) fail(`sheet "${name}" not found`);
    return parseSheet(xml, shared);
  };
  const prices = await load(PRICES_SHEET);
  const description = await load(DESCRIPTION_SHEET);

  // Release stamp: the "Updated on …" line must match the pinned text exactly.
  const titleRows = [1, 2, 3, 4].map((r) => cellText(prices.get(r), 0));
  if (!titleRows.includes(UPDATED_ROW_TEXT)) {
    fail(`expected "${UPDATED_ROW_TEXT}" in rows 1–4, found ${JSON.stringify(titleRows)}`);
  }
  const sheetSubtitle = titleRows.find((t) => t && /monthly prices in nominal US dollars/i.test(t));
  if (!sheetSubtitle) fail("sheet subtitle about nominal US dollars not found");

  // Locate each series by header text and unit, never by a fixed column.
  const headerRow = prices.get(HEADER_ROW);
  const unitRow = prices.get(UNIT_ROW);
  if (!headerRow || !unitRow) fail("header or unit row missing");
  const columns = new Map<string, number>();
  for (const spec of SERIES) {
    const hits = [...headerRow.entries()].filter(([, c]) => c.kind === "string" && c.text.trim() === spec.header);
    if (hits.length !== 1) fail(`header "${spec.header}" found ${hits.length} times`);
    const col = hits[0][0];
    const unit = cellText(unitRow, col);
    if (unit !== spec.sourceUnit) fail(`unit for "${spec.header}" is ${JSON.stringify(unit)}, expected "${spec.sourceUnit}"`);
    columns.set(spec.id, col);
  }

  // Observations: every month from WINDOW_START to OBSERVATION_CUTOFF, no gaps.
  const observations: Record<string, Array<{ period: string; value: number }>> = {};
  for (const spec of SERIES) observations[spec.id] = [];
  const seenPeriods = new Set<string>();
  let expected: string | null = null;
  let lastPeriod: string | null = null;
  const rowNumbers = [...prices.keys()].filter((r) => r >= FIRST_DATA_ROW).sort((a, b) => a - b);
  for (const r of rowNumbers) {
    const label = cellText(prices.get(r), 0);
    if (label === null) continue;
    const period = toPeriod(label);
    if (seenPeriods.has(period)) fail(`duplicate period ${period} (row ${r})`);
    seenPeriods.add(period);
    if (lastPeriod && period !== nextPeriod(lastPeriod)) fail(`gap or disorder: ${lastPeriod} → ${period}`);
    lastPeriod = period;
    if (period < WINDOW_START) continue;
    if (expected && period !== expected) fail(`expected ${expected}, found ${period}`);
    expected = nextPeriod(period);
    for (const spec of SERIES) {
      const cell = prices.get(r)?.get(columns.get(spec.id)!);
      if (!cell || cell.kind !== "number") {
        const shown = cell?.kind === "string" ? JSON.stringify(cell.text) : "an empty cell";
        fail(`${spec.header} ${period}: ${shown}, not a value. No interpolation is performed; extend the missing-value rules before ingesting.`);
      }
      observations[spec.id].push({ period, value: normaliseValue(cell.raw, `${spec.header} ${period}`) });
    }
  }
  if (lastPeriod !== OBSERVATION_CUTOFF) fail(`last period is ${lastPeriod}, pinned cutoff ${OBSERVATION_CUTOFF}`);

  // Description-sheet text, verbatim, for each series.
  const descriptionRows = [...description.values()].map((row) =>
    [...row.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => (c.kind === "string" ? c.text.trim() : c.kind === "number" ? c.raw : "")),
  );
  const series = SERIES.map((spec) => {
    const hits = descriptionRows.filter((cells) => cells.some((t) => t.replace(/^\*/, "").trim().startsWith(spec.descriptionPrefix)));
    if (hits.length !== 1) fail(`description for "${spec.descriptionPrefix}" found ${hits.length} times`);
    const cells = hits[0].filter((t) => t !== "");
    const specIdx = cells.findIndex((t) => t.replace(/^\*/, "").trim().startsWith(spec.descriptionPrefix));
    const specification = cells[specIdx];
    const underlyingSources = cells.slice(specIdx + 1).join(" ").trim() || null;
    const obs = observations[spec.id];
    return {
      id: spec.id,
      datasetId: DATASET_ID,
      materialId: spec.materialId,
      relatedMaterialIds: [],
      label: spec.label,
      benchmark: spec.benchmark,
      priceType: spec.priceType,
      sourceSeriesName: spec.header,
      sourceUnit: spec.sourceUnit,
      specification: specification.replace(/^\*\s*/, ""),
      forecastFlag: specification.startsWith("*"),
      form: spec.form,
      grade: spec.grade,
      priceBasis: spec.priceBasis,
      deliveryBasis: null,
      currency: "USD",
      unit: spec.sourceUnit === "($/troy oz)" ? "US$ per troy ounce" : "US$ per metric tonne",
      unitShort: spec.sourceUnit === "($/troy oz)" ? "US$/troy oz" : "US$/t",
      unitNote: "Nominal US dollars, not adjusted for inflation",
      frequency: "monthly",
      aggregation: "monthly average",
      underlyingSources,
      sourceNotes: null,
      sourceBreaks: spec.sourceBreaks ?? [],
      firstPeriod: obs[0].period,
      lastPeriod: obs[obs.length - 1].period,
      observationCount: obs.length,
      estimatedCount: 0,
      missingValueHandling:
        "Every month in the stored window has a published value. The ingest fails on a missing or non-numeric cell rather than interpolating; calculations that need an absent month return no value.",
      limitations: spec.limitations,
    };
  });

  const manifest = {
    schemaVersion: 2,
    datasetId: DATASET_ID,
    releaseId: "wb-pink-sheet-monthly-2026-11",
    title: "World Bank Commodity Price Data (The Pink Sheet), monthly prices",
    shortName: "World Bank Pink Sheet",
    publisher: "World Bank",
    frequency: "monthly",
    sourceFile: {
      url: WORKBOOK_URL,
      fileName: "CMO-Historical-Data-Monthly.xlsx",
      sha256: WORKBOOK_SHA256,
      bytes: WORKBOOK_BYTES,
      format: "Excel workbook (xlsx)",
      details: {
        sheet: PRICES_SHEET,
        sheetSubtitle,
        updatedText: UPDATED_ROW_TEXT,
        pinkSheetPdfUrl:
          "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Pink-Sheet-November-2026.pdf",
      },
    },
    landingPageUrl: "https://www.worldbank.org/en/research/commodity-markets",
    catalogUrl: "https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections",
    doi: null,
    releaseDate: RELEASE_DATE,
    retrievedOn: RETRIEVED_ON,
    windowStart: WINDOW_START,
    observationCutoff: OBSERVATION_CUTOFF,
    nextScheduledRelease: {
      date: "2026-12-02",
      statedAs: "Next update: December 2, 2026.",
      sourceUrl: "https://www.worldbank.org/en/research/commodity-markets",
    },
    updateFrequency: {
      statedAs: "Commodity prices are updated in the second business day of the month.",
      sourceUrl: "https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections",
    },
    aggregationBasis: {
      statedAs: "Monthly Averages",
      note: "Column heading used for monthly figures in the November 2026 Pink Sheet.",
      sourceUrl:
        "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Pink-Sheet-November-2026.pdf",
    },
    license: {
      kind: "cc-by-4.0",
      name: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
      url: "https://creativecommons.org/licenses/by/4.0/",
      statedAt: "https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections",
      termsUrl: "https://datacatalog.worldbank.org/public-licenses",
      statedText: "This dataset is licensed under Creative Commons Attribution 4.0",
    },
    attribution:
      "Source: World Bank, Commodity Price Data (The Pink Sheet), monthly prices, updated November 3, 2026. Licensed under CC BY 4.0.",
    changesMade:
      "SMPT extracted aluminum, copper, nickel, tin, zinc, lead and platinum from the November 3, 2026 Monthly Prices workbook for January 2005 to October 2026. Periods are normalized from YYYYMmm to YYYY-MM; published values are otherwise preserved. Platinum's June 2025 quotation change is marked explicitly. Percentage changes, indexed values and rankings are SMPT calculations.",
    thirdPartyNote:
      "The World Bank lists Bloomberg, Platts Metals Week, Thomson Reuters Datastream and others as sources for these series. SMPT republishes only the World Bank's monthly figures, not the underlying daily exchange or vendor data.",
    seriesIds: SERIES.map((s) => s.id),
  };

  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "markets", DATASET_ID);
  mkdirSync(root, { recursive: true });
  const write = (name: string, value: unknown) => writeFileSync(join(root, name), JSON.stringify(value, null, 2) + "\n");
  write("manifest.json", manifest);
  write("series.json", series);
  write("observations.json", { seriesIds: SERIES.map((s) => s.id), observations });
  console.log(
    `✓ ingest-markets: ${SERIES.length} series, ${WINDOW_START}–${OBSERVATION_CUTOFF}, ${observations[SERIES[0].id].length} months each → data/markets/${DATASET_ID}/`,
  );
}

void main();
