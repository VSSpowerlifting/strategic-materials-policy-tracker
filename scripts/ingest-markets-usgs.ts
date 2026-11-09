/**
 * Deterministic ingest for the annual price series on /markets, from the
 * USGS Mineral Commodity Summaries 2026 data release (CC0).
 *
 * Reads a local copy of `MCS2026_Commodities_Data.csv` (Windows-1252), checks
 * it against the pinned SHA-256, picks each series by its exact commodity and
 * statistic text, and writes `data/markets/usgs-mcs-2026/`:
 *
 *   manifest.json      release, licence, citation, cutoff, changes made
 *   series.json        per-series metadata (product, grade, basis, unit, notes)
 *   observations.json  annual values 2021–2025, with the source's estimates flagged
 *
 * Usage:
 *   npm run ingest:markets:usgs -- /path/to/MCS2026_Commodities_Data.csv
 *
 * The CSV is not committed. Values are stored as published (thousands
 * separators removed); nothing is converted, deflated or filled. A value
 * whose note begins "Estimated." is stored with `estimated: true`.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATASET_ID = "usgs-mcs-2026";
const CSV_URL =
  "https://www.sciencebase.gov/catalog/file/get/696a75d5d4be0228872d3bf8?f=__disk__eb%2F4d%2Fd1%2Feb4dd129d4f08cfba010a8b11cbbd2d88bbefdcb";
const CSV_SHA256 = "582a0aa231aea53d8a97dc8d1cd3dfa5f885cf3760353e3d029d7f0ae4fbaaf5";
const CSV_BYTES = 3189010;
const ITEM_URL = "https://www.sciencebase.gov/catalog/item/696a75d5d4be0228872d3bf8";
const DOI = "10.5066/P1WKQ63T";
const RELEASE_DATE = "2026-02-06";
const RETRIEVED_ON = "2026-11-09";
const YEARS = ["2021", "2022", "2023", "2024", "2025"];
const ESTIMATED_PREFIX = "Estimated.";

type PriceType = "exchange_benchmark" | "price_assessment" | "trade_unit_value";

interface Spec {
  id: string;
  commodity: string;
  detail: string;
  sourceUnit: string;
  materialId: string;
  relatedMaterialIds?: string[];
  label: string;
  benchmark: string;
  priceType: PriceType;
  form: string;
  grade: string;
  priceBasis: string;
  deliveryBasis: string | null;
  unit: string;
  unitShort: string;
  unitNote?: string;
  sourceBreaks?: Array<{ period: string; statedAs: string }>;
  extraLimitations?: string[];
  /** Set where the note mixes the source name with other sentences. */
  underlyingSources?: string;
}

const NOT_STATED = "Not stated in the data release";
const UNIT_NOTE = "US dollars as stated by the USGS; the data release does not state a price-level basis";

const UNIT_VALUE_LIMITS = [
  "A trade unit value (customs value divided by quantity), not a transaction or market price. It moves with the mix of grades, origins and forms imported as well as with prices.",
];

