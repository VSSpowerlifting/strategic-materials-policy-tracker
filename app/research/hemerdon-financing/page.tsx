import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

const assets = {
  memo: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Financial_Memo.pdf",
  deck: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/dab99c72ad986b54d2f874bd5bdf4cf6644115f0/research/financial-intelligence/hemerdon-phase1c/presentation-v2/SMPT_FI001_Hemerdon_Presentation_v2.pdf",
  originalDeck: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Strategy_Deck.pdf",
  model: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Financial_Model.xlsx",
  editableMemo: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Financial_Memo.docx",
  editableDeck: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/dab99c72ad986b54d2f874bd5bdf4cf6644115f0/research/financial-intelligence/hemerdon-phase1c/presentation-v2/SMPT_FI001_Hemerdon_Presentation_v2.pptx",
  originalEditableDeck: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Strategy_Deck.pptx",
  deckQc: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/dab99c72ad986b54d2f874bd5bdf4cf6644115f0/research/financial-intelligence/hemerdon-phase1c/presentation-v2/publication-qc.md",
  deckSources: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/dab99c72ad986b54d2f874bd5bdf4cf6644115f0/research/financial-intelligence/hemerdon-phase1c/presentation-v2/source-appendix.md",
  appendix: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Evidence_Appendix.md",
  guide: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Model_Guide.md",
  qc: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Publication_QC.md",
} as const;

export const metadata: Metadata = {
  title: "Inside Tungsten West's £71 Million Restart Financing — Financial Intelligence 001",
  description: "Independent SMPT financial research on the National Wealth Fund's Hemerdon investment, loan terms, remaining restart expenditure and bounded financial sensitivities.",
  alternates: { canonical: "/research/hemerdon-financing" },
  openGraph: {
    type: "article",
    url: site.url + "/research/hemerdon-financing",
    siteName: site.name,
    title: "Inside Tungsten West's £71 Million Restart Financing | SMPT FI001",
    description: "Government capital, project expenditure and refinancing risk at Hemerdon.",
  },
};

const sources = [
  {
    label: "National Wealth Fund — August 2026 investment announcement",
    url: "https://www.nationalwealthfund.org.uk/news-and-publications/news/national-wealth-fund-backs-tungsten-west-to-unlock-critical-uk-tungsten-supply/",
  },
  {
    label: "Tungsten West — Annual Report and Accounts 2026",
    url: "https://www.tungstenwest.com/investors",
  },
  {
    label: "Tungsten West — August 2026 financing terms",
    url: "https://www.lse.co.uk/rns/strategic-investment-by-the-uk-government-nwf-yqliknoaeuaxugf.html",
  },
] as const;

const downloads = [
  { title: "Financial research memorandum", type: "8-page PDF", href: assets.memo },
  { title: "Financial strategy presentation · v2", type: "18-slide PDF · 14 main + 4 appendix", href: assets.deck },
  { title: "Financial model", type: "Editable Excel workbook", href: assets.model },
  { title: "Evidence and methodology", type: "Source-linked research appendix", href: assets.appendix },
  { title: "Model guide", type: "Assumptions and scenario interpretation", href: assets.guide },
] as const;

