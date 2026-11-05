# SMPT FI002 — Methodology and reproducibility

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
- Twenty full benefit years at year ends 2032–51, no ramp-up or terminal value.
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

The additional screen table independently varies rate, duration, first benefit, burden, price and capital. Ten benefit years from 2034 produces 333.232ktpa at otherwise unchanged assumptions. That does not claim a ten-year mine life. BHP's disclosed FY2034–43 averaging window does not validate the base's twenty flat benefit years. The price-cost frontier uses a numeric price axis with actual unequal price intervals.

An option illustration shifts both capital and benefits. With the same shift, the discount factors cancel from the required annual benefit apart from an assumed capital premium. A 10% acceleration premium or 5% staging escalation therefore produces a 10% or 5% increase mechanically. These identities do not rank real alternatives. The illustrative 125ktpa lost-year cash value is approximately $528m at the base assumed margin; it is not an observed Los Colorados decline forecast.

## Funding controls

FY2026 reported FCF is $21,778m CFO minus $12,011m net investing outflow = $9,767m. It already includes investment. Cash dividends of $6,756m to BHP holders and $2,355m to NCI leave $656m before other financing. This is a historical subtotal, not a funding forecast. The $4,300m silver-streaming liability receipt is in financing, outside FCF. Cash, restricted cash, RCF availability and net-debt policy headroom are separate concepts.

BHP's $12bn FY2027–31 and $24bn FY2032–35 Copper FCF projections are cumulative attributable management scenarios, already after modeled capex and NCI distributions, with specified centralized interest and tax exclusions. They are not annual guidance. Do not subtract New Concentrator capital again or combine gross project budgets with annual guidance to invent a funding gap.

## Reproduction and software

Run `research_v2.py`, then `build.mjs` (artifact-tool workbook authoring), then `report.py`, `executive_brief.py` and `executive_deck.mjs`. Convert the final PPTX to PDF with LibreOffice. `verify.py` independently sums annual cash flows, compares cached formulas in the local and native-exported workbooks and inspects PDF/PPTX structure. `readback.mjs` renders bounded views from an exported native Sheet. The finalized PowerPoint contains native tables and charts with embedded editable data; chart values use six decimal places to preserve Excel portability. The report uses original vector exhibits.

See the repository README for runtime commands and the QC record for exact test results, visual checks and software limits. Legacy prototype builders and conclusions are archived and are not the current regeneration path.
