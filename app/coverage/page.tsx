import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { getEvidenceSummary } from "@/lib/data";
import type { Share } from "@/lib/coverage";
import { confidenceLabels, jurisdictionLabels, mechanismLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Coverage",
  description:
    "The coded footprint of the dataset: source composition, framing-anchor coverage, per-actor counts and the research boundaries that limit what these figures can support. Counts, not scores.",
};

function pct(s: Share): number | null {
  return s.ratio === null ? null : Math.round(s.ratio * 100);
}

function HeadlineStat({ n, label, sub }: { n: string; label: string; sub: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="tnum font-display text-3xl font-bold leading-none">{n}</div>
      <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
        {label}
      </div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}

/** A restrained CSS bar: the number is the accessible value, the bar is decorative. */
function DistributionBar({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <li className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 sm:grid-cols-[10rem_1fr_2.5rem] sm:gap-3">
      <span className="truncate text-xs text-muted sm:text-sm">{label}</span>
      <div className="h-2 min-w-0 overflow-hidden rounded-full bg-elevated" aria-hidden="true">
        <div className="h-full rounded-full bg-accent/60" style={{ width: `${width}%` }} />
      </div>
      <span className="tnum text-right font-mono text-xs text-faint">{count}</span>
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
        index="01"
        eyebrow="Evidence & coverage"
        title="What the dataset can support"
        lead="This page exposes the coded footprint of the database: how many events are actually anchored to a source and to a framing quote, how the source register breaks down by confidence, and where the research is thin. Every count below describes this coded sample — it is not a claim about how much policy activity any government has actually undertaken."
      />

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
      </div>

      <Section
        className="mt-14"
        index="02"
        title="By actor"
        description="Events, framing anchors and linked sources coded per actor — a measure of how deeply this project has researched each government, not of how much each government has done."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                <th className="py-2 pr-4 font-normal">Actor</th>
                <th className="py-2 pr-4 text-right font-normal">Events</th>
                <th className="py-2 pr-4 text-right font-normal">Framing anchored</th>
                <th className="py-2 pr-4 text-right font-normal">Linked sources</th>
                <th className="py-2 text-right font-normal">Primary sources</th>
              </tr>
            </thead>
            <tbody>
              {s.byJurisdiction.map((a) => (
                <tr key={a.jurisdiction} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4 font-display">
                    <Link href={`/actors/${a.code}`} className="hover:text-accent">
                      {jurisdictionLabels[a.jurisdiction]}
                    </Link>
                  </td>
                  <td className="tnum py-2.5 pr-4 text-right font-mono">{a.events}</td>
                  <td className="tnum py-2.5 pr-4 text-right font-mono">
                    {a.framingCoverage.count}
                    <span className="text-faint">/{a.framingCoverage.of}</span>
                  </td>
                  <td className="tnum py-2.5 pr-4 text-right font-mono">{a.linkedSources}</td>
                  <td className="tnum py-2.5 text-right font-mono">{a.primaryLinkedSources}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <Section index="03" title="By mechanism" description="Events carry more than one mechanism, so these sum to more than the event count.">
          <Card className="p-5">
            <ul className="grid gap-2.5">
              {s.byMechanism.map((m) => (
                <DistributionBar key={m.mechanism} label={mechanismLabels[m.mechanism]} count={m.count} max={maxMechanism} />
              ))}
            </ul>
          </Card>
        </Section>

        <Section index="04" title="Source confidence" description="Every source in the register, graded by the four-tier confidence hierarchy.">
          <Card className="p-5">
            <ul className="grid gap-2.5">
              {s.bySourceConfidence.map((c) => (
                <DistributionBar key={c.confidence} label={confidenceLabels[c.confidence]} count={c.count} max={maxConfidence} />
              ))}
            </ul>
          </Card>
        </Section>
      </div>

      <Section className="mt-14" index="05" title="Research boundaries" description="What limits these counts, stated plainly rather than smoothed over.">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-display font-semibold tracking-tight">Coded date window</h3>
            <p className="mt-2 tnum font-mono text-sm text-foreground">
              {formatDate(s.dateWindow.earliest)} – {formatDate(s.dateWindow.latest)}
            </p>
            <p className="mt-2 text-xs leading-5 text-faint">
              No event outside this window has been coded yet. A gap here is a research boundary, not
              a claim that nothing happened before or after it.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="font-display font-semibold tracking-tight">Unresolved coding fields</h3>
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
          </Card>

          <Card className="p-5">
            <h3 className="font-display font-semibold tracking-tight">Actor-coverage imbalance</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {topActor
                ? `${jurisdictionLabels[topActor.jurisdiction]} accounts for ${topActor.events} of ${s.totals.events} coded events (${topActorPct}%). An actor with few events here is one this project has researched less — not one that has acted less.`
                : "No events are coded yet."}
            </p>
            <p className="mt-2 text-xs leading-5 text-faint">
              This imbalance is a property of the research, not the underlying policy record, and it
              is why the table above is published rather than summarised away.
            </p>
          </Card>

          <Card className="border-accent/40 p-5">
            <h3 className="font-display font-semibold tracking-tight">No synthetic scores</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Nothing on this page is weighted, normalised or rolled up into a single number. The
              project&apos;s first rule is that classifications stay categorical and source-grounded
              — there is no overall &ldquo;coverage score&rdquo; here, because a single number would
              invite exactly the comparison this coded sample cannot support.
            </p>
          </Card>
        </div>
      </Section>

      <p className="mt-12 max-w-prose leading-7 text-faint">
        Category and field definitions live on the{" "}
        <Link href="/methodology" className="font-display text-accent hover:text-accent-strong">
          methodology page
        </Link>
        . The full dataset behind these counts is downloadable from{" "}
        <Link href="/data" className="font-display text-accent hover:text-accent-strong">
          /data
        </Link>
        . Data version {site.version}, last updated {site.lastUpdated}.
      </p>
    </Container>
  );
}
