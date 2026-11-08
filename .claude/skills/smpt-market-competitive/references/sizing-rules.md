# Sizing rules

1. **Bottom-up first.** Build from reported units (capacity, offtake volume, installed base) times stated intensities. A top-down share of a published market total is acceptable only as a cross-check, with its source.
2. **Name every assumption.** Each gets an ID, value, unit, source or rationale, and a low/high bound. Put them in the workbook Inputs sheet (Applied Strategy Standard §4).
3. **Range, not point.** Report low, central and high. The central case is not a forecast; say so.
4. **Units and periods.** Keep tonnes of oxide, metal and magnet separate; state the conversion factor and its source if one is applied. Keep fiscal and calendar years separate.
5. **Currency.** Original currency only. Any normalised illustration names its rate, date and source and is labelled analysis.
6. **Arithmetic.** Use `smpt-investment-appraisal/scripts/strategy_calc.py` or a checked workbook. No mental arithmetic in prose.
7. **Label.** Every sized figure is **modeled**. It never appears beside reported figures without that label, and it never enters the tracker.
8. **Materiality test.** State what the sizing is for ("is the option large enough to matter at the low bound?"). If the decision does not change across the range, say so and stop refining.
