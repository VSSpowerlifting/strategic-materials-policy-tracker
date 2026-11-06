import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getDatasetSummary } from "@/lib/data";
import { formatDateLong } from "@/lib/format";
import { journeys, site } from "@/lib/site";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Critical minerals policy, financing and industrial development",
  description:
    "Research and source-linked records on government measures, financial commitments and industrial projects in strategic-material supply chains.",
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.name,
    description:
      "Research and source-linked records on government measures, financing and industrial projects.",
  },
};

const featured = [
  {
    category: "Financial Intelligence 002",
    title: "Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision",
    description: "Copper-price exposure, replacement economics and BHP’s capital-allocation decision.",
    href: "/research/escondida-copper",
  },
  {
    category: "Applied Strategy 001",
    title: "U.S. Antimony Supply Resilience, 2027–2031",
    description: "A procurement strategy case comparing sourcing, inventory and domestic offtake.",
    href: "/research/antimony-supply-resilience",
  },
] as const;

export default function Home() {
  const counts = getDatasetSummary();

  return (
    <div data-flush-footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }}
      />

      <Container width="wide" className="py-14 sm:py-24">
        <div className="max-w-4xl">
          <p className="font-display text-sm text-muted">Strategic Materials Policy Tracker</p>
          <h1 className="mt-5 font-serif text-[2.4rem] font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]">
            Research on critical minerals policy, financing and industrial development.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Government measures, capital commitments and industrial projects, supported by source-linked records.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/research" className="research-button">Read research</Link>
            <Link href="/events" className="research-button-secondary">Explore the database</Link>
          </div>
          <p className="mt-7 font-display text-sm text-muted">
            By <Link href="/about" className="underline decoration-border-strong underline-offset-4 hover:text-foreground">Benjamin Yang</Link>
            {" · "}Corpus revised <time dateTime={site.lastUpdated}>{formatDateLong(site.lastUpdated)}</time>
          </p>
        </div>

        <dl className="mt-14 grid max-w-4xl grid-cols-3 gap-5 border-t border-border-strong pt-6 font-display sm:mt-20">
          {[
            [counts.events, "Policy events"],
            [counts.financialCommitments, "Financial instruments"],
            [counts.projects, "Projects"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="tnum mt-2 text-3xl font-semibold sm:text-4xl">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          Selected records, not an exhaustive inventory. <Link href="/coverage" className="underline underline-offset-4 hover:text-foreground">Coverage</Link>
        </p>
      </Container>

      <section aria-labelledby="research-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="research-heading" className="font-serif text-3xl font-medium">Featured research</h2>
            <Link href="/research" className="font-display text-sm text-accent underline underline-offset-4">All research</Link>
          </div>
          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-12">
            {featured.map((item) => (
              <article key={item.href} className="border-t border-border pt-5">
                <p className="font-display text-sm text-muted">{item.category}</p>
                <h3 className="mt-3 max-w-xl font-serif text-2xl leading-tight">
                  <Link href={item.href} className="hover:text-accent">{item.title}</Link>
                </h3>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted">{item.description}</p>
                <Link href={item.href} className="research-text-link">View research</Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="database-heading" className="border-t border-border-strong bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <h2 id="database-heading" className="font-serif text-3xl font-medium">Explore the database</h2>
          <nav aria-label="Database sections" className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
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
          <Link href="/materials" className="mt-8 inline-block font-display text-sm text-paper-accent underline underline-offset-4">
            Browse materials
          </Link>
        </Container>
      </section>
    </div>
  );
}
