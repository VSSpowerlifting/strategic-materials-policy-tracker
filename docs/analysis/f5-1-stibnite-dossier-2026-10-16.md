# F5-1 dossier: Perpetua Resources Stibnite Gold Project (2026-10-16)

**Status: UNSIGNED RESEARCH. Not a review, not an approval, not publishable.**
Machine-readable evidence: `research/f5/industrial-evidence-pilot-chronology.json`
(cases `review-m3-2-stibnite-early-works` and `review-m3-2-stibnite-burntlog`, plus
`stibniteChronology`).

Both Stibnite M3 rows are **Taxonomy blocked**. The adjudicator refuses any approval
while the gate is `taxonomy_blocked`, whatever the checklist says.

## Case A: early works (`review-m3-2-stibnite-early-works`)

| Field | Value |
| --- | --- |
| Digest | `a0339c5102b805339ea05d611de54f1bed67692adca8c9a396c1b19b8db82836` |
| Canonical source | `src-perpetua-stibnite-early-works-2025` (Perpetua Resources, published 2025-10-21, accessed 2026-10-09) |
| Proposal | `construction_started` / `whole_project` / occurred 2025-10-21 |
| Finance refs | none |
| **Disposition** | **Taxonomy blocked**: `whole_project` could imply full mine construction (§7 test 3) |

The event day is anchored by the CEO's own words: "we officially started early works
construction today". The date is not inferred from the release date. It rests on the
issuer's explicit "today".

## Case B: Burntlog Route (`review-m3-2-stibnite-burntlog`)

| Field | Value |
| --- | --- |
| Digest | `fc8173070df8e47266c660e5c3279b3da6c02e86124c7ab8de2d72d52ea29ebc` |
| Canonical source | `src-perpetua-stibnite-construction-2026` (Perpetua Resources Corp., published 2026-06-01, accessed 2026-10-02) |
| Proposal | `construction_started` / `named_infrastructure` / occurred 2026-05-30 |
| Scope as stated | "Burntlog Route access road and associated 2026 critical-path works" |
| Finance refs (context only) | `fin-us-dod-perpetua-stibnite-dpa`, `fin-us-exim-perpetua-stibnite-2026` |
| **Disposition** | **Taxonomy blocked**: `named_infrastructure` is not in `PROJECT_MILESTONE_SCOPES` (§7 test 4) |

The event day is stated by the issuer ("On Saturday, May 30"). The release itself came
out on 1 June. The validator rejects an occurredOn that falls after the cited source
boundary (§7 test 8).

## Seven-part chronology

| Part | Time as stated | Type | What happened | Maps to M3 |
| --- | --- | --- | --- | --- |
| 1. Agency approvals | 20–21 Sep 2025 | event | Federal and state approvals authorizing limited early works (10-Q) | — |
| 2. Financial assurance posted | 17 Oct 2025 | event | Perpetua reports posting "$139 million in construction phase financial assurance", secured with corporate cash. The 10-Q puts the requirement at about $160M | — |
| 3. Early works begin | 21 Oct 2025 | event | "we officially started early works construction today". The June 2026 8-K confirms the work "began in October 2025" | early-works |
| 4. Litigation | 29 May – 17 Jun 2026 | state | The preliminary-injunction motion, which excluded early works, was denied on 29 May. The Ninth Circuit denied a stay on 17 June | — |
| 5. Federal finance context | 19 Dec 2022; 21 May 2026 | event | The DPA Title III award, and the EXIM board action on 21 May 2026. **Narrative only**: a board approval is not an executed loan, and neither is tied to a workstream | — |
| 6. Burntlog critical-path works | 30 May 2026 | event | "On Saturday, May 30, Perpetua commenced additional critical path construction activities" | burntlog |
| 7. Forward targets | H2 2026; 2029 | target | The 10-Q says full construction waits for full financing and an FID targeted for H2 2026. The June release targets "2029 operations" | — |

The separate U.S. Army / INL antimony sulfide pilot (`src-us-army-antimony-pilot-2026`,
6 Aug 2026) is a different facility. It is not a Stibnite mine milestone, and it is
kept out of this chronology. Parts 5 and 7 can never become occurred milestones
(§7 test 5).

## Evidence packages

