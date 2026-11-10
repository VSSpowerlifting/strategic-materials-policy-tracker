/**
 * CSV export for the market monitor. Deterministic (no wall-clock reads), so
 * the route handler can be force-static. The header is the first line, so Excel,
 * pandas, R and database loaders read the file without skipping rows. Each row
 * carries its source's attribution, licence, terms link, SMPT's statement of
 * changes, the note on underlying commercial data and its reuse terms, so a filtered or split
 * extract keeps the attribution its publisher requires. One row per series per
 * period exactly as stored; monthly and annual rows are told apart by
 * `frequency`, and values are never converted between units or currencies.
 */
import { csvCell } from "@/lib/export";
import { getMarketDatasets } from "@/lib/market-data";
import { MARKET_REUSE_NOTES, PRICE_TYPE_LABELS, type MarketDataset } from "@/lib/markets";

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
  "license_url",
  "terms_url",
  "attribution",
  "changes_made",
  "underlying_sources",
  "third_party_note",
  "reuse_note",
] as const;

const LICENSE_SHORT: Record<string, string> = {
  "cc-by-4.0": "CC BY 4.0",
  "cc0-1.0": "CC0 1.0",
  "imf-terms": "IMF copyright and usage terms",
};

export function buildMarketsCsv(datasets: readonly MarketDataset[]): string {
  const oneLine = (t: string | null) => (t === null ? null : t.replace(/\s*[\r\n]+\s*/g, " "));
  const lines = [MARKET_CSV_HEADERS.join(",")];
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
            manifest.license.url,
            manifest.license.termsUrl,
            oneLine(manifest.attribution),
            oneLine(manifest.changesMade),
            oneLine(s.underlyingSources),
            oneLine(manifest.thirdPartyNote),
            MARKET_REUSE_NOTES[manifest.datasetId as keyof typeof MARKET_REUSE_NOTES],
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
