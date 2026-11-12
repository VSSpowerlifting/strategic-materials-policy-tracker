import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { ExtLink } from "@/components/ui/ext-link";
import { MarketExplorer } from "@/components/markets/market-monitor";
import { buildMonitorSeries, buildReleaseNotices, materialLink } from "@/components/markets/series";
import { getMarketCoverage, getMarketDatasets } from "@/lib/market-data";
import { MARKET_REUSE_NOTES, PRICE_TYPE_LABELS, formatPeriod, type CoverageStatus } from "@/lib/markets";
import { formatDate } from "@/lib/format";
import { fi002 } from "@/lib/fi002";

const DESCRIPTION =
  "Source-linked historical prices for critical and strategic materials: World Bank and IMF monthly averages for aluminium, copper, nickel, tin, zinc, lead, platinum, cobalt, palladium and rare-earth carbonate, and USGS annual prices and import unit values for 2021–2025, including rare-earth oxides, lithium, gallium, germanium and tungsten.";

export const metadata: Metadata = {
  title: "Critical Minerals Market Monitor",
  description: DESCRIPTION,
  alternates: { canonical: "/markets" },
};

const STATUS_LABEL: Record<CoverageStatus, string> = {
  annual_only: "Annual series only",
  joint_only: "Priced jointly with another material",
  no_open_series_identified: "No open series identified",
};

/** Square disclosure on the plate; the summary is a full-width, 44px target. */
const disclosure = "group border border-border-strong bg-plate";

function DisclosureSummary({ children }: { children: React.ReactNode }) {
  return (
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 px-4 py-2 font-display text-sm text-foreground hover:bg-elevated [&::-webkit-details-marker]:hidden">
      <span>{children}</span>
      <span aria-hidden="true" className="ml-auto text-base leading-none text-faint group-open:hidden">+</span>
      <span aria-hidden="true" className="ml-auto hidden text-base leading-none text-faint group-open:inline">−</span>
    </summary>
  );
}

const DEFINITIONS: { term: string; text: string }[] = [
  {
    term: "Exchange benchmark",
    text: "An average of a named exchange price, such as the LME cash settlement or COMEX, as averaged by the World Bank, the IMF or the USGS.",
  },
  {
    term: "Price assessment",
    text: "A price-reporting agency’s or dealer’s assessment for a stated product and grade, republished by the IMF or the USGS with its source named. SMPT has not seen the underlying assessment data.",
  },
  {
    term: "Trade unit value",
    text: "The declared value of U.S. imports divided by their quantity, as calculated by the USGS from Census Bureau trade data. It moves with product mix and origin as well as price, so it is never labelled a price.",
  },
];

const CALCULATIONS: { term: string; text: string }[] = [
  {
    term: "Indexed change",
    text: "Each series divided by its own value in a common base period and multiplied by 100. The base is the latest first period among the selected series, so every included line starts at 100. A series with no value in that period, or whose source changes after it, is left out and named.",
  },
  {
    term: "Change over a horizon",
    text: "A period compared with the period exactly that many months or years earlier. If either value is missing, or the source states a change of underlying data between them, no change is shown.",
  },
  {
    term: "Estimates and source changes",
    text: "USGS 2025 values are estimates made early in 2026; they are marked “e”, drawn hollow and carried into any change or index that uses them. Where the USGS notes a change of price source within a series, the chart marks it and does not join the line across it.",
  },
  {
    term: "Logarithmic axis",
    text: "The same published or indexed values on an axis where equal distances are equal percentage changes. It is offered only when every plotted value is positive.",
  },
];

