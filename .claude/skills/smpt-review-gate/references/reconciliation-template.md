# Reconciliation table

Recompute each headline figure from inputs; never copy it from the product.

| # | Figure as shown | Location | Recompute method | Payload / formula | Recomputed (full precision) | Match within display rounding? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | — | slide 4 | `strategy_calc.py bridge` | `{"opening": "0", "closing": "-492.375", "components": [{"label": "...", "amount": "..."}]}` | — | yes / no |

Script: `python3 -B .claude/skills/smpt-investment-appraisal/scripts/strategy_calc.py <command> --json '<payload>'`. Pass decimals as strings; the script refuses floats.

Also check, for each figure: unit, currency, period, basis (gross/net, pre/post-offering, commitment/drawn) and the evidence class shown beside it.
