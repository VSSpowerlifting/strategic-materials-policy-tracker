import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ResearchCover } from "@/components/editorial/research-cover";

export const metadata: Metadata = {
  title: "Research",
  description: "Source-linked original research from the Strategic Materials Policy Tracker.",
};

/* Shared presentation for the gallery entries: the newest publication leads, the rest hang in two columns. */
const meta = "flex flex-wrap gap-x-5 gap-y-1 font-display text-[0.8125rem] leading-5 text-muted";
const category = "font-medium text-accent";
const card = "grid row-span-2 grid-rows-subgrid content-start items-start gap-y-6";
const cardTitle = "display-3 mt-3 text-foreground";
const cardStandfirst = "mt-3 max-w-[34rem] text-pretty text-[0.9375rem] leading-7 text-muted";
const titleLink = "decoration-border-strong underline-offset-[0.18em] hover:text-accent hover:underline";

export default function ResearchIndex() {
  return (
    <div data-flush-footer>
      <Container width="wide" className="py-14 sm:py-20">
        <header className="title-block settle">
          <h1 className="page-title text-foreground">Research</h1>
          <hr className="sheet-rule rule-draw mt-10 w-full" data-centre="" />
        </header>
        <div className="mt-12 sm:mt-16">
          <article className="grid gap-8 border-b border-border pb-14 lg:grid-cols-12 lg:items-center lg:gap-14 sm:pb-16">
            <ResearchCover data-cover="china-export-control-suspension-extension" data-frame="feature" priority className="lg:col-span-7" />
            <div className="lg:col-span-5">
              <div className={meta}><p className={category}>Policy Research</p><p>November 9, 2026</p><p>Benjamin Yang</p></div>
              <h2 className="display-2 mt-4 text-foreground"><Link href="/research/china-export-control-suspension-extension" className={titleLink}>China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027</Link></h2>
              <p className="mt-5 text-pretty text-base leading-7 text-muted sm:text-[1.0625rem] sm:leading-8">On November 9, China continued the suspension of six October 2025 export-control announcements through January 10, 2027. The April rare-earth controls and a separate U.S.-directed measure follow different schedules.</p>
            </div>
          </article>

          <div className="grid gap-x-12 gap-y-16 pt-14 sm:pt-16 md:grid-cols-2 lg:gap-x-16">
            <article className={card}>
              <ResearchCover data-cover="escondida-copper" />
              <div>
                <div className={meta}><p className={category}>Strategy &amp; Finance</p><p>5 November 2026 cutoff</p><p>Benjamin Yang</p></div>
                <h2 className={cardTitle}><Link href="/research/escondida-copper" className={titleLink}>Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision</Link></h2>
                <p className={cardStandfirst}>How Goldman Sachs’ 2027 copper outlook compares with the economics of BHP’s planned $5.4–6.3 billion replacement concentrator.</p>
              </div>
            </article>

            <article className={card}>
              <ResearchCover data-cover="hemerdon-financing" />
              <div>
                <div className={meta}>
                  <p className={category}>Strategy &amp; Finance</p>
                  <p>5 November 2026</p>
                  <p>Benjamin Yang</p>
                </div>
                <h2 className={cardTitle}>
                  <Link href="/research/hemerdon-financing" className={titleLink}>
                    Inside Tungsten West&apos;s £71 Million Restart Financing
                  </Link>
                </h2>
                <p className={cardStandfirst}>
                  The £71 million financing headline includes £10 million of uncommitted borrowing, while the core loan brings a repayment deadline to the mine restart.
                </p>
              </div>
            </article>

            <article className={card}>
              <ResearchCover data-cover="antimony-supply-resilience" />
              <div>
                <div className={meta}>
                  <p className={category}>Strategy &amp; Finance</p>
                  <p>4 November 2026</p>
                  <p>Benjamin Yang</p>
                </div>
                <h2 className={cardTitle}>
                  <Link href="/research/antimony-supply-resilience" className={titleLink}>
                    U.S. Antimony Supply Resilience, 2027–2031
                  </Link>
                </h2>
                <p className={cardStandfirst}>
                  An inventory and sourcing model for a hypothetical defense manufacturer facing an eight-month antimony supply interruption.
                </p>
              </div>
            </article>

            <article className={card}>
              <ResearchCover data-cover="tungsten-supply-security" />
              <div>
                <div className={meta}>
                  <p className={category}>Policy Research</p>
                  <p>3 November 2026</p>
                  <p>Benjamin Yang</p>
                </div>
                <h2 className={cardTitle}><Link href="/research/tungsten-supply-security" className={titleLink}>Tungsten Supply Security</Link></h2>
                <p className={cardStandfirst}>From UK mine financing to Japanese processing grants, a look at how four markets are trying to secure tungsten supply.</p>
              </div>
            </article>
          </div>
        </div>
      </Container>
    </div>
  );
}
