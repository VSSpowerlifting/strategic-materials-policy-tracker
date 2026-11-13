import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getAllMaterials } from "@/lib/data";
import { CapitalFlowExhibit } from "@/components/exhibits/capital-flow";
import { FeaturedCase } from "@/components/home/featured-case";
import { HomeMarketPreview } from "@/components/home/home-market-preview";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { formatDateLong } from "@/lib/format";
import { getFinancingCase, getLegalControlCase, getTungstenCase } from "@/lib/homepage-cases";
import { journeys, site } from "@/lib/site";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Critical minerals policy, financing and industrial development",
  description:
    "Original research and source-linked data on export controls, public financing and industrial projects in strategic-material supply chains.",
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.name,
    description:
      "Research on strategic-materials policy, financing and industrial development.",
  },
};

/** Recent publications other than the featured analysis, newest first. Categories are the two public ones. */
const featured = [
  {
    category: "Policy Research",
    date: "2026-11-09",
    title: "China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027",
    href: "/research/china-export-control-suspension-extension",
  },
  {
    category: "Strategy & Finance",
    date: "2026-11-05",
    title: "Inside Tungsten West’s £71 Million Restart Financing",
    href: "/research/hemerdon-financing",
  },
  {
    category: "Strategy & Finance",
    date: "2026-11-04",
    title: "U.S. Antimony Supply Resilience, 2027–2031",
    href: "/research/antimony-supply-resilience",
  },
  {
    category: "Policy Research",
    date: "2026-11-03",
    title: "Tungsten Supply Security",
    href: "/research/tungsten-supply-security",
  },
] as const;

/** One concrete line per record journey: what a reader finds there, in the record's own terms. */
const journeyNotes: Record<(typeof journeys)[number]["href"], string> = {
  "/events": "Export controls, laws, funding decisions and official statements, with legal status by date.",
  "/capital": "Grants, loans, equity and guarantees, each dated from announcement through contract to disbursement.",
  "/projects": "Mines, refineries and plants, with their financing and reported milestones.",
  "/compare": "Governments side by side by instrument, material and supply-chain stage.",
  "/sources": "The source register, methodology, coverage limits and downloadable data.",
};

/** The four analytical layers from the Applied Strategy standard, in the order the analysis tests them. */
const layers = [
  ["Government policy", "What a law, regulation or funding decision requires, and from when."],
  ["Capital allocation", "Who commits money, through which instrument, and when it becomes available."],
  ["Industrial execution", "Permits, construction and output, separating operator reports from verification."],
  ["Commercial implications", "What the facts mean for a specific decision, with assumptions labelled."],
] as const;

