import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { getAllMaterials, getDatasetSummary } from "@/lib/data";
import { LatticeOverview } from "@/components/lattice/lattice";
import { ElementStrip, SupplyChainStrip } from "@/components/home/supply-chain-strip";
import { chainStageCounts } from "@/lib/homepage-chain";
import { buildLatticeModel } from "@/lib/lattice";
import { formatDateLong } from "@/lib/format";
import { fi002 } from "@/lib/fi002";
import { getFinancingCase, getLegalControlCase, getTungstenCase } from "@/lib/homepage-cases";
import { journeys, site } from "@/lib/site";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Critical minerals policy, financing and industrial development",
  description:
    "Comparative research and source-linked records on government measures, public financing and industrial projects in strategic-material supply chains.",
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.name,
    description:
      "Research on strategic-materials policy, financing and industrial development.",
  },
};

const latestResearch = {
  category: "Financial Intelligence 002",
  date: "2026-11-05",
  dateLabel: "5 November 2026",
  title: "Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision",
  description: "Copper-price exposure, replacement economics and BHP’s capital-allocation decision.",
  href: "/research/escondida-copper",
} as const;

const moreResearch = [
  {
    category: "Financial Intelligence 001",
    title: "Inside Tungsten West’s £71 Million Restart Financing",
    description: "Hemerdon’s funding package, project expenditure and refinancing exposure.",
    href: "/research/hemerdon-financing",
  },
  {
    category: "Applied Strategy 001",
    title: "U.S. Antimony Supply Resilience, 2027–2031",
    description: "A defense-manufacturing procurement case with an editable scenario model.",
    href: "/research/antimony-supply-resilience",
  },
  {
    category: "Research Dossier 001",
    title: "Tungsten Supply Security",
    description: "Comparative financing and industrial development across four jurisdictions.",
    href: "/research/tungsten-supply-security",
  },
] as const;

