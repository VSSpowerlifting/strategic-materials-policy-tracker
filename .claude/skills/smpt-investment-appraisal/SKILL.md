---
name: smpt-investment-appraisal
description: Appraise a strategic-materials investment or support decision with deterministic arithmetic — NPV, annuity factors, reverse (break-even) thresholds, IRR with multiple-root warnings, sensitivities and scenarios — labelled reported, derived or modeled. Use when a product asks what volume, price, subsidy or capital level would make a project work, compares options on value, or needs any discounting; always run numbers through scripts/strategy_calc.py or a checked workbook.
---

# SMPT investment appraisal

Answers "what would have to be true?" rather than "what will happen?". The default method is a reverse appraisal: fix capital, timing, discount rate, price and cost assumptions, then solve for the threshold (volume, margin, support) that recovers the capital. A threshold is a test the evidence can be held against, never a forecast of output.

Governing rules: `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md` §4 (workbook areas; every figure reported, derived or modeled) and §5 Financial integrity and Model QA; the projection boundary in `CLAUDE.md` (projections stay out of the tracker). Worked precedent: FI002 (`docs/research/fi002-bhp-copper/output/`).

## When to use

- A deck asks whether a project, subsidy or price floor is large enough to matter.
- Two options need comparing on value under stated assumptions.
- Any discounting, annuity, IRR or sensitivity is involved.

Inputs come from `smpt-evidence-baseline` (reported) and `smpt-market-competitive` (modeled sizing). Outputs feed `smpt-options-decision`.

## Method

1. **Frame the test.** Write the question as a threshold: "Annual volume at which after-tax margin recovers PV of capital over N years at r%." Name the decision the threshold informs.
2. **Assumption register.** Every input gets an ID, value, unit, period, class (reported / derived / modeled), source or rationale and a sensitivity range. Capital phasing, origin year, discount rate (and its basis), benefit window, price, unit cost/burden and tax wedge are explicit. Use `references/appraisal-workbook-template.md`.
3. **Compute with the script.** `python3 -B scripts/strategy_calc.py <npv|annuity|threshold|irr|bridge|totals> --json '<payload>'`. Pass numbers as strings; floats are refused. Keep full-precision outputs in the Calculations area and round only for display.
4. **Interpret the threshold.** Compare it with reported capacity, offtake or output *as evidence*, not as a prediction. If margin is not positive the threshold is "n.a." — say so rather than forcing a number. A zero discount rate is refused for thresholds; justify any rate used.
5. **Sensitivities.** Vary one input at a time across its range, then show at most three named scenarios. Report which inputs move the conclusion and which do not. Avoid tornado charts that imply symmetric ranges unless they are.
6. **IRR, if used.** Report it only with its cash-flow pattern. The script warns on no sign change or multiple sign changes (possible multiple IRRs); carry the warning into the text. Prefer NPV at a stated rate for decisions.
7. **Unit discipline.** Keep $/t and c/lb, oxide and metal, nominal and real, fiscal and calendar apart. Conversions use the script's `LB_PER_TONNE` or a sourced factor.
8. **Checks.** Rebuild headline outputs independently (second method or hand-check row) and record each check's result in the workbook Checks area.

## Deliverables

- Assumption register with classes and ranges.
- Calculation record (script payloads and outputs, or workbook sheets).
- Threshold statement in words with its "not a forecast" qualifier.
- Sensitivity table and up to three labelled scenarios.
- Checks list with PASS/FIX.

## Verification

- `python3 -B -m unittest test_strategy_calc` passes in `scripts/` (FI002 and FI003 anchor values).
- Every output traces to a payload or workbook cell; no arithmetic done in prose.
- Each displayed figure carries its class; modeled figures never appear unlabelled beside reported ones.
- Rounding is display-only and consistent; totals of rounded figures are recomputed from unrounded ones.
- Run `references/appraisal-checklist.md`.

## Completion

Complete when a reviewer can rerun every number from the register, see which assumptions drive the conclusion, and read the threshold as a test rather than a prediction.

## Boundaries

- No market-price forecasts, valuations, price targets or investment advice; prices used are labelled assumptions with their source.
- No result enters `data/seed/*`.
- Do not convert currencies inside the appraisal unless the rate, date and source are stated and the output is labelled analysis.
