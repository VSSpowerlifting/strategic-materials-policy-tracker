import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
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
  ["question", "The investment question"],
  ["exposure", "Copper-price exposure"],
  ["replacement", "Replacement economics"],
  ["decision", "Capital-allocation judgment"],
  ["downloads", "Report and resources"],
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
                Copper-price exposure, replacement economics and BHP’s capital-allocation decision
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
                  How much should a bullish copper forecast change a long-lived
                  investment decision?
                </h2>
                <p className="fi-lead">
                  Goldman Sachs’ copper outlook could materially increase BHP’s
                  earnings. For Escondida, the investment case depends on how
                  much mine production and cash flow the new concentrator
                  preserves.
                </p>
                <p>
                  Goldman’s forecast covers 2027. The replacement concentrator
                  is expected to begin producing in 2031–32. Higher near-term
                  prices could give BHP more financial flexibility, while the
                  construction decision depends on long-term cash flow,
                  capital costs and operating continuity.
                </p>
                <div className="fi-findings">
                  <div>
                    <span className="fi-eyebrow">
                      Illustrative earnings exposure
                    </span>
                    <strong>$2.83bn</strong>
                    <p>
                      FY2026-static underlying EBITDA differential from the
                      reported Goldman forecast revision.
                    </p>
                  </div>
                  <div>
                    <span className="fi-eyebrow">Investment judgment</span>
                    <strong>Continue pre-construction work</strong>
                    <p>
                      Continue engineering and permitting while using costed
                      alternatives to decide when to commit construction
                      capital.
                    </p>
                  </div>
                </div>
              </section>
              <section id="exposure" className="fi-section">
                
                <h2>
                  Goldman’s revised forecast implies a $2.83bn EBITDA
                  sensitivity.
                </h2>
                <p>
                  Public reporting attributes a{" "}
                  <strong>$15,400/t calendar-2027 average</strong> to Goldman
                  Sachs, raised from $13,800/t. The World Bank’s October outlook
                  puts the same year’s average at $13,000/t. Applying BHP’s
                  disclosed $39 million EBITDA sensitivity per US cent/lb gives
                  $2.83 billion for Goldman’s revision and $4.25 billion for the
                  Goldman–World Bank gap.
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
                  These are hypothetical sensitivities holding BHP’s FY2026
                  exposure static. Forecasting earnings and project cash
                  requires volume, cost, tax and distribution assumptions.
                  Escondida is 57.5% economically owned but fully consolidated;
                  reported Group exposure therefore uses a different accounting
                  basis from a simple ownership allocation. Both figures are
                  static EBITDA sensitivities, distinct from future earnings
                  or cash available for construction.
                </p>
              </section>
              <section id="replacement" className="fi-section">
                
                <h2>
                  Escondida’s replacement economics depend on production
                  preserved.
                </h2>
                <p>
                  The New Concentrator replaces Los Colorados. BHP’s $5.4–6.3
                  billion gross capital estimate and 230–270 ktpa
                  facility-output range describe the planned asset.
                  Incremental value to the mine depends on production
                  preserved, alternative processing, avoided costs and capital
                  under with-build and no-build plans.
                </p>
                <p>
                  The model estimates the annual production-equivalent benefit
                  needed to recover capital under assumed prices, margins,
                  spending and timing. Across the four tests, that requirement
                  ranges from 199 to 416 ktpa.
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
                  BHP’s management-guided 16–18% return uses a long-term copper
                  assumption of approximately $10,494/t, below Goldman’s
                  near-term forecast. The annual project cash-flow schedule and
                  costed no-build mine plan remain outside the public
                  disclosure. This model provides a simplified capital-recovery
                  sensitivity, distinct from BHP’s IRR calculation and a full
                  project valuation.
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
                  Advance engineering and permitting before committing
                  construction capital.
                </h2>
                <p>
                  BHP’s October operating review records{" "}
                  <strong>
                    $0.8 billion of gross pre-commitment funding approved
                  </strong>{" "}
                  for engineering, permitting and execution readiness. The approval covers pre-construction readiness; actual
                  expenditures and the final construction sanction are
                  separate decisions. Continue preparation and selectively
                  accelerate work that resolves uncertainty or protects
                  the replacement schedule.
                </p>
                <div className="fi-decision-list">
                  <div>
                    <h3>Case for accelerating construction</h3>
                    <p>
                      Discounted avoided continuity losses that exceed the
                      acceleration premium and execution risk, with permits and
                      a feasible schedule.
                    </p>
                  </div>
                  <div>
                    <h3>Case for delaying construction</h3>
                    <p>
                      A credible interim operating plan whose retained
                      flexibility outweighs deterioration, escalation and lost
                      operating benefit.
                    </p>
                  </div>
                  <div>
                    <h3>Evidence needed before sanction</h3>
                    <p>
                      A costed no-build mine plan, annual production and fiscal
                      schedules, binding execution alternatives and material
                      permitting conditions.
                    </p>
                  </div>
                </div>
                <p>
                  Higher copper prices could improve BHP’s capacity to fund
                  construction. Ranking Escondida against competing uses of
                  capital still requires project-level returns and alternatives.
                  Historical cash flow, cumulative management projections and
                  gross project budgets use different scopes. The funding
                  analysis treats them separately and distinguishes EBITDA
                  sensitivity from deployable cash.
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
                  SMPT produced this research independently of Goldman Sachs
                  and BHP. All analytical judgments are SMPT’s.
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
