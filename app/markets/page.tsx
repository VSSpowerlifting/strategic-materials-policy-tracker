import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { ExtLink } from "@/components/ui/ext-link";
import { MarketMonitor, type MonitorGap } from "@/components/markets/market-monitor";
import type { MonitorSeries } from "@/components/markets/types";
import { getMaterialBySlug } from "@/lib/data";
import { getMarketCoverage, getMarketManifest, getMarketSeries, getObservations } from "@/lib/market-data";
import { formatPeriod } from "@/lib/markets";
import { formatDate } from "@/lib/format";
import { fi002 } from "@/lib/fi002";

const DESCRIPTION =
  "Monthly benchmark averages for aluminium, copper and nickel from the World Bank Pink Sheet, with indexed change, month-on-month changes and coverage gaps for other tracked materials. Market context, not investment advice or a forecast.";

export const metadata: Metadata = {
  title: "Critical Minerals Market Monitor",
  description: DESCRIPTION,
  alternates: { canonical: "/markets" },
};

function materialLink(slug: string): { name: string | null; href: string | null } {
  const m = getMaterialBySlug(slug);
  return m ? { name: m.nameEn, href: `/materials/${m.slug}` } : { name: null, href: null };
}

export default function MarketsPage() {
  const manifest = getMarketManifest();
  const coverage = getMarketCoverage();
  const raw = getMarketSeries();

  const series: MonitorSeries[] = raw.map((s) => {
    const mat = materialLink(s.materialId);
    return {
      id: s.id,
      materialId: s.materialId,
      materialName: mat.name ?? s.label,
      materialHref: mat.href,
      label: s.label,
      benchmark: s.benchmark,
      unit: s.unit,
      currency: s.currency,
      priceBasis: s.priceBasis,
      aggregation: s.aggregation,
      firstPeriod: s.firstPeriod,
      lastPeriod: s.lastPeriod,
      obs: getObservations(s.id),
    };
  });

  const gaps: MonitorGap[] = coverage.gaps.map((g) => {
    const mat = materialLink(g.materialId);
    return {
      materialId: g.materialId,
      materialName: mat.name ?? g.materialId,
      materialHref: mat.href,
      worldBankCoverage: g.worldBankCoverage,
      gradeDistinctions: g.gradeDistinctions,
      requirementForInclusion: g.requirementForInclusion,
    };
  });

  const cutoff = manifest.observationCutoff;
  const facts: { term: string; value: React.ReactNode }[] = [
    { term: "Last available observation", value: formatPeriod(cutoff, true) },
    { term: "Series published", value: `${series.length} monthly benchmark averages` },
    {
      term: "Source",
      value: (
        <ExtLink href={manifest.landingPageUrl}>World Bank Pink Sheet</ExtLink>
      ),
    },
    {
      term: "Source release",
      value: `${formatDate(manifest.releaseDate)} · retrieved ${formatDate(manifest.retrievedOn)}`,
    },
    { term: "Publisher’s update schedule", value: manifest.updateFrequency.statedAs },
    { term: "Next scheduled release", value: formatDate(manifest.nextScheduledRelease.date) },
  ];

  return (
    <div className="pb-24">
      <Container width="wide" className="pt-12 sm:pt-16">
        <PageHeading
          eyebrow="Market context"
          title="Critical Minerals Market Monitor"
          lead={
            <>
              Monthly benchmark averages for {series.map((s) => s.label.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1")},
              published by the World Bank and frozen at the {formatPeriod(cutoff, true)} observation. Prices sit outside the
              policy record: they are not linked to events, commitments or controls, and a shared date does not show cause.
            </>
          }
        />

        <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.term} className="bg-card px-4 py-3">
              <dt className="font-display text-xs text-faint">{f.term}</dt>
              <dd className="tnum mt-1 text-sm leading-6 text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 max-w-4xl text-sm leading-6 text-muted">
          Each figure is a monthly average in nominal US dollars, not a price on any single day and not a live quote. Nothing
          here is investment advice or a forecast. Percentage changes, indexed values and rankings are SMPT calculations from
          the published figures; no month is interpolated.
        </p>
      </Container>

      <Container width="wide" className="mt-12">
        <MarketMonitor
          series={series}
          gaps={gaps}
          cutoff={cutoff}
          nextReleaseDate={manifest.nextScheduledRelease.date}
        />
      </Container>

      <Container width="wide" className="mt-16 space-y-14">
        <Section
          title="Method and definitions"
          description="How the figures are read, calculated and limited."
        >
          <dl className="grid gap-6 md:grid-cols-3">
            <div>
              <dt className="font-display text-sm font-semibold text-foreground">Monthly benchmark average</dt>
              <dd className="mt-1.5 text-sm leading-6 text-muted">
                The World Bank’s published average of a named exchange benchmark over a calendar month (the Pink Sheet heads
                these columns “{manifest.aggregationBasis.statedAs}”). SMPT stores the published figure unchanged.
              </dd>
            </div>
            <div>
              <dt className="font-display text-sm font-semibold text-foreground">Last available observation</dt>
              <dd className="mt-1.5 text-sm leading-6 text-muted">
                The latest month with a published value in the frozen dataset ({formatPeriod(cutoff, true)}). It is the
                observation period, not the date this site was built. After the publisher’s next scheduled release the page
                says the figures may be superseded.
              </dd>
            </div>
            <div>
              <dt className="font-display text-sm font-semibold text-foreground">Indexed change</dt>
              <dd className="mt-1.5 text-sm leading-6 text-muted">
                Each series divided by its own value in a common base month and multiplied by 100. The base is the first month
                of the selected range in which every shown series has a value; a series without one is left out and named.
                Change over N months compares a month with the month exactly N earlier; if either is missing, no change is
                shown.
              </dd>
            </div>
          </dl>

          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Specification of each published series</caption>
              <thead className="bg-card font-display text-xs text-faint">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Series</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">World Bank specification</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Price basis</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Unit</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Window</th>
                </tr>
              </thead>
              <tbody>
                {raw.map((s) => (
                  <tr key={s.id} className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-3 font-medium text-foreground">
                      {s.benchmark}
                    </th>
                    <td className="px-4 py-3 leading-6 text-muted">{s.specification}</td>
                    <td className="px-4 py-3 leading-6 text-muted">{s.priceBasis}</td>
                    <td className="px-4 py-3 leading-6 text-muted">
                      {s.unit}
                      <span className="block text-xs text-faint">{s.unitNote}</span>
                    </td>
                    <td className="tnum px-4 py-3 leading-6 whitespace-nowrap text-muted">
                      {formatPeriod(s.firstPeriod)} – {formatPeriod(s.lastPeriod)}
                      <span className="block text-xs text-faint">{s.observationCount} months</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 font-display text-base font-semibold text-foreground">Limitations</h3>
          <ul className="mt-2 max-w-4xl list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted">
            {Array.from(new Set(raw.flatMap((s) => s.limitations))).map((l) => (
              <li key={l}>{l}</li>
            ))}
            <li>{raw[0]?.missingValueHandling}</li>
          </ul>
        </Section>

        <Section title="Source, licence and attribution">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3 text-sm leading-6 text-muted">
              <p className="text-foreground">{manifest.attribution}</p>
              <p>
                Licence: <ExtLink href={manifest.license.url}>{manifest.license.name}</ExtLink>, as stated on the{" "}
                <ExtLink href={manifest.license.statedAt}>World Bank data catalogue entry</ExtLink>. See also the{" "}
                <ExtLink href={manifest.license.termsUrl}>World Bank public licence terms</ExtLink>.
              </p>
              <p>
                <span className="text-foreground">Changes made.</span> {manifest.changesMade}
              </p>
              <p>{manifest.thirdPartyNote}</p>
            </div>
            <div className="space-y-3 text-sm leading-6 text-muted">
              <ul className="space-y-1.5">
                <li>
                  <ExtLink href={manifest.landingPageUrl}>World Bank Commodity Markets</ExtLink>
                </li>
                <li>
                  <ExtLink href={manifest.catalogUrl}>Data catalogue: Commodity Prices — History and Projections</ExtLink>
                </li>
                <li>
                  <ExtLink href={manifest.workbook.url}>{manifest.workbook.fileName}</ExtLink>{" "}
                  <span className="text-faint">
                    (sheet “{manifest.workbook.sheet}”, {manifest.workbook.updatedText.toLowerCase()})
                  </span>
                </li>
                <li>
                  <ExtLink href={manifest.pinkSheetPdfUrl}>Pink Sheet, November 2026 (PDF)</ExtLink>
                </li>
              </ul>
              <p className="break-all font-mono text-xs text-faint">
                Workbook SHA-256 {manifest.workbook.sha256}
              </p>
              <p>
                Dataset <span className="font-mono text-xs">{manifest.datasetId}</span> is regenerated only by the
                repository’s ingest script from a pinned workbook; the build never fetches prices.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Not yet covered">
          <p className="max-w-4xl text-sm leading-6 text-muted">
            The World Bank Monthly Prices sheet carries no lithium, cobalt, graphite, tungsten, antimony or rare-earth
            series. Commercial price assessments for those products are listed as possible future additions only: SMPT has
            not reviewed the licence terms of any commercial assessment or exchange data feed, and none is shown or
            redistributed here. Each material’s card above states what an open series would need to show.
          </p>
        </Section>

        <Section title="Related">
          <ul className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {series.map((s) =>
              s.materialHref ? (
                <li key={s.id}>
                  <Link href={s.materialHref} className="text-accent underline-offset-2 hover:underline">
                    {s.materialName} policy record
                  </Link>
                </li>
              ) : null,
            )}
            <li>
              <Link href={fi002.path} className="text-accent underline-offset-2 hover:underline">
                {fi002.title}
              </Link>
            </li>
          </ul>
        </Section>
      </Container>
    </div>
  );
}
