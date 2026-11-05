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
        <p className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-accent">Independent analysis</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight sm:text-6xl">Research</h1>
        <p className="mt-5 max-w-3xl font-display text-xl leading-8 text-muted">Evidence-led studies connecting government policy to financing, industrial activity and commercial execution across strategic-material supply chains.</p>
        <div className="mt-12 border-t border-border-strong">
          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted">
              <p className="font-semibold text-accent">Financial Intelligence 001</p>
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
                An independent financial assessment of the National Wealth Fund&apos;s Hemerdon investment,
                remaining project expenditure, and refinancing exposure. Includes an eight-page memo,
                ten-slide executive presentation, and editable financial model.
              </p>
              <Link href="/research/hemerdon-financing" className="research-text-link">
                Read the financial case and download the model
              </Link>
            </div>
          </article>

          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted">
              <p className="font-semibold text-accent">Applied Strategy 001</p>
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
                A defense-manufacturing strategy case comparing supplier qualification, sourcing diversification,
                strategic inventory and conditional domestic offtake. Includes an editable cost-exposure and
                resilience model with severe-disruption tests.
              </p>
              <Link href="/research/antimony-supply-resilience" className="research-text-link">
                Read the case and open the financial model
              </Link>
            </div>
          </article>

          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted">
              <p className="font-semibold text-accent">Research Dossier 001</p>
              <p>3 November 2026</p>
              <p className="mt-2">Benjamin Yang</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl"><Link href="/research/tungsten-supply-security" className="hover:text-accent">Tungsten Supply Security</Link></h2>
              <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">How policy instruments translate into financing, industrial development and commercial supply. A comparative examination of China, the European Union, the United Kingdom and Japan.</p>
              <Link href="/research/tungsten-supply-security" className="research-text-link">Read the research and download the dossier</Link>
            </div>
          </article>
        </div>
      </Container>
    </div>
  );
}