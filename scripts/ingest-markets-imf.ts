/**
 * Deterministic ingest for the IMF Primary Commodity Price System (PCPS)
 * series on /markets: cobalt, palladium and rare-earth carbonate, monthly.
 *
 * Reads the pinned SDMX 2.1 response committed at
 * `data/markets/imf-pcps/raw/pcps-PCOBA-PPALLA-PREODOM-USD-M.xml`, verifies
 * its SHA-256, and writes `manifest.json`, `series.json` and
 * `observations.json` beside it. Values are stored exactly as published; the
 * only transformation is the period label ("2026-M09" → "2026-09").
 *
 * Usage:  npm run ingest:markets:imf
 *
 * Nothing here reads the wall clock. A new IMF release means re-fetching the
 * query in QUERY_URL, updating the pinned constants deliberately, re-running
 * and reviewing the diff. See docs/analysis/markets-monitor/sources-2026-11.md
 * for the documentation conflicts and cross-checks behind each series.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATASET_ID = "imf-pcps";
const RAW_FILE = "raw/pcps-PCOBA-PPALLA-PREODOM-USD-M.xml";
const QUERY_URL =
  "https://api.imf.org/external/sdmx/2.1/data/IMF.RES,PCPS,latest/G001.PCOBA+PPALLA+PREODOM.USD.M?startPeriod=2005-01&detail=full";
const RAW_SHA256 = "3f005120ad83924285cc548a1a1c6503e953ba9477c79d65c3071c11220ee7dd";
const RAW_BYTES = 102066;
const STRUCTURE_REF = "IMF.RES_PCPS_9_0_0";
const PUBLICATION_DATE_ATTR = "2026-10-06T17:27:04.304001Z";
const RELEASE_DATE = "2026-10-06";
const RETRIEVED_ON = "2026-11-09";
const OBSERVATION_CUTOFF = "2026-09";
const WINDOW_START = "2005-01";
const TECH_DOC_URL = "https://www.imf.org/-/media/files/research/commodityprices/monthly/pcps-technical-documentation.pdf";
const LANDING_URL = "https://www.imf.org/en/research/commodity-prices";
const CATALOG_URL = "https://data.imf.org/en/datasets/IMF.RES:PCPS";
const TERMS_URL = "https://www.imf.org/en/about/copyright-and-terms";

interface SeriesSpec {
  code: string;
  id: string;
  materialId: string;
  label: string;
  benchmark: string;
  specification: string;
  sourceUnit: string;
  form: string;
  grade: string;
  priceBasis: string;
  deliveryBasis: string | null;
  unit: string;
  unitShort: string;
  underlyingSources: string;
  sourceNotes: string;
  limitations: string[];
}

const COMMON = [
  "Monthly averages of weekly or daily values; a month's figure is not a price on any single day.",
  "Nominal US dollars, not adjusted for inflation.",
  "The IMF republishes a benchmark it obtains from the named source; SMPT has not seen the underlying daily data.",
];

const SERIES: SeriesSpec[] = [
  {
    code: "PCOBA",
    id: "imf-cobalt",
    materialId: "cobalt",
    label: "Cobalt",
    benchmark: "LME cobalt, minimum 99.80%",
    specification: "Cobalt, minimum 99.80% purity, LME spot price, USD/ton",
    sourceUnit: "USD/mt",
    form: "Refined cobalt metal (form not stated by the IMF)",
    grade: "Minimum 99.80% purity",
    priceBasis: "LME spot price",
    deliveryBasis: null,
    unit: "US$ per metric tonne",
    unitShort: "US$/t",
    underlyingSources: "London Metal Exchange",
    sourceNotes:
      "The PCPS technical documentation (Table 3) gives the specification and unit above. The SDMX codelist names the indicator \"Cobalt, US dollars per pound\" and \"Cobalt, U.S. cathodes, spot\"; the stored values are on the per-tonne basis the documentation states.",
    limitations: [
      ...COMMON,
      "The IMF's own metadata conflict on unit and basis (see source notes). SMPT checked the stored values against the USGS LME cash cobalt annual averages, which they track closely once converted, but stores the IMF figures unchanged.",
      "Cobalt hydroxide and cobalt sulphate, used in battery supply chains, trade on separate terms.",
    ],
  },
  {
    code: "PPALLA",
    id: "imf-palladium",
    materialId: "palladium",
    label: "Palladium",
    benchmark: "LME palladium",
    specification: "Palladium, LME spot price, USD/troy ounce",
    sourceUnit: "USD/troy ounce",
    form: "Refined metal (form not stated by the IMF)",
    grade: "Not stated by the IMF",
    priceBasis: "LME spot price",
    deliveryBasis: null,
    unit: "US$ per troy ounce",
    unitShort: "US$/oz t",
    underlyingSources: "London Metal Exchange",
    sourceNotes:
      "Specification and unit from the PCPS technical documentation (Table 3). The SDMX codelist labels the unit \"US dollars per troy ounce of gold\"; SMPT reads this as a codelist error and uses the documented unit.",
    limitations: [...COMMON],
  },
  {
    code: "PREODOM",
    id: "imf-reo-carbonate",
    materialId: "rare-earth-elements",
    label: "Rare-earth carbonate",
    benchmark: "Rare-earth carbonate, REO 42–45% (SMM)",
    specification: "Rare earth carbonate REO 42-45% purity, USD/metric ton",
    sourceUnit: "USD/mt",
    form: "Mixed rare-earth carbonate (an intermediate, not a separated oxide)",
    grade: "42–45% total rare-earth oxide (REO) content",
    priceBasis: "Shanghai Metal Market assessment",
    deliveryBasis: "Not stated; the codelist name ends \"Dom\", which the IMF does not define",
    unit: "US$ per metric tonne",
    unitShort: "US$/t",
    underlyingSources: "Shanghai Metal Market",
    sourceNotes:
      "Specification from the PCPS technical documentation (Table 3). The SDMX codelist name is \"Rare earth carbonate REO 42-45 Dom\".",
    limitations: [
      ...COMMON,
      "A mixed carbonate whose value depends on its element mix. It is not a price for NdPr, neodymium, praseodymium, dysprosium or terbium, and moves in it need not match moves in separated oxides.",
      "The published history starts in June 2012.",
    ],
  },
];

function fail(message: string): never {
  console.error(`✗ ingest-markets-imf: ${message}`);
  process.exit(1);
}

function attr(tag: string, name: string): string | null {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
}

function main() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "markets", DATASET_ID);
  const buf = readFileSync(join(dir, RAW_FILE));
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== RAW_SHA256) fail(`SHA-256 mismatch: got ${sha}, pinned ${RAW_SHA256}`);
  if (buf.length !== RAW_BYTES) fail(`size ${buf.length} ≠ pinned ${RAW_BYTES}`);
  const xml = buf.toString("utf8");

  const dataSet = xml.match(/<message:DataSet\b[^>]*>/)?.[0];
  if (!dataSet) fail("no DataSet element");
  if (attr(dataSet, "ss:structureRef") !== STRUCTURE_REF) fail(`structureRef is not ${STRUCTURE_REF}`);
  if (attr(dataSet, "PUBLICATION_DATE") !== PUBLICATION_DATE_ATTR) fail(`PUBLICATION_DATE is not ${PUBLICATION_DATE_ATTR}`);
  const licenseAttr = attr(dataSet, "LICENSE");
  if (!licenseAttr) fail("no LICENSE attribute");

  const observations: Record<string, Array<{ period: string; value: number }>> = {};
  const blocks = [...xml.matchAll(/<Series\b([^>]*)>([\s\S]*?)<\/Series>/g)];
  if (blocks.length !== SERIES.length) fail(`expected ${SERIES.length} series, found ${blocks.length}`);
  for (const spec of SERIES) {
    const hit = blocks.filter((b) => attr(b[1], "INDICATOR") === spec.code);
    if (hit.length !== 1) fail(`${spec.code} found ${hit.length} times`);
    const head = hit[0][1];
    for (const [k, v] of [["COUNTRY", "G001"], ["DATA_TRANSFORMATION", "USD"], ["FREQUENCY", "M"], ["SCALE", "0"]]) {
      if (attr(head, k) !== v) fail(`${spec.code}: ${k} is ${attr(head, k)}, expected ${v}`);
    }
    const rows: Array<{ period: string; value: number }> = [];
    for (const om of hit[0][2].matchAll(/<Obs\b[^>]*\/>/g)) {
      const raw = attr(om[0], "TIME_PERIOD");
      const v = attr(om[0], "OBS_VALUE");
      const m = raw?.match(/^(\d{4})-M(0[1-9]|1[0-2])$/);
      if (!m) fail(`${spec.code}: bad TIME_PERIOD ${raw}`);
      const value = Number(v);
      if (v === null || !Number.isFinite(value) || value <= 0) fail(`${spec.code} ${raw}: value ${v} is not positive`);
      rows.push({ period: `${m[1]}-${m[2]}`, value });
    }
    rows.sort((a, b) => a.period.localeCompare(b.period));
    for (let i = 1; i < rows.length; i++) {
      const [y, mo] = rows[i - 1].period.split("-").map(Number);
      const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
      if (rows[i].period !== next) fail(`${spec.code}: gap or duplicate between ${rows[i - 1].period} and ${rows[i].period}`);
    }
    if (rows[0].period < WINDOW_START) fail(`${spec.code}: starts before ${WINDOW_START}`);
    if (rows.at(-1)!.period !== OBSERVATION_CUTOFF) fail(`${spec.code}: ends ${rows.at(-1)!.period}, pinned cutoff ${OBSERVATION_CUTOFF}`);
    observations[spec.id] = rows;
  }

  const series = SERIES.map((spec) => {
    const obs = observations[spec.id];
    return {
      id: spec.id,
      datasetId: DATASET_ID,
      materialId: spec.materialId,
      relatedMaterialIds: [],
      label: spec.label,
      benchmark: spec.benchmark,
      priceType: spec.code === "PREODOM" ? "price_assessment" : "exchange_benchmark",
      sourceSeriesName: spec.code,
      sourceUnit: spec.sourceUnit,
      specification: spec.specification,
      forecastFlag: false,
      form: spec.form,
      grade: spec.grade,
      priceBasis: spec.priceBasis,
      deliveryBasis: spec.deliveryBasis,
      currency: "USD",
      unit: spec.unit,
      unitShort: spec.unitShort,
      unitNote: "Nominal US dollars, not adjusted for inflation",
      frequency: "monthly",
      aggregation: "monthly average",
      underlyingSources: spec.underlyingSources,
      sourceNotes: spec.sourceNotes,
      sourceBreaks: [],
      firstPeriod: obs[0].period,
      lastPeriod: obs.at(-1)!.period,
      observationCount: obs.length,
      estimatedCount: 0,
      missingValueHandling:
        "Every month from the first published value to the cutoff has a value. The ingest fails on a gap rather than interpolating; calculations that need an absent month return no value.",
      limitations: spec.limitations,
    };
  });

  const manifest = {
    schemaVersion: 2,
    datasetId: DATASET_ID,
    releaseId: "imf-pcps-2026-10",
    title: "IMF Primary Commodity Price System (PCPS), monthly prices",
    shortName: "IMF PCPS",
    publisher: "International Monetary Fund",
    frequency: "monthly",
    sourceFile: {
      url: QUERY_URL,
      fileName: RAW_FILE,
      sha256: RAW_SHA256,
      bytes: RAW_BYTES,
      format: "SDMX 2.1 structure-specific XML (committed in the repository)",
      details: {
        structureRef: STRUCTURE_REF,
        publicationDate: PUBLICATION_DATE_ATTR,
        updateDate: attr(dataSet, "UPDATE_DATE") ?? "",
        prepared: xml.match(/<message:Prepared>([^<]+)</)?.[1] ?? "",
        landingPageEdition: "Excel Database: October 2026",
        technicalDocumentation: TECH_DOC_URL,
      },
    },
    landingPageUrl: LANDING_URL,
    catalogUrl: CATALOG_URL,
    doi: null,
    releaseDate: RELEASE_DATE,
    retrievedOn: RETRIEVED_ON,
    windowStart: WINDOW_START,
    observationCutoff: OBSERVATION_CUTOFF,
    nextScheduledRelease: null,
    updateFrequency: {
      statedAs: "Primary Commodity Prices data are updated monthly based on the IMF’s Primary Commodity Prices System.",
      sourceUrl: LANDING_URL,
    },
    aggregationBasis: {
      statedAs: "The benchmark prices are obtained from various sources at high frequency which are then converted to monthly frequency by averaging weekly or daily values.",
      note: "PCPS technical documentation, section 4.1.",
      sourceUrl: TECH_DOC_URL,
    },
    license: {
      kind: "imf-terms",
      name: "IMF Copyright and Usage terms (Data)",
      url: null,
      statedAt: CATALOG_URL,
      termsUrl: TERMS_URL,
      statedText:
        "You may download, extract, copy, create derivative works, publish, distribute, and use Data obtained from IMF Sites, subject to the following conditions: … it must appear accurately with attribution to the IMF as the source … If the Data is materially transformed by the User, this must be stated explicitly along with the required source citation.",
    },
    attribution: `Source: International Monetary Fund, Primary Commodity Price System (PCPS), ${CATALOG_URL}, published October 6, 2026.`,
    changesMade:
      "SMPT stored the IMF's published monthly values for indicators PCOBA, PPALLA and PREODOM unchanged and converted period labels from YYYY-Mmm to YYYY-MM. Percentage changes, indexed values and rankings shown with them are SMPT calculations from the IMF data, not IMF figures.",
    thirdPartyNote:
      "The IMF names the London Metal Exchange (cobalt, palladium) and Shanghai Metal Market (rare-earth carbonate) as its sources. SMPT republishes only the IMF's monthly averages, not the underlying exchange or vendor data.",
    seriesIds: SERIES.map((s) => s.id),
  };

  const write = (name: string, value: unknown) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + "\n");
  write("manifest.json", manifest);
  write("series.json", series);
  write("observations.json", { seriesIds: SERIES.map((s) => s.id), observations });
  console.log(`✓ ingest-markets-imf: ${SERIES.length} series to ${OBSERVATION_CUTOFF} → data/markets/${DATASET_ID}/ (licence attribute: ${licenseAttr})`);
}

main();
