import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Research",
  description: "Source-linked original research from the Strategic Materials Policy Tracker.",
};

export default function ResearchIndex() {
  return (
    <div data-flush-footer>
      <Container width="wide" className="py-12 sm:py-20">
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight sm:text-6xl">Research</h1>
        <div className="mt-12 border-t border-border-strong">
          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted"><p className="font-semibold text-accent">Policy Research</p><p>November 9, 2026</p><p className="mt-2">Benjamin Yang</p></div>
            <div><h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl"><Link href="/research/china-export-control-suspension-extension" className="hover:text-accent">China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027</Link></h2>
            <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">With the November 10 deadline approaching, Beijing has extended its pause on six October 2025 export-control announcements through January 10, 2027. Earlier rare-earth controls remain on a separate track.</p>
            </div>
          </article>

          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted"><p className="font-semibold text-accent">Strategy &amp; Finance</p><p>5 November 2026 cutoff</p><p className="mt-2">Benjamin Yang</p></div>
            <div><h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl"><Link href="/research/escondida-copper" className="hover:text-accent">Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision</Link></h2>
            <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">How Goldman Sachs’ 2027 copper outlook compares with the economics of BHP’s planned $5.4–6.3 billion replacement concentrator.</p>
            </div>
          </article>

          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted">
              <p className="font-semibold text-accent">Strategy &amp; Finance</p>
              <p>5 November 2026</p>
              <p className="mt-2">Benjamin Yang</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl">
                <Link href="/research/hemerdon-financing" className="hover:text-accent">
                  Inside Tungsten West&apos;s £71 Million Restart Financing
                </Link>
              </h2>
              <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">
                The £71 million financing headline includes £10 million of uncommitted borrowing, while the core loan brings a repayment deadline to the mine restart.
              </p>
              
            </div>
          </article>

          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted">
              <p className="font-semibold text-accent">Strategy &amp; Finance</p>
              <p>4 November 2026</p>
              <p className="mt-2">Benjamin Yang</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl">
                <Link href="/research/antimony-supply-resilience" className="hover:text-accent">
                  U.S. Antimony Supply Resilience, 2027–2031
                </Link>
              </h2>
              <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">
                An inventory and sourcing model for a hypothetical defense manufacturer facing an eight-month antimony supply interruption.
              </p>
              
            </div>
          </article>

          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted">
              <p className="font-semibold text-accent">Policy Research</p>
              <p>3 November 2026</p>
              <p className="mt-2">Benjamin Yang</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl"><Link href="/research/tungsten-supply-security" className="hover:text-accent">Tungsten Supply Security</Link></h2>
              <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">From UK mine financing to Japanese processing grants, a look at how four markets are trying to secure tungsten supply.</p>
              
            </div>
          </article>
        </div>
      </Container>
    </div>
  );
}