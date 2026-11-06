# FI003 — verification, corrections and delivery limits

**Research cutoff and verification date: November 6, 2026.** Research conclusions remain ready for Benjamin’s review. Benjamin explicitly approved all three concrete candidate admission packages in chat; that approval covers the admitted source records, not the financial conclusions, model’s financial approval, publication files, merge or deployment. No findings or approval are attributed to Jiho.

## Working-model phase — current delivery

Starting live PR #215 was draft/open/unmerged at reviewed `66e42a4b32d65b902dc2eea5f852fc8d944522c2`, with all twelve workflows successful and a clean canonical worktree. Directory, origin, branch, HEAD, common directory and existing worktrees were checked. The other FI003 checkout and unrelated worktrees were preserved. All seven required guides were retrieved through GitHub on that head and main `677da73b12f4d60694be6c686b173c188cccfef5`; they matched. The linked publication house style and FI002 model specification were reread through GitHub. Main’s PR #216 editorial work was integrated intact before edits; the integration commit is `c9fb0b005f9121c5967fbd54d76e05ef44507f20`. No further corpus classification, schema or site-feature changes were made.

At final pre-push refresh, main advanced to `bb0934b87cc257032fe79e92e500ebfe928a2a1e` (PR #218). All seven guides were retrieved through GitHub again; only the presentation and editorial-integrity standards changed. Their Archivo requirement applies to future decks; README and the exhibit specification now resolve that precedence explicitly. The upstream typography reissue/assets were integrated intact, with no FI003 conflicts. The final combined branch’s required local checks were repeated. These upstream asset changes are preserved work, not a new FI003 deck or release.

The packet now contains **52 claims, 20 sources and 70 calculation facts**, plus separately labeled hypothetical controls. All twenty cached complete originals match the recorded SHA-256 fingerprints. Targeted originals were reread, including S09’s trigger/§6.01(b)/§7.11, S03 §6.2 payment timing and S19’s commissioning expectation. The web reader again failed for Q3; the directly retrieved complete cached HTML matches S19’s fingerprint. Calendar outputs were independently checked with Python dates, then actual spreadsheet calculations.

The final S02 pass added two material refinements. **C51:** §6.01’s conditional additional-preferred funding covers a specified shortfall below $350m incremental net proceeds; those proceeds up to the threshold are within the specified source/use framework. The July offering exceeded the threshold. The workbook counts the reported initial $400m preferred cash and no additional backstop cash. **C52:** §6.13 requires MP to use reasonable best efforts to raise capital if enumerated project funding is insufficient, while §6.04(d) expressly qualifies date/capability exposure. §6.09’s guarantee remains MP → DoD, subject to underlying limits. These terms sharpen the argument without implying unrestricted proceeds, an unconditional completion guarantee or sovereign bank repayment insurance. They remain analytical research; no additional corpus admission is part of this phase.

### Workbook versions, engines and reconciliation

Delivery: [recalculated editable XLSX](outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx) and [native Google Sheet](https://docs.google.com/spreadsheets/d/1Lrfoe4sNRBc6IBfwyNTwgKINOYWCsHkWZb0EH4wzdYI/edit), **FI003 model 1.0, November 6**. The native file is an `application/vnd.google-apps.spreadsheet` in the private FI003 folder on the connected account containing FI002. Drive metadata and authenticated UI both showed owner-only/private-to-me access; no sharing/invitation was performed. The access/status evidence and final XLSX hash are recorded in `outputs/fi003-model-v1/delivery.json`.

One controlling specification/input set drives both versions. `model.py` emits formulas, independent Python outputs, controls and scenario cases. `build_workbook.mjs` authors with the bundled artifact-tool, exports XLSX, exercises scenarios and renders populated areas. **LibreOfficeDev 26.8.0.0.alpha0** recalculates the delivery workbook. Its OOXML cached results were read independently with standard-library XML/ZIP code. The recalculated XLSX was imported through Drive’s native conversion tool, then actual Sheets `effectiveValue` results and entered formulas were read. Post-import text/layout refinements mirror the controlling specification. No financial formulas were replaced by values. No native Microsoft Excel application test is claimed.

| Verification | Observed result / record |
|---|---|
| Python unit tests | 24 pass: original financial anchors plus strict-quarter boundaries, invalid/missing controls, contractual-state effects, historical isolation and terminal checks |
| Exploratory schedules | All 11 reproduce exactly; unchanged historical outputs |
| Controlling specification | `model.py --check` reproduces exactly; 97 independent analytical anchors, including 76 fixed/historical anchors |
| Artifact-tool evaluator | All non-link formulas agree; ten scenarios pass, historical anchors unchanged; `artifact-validation.json` |
| LibreOffice baseline | **388 formula cells** reconcile to Python at ≤1e−7 absolute workbook units; literals, six tabs, eleven validations and formulas retained; no formula errors; `libreoffice-validation.json` |
| LibreOffice changed scenario | Full $203m draw at 5% SOFR, post-milestone 25% capacity: $15.225m interest, zero unused fee, full $151.5405024m threshold; all 187 non-Checks formulas reconcile; `libreoffice-scenario-validation.json` |
| Native Sheets baseline/restoration | **388 evaluated formulas**, 90 HTTPS hyperlinks, eleven controls/validations and all 70 facts reconcile; final `native-restored.json`; `verify_native.py` |
| Native live scenarios | Ten cases pass: zero/full draws, price/state changes, negative attributable income, duplicate-cash reversal, quarter-end trigger, >100% pre-milestone ratio, overdraw, missing inputs and invalid state/year/capacity. All 76 fixed/historical anchors and 70 facts unchanged in every case; `native-scenarios.json` |
| Financial anchors | 8.313610% share-base growth vs 7.675499% ownership dilution; $22.4249982m discount / 3%; $203m Q3 residual credit; $110.869m PPA receipts implied versus $110.9m reported; $492.375m liquid-asset decline and zero bridge residual |
| Timing interpretation | Illustrative Aug 15, 2027 delivery → Sep 30 first test; 93–458 days to 2028 year bounds. Exact quarter-end triggers move the test to the next quarter; no actual COD, legal deadline or headroom forecast |
| Visual/usability inspection | All six tabs inspected in authenticated native UI; all populated sections covered by 18 artifact previews. Source titles, comparison cells and check notes were resized/merged after initial clipping. Controls, units, date formats, links, negatives and missing-input behavior inspected |
| Repository checks | `npm run validate`, `npm test` (1,101 pass), `npm run lint` (0 errors / 28 inherited warnings), production build and typecheck pass on the final combined branch. PR #218 adds the unused `serif` warning in the upstream FI001 builder; FI003 adds no lint warnings. This verifies local research/combined branch, not deployment |

Platform limits: artifact-tool exports HYPERLINK but does not evaluate it; Calc and Sheets validate its real labels/links. Previews use friendly link labels only after the actual file is exported. Google preserves whole-number controls as numeric-range validations; integer/date guards independently reject fractional/invalid inputs. Date-validation bounds are localized on import. Formula-reference/format serialization differs across engines. All model dates are date-only; no time-zone-sensitive formulas exist. Later manual XLSX/Sheets edits are independent; no synchronization is implemented or claimed.

### Financial judgment and remaining review

The received-capital/dilution trade-off, historical cash conversion and pre-commissioning covenant interval strengthen the retained-exposure thesis. The source/use restrictions narrow a broad claim of freely reallocable equity. The conditional public preferred fallback strengthens evidence of public support in the financing framework, while its contribution to equity demand remains unisolated. The strongest explanation remains a flexible commitment followed by an available equity takeout, with Apple a credible contemporaneous influence. Original construction-loan terms block comparative cost-of-capital optimization; actual certificates block headroom/use-of-addback claims; remaining 10X spend and collection schedules block a project funding gap or runway. The $0.8m cancellation comparison stays technical and does not undo reported undrawn expiration.

Benjamin’s next review concerns the financial thesis, significance of the conventional-equity objection, timing method and exact model version. Jiho’s one-page challenge remains pending and optional; message unsent. PUBLICATION_PLAN is the single owner/date/gate tracker and now contains production-ready exhibit ranges. Finished-deck production is the next coherent phase after those decisions. No PR merge, public release, manual deployment, outreach or institutional endorsement was performed. Repository-triggered preview automation is separate from this local verification.

## Earlier research/admission phase — retained audit history

## Identity and governing guidance

- Live draft PR [#215](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/215) was open, unmerged and at reviewed head `c1a700a1713e5300ee7506d418fae566e26e822a`. Starting base/main was `fe1d5b3b2fd9ef99018fe2be6b032466b69c5771`; no dependent PR was needed. The continuation uses the existing `codex/fi003-jpmorgan-financing-foundation` branch and `/Users/benjaminyang/strategic-materials-policy-tracker-worktrees/fi003-research` worktree, initially clean, with the expected GitHub origin and shared repository common directory.
- The attached checkout was on older `codex/fi003-jpmorgan-financing-research` at `a4bbd89` with pre-existing untracked screenshots/private state. It and other worktrees were preserved; no branch switch, reset, clean, guard bypass or overwrite was used there.
- All seven requested governing documents were retrieved through GitHub on starting main and the reviewed PR head; file contents matched exactly. During final review, main advanced to `b7e67994de5ac96bc7fa9a1cf8ef823eb1b420fc` (PR #213). A fresh GitHub comparison showed only AGENTS.md changed, adding the website editorial/interface rule. Codex read it, refined new public notes, and merged current main with no conflicts; the combined branch preserves the upstream site cleanup. Final checks below were repeated on that combined revision. The linked publication house style and FI002 model specification were also read through GitHub. README records the slide-cap and format-specific typography precedence. The user authorized this commit/push; publication authority stays separate.

## Source and interpretation checks

The packet now has **49 claims, 20 sources and 69 sourced numeric facts**, separate from assumptions. Source IDs resolve from the ledger and inputs. Existing cached originals for material contracts, offering and bank documents match the foundation’s SHA-256 fingerprints and were reread at the relevant operative sections. Complete Q3 2026 HTML, the refreshed SEC index and the Texas official release were retrieved directly by HTTP and fingerprinted. The web reader failed on the Q3 URL; direct retrieval returned HTTP 200. No snippet, compressed legal summary or inaccessible-source assertion replaces the originals.

The SEC index records accession `0001801368-26-000057` as a **November 6 filing**, accepted November 5 at **23:13:56 UTC**, signed November 5. This resolves the prior same-day retrieval observation that Q2 was latest. Q3 financial statements, Notes 3/4/6/8/9/13/15/16/21, MD&A, risk disclosures and the exhibit list were checked. September credit capacity, support receivables and cash collection, principal/carrying debt, construction, incentive recognition and subsequent-event references were reconciled. The filing has no separate subsequent-events note or new financing-contract exhibit; that bounded observation is not a claim that no events occurred.

Material corrections and independent anchors:

| Item | Original-source check / result |
|---|---|
| Offtake legal term / locator | S03 preamble and §2.1: effective July 9, 2025 until ten years after COD. Definitions are §1.2 |
| Three operating states | No pre-COD operating threshold modeled; capacity ratio between COD and milestone; full escalating threshold from milestone. No automatic later reversion to capacity scaling |
| Illustrative 2029 threshold | $140m × 1.02^4 = $151.5405024m full threshold; 50% pre-milestone = $75.7702512m. Full-year definition only; no actual true-up/first-payment calculation |
| MP guarantee | S02 §6.09 guarantees specified project-company payments/performance **to DoD** as primary obligor, subject to underlying limits; not sovereign repayment insurance for banks |
| Credit adjustment | S09 §1.01 EBITDA (a)(xiv): Test-Period amounts against attributable net income, certificate estimate and later duplicate-cash reversal; no actual certificate use established |
| Q3 revolver | S19 Note 8: zero loans, $203m capacity, $128m unused L-C capacity, reported covenant compliance. $72m implied L-C exposure stays an analytical calculation |
| Equity arithmetic | 13,590,908 × $55 = $747.499940m gross; × $53.35 = $725.0749418m after discount/before other expenses; discount $22.4249982m / gross = 3% |
| Dilution | July-9 basic base 163,477,816; isolated post-offering base 177,068,724. Share-base increase 8.313610%; new shares / isolated post-base 7.675499%. Other dilution excluded |
| Commitment reconciliation | Final reported $724.2m net + $275m capacity − $1bn = −$0.8m; after-discount basis yields +$0.0749418m. Issuer-reported expiration controls status; precise cancellation ledger remains unavailable |
| PPA receipts | S19 explicitly reports $110.9m cash receipts. Opening receivable $51.016m + income $67.962m − closing $8.109m = $110.869m, consistent with that rounding |
| Liquid-asset bridge | $1,830.286m opening to $1,337.911m closing: −$492.375m. Old −$0.599m residual resolves to +$0.821m restricted-cash release and −$1.420m investment valuation; residual now zero |
| Principal vs carrying debt | $862.793m notes + $150m samarium + $30.340m equipment = $1,043.133m principal. $936.253m long-term carrying amount excludes equipment and reflects discounts |
| Distinct grant uses | S20: $53,457,500 TSIF manufacturing vs $12,880,500 TEF corporate operations. S19 rounds TSIF to $53.5m, reports May agreement and $10.075m noncash receivable recognition. HREE $6.5m construction cash is separate |

A separate exact-rational (`fractions.Fraction`) calculation, without importing the prototype, checked offering proceeds, PPA receipt reconciliation, full threshold and the complete liquidity bridge. Deterministic tests additionally cover wrong-state scaling, impossible milestone-before-COD, negative/overdraw cases, later EBITDA reversals, historical stability, source/cutoff failure and output equality. The threshold definition contains no express 100% ratio cap; the function therefore adds no invented cap, while listed scenarios remain 25%–100%.

Original-source files and bank transcripts are not redistributed. Retrieval fingerprints identify the bytes or stated decoded basis used; they do not authenticate issuer signatures or establish legal opinions. Rights are respected through links, short terms and paraphrased facts.

## Approved candidate admission and public-output checks

Existing MP records were reviewed before drafting candidates. The original joint commitment/lapse, public preferred equity, samarium loan, PPA, offtake and unsplit own cash already existed. No duplicate amount was added for those instruments.

Three private candidates were created under the existing `CandidateRecord` workflow, source-verified by Codex, and checked in an isolated native-schema dry run. Benjamin then answered **“Approve all three packages.”** Codex admitted:

- P0: Q3 PPA receipts/payment status and offtake evidence on existing records, with unknown actual receipt dates and null total PPA amount preserved.
- P1: separate private equity and corporate-revolver children under the existing MP event. They carry no full 10X allocation and no false `part_of`/`drawn_from` relationship to the expired commitment.
- P2: one Texas event and the TSIF manufacturing grant, with necessary source, programme, organization and reverse links. TEF corporate support is not assigned to manufacturing; no TSIF disbursement is inferred from noncash recognition.

Net additions: **one event, three finance rows, five sources, six organizations and one programme**. The current seed has 72 events, 202 sources, 100 finance rows, 130 organizations and 14 programmes. Existing project/milestone records and their original review dates remain intact. The curated revision is November 6; `publishedAt` and monitoring start remain null until actual release. Morgan Stanley Senior Funding Inc. is a company, since its lender signature alone does not establish chartered-bank status. No schema, taxonomy, aggregate calculation or site-layout implementation changed.

`CandidateRecord` lacks fields for typed amendments, financial children and registries. Native proposed payloads therefore lived in a private review bundle rather than invented fields or duplicate events. The admitted rows are now reviewable in the PR. The ignored `data/candidates/fi003.local.json` contains actual approval/promotion bookkeeping and is not committed. No modeled figures enter seed data. The separate private review bundle is `/Users/benjaminyang/.codex/fi003-admission-review/2026-11-06/`.

Initial dry-run checks caught a wrong programme field name, missing reverse event links and an evidence-field claim against an unallocated project; these were corrected and the whole dry run repeated successfully. Real-worktree candidate/data validation then passed. Source review and validation do not themselves grant human publication authority.

## Final local checks on the revised research and admitted corpus

| Check | Observed result |
|---|---|
| FI003 Python discovery | **18 passed** |
| `prototype.py --check` | **11 schedules reproduce exactly** |
| Independent rational arithmetic | Passed offering, receipt, threshold and liquidity anchors |
| Candidate payload strict TypeScript / isolated production validator | Passed after corrections |
| Actual `npm run validate` | Passed; 3 real private candidate/promotion records remain isolated |
| `npm audit --omit=dev --audit-level=moderate` | **0 vulnerabilities** |
| Full `npm test` | **1,101 passed, 0 failed** |
| `npm run lint` | **0 errors, 27 pre-existing warnings** |
| `npm run build` and subsequent `npm run typecheck` | Passed |
| Local production browser / output QA | Four affected finance records, Texas event and 10X project at **375px and 1440px**; no horizontal overflow; original source links present; representative TSIF screenshots inspected |
| Full organization/programme Chromium QA | Passed directory counts, shareable filters, empty states, keyboard detail navigation and mobile/tablet/desktop at 375/768/1440px; secondary navigation at 1360px. Only stale count expectations changed in those two scripts |
| Local API/export/sitemap QA | Finance APIs retain roles/statuses/amounts; JSON/CSV include admitted records; sitemap includes Texas event; no FI003 private candidate IDs or reviewer payload leakage |
| Complete diff / generated-output inspection and `git diff --check` | Completed; no unrelated seed reordering or serialization changes retained |

The first post-admission full Node run failed **22 of 1,100** tests because old current-cutoff/count assertions and the 10X stack expected the earlier corpus. Repairs preserve historical release snapshots by excluding the explicitly enumerated FI003 cohort only for those snapshots. Current tests recognize the separate Texas grant and several-public-bodies result without inventing private project funding. Three admission regressions and one dated-field audit test were added. The complete suite was rerun and passed, rather than accepting isolated successes. No prior human signatures, source dates or milestones were rewritten. A test development attempt also used the wrong aggregate property name; it was corrected to the established `instruments/byQualifier` shape before the full passing run.

One initial Python expected percentage was truncated rather than rounded at six decimals; it was corrected to the independently checked 8.313610% and the complete 18-test suite rerun. The original foundation’s results remain history: 15 Python tests/10 schedules; 1,097 Node tests passing in this worktree. Its older attached checkout had a private-ledger-dependent Node failure and lint traversed embedded worktrees; private state was preserved. Those historical passes are not substituted for this revision’s checks.

CI must be read against the pushed SHA; local passes are not CI results. Browser checks used the local production build, not the live website. Temporary logs/screenshots are under `/tmp/smpt-fi003-phase2/`; no source screenshots or binaries are committed.

## Remaining consequence and next gate

The financing-flexibility and retained-risk conclusions are strengthened; claims of optimality, sole JPMorgan design, demonstrated addback use and unsubsidized 10X viability remain unsupported. Missing original loan terms prevent a price/recourse optimization, while the $0.8m cancellation difference stays a bounded evidence gap. Missing certificates prevent actual covenant headroom. Missing project spend/ramp/collection schedules prevent a project funding forecast or DCF.

Benjamin’s next decision is the thesis, ranked objections and bounded workbook/storyline scope in PUBLICATION_PLAN. Jiho’s one-page challenge remains optional input and unsent. No native Excel recalculation, finished-slide review, physical inspection, borrower/bank confirmation, legal opinion, production deployment or public publication verification is claimed. No merge, release or external message was performed.
