# Quality control supports a partial financial model with unresolved cash and contract gaps

Cutoff: **4 November 2026**. Status: internal research draft, publication review pending. No independent human finance sign-off or native Excel execution is claimed.

The sections below record the preserved Phase 1A baseline (`4582fb529c86dffc1a6329218e8081fe16550043`). The Phase 1B acceptance update at the end supersedes its counts and model-validation limits where stated.

## Evidence sufficiency decision

The available disclosures support historical financial reconciliation, transaction-status analysis, a reconstruction of the original August funding plan, remaining-capital guidance, incremental cost stresses and FY2028 revenue-coverage arithmetic. They do not supply a current unrestricted-cash bridge, an updated dated life-of-mine cash model, complete facility documents or lender CFADS definitions. Independent NPV, IRR, DSCR and a precise current net financing gap are therefore marked Unavailable. A usable partial model passes the assignment's sufficiency gate; a full valuation does not.

## Source and lineage review

The register has 12 sources and 147 classified claims/inputs. Material numeric inputs were checked against the issuer's FY2026 accounts, its FY2025 original balance sheet, October slides20/22/23/33, the NWF release and issuer RNS announcements. The February circular was checked for publication date and conditional £43.04m gross raise. RNS source text is distinguished from host AI summaries; no AI summary supports a model input.

R001 already provides the NWF drawdown and offtake research. Its source IDs S14/S18/S20/S21/S31/S35 were mapped to this register and reopened. The FY2026 accounts downloaded for this case match R001 S31's SHA-256 `e1230b17540f74780862ccea671f6fcac9061e45c2f5d80d80e747a09b10a247`. The new work adds financial-statement reconciliation, accounting-vintage handling, October guidance and executable modeling. It does not claim the older dossier lacked drawdown evidence.

The AMC study summary was read for scope and rights but is not used for model values. Its explicit consent restrictions are preserved in the source register. Raw documents and lengthy source excerpts are excluded from repository deliverables. Public links do not establish redistribution rights. A future public memo still needs rights review, particularly for AMC, RNS and licensed commodity data.

Validation checks source IDs, cutoff, disclosure classifications, null unknowns, periods, scopes, decimal strings, currencies, fractions, evidence links and restricted-source exclusion. Formula construction resolves stable input IDs into cells, so reordering input rows does not shift the intended links.

## Material conflicts remain visible

| Issue | Treatment |
|---|---|
| Government up-to-£35m lending versus £25m core facility | Reconcile core plus £10m uncommitted accordion. £71m parent never added to its components. |
| NWF term start | August proposed terms: date of definitive agreement. Accounts: date of drawdown. October slide states366 days without origin. No exact maturity date inferred. |
| Borrower and guarantors | August proposed terms name DRL borrower and PLC/Services/Aggregates guarantors. Executed documents not obtained; public role disclosure distinguished from definitive legal verification. |
| August detailed uses sum £87m versus stated £88m | Retain negative £1m reconciliation and issuer rounding note. Use stated total for reserve analysis, with no invented use. It is not reported as a zero-difference check. |
| August £7m opening cash versus March £25.49m | Different dates and purposes. No complete intervening cash bridge obtained. Neither establishes November cash. |
| August £18m bridge repayment | Forecast plan use. Later repayment confirmed, but exact cash, FX, fees and accrued interest require transaction evidence. Do not count repaid bridge as current debt. |
| February approximate£43m versus approximate£44m wording | Circular conditionally raised £43.04m supports rounded£43m language. Use exact £41,029,253 net equity cash in historical reconciliations; do not infer exact fees from rounded gross. |
| FY2025 original versus restated accounts | Model uses FY2026 restated comparatives throughout; original assets/equity separately indexed for reconciliation context. |
| Escrow accounting narrative versus face presentation | Note37 wording refers to cash and equivalents, but balance sheet shows non-current escrow and says funds are not for general use. General-use cash excludes escrow. Clarify wording before a detailed public accounting conclusion. |
| Equipment £11m current and ~£22m ordered | No unverified £33m current-debt sum. Exact overlap and future draw schedule unresolved. |
| £26m FY2028 NWF principal and interest versus escalating margin | Preserve company fiscal-year estimate. It is not a verified full-life contractual interest schedule. |
| Elmet indicative nominal value and optional processing | No guaranteed-revenue assumption; no firm extra500t sales inferred from an endeavours clause. |
| October share/option snapshot | Ordinary and B shares distinguished; no November fully diluted valuation based on options expected to expire in October. |
| Commissioning versus steady-state performance | September processing assertion and company-guided ramp-up are not independently verified throughput, recovery or commercial delivery. |

