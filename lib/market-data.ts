/**
 * Read-only loaders for the market monitor. Each folder in data/markets/ is
 * one pinned source release, written by its own deterministic ingest
 * (`npm run ingest:markets`, `ingest:markets:imf`, `ingest:markets:usgs`) and
 * checked by `npm run validate`. Pages read the data through these functions only.
 */
import wbManifest from "@/data/markets/wb-pink-sheet/manifest.json";
import wbSeries from "@/data/markets/wb-pink-sheet/series.json";
import wbObservations from "@/data/markets/wb-pink-sheet/observations.json";
import imfManifest from "@/data/markets/imf-pcps/manifest.json";
import imfSeries from "@/data/markets/imf-pcps/series.json";
import imfObservations from "@/data/markets/imf-pcps/observations.json";
import usgsManifest from "@/data/markets/usgs-mcs-2026/manifest.json";
import usgsSeries from "@/data/markets/usgs-mcs-2026/series.json";
import usgsObservations from "@/data/markets/usgs-mcs-2026/observations.json";
import coverageJson from "@/data/markets/coverage-gaps.json";
import type {
  Frequency,
  MarketCoverageFile,
  MarketDataset,
  MarketManifest,
  MarketSeries,
  Observation,
  ObservationsFile,
} from "@/lib/markets";

function dataset(manifest: unknown, series: unknown, observations: unknown): MarketDataset {
  return {
    manifest: manifest as MarketManifest,
    series: series as MarketSeries[],
    observations: observations as ObservationsFile,
  };
}

/** Monthly sources first (World Bank, then IMF), then the annual USGS release. */
const datasets: MarketDataset[] = [
  dataset(wbManifest, wbSeries, wbObservations),
  dataset(imfManifest, imfSeries, imfObservations),
  dataset(usgsManifest, usgsSeries, usgsObservations),
];
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
