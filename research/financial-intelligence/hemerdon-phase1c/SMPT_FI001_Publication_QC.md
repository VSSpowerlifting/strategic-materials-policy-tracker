# FI001 publication quality control

**Determination: READY FOR PUBLICATION REVIEW.** This is a complete production package for human review. It is not editorial approval or authorization for public release.

Research cutoff: **4 November 2026**. Production: **5 November 2026**. Controlling analytical record: Phase 1B acceptance commit `772f2f4c02631f533a0a893849c9bedb8a6ff8ad`. Phase 1A preservation commit `4582fb529c86dffc1a6329218e8081fe16550043` remains intact.

## Quantitative acceptance

| Finding | Reconciliation | Publication locations |
|---|---|---|
| Financing composition | £36m equity + £25m loan = £61m gross. Add £10m uncommitted accordion = £71m maximum | Memo pp1,3; deck slides2,4; Funding D8:D12 |
| Remaining spend | October £40–45m, excluding operating costs. £42.5m analyst midpoint | Memo pp1,4,5; deck slides2,6; Funding D16:D17 |
| Downside increment | £2.5m upper-range capex + £3m delay + £0.25m annual rate proxy = £5.75m | Memo p5; deck slide7; Funding D21, Downside |
| Original August receipts | £88m − £15m − (£88m − £13m) = −£2m. Rounded detailed uses imply −£1m | Memo pp1,5; deck slide7; August plan D35:D37 with receipt factor0 |

The £15m reserve-target shortfall is distinct from the £2m ending deficit. The August plan and October stress have different bases and are not summed. No present cash shortage is asserted. Full loan draw is dated to accounts approval, not silently to the March balance sheet. The £438.15/mtu coverage reference remains a selected tungsten-only metric with explicit exclusions, not full break-even or DSCR.

## Skeptical professional second pass

This is a role-based AI review against the controlling evidence, supported by independently authored arithmetic and engine validation. It is **not** an external mining banker, lender or independent human sign-off. No professional credentials or approval are implied.

| Perspective | Material challenge | Correction or retained resolution |
|---|---|---|
| Mining investment banker | Could £71m be read as net new construction cash or grant support? Does the package conceal debt obligations? | Memo pp1,3–4 and deck slide4 separate equity, fully drawn core debt and uncommitted capacity. The dated cash bridge retains bridge repayment and missing net proceeds. No net construction-cash subtotal or grant equivalent is calculated. Equipment disclosures are not summed into unsupported debt. |
| Project-finance lender | Could security registration establish facility attribution, first priority or a precise maturity? Could annual cash coverage be read as repayment capacity? | Memo pp3,6 and deck slides5,8 preserve the tenor-origin conflict and the deed's unnamed lender. Collateral scope, ranking, covenants and monthly liquidity remain diligence requirements. The cash metric excludes missing items and is expressly separated from CFADS/DSCR. No assurance of repayment survives. |
| Buy-side analyst | Are scenarios independent, probabilistic forecasts, or an implied valuation? Does selecting Downside establish a combined current funding gap? | The Model Guide explicitly explains that grouped case settings have no joint probability and no common monthly forecast. It clarifies the Upside stress floor at zero and the separate £2.5m reduction in spend. The two historical/scenario bases cannot be added. Price stays blank and no equity target or valuation is offered. |
| Industrial strategy consultant | Does a financial instrument analysis add value beyond the existing supply-security dossier? Is government financing credited with causal output? | Memo pp2,7 and deck slides8–10 connect instruments and maturity to commissioning, acceptance, collections and refinancing. Investor, lender and public-provider evidence priorities differ. Chronology supports the restart pathway without attributing an incremental tonnage or subsidy value to policy. Management's reported progress and fully funded pathway remain visible. |
| Research editor | Are dates, units, citations and model outputs consistent? Do layout defaults obscure the analysis? | Corrected chronology on slide3, removed Word's inherited blue title border and theme-driven second font, enlarged chart axes, restored a zero baseline to the spending bar chart, fixed fractional tick/number formatting and moved negative-chart category labels below the plot. Source hyperlinks are underlined and tested as PDF annotations. The deck theme uses SMPT's dark gold for hyperlinks. |

These corrections improve presentation and interpretation. No financial input, formula or accepted conclusion changed in Phase 1C.

## Rendering and inspection

- Rendered and visually inspected all **8 memo pages** and **10 presentation slides**, including the actual LibreOffice PDF export of the PowerPoint.
- Re-rendered after corrections. Checked clipping, table wrapping, chart labels, negative signs, GBP/mtu versus GBP million, source footnotes, source-guide links and page/slide markers.
- Editable DOCX/PPTX use Arial. The PDF engine embeds Liberation Sans, the Arial-compatible family used in SMPT's approved house style. Both PDFs use that one family, in regular and bold weights. The transient Carlito heading substitution was removed.
- Memo PDF: **44 source-link annotations**. Deck PDF: **33**. Targets and annotation rectangles are validated against canonical source URLs. Live third-party host availability was not re-audited during production.
- PowerPoint: **10 slides, 7 native tables, 4 native charts**. Each chart has an embedded workbook containing the displayed source-data snapshot. These are chart-editing data, not substitutes for the accepted financial model or its formula lineage.
- The source workbook was not restyled or regenerated. Its visible sheets and formula dependencies are unchanged from Phase 1B's inspected version, so repeated rendering of unchanged workbook views was unnecessary. Fresh independent recalculation tested the publication copy.

## Executed checks

| Check | Result |
|---|---|
| `build_publication.py` | Hash assertion, workbook output reconciliation and four independent calculations passed |
| `validate_workbook.py --input ...Financial_Model.xlsx --output ...model-validation-results.json --soffice ...` | 32 cases, 0 failures, 167 formulas, 0 cached differences |
| `python3 -m unittest discover -s research/financial-intelligence/hemerdon-phase1a -p test_model.py` | 9 tests passed |
| Presentation finalizer | Package integrity, slide size/count, Arial policy, native table/chart ownership and re-import passed; 0 layout findings |
| `validate_publication.py` | 130 checks, 0 failures; four chart datasets, seven memo tables, PDFs, links and fingerprints reconciled |
| `git diff --check` | Passed before commit |

The final JSON receipts control over this prose if files are regenerated. `publication-validation-results.json` stores delivered-file fingerprints. The complete source/evidence trace remains in the accepted register and generated appendix.

Application tests/build and deployment checks were not rerun because this phase changes only research artifacts and their local production utilities. Phase 1B's historical repository test results are not claimed as a fresh Phase 1C run. Native Excel and native PowerPoint execution remain unverified. The production PDFs were rendered through LibreOffice, with authoring previews also inspected.

## Remaining release conditions

1. Independent human financial and editorial approval of the finished publication.
2. Source-specific distribution/rights clearance. No original AMC tables, source PDFs or proprietary benchmark series are redistributed.
3. Explicit user authorization for any public release, outreach or live-site installation.

A stronger liquidity or lender-underwriting case additionally needs the complete cash bridge, current debt and capex ledger, definitive NWF terms, equipment reconciliation and production-to-collection forecast. These are scope boundaries, not a reason to imply an existing deficit. They remain in the Phase 1B information-request checklist. No request was sent.
