# Appraisal workbook layout

Follows the Applied Strategy Standard §4 areas. One concept per sheet; inputs never typed into calculation cells.

| Sheet | Contents |
| --- | --- |
| Read me | Question, decision, cutoff, author, status (draft), what the model does not do |
| Sources | Source IDs used (from the evidence baseline) |
| Inputs | Assumption register (below) |
| Calculations | Script payloads and full-precision outputs, or formulas referencing Inputs only |
| Scenarios | Up to three named scenarios as input overrides |
| Outputs | Display figures, rounded, each with its class |
| Checks | Independent rebuilds and tie-outs, each PASS/FIX |

## Assumption register

| ID | Input | Value | Unit | Period | Class | Source / rationale | Low | High |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | Capital phasing | five equal year-end draws of 1,170, 2027–31 | USD m | nominal | modeled | SMPT assumption; not a disclosed expenditure profile | — | — |
| A02 | Discount rate | 10% | — | annual, nominal | modeled | SMPT assumption | 8% | 12% |
| A03 | Long-term price | 4.76 | USD/lb | as stated | reported (as the company's assumption) | company's long-term project-return assumption, Sxx | — | — |

(Rows A01–A03 follow FI002's methodology; the Low/High columns are illustrative.)

## Script payload example (FI002 pattern)

```json
{"capital_flows": [["2027","1170"],["2028","1170"],["2029","1170"],["2030","1170"],["2031","1170"]],
 "rate": "0.10", "origin": 2026, "benefit_first": 2032, "benefit_last": 2051,
 "price": "10494.00368", "burden": "4000", "tax_wedge": "0.35"}
```

Output includes `required_annual_benefit`, `required_volume` and a note that the volume is a threshold, not predicted output. In FI002 these were 839.010224 (USD m) and 198.765665 ktpa.