export default function HemerdonFinancing() {
  return (
    <div data-flush-footer>
      <section className="border-b border-border-strong">
        <Container width="wide" className="py-12 sm:py-20">
          <Link href="/research" className="font-display text-sm text-muted underline underline-offset-4 hover:text-accent">
            ← Research
          </Link>
          
          <h1 className="mt-8 max-w-5xl font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            Inside Tungsten West&apos;s £71 Million Restart Financing
          </h1>
          <p className="mt-6 max-w-3xl font-display text-xl leading-8 text-muted">
            The National Wealth Fund’s investment, Hemerdon’s remaining expenditure
            and the refinancing obligations behind the restart.
          </p>
          <p className="mt-6 font-display text-sm text-muted">
            By <Link href="/about" className="underline underline-offset-4 hover:text-accent">Benjamin Yang</Link>
            {" · "}5 November 2026{" · "}Research cutoff: 4 November 2026
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={assets.memo} target="_blank" rel="noopener noreferrer" className="research-button">
              Read the financial memo (PDF)
            </a>
            <a href={assets.deck} target="_blank" rel="noopener noreferrer" className="research-button-secondary">
              View the 18-slide presentation
            </a>
            <a href={assets.model} target="_blank" rel="noopener noreferrer" className="research-button-secondary">
              Open the financial model
            </a>
          </div>
        </Container>
      </section>

      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <article className="min-w-0 max-w-4xl">
              <section className="border-b border-paper-border pb-10">
                
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">
                  The financing strengthens the restart while introducing a near-term repayment timetable
                </h2>
                <p className="mt-5 font-serif text-lg leading-9">
                  The National Wealth Fund&apos;s August transaction brought together £36 million of equity and a £25 million core loan. A further £10 million accordion accounts for the balance of the £71 million headline, although that capacity remains uncommitted. Tungsten West subsequently disclosed that the £25 million loan had been fully drawn by approval of its annual accounts on 2 September 2026. The distinction matters for the restart: equity provides risk-bearing capital without a scheduled principal payment, whereas the loan places a repayment or refinancing obligation alongside the company&apos;s commissioning programme.
                </p>
                <p className="mt-5 font-serif text-lg leading-9">
                  Management reports a fully funded pathway to production and has announced processing progress. Those developments materially improve the position described by the financing announcement, but the short loan tenor makes the timing of payable output, customer collections and replacement funding important to the next stage of commercial execution.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                <h2 className="font-display text-2xl font-semibold">What the £71 million headline contains</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="border-t-4 border-paper-accent bg-white/50 p-5">
                    <p className="font-display text-3xl font-semibold tabular-nums">£36m</p>
                    <p className="mt-2 font-display text-sm font-semibold">Equity</p>
                    <p className="mt-2 font-display text-sm leading-6 text-paper-muted">Gross risk capital reported raised.</p>
                  </div>
                  <div className="border-t-4 border-paper-accent bg-white/50 p-5">
                    <p className="font-display text-3xl font-semibold tabular-nums">£25m</p>
                    <p className="mt-2 font-display text-sm font-semibold">Core loan</p>
                    <p className="mt-2 font-display text-sm leading-6 text-paper-muted">Full draw disclosed by 2 September; repayment obligation.</p>
                  </div>
                  <div className="border border-dashed border-paper-border bg-white/30 p-5">
                    <p className="font-display text-3xl font-semibold tabular-nums">£10m</p>
                    <p className="mt-2 font-display text-sm font-semibold">Uncommitted accordion</p>
                    <p className="mt-2 font-display text-sm leading-6 text-paper-muted">Conditional additional borrowing capacity, not available cash.</p>
                  </div>
                </div>
                <p className="mt-5 font-display text-sm leading-7 text-paper-muted">
                  £61 million gross equity and core-loan financing sits within the £71 million maximum. Amounts represent different instruments and cannot be read as current unrestricted cash.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                <h2 className="font-display text-2xl font-semibold">Remaining expenditure and the tested sensitivities</h2>
                <p className="mt-5 font-serif text-lg leading-9">
                  Tungsten West&apos;s October guidance placed remaining project expenditure at approximately £40–45 million, excluding operating costs. The research uses £42.5 million as a midpoint reference and tests an illustrative £5.75 million increment combining the upper end of the capital range, a company-described delay sensitivity and a separately labeled one-year interest-rate proxy. It is a scenario for analyzing exposure, not a prediction of additional spending.
                </p>
                <p className="mt-5 font-serif text-lg leading-9">
                  A different model exercise returns to the company&apos;s original August funding plan. Deferring all £15 million of anticipated receipts while holding other items fixed produces approximately £2 million negative cash using published aggregate totals, or £1 million using separately rounded details. These results illuminate the plan&apos;s dependence on receipts at that historical point; they do not establish a cash shortage at the November research cutoff. The October stress and August counterfactual have different bases and are not added together.
                </p>
              </section>

              <section className="py-10">
                <h2 className="font-display text-2xl font-semibold">What matters next</h2>
                <p className="mt-5 font-serif text-lg leading-9">
                  The September Elmet offtake agreement gives Hemerdon a documented route to market, while processing and commissioning updates indicate progress toward producing saleable tungsten. Financial performance will ultimately depend on the conversion of those operating milestones into accepted deliveries and collected receipts. For creditors, the decisive information is the executed loan timetable and a reconciled cash and debt schedule; for equity investors, the same operational evidence informs the ability to fund the remaining ramp without unexpected financing costs or dilution.
                </p>
                <p className="mt-5 font-serif text-lg leading-9">
                  The full memo, executive deck and accompanying model examine those relationships in greater depth. The analysis does not estimate current unrestricted cash, a complete funding gap, project valuation, covenant headroom or repayment sufficiency because the public disclosures reviewed do not support those calculations.
                </p>
              </section>
            </article>

            <aside className="min-w-0">
              <div className="border-t border-paper-border pt-5">
                <h2 className="font-display text-sm font-semibold">Downloads</h2>
                <ul className="mt-5 space-y-5">
                  {downloads.map((item) => (
                    <li key={item.title}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="font-display text-base font-semibold text-paper-accent underline underline-offset-4 hover:text-paper-foreground">
                        {item.title}
                      </a>
                      <p className="mt-1 font-display text-sm text-paper-muted">{item.type}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 border-t border-paper-border pt-5">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-paper-accent">Editable editions</p>
                <div className="mt-4 space-y-3 font-display text-sm">
                  <p><a href={assets.editableMemo} className="underline underline-offset-4 hover:text-paper-accent">Word memorandum</a></p>
                  <p><a href={assets.editableDeck} className="underline underline-offset-4 hover:text-paper-accent">PowerPoint presentation · v2 (18 slides)</a></p>
                  <p><a href={assets.deckQc} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-paper-accent">Presentation v2 validation and QC</a></p>
                  <p><a href={assets.deckSources} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-paper-accent">Presentation v2 source and exhibit notes</a></p>
                  <p><a href={assets.qc} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-paper-accent">Original financial research methodology and QC</a></p>
                </div>
              </div>
              <div className="mt-10 border-t border-paper-border pt-5">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-paper-accent">Previous presentation edition</p>
                <p className="mt-3 font-display text-sm leading-6 text-paper-muted">
                  The original ten-slide edition remains available for archival comparison. The financial memo, model and evidence base are unchanged.
                </p>
                <p className="mt-4 font-display text-sm"><a href={assets.originalDeck} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-paper-accent">Original ten-slide PDF</a></p>
                <p className="mt-3 font-display text-sm"><a href={assets.originalEditableDeck} className="underline underline-offset-4 hover:text-paper-accent">Original editable PowerPoint</a></p>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-16">
          <h2 className="font-display text-2xl font-semibold">Sources</h2>
          <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-muted">
            Financial sensitivities are independent analysis, not company forecasts. Source details and assumptions are included with the memo.
          </p>
          <ul className="mt-6 max-w-3xl space-y-3">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-display text-sm text-accent underline underline-offset-4 hover:text-foreground">{s.label}</a>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl font-display text-sm leading-7 text-muted">
            Research uses the stated evidence cutoff and has not undergone independent financial review. It is not investment advice.
          </p>
          <Link href="/research/tungsten-supply-security" className="mt-6 inline-block font-display text-sm text-accent underline underline-offset-4 hover:text-foreground">
            Related research: Tungsten Supply Security
          </Link>
        </Container>
      </section>
    </div>
  );
}
