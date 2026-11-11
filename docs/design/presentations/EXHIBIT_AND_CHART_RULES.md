# SMPT Exhibit and Chart Rules

Version 2.0 · 5 November 2026 · [Return to presentation index](README.md)

AI-assisted quantitative charts and graphics must also pass the [Editorial Authenticity & Visual Integrity Standard](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md), particularly the original-data, evidence-status, editable-figure and visual-purpose checks.

## Chart selection follows the analytical question

| Question | Preferred exhibit | Guardrails |
|---|---|---|
| How does a total decompose? | Segmented horizontal bars or labeled part-to-whole | All components must have same unit, denominator and legal/status basis |
| What changed a balance? | Sources-and-uses table or **true** waterfall | Every change reconciles; beginning and ending balances are measured on comparable bases |
| How do alternatives compare? | Aligned horizontal bars, compact comparison table | Include baseline, same timing, unit and decision objective |
| How sensitive is an outcome? | Driver bridge, tornado, scenario matrix | Identify base case, each changed input, cumulative vs standalone changes |
| What changed over time? | Time series / dated step chart | Activity date, publication date and observation date may differ |
| Where does a project stand? | Milestone strip with evidence status | Separate announced/targeted/reported/independently verified events; mark contract deadlines as contractual and dates that occur only if a stated term is met as conditional, never as targeted |
| What depends on what? | Explicit dependency or conversion-flow diagram | Arrows must mean a supported dependency, not assumed causality |
| What is distributed among categories? | Ranked bars or heatmap | Define measures and avoid legends that imply completeness when coverage is selective |
| How does capital allocation affect outcomes? | Financing table, cash-flow sensitivity or decision matrix | Document shareholding, price basis, cash timing, contingent instruments and financing cost |

**Never choose a chart because it looks like consulting.** Choose it because it exposes a comparison the decision-maker otherwise cannot see.

Use the [broader visual repertoire and linked examples](VISUAL_REPERTOIRE_AND_REFERENCES.md) when selecting the exhibit. It covers paired observations, small multiples, sensitivity heatmaps, conditional states, networks, option profiles and other forms beyond tables and bars. Test a graphical alternative for timing/change/state evidence before defaulting to a prose-filled table. Keep the same scale/encoding across intentionally comparable exhibits.

## Transaction and financing taxonomy

SMPT's status vocabulary should persist into presentations:

1. Announcement or **selection for negotiation**.
2. Authorization or conditional offer.
3. Binding or executed commitment (if explicitly evidenced).
4. Drawdown/disbursement or funding received.
5. Expenditure/use of proceeds.
6. Operational milestone, delivery, invoicing or cash collection.

A government announcement does not itself establish a drawdown; an executed loan is not a grant; equipment finance and shareholder equity have different repayment implications.

### FI001 worked transaction example

- **£36m equity:** risk capital, no scheduled principal repayment.
- **£25m core loan:** gross core financing; full draw disclosed by annual-accounts approval on 2 September 2026.
- **£10m accordion:** explicitly *uncommitted* additional borrowing capacity.
- **£61m:** gross equity + core-loan instruments, **not** current available cash.
- **£71m:** maximum headline including uncommitted capacity, **not** a fully drawn package.

Use solid bars for the two components of gross core financing; use a *visibly separate dashed/outlined* bar for the accordion. Make the summary of £61m prominent. Do not stack the accordion into a single visually solid £71m bar without differentiating status.

### Historical and illustrative scenario example

- October remaining project-spend guidance: **£40m–£45m excluding operating costs**; midpoint used for sensitivity **£42.5m**.
- Illustrative *incremental* downside stress: **£2.5m capex + £3m delay + £0.25m analyst rate proxy = £5.75m**.
- Original August plan receipt-timing counterfactual: defer £15m of expected receipts; result approximately **£2m negative** on aggregate published totals or **£1m negative** on separately rounded detail.
- These scenarios have different time bases. Never add them to imply a contemporaneous funding gap or currently observed cash shortage.

If an arithmetic bridge combines non-comparable statuses or time periods, use **parallel exhibit panels** rather than a single waterfall.

## Mandatory parts of a quantitative exhibit

A strong chart contains:
- **Assertion title** (what the chart supports).
- **Measure subtitle** (unit, geography, observation window, basis).
- A visual with legible direct labels or a compact legend.
- **One interpretive annotation** explaining the economic mechanism or strategic implication.
- **Source footer** with document title, publication date, underlying reference where available, and model/cell ID for calculated values.
- Footnote only for a caveat material to interpretation; move secondary methods to appendix.

