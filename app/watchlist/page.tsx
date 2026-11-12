import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
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
        title="Watched sources"
        lead="Official pages and feeds selected for review, by jurisdiction and review cadence."
      />

      <p className="tnum mt-8 border-y border-border-strong py-3 font-display text-sm text-muted">
        {active.length} active {active.length === 1 ? "source" : "sources"}, {groups.length - gaps.length} of{" "}
        {groups.length} jurisdictions covered
      </p>

      <details className="mt-4 max-w-3xl">
        <summary className="w-fit cursor-pointer font-display text-sm text-muted hover:text-foreground">
          Reading the watchlist
        </summary>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
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
      </details>

      {gaps.length > 0 ? (
        <div className="mt-6 max-w-3xl border-l-2 border-ochre pl-4">
          <h2 className="font-display font-semibold tracking-tight">Coverage gaps</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The tracker publishes events for{" "}
            {gaps.map((g) => jurisdictionLabels[g.jurisdiction]).join(", ")} and currently lists no active-review source for those jurisdictions.
            The published records there were researched retrospectively.
          </p>
        </div>
      ) : null}

      <div className="mt-10 space-y-12">
        {groups.map((group) => {
          if (group.sources.length === 0) return null;
          return (
            <Section
              key={group.jurisdiction}
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

      <p className="mt-12 max-w-prose text-sm leading-6 text-muted">
        Documents actually cited by a published record live in the{" "}
        <Link href="/sources" className="link-quiet">
          source register
        </Link>
        . How records move from a watched source to a published event is set out on the{" "}
        <Link href="/methodology" className="link-quiet">
          methodology page
        </Link>
        .
      </p>
    </Container>
  );
}
