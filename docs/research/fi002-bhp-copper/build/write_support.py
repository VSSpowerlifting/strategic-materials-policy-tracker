"""Write the publication's editorial, methodological and reconciliation records."""
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'output'
files={
'SMPT_FI002_Methodology.md':'''# SMPT FI002 — Methodology and reproducibility

Research cutoff: 5 November 2026. Independent SMPT analysis. All monetary amounts are US dollars; workbook cash values are US$m, production is kt and prices are US$/metric tonne unless labeled otherwise. This is a financial-exposure and corporate-strategy study, not a security valuation or a reproduction of BHP's project model.

## Evidence hierarchy and accounting perimeter

The report separates historical financial facts, management guidance, outside forecasts and independent assumptions. BHP's FY2026 annual report, results presentation and Q1 FY2027 operating review anchor financial and project facts. The evidence register records source rights, period, locator, access and limitations. The claim matrix covers the major publication claims. Source records include failed access attempts; their count is not a count of independently verified publications.

Escondida is 57.5% economically owned but fully consolidated. A pro rata cost calculation is not a consolidated cash-flow adjustment or a parent funding schedule. Antamina is equity accounted and is excluded from BHP's disclosed copper EBITDA sensitivity. Production and asset-management reporting can use different accounting boundaries from statutory segment figures. No universal ownership factor is applied to reported Copper EBITDA or revenue.

BHP's disclosed 54% Copper contribution uses Copper + Iron Ore + Coal underlying EBITDA, excluding Group and unallocated. Recalculation: 18,187 / (18,187 + 14,529 + 832) = 54.212%. Copper / reported Group EBITDA = 18,187 / 32,947 = 55.201%. The figures answer different questions.

## Goldman and competing price expectations

The original October 19 Goldman Sachs research note was not obtained. The $15,400/t calendar-2027 annual-average forecast, older $13,800/t average and $14,700/t end-2026 target use publicly attributed reporting, especially the substantive October 20 FinancialJuice article (S18), WII (S08), ICAA (S09) and Reuters carried by Business Recorder (S20). Reports may share an underlying note and do not constitute four independent forecasts. No proprietary bank model, chart or research text is redistributed.

Goldman's October 23 public Exchanges transcript (S16) supplies a related primary $15,600/t end-2027 view. It does not directly verify the proprietary note's annual average. The World Bank October outlook (S12) supplies $13,000/t for the 2027 annual average. The $14,405/t forward observation is a dated October 19 snapshot from coverage, not a current tradable curve. BHP's $4.76/lb long-term project-return assumption is a different horizon from these calendar-2027 forecasts.

ICSG's October 14 primary release (S19) projects global refined surpluses of 104kt in 2026 and 368kt in 2027 and explains a China unreported-stock limitation. Goldman's reported 950kt and 220kt ex-US deficits have a different geographic boundary and methodology. The balances are never netted into an inferred US surplus.

## Primary operating exposure calculation

BHP's FY2026 results presentation slide 48 discloses approximately US$39m of underlying EBITDA sensitivity per US cent/lb copper. Footnotes describe the existing portfolio and total exposed volume, excluding equity-accounted investments.

Use 2,204.6226218488 pounds per metric tonne. For a price difference dP in US$/t:

    delta_cents_per_lb = dP / 2204.6226218488 * 100
    static_EBITDA_USDm = delta_cents_per_lb * 39

The reported Goldman revision of $1,600/t gives 72.5747792 cents/lb and $2,830.416389m. Goldman minus World Bank, $2,400/t, gives $4,245.624583m. The four comparable price references in the CSV retain the same $13,800/t baseline. Rounding occurs only for display.

These are hypothetical changes in a common FY2026-static exposure measure. Large shocks assume linear response. They are not changes from BHP's realized FY2026 price, do not forecast FY2027 volume or costs, and cannot be added to historical EBITDA to construct a forward forecast. No tax, EPS, parent cash or net-debt projection follows from them.

## Secondary FY2027-scale proxy

The pre-existing operating module is retained as a diagnostic and is visibly labeled secondary. Consolidated asset guidance midpoints total 1.575Mt. A 95% assumed payable/sales factor yields 1.49625Mt. At a $1,600/t isolated price revision, gross sales exposure is $2,394m. A 5% assumed price-linked leakage produces $2,274.3m of EBITDA proxy, about 19.6% below the issuer static calculation.

The two measures use different periods, volume scopes, contract exposure and assumed responses. Public data do not provide an exact bridge. The further 35% cash-tax wedge produces a $1,478.295m cash proxy, which is retained for inspectability but is not used as parent funding capacity. Incremental NCI distributions are particularly uncertain. The mixed-period forward group funding bridge from the prototype is withdrawn from the current workbook's funding and dashboard tabs.

## Reverse appraisal of replacement capital

A complete with-build versus no-build project valuation is not possible from the available public information. The independent screen asks what levelized after-tax benefit would recover assumed capital. It neither independently estimates project NPV nor reproduces BHP's 16–18% management-guided IRR.

Base assumptions:

- Gross nominal capital: $5,850m, midpoint of the $5.4–6.3bn issuer range.
- Five equal year-end $1,170m draws in 2027–31. This is not a disclosed expenditure profile.
- Valuation origin: end-2026; discount rate: 10% nominal, an SMPT assumption.
- Twenty full benefit years at year ends 2032–51, no ramp-up or terminal value. Copper price, all-in net burden and resulting annual contribution are held flat in nominal dollars. This levelized convention is not a real-price forecast with inflation escalation; a full appraisal would specify nominal or real annual schedules consistently.
- Long-term copper: $4.76/lb × unit conversion = $10,494.00368/t.
- Assumed levelized all-in net burden: $4,000/t. This is not reported C1 cost or an engineering estimate.
- Assumed cash-tax wedge: 35%, not a fiscal model or statutory rate forecast.

For capital C_y and discount rate r:

    PV_capital = sum(C_y / (1+r)^(y-2026))
    benefit_factor = sum(1 / (1+r)^(y-2026)) over benefit years
    required_annual_benefit_USDm = PV_capital / benefit_factor
    required_equivalent_ktpa = required_annual_benefit_USDm * 1000
                               / ((price - burden) * (1 - tax_wedge))

The base gives PV capital $4,435.220520m, annuity factor 5.286253249, annual benefit $839.010224m and 198.765665ktpa. The numerator is US$m; the margin is US$/t. Multiplication by 1,000 converts the quotient into ktpa. Price at or below burden has no positive finite production solution; the active screen returns n.a. The schedule ends in 2056 and flags a benefit horizon requiring extension. Discount rate must exceed zero for the closed-form comparison equations.

Required equivalent benefit means production preserved or added against no build, translated through an assumed margin. Facility total output of 230–270ktpa cannot be equated to it. Avoided sustaining investment, alternative circuits, by-products, differences on common production, closure, working capital, royalties and tax depreciation may change the money benefit without changing tonnes. A complete model would use those annual differences directly.

The full capital budget remains in the screen. Readiness approval does not establish an amount actually spent and sunk at the decision date. An incremental sanction model would exclude demonstrably sunk costs and include relevant remaining commitments once known. Applying 57.5% to both capital and operating benefit cancels in the production-equivalent ratio; applying it to only one side would create a scope error.

## Scenarios and sensitivities

The six selectable scenarios remain Base, Upside, Downside, Delay, Overrun and Combined stress. The near-term price selector is independent from the long-term screen price. They are deterministic tests, not probabilities or forecasts. Thresholds are approximately 199, 143, 287, 219, 239 and 416ktpa respectively. Combined stress uses $8,500/t long-term copper, 20% more capital and two years of benefit deferral with capital timing held fixed.

The additional screen table independently varies rate, duration, first benefit, burden, price and capital. Ten benefit years from 2032 produces 275.398ktpa; moving those ten years to 2034 produces 333.232ktpa at otherwise unchanged assumptions. The latter comparison combines shorter duration and a later start, rather than isolating duration alone. The fiscal-year facility averaging window is not an exact calendar-year cash-flow schedule. That does not claim a ten-year mine life. BHP's disclosed FY2034–43 averaging window does not validate the base's twenty flat benefit years. The price-cost frontier uses a numeric price axis with actual unequal price intervals.

An option illustration shifts both capital and benefits. With the same shift, the discount factors cancel from the required annual benefit apart from an assumed capital premium. A 10% acceleration premium or 5% staging escalation therefore produces a 10% or 5% increase mechanically. These identities do not rank real alternatives. The illustrative 125ktpa lost-year cash value is approximately $528m at the base assumed margin; it is not an observed Los Colorados decline forecast.

## Funding controls

FY2026 reported FCF is $21,778m CFO minus $12,011m net investing outflow = $9,767m. It already includes investment. Cash dividends of $6,756m to BHP holders and $2,355m to NCI leave $656m before other financing. This is a historical subtotal, not a funding forecast. The $4,300m silver-streaming liability receipt is in financing, outside FCF. Cash, restricted cash, RCF availability and net-debt policy headroom are separate concepts.

BHP's $12bn FY2027–31 and $24bn FY2032–35 Copper FCF projections are cumulative attributable management scenarios, already after modeled capex and NCI distributions, with specified centralized interest and tax exclusions. They are not annual guidance. Do not subtract New Concentrator capital again or combine gross project budgets with annual guidance to invent a funding gap.

## Reproduction and software

Run `research_v2.py`, then `build.mjs` (artifact-tool workbook authoring), then `report.py`, `executive_brief.py` and `executive_deck.mjs`. Convert the final PPTX to PDF with LibreOffice. `verify.py` independently sums annual cash flows, compares cached formulas in the local and native-exported workbooks and inspects PDF/PPTX structure. `readback.mjs` renders bounded views from an exported native Sheet. The finalized PowerPoint contains native tables and charts with embedded editable data; chart values use six decimal places to preserve Excel portability. The report uses original vector exhibits. `build/report-narrative.json` is the canonical editorial narrative; `report.py` generates the accepted PDF, Markdown, HTML, captions and exhibits from it. Editorial refinement preserves the model, calculation CSVs and brief without changes. The presentation retains its numbers and gains a bounded format/editorial revision under Presentation Standard v2; `export_deck_pdf.py` supplies system font directories to LibreOffice to avoid silent substitution.

See the repository README for runtime commands and the QC record for exact test results, visual checks and software limits. Legacy prototype builders and conclusions are archived and are not the current regeneration path.
''',
'SMPT_FI002_Reconciliation.md':'''# FI002 — Reconciliation and changes in judgment

5 November 2026. Internal research reconciliation, not an external independent opinion.

Baseline: [PR #202](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/202), branch `research/fi002-bhp-copper-handoff-2026-11-05`, commit `649d5ab30c765e863bc237efbbff3e26dccc1531`. Its `research/fi002/` files remain unchanged. The earlier local package is preserved in `archive/2026-11-04/`. The latest user brief authorizes expansion beyond the baseline's earlier bounded workbook-only next step.

| Issue | Assessment and resolution |
| --- | --- |
| Missing disclosed copper sensitivity | Adopt PR #202's correction. BHP slide 48 provides $39m per US cent/lb on FY26 portfolio exposure. Make the resulting $2.83bn illustration primary. |
| Scope of the earlier $2.27bn EBITDA proxy | Keep as a labeled FY27-scale diagnostic, about 19.6% below the issuer static measure. No exact reconciliation is possible from exposed-sales and contract information. |
| Parent funding and cash residuals | Withdraw the mixed-period $0.14bn base / negative $1.65bn downside funding residuals from current decision use. Replace tab 07 with historical facts and separately scoped management projections. The $1.48bn secondary cash proxy is not available parent funding. |
| Ownership | Full consolidation and 57.5% economic interest remain distinct. Gross capital and gross operating benefit share the same perimeter in the screen. |
| Long-term prices | Annual-average 2027 forecasts are separate from BHP's $4.76/lb long-term IRR input. The bank's public $15,600/t end-2027 view is separately identified. |
| Replacement versus incremental output | Accept the baseline's safeguard. The facility range does not establish incremental mine benefit. Obtain a no-build mine plan before claiming project value. |
| 199 / 416ktpa | The arithmetic is valid under its assumptions, but cannot be a viability conclusion. Demote to reverse appraisal and add the 333ktpa ten-year-from-2034 case. Disagree with banning all threshold analysis: a transparent required-benefit calculation can reveal which evidence matters without claiming actual value. |
| Timing options and recommendation | A shift of both capital and benefits largely cancels in the discount equation. Assumed premiums cannot establish optimal staging. Replace the prototype's staging preference with funded conditional readiness and explicit acceleration/deferral tests. |
| Capex double counting | No project budget is subtracted from reported FCF or from management FCF scenarios already net of investment. Total project budgets, annual guidance, real and nominal dollars, remaining spend and ownership remain distinct. |
| Goldman source access | The original starting FinancialJuice URL was only a shell. A substantive alternative URL was retrieved, supported by other public reporting including Reuters. The primary public Goldman transcript supplies a related but distinct forecast. The original proprietary note remains unobtained. |
| ICSG source access | Improve on the baseline by reading the primary October 14 PDF. Confirm global surpluses and the China unreported-stock caveat. Do not net global and ex-US balance measures. |
| Environmental status | Latest indexed November 4 filing is an applicant extension request. It is not a granted extension, approval or quantified delay. Underlying October substantive documents remain inaccessible. |
| Evidence count | Baseline 38 records are claim/input records, not 38 independent publications. The current source register has 21 document/access records and a separate 14-claim matrix. |

The current report deliberately avoids workflow history in its main argument. This record preserves material corrections, source-access changes and the reasons for disagreement. No original result is retained solely because it appeared in the prototype.
''',
'SMPT_FI002_Publication_Summary.md':'''# Publication package — SMPT Financial Intelligence 002

**Proposed title:** Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision

**Subtitle:** Near-term earnings exposure, replacement economics and the case for conditional investment readiness

**Cutoff:** 5 November 2026. **Gate:** READY FOR EDITORIAL REVIEW. Private internal preparation only.

## Abstract

Goldman Sachs' reported $15,400/t average copper forecast for 2027 creates a material earnings scenario for BHP, but does it strengthen the case for accelerating Escondida's New Concentrator? This independent SMPT study compares rival price expectations using BHP's disclosed operating sensitivity and examines the benefits required to recover a roughly $6bn replacement budget. The reported Goldman revision translates into $2.83bn of hypothetical FY2026-static EBITDA exposure; its gap to the World Bank translates into $4.25bn. Neither is a forward cash-flow forecast. A reverse-appraisal screen yields 199ktpa under twenty assumed benefit years, but 333ktpa with only ten years from 2034. The missing no-build mine plan, benefit duration and cost profile therefore constrain the investment judgment more than another near-term price target. The research favors funded pre-FID readiness and conditional construction decisions, with explicit evidence that would justify acceleration, staging or re-scoping.

## Principal findings and original contribution

- A common issuer-disclosed exposure scale makes Goldman and World Bank price differences economically interpretable without inventing a forward earnings model.
- The older FY27-volume proxy is about 19.6% lower than the FY26-static issuer illustration. Scope differences prevent exact reconciliation.
- Replacement value must include production preserved and avoided costs. Facility total output is not wholly incremental mine output.
- Duration and margin assumptions materially change the required equivalent benefit. The 199/333/416ktpa results are assumption tests, not investment ratings.
- Historical cash, management's cumulative attributable projections and project capital remain separate to avoid double counting.
- Fund readiness. Rank major construction alternatives only with a costed with-build/no-build plan and a safe, permitted execution schedule.

## Download inventory

- `SMPT_FI002_BHP_Copper_Research_Report.pdf`: flagship, 14 pages.
- Matching `.html`: standalone editable report with embedded vector figures and linked source guide. Matching `.md`: editable narrative with separate SVG assets.
- `SMPT_FI002_BHP_Copper_Model.xlsx`: editable 11-tab workbook; native Google Sheet is the live model.
- `SMPT_FI002_BHP_Copper_Strategy_Deck.pptx` and `.pdf`: 12-slide executive edition, with native tables and charts.
- `SMPT_FI002_BHP_Copper_Memo.pdf` and `.md`: two-page executive decision brief.
- `SMPT_FI002_Evidence_Register.csv`, `SMPT_FI002_Claim_Source_Matrix.csv`: source/access and major-claim lineage.
- Methodology, reconciliation and quality-review Markdown files; four calculation CSVs; verification JSON; reproduction source in GitHub.
- Dated prototype and PR #202 baseline remain separately preserved, not current publication downloads.

## Editorial boundaries

SMPT is independent of Goldman Sachs and BHP. Neither commissioned, sponsored, participated in or endorsed the analysis. Original proprietary bank research was not obtained or redistributed. The report relies on credible attributed public reporting for the Goldman annual average and separately identifies primary public bank commentary. It cannot independently value the project or reproduce the issuer IRR. Environmental status is mirror-based and needs refresh before release.

The editor should review framing, financial interpretation, source limitations and final typesetting, then authorize a separate website phase if desired. No public posting, sharing-permission change, merge, deployment or distribution is part of this completed research-preparation task.

## Final expert and editorial audit

The final internal audit retains the research conclusions and all model outputs. The report develops the transmission from copper prices to earnings exposure, funding choices and replacement economics in longer connected paragraphs. It makes explicit the flat nominal margin assumption and separates the 199→275ktpa duration change from the further 275→333ktpa effect of later benefits. The two-page brief remains consistent and unchanged. The existing 12-slide deck adopts Presentation Standard v2 typography and palette, clearer source locators and targeted interpretive edits; all chart values and table numbers are preserved. The Quality Review records the skeptical review, examples and final checks. Status: **READY FOR EDITORIAL REVIEW**, for the user’s approval; public release remains unauthorized.
''',
'SMPT_FI002_Website_Handoff.md':'''# Website publication handoff — approval pending

Status: READY FOR EDITORIAL REVIEW, not publicly released. Use the Publication Summary for proposed title, subtitle, abstract, original contribution and download descriptions. The 14-page report is the flagship; the model and deck support it.

Before a separate authorized website change:

1. Obtain Ben's editorial and public-release approval of the current package.
2. Refresh the Goldman public attribution, BHP project guidance and environmental review record against publication date. Preserve the 5 November research cutoff for the analytical edition or clearly date a revised edition.
3. Verify all private Drive links and select a separately authorized public download destination. Do not expose private university Drive files by changing permissions implicitly.
4. Build a research landing page with clear independence language, PDF and editable/model downloads, source basis and methodological limits. The original bank note is not part of the package.
5. Preserve horizon labels: annual-average 2027, end-year 2027, FY26-static exposure and long-term project screen. Do not promote 199ktpa to a project viability verdict or $2.83bn to forecast FCF.
6. Run the website's ordinary content, accessibility and link checks in the separate publication branch. Route through existing reviewer and publication gates.

This branch changes research documents only. It does not change public datasets, site content, source permissions, schema, CI or deployment workflows. The handoff depends on PR #202's preserved research baseline and the new research-publication draft PR. Neither should be merged automatically.
'''
}
for name,body in files.items():(O/name).write_text(body)
# The original six-page memo is already preserved identically in the dated archive.
for ext in ['md','pdf']:
 p=O/f'SMPT_FI002_BHP_Copper_Strategy_Memo.{ext}';a=R/'archive/2026-11-04'/p.name
 if p.exists():
  assert p.read_bytes()==a.read_bytes();p.unlink()
print('Wrote support records; current package has one flagship and one distinct decision brief.')
