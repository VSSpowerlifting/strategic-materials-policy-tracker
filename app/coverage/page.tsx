import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { getEvidenceSummary } from "@/lib/data";
import type { Share } from "@/lib/coverage";
import { confidenceLabels, jurisdictionLabels, mechanismLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Coverage",
  description:
    "The coded footprint of the dataset: source composition, framing-anchor coverage, per-actor counts and the research boundaries that limit what these figures can support. Source-linked record counts.",
};

function pct(s: Share): number | null {
  return s.ratio === null ? null : Math.round(s.ratio * 100);
}

function HeadlineStat({ n, label, sub }: { n: string; label: string; sub: string }) {
  return (
    <div className="border-t border-border-strong pt-3">
      <dt className="font-display text-xs text-faint">{label}</dt>
      <dd className="mt-1">
        <span className="tnum block font-editorial text-3xl leading-none">{n}</span>
        <span className="mt-1.5 block font-display text-xs leading-5 text-muted">{sub}</span>
      </dd>
    </div>
  );
}

/** A restrained CSS bar: the number is the accessible value, the bar is decorative. */
function DistributionBar({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <li className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 sm:grid-cols-[10rem_1fr_2.5rem] sm:gap-3">
      <span className="truncate text-xs text-muted sm:text-sm">{label}</span>
      <div className="h-2 min-w-0 overflow-hidden bg-elevated" aria-hidden="true">
        <div className="h-full bg-foreground" style={{ width: `${width}%` }} />
      </div>
      <span className="tnum text-right font-display text-xs text-faint">{count}</span>
    </li>
  );
}