## Calculations and workbook execution

Eight focused Python tests passed. They cover both years' balance/cash reconciliation, non-cash note conversion, NWF package counting, independent coverage arithmetic, original-plan rounding and receipts, source/currency/rights failures, duplicate and post-cutoff sources, and all formula references with dependency-cycle detection. No sheet outside Checks depends on terminal Checks.

Nine numerical workbook reconciliations return zero: two balance-sheet identities, two cash-flow-category sums, two opening-to-closing cash bridges, the FY2026 convertible-note rollforward, NWF components against the parent ceiling, and October project-capital components against the total. The separate August rounding check returns **negative £1m**, as disclosed by rounded detail versus stated total. Current cash and contractual interest reconciliations remain Unavailable.

`verify.mjs` imports the workbook into `@oai/artifact-tool`, recalculates every case and verifies both numeric outputs and input changes. It checks selected-cost propagation, missing selected cost, an unselected blank price, blank/zero/positive price distinctions, missing volume, invalid100% royalty, hypothetical accordion availability and its ceiling, original-plan receipt/core-loan timing, receipt fraction above100%, and negative capex. Inputs are restored to Base before export. Historical figures stay fixed when cases change. Results are retained in `model-results.json`.

The final engine scan found zero spreadsheet error values. The workbook has nine sheets, 161 formulas, source hyperlinks, case validation, frozen register/history headers, one Arial font and cached formula results. Every sheet's main range was rendered and reviewed. Original October slide20/33 tables were also visually checked. The saved XLSX was reopened using openpyxl to inspect formulas, cached key results, hyperlinks, validation and freeze panes. This demonstrates the tested engine and export behavior; native Microsoft Excel behavior remains unverified.

A first engine run exposed an evaluator distinction between blank and zero when formulas used equality to an empty string. Active numeric selection now uses `ISNUMBER`, and zero-price/missing-value mutation checks verify the intended distinction. A generator tuple-shape error was caught by the initial local suite and corrected before the final run. These failures are not described as successful checks.

## Existing repository checks

- `npm run validate`: passed, with 17 pre-existing warnings about material/framing coverage. No seed files were changed.
- Existing repository test suite: **1,083 passed, zero failed**. The invocation appended a test-name flag after file arguments and ran the entire suite; the recorded result is the full suite, not an inferred targeted result.
- New model tests: **8 passed, zero failed** in the final run.
- `node --check` and ESLint on `verify.mjs`: passed.

No website build, deployment, live API, production page or CI verification was necessary or performed for these isolated research artifacts. Dependencies were installed locally with `npm ci --ignore-scripts`; package manifests and lockfiles were unchanged.

## Skeptical second pass

These are three review lenses applied by the implementing agent, not three independently staffed reviews.

**Investment banker:** Gross NWF proceeds cannot be treated as cash remaining. The August plan includes refinancing, revenue receipts and a cash reserve. The £10m accordion is conditional, lease/equipment financing cannot be confused with new cash equity, and October remaining spend excludes opex. Corrections retained: separate dated plan, rounded-use difference, no package double count and no artificial current gap.

**Buy-side analyst:** The £175.4m loss is dominated by non-cash fair-value changes; operating cash outflow is different. October forecasts and price-linked nominal offtake value do not establish sustainable earnings. Share classes and option expiry matter. Corrections retained: cash/CLN separation, reported/guidance/assumption labels, no guaranteed Elmet revenue, no invented commodity forecast or equity value.