export default function Home() {
  const materials = getAllMaterials();
  const legal = getLegalControlCase();
  const financing = getFinancingCase();
  const tungsten = getTungstenCase();

  return (
    <div data-flush-footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }}
      />

      {/* Title block: what the site is and who writes it. The opening plate below belongs to the flagship. */}
      <Container width="wide" className="pb-12 pt-14 sm:pb-16 sm:pt-20 lg:pt-24">
        <div className="title-block settle max-w-5xl">
          <h1 className="display-1 max-w-[15em] text-foreground">
            Research on critical-minerals policy, public finance and industrial projects
          </h1>
          <p className="standfirst mt-7 max-w-2xl">
            Original analysis built on a source-linked database of export controls, government financing and
            project milestones, from the official document to its current status.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/research" className="research-button">Read research</Link>
            <Link href="/explore" className="research-button-secondary">Explore the data</Link>
          </div>
          <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-1 font-display text-sm text-muted">
            <span>
              By <Link href="/about" className="link-quiet text-foreground">Benjamin Yang</Link>
            </span>
            <span>
              Last revised <time dateTime={site.revisedOn}>{formatDateLong(site.revisedOn)}</time>
            </span>
          </p>
        </div>
      </Container>

      <FeaturedCase />

      {/* Latest publications other than the flagship. */}
      <section aria-labelledby="latest-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-14 sm:py-20">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="latest-heading" className="font-display text-base font-semibold">Latest research</h2>
            <Link href="/research" className="font-display text-sm text-accent underline underline-offset-4">
              All research
            </Link>
          </div>
          <ScrollReveal kind="cards" className="mt-6">
            <ol className="m-0 grid list-none gap-x-10 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((item, i) => (
                <li
                  key={item.href}
                  data-motion-item
                  style={{ "--reveal-order": i } as React.CSSProperties}
                  className="flex min-w-0 flex-col border-t border-border-strong pt-4"
                >
                  <p className="label">{item.category}</p>
                  <h3 className="mt-3 font-editorial text-[1.3125rem] leading-[1.22] text-balance text-foreground">
                    <Link href={item.href} className="hover:text-accent">{item.title}</Link>
                  </h3>
                  <p className="mt-auto pt-4 font-display text-xs text-faint">
                    <time dateTime={item.date}>{formatDateLong(item.date)}</time>
                  </p>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </Container>
      </section>

      {/* Signature exhibit: one event's financing, drawn by what has been paid, promised or made conditional. */}
      <section aria-label="Capital-flow exhibit" className="border-t border-border-strong bg-card [--capflow-surface:var(--surface)]">
        <Container width="wide" className="py-14 sm:py-20">
          <CapitalFlowExhibit eventId="evt-us-dod-mp-2025" density="summary" />
        </Container>
      </section>

      {/* Market Monitor preview: the chart is the section. */}
      <section aria-label="Mineral price trends" className="border-t border-border-strong">
        <Container width="wide" className="py-14 sm:py-20">
          <ScrollReveal kind="chart"><HomeMarketPreview /></ScrollReveal>
        </Container>
      </section>

      {/* Entry to the record: the five journeys, the materials, and three records as examples. */}
      <section id="tools" aria-labelledby="tools-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-14 sm:py-20">
          <div className="title-block max-w-2xl">
            <h2 id="tools-heading" className="display-2 text-foreground">Explore</h2>
            <p className="mt-4 font-display text-[0.9375rem] leading-7 text-muted">
              Policy actions, financing and industrial projects each link to the official document they come from. Amounts stay in their original currency.
            </p>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="Database sections" className="min-w-0">
              <ul className="m-0 list-none divide-y divide-border border-y border-border-strong p-0">
                {journeys.map((journey) => (
                  <li key={journey.href}>
                    <Link
                      href={journey.href}
                      className="group grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
                    >
                      <span className="font-editorial text-xl leading-7 text-foreground group-hover:text-accent">
                        {journey.label}
                      </span>
                      <span className="font-display text-sm leading-6 text-muted">{journeyNotes[journey.href]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Materials in scope" className="min-w-0">
              <h3 className="border-b border-border-strong pb-3 font-display text-base font-semibold">
                <Link href="/materials" className="hover:text-accent">Materials</Link>
              </h3>
              <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 font-display text-sm leading-6">
                {materials.map((m) => (
                  <li key={m.id}>
                    <Link href={`/materials/${m.slug}`} className="link-quiet text-muted">
                      {m.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div id="examples" className="mt-14">
            <h3 className="font-display text-base font-semibold">Examples</h3>
            <ScrollReveal kind="cards" className="mt-5 grid gap-x-10 gap-y-8 md:grid-cols-3">
              {legal ? (
                <article
                  data-motion-item
                  style={{ "--reveal-order": 0 } as React.CSSProperties}
                  className="border-t border-border-strong pt-4"
                >
                  <p className="label">Legal controls</p>
                  <h4 className="mt-2 font-display text-[0.9375rem] font-medium leading-6">
                    <Link href={`/events/${legal.event.id}`} className="hover:text-accent">
                      {legal.event.titleEn}
                    </Link>
                  </h4>
                  <ul className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 font-display text-sm text-muted">
                    <li>{legal.status.label}</li>
                    <li>
                      <time dateTime={legal.event.date}>{formatDateLong(legal.event.date)}</time>
                    </li>
                    <li>
                      <Link href={`/controls/${legal.control.id}`} className="link-quiet">View clause</Link>
                    </li>
                  </ul>
                </article>
              ) : null}
              {financing.length ? (
                <article
                  data-motion-item
                  style={{ "--reveal-order": 1 } as React.CSSProperties}
                  className="border-t border-border-strong pt-4"
                >
                  <p className="label">Public financing</p>
                  <h4 className="mt-2 font-display text-[0.9375rem] font-medium leading-6">
                    <Link href={`/capital/${financing[0].commitment.id}`} className="hover:text-accent">
                      {financing[0].provider}: {financing[0].instrument.toLowerCase()}
                    </Link>
                  </h4>
                  <ul className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 font-display text-sm text-muted">
                    <li>{financing[0].status.label}</li>
                    <li className="tnum">
                      {financing[0].amount.currency} {financing[0].amount.value}
                    </li>
                  </ul>
                </article>
              ) : null}
              {tungsten.length ? (
                <article
                  data-motion-item
                  style={{ "--reveal-order": 2 } as React.CSSProperties}
                  className="border-t border-border-strong pt-4"
                >
                  <p className="label">Tungsten comparison</p>
                  <h4 className="mt-2 font-display text-[0.9375rem] font-medium leading-6">
                    <Link href={tungsten[0].href} className="hover:text-accent">{tungsten[0].title}</Link>
                  </h4>
                  <ul className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 font-display text-sm text-muted">
                    <li>{tungsten[0].jurisdiction}</li>
                    <li>{tungsten[0].status}</li>
                    <li>
                      <Link href="/materials/tungsten" className="link-quiet">Tungsten profile</Link>
                    </li>
                  </ul>
                </article>
              ) : null}
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Method and contact, kept short: the full method lives on /methodology. */}
      <section aria-labelledby="method-heading" className="border-t border-border-strong bg-card">
        <Container width="wide" className="py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-16">
            <div className="min-w-0">
              <h2 id="method-heading" className="font-display text-base font-semibold">
                How each analysis is built
              </h2>
              <ol className="m-0 mt-5 grid list-none gap-x-8 gap-y-6 p-0 sm:grid-cols-2 xl:grid-cols-4">
                {layers.map(([name, note], i) => (
                  <li key={name} className="border-t border-border-strong pt-3">
                    <p className="font-display text-sm font-semibold">
                      <span aria-hidden className="tnum mr-2 text-accent">{i + 1}</span>
                      {name}
                    </p>
                    <p className="mt-1 font-display text-sm leading-6 text-muted">{note}</p>
                  </li>
                ))}
              </ol>
              <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 font-display text-sm text-muted">
                <li><Link href="/methodology" className="link-quiet">Methodology</Link></li>
                <li><Link href="/coverage" className="link-quiet">Coverage</Link></li>
                <li><Link href="/data" className="link-quiet">Data and API</Link></li>
              </ul>
            </div>

            <div className="min-w-0 lg:border-l lg:border-border-strong lg:pl-12">
              <h2 className="font-display text-base font-semibold">Research inquiries</h2>
              <p className="mt-4 font-display text-[0.9375rem] leading-7 text-muted">
                For research collaboration or a commissioned analysis of critical-minerals policy or finance,
                write to Benjamin Yang.
              </p>
              <p className="mt-5">
                <a
                  href="mailto:ben.yang@gwmail.gwu.edu?subject=SMPT%20research%20inquiry"
                  className="research-button-secondary"
                >
                  ben.yang@gwmail.gwu.edu
                </a>
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
