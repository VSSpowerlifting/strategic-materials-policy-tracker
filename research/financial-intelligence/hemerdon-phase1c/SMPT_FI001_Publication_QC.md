# FI001 publication quality control

**Determination: READY FOR FINAL PUBLICATION REVIEW.** This is a complete production package for human review. It is not editorial approval or authorization for public release.

Research cutoff: **4 November 2026**. Production: **5 November 2026**. Controlling analytical record: Phase 1B acceptance commit `772f2f4c02631f533a0a893849c9bedb8a6ff8ad`. Phase 1A preservation commit `4582fb529c86dffc1a6329218e8081fe16550043` remains intact.

## Final editorial and design revision

Title: **Inside Tungsten West's £71 Million Restart Financing**

Subtitle: Government Capital, Project Expenditure and Refinancing Risk at Hemerdon

This pass changes prose, presentation and directly necessary production utilities. The eight-page memo was read sequentially and edited paragraph by paragraph in two substantive passes, followed by rendered-page corrections. It develops the economic mechanism after each major disclosure: equity absorbs residual risk, short debt requires repayment during the ramp, operating milestones become cash through payable production and customer collection, and refinancing depends on that timing. Repeated methodological caveats and catalog-like sequences were consolidated without removing the accepted limitations.

The deck has its own concise narrative, with comments attached to exhibits rather than copied memo paragraphs. Graphite cover and conclusion slides frame cream analytical pages. The native financing chart uses solid £36m/£25m core bars and a separate outlined £10m uncommitted bar. The £61m gross core total is prominent beside it. Headline financing, drawdown and current cash retain distinct meanings.

The palette is taken from `app/globals.css` and the final revision brief: graphite `#12110f`, surfaces `#1a1814`/`#232019`, cream `#efece6`, accent/brand gold `#e3b04b`/`#c8993e`, paper `#f5f3ee`, ink `#1b1915`, muted `#5b5548`, border `#d8d3c7` and paper gold `#7a5510`. This explicit revision direction supersedes the older publication palette for these artifacts. No application CSS was modified.

### Problems found and resolved during revision

| Observation | Resolution and evidence |
|---|---|
| Prior paragraphs often stopped after reporting a fact | Developed the effects on cash timing, risk allocation and refinancing across memo pp1–7; removed recurring rhetorical contrasts and paragraph-end summaries. |
| The title and descriptions used the old framing | Preferred title/subtitle now appear in canonical content, Word/PowerPoint/PDF metadata, cover, abstract, README and handoff. Stable filenames retained. |
| Conditional capacity looked economically similar to core funding | Solid core bars versus an outlined accordion, with clear status and £61m aggregation on slide4. Values remain 36/25/10. |
| Generic publication colors differed from actual SMPT tokens | Applied the graphite/paper/gold palette to the memo, deck and themes. Added explicit axis colors after validation found a renderer default gray outside the palette. |
| The PDF exporter substituted Liberation Sans and recolored links blue | Bundled Fontconfig discovery makes Arial available to export. A narrowly scoped PDF finalizer corrects only the renderer's known default link color to dark gold on paper and accent gold on dark slides. All 77 source annotations remain intact. |
| One authoring preview reported a GPU compilation timeout and omitted solid bars | Native chart data/fills and the actual LibreOffice PDF were checked. The final PDF visibly contains both core bars and the outlined accordion. Final PDF slides supply visual acceptance; native PowerPoint execution is not claimed. |
| The preferred memo title wrapped with one word on its second line | Set a deliberate break before £71 Million, keeping the full title and metadata unchanged. Source-guide links use readable 9pt type. |
| The conclusion commentary crowded its source line and table borders inherited heavy defaults | Shortened the conclusion commentary and applied thin native table rules in paper-border or brand gold. Final PDF slides were rechecked after export. |

All eight final memo pages and ten final deck slides were rendered and visually inspected for clipping, overlap, alignment, contrast, units and citations. A second sequential reading checked that the prose supports the financing argument without repeating its limitations. This is AI editorial review and engine verification, not a claim of independent human expert approval.

The accepted workbook remains byte-identical, SHA-256 `da37ccd1efeddec0164d11264ce1618bd72ea4b87e3acff4c9811274552895f7`. Phases 1A/1B and their validation record are untouched. The existing 32-case/167-formula independent results continue to cover that unchanged file; this editorial pass does not claim a new Excel or model-underwriting exercise.

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
- Editable DOCX/PPTX and both final PDFs use Arial in regular and bold weights. The initial production at commit `4a385c1` used a Liberation Sans PDF fallback. Explicit bundled Fontconfig discovery now resolves installed Arial, eliminating that substitution.
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
| `validate_publication.py` | 142 checks, 0 failures; four chart datasets, seven memo tables, PDFs, links and fingerprints reconciled |
| `git diff --check` | Passed before commit |

The final JSON receipts control over this prose if files are regenerated. `publication-validation-results.json` stores delivered-file fingerprints. The complete source/evidence trace remains in the accepted register and generated appendix.

Application tests/build and deployment checks were not rerun because this phase changes only research artifacts and their local production utilities. Phase 1B's historical repository test results are not claimed as a fresh Phase 1C run. Native Excel and native PowerPoint execution remain unverified. The production PDFs were rendered through LibreOffice, with authoring previews also inspected.

## Remaining release conditions

1. Independent human financial and editorial approval of the finished publication.
2. Source-specific distribution/rights clearance. No original AMC tables, source PDFs or proprietary benchmark series are redistributed.
3. Explicit user authorization for any public release, outreach or live-site installation.

A stronger liquidity or lender-underwriting case additionally needs the complete cash bridge, current debt and capex ledger, definitive NWF terms, equipment reconciliation and production-to-collection forecast. These are scope boundaries, not a reason to imply an existing deficit. They remain in the Phase 1B information-request checklist. No request was sent.