const SPECS: Spec[] = [
  {
    id: "usgs-aluminum-us-spot", commodity: "Aluminum", detail: "Price, ingot, average U.S. market (spot), cents per pound", sourceUnit: "cents per pound",
    materialId: "aluminium", label: "Aluminium, U.S. market", benchmark: "U.S. market ingot (spot)", priceType: "price_assessment",
    form: "Ingot", grade: NOT_STATED, priceBasis: "Average U.S. market spot price", deliveryBasis: "U.S. market",
    unit: "US cents per pound", unitShort: "US¢/lb",
    extraLimitations: ["A U.S. market price that includes the regional premium; it is not the LME benchmark in the monthly view."],
  },
  {
    id: "usgs-antimony", commodity: "Antimony", detail: "Price, metal, average, dollars per pound", sourceUnit: "dollars per pound",
    materialId: "antimony", label: "Antimony metal", benchmark: "Antimony metal, minimum 99.65%", priceType: "price_assessment",
    form: "Metal", grade: "Minimum 99.65%", priceBasis: "Average price assessment", deliveryBasis: "Cost, insurance and freight (CIF)",
    unit: "US$ per pound", unitShort: "US$/lb",
  },
  {
    id: "usgs-boron-imports", commodity: "Boron", detail: "Price, average unit value of combined imports, cost, insurance, and freight, dollars per metric ton", sourceUnit: "dollars per metric ton",
    materialId: "boron", label: "Boron imports, unit value", benchmark: "U.S. combined boron imports, average unit value", priceType: "trade_unit_value",
    form: "Combined boron imports (products not separated)", grade: NOT_STATED, priceBasis: "Average unit value of combined U.S. imports", deliveryBasis: "Cost, insurance and freight (CIF)",
    unit: "US$ per metric tonne", unitShort: "US$/t", extraLimitations: UNIT_VALUE_LIMITS,
  },
  {
    id: "usgs-cobalt-us-spot", commodity: "Cobalt", detail: "Price, average, dollars per pound: U.S. spot, cathode", sourceUnit: "dollars per pound",
    materialId: "cobalt", label: "Cobalt cathode, U.S. spot", benchmark: "U.S. spot cobalt cathode", priceType: "price_assessment",
    form: "Cathode", grade: NOT_STATED, priceBasis: "Average U.S. spot price", deliveryBasis: "U.S. market",
    unit: "US$ per pound", unitShort: "US$/lb", underlyingSources: "S&P Global Platts Metals Week",
  },
  {
    id: "usgs-cobalt-lme", commodity: "Cobalt", detail: "Price, average, dollars per pound: London Metal Exchange (LME), cash", sourceUnit: "dollars per pound",
    materialId: "cobalt", label: "Cobalt, LME cash", benchmark: "LME cobalt cash", priceType: "exchange_benchmark",
    form: "Refined metal", grade: NOT_STATED, priceBasis: "LME cash price, annual average", deliveryBasis: null,
    unit: "US$ per pound", unitShort: "US$/lb",
  },
  {
    id: "usgs-copper-us-producer", commodity: "Copper", detail: "Price, annual average, cents per pound: U.S. producer, cathode (COMEX + premium)", sourceUnit: "cents per pound",
    materialId: "copper", label: "Copper cathode, U.S. producer", benchmark: "U.S. producer cathode (COMEX + premium)", priceType: "price_assessment",
    form: "Cathode", grade: NOT_STATED, priceBasis: "COMEX price plus producer premium", deliveryBasis: "U.S. market",
    unit: "US cents per pound", unitShort: "US¢/lb",
  },
  {
    id: "usgs-copper-comex", commodity: "Copper", detail: "Price, annual average, cents per pound: COMEX, high-grade, first position", sourceUnit: "cents per pound",
    materialId: "copper", label: "Copper, COMEX", benchmark: "COMEX high-grade copper, first position", priceType: "exchange_benchmark",
    form: "Cathode", grade: "High grade", priceBasis: "COMEX first-position futures, annual average", deliveryBasis: null,
    unit: "US cents per pound", unitShort: "US¢/lb",
  },
  {
    id: "usgs-copper-lme", commodity: "Copper", detail: "Price, annual average, cents per pound: London Metal Exchange, grade A, cash", sourceUnit: "cents per pound",
    materialId: "copper", label: "Copper, LME cash", benchmark: "LME grade A copper cash", priceType: "exchange_benchmark",
    form: "Cathode", grade: "Grade A", priceBasis: "LME cash price, annual average", deliveryBasis: null,
    unit: "US cents per pound", unitShort: "US¢/lb",
  },
  {
    id: "usgs-gallium-imports", commodity: "Gallium", detail: "Price, average unit value of imports, dollars per kilogram", sourceUnit: "dollars per kilogram",
    materialId: "gallium", label: "Gallium imports, unit value", benchmark: "U.S. gallium imports, average customs unit value", priceType: "trade_unit_value",
    form: "Gallium metal (HTS 8112.92.1000)", underlyingSources: "U.S. Census Bureau", grade: NOT_STATED, priceBasis: "Average customs value of U.S. imports", deliveryBasis: "U.S. customs value",
    unit: "US$ per kilogram", unitShort: "US$/kg", extraLimitations: UNIT_VALUE_LIMITS,
  },
  {
    id: "usgs-germanium-metal", commodity: "Germanium", detail: "Price, annual average, dollars per kilogram: Germanium metal", sourceUnit: "dollars per kilogram",
    materialId: "germanium", label: "Germanium metal", benchmark: "Germanium metal, minimum 99.999%, Europe", priceType: "price_assessment",
    form: "Metal", grade: "Minimum 99.999% purity", priceBasis: "Average European price", deliveryBasis: "Europe",
    unit: "US$ per kilogram", unitShort: "US$/kg",
  },
  {
    id: "usgs-germanium-dioxide", commodity: "Germanium", detail: "Price, annual average, dollars per kilogram: Germanium dioxide", sourceUnit: "dollars per kilogram",
    materialId: "germanium", label: "Germanium dioxide", benchmark: "Germanium dioxide, Europe", priceType: "price_assessment",
    form: "Dioxide", grade: "Minimum 99.999% purity", priceBasis: "Average European price", deliveryBasis: "Europe",
    unit: "US$ per kilogram", unitShort: "US$/kg",
  },
  {
    id: "usgs-graphite-flake", commodity: "Graphite (Natural)", detail: "Price, average unit value of imports, dollars per metric ton at foreign ports: Flake", sourceUnit: "dollars per metric ton",
    materialId: "graphite", label: "Flake graphite imports, unit value", benchmark: "U.S. natural flake graphite imports, average unit value", priceType: "trade_unit_value",
    form: "Natural flake", grade: NOT_STATED, priceBasis: "Average unit value of U.S. imports", deliveryBasis: "At foreign ports",
    unit: "US$ per metric tonne", unitShort: "US$/t", extraLimitations: UNIT_VALUE_LIMITS,
  },
  {
    id: "usgs-graphite-lump-chip", commodity: "Graphite (Natural)", detail: "Price, average unit value of imports, dollars per metric ton at foreign ports: Lump and chip (Sri Lanka)", sourceUnit: "dollars per metric ton",
    materialId: "graphite", label: "Lump and chip graphite imports, unit value", benchmark: "U.S. lump and chip graphite imports from Sri Lanka, average unit value", priceType: "trade_unit_value",
    form: "Natural lump and chip", grade: NOT_STATED, priceBasis: "Average unit value of U.S. imports", deliveryBasis: "At foreign ports (Sri Lanka)",
    unit: "US$ per metric tonne", unitShort: "US$/t", extraLimitations: UNIT_VALUE_LIMITS,
  },
  {
    id: "usgs-graphite-amorphous", commodity: "Graphite (Natural)", detail: "Price, average unit value of imports, dollars per metric ton at foreign ports: Amorphous", sourceUnit: "dollars per metric ton",
    materialId: "graphite", label: "Amorphous graphite imports, unit value", benchmark: "U.S. amorphous graphite imports, average unit value", priceType: "trade_unit_value",
    form: "Natural amorphous", grade: NOT_STATED, priceBasis: "Average unit value of U.S. imports", deliveryBasis: "At foreign ports",
    unit: "US$ per metric tonne", unitShort: "US$/t", extraLimitations: UNIT_VALUE_LIMITS,
  },
  {
    id: "usgs-lithium-carbonate", commodity: "Lithium", detail: "Price, annual average-real, battery-grade lithium carbonate, dollars per metric ton", sourceUnit: "dollars per metric ton",
    materialId: "lithium", label: "Lithium carbonate, battery grade", benchmark: "Battery-grade lithium carbonate", priceType: "price_assessment",
    form: "Lithium carbonate", grade: "Battery grade", priceBasis: "Assessments for spot and long-term contracts, annual average", deliveryBasis: null,
    unit: "US$ per metric tonne", unitShort: "US$/t",
    unitNote: "US dollars; the source labels the series \"annual average-real\" without stating a base year or deflator",
    extraLimitations: [
      "The source calls this an \"annual average-real\" price but does not define the deflator or base year; SMPT stores the figures as published and does not compare them with nominal series.",
      "Combines spot and long-term contract assessments; neither a pure spot nor a pure contract price.",
    ],
  },
  {
    id: "usgs-nickel-lme", commodity: "Nickel", detail: "Price, average annual, London Metal Exchange (LME), cash: Dollars per metric ton", sourceUnit: "dollars per metric ton",
    materialId: "nickel", label: "Nickel, LME cash", benchmark: "LME nickel cash", priceType: "exchange_benchmark",
    form: "Refined metal", grade: NOT_STATED, priceBasis: "LME cash price, annual average", deliveryBasis: null,
    unit: "US$ per metric tonne", unitShort: "US$/t",
  },
  {
    id: "usgs-niobium-ferroniobium", commodity: "Niobium (Columbium)", detail: "Price, average unit value, ferroniobium, dollars per kilogram", sourceUnit: "dollars per kilogram",
    materialId: "niobium", label: "Ferroniobium, unit value", benchmark: "U.S. ferroniobium trade, average unit value", priceType: "trade_unit_value",
    form: "Ferroniobium", grade: NOT_STATED, priceBasis: "Weighted average unit value (see source note)", deliveryBasis: null,
    unit: "US$ per kilogram", unitShort: "US$/kg", extraLimitations: UNIT_VALUE_LIMITS,
  },
  {
    id: "usgs-palladium", commodity: "Palladium", detail: "Price, dollars per troy ounce: Palladium", sourceUnit: "dollars per troy ounce",
    materialId: "palladium", label: "Palladium, Engelhard", benchmark: "Engelhard unfabricated palladium", priceType: "price_assessment",
    form: "Unfabricated metal", grade: NOT_STATED, priceBasis: "Engelhard average annual price", deliveryBasis: null,
    unit: "US$ per troy ounce", unitShort: "US$/oz t",
  },
  {
    id: "usgs-ndpr-oxide", commodity: "Rare Earths", detail: "Price, average, dollars per kilogram: Neodymium-praseodymium (NdPr) oxide, 99% minimum", sourceUnit: "dollars per kilogram",
    materialId: "neodymium", relatedMaterialIds: ["praseodymium"], label: "NdPr oxide", benchmark: "Neodymium-praseodymium oxide, minimum 99%", priceType: "price_assessment",
    form: "Mixed oxide (NdPr)", grade: "Minimum 99%", priceBasis: "Average price assessment", deliveryBasis: "Free on board (port not stated)",
    unit: "US$ per kilogram", unitShort: "US$/kg",
    extraLimitations: ["The source does not say whether the assessment is for material inside or outside China; those prices can differ."],
  },
  {
    id: "usgs-nd-oxide", commodity: "Neodymium", detail: "Price, average, dollars per kilogram: Neodymium oxide, 99.5% minimum", sourceUnit: "dollars per kilogram",
    materialId: "neodymium", label: "Neodymium oxide", benchmark: "Neodymium oxide, minimum 99.5%", priceType: "price_assessment",
    form: "Oxide", grade: "Minimum 99.5%", priceBasis: "Average price assessment", deliveryBasis: "Free on board (port not stated)",
    unit: "US$ per kilogram", unitShort: "US$/kg",
  },
  {
    id: "usgs-mischmetal", commodity: "Rare Earths", detail: "Price, average, dollars per kilogram: Mischmetal, 65% cerium, 35% lanthanum", sourceUnit: "dollars per kilogram",
    materialId: "rare-earth-elements", label: "Mischmetal", benchmark: "Mischmetal, 65% cerium, 35% lanthanum", priceType: "price_assessment",
    form: "Alloy (mischmetal)", grade: "65% cerium, 35% lanthanum", priceBasis: "Average price assessment", deliveryBasis: "Free on board (port not stated)",
    unit: "US$ per kilogram", unitShort: "US$/kg",
    extraLimitations: ["A light rare-earth (cerium–lanthanum) alloy, not a magnet-material oxide."],
  },
  {
    id: "usgs-terbium-oxide", commodity: "Terbium", detail: "Price, average, dollars per kilogram: Terbium oxide, 99.99% minimum", sourceUnit: "dollars per kilogram",
    materialId: "terbium", label: "Terbium oxide", benchmark: "Terbium oxide, minimum 99.99%", priceType: "price_assessment",
    form: "Oxide", grade: "Minimum 99.99%", priceBasis: "Average price assessment", deliveryBasis: "Free on board (port not stated)",
    unit: "US$ per kilogram", unitShort: "US$/kg",
  },
  {
    id: "usgs-dysprosium-oxide", commodity: "Dysprosium", detail: "Price, average, dollars per kilogram: Dysprosium oxide, 99.5% minimum", sourceUnit: "dollars per kilogram",
    materialId: "dysprosium", label: "Dysprosium oxide", benchmark: "Dysprosium oxide, minimum 99.5%", priceType: "price_assessment",
    form: "Oxide", grade: "Minimum 99.5%", priceBasis: "Average price assessment", deliveryBasis: "Free on board (port not stated)",
    unit: "US$ per kilogram", unitShort: "US$/kg",
  },
  {
    id: "usgs-tantalite", commodity: "Tantalum", detail: "Price, tantalite, annual average, dollars per kilogram of tantalum oxide (Ta2O5) content", sourceUnit: "dollars per kilogram",
    materialId: "tantalum", label: "Tantalite", benchmark: "Tantalite, per kg Ta₂O₅ content", priceType: "price_assessment",
    form: "Tantalite concentrate", grade: "Priced on tantalum oxide (Ta₂O₅) content", priceBasis: "Annual average price assessment", deliveryBasis: null,
    unit: "US$ per kilogram of Ta₂O₅ content", unitShort: "US$/kg Ta₂O₅",
    sourceBreaks: [
      { period: "2022", statedAs: "Sources: CRU Group (2021), the Institute for Rare Earths and Metals (2022–24), and Asian Metal (2025)." },
      { period: "2025", statedAs: "Sources: CRU Group (2021), the Institute for Rare Earths and Metals (2022–24), and Asian Metal (2025)." },
    ],
    extraLimitations: ["The underlying price source changes twice in five years, so SMPT does not compute changes across 2021→2022 or 2024→2025."],
  },
  {
    id: "usgs-tungsten-concentrate", commodity: "Tungsten", detail: "Price, concentrate, average in-warehouse Rotterdam, dollars per dry metric ton unit of tungsten trioxide", sourceUnit: "dollars per dry metric ton unit",
    materialId: "tungsten", label: "Tungsten concentrate", benchmark: "Tungsten concentrate, in-warehouse Rotterdam", priceType: "price_assessment",
    form: "Concentrate", grade: "Priced per dry metric ton unit of WO₃", priceBasis: "Average price assessment", deliveryBasis: "In-warehouse Rotterdam",
    unit: "US$ per dry metric ton unit of WO₃", unitShort: "US$/mtu WO₃",
  },
];

