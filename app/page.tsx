import Link from "next/link";
import { Container, Section, AtlasIndex } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { EventListItem } from "@/components/event-card";
import { FramingQuote } from "@/components/framing-quote";
import { HeroMotif } from "@/components/hero-motif";
import { MaterialTile } from "@/components/material-tile";
import { JurisdictionTag } from "@/components/labels";
import {
  getAllEvents,
  getAllFramingClaims,
  getAllMaterials,
  getDatasetSummary,
  getSourceById,
} from "@/lib/data";
import { site } from "@/lib/site";
import {
  controlClocks,
  controlStatusOn,
  formatDecimalCompact,
  publicCommitmentRows,
  totalCommitments,
} from "@/lib/capital-control";
import { getAllControlMeasures, getAllFinancialCommitments } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

const HOMEPAGE_FRAMING_IDS = ["fc-china-oct-natsec", "fc-us-burgum-resilience"];

export default function Home() {
  const events = getAllEvents();
  const recent = events.slice(0, 5);
  const materials = getAllMaterials();
  const summary = getDatasetSummary();
  const framing = getAllFramingClaims();
  const snapshot = HOMEPAGE_FRAMING_IDS.map((id) =>
    framing.find((f) => f.id === id),
  ).filter((f): f is NonNullable<typeof f> => Boolean(f));

  const stats = [
    { label: "Policy events", value: summary.events, href: "/events" },
    { label: "Framing anchors", value: summary.framingClaims, href: "/framing" },
    { label: "Materials", value: summary.materials, href: "/materials" },
    { label: "Actors", value: summary.jurisdictions, href: "/actors" },
    { label: "Sources", value: summary.sources, href: "/sources" },
    { label: "Financial rows", value: summary.financialCommitments, href: "/capital" },
    { label: "Control clauses", value: summary.controlMeasures, href: "/controls" },
  ];
  const asOf = site.lastUpdated;
  const totals = totalCommitments(publicCommitmentRows());
  const controls = getAllControlMeasures();
  const inForce = controls.filter((m) => controlStatusOn(m, asOf) === "in_force").length;
  const suspended = controls.filter((m) => controlStatusOn(m, asOf) === "suspended").length;
  const nextClock = controlClocks(asOf)[0];
  const countedIds = new Set(totals.currencies.flatMap((c) => c.countedIds));
  const capitalActors = new Set(
    getAllFinancialCommitments().filter((c) => countedIds.has(c.id)).map((c) => c.providerJurisdiction).filter(Boolean),
  ).size;
  const sumLine = (s: Partial<Record<"exact" | "approximately" | "at_least" | "up_to", string>>) =>
    [
      s.exact ? formatDecimalCompact(s.exact) : null,
      s.approximately ? `about ${formatDecimalCompact(s.approximately)}` : null,
      s.at_least ? `at least ${formatDecimalCompact(s.at_least)}` : null,
      s.up_to ? `up to ${formatDecimalCompact(s.up_to)}` : null,
    ]
      .filter(Boolean)
      .join(" + ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }}
      />
    <Container width="wide" className="py-12 sm:py-16">
      {/* Hero */}
      <section>
        <div className="max-w-2xl">
          <AtlasIndex index="00" label="Multi-actor · policy-instrument · source-linked" className="mb-5" />
          <h1 className="font-display text-balance text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
            The policy contest over rare earths and strategic materials.
          </h1>
          <p className="mt-6 text-pretty text-lg leading-8 text-muted">
            China processes roughly 90% of the world&apos;s rare earths and is the
            leading refiner for 19 of 20 strategic minerals. This database follows
            the policy contest that dependence has set off — the export controls,
            licensing, designations, public money, ownership, offtake and
            stockpiling each major power deploys, clause by clause and commitment
            by commitment, and the official language it uses to justify them.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold text-accent-foreground shadow-[0_0_20px_color-mix(in_oklab,var(--accent)_25%,transparent)] transition-colors hover:bg-accent-strong"
            >
              Browse the event database →
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center rounded-md border border-border px-4 py-2 font-display text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-elevated"
            >
              Read the methodology
            </Link>
          </div>
        </div>
        <div className="mt-10 lg:mt-12">
          <HeroMotif materials={summary.materials} />
        </div>
      </section>

      {/* Stats — dataset scope declaration strip */}
      <div className="mt-12 rounded-lg border border-border-strong border-l-2 border-l-accent bg-card/60">
        <div className="border-b border-border px-6 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Dataset scope · {site.scopeStart} – present
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4 lg:grid-cols-7">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="group block px-6 py-4">
              <div className="tnum font-display text-3xl font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
                {s.value}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-faint">
                {s.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent events + framing teaser */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Section
          index="01"
          title="Recent events"
          description="The most recent measures across all tracked actors."
        >
          <Card className="overflow-hidden">
            {recent.map((e) => (
              <EventListItem key={e.id} event={e} />
            ))}
          </Card>
          <Link
            href="/events"
            className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong"
          >
            All {summary.events} events →
          </Link>
        </Section>

        <Section
          index="02"
          title="How they frame it"
          description="Everyone invokes security — but the words differ."
        >
          <div className="grid gap-4">
            {snapshot.map((claim) => (
              <div key={claim.id}>
                <div className="mb-2">
                  <JurisdictionTag code={claim.actor} withName />
                </div>
                <FramingQuote claim={claim} source={getSourceById(claim.sourceId)} />
              </div>
            ))}
          </div>
          <Link
            href="/framing"
            className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong"
          >
            Comparative framing →
          </Link>
        </Section>
      </div>

      {/* Capital & Control entry points */}
      <Section
        className="mt-16"
        index="03"
        title="Capital and control"
        description="Money and restrictions, instrument by instrument, from official sources and binding filings."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/capital" className="group rounded-lg border bg-card p-5 transition-colors hover:border-accent/40 hover:bg-elevated">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Capital</p>
            <p className="mt-3 font-display text-lg font-semibold group-hover:text-accent">Who is paying for which supply chains</p>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-muted">
              {totals.currencies.map((c) => (
                <li key={c.currency} className="tnum">
                  <span className="text-foreground">{c.currency}</span>{" "}
                  {sumLine(c.binding) ? <>binding {sumLine(c.binding)}</> : null}
                  {sumLine(c.binding) && sumLine(c.notYetBinding) ? " · " : null}
                  {sumLine(c.notYetBinding) ? <span className="text-faint">not yet binding {sumLine(c.notYetBinding)}</span> : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-6 text-muted">
              Public commitments from {capitalActors} governments, per currency, with every package counted once.
            </p>
          </Link>
          <Link href="/controls" className="group rounded-lg border bg-card p-5 transition-colors hover:border-accent/40 hover:bg-elevated">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Controls</p>
            <p className="mt-3 font-display text-lg font-semibold group-hover:text-accent">What is in force, suspended or pending</p>
            <p className="tnum mt-3 font-mono text-xs text-muted">
              {inForce} clauses in force · {suspended} suspended
            </p>
            {nextClock ? (
              <p className="mt-3 text-sm leading-6 text-muted">
                Next stated end date: {formatDate(nextClock.entry.until!)}, {nextClock.daysLeft} days after the data&apos;s as-of date.
              </p>
            ) : null}
          </Link>
          <Link href="/interplay" className="group rounded-lg border bg-card p-5 transition-colors hover:border-accent/40 hover:bg-elevated">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Capital × Control</p>
            <p className="mt-3 font-display text-lg font-semibold group-hover:text-accent">Money and restrictions on one clock</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Every dated financial and control status change by actor, and a material-by-actor grid of where they meet.
            </p>
          </Link>
        </div>
      </Section>

      {/* Comparative matrix entry point */}
      <Section
        className="mt-16"
        index="04"
        title="Who has acted on what"
        description="The same materials, six governments, side by side."
      >
        <Card className="p-6">
          <p className="max-w-3xl leading-7 text-muted">
            The event index reads chronologically. The comparative matrix reads structurally —
            down a column for one government&apos;s posture, across a row for the contest over a
            single material. Every cell opens the measures behind the count, with the mechanisms
            and the most recent date.
          </p>
          <Link
            href="/compare"
            className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong"
          >
            Open the comparative matrix →
          </Link>
        </Card>
      </Section>

      {/* Materials — element tiles */}
      <Section
        className="mt-16"
        index="05"
        title="Materials"
        description="A bounded set, rare-earth-centred, with the adjacent chokepoints."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <MaterialTile key={m.id} material={m} />
          ))}
        </div>
      </Section>

      {/* Methodology preview + data CTA */}
      <Section className="mt-16" index="06" title="Built to be cited">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h3 className="font-display font-semibold tracking-tight">
              The rules that protect the data
            </h3>
            <ul className="mt-3 space-y-2 leading-7 text-muted">
              <li>· Categorical labels only — never an invented 0–100 score.</li>
              <li>· No framing claim without a quoted anchor in the original language.</li>
              <li>· Official English preferred; self-translations marked; originals linked.</li>
              <li>· Bounded scope; unknown fields are <code className="font-mono text-sm text-faint">null</code> or &ldquo;Not yet coded,&rdquo; never guessed.</li>
            </ul>
            <Link
              href="/methodology"
              className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong"
            >
              Full methodology, label definitions &amp; limitations →
            </Link>
          </Card>
          <Card className="p-6">
            <h3 className="font-display font-semibold tracking-tight">
              Take the data with you
            </h3>
            <p className="mt-3 leading-7 text-muted">
              The whole dataset — events, framing anchors, materials, jurisdictions
              and sources — is downloadable as structured JSON and CSV, with the same
              source links and translation provenance you see on the site.
            </p>
            <Link
              href="/data"
              className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong"
            >
              CSV / JSON export →
            </Link>
          </Card>
          <Card className="p-6">
            <h3 className="font-display font-semibold tracking-tight">
              See what the data can support
            </h3>
            <p className="mt-3 leading-7 text-muted">
              The coverage dashboard shows the coded footprint directly: how many events are
              anchored to a primary source and a framing quote, the source-confidence mix, and
              where the research is thin — counts, never a synthetic score.
            </p>
            <Link
              href="/coverage"
              className="mt-4 inline-block font-display text-sm text-accent hover:text-accent-strong"
            >
              Open the coverage dashboard →
            </Link>
          </Card>
        </div>
        <p className="mt-8 font-mono text-xs text-faint">
          {site.name} · {site.version} · scope from {site.scopeStart}.
        </p>
      </Section>
    </Container>
    </>
  );
}
