/**
 * CSV export for the market monitor. Deterministic (no wall-clock reads), so
 * the route handler can be force-static. The file opens with a comment block
 * carrying each source's attribution, licence or terms, and SMPT's statement
 * of changes, then one row per series per period exactly as stored. Monthly
 * and annual rows share the file but are told apart by `frequency`; values are
 * never converted between units or currencies.
 */
import { csvCell } from "@/lib/export";
import { getMarketDatasets } from "@/lib/market-data";
import { PRICE_TYPE_LABELS, type MarketDataset } from "@/lib/markets";

// Same escaping as the tracker export: quote on delimiters and defuse cells a
// spreadsheet would read as a formula (plain signed decimals stay numeric).
export { csvCell };

export const MARKET_CSV_HEADERS = [
  "series_id",
  "dataset_id",
  "material_id",
  "related_material_ids",
  "benchmark",
  "price_type",
  "frequency",
  "period",
  "value",
  "estimated",
  "currency",
  "unit",
  "aggregation",
  "price_basis",
  "delivery_basis",
  "source",
  "source_release_date",
  "license",
] as const;

const LICENSE_SHORT: Record<string, string> = {
  "cc-by-4.0": "CC BY 4.0",
  "cc0-1.0": "CC0 1.0",
  "imf-terms": "IMF copyright and usage terms",
};

export function buildMarketsCsv(datasets: readonly MarketDataset[]): string {
  const preamble: string[] = [
    "# Market context only: not part of SMPT's source-linked policy record, not investment advice and not a forecast.",
    "# Rows with estimated=true are values the source marks as estimates. Trade unit values are not market prices.",
  ];
  for (const { manifest } of datasets) {
    preamble.push(
      `# [${manifest.datasetId}] ${manifest.attribution}`,
      `# [${manifest.datasetId}] Licence: ${manifest.license.name}${manifest.license.url ? ` ${manifest.license.url}` : ""} (terms: ${manifest.license.termsUrl})`,
      `# [${manifest.datasetId}] Changes: ${manifest.changesMade}`,
      `# [${manifest.datasetId}] ${manifest.thirdPartyNote}`,
    );
  }
  const lines = [...preamble.map((l) => l.replace(/[\r\n]+/g, " ")), MARKET_CSV_HEADERS.join(",")];
  for (const { manifest, series, observations } of datasets) {
    for (const s of series) {
      for (const o of observations.observations[s.id] ?? []) {
        lines.push(
          [
            s.id,
            s.datasetId,
            s.materialId,
            s.relatedMaterialIds.join(";"),
            s.benchmark,
            PRICE_TYPE_LABELS[s.priceType],
            s.frequency,
            o.period,
            o.value,
            o.estimated ? "true" : "false",
            s.currency,
            s.unit,
            s.aggregation,
            s.priceBasis,
            s.deliveryBasis,
            manifest.title,
            manifest.releaseDate,
            LICENSE_SHORT[manifest.license.kind] ?? manifest.license.name,
          ]
            .map(csvCell)
            .join(","),
        );
      }
    }
  }
  return lines.join("\r\n") + "\r\n";
}

export function marketsCsv(): string {
  return buildMarketsCsv(getMarketDatasets());
}