**Project finance lender:** A 366-day facility has refinancing exposure if ramp-up and collections slip. The appendix's receipt dependence is material. Annual cash guidance is not CFADS; missing security/covenant/interest terms prevent a lender DSCR conclusion. Corrections retained: maturity-origin conflict, proposed borrower/guarantor roles, complete-revenue-delay boundary, missing contractual metrics and no assumed accordion commitment.

## Release boundary

The artifacts support review and a carefully sourced memo foundation. They do not support publication-grade conclusions about precise current liquidity, complete break-even, independent value or repayment sufficiency. Obtain a same-date cash/debt snapshot and full cash bridge first, then executed terms and monthly operating/collection evidence. Independent human finance review, source-rights clearance and public editorial approval remain next-phase work. No source or reviewer authority has been promoted by this delivery.

## Phase 1B acceptance update — outcome B

The register now has **158 inputs/claims across 20 sources**. Newly indexed evidence includes the issuer's live embedded announcement index, April/May financing disclosures, three prospective option-funding notices and the filed group security agreement. The accounts and October presentation were fetched again; their hashes match Phase 1A. Unknown publication dates for the index and filing remain null, with retrieval, instrument, filing and certificate dates separately recorded. No raw original is redistributed.

The baseline's 161 cached formula values agreed with independent LibreOffice recalculation. Thirty independently defined cases then found 12 failed cell expectations when inputs were removed: source links could coerce blanks to zero, AVERAGE/SUM could silently accept incomplete inputs, and the operating check could report Valid for missing volume. These were material edit/refresh defects despite correct intact-input results. `../hemerdon-phase1b/baseline-validation.json` preserves the failures. Numeric-source guards, complete-input prerequisites and check guards repair them.

The corrected workbook has **167 formulas**, preserving the nine-sheet layout while adding dated bridge observations in Funding rows 32:40. Final independent validation passes **32/32 cases**, with **zero differences across 167 cached formula results**. The checks also compare all 158 source-linked workbook values to the claim register and verify formula references, external-link absence and absence of dependency cycles. The nine zero reconciliations and known negative £1m rounding difference remain distinct. The original producer-engine mutation/scan checks pass separately, and affected workbook ranges were rendered and inspected.

Microsoft Excel was not found in `/Applications` or the Spotlight bundle-ID search. The independent engine was `LibreOfficeDev 26.8.0.0.alpha0`, version string retained in `validation-results.json`. It recalculated disposable copies only. This is stronger independent calculation evidence than the prior single-engine check; it is not native Excel or a separate human review. The public Excel workbook should receive a native compatibility check when that environment becomes available.

Focused Python tests now pass **9/9**. The repository suite and data validation were rerun before the preservation commit: **1,083 passed**, validation passed with 17 existing warnings. They cover unchanged production code; no deployment or CI result is inferred. The workbook's generated matrix, cached outputs, controls and source links were inspected after export.

All four principal figures reproduce. The original August shortfall must be described as approximately £2m on the stated-total basis, with approximately £1m using the rounded detail. The £5.75m increment remains an analyst stress, not an observed funding gap. A new confirmed April £3m payment, prospectively stated option funding and registered security do not close the missing November cash bridge. A detailed lease-payment presentation difference of £6,104 is retained in the information checklist rather than forced into a debt-service rollforward.

**Recommendation B:** conditionally accept a financing-structure/government-intervention case and explicitly bounded scenarios. Do not accept current liquidity, complete financing-gap, valuation or repayment-sufficiency conclusions. See the [closure decision](../hemerdon-phase1b/financial-evidence-closure.md), [funding bridge](../hemerdon-phase1b/funding-bridge.json), [independent results](../hemerdon-phase1b/validation-results.json) and [information checklist](../hemerdon-phase1b/information-request-checklist.md). This gate authorizes no publication, PR, outreach or deployment.
