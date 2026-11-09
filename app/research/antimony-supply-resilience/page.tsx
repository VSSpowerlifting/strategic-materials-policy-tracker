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
        <Container width="wide" className="py-12 sm:py-20">
          <Link href="/research" className="font-display text-sm text-muted underline underline-offset-4 hover:text-accent">
            ← Research
          </Link>
          <p className="mt-8 font-display text-xs font-semibold uppercase tracking-[0.15em] text-accent">
            Strategy &amp; Finance
          </p>
          <h1 className="mt-6 max-w-5xl font-display text-5xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            U.S. Antimony Supply Resilience
          </h1>
          <p className="mt-4 font-display text-lg text-muted">Strategic options for a defense manufacturer, 2027–2031</p>
          
          <p className="mt-6 font-display text-sm text-muted">
            By <Link href="/about" className="text-foreground underline underline-offset-4">Benjamin Yang</Link>
            {" · "}4 November 2026
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
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
                
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight">
                  Qualify the alternative source, then fund five months of buyer-approved stock
                </h2>
                <p className="mt-5 font-display text-lg leading-8">
                  Under the modeled eight-month severe interruption in 2030, the balanced strategy covers the full
                  disruption with an initial inventory investment of about $2.30 million. A nine-month inventory-led
                  strategy also covers the scenario but ties up about $4.13 million in stock, above the case&apos;s
                  illustrative $3 million cash ceiling.
                </p>
                <p className="mt-4 font-display text-lg leading-8">
                  The five-month policy depends on qualifying a separate 45% international sourcing lane and testing
                  the actual grade, refining origin, end-use eligibility and delivery terms. Failure to qualify that channel leaves 16.5 metric tons of modeled
                  demand unfilled in 2027 under the severe interruption.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  Import dependence and material qualification frame the risk
                </h2>
                <p className="mt-5 font-display text-base leading-8">
                  USGS estimated 91% U.S. net import reliance for antimony in 2025. China supplied 55% of U.S.
                  antimony metal and oxide imports over 2021–2024, a historical import-origin measure. The
                  national indicators establish market exposure; a manufacturer must separately verify product form,
                  upstream refining, traceability, testing and acceptance for its own bill of materials.
                </p>
                <p className="mt-4 font-display text-base leading-8">
                  Public financing may support future U.S. supply. EXIM lists $2.906 billion for Stibnite as
                  <strong> authorized</strong>; financing close, processing arrangements, qualified deliveries and
                  actual buyer supply remain separate milestones. Idaho National Laboratory&apos;s 2026 pilot
                  commissioning demonstrates early processing capability. Commercial qualification
                  and accepted antimony deliveries remain separate milestones.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  A balanced policy meets both modeled 2030 constraints
                </h2>
                <p className="mt-4 font-display text-sm leading-7 text-paper-muted">
                  All values below are calculated for a hypothetical buyer consuming 100 metric tons of contained
                  antimony per year. The event is an eight-month severe interruption with the assumed qualified
                  supplier mix and 2030 domestic availability.
                </p>
                <div className="mt-5 overflow-x-auto border-y border-paper-border">
                  <table className="w-full min-w-[650px] border-collapse font-display text-sm">
                    <caption className="sr-only">2030 modeled severe-disruption comparison across four sourcing strategies</caption>
                    <thead className="bg-paper-foreground text-paper">
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
                        <tr key={row.policy} className={row.policy.startsWith("Balanced") ? "bg-[#f1e4c5]" : index % 2 === 0 ? "bg-paper" : "bg-[#ebe8e0]"}>
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
                  Stock purchase cash is an inventory asset. Annual incremental expense combines illustrative
                  sourcing premiums, inventory carry and disruption-specific emergency procurement markup.
                  Figures are rounded from the linked workbook.
                </p>
              </section>

              <section className="border-b border-paper-border py-10">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Three conditions govern execution
                </h2>
                <ol className="mt-5 space-y-5 font-display text-base leading-7">
                  <li><strong>Supplier qualification.</strong> Procurement and Engineering verify grade, refinery,
                    shipment origin, licensing, storage suitability and independent delivery capability before
                    relying on the alternative sourcing target.</li>
                  <li><strong>Inventory funding.</strong> Finance verifies buyer-specific price, storage,
                    replenishment and cash ceilings. A sixth-month purchase option provides an escalation route
                    when the modeled continuity tolerance is insufficient.</li>
                  <li><strong>Domestic offtake.</strong> Strategy and Legal tie any future domestic share to
                    documented financing, processing, accepted product and enforceable delivery terms.</li>
                </ol>
              </section>

              <section className="py-10" aria-labelledby="method-heading">
                <h2 id="method-heading" className="font-display text-2xl font-semibold tracking-tight">
                  Sources and modeling method
                </h2>
                <p className="mt-4 font-display text-base leading-8">
                  The evidence base combines SMPT&apos;s <Link href="/materials/antimony" className="font-semibold text-paper-accent underline decoration-2 underline-offset-4">
                    antimony records
                  </Link> with USGS, government financing and licensing material, laboratory reporting and issuer filings.
                  Source documents distinguish announced, authorized and disbursed financing from commercial production.
                </p>
                <p className="mt-4 font-display text-base leading-8">
                  The demand, supplier shares, premiums, inventory limits and disruptions are scenario assumptions
                  for a hypothetical manufacturer. The workbook is an episodic cost-exposure and continuity test;
                  it models the cost and continuity consequences of stipulated scenarios
                  for a hypothetical buyer.
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
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper-muted">Downloads</h2>
              <ul className="mt-4 space-y-5 border-l border-paper-border pl-4 font-display">
                {downloads.map((file) => (
                  <li key={file.url}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-paper-accent underline decoration-2 underline-offset-4 hover:text-paper-foreground">{file.name}</a>
                    <span className="mt-1 block text-xs text-paper-muted">{file.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-display text-xs leading-6 text-paper-muted">
                The Archivo edition condenses the analysis for an executive audience. The original presentation retains its more extensive source links.
              </p>
              <div className="mt-9 border-t border-paper-border pt-5">
                <h2 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper-muted">Case parameters</h2>
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