export default function Home() {
  const counts = getDatasetSummary();
  const materials = getAllMaterials();
  const model = buildLatticeModel(site.lastUpdated);
  const chain = chainStageCounts(model);
  const legal = getLegalControlCase();
  const financing = getFinancingCase();
  const tungsten = getTungstenCase();
  const revision = formatDateLong(site.lastUpdated);
  const asOf = (
    <>as of the <time dateTime={site.lastUpdated}>{revision}</time> revision</>
  );

  return (
    <div data-flush-footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }}
      />

      <Container width="wide" className="pb-10 pt-10 sm:pb-12 sm:pt-14 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 xl:gap-16">
          <div>
            <p className="font-display text-sm text-muted">Strategic Materials Policy Tracker</p>
            <h1 className="mt-4 max-w-2xl font-serif text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3rem] xl:text-[3.25rem]">
              Research on critical minerals policy, financing and industrial development.
            </h1>
            <p className="mt-5 max-w-xl font-serif text-lg leading-7 text-muted">
              Follow government measures, capital commitments and industrial projects
              through the original records.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/research" className="research-button">Read research</Link>
              <Link href="/events" className="research-button-secondary">Explore records</Link>
            </div>
            <p className="mt-6 font-display text-sm text-muted">
              Research by <Link href="/about" className="underline decoration-border-strong underline-offset-4 hover:text-foreground">Benjamin Yang</Link>
            </p>
          </div>
          <aside
            aria-labelledby="latest-research-heading"
            className="min-w-0 border-t border-border-strong pt-6 lg:border-l lg:border-t-0 lg:py-1 lg:pl-8"
          >
            <div className="grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-7 lg:grid-cols-[8rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[9rem_minmax(0,1fr)]">
              <Link
                href={latestResearch.href}
                aria-label={`Read ${latestResearch.title}`}
                className="block min-w-0 overflow-hidden border border-border-strong transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Image
                  src={`${fi002.assets}/report-cover.png`}
                  alt="Cover of the Escondida financial research report"
                  width={612}
                  height={792}
                  sizes="(min-width: 1280px) 144px, (min-width: 1024px) 128px, (min-width: 640px) 144px, 96px"
                  className="h-auto w-full"
                  priority
                />
              </Link>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-accent">Latest research</p>
                <p className="mt-2 font-display text-xs leading-5 text-muted">
                  {latestResearch.category} · <time dateTime={latestResearch.date}>{latestResearch.dateLabel}</time>
                </p>
                <h2 id="latest-research-heading" className="mt-3 font-serif text-xl leading-[1.2] tracking-tight sm:text-2xl lg:text-[1.35rem] xl:text-2xl">
                  <Link href={latestResearch.href} className="hover:text-accent">
                    {latestResearch.title}
                  </Link>
                </h2>
                <p className="mt-3 font-display text-sm leading-6 text-muted">
                  {latestResearch.description}
                </p>
                <Link href={latestResearch.href} className="mt-4 inline-block font-display text-sm font-medium text-accent underline underline-offset-4 hover:text-foreground">
                  Read report
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-10 border-t border-border-strong pt-5 sm:mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-3 font-display text-sm">
            <p className="font-semibold">Current corpus</p>
            <p className="text-muted">Revised <time dateTime={site.lastUpdated}>{revision}</time> · <Link href="/coverage" className="underline underline-offset-4 hover:text-foreground">Coverage</Link></p>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 font-display sm:grid-cols-4">
            {[
              [counts.events, "Policy events"],
              [counts.financialCommitments, "Financial instruments"],
              [counts.projects, "Projects"],
              [counts.projectMilestones, "Industrial observations"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="tnum mt-1 text-xl font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ElementStrip materials={materials} />
      </Container>

      <section aria-label="Supply-chain coverage" className="border-t border-border">
        <Container width="wide" className="py-10 sm:py-12">
          <SupplyChainStrip chain={chain.chain} outside={chain.outside} asOf={asOf} />
        </Container>
      </section>

      <section id="research" aria-labelledby="research-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="research-heading" className="font-serif text-3xl font-medium">More research</h2>
            <Link href="/research" className="font-display text-sm text-accent underline underline-offset-4">
              All research
            </Link>
          </div>
          <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-3">
            {moreResearch.map((item) => (
              <article key={item.href} className="border-t border-border pt-5">
                <p className="font-display text-sm text-muted">{item.category}</p>
                <h3 className="mt-2 font-serif text-xl leading-tight sm:text-2xl">
                  <Link href={item.href} className="hover:text-accent">{item.title}</Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="examples" aria-labelledby="examples-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-14">
          <h2 id="examples-heading" className="font-serif text-3xl font-medium">
            From the records
          </h2>
          <div className="mt-7 grid gap-7 md:grid-cols-3">
            {legal ? (
              <article className="border-t border-border pt-4">
                <p className="font-display text-sm text-muted">Legal controls</p>
                <h3 className="mt-3 font-serif text-lg leading-snug">
                  <Link href={`/events/${legal.event.id}`} className="hover:text-accent">
                    {legal.event.titleEn}
                  </Link>
                </h3>
                <p className="mt-2 font-display text-sm text-muted">
                  {legal.status.label} · <time dateTime={legal.event.date}>{formatDateLong(legal.event.date)}</time>
                </p>
                <Link href={`/controls/${legal.control.id}`} className="mt-3 inline-block font-display text-sm text-accent underline underline-offset-4">
                  View clause
                </Link>
              </article>
            ) : null}
            {financing.length ? (
              <article className="border-t border-border pt-4">
                <p className="font-display text-sm text-muted">Public financing</p>
                <h3 className="mt-3 font-serif text-lg leading-snug">
                  <Link href={`/capital/${financing[0].commitment.id}`} className="hover:text-accent">
                    {financing[0].provider}: {financing[0].instrument.toLowerCase()}
                  </Link>
                </h3>
                <p className="mt-2 font-display text-sm text-muted">
                  {financing[0].status.label} · {financing[0].amount.currency} {financing[0].amount.value}
                </p>
              </article>
            ) : null}
            {tungsten.length ? (
              <article className="border-t border-border pt-4">
                <p className="font-display text-sm text-muted">Tungsten comparison</p>
                <h3 className="mt-3 font-serif text-lg leading-snug">
                  <Link href={tungsten[0].href} className="hover:text-accent">{tungsten[0].title}</Link>
                </h3>
                <p className="mt-2 font-display text-sm text-muted">
                  {tungsten[0].jurisdiction} · {tungsten[0].status}
                </p>
                <Link href="/materials/tungsten" className="mt-3 inline-block font-display text-sm text-accent underline underline-offset-4">
                  Tungsten profile
                </Link>
              </article>
            ) : null}
          </div>
        </Container>
      </section>

      <section id="browse" aria-label="Browse by material and stage" className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-16">
          <LatticeOverview
            model={model}
            preferred={{ slug: "gallium", stage: "processing" }}
            intro={
              <>
                <h2 className="font-serif text-3xl font-medium">Browse by material and stage</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Select a marked cell to open its source-linked records.
                </p>
              </>
            }
          />
        </Container>
      </section>

      <section aria-labelledby="database-heading" className="border-t border-border-strong bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-14">
          <h2 id="database-heading" className="font-serif text-3xl font-medium">Explore the database</h2>
          <nav aria-label="Database sections" className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {journeys.map((journey) => (
              <Link
                key={journey.href}
                href={journey.href}
                className="border-t border-paper-border pt-4 font-display text-base font-semibold text-paper-foreground underline decoration-paper-border underline-offset-4 hover:decoration-current"
              >
                {journey.label}
              </Link>
            ))}
          </nav>
        </Container>
      </section>
    </div>
  );
}
