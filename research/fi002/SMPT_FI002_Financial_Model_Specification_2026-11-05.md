# SMPT FI002 — Bounded financial model specification and handoff

**Date:** 5 November 2026  
**Project:** Goldman Sachs (as a research subject) × BHP copper strategy / Escondida New Concentrator  
**Phase:** Financial analysis model-design handoff, **NOT** authorization to merge, deploy, publish, or make investment recommendations  
**Upstream evidence:** `SMPT_FI002_Research_Continuation_2026-11-05.md`, `SMPT_FI002_Evidence_Register_2026-11-05.csv`, `SMPT_FI002_Price_Sensitivity_Illustrations_2026-11-05.csv`, and `SMPT_FI002_Independent_Quality_Review_2026-11-05.md`.

## 1. Objective and deliverable boundary

Build an **auditable, formula-driven historical-financial and copper-price scenario workbook** assessing BHP's near-term cash-generation exposure and the key decision constraints around its proposed Escondida New Concentrator. The workbook should improve an investment committee's ability to see what public information does and does not establish.

**Do build**: verified FY2025/FY2026 BHP and Copper segment financial tables, FY2027 guidance (as management guidance), same-horizon calendar 2027 copper market scenarios, disclosed FY2026 price sensitivity translated into illustrative EBITDA effects, a careful review of capital projects and capital allocation, source register, source-linked material assumptions, decision-gate dashboard and reproducible QA.

**Do not build or silently infer**: project NPV, independently computed project IRR, price-driven FY2027 group EBITDA or free-cash-flow forecast, quarterly earnings projections, causal price-to-capex funding attribution, project financing spread/weighted average cost of capital, or a numerical optimal FID date from the incomplete public source set.

**Acceptance is conditional** on existing Codex local work first being inspected, if provided. Do not overwrite an existing FI002 workbook or reimplement a completed model without reviewing its architecture and calculations. No repository/publication changes.

## 2. Grain, ontology and numerical conventions

Each numerical input must have a provenance record with these fields:

| Field | Description / allowed values |
|---|---|
| `input_id` | Unique stable identifier, separate from source-document identifier |
| `source_id` | Source/claim row ID in evidence register plus source document URL |
| `as_of` | Knowledge cutoff date; **not** operating period end |
| `publication_date` | Source issuance date; if unknown, empty |
| `period_type` | `FY`, `CY`, `FY_RANGE`, `CY_RANGE`, or `POINT_IN_TIME` |
| `period_start`, `period_end` | Explicit inclusive dates or reviewed endpoints, never inferred from publication date |
| `entity_scope` | `BHP_GROUP`, `BHP_COPPER_SEGMENT`, `ESCONDIDA_ASSET`, `ESCONDIDA_NEW_CONCENTRATOR`, `MARKET_GLOBAL`, `MARKET_EX_US`, `SPECIFIC_PROJECT` |
| `reporting_basis` | `IFRS_CONSOLIDATED`, `OPERATED_100_PERCENT`, `BHP_ATTRIBUTABLE`, `EQUITY_ACCOUNTED_SHARE`, `NCI_AFTER_DISTRIBUTIONS`, `THIRD_PARTY_FORECAST` |
| `classification` | `REPORTED_ACTUAL`, `MANAGEMENT_GUIDANCE`, `MANAGEMENT_ESTIMATE`, `THIRD_PARTY_FORECAST`, `ANALYST_ASSUMPTION`, `DERIVED` |
| `currency` | `USD`, or original currency with exchange assumptions separately recorded |
| `value_unit` | `USDm`, `USDbn`, `USD/t`, `USD/lb`, `US¢/lb`, `kt`, `ktpa`, `Mtpa`, `percent`, `years` |
| `dollar_basis` | `NOMINAL`, `REAL_2026_07`, `HISTORICAL_REPORTED`, or `NA` |
| `includes_capex`, `includes_nci_dividends` | `YES`, `NO`, `NOT_APPLICABLE`, `UNKNOWN` |
| `status` | `VERIFIED_PRIMARY`, `CORROBORATED_SECONDARY`, `MIRROR_ONLY`, `RESEARCH_HOLD`, `ASSUMPTION` |
| `locator`, `notes` | Precise slide, note, URL, numerical scope and any dissenting evidence |

