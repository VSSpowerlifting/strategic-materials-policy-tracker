/**
 * CSV export for the market monitor. Deterministic (no wall-clock reads), so
 * the route handler can be force-static. The file carries the World Bank's
 * CC BY 4.0 attribution and SMPT's statement of changes in a leading comment
 * block, then one row per series per month exactly as stored.
 */
import { getMarketManifest, getMarketSeries, getObservations } from "@/lib/market-data";
import type { MarketManifest, MarketSeries, Observation } from "@/lib/markets";

// Same escaping rules as lib/export.ts: quote on delimiters, and defuse cells a
// spreadsheet would read as a formula (plain signed decimals stay numeric).
const FORMULA_PREFIX = /^[\s\u0000-\u001f\u007f-\u009f]*[=+\-@＝＋－＠]/u;
const PLAIN_DECIMAL = /^[+-]?(?:\d+)(?:\.\d+)?$/;

export function csvCell(v: string | number | null | undefined): string {
  const raw = v == null ? "" : String(v);
  const risk = /^[\t\r\n]/.test(raw) || (FORMULA_PREFIX.test(raw) && !PLAIN_DECIMAL.test(raw));
  const s = risk ? "\t" + raw : raw;
  return risk || /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const MARKET_CSV_HEADERS = [
  "series_id",
  "material_id",
  "benchmark",
  "period",
  "value",
  "currency",
  "unit",
  "aggregation",
  "price_basis",
  "source",
  "source_release_date",
  "license",
] as const;

export function buildMarketsCsv(
  manifest: MarketManifest,
  series: readonly MarketSeries[],
  observationsFor: (id: string) => readonly Observation[],
): string {
  const preamble = [
    `# ${manifest.attribution}`,
    `# Licence: ${manifest.license.name} ${manifest.license.url}`,
    `# Changes: ${manifest.changesMade}`,
    `# ${manifest.thirdPartyNote}`,
    `# Market context only: not part of SMPT's source-linked policy record, not investment advice and not a forecast.`,
  ];
  const lines = [...preamble.map((l) => l.replace(/[\r\n]+/g, " ")), MARKET_CSV_HEADERS.join(",")];
  for (const s of series) {
    for (const o of observationsFor(s.id)) {
      lines.push(
        [
          s.id,
          s.materialId,
          s.benchmark,
          o.period,
          o.value,
          s.currency,
          s.unit,
          s.aggregation,
          s.priceBasis,
          manifest.title,
          manifest.releaseDate,
          "CC BY 4.0",
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return lines.join("\r\n") + "\r\n";
}

export function marketsCsv(): string {
  return buildMarketsCsv(getMarketManifest(), getMarketSeries(), getObservations);
}
