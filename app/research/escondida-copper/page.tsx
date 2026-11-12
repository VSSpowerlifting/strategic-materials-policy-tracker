import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { ResearchCover } from "@/components/editorial/research-cover";
import { Fi002Screen } from "@/components/research/fi002-screen";
import { fi002, fi002Downloads } from "@/lib/fi002";
import { site } from "@/lib/site";
import styles from "./publication.module.css";

const sources = {
  bhp: "https://www.bhp.com/-/media/documents/media/reports-and-presentations/2026/260818_bhpresultsfortheyearended30june2026_presentation.pdf",
  quarter:
    "https://www.bhp.com/-/media/documents/media/reports-and-presentations/2026/261020_bhpoperationalreviewforthequarterended30september2026-pdf.pdf",
  goldman:
    "https://www.financialjuice.com/News/9812752/Goldman-Sachs-Copper---FJElite.aspx?xy=rss",
  bank: "https://thedocs.worldbank.org/en/doc/2ac43f46629cf90c2ea5b8929a343593-0050012026/original/CMO-October-2026.pdf",
  permit: "https://ambihub.cl/seia/proyecto/2167965265",
};
export const metadata: Metadata = {
  title: `${fi002.title} — Strategy & Finance`,
  description: fi002.description,
  alternates: { canonical: fi002.path },
  authors: [{ name: "Benjamin Yang", url: `${site.url}/about` }],
  openGraph: {
    type: "article",
    title: fi002.title,
    description: fi002.description,
    url: site.url + fi002.path,
    siteName: site.name,
    images: [
      {
        url: `${fi002.assets}/social.png`,
        width: 1200,
        height: 630,
        alt: "SMPT research cover: Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: fi002.title,
    description: fi002.description,
    images: [`${fi002.assets}/social.png`],
  },
};
const sections = [
  ["question", "Escondida investment"],
  ["exposure", "Copper forecasts"],
  ["replacement", "Concentrator economics"],
  ["decision", "Construction timing"],
  ["downloads", "Report and model"],
  ["research-record", "Sources and citation"],
];
const prices = [
  { label: "Goldman · prior", value: 13800 },
  { label: "Goldman · revised", value: 15400 },
  { label: "World Bank", value: 13000 },
];

export default function EscondidaCopper() {
  return (
    <div data-flush-footer className={styles.publication}>
      <section className="fi-hero">
        <Container width="wide" className="py-10 sm:py-16">
          <Link href="/research" className="fi-back">
            ← Research
          </Link>
          <div className="fi-hero-grid">
            <div>
              <p className="fi-eyebrow">
                Strategy &amp; Finance
              </p>
              <h1>
                Goldman Sachs’ Copper Outlook and BHP’s{" "}
                <span>$6 Billion Escondida Decision</span>
              </h1>
              <p className="fi-deck">
                  How copper-price forecasts and the cost of preserving mine output shape BHP&rsquo;s Escondida investment.
                </p>
              <p className="fi-byline">
                By <Link href="/about">Benjamin Yang</Link>
                {" · "}Research cutoff <time dateTime={fi002.cutoff}>5 November 2026</time>
              </p>
              <div className="fi-actions">
                <a
                  className="research-button"
                  href={`${fi002.assets}/report.pdf`}
                >
                  Read the full report <span>PDF ↗</span>
                </a>
                <a
                  className="research-button-secondary"
                  href={`${fi002.assets}/report.html`}
                >
                  Read online <span>→</span>
                </a>
              </div>
              
            </div>
            <a
              href={`${fi002.assets}/report.pdf`}
              className="fi-cover"
              aria-label="Open the 14-page flagship report PDF"
            >
              <Image
                src={`${fi002.assets}/report-cover.png`}
                width={612}
                height={792}
                alt="First page of the FI002 research report, with executive summary and investment judgment"
                priority
              />
              <span>
                Flagship report <span>14 pages ↗</span>
              </span>
            </a>
          </div>
          <ResearchCover
            data-cover="escondida-copper"
            data-frame="banner"
            data-caption="full"
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="mt-12 sm:mt-16"
          />
        </Container>
      </section>
      <div className="fi-paper">
        <Container width="wide">
          <nav aria-label="Publication sections" className="fi-section-nav">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="fi-reading-grid">
            <article>
              <section id="question" className="fi-section">
                
                <h2>
                  Goldman&rsquo;s 2027 price outlook and Escondida&rsquo;s longer timetable
                </h2>
                <p className="fi-lead">
                  Goldman Sachs&rsquo; higher copper-price outlook produces a large earnings sensitivity for BHP. The proposed Escondida concentrator, however, will be judged on how much mine output and cash flow it preserves over a much longer period.
                </p>
                <p>
                  Goldman&rsquo;s forecast refers to 2027, while BHP expects the replacement concentrator to begin producing in 2031–32. Stronger prices in the nearer term could leave BHP with more capacity to fund the project, but the construction decision turns on costs, continuity of production and the cash generated over the asset&rsquo;s life.
                </p>
                <div className="fi-findings">
                  <div>
                    <span className="fi-eyebrow">
                      Illustrative earnings exposure
                    </span>
                    <strong>$2.83bn</strong>
                    <p>
                  Illustrative change in underlying EBITDA, holding BHP&rsquo;s FY2026 copper exposure constant and applying the reported Goldman forecast revision.
                </p>
                  </div>
                  <div>
                    <span className="fi-eyebrow">Investment judgment</span>
                    <strong>Continue pre-construction work</strong>
                    <p>
                  Advance engineering and permits while comparing costed options before committing construction capital.
                </p>
                  </div>
                </div>
              </section>
              <section id="exposure" className="fi-section">
                
                <h2>
                  A $1,600/t price revision implies $2.83bn of EBITDA sensitivity
                </h2>
                <p>
                  Public reporting puts Goldman&rsquo;s average copper-price forecast for 2027 at <strong>$15,400/t</strong>, up from $13,800/t. The World Bank&rsquo;s October forecast for the same year is $13,000/t. Applied to BHP&rsquo;s disclosed sensitivity of $39 million in underlying EBITDA for each US cent/lb movement in copper prices, the difference between Goldman&rsquo;s old and new forecasts corresponds to $2.83 billion; the difference between Goldman and the World Bank corresponds to $4.25 billion.
                </p>
                <figure className="fi-exhibit">
                  <figcaption>
                    <span className="fi-eyebrow">
                      Exhibit 01 / Outside forecasts
                    </span>
                    <h3>Calendar-2027 copper-price forecasts</h3>
                    <p>US dollars per tonne · calendar-2027 annual average</p>
                  </figcaption>
                  <div
                    className="fi-price-bars"
                    role="img"
                    aria-label="Goldman prior forecast 13,800 dollars per tonne; revised forecast 15,400; World Bank 13,000. All are calendar-2027 annual averages. Linear bars start at zero."
                  >
                    {prices.map((p, i) => (
                      <div className="fi-price-row" key={p.label}>
                        <span>{p.label}</span>
                        <div>
                          <div
                            className={
                              i === 1 ? "fi-bar fi-bar-gold" : "fi-bar"
                            }
                            style={{ width: `${(p.value / 16000) * 100}%` }}
                          />
                        </div>
                        <strong>${p.value.toLocaleString("en-US")}</strong>
                      </div>
                    ))}
                    <div className="fi-axis">
                      <span>0</span>
                      <span>8,000</span>
                      <span>16,000 $/t</span>
                    </div>
                  </div>
                  <div className="fi-exposure-pair">
                    <div>
                      <strong>$2.83bn</strong>
                      <span>
                        Revised Goldman vs prior Goldman
                        <br />
                        $1,600/t price difference
                      </span>
                    </div>
                    <div>
                      <strong>$4.25bn</strong>
                      <span>
                        Revised Goldman vs World Bank
                        <br />
                        $2,400/t price difference
                      </span>
                    </div>
                  </div>
                  <p className="fi-note">
                    Sources:{" "}
                    <a href={sources.goldman}>
                      FinancialJuice, 20 October 2026
                    </a>
                    ;{" "}
                    <a href={sources.bank}>World Bank, October 2026, Table 1</a>
                    ;{" "}
                    <a href={sources.bhp}>BHP FY2026 presentation, slide 48</a>.
                    SMPT calculations. The Goldman annual average comes from public reporting;
                    the original research note remains unavailable.
                    Goldman’s separate $15,600/t end-2027 view has a different
                    horizon.
                  </p>
                </figure>
                <p>
                  Both figures hold BHP&rsquo;s FY2026 copper exposure constant. They illustrate the scale of the price difference rather than predict earnings or cash available for construction, which would also depend on volumes, costs, taxes and distributions. BHP holds a 57.5% economic interest in Escondida but fully consolidates the operation, so Group EBITDA sensitivity cannot simply be multiplied by the ownership percentage.
                </p>
              </section>
              <section id="replacement" className="fi-section">
                
                <h2>
                  The concentrator&rsquo;s value depends on the production it preserves
                </h2>
                <p>
                  The planned New Concentrator would replace Los Colorados. BHP estimates gross capital spending of $5.4–6.3 billion and a facility output of 230–270 ktpa. That production figure describes the proposed plant; it is not automatically a net increase in Escondida&rsquo;s output. The investment benefit depends on what the mine could produce without the replacement and how the build and no-build plans differ in cost.
                </p>
                <p>
                  Using assumed prices, margins, spending and project timing, the model works backward from the capital cost to estimate how much annual production-equivalent benefit would be needed to recover it. Across four cases, the requirement ranges from 199 to 416 ktpa.
                </p>
                <figure className="fi-exhibit">
                  <figcaption>
                    <span className="fi-eyebrow">
                      Exhibit 02 / Capital-recovery scenarios
                    </span>
                    <h3>
                      Required annual production-equivalent benefit
                    </h3>
                    <p>
                      Estimated output preserved or added against a no-build
                      mine plan
                    </p>
                  </figcaption>
                  <Fi002Screen />
                </figure>
                <p>
                  BHP has guided to a 16–18% project return using a long-term copper assumption of approximately $10,494/t, well below the reported Goldman 2027 average. Public disclosures do not provide the full annual cash-flow schedule or a costed plan for operating the mine without the replacement concentrator. The simplified model therefore tests capital recovery under stated assumptions; it is not a reproduction of BHP&rsquo;s internal-rate-of-return calculation.
                </p>
                <p className="fi-note">
                  Project estimates:{" "}
                  <a href={sources.bhp}>
                    BHP FY2026 results presentation, slides 19–22 and 35–36
                  </a>
                  . All capital and equivalent-benefit screens above use a gross
                  project basis. Applying the same 57.5% ownership factor to
                  both sides cancels in the ratio.
                </p>
              </section>
              <section id="decision" className="fi-section">
                
                <h2>
                  Keep engineering and permitting moving before construction approval
                </h2>
                <p>
                  In its October operating review, BHP reported <strong>$0.8 billion in gross pre-commitment funding approved</strong> for engineering, permits and execution readiness. That approval is for preparatory work; it does not establish that the full amount has been spent or that construction has received final sanction. Continuing the work that resolves major uncertainties can protect the replacement schedule while BHP evaluates when to commit the larger investment.
                </p>
                <div className="fi-decision-list">
                  <div>
                    <h3>Case for accelerating construction</h3>
                    <p>
                  Faster construction could make sense if the value of avoided production losses exceeds the extra cost and execution risk, provided permits and a workable schedule are in place.
                </p>
                  </div>
                  <div>
                    <h3>Case for delaying construction</h3>
                    <p>
                  A delay could make sense if a workable interim mine plan preserves more value than would be lost through deterioration, cost escalation or missed production.
                </p>
                  </div>
                  <div>
                    <h3>Evidence needed before sanction</h3>
                    <p>
                  Before sanction, BHP would need a costed mine plan without the replacement, annual production and tax schedules, feasible execution alternatives and the relevant permitting conditions.
                </p>
                  </div>
                </div>
                <p>
                  Higher copper prices may give BHP more financial room to proceed, but the concentrator still competes with other uses of capital. That comparison needs project-level returns and credible alternatives. Historical cash flow, management projections and gross project budgets each cover different periods and scopes, so an EBITDA sensitivity should not be read as money immediately available to spend.
                </p>
                <p className="fi-note">
                  Readiness source:{" "}
                  <a href={sources.quarter}>
                    BHP quarterly operating review, 20 October 2026, pp. 1–2
                  </a>
                  . The{" "}
                  <a href={sources.permit}>indexed Chilean permitting file</a>{" "}
                  showed evaluation pending at the research cutoff, including a
                  4 November applicant request. Document-access limits leave the approval date and
                  potential delay probability unresolved.
                </p>
              </section>
            </article>
            <aside className="fi-aside">
              
              <h2>Report and model</h2>
              
              <a href={`${fi002.assets}/report.pdf`}>
                Open the 14-page report ↗
              </a>
              <a href={`${fi002.assets}/model.xlsx`} download>
                Download the Excel model ↓
              </a>
              <div className="fi-aside-note">
                <p className="fi-eyebrow">Research independence</p>
                <p>
                  This is independent SMPT research. Goldman Sachs and BHP did not commission it or review the analytical judgments.
                </p>
              </div>
            </aside>
          </div>
          <section id="downloads" className="fi-section fi-download-section">
            
            <h2>Downloads</h2>
            
            <div className="fi-downloads">
              {fi002Downloads.map((d) => (
                <a
                  key={d.file}
                  href={`${fi002.assets}/${d.file}`}
                  download
                  className={
                    "primary" in d
                      ? "fi-download fi-download-primary"
                      : "fi-download"
                  }
                >
                  <span>
                    <strong>{d.title}</strong>
                    <small>{d.detail}</small>
                  </span>
                  <span aria-hidden="true">↓</span>
                </a>
              ))}
            </div>
            <p className="fi-note">
              <a href={`${fi002.assets}/report.html`}>Full report in HTML</a> ·{" "}
              <a href={`${fi002.assets}/report.md`} download>
                Editable Markdown narrative
              </a>{" "}
              ·{" "}
              <a href={`${fi002.assets}/publication-manifest.json`}>
                File checksums
              </a>
              .
            </p>
          </section>
          <section id="research-record" className="fi-section fi-record">
            <div>
              
              <h2>Source basis and citation</h2>
              <p>
                Research completed on{" "}
                <time dateTime={fi002.cutoff}>5 November 2026</time>. Goldman’s
                forecast attribution, BHP’s readiness funding and the Chilean
                permitting index were checked again before publication, with
                findings consistent with this edition. The original Goldman
                note and substantive October permit-review questions
                remain inaccessible.
              </p>
              <p>
                Evidence classifications and access attempts are recorded in the{" "}
                <a href={`${fi002.assets}/evidence-register.csv`} download>
                  evidence register
                </a>
                . The{" "}
                <a href={`${fi002.assets}/methodology.md`} download>
                  methodology
                </a>{" "}
                distinguishes issuer facts, outside forecasts and independent
                assumptions. Financial and editorial checking was internal; external
                professional verification remains outstanding.
              </p>
            </div>
            <div className="fi-citation">
              <h3>Cite this research</h3>
              <p>
                Yang, Benjamin. “Goldman Sachs’ Copper Outlook and BHP’s $6
                Billion Escondida Decision.” Strategic Materials Policy Tracker,
                Financial Intelligence 002. Research cutoff: 5 November 2026.
              </p>
              <a href={`${fi002.assets}/citation.bib`} download>
                Download BibTeX citation ↓
              </a>
              <p className="fi-note">
                Independent financial and corporate strategy research for
                general information. Investment decisions require individual
                assessment and appropriate professional advice.
              </p>
            </div>
          </section>
          <nav className="fi-related" aria-label="Related research">
            
            <Link href="/research/hemerdon-financing">
              Strategy &amp; Finance
              <br />
              <strong>
                Inside Tungsten West’s £71 Million Restart Financing →
              </strong>
            </Link>
            <Link href="/research">Explore all SMPT research →</Link>
          </nav>
        </Container>
      </div>
    </div>
  );
}
