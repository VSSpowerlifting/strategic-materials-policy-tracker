# FI003 — single publication tracker

**Updated November 6, 2026. Target: December 4, 2026, conditional on research and Benjamin’s review.** This file controls owners, status, dependencies, proposed dates and publication gates. Dates below are planning proposals, not commitments by collaborators. Research cutoff remains November 6. Draft PR [#215](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/215) remains the delivery vehicle.

Working title: **JPMorgan and MP Materials: Financing Through 10X Construction**.

**Current phase: independent acceptance audit and presentation draft 0.2 completed for human review.** [Managerial judgment](MANAGERIAL_REVIEW.md) preserves the core thesis with focused corrections. [Editable PowerPoint](outputs/presentation-draft-v02/SMPT_FI003_JPMorgan_MP_Draft_v02.pptx) and [matching PDF](outputs/presentation-draft-v02/SMPT_FI003_JPMorgan_MP_Draft_v02.pdf) contain 15 total slides. Draft 0.1 remains unchanged. [Acceptance audit](MANAGERIAL_ACCEPTANCE.md) records the live-head review and the two revised slides; no model or source fact changed. [Exact-file QC](presentation/QUALITY_REVIEW_V02.md), [slide/data manifest](presentation/slide-manifest.json) and [verification](outputs/presentation-draft-v02/verification.json) control this draft. This is preparatory production under the current request, not inferred financial approval. Model 1.0 and prior verification remain intact. C51 text is repaired; C53–C54 add contract/diligence evidence without model changes.

Decision: explain what a comparable industrial sponsor or lender should learn from a replaceable construction commitment, completed equity and continuing corporate credit. **Recommended stance:** JPMorgan supported flexibility across the transition; received equity increased financing certainty in exchange for ownership dilution, while MP’s corporate liquidity and execution exposure remained. An ordinary equity takeout is the strongest explanation. Government support is directly visible in subsequent cash and credit terms; its contribution to July 2025 equity demand is unisolated. [analysis.md](analysis.md) develops the argument and evidence that could change it.

**Material refinement:** S02 §6.01 provides conditional additional preferred funding for a shortfall below $350m incremental net proceeds and imposes specified source/use restrictions. Flexibility concerns instrument substitution and received cash within those rules. §6.13 expressly leaves MP a reasonable-best-efforts additional-capital obligation; §6.04(d) qualifies construction timing/capability exposure. These additions strengthen the retained-funding case while narrowing an overbroad reading of unrestricted flexibility. No backstop cash is added to liquidity or public seed records. See C51–C52.

**Review entry points — model 1.0, November 6:** [native private Google Sheet](https://docs.google.com/spreadsheets/d/1Lrfoe4sNRBc6IBfwyNTwgKINOYWCsHkWZb0EH4wzdYI/edit), [editable recalculated Excel workbook](outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx), [controlling cell/formula specification](outputs/fi003-model-v1/model_spec.json), [technical verification](VERIFICATION.md). Both workbook formats have six tabs and working formulas. Native owner-only access was verified; no sharing was enabled. Subsequent manual edits are independent copies, with no automatic synchronization.

## Work and decisions

| Item | Owner | Current status | Dependency / concrete review gate | Suggested milestone |
|---|---|---|---|---|
| Independent analytical review and bounded revision | Codex, research director | Complete; MANAGERIAL_REVIEW records judgment and alternatives | Core thesis retained; new C53–C54 interpretation and C51 repair reviewable | Nov 6 |
| Model 1.0 and source traceability | Codex | Preserved; targeted technical checks rerun | 24 Python tests; 11 schedules; specification; 388 delivered-XLSX cached values; saved native baseline/scenarios. No new live Sheets or Microsoft Excel session | Nov 6 |
| Original-source recheck | Codex | 20 URLs retrieved; 18 non-bank resources match stored fingerprints | Bank page HTML changed; current self-attribution retained, historical register preserved. source-recheck.json records observations | Nov 6 |
| Acceptance audit and presentation draft 0.2 | Codex | Complete: project baseline, full covenant-trigger description, cover-link contrast | All slides rendered/inspected; local limitations and numbers reconcile; no public assets replaced | Nov 6 |
| Financial/methodological review | Benjamin | PENDING | Review executive answer, alternatives, credit clauses/timing, ownership denominator and conditional recommendations against exact draft | Suggested Nov 10 |
| Optional strongest-objection challenge | Jiho, only if invited by Benjamin | Invitation unsent; no assignment or credit inferred | One page testing decision value and bank attribution; not a workbook or legal sign-off | Suggested Nov 16–17, subject to agreement |
| Adjudicate feedback and revise exact draft | Benjamin decides; Codex implements bounded changes | PENDING | Record changes against claims and repeat affected calculations/rendering | Suggested Nov 18–20 |
| Final financial/source, editorial and accessibility/compatibility review | Benjamin; Codex supplies QA | PENDING | Five gates below; exact file hashes; source rights; PowerPoint and PDF assistive-technology checks where required | Suggested Nov 27–Dec 1 |
| Evidence-change check and release decision | Benjamin; Codex checks sources if requested | PENDING | Keep cutoff or explicitly authorize new research version; approve exact files and release separately | Dec 2–3 |
| Publication | Benjamin | HOLD | Separate merge, publication and release authorization required | Dec 4 conditional |

Prior candidate-admission approval remains scoped to the source records described at the end of this file. No further data admission is part of this review.

Unresolved evidence, ranked by consequence:

| Evidence gap | Consequence / treatment | Owner and dependency |
|---|---|---|
| Actual compliance certificates, eligible cash and EBITDA adjustments | Prevents actual covenant headroom or a claim that the tailored clause was used; mechanism can be published with this limit | Codex public-source diligence complete for phase; Benjamin decides whether narrower conclusion suffices |
| Original executed commitment/fee letter and cancellation ledger | Prevents loan cost/recourse optimization and exact $0.8m reconciliation; does not undo issuer-reported undrawn expiration | Codex checked filed agreements/exhibits; Benjamin can authorize further outreach separately if useful |
| Remaining 10X spend/collection schedule, qualification/ramp costs, incentive receipt timing | Prevents a project funding-gap forecast, DSCR or DCF; keep corporate historical cash analysis | Codex prepares available evidence; Benjamin decides any scope expansion |
| Bank individual holds, fee shares and internal credit decisions | Prevents profitability, regulatory-capital relief and unique-capability claims | Withheld from scope; no work assigned to Jiho |

## Implemented workbook and controlling calculation specification

**The compact workbook is implemented in both requested formats.** Benjamin accepted the financing-flexibility direction and bounded scope as the basis for this phase. Financial conclusions and publication remain subject to his review. Auditable ownership dilution, proceeds definitions, conditional credit, cash conversion and the covenant timetable drive the recommendation. The model adds the useful timing analysis; remaining 10X expenditure and covenant-eligible liquidity are insufficiently disclosed for a funding-gap or cash-threshold forecast.

One input set, [inputs.json](inputs.json), controls [prototype.py](prototype.py) and [model.py](model.py). The latter emits `outputs/fi003-model-v1/model_spec.json`: cell addresses, formulas, independent Decimal/date outputs, source mapping, controls and ten scenario cases. [build_workbook.mjs](build_workbook.mjs) translates it with the bundled artifact-tool into XLSX. LibreOffice Calc recalculates the delivery file; that file is converted through Drive’s native Google Sheets import. Post-import text/layout refinements match the controlling specification, including the conditional-backstop row and status-unit correction. Formula values, inputs, validations and source links were read back. Baseline restoration is recorded in `native-restored.json`; scenario results in `native-scenarios.json`. Reproduction commands and platform differences are in README and VERIFICATION.

Tabs are ordered **Financing → Credit → Liquidity → Support → Guide_Sources → Checks**, placing the core financial outputs first. Historical facts have one source-input cell each; gold-shaded scenario controls sit separately on Credit and Support. The workbooks remain editable; changing a source fact deliberately requires a new research revision. Scenario edits cannot overwrite those facts through formulas, and baseline checks flag changes.

| Tab | Inputs and formulas | Acceptance condition |
|---|---|---|
| Guide_Sources | Decision, version, cutoff, input IDs, source URLs/locators, dates, units and classifications; link each numeric input | Calculation facts trace to inputs.json; other contractual terms cite original sections; assumptions visually distinct; no institutional endorsement |
| Financing | Exact shares × public/underwriter prices; gross/discount/net distinction; new shares / old and / (old + new); fee/headline ratio; comparable instrument matrix | Match replacement/financing_economics; preserve −$0.8m as unresolved cancellation comparison; no annualized fee or cost-of-equity proxy |
| Credit | Dated RCF/L-C snapshots; unused = commitment − L-Cs − loans; days/360 fee and interest; isolated EBITDA clause and reversal; first earnings-test quarter-end after editable trigger delivery versus commissioning-year bounds; netting/maturity notes | Match snapshots/sensitivity/adjustment; reject overdraw and missing inputs; date-boundary tests pass; no actual headroom |
| Support | PPA normalized kg payoff; shared milestone-state control; three-state offtake definition and nominal quarter fraction; support accounting / payment-obligation map | Pre-COD operating threshold blank; pre-milestone capacity ratio only; post-milestone full threshold; first-payment stub and true-up excluded and visibly labeled |
| Liquidity | Dated combined assets; operating/PP&E/financing flows; accretion, restricted-cash and valuation reconciliation; PPA receivable/income/receipt tie; principal vs carrying debt | Zero bridge and rounded receipt residuals; receipts never added to OCF again; company resources remain separate from a 10X budget |
| Checks | Independent anchors, source/cutoff checks, units, denominators, scenarios, missing-input flags, engine/version and calculation log | Formula recalculation agrees with Python at stated precision; no formula errors; source/calculation review recorded separately from Benjamin’s approval |

Eleven editable controls: hypothetical SOFR, RCF draw, elapsed days, applicable Test-Period minimum/net income/later duplicate cash, trigger delivery date, operating state, calendar year, capacity ratio and normalized benchmark. Validation and formula guards handle invalid/missing values. A first-payment stub or syndicated-magnet upside waterfall is outside this version. The normalized PPA upside calculation is distinct from that unmodeled magnet-sales waterfall.

**Decision-useful timing result:** the illustrative August 15, 2027 delivery yields a September 30, 2027 first test, 93–458 days before the bounds of the disclosed 2028 commissioning year. These are calendar bounds, not COD forecasts. §6.01(b)’s later-of SEC-calendar/extension terms prevent treating the scenario date as a calculated legal deadline. The result directs diligence toward corporate earnings, eligible adjustments and collected cash before commissioning.

No DCF, WACC, project DSCR, bank-profitability estimate, debt-service forecast or synthetic risk score. Missing original loan pricing blocks a numerical optimality comparison, not the qualitative financing trade-offs already established.

### Disposition of exploratory schedules

| Schedule | Role in eventual package | Reason |
|---|---|---|
| financing_economics | Core financing comparison | Adds quantified dilution and transparent transaction-cost bases |
| revolver_snapshots | Core credit exhibit | Distinguishes cash draws, L-Cs and remaining capacity through Q3 |
| liquidity_bridge / liquid_assets | Combine into one core historical exhibit; retain both audit tables | Reconciles the balance-sheet consumption without forecasting a project deficit |
| support_accounting | Core cash-conversion/status table, shortened for slides | Separates PPA receipts, receivables, public debt/equity and noncash awards |
| offtake_threshold | Compact contractual-state exhibit | Corrects capacity scaling; depicts conditions rather than project CFADS |
| covenant_adjustment | Credit appendix / formula workbook | Shows conditional addback and reversal; actual certificate unavailable |
| replacement | Proceeds appendix; one sentence in main narrative | Exact cancellation ledger is secondary to established expiration |
| underwriting | Source appendix / role-map annotation | Initial allocation supports participation; no standalone fee/profit slide |
| revolver_sensitivity | Workbook sensitivity; optional appendix | Marginal borrowing cost, not an original-loan comparison |
| ppa_sensitivity | Workbook formula check; short risk-map example if useful | Normalized payoff rather than unsupported market forecast |

## Current 15-slide production manifest

The previous 12-slide specification remains recoverable at reviewed commit `146fa5084cf0492ce1e7f4ef84757c94879e83de`. It is superseded for this draft. The original model and eleven schedules remain controlling. [prepare.py](presentation/prepare.py) creates the frozen [manuscript/data manifest](presentation/slide-manifest.json); [build.mjs](presentation/build.mjs) creates native editable evidence. Each slide has original-source hyperlinks and full notes. See [production instructions](presentation/README.md).

| Slide | Headline / evidence role | Controlling source or model range |
|---|---|---|
| 1 | JPMorgan and MP Materials | Scope, 10X location, management investment/commissioning expectation; C27–C28 / S19 |
| 2 | Equity secured cash while MP retained exposure through commissioning | Financing!B16:B24; Credit!A7:F10 |
| 3 | Replacement rights connected the closing commitment to later financing | chronology.csv; Financing!B7:B16 |
| 4 | JPMorgan spans the financing stages alongside substantial partner roles | exhibits/underwriting.csv |
| 5 | An available equity takeout best explains the observed transition | analysis.md: ranked competing explanations |
| 6 | Equity supplied $724.2m at 7.68% isolated ownership dilution | Financing!B9:B24; financing_economics.csv |
| 7 | Letters of credit leave $203m of the $275m revolver available | Credit!A7:F10; revolver_snapshots.csv |
| 8 | Defense contracts enter both covenant earnings and performance obligations | Credit!B29:B35; covenant_adjustment.csv |
| 9 | Corporate earnings tests can precede expected 10X commissioning | Both trigger routes; Credit!B40:B47; model.py:scenario; prototype.py:first_test_quarter |
| 10 | Government support covers specified exposures while MP retains funding duties | Support!A44:F56; analysis.md risk map |
| 11 | 10X threshold protection changes with contractual operating status | Support!B8:B15; offtake_threshold.csv |
| 12 | Price protection delivered $110.9m of cash during nine-month 2026 | Liquidity!B31:B36; Support!B33:B40; support_accounting.csv |
| 13 | Company liquid assets fell $492.4m as expansion continued | Liquidity!B16:B26; liquidity_bridge.csv; liquid_assets.csv |
| 14 | A dated funding and covenant schedule is the next decision input | analysis.md: decisions and conditions through commissioning |
| 15 | Evidence supports the architecture and bounds the financial conclusions | inputs.json; model.py; VERIFICATION.md; PUBLICATION_PLAN.md |

Numerical provenance includes model 1.0 input/specification/workbook hashes and frozen scenario controls. Ownership chart fractions use 12 decimal places for portable literal chart workbooks; full calculation precision remains in model 1.0. Native charts carry literal data snapshots, not links that recalculate when the controlling financial workbook changes. All eleven tables, both native charts and the complete historical waterfall remain editable. The waterfall uses true-scaled native data bars, with each of seven signed movements preserved.

The manuscript labels the August 2027 trigger as illustrative and 2028 commissioning as management expectation. It retains the original-source boundaries, conditional public fallback, restricted uses and ordinary-equity explanation. Covenant mechanics and timing occupy separate slides. All fonts are Archivo, embedded in the PDF. Draft 0.2 source/footer contrast is at least 6.04:1 in the actual PDF; only pages 1 and 9 differ visually from draft 0.1. No private native-Sheet link or restricted source file is shared by the deck.

## Five publication gates

| Gate | Agent draft assessment | Remaining human/release condition |
|---|---|---|
| A Analytical substance | PASS for the narrower architecture/monitoring case; human review pending | Judge attribution, clause interpretation and decision usefulness; no optimality/headroom/completion-funding claim |
| B Prose authenticity | PASS after full-copy read | Benjamin's editorial judgment and any final revisions |
| C Visual integrity | PASS for rendered draft; formal accessibility/PowerPoint compatibility review pending | All 15 inspected; PDF selectable and Archivo embedded; tagged-PDF/assistive-technology and native PowerPoint testing not claimed |
| D Quantitative/source fidelity | PASS for bounded calculations and exact-draft reconciliation; human financial review pending | 24 tests; 11 schedules; model hashes unchanged; 388 formula cache values; editable charts and all source annotations checked |
| E Publication coherence | PASS for draft sequence; release HOLD | Exact-file approval, source-rights confirmation and separate merge/publication authorization |

[QUALITY_REVIEW_V02](presentation/QUALITY_REVIEW_V02.md) records the actual checks, corrected visual defects, exact hashes and practical limits. No automated or agent PASS is human approval.

**Next action:** Benjamin reviews draft 0.2, especially slides 2, 4–6, 8–9 and 14–15, with a suggested November 10 milestone. Codex owns a bounded revision after decisions. Jiho's challenge is optional and unsent. December 4 remains conditional. No merge, manual deployment, publication, outreach or institutional endorsement has occurred.

## Benjamin’s draft 0.2 decision record

These are financial/editorial review questions, separate from publication authorization. Record a decision and any required correction against the exact draft. No answer has been inferred.

| Review item | Relevant slides / evidence | Decision to record | Status |
|---|---|---|---|
| Central argument | 2, 5, 14; analysis.md | Accept the financing-flexibility / commissioning-monitoring case, or identify a specific unsupported step | PENDING |
| JPMorgan prominence | 4–5; C02, C08–C12, C33 | Accept the bank lens with Goldman and other roles visible, or request a narrower title | PENDING |
| Ownership trade-off | 6; Financing!B18:B24 / C46 | Accept 7.68% isolated dilution, distinct from 8.31% share-base growth; both omit other dilution | PENDING |
| Credit mechanism and timing | 8–9; S09 §1.01, §§4.02, 6.16, 7.11 | Accept clause interpretation and clearly hypothetical date, with actual use/headroom withheld | PENDING |
| Recommendation and evidence limits | 14–15; C51–C54 | Accept conditional funding/covenant diligence; keep optimality and completion-funding conclusions outside scope | PENDING |

Codex implements only the resulting bounded corrections, preserves model 1.0, and repeats affected checks. Jiho’s optional response can test understanding and bank attribution if Benjamin authorizes an invitation. A technical/legal specialist could add value on the covenant interpretation if available, but no outside review or endorsement is claimed or arranged. Native PowerPoint compatibility and PDF reading-order/assistive-technology review remain open pre-release checks. Financial review does not authorize merge or release. Suggested review milestone remains **November 10**, with **December 4 conditional**.

## Candidate admission review entry — added scope, November 6

Existing-record review found the original bank commitment and its undrawn lapse, the samarium project loan, public preferred equity, PPA, 10X offtake and unsplit own-cash contribution already present. They must not be admitted again as new amounts. Benjamin explicitly approved all three concrete packages in chat after the isolated dry run. The approved records are now in this draft branch’s public seed; the curated corpus revision date is November 6. No deployment is claimed.

Three private `CandidateRecord` packages have been source-verified by Codex and validated in `data/candidates/fi003.local.json`. Exact proposed native public rows are in `/Users/benjaminyang/.codex/fi003-admission-review/2026-11-06/changed-records.json`; this private review bundle is local; its admitted public records are now reviewable in the PR diff. The full seed proposal and dry-run validation log are beside it.

| Priority / package | Proposed admission | Scope control / current gate |
|---|---|---|
| P0 `cand-fi003-p0-mp-support-refresh` | Amend existing MP event/source links and PPA/offtake evidence; record issuer-reported PPA receipts with unknown individual payment dates | Preserve null total PPA amount and historical lapse; offtake receivables are not proof of cash collections. Approved by Benjamin; admitted to draft branch |
| P1 `cand-fi003-p1-mp-equity-corporate-credit` | Separate private-financing equity and RCF children under the existing MP event, plus necessary bank entities | No new public support or project allocation; no false part_of/drawn_from relationship to the expired commitment. Approved by Benjamin; admitted to draft branch |
| P2 `cand-fi003-p2-texas-10x-manufacturing` | One new Texas event and TSIF manufacturing grant, with necessary state/programme links | Exact $53,457,500 government announcement; May agreement day unknown; $10.075m noncash recognition is not a payment. TEF corporate-operations grant stays separate. Approved by Benjamin; admitted to draft branch |

**Schema limits:** `CandidateRecord` carries proposed events, framing and sources, but has no native financial-child, registry-payload or amendment-operation fields. The separate private bundle uses existing `FinancialCommitment`, organization and programme shapes; no fields were invented. The financial relationship taxonomy has no replacement link, so the financing sequence stays in source-linked notes. No project allocation is invented for corporate proceeds/capacity. No modeled dilution, implied L-C exposure, valuation, residual or funding forecast is placed in candidate public payloads.

**Validation:** three private candidates pass the actual candidate validator. The proposed public rows pass strict TypeScript types and `npm run validate` in an isolated mirror after adding required jurisdiction/material reverse links. This validates schema and references, not human admission approval. Initial dry-run field/reference errors were corrected and the full dry run repeated; details in VERIFICATION. Benjamin explicitly replied “Approve all three packages” after reviewing the concrete admission request under `data/candidates/README.md` step 4. Codex applied the rows and recorded the real approval/promotion in the private candidates. Final source review uses company for Morgan Stanley Senior Funding Inc.; its signature establishes an incorporated lender, not chartered-bank status. Public changes comprise one new event, three new finance rows, five sources, six organizations, one programme, updates to the existing MP event and PPA/offtake/bank notes, necessary reverse links, and the corpus revision date. No schema expansion, modeled public figures or deployment. Codex owns admission verification; Jiho has no admission assignment.
