import type { MonitorSeries } from "@/components/markets/types";
import { getMaterialBySlug } from "@/lib/data";
import { getMarketDatasets, getObservations } from "@/lib/market-data";
import { valueDigits } from "@/lib/markets";

export function materialLink(slug: string): { name: string | null; href: string | null } {
  const m = getMaterialBySlug(slug);
  return m ? { name: m.nameEn, href: `/materials/${m.slug}` } : { name: null, href: null };
}

/** Plain series records for the client explorer, in dataset order (World Bank, IMF, USGS). */
export function buildMonitorSeries(): MonitorSeries[] {
  return getMarketDatasets().flatMap((d) =>
    d.series.map((s) => {
      const mat = materialLink(s.materialId);
      const obs = getObservations(s.id);
      return {
        id: s.id,
        datasetId: s.datasetId,
        sourceShortName: d.manifest.shortName,
        frequency: s.frequency,
        priceType: s.priceType,
        materialId: s.materialId,
        materialName: mat.name ?? s.materialId,
        materialHref: mat.href,
        relatedMaterialNames: s.relatedMaterialIds.map((id) => materialLink(id).name ?? id),
        label: s.label,
        benchmark: s.benchmark,
        unit: s.unit,
        unitShort: s.unitShort,
        currency: s.currency,
        priceBasis: s.priceBasis,
        aggregation: s.aggregation,
        firstPeriod: s.firstPeriod,
        lastPeriod: s.lastPeriod,
        sourceBreaks: s.sourceBreaks,
        digits: valueDigits(obs),
        obs,
      };
    }),
  );
}

/** One notice per dataset with a scheduled next release. */
export function buildReleaseNotices(): Array<{ shortName: string; date: string; cutoff: string }> {
  return getMarketDatasets().flatMap((d) =>
    d.manifest.nextScheduledRelease
      ? [{ shortName: d.manifest.shortName, date: d.manifest.nextScheduledRelease.date, cutoff: d.manifest.observationCutoff }]
      : [],
  );
}
