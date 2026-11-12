import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { ExtLink } from "@/components/ui/ext-link";
import { MarketExplorer } from "@/components/markets/market-monitor";
import { buildMonitorSeries, buildReleaseNotices, materialLink } from "@/components/markets/series";
import { getMarketCoverage, getMarketDatasets } from "@/lib/market-data";
import type { MonitorSeries } from "@/components/markets/types";
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

/** Stated once above the directory, so each entry carries only what is specific to its material. */
const COMMON_COVERAGE = "Not in the World Bank Pink Sheet monthly workbook or the IMF Primary Commodity Prices series SMPT uses. ";
const COMMON_TERMS = /,(?: published)? under terms that permit redistribution with attribution\.$/;

function withoutCommonCoverage(text: string): string {
  return text.startsWith(COMMON_COVERAGE) ? text.slice(COMMON_COVERAGE.length) : text;
}

function withoutCommonTerms(text: string): string {
  return text.replace(COMMON_TERMS, ".");
}

/**
 * What exists for a material without a monthly series, read from the annual series themselves so that a customs
 * unit value is never labelled a price.
 */
function availability(gap: { materialId: string; status: CoverageStatus }, annual: MonitorSeries[]): string {
  if (gap.status === "no_open_series_identified") return "No open series";
  if (gap.status === "joint_only") return "Annual price, joint assessment";
  const types = new Set(annual.filter((s) => s.materialId === gap.materialId).map((s) => s.priceType));
  if (types.size === 0) return "Annual series";
  if (types.size === 1 && types.has("trade_unit_value")) return "Annual trade unit value";
  if (!types.has("trade_unit_value")) return "Annual price";
  return "Annual price and trade unit value";
}

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

function SourceFact({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "col-span-2 lg:col-span-1" : undefined}>
      <div className="font-display text-xs leading-[1.125rem] text-faint">{label}</div>
      <div className="mt-0.5 font-display text-sm leading-6 text-foreground">{children}</div>
    </div>
  );
}

function SourceDetail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-display text-xs leading-[1.125rem] text-faint">{term}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
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

        <Section title="Sources and licences">
          <ul className="border-t border-border-strong">
            {datasets.map(({ manifest: m }) => (
              <li key={m.datasetId} className="border-b border-border py-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.8fr)]">
                  <div className="col-span-2 lg:col-span-1">
                    <h3 className="font-display text-base font-semibold text-foreground">{m.publisher}</h3>
                    <p className="mt-0.5 text-sm leading-6 text-muted">{m.title}</p>
                  </div>
                  <SourceFact label="Frequency">{m.frequency === "annual" ? "Annual" : "Monthly"}</SourceFact>
                  <SourceFact label="Released">{formatDate(m.releaseDate)}</SourceFact>
                  <SourceFact label="Licence" wide>
                    <ExtLink href={m.license.url ?? m.license.termsUrl} className="inline">
                      {m.license.name}
                    </ExtLink>
                  </SourceFact>
                </div>
                <details className={`${disclosure} mt-3`}>
                  <DisclosureSummary>
                    Citation, changes and reuse terms<span className="sr-only">: {m.shortName}</span>
                  </DisclosureSummary>
                  <dl className="grid gap-x-10 gap-y-4 border-t border-border px-4 py-4 text-sm leading-6 text-muted md:grid-cols-2">
                    <SourceDetail term="Citation">{m.attribution}</SourceDetail>
                    <SourceDetail term="Changes made">{m.changesMade}</SourceDetail>
                    <SourceDetail term="Reuse terms">
                      {MARKET_REUSE_NOTES[m.datasetId as keyof typeof MARKET_REUSE_NOTES]}{" "}
                      <ExtLink href={m.license.statedAt} className="inline">
                        Licence statement
                      </ExtLink>
                      {m.license.termsUrl !== m.license.url ? (
                        <>
                          {", "}
                          <ExtLink href={m.license.termsUrl} className="inline">
                            publisher’s terms
                          </ExtLink>
                        </>
                      ) : null}
                      .
                    </SourceDetail>
                    <SourceDetail term="Third-party data">{m.thirdPartyNote}</SourceDetail>
                    <SourceDetail term="Source file">
                      {m.updateFrequency ? `${m.updateFrequency.statedAs} ` : ""}
                      {m.nextScheduledRelease ? `${m.nextScheduledRelease.statedAs} ` : ""}
                      Retrieved {formatDate(m.retrievedOn)}.
                      <span className="mt-1 block break-all font-mono text-xs leading-5 text-faint">
                        {m.sourceFile.fileName}
                        <span className="block">SHA-256 {m.sourceFile.sha256}</span>
                      </span>
                    </SourceDetail>
                    <SourceDetail term="Links">
                      <ul className="flex flex-wrap gap-x-6 gap-y-1">
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
                    </SourceDetail>
                  </dl>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-muted">
            SMPT republishes each publisher’s released figures only, without the exchange or vendor data behind them. Every
            dataset is rebuilt from a pinned source file with a verified checksum; the site build never fetches prices.
          </p>
        </Section>

        <Section title="Price coverage">
          <p className="max-w-4xl text-[0.9375rem] leading-7 text-muted">
            {coverage.gaps.length} tracked materials have no monthly series here. The monthly sources are the World Bank Pink
            Sheet workbook and three IMF Primary Commodity Prices series (cobalt, palladium and rare-earth carbonate). A
            monthly series qualifies when it covers one named product and grade and its publisher permits redistribution with
            attribution. SMPT has not reviewed the licence terms of any commercial price assessment or exchange data feed and
            redistributes none.
          </p>
          <ul className="mt-6 gap-x-8 md:columns-2 xl:columns-3">
            {coverage.gaps.map((g) => {
              const mat = materialLink(g.materialId);
              const name = mat.name ?? g.materialId;
              return (
                <li key={g.materialId} className="break-inside-avoid border-t border-border">
                  <details className="group">
                    <summary className="flex min-h-11 cursor-pointer list-none items-baseline gap-3 py-2.5 font-display hover:bg-elevated [&::-webkit-details-marker]:hidden">
                      <span className="text-[0.9375rem] font-semibold text-foreground">{name}</span>
                      <span className="ml-auto text-right text-xs text-faint">{availability(g, annual)}</span>
                      <span aria-hidden="true" className="w-3 text-center text-base leading-none text-faint group-open:hidden">+</span>
                      <span aria-hidden="true" className="hidden w-3 text-center text-base leading-none text-faint group-open:inline">−</span>
                    </summary>
                    <dl className="space-y-3 pb-3 text-sm leading-6 text-muted">
                      <SourceDetail term={g.status === "no_open_series_identified" ? "Coverage" : "Published instead"}>{withoutCommonCoverage(g.monthlyCoverage)}</SourceDetail>
                      <SourceDetail term="Products and grades">{g.gradeDistinctions}</SourceDetail>
                      <SourceDetail term="Monthly series needed">{withoutCommonTerms(g.requirementForInclusion)}</SourceDetail>
                    </dl>
                    {mat.href ? (
                      <p className="pb-4">
                        <Link href={mat.href} className="link-quiet font-display text-sm text-foreground">
                          {name} policy and financing
                        </Link>
                      </p>
                    ) : null}
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
                Materials
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