export default function MarketsPage() {
  const datasets = getMarketDatasets();
  const coverage = getMarketCoverage();

  const series = buildMonitorSeries();

  const monthly = series.filter((s) => s.frequency === "monthly");
  const annual = series.filter((s) => s.frequency === "annual");
  const materialCount = new Set(series.map((s) => s.materialId)).size;
  const releaseNotices = buildReleaseNotices();

  return (
    <div className="pb-24">
      <Container width="wide" className="pt-12">
        <PageHeading
          title="Critical Minerals Market Monitor"
          lead="Published price benchmarks for critical and strategic materials from the World Bank, the IMF and the USGS, as monthly averages and annual values."
        />
      </Container>

      <Container width="wide" className="mt-10">
        <MarketExplorer series={series} releaseNotices={releaseNotices} />
      </Container>

      <Container width="wide" className="mt-16 space-y-16">
        <Section id="mm-source-coverage" title="Data coverage">
          <dl className="fact-grid">
            <div>
              <dt>Series</dt>
              <dd className="tnum">
                {monthly.length} monthly and {annual.length} annual
                <span className="block text-xs leading-5 text-faint">{materialCount} materials</span>
              </dd>
            </div>
            {datasets.map((d) => (
              <div key={d.manifest.datasetId}>
                <dt>{d.manifest.shortName}</dt>
                <dd className="tnum">
                  Through {formatPeriod(d.manifest.observationCutoff, true)}
                  <span className="block text-xs leading-5 text-faint">
                    Released {formatDate(d.manifest.releaseDate)}
                  </span>
                  <span className="block text-xs leading-5 text-faint">
                    {d.series.length} series, {d.manifest.license.name.replace(/ public domain dedication$/, "")}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 max-w-4xl text-[0.9375rem] leading-7 text-muted">
            Figures are period averages or unit values in US dollars, as each source publishes them; the USGS labels its
            lithium carbonate price “annual average-real” without stating a deflator or base year. Percentage changes,
            indexed values and rankings are SMPT calculations, with no interpolation or unit conversion. Prices sit outside
            the policy record, and a shared date does not show that a measure moved a price.
          </p>
        </Section>

        <Section title="Method and definitions">
          <dl className="grid gap-x-10 gap-y-6 md:grid-cols-3">
            {DEFINITIONS.map((d) => (
              <div key={d.term} className="border-t border-border pt-3">
                <dt className="font-display text-sm font-semibold text-foreground">{d.term}</dt>
                <dd className="mt-1.5 text-sm leading-6 text-muted">{d.text}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 space-y-3">
            <details className={disclosure}>
              <DisclosureSummary>Calculations: index, changes, estimates and the logarithmic axis</DisclosureSummary>
              <dl className="grid gap-x-10 gap-y-5 border-t border-border px-4 py-4 md:grid-cols-2">
                {CALCULATIONS.map((d) => (
                  <div key={d.term}>
                    <dt className="font-display text-sm font-semibold text-foreground">{d.term}</dt>
                    <dd className="mt-1.5 text-sm leading-6 text-muted">{d.text}</dd>
                  </div>
                ))}
              </dl>
            </details>

            {datasets.map((d) => (
              <details key={d.manifest.datasetId} className={disclosure}>
                <DisclosureSummary>
                  {d.manifest.shortName}: specification of {d.series.length} series
                </DisclosureSummary>
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full min-w-[56rem] text-left text-sm">
                    <caption className="sr-only">Specification of each {d.manifest.shortName} series</caption>
                    <thead className="bg-elevated font-display text-xs text-faint">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-medium">Series</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Source specification</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Type and basis</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Unit</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.series.map((s) => (
                        <tr key={s.id} className="border-t border-border align-top">
                          <th scope="row" className="px-4 py-3 font-medium text-foreground">
                            {s.benchmark}
                            {s.underlyingSources ? (
                              <span className="mt-1 block text-xs font-normal text-faint">Source: {s.underlyingSources}</span>
                            ) : null}
                          </th>
                          <td className="px-4 py-3 leading-6 text-muted">
                            {s.specification}
                            {s.sourceBreaks.map((b) => (
                              <span key={b.period} className="mt-1 block text-xs text-faint">
                                From {formatPeriod(b.period)}: {b.statedAs}
                              </span>
                            ))}
                          </td>
                          <td className="px-4 py-3 leading-6 text-muted">
                            {PRICE_TYPE_LABELS[s.priceType]}
                            <span className="block text-xs text-faint">{s.priceBasis}</span>
                            {s.deliveryBasis ? <span className="block text-xs text-faint">{s.deliveryBasis}</span> : null}
                          </td>
                          <td className="px-4 py-3 leading-6 text-muted">
                            {s.unit}
                            <span className="block text-xs text-faint">{s.unitNote}</span>
                          </td>
                          <td className="tnum px-4 py-3 leading-6 whitespace-nowrap text-muted">
                            {formatPeriod(s.firstPeriod)} – {formatPeriod(s.lastPeriod)}
                            <span className="block text-xs text-faint">
                              {s.observationCount} {s.frequency === "annual" ? "years" : "months"}
                              {s.estimatedCount ? `, ${s.estimatedCount} estimated` : ""}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border px-4 py-3">
                  <h3 className="font-display text-xs text-faint">Limitations</h3>
                  <ul className="mt-2 max-w-4xl list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted">
                    {Array.from(new Set(d.series.flatMap((s) => s.limitations))).map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </Section>

        <Section title="Sources, licences and attribution">
          <div className="grid gap-x-10 gap-y-10 lg:grid-cols-3">
            {datasets.map(({ manifest: m }) => (
              <div key={m.datasetId} className="space-y-3 border-t border-border pt-4 text-sm leading-6 text-muted">
                <h3 className="font-display text-base font-semibold text-foreground">{m.shortName}</h3>
                <p className="text-foreground">{m.attribution}</p>
                <p>
                  Licence:{" "}
                  {m.license.url ? (
                    <ExtLink href={m.license.url} className="inline">
                      {m.license.name}
                    </ExtLink>
                  ) : (
                    m.license.name
                  )}
                  , as stated at{" "}
                  <ExtLink href={m.license.statedAt} className="inline">
                    the publisher’s data page
                  </ExtLink>
                  {m.license.termsUrl !== m.license.url ? (
                    <>
                      {" "}
                      (<ExtLink href={m.license.termsUrl}>terms</ExtLink>)
                    </>
                  ) : null}
                  .
                </p>
                <p>
                  <span className="text-foreground">Changes made.</span> {m.changesMade}
                </p>
                <p>{m.thirdPartyNote}</p>
                <ul className="space-y-1">
                  <li>
                    <ExtLink href={m.landingPageUrl}>Publisher page</ExtLink>
                  </li>
                  <li>
                    <ExtLink href={m.catalogUrl}>Data catalogue entry</ExtLink>
                  </li>
                  {m.doi ? (
                    <li>
                      <ExtLink href={`https://doi.org/${m.doi}`}>doi:{m.doi}</ExtLink>
                    </li>
                  ) : null}
                </ul>
                <details className={disclosure}>
                  <DisclosureSummary>Reuse terms, release schedule and source file</DisclosureSummary>
                  <div className="space-y-3 border-t border-border px-4 py-3">
                    <p>
                      <span className="text-foreground">Reuse.</span>{" "}
                      {MARKET_REUSE_NOTES[m.datasetId as keyof typeof MARKET_REUSE_NOTES]}
                    </p>
                    <p className="text-xs leading-5 text-faint">
                      {m.updateFrequency ? `${m.updateFrequency.statedAs} ` : ""}
                      {m.nextScheduledRelease ? `${m.nextScheduledRelease.statedAs} ` : ""}
                      Retrieved {formatDate(m.retrievedOn)}.
                    </p>
                    <p className="break-all font-mono text-xs leading-5 text-faint">
                      {m.sourceFile.fileName}
                      <span className="block">SHA-256 {m.sourceFile.sha256}</span>
                    </p>
                  </div>
                </details>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-sm leading-6 text-muted">
            Each dataset is regenerated only by its ingest script from a pinned source file whose checksum is verified; the
            site build never fetches prices.
          </p>
        </Section>

        <Section
          title="Coverage gaps"
          description="Tracked materials without an open monthly series, and what one would need to show."
        >
          <p className="max-w-4xl text-sm leading-6 text-muted">{coverage.note}</p>
          <ul className="mt-6 grid gap-x-10 border-t border-border md:grid-cols-2">
            {coverage.gaps.map((g) => {
              const mat = materialLink(g.materialId);
              return (
                <li key={g.materialId} className="border-b border-border py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-display font-semibold text-foreground">
                      {mat.href ? (
                        <Link href={mat.href} className="link-quiet">
                          {mat.name}
                        </Link>
                      ) : (
                        (mat.name ?? g.materialId)
                      )}
                    </h3>
                    <span className="font-display text-xs text-faint">{STATUS_LABEL[g.status]}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{g.monthlyCoverage}</p>
                  <details className="mt-1 text-sm leading-6 text-muted">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center font-display text-sm text-foreground">
                      <span className="link-quiet">Grades and inclusion test</span>
                    </summary>
                    <p>{g.gradeDistinctions}</p>
                    <p className="mt-2">
                      <span className="text-foreground">Needed for a monthly series.</span> {g.requirementForInclusion}
                    </p>
                  </details>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Related">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 font-display text-sm">
            <li>
              <Link href="/materials" className="link-quiet">
                Materials and their policy records
              </Link>
            </li>
            <li>
              <Link href={fi002.path} className="link-quiet">
                {fi002.title}
              </Link>
            </li>
            <li>
              <a href="/api/export/markets.csv" className="link-quiet" download>
                All market series (CSV)
              </a>
            </li>
          </ul>
        </Section>
      </Container>
    </div>
  );
}
