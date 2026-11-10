import Link from "next/link";
import { getMarketDataset, getMarketSeriesForMaterial } from "@/lib/market-data";
import { PRICE_TYPE_LABELS, formatPeriod, type MarketSeries } from "@/lib/markets";

/** Explorer link that opens on one series, at its own frequency. */
export function benchmarkHref(s: Pick<MarketSeries, "id" | "frequency">): string {
  return `/markets?${s.frequency === "annual" ? "freq=annual&" : ""}series=${encodeURIComponent(s.id)}`;
}

/**
 * Links from a material page to the price series that cover it. The series stay in the separate market-data
 * layer: the block names each benchmark and its publisher and links to the explorer, and it touches nothing in
 * the policy dossier above it.
 */
export function MaterialBenchmarks({ materialId }: { materialId: string }) {
  const series = getMarketSeriesForMaterial(materialId);
  if (series.length === 0) return null;
  return (
    <section id="price-benchmarks" aria-labelledby="price-benchmarks-heading" className="scroll-mt-24">
      <h2 id="price-benchmarks-heading" className="border-b border-border pb-2 font-display text-xl font-semibold">
        Price benchmarks
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
        Price series that cover this material, as their publishers release them, from SMPT’s separate{" "}
        <Link href="/markets" className="text-accent underline-offset-2 hover:underline">
          market-data layer
        </Link>
        . They are not linked to the records above, and a shared date does not show that a measure moved a price.
      </p>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {series.map((s) => {
          const publisher = getMarketDataset(s.datasetId)?.manifest.shortName ?? s.datasetId;
          return (
            <li key={s.id} className="rounded-lg border border-border bg-card p-4">
              <Link href={benchmarkHref(s)} className="font-display font-semibold text-foreground hover:text-accent">
                {s.label}
              </Link>
              <p className="mt-1 text-sm leading-6 text-muted">
                {PRICE_TYPE_LABELS[s.priceType]} · {s.frequency === "annual" ? "Annual" : "Monthly"},{" "}
                {formatPeriod(s.firstPeriod)}–{formatPeriod(s.lastPeriod)} · {s.unitShort} · {publisher}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
