/**
 * Read-only loaders for the market monitor. The files in data/markets/ are
 * written by `npm run ingest:markets` from one pinned World Bank workbook and
 * checked by `npm run validate`; pages read them through these functions only.
 */
import manifestJson from "@/data/markets/manifest.json";
import seriesJson from "@/data/markets/series.json";
import observationsJson from "@/data/markets/observations.json";
import coverageJson from "@/data/markets/coverage-gaps.json";
import type { MarketCoverageFile, MarketManifest, MarketSeries, Observation, ObservationsFile } from "@/lib/markets";

const manifest = manifestJson as unknown as MarketManifest;
const series = seriesJson as unknown as MarketSeries[];
const observations = observationsJson as unknown as ObservationsFile;
const coverage = coverageJson as unknown as MarketCoverageFile;

export function getMarketManifest(): MarketManifest {
  return manifest;
}

export function getMarketSeries(): MarketSeries[] {
  return series;
}

export function getMarketSeriesById(id: string): MarketSeries | undefined {
  return series.find((s) => s.id === id);
}

export function getObservations(id: string): Observation[] {
  return observations.observations[id] ?? [];
}

export function getMarketCoverage(): MarketCoverageFile {
  return coverage;
}

/** Series the monitor covers for a material (by `data/seed/materials.json` id). */
export function getMarketSeriesForMaterial(materialId: string): MarketSeries[] {
  return series.filter((s) => s.materialId === materialId);
}
