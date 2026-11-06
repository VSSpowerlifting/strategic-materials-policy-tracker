# SMPT FI002 — Independent financial research quality review

**Reviewed:** 5 November 2026 (Eastern Time)  
**Scope:** Research and model-design gate, **not** a completed financial model or publication review  
**Status:** **CONDITIONAL GO** for a formula-driven, historical-financial and short-run copper sensitivity model; **NO-GO** for independent project NPV/IRR, unconditional investment recommendation, or publication.  
**Research subject:** BHP Group / Escondida New Concentrator / publicly reported Goldman Sachs copper forecast. Goldman Sachs and BHP are research subjects, not clients, collaborators, or sponsors.

## A. Material reviewed and continuity boundary

1. `Pasted text(9).txt`: FI002 original full research/model/publication assignment.
2. `SMPT_FI002_Research_Continuation_2026-11-05.md`: previous independent investigation.
3. `SMPT_FI002_Evidence_Register_2026-11-05.csv`: **38 claim/input entries**, not 38 independent source publications; source URLs repeat across claims.
4. `SMPT_FI002_Price_Sensitivity_Illustrations_2026-11-05.csv`: four FY2026-basis sensitivity illustrations.
5. Original primary disclosures re-inspected: BHP FY2026 results **presentation slides 20–22, 28, 36, 40, 48–50**, BHP FY2026 annual-report financial and segment tables (SEC Form 6-K exhibit and SEC 20-F search extracts), BHP March concentrator release, World Bank October 2026 commodity-forecast table, and Chilean SEIA project index. Public reporting on the October 19 Goldman Sachs forecast was independently cross-checked with October 20 reporting and Goldman Sachs' October 23 podcast statement. Secondary source limits remain.
6. GitHub repository `VSSpowerlifting/strategic-materials-policy-tracker` and prior FI002 conversational handoff were examined earlier. No **pushed** FI002/BHP/Escondida branch, commit, PR, or model has been identified. **Codex's claimed prior local work is NOT verified or reconciled**. Do not infer that it is absent. The separate Hemerdon financial work does not count as FI002.

## B. Results that pass independent review

### B1. Copper price sensitivity — arithmetic pass, inference bounded

BHP investor slide 48: **US$39 million change in FY2026 underlying EBITDA per US cent per pound change in copper price**. Presentation footnotes: assumption of the existing portfolio, exposed volumes, and exclusion of equity-accounted investments. The prior four-row CSV is correct within rounding. Independent Python/decimal recomputation gives the following, **relative to the reported previous Goldman 2027 forecast of $13,800 per metric tonne**:

| Copper-price reference | 2027 price ($/t) | Assumed price delta ($/t) | Illustrative FY2026-basis underlying EBITDA delta (US$bn) |
|---|---:|---:|---:|
| World Bank, October 2026 | 13,000 | −800 | −1.415 |
| Previously reported Goldman forecast | 13,800 | 0 | 0.000 |
| Reported October 19 futures snapshot | 14,405 | +605 | +1.070 |
| Revised reported Goldman forecast | 15,400 | +1,600 | +2.830 |

Formula: `($/t delta ÷ 2,204.62262185 lb/metric tonne) × 100 cents/$ × 39 US$million per 1 cent/lb`. Goldman-vs-World Bank gap on that *same FY2026 static exposure* is **US$4.246bn**. These quantities are deliberately **not** 2027 BHP EBITDA, FCF, group net income, or a model of the concentrator's contribution. They should not be added to FY2026 actual EBITDA or FY2027 guidance as a forecast without additional explicit assumptions.

### B2. The 54% copper EBITDA statement — denominators resolved

BHP FY2026 segment underlying EBITDA (US$m): Copper **18,187**, Iron Ore **14,529**, Coal **832**, Group and unallocated **−601**, Group total **32,947**. BHP's presentation defines the headline commodity share as excluding Group and unallocated. Correct percentages:

