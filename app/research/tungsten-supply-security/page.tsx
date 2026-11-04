import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tungsten Supply Security — Research Dossier 001",
  description: "Original SMPT research comparing how tungsten policy instruments translate into finance, industrial development, export licensing and commercial supply in China, the EU, the UK and Japan.",
  alternates: { canonical: "/research/tungsten-supply-security" },
  openGraph: {
    type: "article",
    url: `${site.url}/research/tungsten-supply-security`,
    siteName: site.name,
    title: "Tungsten Supply Security | SMPT Research Dossier 001",
    description: "Financing, mine operations, strategic project recognition and conversion capacity across China, the EU, the UK and Japan.",
  },
};

const introduction = [
  "China accounted for approximately 79% of world mined tungsten content in 2025, according to the US Geological Survey's rounded estimates. The concentration matters because usable tungsten reaches buyers through several stages: extraction, chemical conversion, powder production and fabrication. Each stage imposes different technical, financial and commercial requirements.",
  "SMPT's first research dossier examines selected tungsten policy measures in China, the European Union, the United Kingdom and Japan. The study connects official legal instruments and programme decisions to financing terms, project disclosures and commercial arrangements. The evidence shows implementation occurring through distinct mechanisms: licensing, project designation, loan drawdown, mine processing and conversion-capacity grants.",
] as const;

