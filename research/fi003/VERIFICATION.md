# FI003 — verification, corrections and delivery limits

**Research cutoff and verification date: November 6, 2026.** Research conclusions remain ready for Benjamin’s review. Benjamin explicitly approved all three concrete candidate admission packages in chat; that approval covers the admitted source records, not the financial thesis, future workbook, publication files, merge or deployment. No findings or approval are attributed to Jiho.

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
| Local API/export/sitemap QA | Finance APIs retain roles/statuses/amounts; JSON/CSV include admitted records; sitemap includes Texas event; no FI003 private candidate IDs or reviewer payload leakage |
| Complete diff / generated-output inspection and `git diff --check` | Completed; no unrelated seed reordering or serialization changes retained |

The first post-admission full Node run failed **22 of 1,100** tests because old current-cutoff/count assertions and the 10X stack expected the earlier corpus. Repairs preserve historical release snapshots by excluding the explicitly enumerated FI003 cohort only for those snapshots. Current tests recognize the separate Texas grant and several-public-bodies result without inventing private project funding. Three admission regressions and one dated-field audit test were added. The complete suite was rerun and passed, rather than accepting isolated successes. No prior human signatures, source dates or milestones were rewritten. A test development attempt also used the wrong aggregate property name; it was corrected to the established `instruments/byQualifier` shape before the full passing run.

One initial Python expected percentage was truncated rather than rounded at six decimals; it was corrected to the independently checked 8.313610% and the complete 18-test suite rerun. The original foundation’s results remain history: 15 Python tests/10 schedules; 1,097 Node tests passing in this worktree. Its older attached checkout had a private-ledger-dependent Node failure and lint traversed embedded worktrees; private state was preserved. Those historical passes are not substituted for this revision’s checks.

CI must be read against the pushed SHA; local passes are not CI results. Browser checks used the local production build, not the live website. Temporary logs/screenshots are under `/tmp/smpt-fi003-phase2/`; no source screenshots or binaries are committed.

## Remaining consequence and next gate

The financing-flexibility and retained-risk conclusions are strengthened; claims of optimality, sole JPMorgan design, demonstrated addback use and unsubsidized 10X viability remain unsupported. Missing original loan terms prevent a price/recourse optimization, while the $0.8m cancellation difference stays a bounded evidence gap. Missing certificates prevent actual covenant headroom. Missing project spend/ramp/collection schedules prevent a project funding forecast or DCF.

Benjamin’s next decision is the thesis, ranked objections and bounded workbook/storyline scope in PUBLICATION_PLAN. Jiho’s one-page challenge remains optional input and unsent. No native Excel recalculation, finished-slide review, physical inspection, borrower/bank confirmation, legal opinion, production deployment or public publication verification is claimed. No merge, release or external message was performed.
