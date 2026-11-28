import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { controlBriefCases, controlBriefHref } from "@/lib/control-brief-cases";
import {
  briefQuery,
  buildControlBrief,
  briefUse,
  comparisonMethod,
  changeSummary,
  standingLabel,
  statusDates,
  type ControlBrief,
} from "@/lib/control-briefs";
import { formatDate } from "@/lib/format";
import type { Standing } from "@/lib/controls-standing";

type Props = {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return controlBriefCases.map((item) => ({ caseId: item.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { caseId } = await params;
  const item = controlBriefCases.find((candidate) => candidate.slug === caseId);
  if (!item) notFound();
  return {
    title: `${item.title} | Controls change briefs`,
    description: "Compare two dated readings of the recorded clauses and download a source-linked change brief.",
    alternates: { canonical: controlBriefHref(item) },
  };
}

function SourceLink({ brief, sourceId }: { brief: ControlBrief; sourceId: string }) {
  const source = brief.sources.get(sourceId)!;
  return <a className="font-medium text-accent underline underline-offset-2" href={source.url}>{source.documentNumber ?? source.publisher}</a>;
}

function StandingCell({ brief, value, cited = false }: { brief: ControlBrief; value: Standing; cited?: boolean }) {
  const entry = value.entryId ? brief.entries.get(value.entryId) : undefined;
  return (
    <div className="min-w-0 space-y-1">
      <p className="font-semibold text-foreground">
        {cited ? <span className="sr-only">On {formatDate(value.onDate)}. </span> : null}
        {standingLabel(value)}
      </p>
      {entry ? <p className="tnum text-sm text-muted">{statusDates(entry)}</p> : null}
      {cited && value.sourceId ? <p className="text-sm"><SourceLink brief={brief} sourceId={value.sourceId} /></p> : null}
    </div>
  );
}

function Comparison({ brief }: { brief: ControlBrief }) {
  const { item, dates, summary, rows, timeline, sources } = brief;
  return (
    <div className="space-y-14">
      <section aria-labelledby="comparison-heading" className="border-y border-border-strong bg-plate">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-4 py-5 sm:px-6">
          <div>
            <h2 id="comparison-heading" className="text-xl font-semibold tracking-tight">Recorded change</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {changeSummary(brief)}
            </p>
          </div>
          <a href={`${controlBriefHref(item)}/brief?${briefQuery(dates)}`} className="research-button-secondary">
            Download brief (.txt)
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 bg-elevated px-4 py-3 text-sm sm:grid-cols-[6rem_1fr_1fr] sm:px-6">
          <span className="hidden text-muted sm:block">Clauses</span>
          <time dateTime={dates.from} className="tnum font-medium">{formatDate(dates.from)}</time>
          <time dateTime={dates.to} className="tnum font-medium">{formatDate(dates.to)}</time>
        </div>
        <ul className="divide-y divide-border">
          {summary.map(({ before, after, count }) => (
            <li key={`${before.measureId}-${after.measureId}`} className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-5 sm:grid-cols-[6rem_1fr_1fr] sm:px-6">
              <p className="tnum col-span-2 text-sm font-medium text-accent sm:col-span-1">{count} {count === 1 ? "clause" : "clauses"}</p>
              <StandingCell brief={brief} value={before} cited />
              <StandingCell brief={brief} value={after} cited />
            </li>
          ))}
        </ul>
      </section>

      <Section id="scope" title="Clause scope and evidence" description={item.scope}>
        <p className="mb-4 text-sm text-muted">The comparison covers {rows.length} published clause records from <Link className="link-quiet" href={`/events/${item.instrumentId}`}>the instrument dossier</Link>.</p>
        <ul className="divide-y divide-border border-y border-border-strong bg-plate">
          {rows.map((row) => (
            <li key={row.id}>
              <details className="px-4 py-3 sm:px-6">
                <summary className="min-h-8 cursor-pointer py-1 font-medium text-accent">
                  {row.clause} <span className="ml-2 text-sm font-normal text-muted">{row.type}</span>
                </summary>
                <div className="mt-3 space-y-4 pb-2 text-sm">
                  <div className="grid grid-cols-2 gap-4 border-y border-border py-3">
                    <div>
                      <time className="tnum mb-2 block text-muted" dateTime={dates.from}>{formatDate(dates.from)}</time>
                      <StandingCell brief={brief} value={row.before} />
                    </div>
                    <div>
                      <time className="tnum mb-2 block text-muted" dateTime={dates.to}>{formatDate(dates.to)}</time>
                      <StandingCell brief={brief} value={row.after} />
                    </div>
                  </div>
                  <dl className="space-y-2">
                    <div className="grid grid-cols-[6rem_1fr] gap-3"><dt className="text-muted">Activity</dt><dd>{row.direction}</dd></div>
                    <div className="grid grid-cols-[6rem_1fr] gap-3"><dt className="text-muted">Targets</dt><dd>{row.target}</dd></div>
                    {row.codes.length ? <div className="grid grid-cols-[6rem_1fr] gap-3"><dt className="text-muted">Product codes</dt><dd className="break-words">{row.codes.join(" · ")}</dd></div> : null}
                  </dl>
                  <p className="font-medium">Citations in this release</p>
                  <ul className="space-y-2">
                    {row.evidence.filter((ref) => ref.locator).map((ref) => (
                      <li key={ref.evidenceId} className="leading-6">
                        <SourceLink brief={brief} sourceId={ref.sourceId} />{" "}
                        <span className="text-muted">· {ref.locator}{ref.evidenceLevel === "ambiguous" ? " (status evidence ambiguous)" : ""}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/controls/${row.id}`} className="link-quiet">Open clause dossier</Link>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="history" title="Instrument history" description="The full history in this release, including entries after your selected dates.">
        <ol className="divide-y divide-border border-y border-border-strong">
          {timeline.map((entry) => (
            <li key={entry.key} className="grid gap-1 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
              <div>
                <p className="font-semibold">{entry.status}</p>
                <p className="tnum mt-1 text-muted">{entry.statement}</p>
              </div>
              <div>
                <SourceLink brief={brief} sourceId={entry.sourceId} />
                <p className="mt-1 text-muted">{entry.clauses.length === rows.length ? "All clauses in this brief" : entry.clauses.join(", ")}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="questions" title="What to verify next">
        <ul className="max-w-prose list-disc space-y-3 pl-5 text-sm leading-6 text-muted">
          {item.reviewQuestions.map((question) => <li key={question}>{question}</li>)}
        </ul>
        <p className="mt-4 text-sm">
          <Link className="link-quiet" href="/research/china-export-control-suspension-extension">Read the published analysis of the wider suspension</Link>
        </p>
      </Section>

      <Section id="sources" title="Primary sources and release">
        <ul className="divide-y divide-border border-y border-border-strong">
          {[...sources.values()].sort((a, b) => (a.datePublished ?? "").localeCompare(b.datePublished ?? "")).map((source) => (
            <li key={source.sourceId} className="grid gap-1 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
              <div>
                <SourceLink brief={brief} sourceId={source.sourceId} />
                <p className="tnum mt-1 text-muted">Published {source.datePublished ? formatDate(source.datePublished) : "date not recorded"} · Archived source access {formatDate(source.dateAccessed)}</p>
              </div>
              <Link className="link-quiet self-center" href={`/sources/${source.sourceId}`}>Source record <span className="sr-only">{source.documentNumber ?? source.publisher}</span></Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-sm leading-6 text-muted">{comparisonMethod} {briefUse}</p>
        <details className="mt-3 text-sm">
          <summary className="w-fit cursor-pointer py-2 font-medium text-accent">Release identifiers</summary>
          <dl className="mt-2 space-y-3 text-muted">
            <div><dt>Controls snapshot version</dt><dd className="break-all font-mono">{brief.manifest.datasetVersion}</dd></div>
            <div><dt>Source corpus version</dt><dd className="break-all font-mono">{brief.manifest.sourceDatasetVersion}</dd></div>
          </dl>
        </details>
      </Section>

      <Section title="Licensing and research inquiries">
        <p className="max-w-prose text-sm leading-6 text-muted">
          Discuss licensing maintained Controls histories for your team’s workflow, or request a scoped analysis of a specific regulatory question.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link className="research-button-secondary" href="/about#contact-heading">Contact Stratellar</Link>
          <Link className="link-quiet text-sm" href="/data">View public data formats</Link>
        </div>
      </Section>
    </div>
  );
}

export default async function ControlChangesPage({ params, searchParams }: Props) {
  const { caseId } = await params;
  const item = controlBriefCases.find((candidate) => candidate.slug === caseId);
  if (!item) notFound();
  const { from, to } = await searchParams;
  const brief = buildControlBrief(item, { from, to });
  const dates = brief.valid ? brief.dates : item.defaultDates;

  return (
    <Container className="py-7 sm:py-14">
      <PageHeading
        align="start"
        className="[&>hr]:mt-6 sm:[&>hr]:mt-10"
        title="Controls change briefs"
        lead="Compare clause standing on two dates, trace the authority behind each reading, and download a brief for your own analysis."
        breadcrumbs={[{ href: "/controls", label: "Controls" }, { label: "Change briefs" }]}
      />

      <nav aria-label="Available briefs" className="mt-5 grid grid-cols-1 gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-3">
        {controlBriefCases.map((candidate) => (
          <Link
            key={candidate.slug}
            href={controlBriefHref(candidate)}
            aria-current={candidate.slug === caseId ? "page" : undefined}
            className="border border-border bg-card px-4 py-3 hover:border-accent aria-[current=page]:border-accent aria-[current=page]:bg-plate sm:px-5"
          >
            <span className="block text-base font-semibold text-accent">{candidate.title}</span>
            <span className="tnum mt-1 block text-sm text-muted">{candidate.instrumentLabel}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 sm:mt-10">
        <p id="date-range" className="tnum text-sm text-muted">
          Published snapshot · Legal-status cutoff <time dateTime={brief.cutoff}>{formatDate(brief.cutoff)}</time>
        </p>
        <form method="get" action={`${controlBriefHref(item)}#comparison-result`} aria-label="Comparison dates" className="mt-3 flex flex-wrap items-end gap-3 sm:gap-4">
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium sm:flex-none">
            Earlier date
            <input className="tnum min-h-11 w-full min-w-0 border border-border-strong bg-plate px-2 sm:w-40" type="date" name="from" defaultValue={dates.from} min={brief.firstDate} max={brief.cutoff} required />
          </label>
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium sm:flex-none">
            Later date
            <input className="tnum min-h-11 w-full min-w-0 border border-border-strong bg-plate px-2 sm:w-40" type="date" name="to" defaultValue={dates.to} min={brief.firstDate} max={brief.cutoff} required aria-describedby="date-range" />
          </label>
          <button className="research-button w-full sm:w-auto" type="submit">Compare dates</button>
          {dates.from !== item.defaultDates.from || dates.to !== item.defaultDates.to ? (
            <Link className="link-quiet text-sm sm:self-center" href={controlBriefHref(item)}>Reset dates</Link>
          ) : null}
        </form>
      </div>

      <div id="comparison-result" tabIndex={-1} className="mt-6 scroll-mt-32 sm:mt-8">
        {brief.valid ? <Comparison brief={brief} /> : (
          <div role="alert" className="border-y border-border-strong bg-plate p-4 text-sm leading-6">
            <p>Choose two different dates in chronological order, from {formatDate(brief.firstDate)} through {formatDate(brief.cutoff)}.</p>
            <Link className="link-quiet mt-2 inline-block" href={controlBriefHref(item)}>Return to the worked comparison</Link>
          </div>
        )}
      </div>
    </Container>
  );
}
