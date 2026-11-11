import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { HomeMarketPreview } from "@/components/home/home-market-preview";
import { FeaturedCase } from "@/components/home/featured-case";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { site } from "@/lib/site";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Critical minerals research for policy and investment decisions",
  description:
    "Independent policy and financial intelligence on critical minerals, with source-linked research, financial models and industrial-project records.",
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
    description: "China has extended the suspension of six October 2025 export-control measures. The April rare-earth controls follow a separate timetable.",
    href: "/research/china-export-control-suspension-extension",
  },
  {
    category: "Strategy & Finance",
    date: "November 5, 2026",
    title: "Inside Tungsten West’s £71 Million Restart Financing",
    description: "How the loan, equity and conditional borrowing affect Hemerdon's restart financing.",
    href: "/research/hemerdon-financing",
  },
  {
    category: "Strategy & Finance",
    date: "November 4, 2026",
    title: "U.S. Antimony Supply Resilience, 2027–2031",
    description: "An inventory and sourcing model for a hypothetical defense manufacturer facing an eight-month supply interruption.",
    href: "/research/antimony-supply-resilience",
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

      <Container width="wide" className="pb-12 pt-14 sm:pb-14 sm:pt-16 lg:pb-14 lg:pt-20">
        <div className="max-w-[82rem]">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Policy &amp; financial intelligence
          </p>
          <h1 className="mt-5 max-w-[80rem] font-display text-[clamp(3.1rem,7.1vw,6.5rem)] font-semibold leading-[0.99] tracking-[-0.045em] text-balance">
            Critical minerals research for policy and investment decisions.
          </h1>
          <div className="mt-9 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              Independent analysis of government policy, financing agreements and industrial projects,
              supported by financial models and primary-source research.
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link href="/research" className="research-button">Read research</Link>
              <Link href="/events" className="research-button-secondary">Explore the database</Link>
            </div>
          </div>
        </div>
      </Container>

      <FeaturedCase />

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

      <section aria-labelledby="approach-heading" className="border-t border-paper-border bg-paper text-paper-foreground">
        <Container width="wide" className="py-14 sm:py-20">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-paper-accent">How the research works</p>
          <h2 id="approach-heading" className="mt-3 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            From government decisions to commercial implications.
          </h2>
          <div className="mt-9 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { number: "01", title: "Policy", detail: "Government measures and regulatory conditions" },
              { number: "02", title: "Capital", detail: "Financing commitments and investment decisions" },
              { number: "03", title: "Execution", detail: "Project development and industrial capacity" },
              { number: "04", title: "Strategy", detail: "Commercial exposure and investment choices" },
            ].map((part) => (
              <div key={part.number} className="border-t border-paper-border pt-4">
                <span className="font-display text-xs tabular-nums text-paper-muted">{part.number}</span>
                <h3 className="mt-3 font-display text-xl font-semibold">{part.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-paper-muted">{part.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="database-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-accent">Research database &amp; markets</p>
              <h2 id="database-heading" className="mt-3 font-display text-3xl font-semibold">Explore the intelligence</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                Search the policy decisions, financing instruments and industrial projects behind the research.
              </p>
              <nav aria-label="Database sections" className="mt-8 space-y-5">
                {databaseLinks.map((item) => (
                  <Link key={item.href} href={item.href}
                    className="group block border-t border-border-strong pt-4 focus-visible:ring-2 focus-visible:ring-accent">
                    <span className="block font-display text-lg font-semibold group-hover:text-accent">{item.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted">{item.detail}</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 font-display text-sm">
                <Link href="/compare" className="text-accent underline underline-offset-4">Compare governments</Link>
                <Link href="/materials" className="text-accent underline underline-offset-4">Browse materials</Link>
              </div>
            </div>
            <aside aria-label="Market-price preview" className="min-w-0 border-t border-border-strong pt-6 lg:border-t-0 lg:pt-0">
              <ScrollReveal kind="chart"><HomeMarketPreview /></ScrollReveal>
            </aside>
          </div>
        </Container>
      </section>

      <section aria-labelledby="inquiries-heading" className="border-t border-border-strong">
        <Container width="wide" className="py-14 sm:py-16">
          <div className="flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
            <div>
              <h2 id="inquiries-heading" className="font-display text-2xl font-semibold">Research and strategic analysis</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                For research collaborations or project-specific analysis of critical-mineral policy,
                financing and industrial development, get in touch.
              </p>
            </div>
            <a className="research-button-secondary shrink-0" href="mailto:ben.yang@gwmail.gwu.edu?subject=SMPT%20research%20inquiry">
              Discuss an inquiry
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
}