| Lead | Publisher / title | Published / accessed | Type | Quote (≤15 words) | Limitation |
| --- | --- | --- | --- | --- | --- |
| issuer_early_works_release | Perpetua Resources, *Breaks Ground on the Stibnite Gold Project* ([link](https://perpetuaresources.com/perpetua-resources-breaks-ground-on-the-stibnite-gold-project/)), registered | 2025-10-21 / 2026-10-09 | event | "we officially started early works construction today" | Early works only |
| issuer_financial_assurance_pdf | Perpetua, the same release as a PDF ([link](https://perpetuaresources.com/wp-content/uploads/Perpetua-Resources-Breaks-Ground-on-the-Stibnite-Gold-Project_Oct-21-2025-vFINAL-v2.pdf)), **unregistered** | 2025-10-21 / 2026-10-16 | event | "posted $139 million in construction phase financial assurance" | Agency acceptance records are absent |
| issuer_q2_2026_10q(_approvals) | Perpetua / SEC EDGAR, *10-Q Q2 2026* ([link](https://www.sec.gov/Archives/edgar/data/1526243/000110465926097134/ppta-20260630x10q.htm)), registered, **datePublished null** | — / 2026-10-02 | state | "does not intend to commence full construction on the Project until full financing" | The evidence boundary falls back to the access date (§7 test 7) |
| issuer_construction_release | Perpetua Resources Corp., *Advances Construction* ([link](https://www.investors.perpetuaresources.com/investors/news/perpetua-resources-advances-construction-of-the-stibnite-gold-project)), registered | 2026-06-01 / 2026-10-02 | event | "On Saturday, May 30, Perpetua commenced additional critical path construction activities" | Not full mine construction |
| issuer_construction_release_schedule | Perpetua, the June 1 release as a PDF ([link](https://perpetuaresources.com/wp-content/uploads/Perpetua-Resources-Advances-Construction-of-the-Stibnite-Gold-Project_June-1-2026.pdf)), **unregistered** | 2026-06-01 / 2026-10-16 | target | "maintaining construction schedule for 2029 operations" | A target only |
| issuer_8k_june_2026 | Perpetua / SEC EDGAR, *Form 8-K* ([link](https://www.sec.gov/Archives/edgar/data/1526243/000110465926068574/tm2616463d1_8k.htm)), **unregistered** | 2026-06-01 / 2026-10-16 | event | "builds upon the early works construction Perpetua began in October 2025" | Gives the month only |
| exim_board_minutes | EXIM, *Board Meeting Minutes, May 21, 2026* ([link](https://www.exim.gov/news/minutes/board-meeting-minutes-2026-05-21)), registered | 2026-05-21 / 2026-10-02 | event | null (not re-verified) | An authorization, not an execution |

All sources are English (`translation: na`).

## Discrepancies

| Case | Topic | Disposition |
| --- | --- | --- |
| Early works | whole_project scope for an early-works start | Taxonomy blocked |
| Early works | Approval, assurance and start on three different days | Conditionally supportable with a specified caveat |
| Early works | $139M posted versus about $160M required | Missing original documentation |
| Early works | Financial assurance treated as an EXIM disbursement | Contradicted or unsupported |
| Burntlog | named_infrastructure is non-canonical | Taxonomy blocked |
| Burntlog | Burntlog as the first construction start | Contradicted or unsupported (the 8-K and 10-Q place early works in Oct 2025) |
| Burntlog | Full mine construction started | Contradicted or unsupported (10-Q) |
| Burntlog | EXIM approval or DPA award treated as drawdown | Contradicted or unsupported |
| Burntlog | 2029 operations | Resolved and source-supported, **as a planned target only** |

## Adjudication questions (after the taxonomy decision)

- **Early works.** Perpetua's CEO said early works construction started on 21 October
  2025. Does that support a dated early-works start for the Stibnite Gold Project,
  without implying that construction of the full mine or the processing facility began?
- **Burntlog.** Perpetua said it commenced additional critical-path construction on
  30 May 2026. Does that support a dated start of Burntlog Route infrastructure works,
  kept separate from the October 2025 start and from full mine construction?

/response keeps Stibnite at `binding` / `binding` / `construction_or_later` (§7 test 12).

---

## Taxonomy decision request (for the maintainer; NOT implemented)

**The problem.** `PROJECT_MILESTONE_SCOPES` has three values: `whole_project`,
`named_facility` and `funded_activity`. Neither Stibnite event fits any of them.

- *Early works* is a limited, permit-authorized workstream within the whole project.
  `whole_project` would suggest that mine construction began, but the 10-Q says full
  construction waits for full financing.
- *Burntlog Route* is site-access infrastructure. It is not an operating facility, so
  `named_facility` would suggest a plant was being built.
- `funded_activity` is tied to `funded_activity_completed`, and neither event has a
  funded-activity source.

**Options**

| Option | Change | Effect | Risk |
| --- | --- | --- | --- |
| A (recommended) | Add one scope, `named_workstream`, which must carry an explicit `scopeAsStated`. It would cover early works and site-access infrastructure, and be barred from `operations_started` and `production_reported` | Both rows become reviewable with honest scope | One new label. The validator and UI copy need a small update |
| B | Add two scopes, `named_infrastructure` and `early_works` | Precise | Two labels created for one project, which the methodology warns against |
| C | No change. Keep both rows blocked | No taxonomy drift | Stibnite stays without native milestones, even though the issuer's statements are clear |
| D | Reuse `named_facility` and put a caveat in `scopeAsStated` | No schema change | Conflates a road with a plant, and would mislead the /response stage reading |

**The decision needed.** Pick one option. If it is A or B, implementing it is a separate,
maintainer-approved PR that edits `lib/types.ts`, the validators, the M3 queue rows and
any UI labels. This PR changes none of them.
