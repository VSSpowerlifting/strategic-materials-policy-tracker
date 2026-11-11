import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getAllMaterials } from "@/lib/data";
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
    "Original research and source-linked records on export controls, public financing and industrial projects in strategic-material supply chains.",
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

      {/* Masthead: what the site is, who writes it, and the latest publications. */}
      <Container width="wide" className="py-12 sm:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="kicker">Strategic Materials Policy Tracker</p>
            <h1 className="mt-4 max-w-[17em] font-display text-[2.125rem] font-semibold leading-[1.08] tracking-tight text-balance sm:text-[2.75rem] lg:text-[3.125rem]">
              Research on critical-minerals policy, public finance and industrial projects
            </h1>
            <p className="mt-6 max-w-2xl text-pretty font-display text-[1.0625rem] leading-8 text-muted sm:text-lg">
              Original analysis built on a source-linked record of export controls, government financing and
              project milestones, from the official document to its current status.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/research" className="research-button">Read research</Link>
              <Link href="/events" className="research-button-secondary">Explore records</Link>
            </div>
            <p className="mt-8 font-display text-sm text-muted">
              By{" "}
              <Link href="/about" className="text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-current">
                Benjamin Yang
              </Link>
              {" "}· Record revised <time dateTime={site.revisedOn}>{formatDateLong(site.revisedOn)}</time>
            </p>
          </div>

          <section aria-labelledby="latest-heading" className="min-w-0 self-end">
            <div className="flex items-baseline justify-between gap-4 border-b border-border-strong pb-3">
              <h2 id="latest-heading" className="font-display text-base font-semibold">Latest research</h2>
              <Link href="/research" className="font-display text-sm text-accent underline underline-offset-4">
                All research
              </Link>
            </div>
            <ScrollReveal kind="cards">
              <ol className="divide-y divide-border">
                {featured.map((item, i) => (
                  <li
                    key={item.href}
                    data-motion-item
                    style={{ "--reveal-order": i } as React.CSSProperties}
                    className="py-4"
                  >
                    <p className="font-display text-xs text-muted">
                      <span className="font-semibold text-accent">{item.category}</span>
                      {" · "}
                      <time dateTime={item.date}>{formatDateLong(item.date)}</time>
                    </p>
                    <h3 className="mt-1.5 font-display text-[1.0625rem] font-medium leading-snug text-balance">
                      <Link href={item.href} className="hover:text-accent">{item.title}</Link>
                    </h3>
                  </li>
                ))}
              </ol>
            </ScrollReveal>
          </section>
        </div>
      </Container>

      <FeaturedCase />

      {/* The record and the market layer: where a reader goes after the research. */}
      <section id="tools" aria-labelledby="tools-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <div className="min-w-0">
              <h2 id="tools-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                Records and data
              </h2>
              <p className="mt-3 max-w-xl font-display text-[0.9375rem] leading-7 text-muted">
                Every record links to the official document it comes from. Amounts stay in their original currency.
              </p>
              <nav aria-label="Database sections" className="mt-6">
                <ul className="divide-y divide-border border-y border-border">
                  {journeys.map((journey) => (
                    <li key={journey.href}>
                      <Link
                        href={journey.href}
                        className="group grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
                      >
                        <span className="font-display text-base font-semibold text-foreground group-hover:text-accent">
                          {journey.label}
                        </span>
                        <span className="font-display text-sm leading-6 text-muted">{journeyNotes[journey.href]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <nav aria-label="Materials in scope" className="mt-6">
                <h3 className="font-display text-sm font-semibold">
                  <Link href="/materials" className="hover:text-accent">Materials</Link>
                </h3>
                <ul className="mt-2 flex flex-wrap gap-x-1 gap-y-1 font-display text-sm leading-6">
                  {materials.map((m, i) => (
                    <li key={m.id} className="text-muted">
                      <Link href={`/materials/${m.slug}`} className="text-muted underline decoration-border-strong underline-offset-4 hover:text-foreground hover:decoration-current">
                        {m.nameEn}
                      </Link>
                      {i < materials.length - 1 ? <span aria-hidden className="text-faint"> · </span> : null}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <aside aria-label="Mineral price trends" className="min-w-0">
              <ScrollReveal kind="chart"><HomeMarketPreview /></ScrollReveal>
            </aside>
          </div>

          <div id="examples" className="mt-14 border-t border-border-strong pt-6">
            <h2 className="font-display text-base font-semibold">From the records</h2>
            <ScrollReveal kind="cards" className="mt-5 grid gap-x-10 gap-y-7 md:grid-cols-3">
              {legal ? (
                <article data-motion-item style={{ "--reveal-order": 0 } as React.CSSProperties}>
                  <p className="font-display text-xs font-semibold text-accent">Legal controls</p>
                  <h3 className="mt-2 font-display text-[0.9375rem] font-medium leading-6">
                    <Link href={`/events/${legal.event.id}`} className="hover:text-accent">
                      {legal.event.titleEn}
                    </Link>
                  </h3>
                  <p className="mt-2 font-display text-sm text-muted">
                    {legal.status.label} · <time dateTime={legal.event.date}>{formatDateLong(legal.event.date)}</time>
                    {" · "}
                    <Link href={`/controls/${legal.control.id}`} className="text-accent underline underline-offset-4">
                      View clause
                    </Link>
                  </p>
                </article>
              ) : null}
              {financing.length ? (
                <article data-motion-item style={{ "--reveal-order": 1 } as React.CSSProperties}>
                  <p className="font-display text-xs font-semibold text-accent">Public financing</p>
                  <h3 className="mt-2 font-display text-[0.9375rem] font-medium leading-6">
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
                <article data-motion-item style={{ "--reveal-order": 2 } as React.CSSProperties}>
                  <p className="font-display text-xs font-semibold text-accent">Tungsten comparison</p>
                  <h3 className="mt-2 font-display text-[0.9375rem] font-medium leading-6">
                    <Link href={tungsten[0].href} className="hover:text-accent">{tungsten[0].title}</Link>
                  </h3>
                  <p className="mt-2 font-display text-sm text-muted">
                    {tungsten[0].jurisdiction} · {tungsten[0].status}
                    {" · "}
                    <Link href="/materials/tungsten" className="text-accent underline underline-offset-4">
                      Tungsten profile
                    </Link>
                  </p>
                </article>
              ) : null}
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Method and contact, kept short: the full method lives on /methodology. */}
      <section aria-labelledby="method-heading" className="border-t border-border-strong bg-surface">
        <Container width="wide" className="py-14 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
            <div className="min-w-0">
              <h2 id="method-heading" className="font-display text-xl font-semibold tracking-tight">
                How each analysis is built
              </h2>
              <ol className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
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
              <p className="mt-6 font-display text-sm text-muted">
                <Link href="/methodology" className="text-accent underline underline-offset-4">Methodology</Link>
                {" · "}
                <Link href="/coverage" className="text-accent underline underline-offset-4">Coverage</Link>
                {" · "}
                <Link href="/data" className="text-accent underline underline-offset-4">Data and API</Link>
              </p>
            </div>

            <div className="min-w-0 lg:border-l lg:border-border-strong lg:pl-12">
              <h2 className="font-display text-xl font-semibold tracking-tight">Research inquiries</h2>
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