**Prohibited joins:** FY2027 results against CY2027 prices as if the same 12 months; group consolidated vs BHP-attributable without an explicit reconciliation; real vs nominal project estimates without inflation assumptions; 100% Escondida mining tonnage vs BHP-share economic cash flows; facility production vs increment to mine production; cumulated four-/five-year cash flow as a single-year cash figure.

**Denominators:** MT = metric tonne (1,000 kg). Use `2,204.622621848776 lb/metric tonne`; prices are US dollars **per metric tonne** unless explicitly `/lb`. Use units in headers and source columns. **BHP FY2026 ended June 30, 2026; calendar 2027 is a different date range**.

## 3. Proposed workbook tabs and controls

Design is not fixed to a pre-existing SMPT workbook; inspect established conventions before adopting structure.

| Tab | Required content | Status and model rule |
|---|---|---|
| `00_Guide` | Research question, scenario semantics, date, disclaimer, change log, usage | Mandatory; no implied sponsorship or investment advice |
| `01_Sources` | Input/claim ID → issuer → date → URL → slide/note → class → reporting scope | Mandatory, hyperlinks, status labels |
| `02_Basis_Map` | Consolidated vs 100%-asset vs BHP-share vs NCI and period/price guide | Mandatory, explicit prohibited joins |
| `03_Historical` | FY2025–FY2026 income, cashflow, copper operational data, capex, debt | Source inputs + audited arithmetic, no invented bridges |
| `04_2027_Guidance` | FY2027 volumes, costs, group/copper capex, and scope | Guidance only, not reconstructed forecast |
| `05_Market` | World Bank CY2027, reported old/new GS CY2027, dated futures snapshot; BHP long-term and 5-year copper planning inputs separately | Distinct horizon/basis columns; no averaged pseudo-consensus |
| `06_EBITDA_Sensitivity` | Direct disclosed ±US¢/lb → hypothetical FY2026 underlying EBITDA delta | Formula driven; fixed $39m sensitivity, visible **FY26 STATIC** label |
| `07_Project_Facts` | ENC March/Aug scope evolution, PCF, project IRR as disclosed, FY34–43 facility output, FID, first production | Display **management figures**; independent NPV/IRR disabled |
| `08_Capital_Portfolio` | Escondida, Copper SA, Spence, Vicuña, Jansen context; approvals, costs, nominal/real, BHP share | Never add mismatched bases or double count stages |
| `09_Funding_Map` | Actual group FCF, copper forecast cumulative FCF, debt, NCI distributions, streaming financing | No unsupported forward liquidity/coverage ratio |
| `10_Decision_Gates` | Maintain development / limited acceleration / stage FID alternatives and evidence-based triggers | Qualitative/conditional; no fake utility scores |
| `11_Validation` | Error/warning checks, formula tests, scope/date/units tests, gaps blocking valuation | All high-severity tests PASS or explicit `BLOCKED` |
| `12_Dashboard` | Short list of defendable indicators, scenario sensitivities, project constraints, missing-information flags | Clear management-view summary, NOT an unsupported valuation |

A 13-tab workbook is not mandatory if a shorter architecture improves clarity. Quality of definitions and traceability outranks quantity of tabs.

## 4. Source-verified historical input table

**USD million unless stated; FY ends June 30.** Source for financials: BHP FY2026 SEC-filed Annual Report (Form 6-K), Cash Flow Statement, Note 1 Segment reporting and Non-IFRS reconciliation; some comparatives also in its results presentation.