Where issuer and analyst values share an exhibit, clearly differentiate their provenance, not merely their color. Scenario outputs must state whether modeled, reported, forecast, guidance or hypothetical.

## Numeric integrity rules

1. Show currency, scale, sign convention and whether figures are nominal, real or FX-converted.
2. Use consistent material content units (contained metal vs concentrate, tonnes vs short tons, ownership share).
3. Bars expressing magnitude start at zero unless explicitly justified; lines may use a labeled nonzero y-axis when the analytic question requires it.
4. Avoid 3D charts, pie charts with many categories, decorative gradients and dual axes unless rigorously justified.
5. Round consistently; display a "may not sum due to rounding" note only if the sums actually differ.
6. Avoid precision unsupported by input disclosures.
7. Compare like-with-like periods, and state whether a measure is as-of date, annualized run rate, cumulative or fiscal-year total.
8. Changes in percentage points are not changes in percent.
9. A scenario's arithmetic must trace to workbook inputs or an independently rerunnable script.
10. No slide should imply forecast certainty when assumptions are discretionary.

Displayed precision should serve the decision; keep full precision in the source/model. For example, one decimal may be enough for a USD-million presentation even when the audit schedule uses three. Round each label from its controlling value rather than accumulating rounded movements. If rounded labels fail to reconcile, disclose the actual rounding difference. Small waterfall movements must keep true-scaled geometry; use direct labels or an explicitly separate detail scale instead of inflating bars.

## Chart grammar and accessibility

- Use cream ground \`#F5F3EE\`, dark ink \`#1B1915\` and gold-toned emphasis \`#7A5510\`; graphite \`#12110F\` on covers/closing slides.
- Neutral bars are distinguishable without color alone through labeling, placement, outline or pattern.
- One main result highlighted per chart. Avoid coloring every segment gold.
- Legends follow visual order, and status labels should be written directly onto line/bar groups when feasible.
- Column/row labels repeat after page breaks only where needed.
- Sources are clickable in PDF exports and usable as plain text when printed.
- Use exactly one numeric grammar: decimal point, currency format, thousands separators, negative signs, standard date format.
- Long tables belong in the companion workbook or appendix, unless the table itself is the decision exhibit.

## Editorial red flags

Reject a chart when it:
- Makes loan capacity look like cash on hand.
- Treats selected-but-unexecuted government finance as spent.
- Subtracts remaining project expenditure from gross announced financing to invent a cash balance.
- Treats a historical negative-cash counterfactual as the current position.
- Uses a timeline arrow to imply government funding *caused* production already underway.
- Mixes contracted offtake volume and realized physical deliveries.
- Presents a management target as a verified operating result.
- Compares a 2027 commodity price scenario directly to 2031/32 production without an explicit forward price path.
- Extrapolates asset cash flows using gross project production rather than the relevant attributable ownership share.
- Uses unreadable sources or footnotes.

## Slide-review checklist

- [ ] Can a reader state the chart's takeaway in ten seconds?
- [ ] Does the chart measure the same claim as its headline?
- [ ] Are timing and legal status visible without reading the appendix?
- [ ] Are source attribution and calculation provenance verifiable?
- [ ] Is the denominator identical across comparators?
- [ ] Is the visual answer stable under reasonable rounding?
- [ ] Are meaningful unknowns retained?
- [ ] Has a second reviewer checked the arithmetic against the source workbook?
- [ ] Does the exported PDF preserve font size, hyperlinks and readable labels?

## Further methodological reading

- [Financial Times visual vocabulary](https://www.ft.com/content/c7bb24c9-964d-479f-ba24-03a2b2df6e85) — chart selection by the analytical relationship.
- [MIT Sloan Executive Education, visual data storytelling](https://executive.mit.edu/4-foundational-tactics-for-better-visual-data-storytelling-MCHNB7ICYNCVCT5GJCATO6HH6SME.html) — headline, one idea, comparison, and visual economy.
- [McKinsey, 2024 year in charts](https://www.mckinsey.com/featured-insights/2024-year-in-review/2024-year-in-charts) — published examples of directly attributed comparative evidence.
- [BCG written-case example](https://media-publications.bcg.com/BCG-Written-Case-Example.pdf) — concise conclusion-first presentation and quantitative graphs; its 3–5-slide *interview* limit is not a research-deck standard.
