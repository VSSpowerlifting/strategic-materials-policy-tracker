import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { EventListItem } from "@/components/event-card";
import { FramingQuote } from "@/components/framing-quote";
import { JurisdictionTag } from "@/components/labels";
import {
  getAllEvents,
  getAllFramingClaims,
  getAllMaterials,
  getDatasetSummary,
  getSourceById,
} from "@/lib/data";
import { site } from "@/lib/site";

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
  ];

  return (
    <Container className="py-12 sm:py-16">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">
          Mandarin-source · multi-actor · source-linked
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          The policy contest over rare earths and strategic materials.
        </h1>
        <p className="mt-6 text-pretty text-lg leading-8 text-muted">
          China processes roughly 90% of the world&apos;s rare earths and is the
          leading refiner for 19 of 20 strategic minerals. This database follows
          the policy contest that dependence has set off — the export controls,
          licensing, designations, funding and stockpiling each major power
          deploys, and the official language it uses to justify them.
        </p>
        <p className="mt-4 text-pretty text-base leading-7 text-faint">
          Every classification is a categorical, source-grounded label — no
          synthetic risk scores. Every framing claim is anchored to a quoted
          passage in the original language, with its translation marked. It is not
          a market model and does not forecast prices or supply.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Browse the event database →
          </Link>
          <Link
            href="/methodology"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
          >
            Read the methodology
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-card px-4 py-5 transition-colors hover:bg-elevated"
          >
            <div className="tnum font-mono text-2xl font-semibold text-foreground">
              {s.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide text-faint">
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent events */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Section
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
            className="mt-3 inline-block text-sm text-accent hover:underline"
          >
            All {summary.events} events →
          </Link>
        </Section>

        {/* Comparative framing snapshot */}
        <Section
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
            className="mt-3 inline-block text-sm text-accent hover:underline"
          >
            Comparative framing →
          </Link>
        </Section>
      </div>

      {/* Materials */}
      <Section
        className="mt-16"
        title="Materials"
        description="A bounded set, rare-earth-centred, with the adjacent chokepoints."
      >
        <div className="flex flex-wrap gap-2">
          {materials.map((m) => (
            <Link
              key={m.id}
              href={`/materials/${m.slug}`}
              className="group inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:border-border-strong hover:bg-elevated"
            >
              <span className="font-medium group-hover:text-accent">{m.nameEn}</span>
              {m.nameZh ? (
                <span lang="zh" className="font-mono text-xs text-faint">
                  {m.nameZh}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </Section>

      {/* Methodology preview + data CTA */}
      <Section className="mt-16" title="Built to be cited">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-medium">The rules that protect the data</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li>· Categorical labels only — never an invented 0–100 score.</li>
              <li>· No framing claim without a quoted anchor in the original language.</li>
              <li>· Official English preferred; self-translations marked; originals linked.</li>
              <li>· Bounded scope; unknown fields are <code className="font-mono text-faint">null</code> or &ldquo;Not yet coded,&rdquo; never guessed.</li>
            </ul>
            <Link
              href="/methodology"
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              Full methodology, label definitions &amp; limitations →
            </Link>
          </Card>
          <Card className="p-6">
            <h3 className="font-medium">Take the data with you</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              The whole dataset — events, framing anchors, materials, jurisdictions
              and sources — is downloadable as structured JSON and CSV, with the same
              source links and translation provenance you see on the site.
            </p>
            <Link
              href="/data"
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              CSV / JSON export →
            </Link>
          </Card>
        </div>
        <p className="mt-8 text-xs text-faint">
          {site.name} · {site.version} · scope from {site.scopeStart}.
        </p>
      </Section>
    </Container>
  );
}
