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
            <div className="font-display text-sm leading-6 text-muted"><p className="font-semibold text-accent">Policy Analysis 001</p><p>9 November 2026</p><p className="mt-2">Benjamin Yang</p></div>
            <div><h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl"><Link href="/research/china-export-control-suspension-extension" className="hover:text-accent">China Continues the Suspension of Six October 2025 Export-Control Announcements to 10 January 2027</Link></h2>
            <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">Announcement No. 58 of 2026 continues six suspensions from 11 November 2026 to 10 January 2027; the text, what stays in force and what it leaves open.</p>
            </div>
          </article>

          <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="font-display text-sm leading-6 text-muted"><p className="font-semibold text-accent">Financial Intelligence 002</p><p>5 November 2026 cutoff</p><p className="mt-2">Benjamin Yang</p></div>
            <div><h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl"><Link href="/research/escondida-copper" className="hover:text-accent">Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision</Link></h2>
            <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">Financial analysis of copper-price exposure, replacement economics and BHP’s capital-allocation decision.</p>
            </div>
          </article>

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
                An assessment of Hemerdon’s restart financing, remaining project expenditure and refinancing exposure.
              </p>
              
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
                A defense-manufacturing strategy case comparing supplier qualification, inventory and domestic offtake.
              </p>
              
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
              <p className="mt-4 max-w-2xl font-display text-lg leading-8 text-muted">A comparison of tungsten policy, finance and industrial development in China, the EU, the UK and Japan.</p>
              
            </div>
          </article>
        </div>
      </Container>
    </div>
  );
}