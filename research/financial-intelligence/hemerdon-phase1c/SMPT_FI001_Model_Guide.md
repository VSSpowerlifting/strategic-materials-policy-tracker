# FI001 model guide

Publication model: [SMPT_FI001_Hemerdon_Financial_Model.xlsx](SMPT_FI001_Hemerdon_Financial_Model.xlsx).

Research cutoff: **4 November 2026**. This is a byte-identical publication copy of the accepted Phase 1B workbook, not a later forecast. Its title is supplied by the filename and this guide. The original workbook, Python generator, evidence and producer-engine results remain in [Phase 1A](../hemerdon-phase1a/README.md). The independent validator and original correction trail remain in [Phase 1B](../hemerdon-phase1b/README.md).

SHA-256: `da37ccd1efeddec0164d11264ce1618bd72ea4b87e3acff4c9811274552895f7`.

## Start with the scope

Use the workbook for instrument reconstruction, dated disclosure comparison and selected sensitivities. Current liquidity, a complete financing gap, NPV/IRR, equity value, DSCR, covenant headroom, repayment sufficiency and default probability are unavailable. No forward APT price is supplied. The model does not calculate causal additional production from public financing.

## Navigation

| Sheet | Purpose |
|---|---|
| Overview | Selected case results and unavailable current metrics |
| Assumptions | One case selector and explicit scenario drivers |
| Funding | £71m reconciliation, remaining spend, incremental stress and incomplete dated cash bridge |
| August plan | Original sources/uses and receipt/loan timing counterfactuals |
| Operating | FY2028 selected cash reference and tungsten-only coverage sensitivity |
| Historical | Audited dated group statements, with restated FY2025 comparatives |
| Evidence | All 158 accepted input/claim records, IDs and locators |
| Sources | 20 source records and hyperlinks |
| Checks | Reconciliations, prerequisite checks and retained rounding difference |

## Scenario use

Work in a separate saved copy. Select **Base**, **Upside** or **Downside** in `Assumptions!D4`. Column D is the active formula-selected case. Columns E/F/G hold Base/Upside/Downside drivers respectively. Preserve the supplied formulas when returning to the publication baseline. Recalculate after edits.

| Assumptions row | Driver | Interpretation |
|---|---|---|
| 8 | Remaining project spend | £42.5m / £40m / £45m. October estimate and midpoint convention |
| 9 | FY2028 opex and sustaining capex | £72.5m / £70m / £75m management range and midpoint |
| 10–12 | WO3 volume, payability, deduction | Reference 3,300t, 79.5%, 3%. Contract-specific confirmation remains necessary |
| 13 | Incremental delay | Zero / zero / £3m company-described three-month sensitivity |
| 14 | One-year incremental rate exposure | Zero / zero / 1%. Applied to constant £25m, not contractual loan interest |
| 15 | Hypothetical accordion for stress | Zero in all delivered cases. Any nonzero amount is hypothetical, bounded by £10m and adds debt |
| 16 | Original August receipts by peak date | 100% / 100% / 0%. A sensitivity, not realized receipts |
| 17 | Original August core-loan receipt by peak | 100% in all cases. Full loan draw was subsequently disclosed |
| 18 | Optional GBP APT reference per mtu | Blank by default. Zero is a true zero-price stress. Positive values are analyst assumptions |

The case selector groups independent sensitivities for convenience. It does not assign a joint probability or create a coherent dated monthly forecast. In particular, the August counterfactual must not be added to the October incremental cost stress.

## Expected outputs

| Output | Base | Upside | Downside |
|---|---:|---:|---:|
| Funding D16, remaining spend | £42.5m | £40m | £45m |
| Funding D21, incremental stress | £0 | £0 | £5.75m |
| Operating D20, FY2028 selected core cash | £111.5m | £109m | £114m |
| Operating D21, GBP/mtu core coverage | £438.15 | £428.33 | £447.97 |
| August plan D35, cash after other uses | £13m | £13m | approximately −£2m |

Incremental stress floors at zero in the Upside case. The £2.5m lower spend remains a reduction in uses, never generated cash. The original August £2m deficit uses stated aggregate totals. Summing rounded detailed uses produces approximately £1m instead. `Checks!D21 = −£1m` is a known retained rounding difference, not an unexplained plug. The reserve-target shortfall in the no-receipts case is £15m.

Funding D25:D26 and D38 retain unavailable current metrics. Missing required inputs propagate `Unavailable`. Terminal checks are not inputs to financial calculations. Operating coverage excludes tin and aggregates receipts, remaining restart capex, growth, tax and working capital, so it cannot be read as total project break-even or CFADS/DSCR.

## Validation and reproduction

[Phase 1C fresh independent results](model-validation-results.json) record 32 cases, zero failures and zero differences across 167 cached formulas. The input workbook is never written by that validator. Native Microsoft Excel execution remains unverified because Excel was not located; LibreOffice is the independently executed engine. The producer artifact-tool checks are retained in Phase 1A.

From the repository root, with a Python runtime containing openpyxl and LibreOffice installed:

```sh
python3 research/financial-intelligence/hemerdon-phase1b/validate_workbook.py \
  --input research/financial-intelligence/hemerdon-phase1c/SMPT_FI001_Hemerdon_Financial_Model.xlsx \
  --output /tmp/fi001-model-validation.json \
  --soffice /path/to/soffice
```

Regenerating the source model is optional and should be done in an isolated copy using Phase 1A's documented `model.py` and `verify.mjs`. Publication production does not regenerate or modify the accepted source workbook. `build_publication.py` copies it and asserts its accepted hash.
