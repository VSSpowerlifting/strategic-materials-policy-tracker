import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

const pdf = "/research/applied-001/antimony-supply-resilience.pdf";
const model = "/research/applied-001/antimony-supply-resilience-model.xlsx";
const evidence = "/research/applied-001/antimony-evidence-and-assumptions.md";

export const metadata: Metadata = {
  title: "U.S. Antimony Supply Resilience — Strategy & Finance",
  description:
    "A defense-manufacturing procurement strategy case comparing qualified supplier diversification, inventory and prospective domestic offtake, with a source-linked scenario model.",
  alternates: { canonical: "/research/antimony-supply-resilience" },
  openGraph: {
    type: "article",
    url: site.url + "/research/antimony-supply-resilience",
    siteName: site.name,
    title: "U.S. Antimony Supply Resilience | SMPT",
    description: "Supply continuity, inventory working capital and conditional domestic sourcing under 2027–2031 antimony disruption scenarios.",
  },
};

const comparisons = [
  { policy: "Domestic-led", months: "2", uncovered: "22.1 t", cash: "$0.92m", extra: "$768k" },
  { policy: "Diversification-led", months: "3", uncovered: "16.7 t", cash: "$1.38m", extra: "$773k" },
  { policy: "Inventory-led", months: "9", uncovered: "0 t", cash: "$4.13m", extra: "$703k" },
  { policy: "Balanced / conditional", months: "5", uncovered: "0 t", cash: "$2.30m", extra: "$813k" },
] as const;

const sourceLinks = [
  { label: "USGS Mineral Commodity Summaries 2026 — Antimony", href: "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf" },
  { label: "EXIM project-finance transaction register", href: "https://www.exim.gov/solutions/project-and-structured-finance/transactions" },
  { label: "Perpetua Resources June 2026 Form 10-Q", href: "https://www.sec.gov/Archives/edgar/data/1526243/000110465926097134/ppta-20260630x10q.htm" },
  { label: "Idaho National Laboratory antimony processing pilot", href: "https://inl.gov/news-release/inl-hosts-ribbon-cutting-for-pilot-plant-supporting-domestic-antimony-production/" },
  { label: "MOFCOM/GACC antimony export licensing, Announcement 33", href: "https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/dwmygl/art/2024/art_c37e7a6e7438428c951e2b1e488dc47e.html" },
  { label: "MOFCOM Announcement 46 — U.S. military-end-use rule", href: "https://www.mofcom.gov.cn/zfxxgk/gkml/art/2024/art_99f5d51bbe6a412ca309d5818c4dee52.html" },
  { label: "MOFCOM Announcement 72 — temporary clause suspension", href: "https://www.mofcom.gov.cn/zfxxgk/gkml/art/2025/art_43489ca6f2094b70954c25249702b4cc.html" },
] as const;

const downloads = [
  { name: "Executive strategy presentation", detail: "Original 8-slide source-rich PDF", url: pdf },
  { name: "Archivo executive edition (PDF)", detail: "8-slide widescreen alternate", url: "/research/applied-001/antimony-supply-resilience-archivo-executive.pdf" },
  { name: "Editable Archivo presentation (PowerPoint)", detail: "8 editable widescreen slides", url: "/research/applied-001/antimony-supply-resilience-archivo-executive.pptx" },
  { name: "Supply resilience financial model", detail: "13-sheet Excel workbook", url: model },
  { name: "Evidence and assumptions register", detail: "Source-linked methodology", url: evidence },
] as const;

