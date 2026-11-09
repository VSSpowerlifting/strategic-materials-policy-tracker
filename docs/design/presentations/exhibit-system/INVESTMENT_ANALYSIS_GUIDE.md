# Investment-analysis questions: which existing pattern to use

This guide maps common investment-research questions to patterns that already exist in the registry. It adds no pattern, renderer, data or standard. For a deck, it sits under the [Presentation Standard v2](../SMPT_PRESENTATION_STANDARD_V2.md), the [Exhibit and Chart Rules](../EXHIBIT_AND_CHART_RULES.md) and the [Applied Strategy Standard](../../../research/SMPT_APPLIED_STRATEGY_STANDARD.md). Where this guide and those documents disagree, those documents govern.

Every row below was checked with `exhibits:select` using the question type and traits shown. Selection stays advisory. The cautions below describe the renderers as of commit c69e8fc; re-check the `waterfall` cautions after PR #215 lands, since it extends that renderer. Before choosing a pattern, read its `use_when`, `avoid_when`, `limitations` and `data_contract` in [`exhibit-registry.json`](exhibit-registry.json).

## Question → pattern

| Research question | Question type and traits | Pattern(s) | Constraint to state on the slide |
|---|---|---|---|
| What moved one measure from period A to period B? (driver bridge) | `reconcile`; `additive-movements`, `single-measure` | `waterfall` | Name the measure in the title and unit, for example EBITDA or operating cash flow. One bridge reconciles one measure. |
| How is a financing package funded, and what does it pay for? | `reconcile`; `parts-of-whole` | `sources-and-uses` | Sources and uses must total the same amount on one basis. |
| How much capital sits at each commitment stage? | `composition`; `status-stages`, `single-measure` | `status-separated-capital` | Stages come from the system's status taxonomy (below). Never add stages together into one total. |
| How do projects compare on one measure? | `rank`; `single-measure` | `ranked-bar` | All bars share one measure, one unit and one denominator. |
| How do projects compare when bases differ (currency, year, scope, total vs incremental)? | `rank`; `non-comparable-bases` | `parallel-basis-panels` | Give each basis its own panel and axis. No cross-panel ranking. |
| How did a capacity or cost figure change between two dates? | `compare-two-observations`; `two-observations`, `single-measure` | `dumbbell`, `slope` | Both observations use the same definition. |
| Which assumptions move a reviewed model's output most? | `sensitivity`; `model-output`, `single-measure`, `intervals` | `tornado` | Only from a model that has already been reviewed. The exhibit does not create a model. |
| How does the output vary across two assumptions? | `sensitivity`; `model-output`, `single-measure`, `conditions` | `sensitivity-grid` | Same model constraint. Mark the base case and any stated threshold. |
| Where do projects sit against a threshold (for example a hurdle on two measures)? | `relationship`; `two-measures`, `conditions` | `threshold-scatter` | The threshold must come from a cited source or the reviewed model, never chosen to fit the chart. |
| Do two project measures relate, and does a third scale them? | `relationship`; `two-measures` (+ `third-measure`) | `scatter`, `bubble` | Same denominators across points. |
| Which option meets which criterion? | `decision`; `criteria` | `criterion-matrix` | Categorical evidence only. No weighted or synthetic score. |
| What would have to be true for each option? | `decision`; `conditions` (+ `edges`) | `option-profile`, `condition-tree` | Conditions are stated as conditions, not forecasts. |
| What are a project's economics, exactly? | `lookup`; `exact-values` | `exhibit-with-interpretation` | Each figure carries its basis, date and source. |
| Where is a project in its lifecycle? | `sequence`; `status-stages`, `dated-events`, `states` | `stage-ladder` | Four to six project milestones in process order, each label at most 24 characters. A stage counts as reached only if every earlier stage was. Labels are free text (see below). |
| When did each lifecycle milestone happen, and how well evidenced is it? | `sequence`; `dated-events`, `states`, `time-axis` | `evidence-milestone-strip` | Separate announced or targeted dates from reported or verified ones. |
| How has a measure moved over time, and around which events? | `trend`; `single-measure`, `time-axis`, `dated-events` | `annotated-line` | Shared dates do not prove causation. |
| What share does each part hold of a total? | `composition`; `parts-of-whole`, `single-measure` | `stacked-bar`, `percent-stacked` | Parts must be additive on one basis. |
| How does material move through processing stages? | `flow`; `quantified-flows`, `additive-movements`, `single-measure` | `conversion-flow` | Each step must reconcile: output plus loss equals the step's input, in the stated unit. The renderer checks this with `reconciles()`. |

## Cautions specific to investment exhibits

**Status and evidence vocabulary.** Keep three things apart, and do not invent a fourth vocabulary:

- *Transaction and financing status* (announcement through operational) is `STATUS_TAXONOMY` in [`scripts/exhibit-system/integrity.ts`](../../../../scripts/exhibit-system/integrity.ts). `status-separated-capital`, `option-profile` and `location-table` check against it.
- *Evidence state* (announced, targeted, reported, independently verified) is `EVIDENCE_STATES` in the same file. `evidence-milestone-strip` checks against it.
- *Industrial project milestones* (for example permitting, final investment decision, construction, commissioning) are the free-text labels in `stage-ladder`. The renderer checks their order and dates, not their vocabulary. Take the milestone names from the source, and do not present them as financing status or evidence state.

**An EBITDA bridge is not a cash bridge.** Earnings, operating cash flow and free cash flow differ by non-cash items, working capital and capital expenditure. Use one `waterfall` per measure. Do not move between measures inside one bridge.

**Bridges cannot pass below zero.** `waterfall` enforces `bridge-levels-nonnegative`: a running level below zero, such as earnings moving through a loss, is rejected. Use the pattern's table alternative (line item, movement, running balance) instead.

**No subtotal columns.** `waterfall` draws start, signed movements and end only. To show a driver sequence with intermediate totals, use consecutive bridges in which the closing value of one opens the next.

**Total versus incremental capacity.** Never stack an expansion's incremental capacity on top of a total-capacity figure. Use `dumbbell` for existing against post-expansion capacity, or a `waterfall` from existing to post-expansion capacity on one basis. If sources define capacity differently, use `parallel-basis-panels`.

**Consistent denominators.** Unit cost, capital intensity and output per unit compare only when numerator, denominator, currency and year match. When they do not, use `parallel-basis-panels`. The Exhibit and Chart Rules ask "Is the denominator identical" for this reason.

**Scenarios and thresholds come from reviewed work.** `tornado`, `sensitivity-grid` and `threshold-scatter` display outputs. They do not create forecasts, price decks or scenarios. Under the Applied Strategy Standard, label each value as evidence, assumption or scenario.

**Check the data contract before relying on a variation.** A pattern's `variations` field lists design ideas. Not every idea is implemented by the renderer. The `data_contract` and `integrity_rules` define what actually renders.

## Not covered by an existing pattern

**Cost curves.** No registered pattern draws variable-width bars of capacity against unit cost. `annotated-line` is not a substitute, because a cost curve is not a time series. Until a pattern exists, use a ranked table (`exhibit-with-interpretation`), or `ranked-bar` on unit cost with capacity stated in the annotation, and record a `table_reason` in the slide manifest.

**Multi-project economics matrix.** No single exhibit standardizes capex, capacity, capital intensity, IRR and approval status across several projects. `exhibit-with-interpretation`, `criterion-matrix` and `parallel-basis-panels` each cover part of this. Until a pattern exists, use a table that states each figure's basis, date and source, and record a `table_reason`. This is a possible future requirement, not a scheduled renderer.