export default function CoveragePage() {
  const s = getEvidenceSummary();
  const primaryPct = pct(s.primarySources);
  const framingPct = pct(s.framingCoverage);
  const maxMechanism = Math.max(1, ...s.byMechanism.map((m) => m.count));
  const maxConfidence = Math.max(1, ...s.bySourceConfidence.map((c) => c.count));
  const rankedActors = [...s.byJurisdiction].sort((a, b) => b.events - a.events);
  const topActor = rankedActors[0];
  const topActorPct =
    topActor && s.totals.events > 0 ? Math.round((topActor.events / s.totals.events) * 100) : null;

  return (
    <Container className="py-12">
      <PageHeading
        title="Coverage"
        lead="Corpus size, primary-source coverage and research gaps in the records currently in SMPT."
      />

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        <HeadlineStat n={String(s.totals.events)} label="Coded events" sub="Policy measures in the register" />
        <HeadlineStat n={String(s.totals.sources)} label="Registered sources" sub="Documents the corpus cites" />
        <HeadlineStat
          n={primaryPct === null ? "—" : `${primaryPct}%`}
          label="Primary-source share"
          sub={`${s.primarySources.count} of ${s.primarySources.of} sources`}
        />
        <HeadlineStat
          n={framingPct === null ? "—" : `${framingPct}%`}
          label="Framing-anchor coverage"
          sub={`${s.framingCoverage.count} of ${s.framingCoverage.of} events`}
        />
      </dl>

      <Section
        className="mt-14"
        title="By actor"
      >
        <div className="overflow-x-auto border-y border-border-strong">
          <table className="w-full min-w-[38rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated text-left font-display text-xs text-faint">
                <th scope="col" className="py-2 pl-3 pr-4 font-normal">Actor</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">Events</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">Framing anchored</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">Linked sources</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">Primary sources</th>
              </tr>
            </thead>
            <tbody>
              {s.byJurisdiction.map((a) => (
                <tr key={a.jurisdiction} className="border-b border-border last:border-0">
                  <td className="py-2.5 pl-3 pr-4 font-display">
                    <Link href={`/actors/${a.code}`} className="hover:text-accent">
                      {jurisdictionLabels[a.jurisdiction]}
                    </Link>
                  </td>
                  <td className="tnum py-2.5 pr-4 text-right font-display">{a.events}</td>
                  <td className="tnum py-2.5 pr-4 text-right font-display">
                    {a.framingCoverage.count}
                    <span className="text-faint">/{a.framingCoverage.of}</span>
                  </td>
                  <td className="tnum py-2.5 pr-4 text-right font-display">{a.linkedSources}</td>
                  <td className="tnum py-2.5 pr-3 text-right font-display">{a.primaryLinkedSources}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-2">
        <Section title="By mechanism" description="Events carry more than one mechanism, so these sum to more than the event count.">
          <div>
            <ul className="grid gap-2.5">
              {s.byMechanism.map((m) => (
                <DistributionBar key={m.mechanism} label={mechanismLabels[m.mechanism]} count={m.count} max={maxMechanism} />
              ))}
            </ul>
          </div>
        </Section>

        <Section title="Source confidence" description="Every source in the register, graded by the four-tier confidence hierarchy.">
          <div>
            <ul className="grid gap-2.5">
              {s.bySourceConfidence.map((c) => (
                <DistributionBar key={c.confidence} label={confidenceLabels[c.confidence]} count={c.count} max={maxConfidence} />
              ))}
            </ul>
          </div>
        </Section>
      </div>

      <Section className="mt-14" title="Research boundaries">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          <div className="border-t border-border-strong pt-4">
            <h3 className="font-display font-semibold">Coded date window</h3>
            <p className="mt-2 tnum font-display text-sm text-foreground">
              {formatDate(s.dateWindow.earliest)} – {formatDate(s.dateWindow.latest)}
            </p>
            <p className="mt-2 text-xs leading-5 text-faint">
              The current dataset covers this date window. Earlier and later activity
              requires separate research.
            </p>
          </div>

          <div className="border-t border-border-strong pt-4">
            <h3 className="font-display font-semibold">Unresolved coding fields</h3>
            {s.notYetCodedTitleEventIds.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-muted">
                None — every event&apos;s original-language title has been transcribed against its
                primary.
              </p>
            ) : (
              <ul className="mt-2 grid gap-1.5 text-sm">
                {s.notYetCodedTitleEventIds.map((id) => (
                  <li key={id}>
                    <Link href={`/events/${id}`} className="font-mono text-xs text-accent hover:text-accent-strong">
                      {id}
                    </Link>
                    <span className="text-faint"> — original-language title marked &ldquo;Not yet coded&rdquo;.</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border-strong pt-4">
            <h3 className="font-display font-semibold">Actor-coverage imbalance</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {topActor
                ? `${jurisdictionLabels[topActor.jurisdiction]} accounts for ${topActor.events} of ${s.totals.events} coded events (${topActorPct}%). Event counts reflect differences in SMPT’s research coverage across jurisdictions.`
                : "No events are coded yet."}
            </p>
          </div>

          <div className="border-t border-border-strong pt-4">
            <h3 className="font-display font-semibold">Direct source citations across the registry</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {s.citedSources.count} of {s.citedSources.of} registered sources directly support
              at least one published event, material, project, organization, programme, financing
              instrument, control clause, designation, framing claim, actor profile or reviewed
              project milestone.
            </p>
            <p className="mt-2 text-xs leading-5 text-faint">
              {s.citedSources.of - s.citedSources.count} registered
              {" "}source{s.citedSources.of - s.citedSources.count === 1 ? " has" : "s have"}
              {" "}yet to be linked directly to a published record. This counts citation
              links within the registry; it is separate from independent corroboration.
            </p>
            <Link
              href={s.citedSources.count < s.citedSources.of ? "/sources?citingKind=not_cited" : "/sources"}
              className="link-quiet mt-3 inline-flex min-h-11 items-center font-display text-sm font-medium"
            >
              {s.citedSources.count < s.citedSources.of ? "Inspect uncited registered sources" : "Explore source citations"}
            </Link>
          </div>

          <div className="border-t border-border-strong pt-4">
            <h3 className="font-display font-semibold">Categorical coverage</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              This page reports counts of coded records and documented source relationships.
              Categories retain their source-defined meaning. Comparing the scale of
              government activity requires a broader, consistently sampled dataset.
            </p>
          </div>
        </div>
      </Section>

      <p className="mt-12 max-w-prose border-t border-border pt-4 text-sm leading-6 text-muted">
        Category and field definitions live on the{" "}
        <Link href="/methodology" className="link-quiet">
          methodology page
        </Link>
        . The full dataset behind these counts is downloadable from{" "}
        <Link href="/data" className="link-quiet">
          /data
        </Link>
        . Data version {site.version}, last updated {site.revisedOn}.
      </p>
    </Container>
  );
}