const COMMON_LIMITS = [
  "Annual averages; five values cannot show intra-year moves, and the 2025 value is a USGS estimate made before the year's data were complete.",
  "The USGS republishes figures from the named source; SMPT has not seen the underlying assessment data.",
];

function fail(message: string): never {
  console.error(`✗ ingest-markets-usgs: ${message}`);
  process.exit(1);
}

/** Minimal RFC 4180 parser (quoted fields, doubled quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function main() {
  const path = process.argv[2];
  if (!path) fail("pass the path to MCS2026_Commodities_Data.csv");
  const buf = readFileSync(path);
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== CSV_SHA256) fail(`SHA-256 mismatch: got ${sha}, pinned ${CSV_SHA256}`);
  if (buf.length !== CSV_BYTES) fail(`size ${buf.length} ≠ pinned ${CSV_BYTES}`);
  const text = new TextDecoder("windows-1252").decode(buf);
  const [header, ...rows] = parseCsv(text).filter((r) => r.some((c) => c !== ""));
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) fail(`column "${name}" missing`);
    return i;
  };
  const C = { commodity: col("Commodity"), country: col("Country"), stat: col("Statistics"), detail: col("Statistics_detail"), unit: col("Unit"), year: col("Year"), value: col("Value"), notes: col("Notes") };

  const observations: Record<string, Array<{ period: string; value: number; estimated?: true }>> = {};
  const series = SPECS.map((spec) => {
    const hits = rows.filter((r) => r[C.commodity] === spec.commodity && r[C.detail] === spec.detail);
    if (hits.length !== YEARS.length) fail(`${spec.id}: ${hits.length} rows, expected ${YEARS.length}`);
    const notes = new Set<string>();
    const obs = YEARS.map((year) => {
      const r = hits.filter((h) => h[C.year] === year);
      if (r.length !== 1) fail(`${spec.id} ${year}: ${r.length} rows`);
      const row = r[0];
      if (row[C.country] !== "United States") fail(`${spec.id} ${year}: country ${row[C.country]}`);
      if (row[C.stat] !== "Price") fail(`${spec.id} ${year}: statistic ${row[C.stat]}`);
      if (row[C.unit] !== spec.sourceUnit) fail(`${spec.id} ${year}: unit "${row[C.unit]}" ≠ "${spec.sourceUnit}"`);
      const raw = row[C.value].trim();
      if (!/^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(raw)) fail(`${spec.id} ${year}: value "${raw}" is not a plain number`);
      const value = Number(raw.replace(/,/g, ""));
      if (!(value > 0)) fail(`${spec.id} ${year}: non-positive value`);
      let note = row[C.notes].trim();
      const estimated = note.startsWith(ESTIMATED_PREFIX);
      if (estimated) note = note.slice(ESTIMATED_PREFIX.length).replace(/^\s*--\s*/, "").trim();
      notes.add(note);
      return estimated ? { period: year, value, estimated: true as const } : { period: year, value };
    });
    if (notes.size !== 1) fail(`${spec.id}: notes differ between years: ${JSON.stringify([...notes])}`);
    if (!obs.at(-1)!.estimated || obs.slice(0, -1).some((o) => o.estimated)) fail(`${spec.id}: expected only 2025 to be estimated`);
    observations[spec.id] = obs;
    const note = [...notes][0] || null;
    const sourceMatch = note?.match(/Sources?: ([^]*?)(?:\.\s*(?:--|$)|$)/);
    return {
      id: spec.id,
      datasetId: DATASET_ID,
      materialId: spec.materialId,
      relatedMaterialIds: spec.relatedMaterialIds ?? [],
      label: spec.label,
      benchmark: spec.benchmark,
      priceType: spec.priceType,
      sourceSeriesName: `${spec.commodity}: ${spec.detail}`,
      sourceUnit: spec.sourceUnit,
      specification: spec.detail,
      forecastFlag: false,
      form: spec.form,
      grade: spec.grade,
      priceBasis: spec.priceBasis,
      deliveryBasis: spec.deliveryBasis,
      currency: "USD",
      unit: spec.unit,
      unitShort: spec.unitShort,
      unitNote: spec.unitNote ?? UNIT_NOTE,
      frequency: "annual",
      aggregation: "annual average",
      underlyingSources: spec.underlyingSources ?? (sourceMatch ? sourceMatch[1].trim().replace(/\.$/, "") : null),
      sourceNotes: note,
      sourceBreaks: spec.sourceBreaks ?? [],
      firstPeriod: obs[0].period,
      lastPeriod: obs.at(-1)!.period,
      observationCount: obs.length,
      estimatedCount: obs.filter((o) => o.estimated).length,
      missingValueHandling:
        "Every year 2021–2025 has a published value. The ingest fails on a missing or non-numeric value rather than filling it; a change that needs an absent year, or that crosses a stated change of source, returns no value.",
      limitations: [...COMMON_LIMITS, ...(spec.extraLimitations ?? [])],
    };
  });

  const manifest = {
    schemaVersion: 2,
    datasetId: DATASET_ID,
    releaseId: "usgs-mcs-2026-v1.3",
    title: "U.S. Geological Survey Mineral Commodity Summaries 2026 Data Release",
    shortName: "USGS MCS 2026",
    publisher: "U.S. Geological Survey, National Minerals Information Center",
    frequency: "annual",
    sourceFile: {
      url: CSV_URL,
      fileName: "MCS2026_Commodities_Data.csv",
      sha256: CSV_SHA256,
      bytes: CSV_BYTES,
      format: "CSV (Windows-1252)",
      details: {
        scienceBaseItem: ITEM_URL,
        itemLastUpdated: "2026-05-27",
        reportVersion: "Mineral Commodity Summaries 2026, version 1.3 (May 2026), https://doi.org/10.3133/mcs2026",
        estimateMarker: "Notes beginning \"Estimated.\"",
      },
    },
    landingPageUrl: `https://doi.org/${DOI}`,
    catalogUrl: ITEM_URL,
    doi: DOI,
    releaseDate: RELEASE_DATE,
    retrievedOn: RETRIEVED_ON,
    windowStart: YEARS[0],
    observationCutoff: YEARS.at(-1)!,
    nextScheduledRelease: null,
    updateFrequency: null,
    aggregationBasis: {
      statedAs: "Annual average (as named in each series' statistic, e.g. \"Price, annual average\")",
      note: "Each series' own statistic text says what kind of average it is; trade unit values are customs value divided by quantity.",
      sourceUrl: ITEM_URL,
    },
    license: {
      kind: "cc0-1.0",
      name: "Creative Commons Zero v1.0 Universal (CC0 1.0) public domain dedication",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
      statedAt: ITEM_URL,
      termsUrl: "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
      statedText:
        "This work is marked with the Creative Commons Zero v1.0 Universal (CC0-1.0) public domain dedication; https://creativecommons.org/publicdomain/zero/1.0/.",
    },
    attribution:
      "Source: National Minerals Information Center, 2026, U.S. Geological Survey Mineral Commodity Summaries 2026 Data Release: U.S. Geological Survey data release, https://doi.org/10.5066/P1WKQ63T.",
    changesMade: `SMPT selected ${SPECS.length} price and unit-value rows for 2021–2025, removed thousands separators and stored the values unchanged, flagging those the USGS marks "Estimated." Percentage changes, indexed values and rankings shown with them are SMPT calculations.`,
    thirdPartyNote:
      "Many of these figures are attributed by the USGS to commercial assessors (for example Argus Media, S&P Global Platts, Benchmark Mineral Intelligence, Asian Metal). SMPT republishes only the USGS annual figures in the public-domain data release, not any assessor's data.",
    seriesIds: SPECS.map((s) => s.id),
  };

  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "markets", DATASET_ID);
  mkdirSync(dir, { recursive: true });
  const write = (name: string, value: unknown) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + "\n");
  write("manifest.json", manifest);
  write("series.json", series);
  write("observations.json", { seriesIds: SPECS.map((s) => s.id), observations });
  console.log(`✓ ingest-markets-usgs: ${SPECS.length} annual series, ${YEARS[0]}–${YEARS.at(-1)} → data/markets/${DATASET_ID}/`);
}

main();