export default function AntimonySupplyResilience() {
  return (
    <div data-flush-footer>
      <section className="border-b border-border-strong">
        <Container width="wide" className="article-hero py-12 sm:py-20">
          <Link href="/research" className="font-display text-sm text-muted underline underline-offset-4 hover:text-accent">
            ← Research
          </Link>
          <p className="mt-8 font-display text-[0.8125rem] font-medium text-accent">
            Strategy &amp; Finance
          </p>
          <h1 className="article-title mt-4 text-foreground">
            U.S. Antimony Supply Resilience
          </h1>
          <p className="standfirst mt-6 max-w-[38rem]">
                  A hypothetical defense manufacturer&rsquo;s choices for keeping antimony supplies moving through disruptions in 2027–2031.
                </p>
          
          <p className="mt-6 font-display text-sm text-muted">
            By <Link href="/about" className="text-foreground underline underline-offset-4">Benjamin Yang</Link>
            {" · "}4 November 2026
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={pdf} target="_blank" rel="noopener noreferrer" className="research-button">
              View the strategy deck (PDF)
            </a>
            <a href={model} target="_blank" rel="noopener noreferrer" className="research-button-secondary">
              Open the Excel model
            </a>
          </div>
        </Container>
      </section>

      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
            <article className="min-w-0 max-w-4xl">
              <section className="border-b border-paper-border pb-10">
                
                <h2 className="article-h2 mt-3">
                  Qualify another supplier before committing to five months of stock
                </h2>
                <p className="mt-5 font-display text-lg leading-8">
                  In the model&rsquo;s severe 2030 case, an eight-month supply interruption can be covered with five months of inventory and an initial stock purchase of about $2.30 million, provided the alternative supplier qualifies. A nine-month, inventory-led approach also covers the disruption, but would tie up about $4.13 million—above the hypothetical buyer&rsquo;s $3 million cash ceiling.
                </p>
                <p className="mt-4 font-display text-lg leading-8">
                  That five-month plan assumes the manufacturer can qualify a separate supplier for 45% of its international sourcing, including checks on grade, refining origin, end-use eligibility and delivery terms. Without that channel, the same strategy would leave 16.5 metric tons of modeled demand unfilled during the severe 2027 interruption.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                
                <h2 className="article-h2 mt-3">
                  U.S. import dependence makes supplier qualification important
                </h2>
                <p className="mt-5 font-display text-base leading-8">
                  The US Geological Survey estimated that the United States relied on net imports for 91% of its antimony in 2025. China accounted for 55% of U.S. antimony metal and oxide imports over 2021–2024. Those national figures help explain the exposure, but a manufacturer still has to confirm whether a proposed supplier can deliver the right grade and form, with verified refining history and products that pass acceptance testing.
                </p>
                <p className="mt-4 font-display text-base leading-8">
                  New domestic supply could eventually reduce that exposure. EXIM lists $2.906 billion for the Stibnite project as <strong>authorized</strong>, while Idaho National Laboratory&rsquo;s 2026 pilot commissioning shows early processing capability. Authorization is not a financing close, and a commissioned pilot is not the same as qualified antimony arriving at a manufacturer&rsquo;s plant. Both projects need further commercial milestones before a buyer can rely on deliveries.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                
                <h2 className="article-h2 mt-3">
                  The balanced option stays within the modeled cash and supply limits
                </h2>
                <p className="mt-4 font-display text-sm leading-7 text-paper-muted">
                  The table assumes a manufacturer using 100 metric tons of contained antimony each year, an eight-month severe interruption in 2030, and the qualified supplier mix and domestic availability specified in the model.
                </p>
                <div className="mt-5 overflow-x-auto border-y border-paper-border">
                  <table className="w-full min-w-[650px] border-collapse font-display text-sm">
                    <caption className="sr-only">2030 modeled severe-disruption comparison across four sourcing strategies</caption>
                    <thead className="bg-elevated text-paper-foreground">
                      <tr>
                        <th scope="col" className="p-3 text-left font-semibold">Strategy</th>
                        <th scope="col" className="p-3 text-right font-semibold">Stock buffer</th>
                        <th scope="col" className="p-3 text-right font-semibold">Unfilled</th>
                        <th scope="col" className="p-3 text-right font-semibold">Stock cash</th>
                        <th scope="col" className="p-3 text-right font-semibold">Annual increment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisons.map((row, index) => (
                        <tr key={row.policy} className={row.policy.startsWith("Balanced") ? "bg-elevated" : index % 2 === 0 ? "bg-paper" : "bg-card"}>
                          <th scope="row" className="border-t border-paper-border p-3 text-left font-semibold">{row.policy}</th>
                          <td className="border-t border-paper-border p-3 text-right">{row.months} mo</td>
                          <td className="border-t border-paper-border p-3 text-right">{row.uncovered}</td>
                          <td className="border-t border-paper-border p-3 text-right">{row.cash}</td>
                          <td className="border-t border-paper-border p-3 text-right">{row.extra}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 font-display text-sm leading-7 text-paper-muted">
                  Stock purchases remain inventory assets. The annual extra cost includes the model&rsquo;s sourcing premiums, holding costs and emergency purchase markups. Figures are rounded from the linked workbook.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                <h2 className="article-h2">
                  What a manufacturer would need to confirm
                </h2>
                <ol className="mt-5 space-y-5 font-display text-base leading-7">
                  <li>
                  <strong>Supplier qualification.</strong> Procurement and engineering teams would verify the grade, refinery, shipment origin, licensing requirements, storage conditions and delivery capacity before relying on the alternative source.
                </li>
                  <li>
                  <strong>Inventory funding.</strong> Finance would check the actual purchase price, storage and replenishment costs against available cash. The case includes a sixth-month purchase option if five months of stock proves insufficient.
                </li>
                  <li>
                  <strong>Domestic offtake.</strong> Any future U.S. sourcing share would depend on documented financing and processing progress, tested product and enforceable delivery terms.
                </li>
                </ol>
              </section>

              <section className="py-10" aria-labelledby="method-heading">
                <h2 id="method-heading" className="article-h2">
                  Sources and assumptions
                </h2>
                <p className="mt-4 font-display text-base leading-8">
                  The case uses SMPT&rsquo;s <Link href="/materials/antimony" className="font-semibold text-paper-accent underline decoration-2 underline-offset-4">antimony records</Link> alongside USGS estimates, government financing and licensing records, laboratory reporting and company filings. It treats announced projects, authorized financing, payments and commercial deliveries as separate events.
                </p>
                <p className="mt-4 font-display text-base leading-8">
                  The manufacturer, its annual demand, sourcing shares, premiums, inventory ceiling and disruptions are hypothetical. The accompanying workbook tests what these assumptions would mean for costs and unfilled demand; it does not project an actual buyer&rsquo;s future supply.
                </p>
                <h3 className="mt-8 font-display text-base font-semibold">Selected original sources</h3>
                <ul className="mt-3 space-y-2 font-display text-sm leading-7">
                  {sourceLinks.map((src) => (
                    <li key={src.href}>
                      <a href={src.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-paper-accent underline decoration-2 underline-offset-4 hover:text-paper-foreground">
                        {src.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 font-display text-sm leading-7 text-paper-muted">
                  Research and source retrieval: 4 November 2026. Suggested citation: Yang, Benjamin.
                  “U.S. Antimony Supply Resilience, 2027–2031.” Strategic Materials Policy Tracker,
                  Applied Strategy 001 (November 2026).
                </p>
              </section>
            </article>

            <aside className="lg:sticky lg:top-32">
              <h2 className="font-display text-[0.8125rem] font-medium text-paper-muted">Downloads</h2>
              <ul className="mt-4 space-y-5 border-l border-paper-border pl-4 font-display">
                {downloads.map((file) => (
                  <li key={file.url}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-paper-accent underline decoration-2 underline-offset-4 hover:text-paper-foreground">{file.name}</a>
                    <span className="mt-1 block text-xs text-paper-muted">{file.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-display text-xs leading-6 text-paper-muted">
                  The Archivo deck is a shorter presentation; the original edition contains more source links.
                </p>
              <div className="mt-9 border-t border-paper-border pt-5">
                <h2 className="font-display text-[0.8125rem] font-medium text-paper-muted">Case parameters</h2>
                <dl className="mt-4 space-y-4 font-display text-sm">
                  <div><dt className="text-paper-muted">Buyer demand</dt><dd className="font-semibold">100 t contained Sb/year</dd></div>
                  <div><dt className="text-paper-muted">Severe interruption</dt><dd className="font-semibold">8 months</dd></div>
                  <div><dt className="text-paper-muted">Inventory cash ceiling</dt><dd className="font-semibold">$3m</dd></div>
                  <div><dt className="text-paper-muted">Supply tolerance</dt><dd className="font-semibold">≤5 t unfilled per event</dd></div>
                </dl>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </div>
  );
}