| Metric | FY2025 | FY2026 | Interpretation |
|---|---:|---:|---|
| Copper segment revenue | 22,530 | 29,031 | BHP reportable Copper segment, not sale-price × production identity |
| Copper underlying EBITDA | 12,326 | 18,187 | Non-IFRS segment underlying measure |
| Iron ore underlying EBITDA | [VERIFY] | 14,529 | Group numerator check only; do not invent prior |
| Coal underlying EBITDA | [VERIFY] | 832 | Group numerator check only |
| Group and unallocated EBITDA | [VERIFY] | −601 | Denominator issue for 54% headline |
| Group underlying EBITDA | 25,978 | 32,947 | Non-IFRS |
| Copper capital expenditure (US$m, cash basis) | 4,392 | 4,556 | Historical reported, not ENC-only |
| Copper production (kt, published composite basis) | 2,017 | 1,953 | Operating subsidiaries generally 100%; equity-accounted investments BHP share |
| Average realized copper price (USD/lb) | 4.25 | 5.74 | Average realized sales price, not one-day LME benchmark |
| Escondida unit costs (USD/lb, company's definition) | 1.19 | 1.07 | Asset-level operational unit cost; different from project cost schedule |
| Net operating cash flow | 18,692 | 21,778 | IFRS group |
| Net investing cash flow | −13,350 | −12,011 | IFRS group |
| Group free cash flow | 5,342 | 9,767 | **BHP non-IFRS definition: net operating + net investing** |
| Group capital and exploration expenditure | 9,794 | 10,257 | Cash basis, not same as net investing |
| Group net debt | 12,924 | 8,694 | Net-debt framework includes adjustments |
| Cash and cash equivalents | 11,894 | 18,532 | Not fully free cash |
| Silver-streaming financing receipt | 0 | 4,300 | **Financing cash inflow**, *not* in group FCF |

Source references: https://www.sec.gov/Archives/edgar/data/811809/000119312526355840/d54971d6k.htm ; https://www.bhp.com/-/media/documents/media/reports-and-presentations/2026/260818_bhpresultsfortheyearended30june2026_presentation.pdf

### Hard reconciliation checks

```text
FY2026 Group FCF = +21,778 + (−12,011) = +9,767 US$m
FY2025 Group FCF = +18,692 + (−13,350) = +5,342 US$m
FY2026 Group EBITDA = Copper 18,187 + Iron 14,529 + Coal 832 + Group/Unallocated (−601) = 32,947 US$m
Copper share of operating-segment EBITDA = 18,187 / (18,187 + 14,529 + 832) = 54.212% ≈ 54%
Copper share of full group underlying EBITDA = 18,187 / 32,947 = 55.201% — different definition!
Copper revenue FY26−FY25 = +6,501 US$m; EBITDA = +5,861 US$m; **not** a causal price/volume bridge
```

**Do not** deduce FY2026 volume from the copper price-sensitivity factor as if exposed saleable production is disclosed at that exact level. The factor is a local sensitivity, not a full production-revenue model.

## 5. Market and scenario inputs (must remain separated by horizon)

### A. CY2027 copper-price references

| Case | Price USD/t | Source level | Appropriate purpose |
|---|---:|---|---|
| World Bank October 2026 | 13,000 | Primary published macro forecast | Calendar 2027 alternative |
| Goldman previously reported | 13,800 | Secondary | Historical revision baseline only |
| Goldman October 19 revised (as reported) | 15,400 | Corroborated secondary; original proprietary not examined | Calendar 2027 high-price scenario |
| Dated Oct 19 futures observation as reported | 14,405 | Secondary snapshot, not forecast consensus | Dated market reference only |

World Bank 2026 = $13,200/t and 2028 = $12,500/t in its October report. The official Goldman Oct 23 podcast references **$15,600/t at end-2027**, which is a **point forecast**, not a CY2027 average and is not interchangeable with $15,400/t.

**BHP's published assumptions (separate group):** May 2026 UBS commodity consensus **$5.40/lb** for Copper-segment *FY2027–31* cumulative FCF projection, **$4.76/lb** for *FY2032–35* cumulative FCF projection; ENC management's project-IRR assumption **$4.76/lb**. These are **not** point-in-time CY2027 market forecasts. Do not present $4.76 and $15,400/t as alternative CY2027 prices. Keep the label `FY27–FY31 management projection price basis` distinct from `project long-term investment price basis`.

### B. Price sensitivity calculation

Editable blue/labelled input cells: `scenario_price_usd_per_t`, `reference_price_usd_per_t` (default 13,800), `fy26_copper_ebitda_usdm_per_cent_per_lb` (**39, sourced and locked by default**). Formula cells (black/derived):

```text
Scenario USD/lb = scenario USD/tonne / 2204.622621848776
Delta cents/lb = (scenario USD/tonne − baseline USD/tonne) / 2204.622621848776 × 100
Illustrative FY26-baseline underlying EBITDA delta US$m = Delta cents/lb × 39
```

Tests: `baseline=baseline` → delta zero; `15,400 vs 13,800` → about **+2,830.416389 US$m**; `13,000 vs 13,800` → about **−1,415.208194 US$m**; `15,400 vs 13,000` → about **+4,245.624584 US$m**. Within cell-level results, round only at display, not before propagation. Do not compute EPS, FCF, or shareholder value from these numbers.

**The central assumption is knowingly strict:** hold the company's FY2026 exposed-portfolio price sensitivity constant to show a hypothetical differential in prices. Do not relabel this as expected 2027 performance; FY2027 production guidance is lower and financial exposures may change.

## 6. Project facts and allowable stress parameters

### Escondida New Concentrator — management statements

| Item | 17 March 2026 | 18 August 2026 |
|---|---:|---:|
| Capex range (US$bn; BHP project scope) | 4.4–5.9 | 5.4–6.3 |
| Copper output from new facility (ktpa) | 220–260 | 230–270 |
| Concentrator throughput capacity (Mtpa) | 45 (prior disclosure) | 50 |
| BHP management-projected IRR | 13–16% (prior estimate) | 16–18% |
| FID | CY2027–28 targeted | CY2027–28 targeted |
| First production | CY2031–32 potential | CY2031–32 potential |
| Board pre-commitment funding | — | approximately **US$0.5bn BHP-share *approved*** |

The July 2026 real/nominal classification in the August portfolio slide: **ENC, Spence and Cerro Colorado estimated capex nominal**; **other quoted copper pipeline estimates generally in 1 July 2026 real dollars**. Verify the footnote of each individual comparator and its reported ownership basis. Example: Vicuña Stage I **$7–8bn on 100% JV basis**, not $7–8bn BHP payable.

### Stress parameters that may be included safely as *illustrations*

- **Capex overrun percent:** `stress_gross_cost = $5.85bn × (1 + specified analyst stress)`; report only hypothetical **100%-project scope cost change**. Do not call it BHP cash outlay, revised guidance, or NPV impact. A conservative choice is to keep zero stress as default and list other values as independently selected scenarios.
- **Schedule sensitivity:** base first production CY2031–32 and hypothetical +1/+2 years as **dates/critical-path risk indicators only**. No priced schedule-delay valuation without actual lost production and net cashflow data.
- **Price sensitivity for long-run planning:** allow an input `analyst_long_run_copper_USD_lb` beside BHP $4.76/lb but disable IRR/NPV output without mine-level counterfactual production and annually projected free cash flow.
- **Preservation-versus-incrementality:** mandatory field `mine_incremental_payable_ktpa=UNKNOWN`, not `250` or any mean of facility guidance.

No arbitrary impairment charges or fabricated risk probabilities. Full project economics may become a separate phase **only** when missing capital and production schedules can be evidenced or clearly and responsibly bounded.

## 7. Funding and financial flexibility logic

### Actual group resources

- BHP group FY2026 FCF US$9.767bn: corporate non-IFRS **OCF + net investing**; investment and some project acquisition cash flows already included. **Silver stream financing proceeds excluded**.
- Net debt $8.694bn vs management target $10–20bn. Never convert *headroom to the top end of the target range* to an unconditional financing allowance. Consider debt covenants, ratings, project sequencing, interest, other uses.
- Board-disclosed payout framework and dividends are distribution policy, not a separate line item to subtract from FCF and call FCF itself.

### BHP forecast Copper segment FCF

- FY2026 ~$5bn, FY2027–31 total ~$12bn, FY2032–35 total ~$24bn on **attributable basis**, subject to BHP's forecast commodity assumptions, operations and capital execution.
- Post-tax, unlevered segment FCF **after dividends to noncontrolling interests**, with certain centrally managed financing and taxation outside segment level. It is **not** equivalent to BHP Group's after-financing discretionary cash.
- **No additional subtraction** of the New Concentrator's anticipated capital spend from those published projected FCF aggregates; the original management forecasts already reflect the investment program.
- Both the $12bn and $24bn are cumulative spans. Never claim 12/5 or 24/4 is management annual FCF guidance; any illustrative average should be explicitly labeled a derived average and should not drive liquidity forecasts.

### Historical data anomalies / flags

- Report funding and cash flows **by classification and date**, with one-time monetizations separate from recurring operations.
- Report 2027 guidance capex/exploration **~$11bn Group; $5.4bn Copper; $2.0bn Potash**, not as a new unconditional budget for ENC alone.
- Do not sum Copper SA smelter output with all mines' physical output as if independent fresh production; the chain overlaps.

## 8. Decision alternatives and evidence-based decision gates

The model should *compare controllable decisions*, not claim a single quantitative optimum:

**A. Maintain**: continue authorised feasibility/engineering, meet permit-response requirements, target conditional FID CY2027–28. Show status of clearance and budget, not assumed returns.

**B. Accelerate *pre-FID work only***: qualify additional engineering, procurement, vendor long-lead checks only if permitted and within explicitly approved funding; no claim that construction can legally or physically accelerate without approvals.

**C. Stage FID**: preserve option if permitting, scope, inflation or threshold testing deteriorates; highlight that replacement of Los Colorados makes a deferral potentially costly even at steady copper prices.

**D. Defer major investment**: reserve as a theoretical alternative with **no computed value** until independent physical baseline and mine-wide throughput implications are specified.

Mandatory gates visible on dashboard:

1. Chilean RCA environmental approval status and current ICSARA/Adenda stage (primary documentary evidence preferred).
2. FID readiness and approved precommitment cash vs authority to incur full spend.
3. Gross capex envelope vs new management guidance, dollars nominal/real.
4. 100% vs BHP-share funding and noncontrolling-interest treatment.
5. Incremental *mine-level* output / lost replacement baseline.
6. Long-run price assumption, downside project-return evidence and internal return hurdle (both may be undisclosed).
7. Capital competition: Copper SA, Spence, Vicuña, Jansen commitments and liquidity.
8. Actual annual project capex spend profile; no allocation assumption treated as management guidance.

**Provisional stance:** **Maintain engineering and conditional FID readiness**, not unconditional approval, acceleration or deferral. Revisit only when decision gates change.

## 9. Verification plan and stop criteria

### Required automated checks

**Numerical:** original 4-row sensitivity CSV reproduced to ≤$0.002m (plus exact scenario values); 2025/2026 FCF and 2026 EBITDA segment sum; source-backed capex midpoint delta; 54% denominator check; no zero/divide errors; scenario changes propagate exactly once.

**Data/ontology:** unique input IDs, nonempty original source and locator for all published-company numbers, correct labels for forecast vs guidance vs result, and no calendar-year vs fiscal-year joins; 100%-basis capex not silently attributed; USD/tonne conversions correct.

**Formula-direction:** higher hypothetical copper prices yield greater FY2026-basis EBITDA sensitivity; reversing the reference price changes only deltas; modifying a scenario does not modify historical actuals or BHP management guidance; changing an investment stress does not fabricate a new IRR.

**Presentation:** underlined hyperlinks, legible units, original SMPT colors and one professional font; no confusing badges claiming model credibility. Dashboard must carry its material limitations near any modeled figures.

**Quality review:** independently rebuild the $2.83bn and $4.246bn arithmetic outside the workbook, inspect formula cell references, and compare all displayed values to the same input version. Explain each unreconciled source mismatch. Do not claim that the model calculates independent project returns.

### Out-of-scope engineering

No site, production database or deployment changes, no institutional outreach, no slides/memo/deck, no environment migrations, no unrelated repository bug fixes and no automatic presentation publication. The workbook may be saved in an isolated research directory **only** after preserving any preexisting Codex files and checking exact branch/worktree state.

### Ready-to-handoff stop condition

A reviewer receives: (i) editable workbook or explicitly scoped model script, (ii) source map and input version, (iii) independent test log, (iv) resolved/unresolved issues, (v) conditional model-readiness verdict, and (vi) exact path/commit only if actually created. Stop the coding session before a separate strategy-writing, deck-production, or deployment phase.

## 10. Source package (specific locators)

- **BHP FY2026 Results Presentation**, 18 Aug 2026: slide 20 (allocation), 21 (nominal capex), 22 and slide 35 footnotes (segment FCF assumptions), 28 and slide 36 footnotes (ENC), 40 (pipeline capex basis), 48 (FY26 price sensitivity), 49–50 (FY27 guidance). https://www.bhp.com/-/media/documents/media/reports-and-presentations/2026/260818_bhpresultsfortheyearended30june2026_presentation.pdf
- **BHP SEC-filed annual report, Form 6-K**, 18 Aug 2026: Copper financial data, cash flow, Note 1 segment reporting, and non-IFRS reconciliations. https://www.sec.gov/Archives/edgar/data/811809/000119312526355840/d54971d6k.htm
- **BHP 2026 20-F**, primary annual filing index. https://www.sec.gov/Archives/edgar/data/811809/000119312526354647/0001193125-26-354647-index.htm
- **BHP March 17 project announcement**, original scope. https://www.bhp.com/news/articles/03/escondida--bhp-submits-environmental-permit-to-build-a-new-concentrator-plant
- **BHP FY2026 result announcement**, August 18. https://www.bhp.com/news/media-centre/releases/2026/08/bhp-results-for-the-full-year-ended-30-june-2026
- **World Bank October 2026 forecast PDF**, commodity table on PDF page 2. https://thedocs.worldbank.org/en/doc/2ac43f46629cf90c2ea5b8929a343593-0050012026/related/CMO-October-2026-Forecasts.pdf
- **Goldman reported Oct 19 revision**, October 20 public FinancialJuice coverage (secondary). https://www.financialjuice.com/News/9812752/Goldman-Sachs-Copper---FJElite.aspx?xy=rss
- **Goldman Oct 23 official podcast** (independently distinct year-end 2027 forecast). https://www.goldmansachs.com/insights/goldman-sachs-exchanges/why-oil-prices-are-surging-despite-recovering-supply
- **Chilean environmental file 2167965265**, government documents indexed in public mirror; official underlying docs to be inspected before quantifying risk. https://ambihub.cl/seia/proyecto/2167965265

**Editorial control:** do not use Goldman/BHP logos to imply sponsorship. Do not distribute proprietary Goldman research. Future model and publication should cite the original BHP documents and make clear that third-party price forecasts are dated, externally sourced and contestable.