- `18,187 / (18,187 + 14,529 + 832)` = **54.212%** (rounds to BHP's **54%** headline).
- `18,187 / 32,947` = **55.201%** (a mathematically valid different denominator, **not** the company's stated headline methodology).

**Required edit:** any caption calling it 54% of *the reported group-total EBITDA denominator* is imprecise. The research can say “BHP reports a 54% copper share of commodity/operating-segment underlying EBITDA, excluding Group and unallocated items” and define the figure.

### B3. BHP cash flow — independently reconciled; streaming classification is critical

The SEC-filed 2026 annual report and cash-flow statement establish, in US$m:

- FY2026 net operating cash flows **21,778**; net investing cash flows **−12,011**; BHP non-IFRS group FCF **9,767**.
- FY2025 operating **18,692**, investing **−13,350**; group FCF **5,342**.
- FY2026 net debt **8,694**, FY2025 net debt **12,924**; target net debt range disclosed as **$10–20bn**, but *below the target range* does not imply an equivalent amount of cash earmarked for new projects.
- **US$4.3bn Antamina silver-streaming proceeds were recorded under financing activities**, not in group FCF. They affected liquidity and net debt, while committing BHP to future silver-stream settlements. Incorrect treatment as FCF or recurring copper operating cash flow would distort funding capacity.
- FY2026 cash **18,532** and gross interest-bearing liabilities **27,121** should **not** be used as simultaneous unencumbered available financing; liquidity, deposits, maturities, hedges and noncontrolling interests matter.

Separate BHP **slide 22** shows **approximately $5bn FY2026 Copper-segment attributable FCF**, **$12bn cumulative FY2027–31** and **$24bn cumulative FY2032–35** in management's forecasts, after the relevant copper investment programme and dividends to noncontrolling interests; centralised interest and certain centrally managed taxes are not included at segment level. BHP uses **$5.40/lb** copper for FY2027–31 FCF and **$4.76/lb** for FY2032–35 FCF, not a constant 4.76 across the whole horizon. The **$12bn and $24bn are multi-year cumulative bars**, not annual FCF projections. There is no disclosed annual copper FCF path to reverse engineer.

### B4. Escondida plant capex / physical boundary / management IRR

Original BHP March 17 release: **$4.4–5.9bn** capital range; **220–260ktpa** facility copper output; replacement of Los Colorados. August slide 28: revised **$5.4–6.3bn**; **230–270ktpa** facility output, 50Mtpa throughput, expected **16–18%** IRR using **May 2026 UBS long-term $4.76/lb**, potential first output CY2031–32 and FID CY2027–28. BHP's August results explain the increased capex largely by larger planned output and design maturity; it is **not evidence of a construction-stage cost overrun**. Average capex midpoint: **$5.15bn → $5.85bn**, increase **$0.70bn (13.592%)**.

The BHP slide 36 note explicitly says FY2034–43 production is **from the facility and is not mine-wide incremental**. Do not define incremental project output as 230–270ktpa or apply `tonnes × LME price` as incremental project revenue. No independent project NPV or replication of management IRR is supportable with the inspected public evidence.

### B5. Permit stage — procedural milestone verified through indexed evidence, not severity assessed

Chilean project file **2167965265** lists the DIA filed March 2026, September 3 addendum, **October 9 second ICSARA**, **October 14 extension** and status **En Calificación**, with RCA pending (on the indexed project page). The index links to Chile's official SEA documents, but the *substantive wording of the October 9 ICSARA* and October 14 order could not be retrieved reliably from the official host in this pass. Accordingly, no schedule-delay probability, permit refusal probability, or “material environmental issue” is substantiated. The DIA's **$5.15bn** administrative investment value should not replace the later BHP investor estimate.

### B6. Independent market reference and Goldman forecast provenance

World Bank official October 2026 price table shows copper **$13,200/t for 2026, $13,000/t for 2027, $12,500/t for 2028**. Its 2027 figure is a **calendar-year nominal forecast**, suitably compared with the reported Goldman **2027 average $15,400/t**. FY2027 (BHP year ends June) is **not** the same period as calendar 2027. The *reported* Goldman revision from $13,800/t is supported by dated **October 20 FinancialJuice** reporting, but the original Goldman report text was not retrieved under authorized access. Do not call it primary verified.

A separate **October 23 official Goldman Sachs podcast** quotes a **$15,600/t end-2027** forecast: legitimate independent Goldman evidence of a bullish late-2027 view, but **end-year is not annual average**, and this does not itself verify the reported original $15,400 annual average report.

The ICSG **global refined copper** surplus of about **+368kt** in 2027 is consistent with secondary official-agency summaries. Goldman reportedly estimated an **outside-US** refined market deficit of **−220kt**. They differ by geographic boundary, market accounting, stock changes and potentially definition; do not present them as direct proof that one forecast is wrong.

## C. Red-team issue register / acceptance criteria

| ID | Severity | Risk finding | Required repair or explicit boundary | Release gate |
|---|---|---|---|---|
| RT-01 | CRITICAL | Mistaking facility 230–270ktpa for mine-wide incremental output | Disable increment/NPV worksheets without replacement baseline; distinguish facility vs net preserved vs net added output | BLOCK project valuation |
| RT-02 | CRITICAL | Claiming independent 16–18% IRR calculation from management headline | Label **BHP estimate**, show disclosed $4.76/lb basis, leave independently calculated IRR/NPV blank | BLOCK independent IRR claim |
| RT-03 | CRITICAL | Treating $2.83bn FY26 price sensitivity as 2027 FCF or EPS | Static FY26 underlying EBITDA *illustration only*, with conversion and exposure footnotes | BLOCK FCF bridge |
| RT-04 | HIGH | Doubling capex deductions from BHP forecast Copper FCF | Disclosed 12bn/24bn figures already post-capex and post-NCI distributions; don't subtract ENC again | BLOCK FCF-based funding model |
| RT-05 | HIGH | Applying 57.5% to all consolidated Escondida metrics | Separate subsidiary 100% physical/capex, consolidated reporting, NCI, and ultimate attributable economics | BLOCK attribution claims |
| RT-06 | HIGH | Comparing unrelated FY, CY, real/nominal and ownership bases | Store period, USD vintage, real/nominal and denominator columns, and gate mismatched scenario combinations | BLOCK project ranking |
| RT-07 | HIGH | Using 54% headline with group-total EBITDA denominator | Correct 54.212% operating-segment / 55.201% full-group ratios | FIX before slides |
| RT-08 | HIGH | Booking Antamina silver-stream proceeds as recurring FCF | Classify $4.3bn under financing; separate it from recurring CF and capex | FIX before funding chart |
| RT-09 | HIGH | Stating Goldman $15,400/t as primary verified | Retain “publicly reported Oct 19 Goldman Sachs forecast”; document secondary reporters | FIX before title/publication |
| RT-10 | HIGH | Treating pending permit review as an adverse or certain-delay outcome | Record only procedural events; official ICSARA substantive text review pending | BLOCK quantified delay probabilities |
| RT-11 | MEDIUM | Treating global ICSG surplus and ex-US Goldman deficit as same universe | Geography and inventory-method comparison; avoid contradictory-sign rhetoric | FIX before market slide |
| RT-12 | HIGH | Assuming October Codex work is already incorporated | Local worktree/branch/model unavailable in inspected GitHub history; require inspection or diff from Codex before integration | BLOCK claim of reconciliation |
| RT-13 | MEDIUM | Treating $12bn or $24bn cumulative Copper FCF as annual | Keep published multiyear spans and non-IFRS definitions; no annual interpolation as guidance | FIX before dashboard |
| RT-14 | MEDIUM | Treating March→August increased budget as cost overrun | State refined design and capacity; do not imply realized spending | FIX before risk slide |
| RT-15 | MEDIUM | 38 evidence rows mistaken for 38 independent source documents | Count *claims* vs unique documents separately; add claim-to-source join metadata | FIX before publication |
| RT-16 | MEDIUM | Historical FCF used as recurring funding cushion without distributable cash analysis | Show net cash, NCI dividends, debt maturities, shareholder payouts, Samarco and future commitments separately | FIX before strategy |

## D. What remains unavailable, and why it matters

- **Mine-level baseline**: payable copper output that Los Colorados would contribute absent replacement, grade and recovery with/without new plant, and shut-down chronology. Without it, incremental investment value is undefined.
- **Annual project cash flows**: capital spending by year, working capital, taxes/royalties, water/power costs, closure costs, commissioning ramp, and operating-cost deltas. Without them, *no credible independent NPV/IRR*.
- **BHP financing contributions**: treatment of gross capex and minority funding at asset, consolidated and ultimate shareholder levels. Do not mechanically treat `57.5% × $5.85bn` as a verified cash commitment.
- **Official Chilean environmental conditions**: October 9 and 14 full documents not reliably retrieved. No quantified permit delay or mitigation spending without review.
- **Goldman original authorized research**: October 2026 forecast corroborated by reporting and related official commentary, but original research source not examined.
- **Codex FI002 local research/model**: no visible worktree/commit/PR/file to reconcile.

## E. Reviewer verdicts

**Investment banking reviewer:** Conditional pass for static EBITDA and historical cash-flow analysis. Funding capacity, net debt after investment and payback claims not yet supported.

**Mining equity reviewer:** Pass on separate price and production evidence, with calendar-vs-fiscal and consolidated-vs-attributable labels enforced. No modeled 2027 group earnings guidance.

**Mining project-finance reviewer:** Project valuation **fails gate** until an independently defensible replacement counterfactual and annual project cash flow can be specified. Retain management's 16–18% IRR only as their disclosure.

**Corporate strategy reviewer:** Conditional support for **maintain pre-FID work and preserve optionality**. Accelerate/stage/defer are decision alternatives, not independently ranked on quantified returns.

**Source integrity reviewer:** Primary BHP financial, project and World Bank numbers largely reproduced. Goldman and official Chilean clarification substance remain incomplete; earlier evidence-status labels must retain qualifications.

**Model-QA reviewer:** The four-row sensitivity and specific accounting arithmetic pass independent Decimal-script tests. No full model has been created or formula-checked.

**Publication decision:** **NOT READY FOR PUBLICATION.** Ready only for a bounded, traceable financial-model build with an explicit next review gate.

## F. Sources rechecked this pass

1. BHP FY2026 Results Presentation, 18 August 2026, slide 48 sensitivity, slides 20–22 capital/FCF, slide 28 project, slide 36 detailed footnotes, slide 40 project comparison, slides 49–50 guidance. https://www.bhp.com/-/media/documents/media/reports-and-presentations/2026/260818_bhpresultsfortheyearended30june2026_presentation.pdf
2. SEC BHP Annual Report 2026 as Form 6-K, August 18, 2026, cash flow statement, Note 1 segment reporting, and non-IFRS reconciliations. https://www.sec.gov/Archives/edgar/data/811809/000119312526355840/d54971d6k.htm
3. SEC 20-F FY2026 filing index (Aug 18, 2026; 20-F document too large for current full-page viewer; independent SEC 6-K above is source of numerical crosscheck). https://www.sec.gov/Archives/edgar/data/811809/000119312526354647/0001193125-26-354647-index.htm
4. BHP March concentrator announcement. https://www.bhp.com/news/articles/03/escondida--bhp-submits-environmental-permit-to-build-a-new-concentrator-plant
5. World Bank, Commodity Markets Outlook October 2026 forecast table, page 2. https://thedocs.worldbank.org/en/doc/2ac43f46629cf90c2ea5b8929a343593-0050012026/related/CMO-October-2026-Forecasts.pdf
6. FinancialJuice, Oct 20, 2026, secondary reporting of Goldman copper assumptions. https://www.financialjuice.com/News/9812752/Goldman-Sachs-Copper---FJElite.aspx?xy=rss
7. Goldman Sachs Exchanges podcast, Oct 23, 2026, separate primary public end-year 2027 copper-price remark. https://www.goldmansachs.com/insights/goldman-sachs-exchanges/why-oil-prices-are-surging-despite-recovering-supply
8. Chile SEA indexed via Ambi project 2167965265. https://ambihub.cl/seia/proyecto/2167965265
9. ICSG official press-release catalog and JOGMEC official-agency summary. https://icsg.org/download/2026-10-14-press-release-icsg-copper-market-forecast-2026-2027/ ; https://journal.jogmec.go.jp/metal/news-flash/news-flash_00115.html
10. BHP FY2026 results release and October 2026 operational review. https://www.bhp.com/news/media-centre/releases/2026/08/bhp-results-for-the-full-year-ended-30-june-2026 ; https://www.bhp.com/news/media-centre/releases/2026/10/bhp-operational-review-for-the-quarter-ended-30-september-2026

**No changes to original source register, GitHub repository, published articles, or production dataset.**