const sections = [
  {
    heading: "The UK's £71 million package contains equity, lending and contingent capacity",
    id: "section-1",
    paragraphs: [
      "The National Wealth Fund's August 2026 announcement described an investment of up to £71 million to support Tungsten West's Hemerdon restart. Its components comprise £36 million in equity, a £25 million core loan and a further £10 million lending accordion dependent on subsequent commitment. The full headline measures the potential package; the financial statements identify the core facility's actual drawdown.",
      "Tungsten West's FY2026 accounts disclose that the £25 million NWF core loan was fully drawn by the date the accounts were approved, 2 September 2026. Because the financial year ended on 31 March, that funding is presented as a subsequent event. The disclosure establishes financial execution by the approval date; the precise transfer date requires transaction-level records.",
      "The financing also creates obligations. The August terms describe a proposed secured, short-maturity loan carrying escalating interest. The wider £88 million funding plan includes bridge-finance repayment and forecast revenue. Gross public capital therefore encompasses instruments with different risk and repayment characteristics. Its contribution to additional industrial spending depends on the allocation of proceeds and the counterfactual financing path.",
    ],
    sources: [
      { label: "National Wealth Fund announcement", url: "https://www.nationalwealthfund.org.uk/news-and-publications/news/national-wealth-fund-backs-tungsten-west-to-unlock-critical-uk-tungsten-supply/" },
      { label: "issuer financing terms", url: "https://www.lse.co.uk/rns/strategic-investment-by-the-uk-government-nwf-yqliknoaeuaxugf.html" },
      { label: "Tungsten West annual accounts", url: "https://www.tungstenwest.com/investors" },
    ],
  },
  {
    heading: "Hemerdon's operating chronology complicates attribution to the public loan",
    id: "section-2",
    paragraphs: [
      "Tungsten West reported ore processing and phased commissioning during its 2026 restart. The company's accounts and August announcement also describe commissioning and initial concentrate activity during July, before the public financing announcement on 25 August. Those dates establish an industrial sequence in which operating preparations preceded the announcement.",
      "Anticipated financial support could have influenced earlier decisions, and subsequently provided capital could support further ramp-up. Estimating the incremental output attributable to government finance requires an alternative production and financing scenario. The documentary record currently establishes reported processing and full core-loan drawdown; sustained output and deliveries form the next operational tests.",
      "In September, Tungsten West also announced a binding eight-year commercial tungsten offtake with Elmet, using variable pricing linked to APT benchmarks. Elmet's 22 September release was furnished as Exhibit 99.1 under Item 7.01 of its SEC Form 8-K. The commercial agreement establishes a contractual route to an allied conversion partner. Realized deliveries, revenue and downstream processing performance will reveal its operational contribution.",
    ],
    sources: [
      { label: "Tungsten West processing announcement", url: "https://www.lse.co.uk/rns/processing-operations-commence-during-visit-by-nwf-tc6mhjidfgjazfe.html?mobile_view=desktop" },
      { label: "offtake announcement", url: "https://www.lse.co.uk/rns/strategic-tungsten-supply-and-offtake-agreement-oqvcvuui6u6kzx7.html" },
      { label: "Elmet's furnished Exhibit 99.1", url: "https://www.sec.gov/Archives/edgar/data/2101698/000121390026102242/ea030607301ex99-1.htm" },
    ],
  },
  {
    heading: "EU Strategic Project recognition covers sharply different development stages",
    id: "section-3",
    paragraphs: [
      "EU Strategic Project designation supports administrative coordination, access to financing channels and the permitting framework established by the Critical Raw Materials Act. The selected tungsten-linked projects include extraction, processing and recycling activities, reflecting distinct industrial functions.",
      "El Moto, recognized in March 2025, was described by its developer as under construction during 2026, with first production targeted for the first quarter of 2029. The separately designated EU APT Tungsten Plant entered the October 2026 list at a much earlier commercial stage. Its developer described evaluation and potential technical partnerships, with a final investment decision pending.",
      "Article 11 of the Critical Raw Materials Act sets permitting-process time limits for qualifying EU Strategic Projects, with specified triggers, exclusions and extensions. Those legal clocks are distinct from construction schedules. The October decision was adopted on 9 October and published in the Official Journal on 22 October; its notification date remains an additional verification requirement under EU law.",
      "The commercially relevant question is how designation changes each project's path to capital, construction and production. Evidence of faster permits or completed investments requires project-level administrative and financial records.",
    ],
    sources: [
      { label: "El Moto construction disclosure", url: "https://abtungsten.es/en/2026/09/18/abenojar-tungsten-inaugura-la-mina-de-tungsteno-y-oro-el-moto/" },
      { label: "APT proposal disclosure", url: "https://abtungsten.es/en/2026/10/09/abenojar-tungstens-proposed-apt-plant-designated-as-a-second-european-strategic-project/" },
      { label: "EU Strategic Project permitting guidance", url: "https://europa.eu/youreurope/business/growing/industrial-permitting-licensing/critical-raw-materials-projects/index_en.htm" },
    ],
  },
  {
    heading: "Japanese grants support powder and recycled-feedstock conversion",
    id: "section-4",
    paragraphs: [
      "Japan's selected tungsten projects address downstream transformation. Allied Material plans powder and tungsten-carbide equipment and a new plant, targeting roughly 1.5 times its existing capacity and operations in the first half of fiscal year 2028. Japan New Metals plans an Akita expansion that processes scrap into ammonium paratungstate, or APT.",
      "JOGMEC lists grant decisions of approximately ¥7.5 billion for Allied Material and ¥2 billion for Japan New Metals. The latter advances the evidence beyond the frozen SMPT project's earlier announcement status. A grant decision establishes a programme award milestone; payment, equipment installation and incremental output must be tracked separately.",
      "Mitsubishi Materials describes approximately ¥8 billion in planned investment for the Japan New Metals programme and a target of 2,400 tonnes of annual APT capacity measured on a WO3-equivalent basis, with operation scheduled for April 2029. The 2,400-tonne figure refers to planned total capacity in the stated chemical equivalent. This distinction matters when comparing capacity targets across products or evaluating import-substitution claims.",
    ],
    sources: [
      { label: "JOGMEC grant decisions", url: "https://www.jogmec.go.jp/activities/metal/critical-grant.html" },
      { label: "Allied Material disclosure", url: "https://www.allied-material.co.jp/dcms_media/other/NewsRelease_20260409.pdf" },
      { label: "Mitsubishi Materials expansion disclosure", url: "https://news.mmc.co.jp/corporate/en/newsroom/press/news20260909.html" },
    ],
  },
  {
    heading: "China's 2025 measure regulates specified tungsten export transactions",
    id: "section-5",
    paragraphs: [
      "China's 4 February 2025 Announcement No. 10 requires export permission for defined tungsten products and associated production technology. The legal descriptions cover specified APT, oxides, carbides, solid tungsten forms and alloys, including technical thresholds for some items. Those technical descriptions determine the transaction boundary.",
      "The immediate measure of implementation concerns licences and regulated transactions. Evaluation therefore requires item-aligned data on applications, approval and denial rates, processing times, enforcement and actual shipments. Construction milestones answer a different industrial-policy question.",
    ],
    sources: [
      { label: "MOFCOM/GACC announcement in Chinese", url: "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_e623090907fc4e1092f0a4db72f57b95.html" },
    ],
  },
  {
    heading: "What financiers and industrial buyers should verify next",
    id: "section-6",
    paragraphs: [
      "The selected cases reveal a practical hierarchy of questions. For a mine restart, track stable output, product specifications, shipping records and customer acceptance. For public loans, reconcile drawdown, repayment terms and actual expenditure. For conversion expansions, distinguish awards, disbursement, equipment installation and saleable output. For permitting designations, follow approval milestones and financing decisions. For licensing, examine item-specific transactions.",
      "This comparison uses the SMPT public dataset frozen at repository commit `4fc59c7ea38ca788eb7537353274a953c90e13eb`, supplemented by cited official and corporate evidence available through 3 November 2026. The selected corpus contains 11 events, eight projects, eight designation records, six financing rows and two control clauses. Those counts represent linked records with overlapping underlying projects and interventions.",
      "The central conclusion is stage-specific: supply assurance depends on the material delivered, available conversion routes and commercial performance. Documentary implementation provides a more useful starting point than announcement totals. Later operating and transactional records will determine how far these interventions translate into reliable supply.",
    ],
    sources: [
    ],
  },
] as const;

