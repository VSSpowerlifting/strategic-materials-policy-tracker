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
    "Official publication sources registered for review, with stated cadence and materials coverage.",
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
        lead="This register lists the official pages and feeds selected for review, organized by jurisdiction and review cadence. Coverage gaps reflect the sources currently monitored or scheduled for review."
      />

      <Card className="mt-8 p-6">
        <h2 className="font-display font-semibold tracking-tight">
          How to read this watchlist
        </h2>
        <ul className="mt-3 max-w-3xl space-y-2 text-sm leading-6 text-muted">
          <li>
            An entry identifies an official publication venue selected for review.
            The policy measures themselves appear in the source-linked event records.
          </li>
          <li>
            Cadence states the project&apos;s planned review interval, separate from
            how often the publisher releases new material.
          </li>
          <li>
            {site.monitoringStartedAt ? (
              <>Prospective monitoring began {site.monitoringStartedAt}.</>
            ) : (
              <>
                The current records were collected retrospectively. Prospective
                monitoring awaits a recorded start date; review dates and
                publication-lag measures will be available after that start.
              </>
            )}
          </li>
          <li>
            Sources are added here when they are the authoritative publication venue for a
            jurisdiction&apos;s measures. Each entry records the source&apos;s accessibility when added;
            current availability may change.
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
            {gaps.map((g) => jurisdictionLabels[g.jurisdiction]).join(", ")} and currently lists no active-review source for those jurisdictions.
            The published records there were researched retrospectively.
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
