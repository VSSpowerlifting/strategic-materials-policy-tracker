/**
 * Read-only loaders for the market monitor. Each folder in data/markets/ is
 * one pinned source release, written by its own deterministic ingest
 * (`npm run ingest:markets`, `ingest:markets:imf`, `ingest:markets:usgs`) and
 * checked by `npm run validate`. Pages read the data through these functions only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import wbManifest from "@/data/markets/wb-pink-sheet/manifest.json";
import wbSeries from "@/data/markets/wb-pink-sheet/series.json";
import imfManifest from "@/data/markets/imf-pcps/manifest.json";
import imfSeries from "@/data/markets/imf-pcps/series.json";
import usgsManifest from "@/data/markets/usgs-mcs-2026/manifest.json";
import usgsSeries from "@/data/markets/usgs-mcs-2026/series.json";
import coverageJson from "@/data/markets/coverage-gaps.json";
import { MARKET_DATASET_IDS } from "@/lib/markets";
import type {
  Frequency,
  MarketCoverageFile,
  MarketDataset,
  MarketManifest,
  MarketSeries,
  Observation,
  ObservationsFile,
} from "@/lib/markets";

function dataset(manifest: MarketManifest, series: unknown): MarketDataset {
  // Read the pinned observations as text. Turbopack JSON imports rounded some
  // IMF observations differently from Node's JSON.parse in production builds.
  const path = join(process.cwd(), "data", "markets", manifest.datasetId, "observations.json");
  return {
    manifest,
    series: series as MarketSeries[],
    observations: JSON.parse(readFileSync(path, "utf8")) as ObservationsFile,
  };
}

/** Monthly sources first (World Bank, then IMF), then the annual USGS release. */
const datasets: MarketDataset[] = [
  dataset(wbManifest as MarketManifest, wbSeries),
  dataset(imfManifest as MarketManifest, imfSeries),
  dataset(usgsManifest as MarketManifest, usgsSeries),
];
if (datasets.map((d) => d.manifest.datasetId).join() !== MARKET_DATASET_IDS.join()) {
  throw new Error(`lib/market-data.ts imports ${datasets.map((d) => d.manifest.datasetId).join(", ")}, but MARKET_DATASET_IDS lists ${MARKET_DATASET_IDS.join(", ")}`);
}
const coverage = coverageJson as unknown as MarketCoverageFile;
const allSeries = datasets.flatMap((d) => d.series);
const seriesById = new Map(allSeries.map((s) => [s.id, s]));
const obsById = new Map<string, Observation[]>(
  datasets.flatMap((d) => Object.entries(d.observations.observations)),
);

export function getMarketDatasets(): MarketDataset[] {
  return datasets;
}

export function getMarketDataset(datasetId: string): MarketDataset | undefined {
  return datasets.find((d) => d.manifest.datasetId === datasetId);
}

export function getMarketSeries(frequency?: Frequency): MarketSeries[] {
  return frequency ? allSeries.filter((s) => s.frequency === frequency) : allSeries;
}

export function getMarketSeriesById(id: string): MarketSeries | undefined {
  return seriesById.get(id);
}

export function getObservations(id: string): Observation[] {
  return obsById.get(id) ?? [];
}

export function getMarketCoverage(): MarketCoverageFile {
  return coverage;
}

/** Series the monitor covers for a material (by `data/seed/materials.json` id), including joint benchmarks. */
export function getMarketSeriesForMaterial(materialId: string): MarketSeries[] {
  return allSeries.filter((s) => s.materialId === materialId || s.relatedMaterialIds.includes(materialId));
}
