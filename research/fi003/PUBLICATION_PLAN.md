# FI003 — single publication tracker

**Updated November 6, 2026. Target: December 4, 2026, conditional on research and Benjamin’s review.** This file controls owners, status, dependencies, proposed dates and publication gates. Dates below are planning proposals, not commitments by collaborators. Research cutoff remains November 6. Draft PR [#215](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/215) remains the delivery vehicle.

Working title: **JPMorgan and MP Materials: Financing Flexibility Before 10X Production**.

Decision: explain what a comparable industrial sponsor or lender should learn from a replaceable construction commitment, completed equity and continuing corporate credit. **Recommended stance:** JPMorgan supported flexibility across the transition; received equity increased financing certainty in exchange for ownership dilution, while MP’s corporate liquidity and execution exposure remained. An ordinary equity takeout is the strongest explanation. Government support is directly visible in subsequent cash and credit terms; its contribution to July 2025 equity demand is unisolated. [analysis.md](analysis.md) develops the argument and evidence that could change it.

**Material refinement:** S02 §6.01 provides conditional additional preferred funding for a shortfall below $350m incremental net proceeds and imposes specified source/use restrictions. Flexibility concerns instrument substitution and received cash within those rules. §6.13 expressly leaves MP a reasonable-best-efforts additional-capital obligation; §6.04(d) qualifies construction timing/capability exposure. These additions strengthen the retained-funding case while narrowing an overbroad reading of unrestricted flexibility. No backstop cash is added to liquidity or public seed records. See C51–C52.

**Review entry points — model 1.0, November 6:** [native private Google Sheet](https://docs.google.com/spreadsheets/d/1Lrfoe4sNRBc6IBfwyNTwgKINOYWCsHkWZb0EH4wzdYI/edit), [editable recalculated Excel workbook](outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx), [controlling cell/formula specification](outputs/fi003-model-v1/model_spec.json), [technical verification](VERIFICATION.md). Both workbook formats have six tabs and working formulas. Native owner-only access was verified; no sharing was enabled. Subsequent manual edits are independent copies, with no automatic synchronization.

## Work and decisions

| Item | Owner | Status at this revision | Dependency / concrete review gate | Proposed date |
|---|---|---|---|---|
| Refined thesis, competing explanations, financing economics and retained-risk assessment | Codex | Complete for Benjamin financial/methodological review | Judge the ordinary-equity-takeout objection and causal attribution; no inferred optimality | Nov 6 delivery; proposed review by Nov 10 |
| Q3 filing refresh, sources, contract corrections and reproducible arithmetic | Codex | Complete for research review; results in VERIFICATION | Maintain Nov 6 cutoff; review material clauses and source reconciliations | Nov 6 |
| Candidate admission preparation and existing-record duplicate review | Codex | All three packages explicitly approved by Benjamin and admitted to draft branch; see entry below | Established candidate workflow, distinct private/public finance and project uses; no schema expansion | Nov 6 |
| Strongest-objection challenge | Jiho, if Benjamin invites him | Pending; no finding or approval attributed | One-page response to JIHO_HANDOFF; Codex’s analysis already proceeds independently | Suggested Nov 13 |
| Send invitation / assign credit and authorship | Benjamin | Unsent message prepared | Benjamin chooses participation and sends; no external communication authorized here | Suggested Nov 9 |
| Adjudicate thesis, method and objection | Benjamin | Pending | Record disagreements beside affected claim; Jiho response is optional input, not a prerequisite to research progress | Suggested Nov 16 |
| Editable Excel and native Google Sheets model | Codex | Built and technically verified, version 1.0; Benjamin financial approval pending | 388 formulas reconcile in LibreOffice and native Sheets; 10 scenarios on each artifact-tool/native engine; actual headroom excluded | Nov 6 delivery; proposed review Nov 10–13 |
| Bounded timing analysis / model specification | Codex | Implemented; explicit delivery-date scenario and commissioning-year bounds | Accept decision usefulness of pre-commissioning covenant interval; no cash runway forecast | Nov 6; review with model |
| Storyline and production-ready exhibit specification | Codex | Revised below; no slides built | Benjamin resolves thesis/method; model 1.0 controls data; ≤20 total slides, target 12 | Review by Nov 16; deck production proposed Nov 23–25 |
| Exact-file financial/source and editorial review | Benjamin; Codex supplies QA | Pending | Five gates below; resolve material discrepancies and source rights | Suggested Nov 27–Dec 1 |
| Evidence-change check and release decision | Benjamin; Codex checks sources if requested | Pending | Report any post-cutoff development separately; preserve cutoff or explicitly authorize new research version; exact files approved | Dec 2–3 |
| Publication | Benjamin | HOLD pending human authorization | Exact asset approval plus separately authorized release action; deadline may move | Dec 4 conditional |

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

## Revised 12-slide storyline and production-ready exhibit specification

Each title below is a provisional assertion, not finished slide copy. Preserve sources, evidence class, units, cutoff and source/calc links when producing slides. Use original SMPT visuals, direct labels and text/status encodings beyond color. This budget includes cover and methods; all appendices count toward the 20-slide ceiling.

| # | Assertion and class | Comparison / exhibit; data and sources | Mechanism / material limit |
|---|---|---|---|
| 1 | JPMorgan and MP: financing flexibility before production | Scope/decision cover; November 6 cutoff; research authorship/review status | Hypothetical sponsor/lender audience; no affiliation |
| 2 | Received equity improved financing certainty; dilution and corporate exposure remained — judgment | Three findings plus strongest ordinary-equity-takeout objection; analysis and C37–C50 | Government-to-equity causality stays open; no optimality claim |
| 3 | JPMorgan participated from joint commitment to continuing credit — documented roles | Entity/role matrix; S01/S07/S09/S15; underwriting.csv | Preserve joint participants and bank self-description |
| 4 | Replacement rights were built into the original financing route — contract/disclosure | Dated chronology: July 9, Apple July 15, equity July 16, RCF Aug 25, expiry Aug 26; S02/S11/S17 | Sequence, no unsupported causal arrows |
| 5 | Equity supplied capital without scheduled repayment, with 7.68% ownership dilution — calculation/judgment | Financing matrix + 8.31% share-base growth / 7.68% dilution; Financing!B9:B24 and A27:F33; financing_economics.csv | Original loan never funded; dilution is ownership share, not a dollar valuation; fees cannot rank cost of capital |
| 6 | L-Cs leave $203m of the $275m revolver available at September — reported/derived | Three dated snapshots; revolver_snapshots.csv; S19 Note 8 | Capacity is conditional, L-C sublimit not extra cash |
| 7 | Earnings-based tests can precede expected 10X commissioning — contract/scenario | Credit!B40:B47 timing interval, with concise clause-(a)(xiv) addback/reversal inset from B29:B35; S09 §§1.01/6.01(b)/7.11; C50 | Illustrative trigger; commissioning year bounds, not COD; no actual headroom or sole-design attribution |
| 8 | Public support leaves MP’s additional-capital duty and parent obligations in place — contract/judgment | Risk-allocation matrix; S02 §§6.01/6.04(d)/6.09/6.13; S03/S04/S05/S19 | Conditional preferred fallback and use restrictions distinct from received cash; MP guarantee runs to DoD; timing obligation qualified |
| 9 | 10X threshold protection changes across three contractual states — contract/calculation | Three-state table; offtake_threshold.csv; S03 §§1.2/2.1/6.2 | Legal term begins signing; full-year illustration excludes true-up/proration |
| 10 | PPA support produced $110.9m of cash; other balances have different meanings — reported | Cash/receivable/ceiling/noncash table; support_accounting.csv; S19 Notes 9/13/15/21 | No double count with OCF; TSIF differs from HREE receipts |
| 11 | Expansion consumed $492.4m of company liquid assets during nine months — calculation | True historical bridge; liquid_assets/liquidity_bridge; S19 | Multi-project company resources, no remaining 10X gap or runway |
| 12 | Replicate financing flexibility, then diligence cash conversion and completion — recommendation | Sponsor/lender/public-financier decisions, decisive gaps and linked sources/methods | Benjamin resolves thesis; exact-file publication gates still required |

### Controlling exhibit instructions

Produce original SMPT visuals from model 1.0 after Benjamin’s review. Capture the exact workbook revision/control values used for every exhibit; a changed Google Sheet is not an automatically updated publication source. Numerical displays round only after calculation. Chart sources remain clickable originals with note/section locators and the November 6 cutoff. The model’s functional green cross-sheet formula convention does not transfer into publication charts; use the presentation/house palette and direct labels. **Future deck typography is Archivo under Presentation Standard v2.1**, refreshed through GitHub at main `bb0934b` (PR #218); this supersedes the earlier Georgia/Source Sans pairing. The workbook uses Arial for spreadsheet interoperability.

| Exhibit / slide | Production form and exact controlling range | Display / evidence rules; decisive limit |
|---|---|---|
| E1 / 3: bank roles | Entity–function matrix; analysis role table, `exhibits/underwriting.csv`, S07 Schedule A and S09 cover/signatures | JPMorgan entities named separately; 4,727,272 / 11,818,181 ≈40% initial underwriting obligation. No final retention, fee share or unique-capability claim |
| E2 / 4: financing sequence | Horizontal dated timeline; `chronology.csv`, S02 §§2.05–2.07, S11 Note 3, S17 | Signing/commitment → equity pricing/completion → RCF → undrawn expiry; Apple as a separately labeled contemporaneous event. Arrows convey time only |
| E3 / 5: financing economics | Three-instrument comparison with two denominator bars; Financing!B12:B24, A27:F33; `financing_economics.csv` | $724.2m net received; 8.31% old-base growth, 7.68% post-base dilution, 92.32% retained. Show $22.425m/3% discount and $7.4m/0.74% expense in a separate fee-basis note; no relative capital-cost ranking |
| E4 / 6: available corporate credit | Three dated stacked capacity bars; Credit!A7:F10; `revolver_snapshots.csv` | $275m facility split into loans (zero), implied L-Cs ($40m/$72m/$72m) and remaining ($235m/$203m/$203m). USD m; L-C sublimit never drawn as another bar. Remaining capacity is conditional |
| E5 / 7: covenant timing | Timeline plus small clause equation; Credit!B40:B47 and B29:B35; `model.py:first_test_quarter` / `scenario` | Baseline trigger Aug 15, 2027 → Sep 30 first test → shaded 2028 commissioning-year band. Label 93/458 days as bounds; annotate ≥$400m-certificate earlier trigger. Clause inset max(40−20,0)=20, with later duplicate-cash reversal; all hypothetical. No EBITDA/headroom axis |
| E6 / 8: allocation of obligations | Compact payer → beneficiary → condition → retained exposure matrix; Support!A44:F52 / A54:F56 and analysis risk map | Distinguish price protection, offtake, initial public equity, conditional additional preferred, samarium debt, grants, MP guarantee and corporate RCF. Show S02 §6.13 additional-capital duty and §6.04(d) timing qualification; MP → DoD guarantee direction prominent. No support total |
| E7 / 9: three offtake states | State table, using Support!B8:B15 and `offtake_threshold.csv`; S03 §§1.2/2.1/6.2 | Fixed CY2029 illustration: pre-COD blank; COD/pre-milestone at 50% = $75.770m; post-milestone = $151.541m. Legal term begins signing. Nominal /4 ≠ actual first payment; describe stub/true-up separately |
| E8 / 10: support cash conversion | PPA rollforward with separate status rows; Liquidity!B31:B36, Support!B33:B40; `support_accounting.csv` | $51.016m + $67.962m − $8.109m = $110.869m, reconciling to reported $110.9m receipts. State nine months ended Sep 30, 2026. Receivables, ceilings, noncash recognition and HREE cash retain separate labels; no double count in OCF |
| E9 / 11: historical company liquidity | True waterfall; Liquidity!B16:B26 with dated asset endpoints A8:D10; `liquidity_bridge.csv` / `liquid_assets.csv` | Opening $1,830.286m; seven signed components; closing $1,337.911m; change −$492.375m; zero residual. Preserve smaller accretion/restricted/valuation steps in labels or audit inset. No allocation of all PP&E or remaining assets to 10X |
| E10 / 12: decisions and evidence | Three stakeholder rows with action, required evidence and change-of-view condition; analysis final paragraphs; Checks evidence flags | Sponsor: cash/uses/completion; lender: certificates and cash conversion; public financier: delivered cash and enforceable obligations. Source/method links included here and on exhibits; no numerical risk score |

Technical sensitivities and the $0.8m cancellation comparison stay in the workbook. They do not require more slides. If an appendix is added, it counts toward the 20-slide total cap.

## Five publication gates

| Gate | Phase status | Evidence now / release requirement |
|---|---|---|
| A Analytical substance | Refined argument/model prepared; Benjamin review pending | Ranked explanations, financing economics and timing implications delivered; accepted scope does not imply approval of conclusions |
| B Prose authenticity | Research copy reviewed by Codex; publication copy pending | Direct claims with local limitations; reread full publication copy after production |
| C Visual integrity | HOLD for publication; no slides exist | Render and inspect every actual slide, links, reading order and contrast |
| D Quantitative/source fidelity | Workbook 1.0 technical checks complete; human financial and exact-deck review pending | 388 formulas reconcile in LibreOffice/native Sheets; 10 scenarios, invalid-input tests, historical stability, all-tab visual inspection; no native Microsoft Excel test claimed |
| E Publication coherence | Storyline prepared; Benjamin review pending | Read title sequence and final deck; exact files, rights and human release approval required |

This phase stops at a reviewable financial argument, tested workbooks and exhibit specification. **Next action:** Benjamin reviews the thesis, ordinary-equity-takeout objection, timing method and model 1.0. Once resolved, finished-deck production is the next coherent phase. No merge, deployment, publication, external message or institutional approval is authorized here.

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
