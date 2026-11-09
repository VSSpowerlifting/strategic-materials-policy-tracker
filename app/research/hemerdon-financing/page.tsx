import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

const assets = {
  memo: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Financial_Memo.pdf",
  deck: "/research/fi001/presentation-v2-archivo.pdf",
  originalDeck: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Strategy_Deck.pdf",
  model: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Financial_Model.xlsx",
  editableMemo: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Financial_Memo.docx",
  editableDeck: "/research/fi001/presentation-v2-archivo.pptx",
  originalEditableDeck: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/raw/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Strategy_Deck.pptx",
  deckQc: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/dab99c72ad986b54d2f874bd5bdf4cf6644115f0/research/financial-intelligence/hemerdon-phase1c/presentation-v2/publication-qc.md",
  deckSources: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/dab99c72ad986b54d2f874bd5bdf4cf6644115f0/research/financial-intelligence/hemerdon-phase1c/presentation-v2/source-appendix.md",
  appendix: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Evidence_Appendix.md",
  guide: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Model_Guide.md",
  qc: "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/e932a9bf30b9f8667daaa307e0f0b35e04d52990/research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Publication_QC.md",
} as const;

export const metadata: Metadata = {
  title: "Inside Tungsten West's £71 Million Restart Financing — Strategy & Finance",
  description: "How the National Wealth Fund's Hemerdon financing is structured, what Tungsten West still needs to spend and when its core loan must be repaid.",
  alternates: { canonical: "/research/hemerdon-financing" },
  openGraph: {
    type: "article",
    url: site.url + "/research/hemerdon-financing",
    siteName: site.name,
    title: "Inside Tungsten West's £71 Million Restart Financing | SMPT",
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
          <p className="mt-8 font-display text-xs font-semibold uppercase tracking-[0.15em] text-accent">Strategy &amp; Finance</p>
          <h1 className="mt-4 max-w-5xl font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            Inside Tungsten West&apos;s £71 Million Restart Financing
          </h1>
          <p className="mt-6 max-w-3xl font-display text-xl leading-8 text-muted">
                  The £71 million headline includes £10 million in borrowing capacity that has yet to be committed, while a short-term loan adds a repayment deadline to the mine's restart.
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
                  Hemerdon's financing brings new capital and a near-term repayment obligation
                </h2>
                <p className="mt-5 font-display text-lg leading-9">
                  In August, the National Wealth Fund provided for £36 million in equity and a £25 million core loan to support Tungsten West's Hemerdon restart. Another £10 million could become available through an accordion facility, but that borrowing remains uncommitted. Tungsten West reported that the £25 million loan had been fully drawn by the time its annual accounts were approved on 2 September 2026. Unlike the equity, the loan carries a repayment or refinancing obligation as the company brings the mine back into production.
                </p>
                <p className="mt-5 font-display text-lg leading-9">
                  Tungsten West says it has a fully funded route to production and has reported progress on processing and commissioning. Even with that progress, the short loan maturity makes the timing of saleable output and customer payments important: the company will need cash from operations or replacement financing when the debt comes due.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                <h2 className="font-display text-2xl font-semibold">What the £71 million headline contains</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="border-t-4 border-paper-accent bg-white/50 p-5">
                    <p className="font-display text-3xl font-semibold tabular-nums">£36m</p>
                    <p className="mt-2 font-display text-sm font-semibold">Equity</p>
                    <p className="mt-2 font-display text-sm leading-6 text-paper-muted">
                  Equity capital reported raised.
                </p>
                  </div>
                  <div className="border-t-4 border-paper-accent bg-white/50 p-5">
                    <p className="font-display text-3xl font-semibold tabular-nums">£25m</p>
                    <p className="mt-2 font-display text-sm font-semibold">Core loan</p>
                    <p className="mt-2 font-display text-sm leading-6 text-paper-muted">
                  Fully drawn by 2 September 2026; repayment required.
                </p>
                  </div>
                  <div className="border border-dashed border-paper-border bg-white/30 p-5">
                    <p className="font-display text-3xl font-semibold tabular-nums">£10m</p>
                    <p className="mt-2 font-display text-sm font-semibold">Uncommitted accordion</p>
                    <p className="mt-2 font-display text-sm leading-6 text-paper-muted">
                  Additional borrowing subject to a further commitment.
                </p>
                  </div>
                </div>
                <p className="mt-5 font-display text-sm leading-7 text-paper-muted">
                  The £36 million equity investment and £25 million core loan make up £61 million of the package. The remaining £10 million is a financing option, rather than money already committed. Cash available for the restart also depends on spending and debt payments.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                <h2 className="font-display text-2xl font-semibold">
                  The restart still needs £40–45 million of project spending
                </h2>
                <p className="mt-5 font-display text-lg leading-9">
                  Tungsten West's October guidance put remaining project expenditure at approximately £40–45 million, before operating costs. The model uses £42.5 million as a midpoint and tests an illustrative £5.75 million increase made up of the top end of that spending range, a delay sensitivity described by the company and a separately identified one-year interest proxy. These are scenario assumptions, rather than an updated company funding forecast.
                </p>
                <p className="mt-5 font-display text-lg leading-9">
                  The original August financing plan also depended on £15 million in anticipated receipts. In a separate model exercise, delaying all those receipts while holding the other assumptions fixed leaves approximately £2 million of negative cash using the published aggregate figures, or £1 million using the separately rounded details. That result describes the August plan under a hypothetical delay; it is not a current cash balance or the same test as the October cost scenario.
                </p>
              </section>

              <section className="py-10">
                <h2 className="font-display text-2xl font-semibold">
                  Accepted shipments and the loan timetable are the next tests
                </h2>
                <p className="mt-5 font-display text-lg leading-9">
                  The September offtake agreement with Elmet gives Hemerdon a contracted buyer, while the company's processing updates show progress toward saleable tungsten. For the restart to generate cash, those steps must lead to accepted deliveries and collected payments. Lenders will be looking at the loan's actual repayment schedule alongside operating receipts; shareholders also have reason to watch the cost of any further financing as production ramps up.
                </p>
                <p className="mt-5 font-display text-lg leading-9">
                  The accompanying memo and model set out the financing and sensitivity calculations in more detail. Public filings do not yet establish unrestricted cash available today, a fully reconciled funding gap, valuation, covenant headroom or whether future receipts will cover repayment. Those questions require newer financial disclosures.
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
              <details className="mt-10 border-t border-paper-border pt-5 font-display text-sm">
                  <summary className="cursor-pointer font-semibold">Earlier presentation (10 slides)</summary>
                  <div className="mt-4 space-y-3 text-paper-muted">
                    <p><a href={assets.originalDeck} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-paper-accent">Original PDF</a></p>
                    <p><a href={assets.originalEditableDeck} className="underline underline-offset-4 hover:text-paper-accent">Original PowerPoint</a></p>
                  </div>
                </details>
            </aside>
          </div>
        </Container>
      </section>

      <section className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-16">
          <h2 className="font-display text-2xl font-semibold">Sources</h2>
          <p className="mt-4 max-w-3xl font-display text-lg leading-8 text-muted">
                  The sensitivity figures are SMPT calculations using the assumptions described in the memo, rather than forecasts issued by Tungsten West.
                </p>
          <ul className="mt-6 max-w-3xl space-y-3">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-display text-sm text-accent underline underline-offset-4 hover:text-foreground">{s.label}</a>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl font-display text-sm leading-7 text-muted">
                  This research reflects the stated evidence cutoff. Financial checking was internal, and external review remains outstanding. Investment decisions require an independent assessment.
                </p>
          <Link href="/research/tungsten-supply-security" className="mt-6 inline-block font-display text-sm text-accent underline underline-offset-4 hover:text-foreground">
            Related research: Tungsten Supply Security
          </Link>
        </Container>
      </section>
    </div>
  );
}
