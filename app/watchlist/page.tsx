import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { WatchedSourceCard } from "@/components/watched-source-card";
import { jurisdictionLabels } from "@/lib/labels";
import { getAllWatchedSources, getWatchedSourcesByJurisdiction } from "@/lib/data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Watchlist",
  description:
    "The official sources under standing review — what the tracker watches, how often, and for which materials. The input side of the database, published so that coverage can be audited rather than assumed.",
};

export default function WatchlistPage() {
  const groups = getWatchedSourcesByJurisdiction();
  const all = getAllWatchedSources();
  const active = all.filter((w) => w.status === "active");
  const gaps = groups.filter((g) => g.sources.length === 0);

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Coverage"
        title="What this tracker watches"
        lead="The source register shows what has been cited. This page shows what is under review — the official pages and feeds the project has undertaken to check, at a stated interval, for each jurisdiction it publishes events for. Publishing the input side is what makes the absence of a record legible: a gap here is a gap in coverage, not evidence that nothing happened."
      />

      <Card className="mt-8 p-6">
        <h2 className="font-display font-semibold tracking-tight">
          What this page does and does not claim
        </h2>
        <ul className="mt-3 max-w-3xl space-y-2 text-sm leading-6 text-muted">
          <li>
            Watching a source is a statement about the project&apos;s review routine. It asserts
            nothing about that source&apos;s contents, and no measure is implied to exist or not
            exist because a page appears here.
          </li>
          <li>
            Cadence is the interval the project commits to reviewing at — not an observed
            publication frequency of the source.
          </li>
          <li>
            {site.monitoringStartedAt ? (
              <>Prospective monitoring began {site.monitoringStartedAt}.</>
            ) : (
              <>
                Prospective monitoring has not started. Every record currently in the database was
                added retrospectively, so no timeliness or lag statistic is computed anywhere on
                this site — there is no monitoring start date to compute one against. The review
                dates below are empty for the same reason, and are left empty rather than
                backfilled.
              </>
            )}
          </li>
          <li>
            Sources are added here when they are the authoritative publication venue for a
            jurisdiction&apos;s measures. Reachability is confirmed at the time of addition; that
            is recorded in each entry&apos;s note, and is not a claim of continued availability.
          </li>
        </ul>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          {active.length} active {active.length === 1 ? "source" : "sources"} ·{" "}
          {groups.length - gaps.length} of {groups.length} jurisdictions covered
        </p>
      </Card>

      {gaps.length > 0 ? (
        <Card className="mt-6 border-accent/40 p-6">
          <h2 className="font-display font-semibold tracking-tight">Coverage gaps</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            The tracker publishes events for{" "}
            {gaps.map((g) => jurisdictionLabels[g.jurisdiction]).join(", ")} but has no source under
            active review there. Records for these jurisdictions are retrospective only, and this
            site should not be read as monitoring them.
          </p>
        </Card>
      ) : null}

      <div className="mt-10 space-y-12">
        {groups.map((group, i) => {
          if (group.sources.length === 0) return null;
          return (
            <Section
              key={group.jurisdiction}
              index={String(i + 1).padStart(2, "0")}
              title={`${jurisdictionLabels[group.jurisdiction]} (${group.sources.length})`}
            >
              <div className="grid gap-3">
                {group.sources.map((s) => (
                  <WatchedSourceCard key={s.id} source={s} />
                ))}
              </div>
            </Section>
          );
        })}
      </div>

      <p className="mt-12 max-w-prose leading-7 text-faint">
        Documents actually cited by a published record live in the{" "}
        <Link href="/sources" className="font-display text-accent hover:text-accent-strong">
          source register
        </Link>
        . How records move from a watched source to a published event is set out on the{" "}
        <Link href="/methodology" className="font-display text-accent hover:text-accent-strong">
          methodology page
        </Link>
        .
      </p>
    </Container>
  );
}
