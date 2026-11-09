import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tungsten Supply Security — Policy Research",
  description: "A comparison of tungsten export controls, financing and industrial projects across China, the European Union, the United Kingdom and Japan.",
  alternates: { canonical: "/research/tungsten-supply-security" },
  openGraph: {
    type: "article",
    url: `${site.url}/research/tungsten-supply-security`,
    siteName: site.name,
    title: "Tungsten Supply Security | SMPT",
    description: "How tungsten policy is taking shape through mines, processing plants, export licensing and public finance in four markets.",
  },
};

const introduction = [
  "According to the US Geological Survey's rounded estimates, China accounted for about 79% of mined tungsten content worldwide in 2025. For buyers, that concentration extends beyond the mine: tungsten must also move through chemical conversion, powder production and fabrication before it reaches many industrial users. Securing ore alone does not guarantee a usable supply.",
  "Across China, the European Union, the United Kingdom and Japan, governments are pursuing different ways to secure that supply. Some regulate exports. Others back mines, support processing capacity or designate projects for faster administrative treatment. Looking at the financing and company disclosures alongside the official measures shows how far each effort has moved toward production.",
] as const;

const sections = [
  {
    heading: "Hemerdon's £71 million package includes a loan that must be repaid",
    id: "section-1",
    paragraphs: [
      "In August 2026, the UK's National Wealth Fund announced up to £71 million for Tungsten West's Hemerdon restart: £36 million in equity, a £25 million core loan and another £10 million of potential lending under an accordion facility. The final £10 million depends on a further commitment, so the headline package is larger than the financing already arranged. The company's accounts provide a separate check on how much of the core loan was drawn.",
      "Tungsten West reported that the £25 million core loan was fully drawn by 2 September 2026, when its FY2026 accounts were approved. With the financial year having ended on 31 March, the accounts recorded this as a subsequent event. They establish that the financing had been drawn by the approval date, although they do not identify the exact transfer date.",
      "The mix of equity and borrowing matters as Hemerdon moves toward production. The August terms describe a proposed secured loan with a short maturity and escalating interest, while the wider £88 million funding plan also accounts for bridge-finance repayment and forecast revenue. How much public money adds to actual mine spending depends on where the proceeds go and what financing would otherwise have been available.",
    ],
    sources: [
      { label: "National Wealth Fund announcement", url: "https://www.nationalwealthfund.org.uk/news-and-publications/news/national-wealth-fund-backs-tungsten-west-to-unlock-critical-uk-tungsten-supply/" },
      { label: "issuer financing terms", url: "https://www.lse.co.uk/rns/strategic-investment-by-the-uk-government-nwf-yqliknoaeuaxugf.html" },
      { label: "Tungsten West annual accounts", url: "https://www.tungstenwest.com/investors" },
    ],
  },
  {
    heading: "Processing at Hemerdon began before the August funding announcement",
    id: "section-2",
    paragraphs: [
      "Tungsten West's accounts and August announcement describe commissioning and initial concentrate activity in July 2026, ahead of the public financing announcement on 25 August. Ore processing was already under way as the funding package was being announced. That sequence matters when attributing the restart's operational progress to government financing.",
      "The prospect of public support may have informed decisions made earlier, and drawn funds can help pay for the subsequent ramp-up. The disclosed record establishes processing activity and full core-loan drawdown, but does not show how much extra production the loan itself made possible. Sustained output and customer deliveries are the next useful measures of the restart.",
      "In September, Tungsten West announced a binding eight-year tungsten offtake agreement with Elmet, with variable pricing linked to APT benchmarks. Elmet furnished its 22 September release as Exhibit 99.1 under Item 7.01 of an SEC Form 8-K. The deal gives the mine a contracted route to an allied conversion partner. Its commercial value will become clearer once concentrate is delivered, processed and paid for.",
    ],
    sources: [
      { label: "Tungsten West processing announcement", url: "https://www.lse.co.uk/rns/processing-operations-commence-during-visit-by-nwf-tc6mhjidfgjazfe.html?mobile_view=desktop" },
      { label: "offtake announcement", url: "https://www.lse.co.uk/rns/strategic-tungsten-supply-and-offtake-agreement-oqvcvuui6u6kzx7.html" },
      { label: "Elmet's furnished Exhibit 99.1", url: "https://www.sec.gov/Archives/edgar/data/2101698/000121390026102242/ea030607301ex99-1.htm" },
    ],
  },
  {
    heading: "EU tungsten projects are at very different stages",
    id: "section-3",
    paragraphs: [
      "Under the EU Critical Raw Materials Act, Strategic Project designation can help qualifying projects navigate permitting and financing channels. The selected tungsten projects span extraction, processing and recycling, but receiving the same designation does not mean they are equally close to production.",
      "El Moto received recognition in March 2025. Its developer described the mine as under construction in 2026 and targeted first production in the first quarter of 2029. The EU APT Tungsten Plant, added to the October 2026 list, was still being evaluated for potential technical partnerships, with a final investment decision pending. These are different starting points for measuring what designation achieves.",
      "Article 11 of the Critical Raw Materials Act provides permitting time limits for qualifying EU Strategic Projects, subject to specific triggers, exclusions and extensions. Those clocks concern regulatory procedures, not the time needed to build a mine or plant. The October decision was adopted on 9 October and published on 22 October 2026; its notification date still requires verification under EU law.",
      "For either project, the more useful evidence will be a permitting decision, financing close or construction milestone. Those records can show whether designation helped a project advance beyond its status when it was selected.",
    ],
    sources: [
      { label: "El Moto construction disclosure", url: "https://abtungsten.es/en/2026/09/18/abenojar-tungsten-inaugura-la-mina-de-tungsteno-y-oro-el-moto/" },
      { label: "APT proposal disclosure", url: "https://abtungsten.es/en/2026/10/09/abenojar-tungstens-proposed-apt-plant-designated-as-a-second-european-strategic-project/" },
      { label: "EU Strategic Project permitting guidance", url: "https://europa.eu/youreurope/business/growing/industrial-permitting-licensing/critical-raw-materials-projects/index_en.htm" },
    ],
  },
  {
    heading: "Japan is funding the conversion stages of tungsten supply",
    id: "section-4",
    paragraphs: [
      "Japan's supported projects focus on turning tungsten inputs into materials manufacturers can use. Allied Material plans new powder and tungsten-carbide equipment and a plant intended to lift capacity to roughly 1.5 times the existing level, with operations targeted for the first half of fiscal 2028. Japan New Metals plans to expand its Akita operation to process scrap into ammonium paratungstate (APT).",
      "JOGMEC lists grant decisions of approximately ¥7.5 billion for Allied Material and ¥2 billion for Japan New Metals. The latter is a more advanced funding status than the earlier announcement captured in SMPT's frozen project data. Still, an award decision and a paid grant are different events; neither by itself establishes that equipment has been installed or additional tungsten has been produced.",
      "Mitsubishi Materials reports about ¥8 billion in planned investment for the Japan New Metals programme and a target of 2,400 tonnes of annual APT capacity, expressed as WO3 equivalent, with operations scheduled for April 2029. The figure is planned total capacity in a specified chemical equivalent, which matters when comparing it with production targets for other tungsten products.",
    ],
    sources: [
      { label: "JOGMEC grant decisions", url: "https://www.jogmec.go.jp/activities/metal/critical-grant.html" },
      { label: "Allied Material disclosure", url: "https://www.allied-material.co.jp/dcms_media/other/NewsRelease_20260409.pdf" },
      { label: "Mitsubishi Materials expansion disclosure", url: "https://news.mmc.co.jp/corporate/en/newsroom/press/news20260909.html" },
    ],
  },
  {
    heading: "China's tungsten controls depend on the specific product",
    id: "section-5",
    paragraphs: [
      "China's Announcement No. 10 of 4 February 2025 requires export permission for specified tungsten products and production technologies. Its coverage includes particular forms of APT, oxides, carbides, solid tungsten and alloys, with technical thresholds for some items. Those specifications determine which exports fall under the rule.",
      "To understand how the controls affect trade, the next evidence needed is item-specific: licence applications, approvals and denials, processing times, enforcement records and shipments. Mine construction figures address a different question.",
    ],
    sources: [
      { label: "MOFCOM/GACC announcement in Chinese", url: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_e623090907fc4e1092f0a4db72f57b95.html" },
    ],
  },
  {
    heading: "What will show whether the projects deliver",
    id: "section-6",
    paragraphs: [
      "For Hemerdon, the test is sustained production and accepted deliveries alongside the loan's repayment schedule. For Japan's conversion plants, grant awards will need to be followed by spending, installation and saleable output. EU designations will matter most when projects obtain permits, finance and construction progress. China's licensing system needs to be assessed through actual transactions.",
      "This comparison draws on SMPT data frozen at commit `4fc59c7ea38ca788eb7537353274a953c90e13eb` and official and corporate disclosures available through 3 November 2026. The selected records cover 11 events, eight projects, eight designations, six financing rows and two control clauses. Several refer to the same underlying projects or interventions, so the record counts are not counts of independent outcomes.",
      "Across the four markets, the point at which a policy becomes useful to a buyer varies. A licence decision, a loan drawdown and a plant opening each show a different stage of implementation. Ultimately, reliable supply will depend on whether the relevant material reaches customers in a usable form and on workable commercial terms.",
    ],
    sources: [
    ],
  },
] as const;

const comparison = [
  { jurisdiction: "China", instrument: "Export licensing", implementation: "Controls on specified tungsten products and technologies introduced in February 2025" },
  { jurisdiction: "European Union", instrument: "Strategic Project designation", implementation: "El Moto under construction; separately designated APT plant at proposal stage" },
  { jurisdiction: "United Kingdom", instrument: "Equity and lending", implementation: "£25 million Hemerdon core loan reported fully drawn by 2 September 2026" },
  { jurisdiction: "Japan", instrument: "Industrial grants", implementation: "Grant decisions for tungsten powder, carbide and recycled-feedstock conversion projects" },
] as const;

const downloads = [
  { label: "Full research dossier", detail: "23-page PDF", href: "/research/r001/tungsten-supply-security.pdf" },
  { label: "Executive memo", detail: "2-page PDF", href: "/research/r001/tungsten-supply-security-memo.pdf" },
  { label: "Source-linked evidence workbook", detail: "XLSX", href: "/research/r001/tungsten-supply-security-evidence.xlsx" },
  { label: "LinkedIn presentation", detail: "Original 8-page portrait PDF", href: "/research/r001/tungsten-supply-security-slides.pdf" },
  { label: "Archivo executive edition (PDF)", detail: "8-slide widescreen alternate", href: "/research/r001/tungsten-supply-security-archivo-executive.pdf" },
  { label: "Editable Archivo presentation (PowerPoint)", detail: "8 editable widescreen slides", href: "/research/r001/tungsten-supply-security-archivo-executive.pptx" },
] as const;

export default function TungstenResearchDossier() {
  return (
    <div data-flush-footer>
      <section className="border-b border-border-strong">
        <Container width="wide" className="py-12 sm:py-20">
          <Link href="/research" className="font-display text-sm text-muted underline underline-offset-4 hover:text-accent">← Research</Link>
          <p className="mt-8 font-display text-xs font-semibold uppercase tracking-[0.15em] text-accent">Policy Research</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-medium leading-[1.1] tracking-tight sm:text-6xl">Tungsten Supply Security</h1>
          <p className="mt-5 max-w-3xl font-display text-xl leading-8 text-muted sm:text-2xl">Policy, financing and industrial development across China, the EU, the UK and Japan.</p>
          <p className="mt-7 font-display text-sm text-muted">By <Link href="/about" className="text-foreground underline underline-offset-4">Benjamin Yang</Link> · Research cutoff <time dateTime="2026-11-03">3 November 2026</time></p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={downloads[0].href} className="research-button" download>Download the full dossier (PDF)</a>
            <a href={downloads[1].href} className="research-button-secondary" download>Executive memo (PDF)</a>
          </div>
        </Container>
      </section>
      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-16">
            <article className="max-w-4xl min-w-0">
              <div className="space-y-5 border-b border-paper-border pb-9">
                {introduction.map((paragraph) => (
                  <p key={paragraph} className="font-display text-[1.125rem] leading-[1.85] sm:text-[1.2rem]">{paragraph}</p>
                ))}
              </div>
              <section aria-labelledby="comparison-heading" className="border-b border-paper-border py-10">
                
                <h2 id="comparison-heading" className="mt-3 font-display text-xl font-bold tracking-tight sm:text-2xl">Policy instruments and recorded implementation</h2>
                <div className="mt-5 overflow-x-auto border-y border-paper-border">
                  <table className="w-full min-w-[560px] border-collapse text-left font-display text-sm leading-6">
                    <caption className="sr-only">Selected tungsten policy measures in China, the European Union, the United Kingdom and Japan</caption>
                    <thead className="bg-paper-foreground text-paper">
                      <tr>
                        <th scope="col" className="w-[22%] px-3 py-3 font-semibold">Jurisdiction</th>
                        <th scope="col" className="w-[26%] px-3 py-3 font-semibold">Instrument</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Documented implementation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((entry, index) => (
                        <tr key={entry.jurisdiction} className={index % 2 === 0 ? "bg-paper" : "bg-[#ebe8e0]"}>
                          <th scope="row" className="border-t border-paper-border px-3 py-3 align-top font-semibold">{entry.jurisdiction}</th>
                          <td className="border-t border-paper-border px-3 py-3 align-top">{entry.instrument}</td>
                          <td className="border-t border-paper-border px-3 py-3 align-top">{entry.implementation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              {sections.map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-28 border-b border-paper-border py-10 sm:py-12">
                  
                  <h2 id={`${section.id}-heading`} className="mt-3 font-display text-[1.8rem] font-medium leading-[1.2] tracking-tight sm:text-[2.1rem]">{section.heading}</h2>
                  <div className="mt-6 space-y-5 xl:columns-2 xl:gap-9">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="break-inside-avoid font-display text-[1.025rem] leading-[1.8]">{paragraph}</p>
                    ))}
                  </div>
                  {section.sources.length > 0 && (
                    <div className="mt-6 border-l-2 border-paper-accent pl-4">
                      <h3 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper-muted">Underlying sources</h3>
                      <ul className="mt-2 space-y-2 font-display text-sm leading-6">
                        {section.sources.map((source) => (
                          <li key={source.url}>
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-paper-accent underline decoration-current decoration-2 underline-offset-4 hover:text-paper-foreground">{source.label}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
              <section aria-labelledby="research-record-heading" className="pt-10">
                <h2 id="research-record-heading" className="font-display text-base font-semibold">Research record</h2>
                <p className="mt-3 font-display text-sm leading-7 text-paper-muted">Research cutoff: 3 November 2026. The comparison uses the SMPT dataset frozen at GitHub commit <a href="https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/commit/4fc59c7ea38ca788eb7537353274a953c90e13eb" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-2 underline-offset-4">4fc59c7</a>, supplemented by the original sources linked above. The complete dossier contains the supporting exhibits, original-source register and methodology.</p>
                <p className="mt-4 font-display text-sm text-paper-muted">Suggested citation: Yang, Benjamin. “Tungsten Supply Security.” Strategic Materials Policy Tracker, Research Dossier 001 (November 2026).</p>
              </section>
            </article>
            <aside className="lg:sticky lg:top-32">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper-muted">In this report</h2>
              <nav aria-label="Report sections" className="mt-4">
                <ol className="space-y-3 border-l border-paper-border pl-4 font-display text-sm leading-5">
                  {sections.map((section) => (
                    <li key={section.id}><a href={`#${section.id}`} className="text-paper-muted hover:text-paper-accent">{section.heading}</a></li>
                  ))}
                </ol>
              </nav>
              <div className="mt-10 border-t border-paper-border pt-5">
                <h2 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper-muted">Files</h2>
                <ul className="mt-3 space-y-3 font-display text-sm">
                  {downloads.map((file) => (
                    <li key={file.href}><a href={file.href} download className="font-semibold text-paper-accent underline decoration-2 underline-offset-4 hover:text-paper-foreground">{file.label}</a><span className="block text-xs text-paper-muted">{file.detail}</span></li>
                  ))}
                </ul>
                <p className="mt-4 font-display text-xs leading-6 text-paper-muted">
                  The Archivo edition is a condensed, editable executive presentation. The original portrait PDF and research cutoff remain unchanged.
                </p>
              </div>
              
            </aside>
          </div>
        </Container>
      </section>
    </div>
  );
}