const downloads = [
  { label: "Full research dossier", detail: "26-page PDF", href: "/research/r001/tungsten-supply-security.pdf" },
  { label: "Executive memo", detail: "2-page PDF", href: "/research/r001/tungsten-supply-security-memo.pdf" },
  { label: "Source-linked evidence workbook", detail: "XLSX", href: "/research/r001/tungsten-supply-security-evidence.xlsx" },
  { label: "LinkedIn presentation", detail: "8-page PDF", href: "/research/r001/tungsten-supply-security-slides.pdf" },
] as const;

export default function TungstenResearchDossier() {
  return (
    <div data-flush-footer>
      <section className="border-b border-border-strong">
        <Container width="wide" className="py-12 sm:py-20">
          <Link href="/research" className="font-display text-sm text-muted underline underline-offset-4 hover:text-accent">Research / Dossier 001</Link>
          <p className="mt-8 font-display text-xs font-semibold uppercase tracking-[0.15em] text-accent">Strategic Materials Policy Tracker · Original research</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl font-medium leading-[1.1] tracking-tight sm:text-6xl">Tungsten Supply Security</h1>
          <p className="mt-5 max-w-3xl font-serif text-xl leading-8 text-muted sm:text-2xl">How policy instruments translate into financing, industrial development and commercial supply</p>
          <p className="mt-7 font-display text-sm text-muted">By <Link href="/about" className="text-foreground underline underline-offset-4">Benjamin Yang</Link> · Research Dossier 001 · Research cutoff <time dateTime="2026-11-03">3 November 2026</time></p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={downloads[0].href} className="research-button" download>Download the full dossier (PDF)</a>
            <a href={downloads[1].href} className="research-button-secondary" download>Executive memo (PDF)</a>
          </div>
        </Container>
      </section>
      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-12 sm:py-16">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-16">
            <article className="max-w-3xl min-w-0">
              <div className="space-y-5 border-b border-paper-border pb-9">
                {introduction.map((paragraph) => (
                  <p key={paragraph} className="font-serif text-[1.125rem] leading-[1.85] sm:text-[1.2rem]">{paragraph}</p>
                ))}
              </div>
              {sections.map((section, i) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-28 border-b border-paper-border py-10 sm:py-12">
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-paper-accent">Finding {String(i + 1).padStart(2, "0")}</p>
                  <h2 id={`${section.id}-heading`} className="mt-3 font-serif text-[1.8rem] font-medium leading-[1.2] tracking-tight sm:text-[2.1rem]">{section.heading}</h2>
                  <div className="mt-6 space-y-5">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="font-serif text-[1.075rem] leading-[1.85]">{paragraph}</p>
                    ))}
                  </div>
                  {section.sources.length > 0 && (
                    <div className="mt-6 border-l-2 border-paper-accent pl-4">
                      <h3 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper-muted">Underlying sources</h3>
                      <ul className="mt-2 space-y-2 font-display text-sm leading-6">
                        {section.sources.map((source) => (
                          <li key={source.url}>
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-paper-accent underline decoration-paper-border underline-offset-4 hover:decoration-current">{source.label}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
              <section aria-labelledby="research-record-heading" className="pt-10">
                <h2 id="research-record-heading" className="font-display text-base font-semibold">Research record</h2>
                <p className="mt-3 font-display text-sm leading-7 text-paper-muted">Research cutoff: 3 November 2026. The comparison uses the SMPT dataset frozen at GitHub commit <a href="https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/commit/4fc59c7ea38ca788eb7537353274a953c90e13eb" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">4fc59c7</a>, supplemented by the original sources linked above. Evidence is selective and stage-specific. The complete dossier provides detailed figures, references and methodology.</p>
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
                <h2 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper-muted">Download & reuse</h2>
                <ul className="mt-3 space-y-3 font-display text-sm">
                  {downloads.map((file) => (
                    <li key={file.href}><a href={file.href} download className="font-medium text-paper-accent underline underline-offset-4">{file.label}</a><span className="block text-xs text-paper-muted">{file.detail}</span></li>
                  ))}
                </ul>
              </div>
              <p className="mt-8 font-display text-xs leading-5 text-paper-muted">SMPT is an independent research project. Findings reflect the dated source record; the site&apos;s current corpus revision may differ.</p>
            </aside>
          </div>
        </Container>
      </section>
    </div>
  );
}