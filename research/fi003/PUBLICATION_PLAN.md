# FI003 — single publication tracker

**Updated November 6, 2026. Target: December 4, 2026, conditional on research and Benjamin’s review.** This file controls owners, status, dependencies, proposed dates and publication gates. Dates below are planning proposals, not commitments by collaborators. Research cutoff remains November 6. Draft PR [#215](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/215) remains the delivery vehicle.

Working title: **JPMorgan and MP Materials: Financing Flexibility Before 10X Production**.

Decision: explain what a comparable industrial sponsor or lender should learn from a replaceable construction commitment, a completed equity raise and continuing corporate credit. Recommended answer and ranked objections are in [analysis.md](analysis.md).

## Work and decisions

| Item | Owner | Status at this revision | Dependency / concrete review gate | Proposed date |
|---|---|---|---|---|
| Strengthened thesis, competing explanations, financing comparison and risk allocation | Codex | Complete for Benjamin review | Benjamin accepts/revises the stance; no inferred optimality | Nov 6 delivery; review by Nov 10 |
| Q3 filing refresh, sources, contract corrections and reproducible arithmetic | Codex | Complete for research review; results in VERIFICATION | Maintain Nov 6 cutoff; review material clauses and source reconciliations | Nov 6 |
| Candidate admission preparation and existing-record duplicate review | Codex | All three packages explicitly approved by Benjamin and admitted to draft branch; see entry below | Established candidate workflow, distinct private/public finance and project uses; no schema expansion | Nov 6 |
| Strongest-objection challenge | Jiho, if Benjamin invites him | Pending; no finding or approval attributed | One-page response to JIHO_HANDOFF; Codex’s analysis already proceeds independently | Suggested Nov 13 |
| Send invitation / assign credit and authorship | Benjamin | Unsent message prepared | Benjamin chooses participation and sends; no external communication authorized here | Suggested Nov 9 |
| Adjudicate thesis, method and objection | Benjamin | Pending | Record disagreements beside affected claim; Jiho response is optional input, not a prerequisite to research progress | Suggested Nov 16 |
| Compact editable financial workbook | Codex in next production phase | Specification below; no workbook built | Accepted calculation scope; replicate accepted Python outputs and independently recalculate in spreadsheet engine | Suggested Nov 18–20 |
| Storyline and original exhibit production | Codex under Benjamin’s direction | Storyline specified below; no slides built | Accepted thesis and source package; ≤20 total slides, target 12 | Suggested Nov 23–25 |
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

## Bounded workbook specification

**A small financial workbook is justified for eventual publication; the Python/CSV package suffices for this research-review phase.** The decision depends on auditable dilution, proceeds definitions, credit capacity, cash conversion and conditional contract mechanics. A broad project or bank-profitability model would add unsupported assumptions. Benjamin’s acceptance of this specification is the next methodological gate, not a prerequisite to the independent research already delivered.

Build one editable `.xlsx`, with real formulas rather than pasted outputs. Six tabs can cover the evidence:

| Tab | Inputs and formulas | Acceptance condition |
|---|---|---|
| Guide_Sources | Decision, version, cutoff, input IDs, source URLs/locators, dates, units and classifications; link each numeric input | All facts trace to inputs.json and originals; assumptions visually distinct; no institutional endorsement |
| Financing | Exact shares × public/underwriter prices; gross/discount/net distinction; new shares / old and / (old + new); fee/headline ratio; comparable instrument matrix | Match replacement/financing_economics; preserve −$0.8m as unresolved cancellation comparison; no annualized fee or cost-of-equity proxy |
| Credit | Dated RCF/L-C snapshots; unused = commitment − L-Cs − loans; days/360 fee and interest; isolated EBITDA clause and later reversal; text of netting/trigger/maturity constraints | Match snapshots/sensitivity/adjustment; reject overdraw; no actual headroom without certificate inputs; no zero-fill of missing covenant data |
| Support | PPA normalized kg payoff before/after milestone; PPA receivable/income/receipt tie; three-state offtake formula and nominal quarter fraction | Pre-COD blank; pre-milestone capacity ratio only; post-milestone full escalating threshold; first-payment proration and true-up excluded and visibly labeled |
| Liquidity | Reported combined assets; operating/PP&E/financing flows; accretion, restricted-cash and valuation reconciliation; debt principal vs carrying amount; support statuses | Zero bridge residual; receipts never added to operating cash flow again; private capacity and noncash awards separated from cash |
| Checks | Independent anchors, source/cutoff checks, units, denominators, scenarios, missing-input flags, engine/version and calculation log | Formula recalculation agrees with Python at stated precision; no formula errors; source/calculation review recorded separately from Benjamin’s approval |

Editable controls: hypothetical SOFR, RCF draw, rate-year days, normalized benchmark, contract year, capacity ratio and operating/milestone state, isolated Test-Period minimum/net income and later duplicate cash. Facts are protected from scenario edits. Include a visible note that the capacity illustration is a full-year contractual-definition schedule, not an annual true-up or first-payment calculation. Do not implement the ambiguous syndicated-magnet upside waterfall without separately reviewing the complete formula and its definitions.

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

## Revised 12-slide storyline and exhibit specification

Each title below is a provisional assertion, not finished slide copy. Preserve sources, evidence class, units, cutoff and source/calc links when producing slides. Use original SMPT visuals, direct labels and text/status encodings beyond color. This budget includes cover and methods; all appendices count toward the 20-slide ceiling.

| # | Assertion and class | Comparison / exhibit; data and sources | Mechanism / material limit |
|---|---|---|---|
| 1 | JPMorgan and MP: financing flexibility before production | Scope/decision cover; November 6 cutoff; research authorship/review status | Hypothetical sponsor/lender audience; no affiliation |
| 2 | Financing closed while construction and corporate risks remained — inference | Answer plus ranked competing explanations; analysis/evidence C37–C48 | Supported outcome, no optimality claim |
| 3 | JPMorgan participated from joint commitment to continuing credit — documented roles | Entity/role matrix; S01/S07/S09/S15; underwriting.csv | Preserve joint participants and bank self-description |
| 4 | Replacement rights were built into the original financing route — contract/disclosure | Dated chronology: July 9, Apple July 15, equity July 16, RCF Aug 25, expiry Aug 26; S02/S11/S17 | Sequence, no unsupported causal arrows |
| 5 | Equity removed scheduled repayment at the cost of ownership dilution — calculation/judgment | Financing comparison + 8.31% share-base increase / 7.68% isolated post-base; financing_economics.csv | Precise denominators; original debt costs unknown |
| 6 | L-Cs leave $203m of the $275m revolver available at September — reported/derived | Three dated snapshots; revolver_snapshots.csv; S19 Note 8 | Capacity is conditional, L-C sublimit not extra cash |
| 7 | The credit contract recognizes Defense support in covenant EBITDA — contract | Clause arithmetic, reversal and trigger/netting/maturity timeline; S09 | No actual addback/headroom or sole-design attribution |
| 8 | Government instruments cover distinct exposures and leave parent obligations — contract/judgment | Risk-allocation matrix; S02 §6.09, S03/S04/S05/S19 | MP guarantee runs to DoD; no sovereign repayment substitution |
| 9 | 10X threshold protection changes across three contractual states — contract/calculation | Three-state table; offtake_threshold.csv; S03 §§1.2/2.1/6.2 | Legal term begins signing; full-year illustration excludes true-up/proration |
| 10 | PPA support produced $110.9m of cash; other balances have different meanings — reported | Cash/receivable/ceiling/noncash table; support_accounting.csv; S19 Notes 9/13/15/21 | No double count with OCF; TSIF differs from HREE receipts |
| 11 | Expansion consumed $492.4m of company liquid assets during nine months — calculation | True historical bridge; liquid_assets/liquidity_bridge; S19 | Multi-project company resources, no remaining 10X gap or runway |
| 12 | Replicate financing flexibility, then diligence cash conversion and completion — recommendation | Sponsor/lender/public-financier decisions, decisive gaps and linked sources/methods | Benjamin resolves thesis; exact-file publication gates still required |

## Five publication gates

| Gate | Phase status | Evidence now / release requirement |
|---|---|---|
| A Analytical substance | Research prepared; Benjamin review pending | Ranked explanations, comparison and risk map delivered; human stance/method decision unrecorded |
| B Prose authenticity | Research copy reviewed by Codex; publication copy pending | Direct claims with local limitations; reread full publication copy after production |
| C Visual integrity | HOLD for publication; no slides exist | Render and inspect every actual slide, links, reading order and contrast |
| D Quantitative/source fidelity | Research checks in VERIFICATION; exact workbook/deck pending | Originals and calculations checked; workbook engine recalculation and exact-file tie-out still needed |
| E Publication coherence | Storyline prepared; Benjamin review pending | Read title sequence and final deck; exact files, rights and human release approval required |

This phase stops at a reviewable research revision. It authorizes no merge, deployment, finished presentation, external message or institutional approval.

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
