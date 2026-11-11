import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { HomeMarketPreview } from "@/components/home/home-market-preview";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { site } from "@/lib/site";
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


const featured = [
  {
    category: "Policy Research",
    date: "November 9, 2026",
    title: "China Extends Export-Control Suspension Through January 10, 2027",
    description: "Six October 2025 measures remain suspended. The April rare-earth controls follow a different schedule.",
    href: "/research/china-export-control-suspension-extension",
  },
  {
    category: "Strategy & Finance",
    date: "November 5, 2026",
    title: "Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision",
    description: "The investment case for BHP's replacement concentrator under different copper-price assumptions.",
    href: "/research/escondida-copper",
  },
  {
    category: "Strategy & Finance",
    date: "November 5, 2026",
    title: "Inside Tungsten West’s £71 Million Restart Financing",
    description: "The terms of Hemerdon's financing package and what remains to fund the restart.",
    href: "/research/hemerdon-financing",
  },
] as const;

const databaseLinks = [
  { href: "/events", label: "Policy", detail: "Government actions and export controls" },
  { href: "/capital", label: "Capital", detail: "Financing commitments and instruments" },
  { href: "/projects", label: "Projects", detail: "Mines, processing plants and manufacturing" },
] as const;

export default function Home() {
  const [latest, ...more] = featured;
  return (
    <div data-flush-footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }}
      />

      <Container width="wide" className="py-14 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16">
          <div>
            <p className="font-display text-sm text-muted">Independent research by Benjamin Yang</p>
            <h1 className="mt-5 max-w-3xl font-display text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-balance sm:text-5xl lg:text-[3.2rem]">
              Critical minerals policy, financing and industrial development.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Research and original records on government policy, public investment and strategic-material projects.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/research" className="research-button">Read research</Link>
              <Link href="/events" className="research-button-secondary">Explore the database</Link>
            </div>
          </div>
          <aside aria-label="Market-price preview" className="min-w-0 border-t border-border-strong pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <ScrollReveal kind="chart"><HomeMarketPreview /></ScrollReveal>
          </aside>
        </div>
      </Container>

      <section id="research" aria-labelledby="research-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-14 sm:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="research-heading" className="font-display text-3xl font-medium">Latest research</h2>
            <Link href="/research" className="font-display text-sm text-accent underline underline-offset-4">All research</Link>
          </div>
          <article className="mt-9 max-w-4xl">
            <p className="text-sm text-muted">{latest.category} · {latest.date}</p>
            <h3 className="mt-3 font-display text-2xl font-medium leading-tight sm:text-4xl">
              <Link href={latest.href} className="hover:text-accent">{latest.title}</Link>
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{latest.description}</p>
          </article>
          <div className="mt-12 grid gap-8 border-t border-border pt-7 md:grid-cols-2 md:gap-12">
            {more.map((item) => (
              <article key={item.href}>
                <p className="text-sm text-muted">{item.category} · {item.date}</p>
                <h3 className="mt-2 font-display text-xl font-medium leading-snug sm:text-2xl">
                  <Link href={item.href} className="hover:text-accent">{item.title}</Link>
                </h3>
                <p className="mt-3 max-w-prose text-sm leading-6 text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="database-heading" className="border-t border-border-strong bg-paper text-paper-foreground">
        <Container width="wide" className="py-14 sm:py-20">
          <h2 id="database-heading" className="font-display text-3xl font-medium">Explore the database</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-paper-muted">
            Search the source records behind government measures, financing and industrial projects.
          </p>
          <nav aria-label="Database sections" className="mt-9 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {databaseLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group border-t border-paper-border pt-5">
                <span className="block font-display text-xl font-medium group-hover:underline">{item.label}</span>
                <span className="mt-2 block text-sm leading-6 text-paper-muted">{item.detail}</span>
              </Link>
            ))}
          </nav>
          <p className="mt-10 text-sm">
            <Link href="/compare" className="text-paper-accent underline underline-offset-4 hover:text-paper-foreground">Compare materials and government approaches</Link>
            <span className="mx-3 text-paper-muted">·</span>
            <Link href="/materials" className="text-paper-accent underline underline-offset-4 hover:text-paper-foreground">Browse materials</Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
