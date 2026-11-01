# F5 publication preparation — proposed corpus cutoff impact

**October 17, 2026 · read-only structural review, NOT publication authorization.** Related to draft [PR #175](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/175). Proposed `site.lastUpdated` is **2026-10-17**; currently published is **2026-10-09**.

## Actual corpus-date meaning

`lib/site.ts` explicitly defines `lastUpdated` as **"Last curated corpus revision, NOT a claim that every row was rechecked on this date."** This date *can* legitimately advance with an actually reviewed new public milestone without asserting that 183 original source documents were all visited that day. However, moving the global cutoff affects date-based validators, presentation, as-of filters and the intended scope of what the curated release contains. It therefore needs an independently authorized whole-corpus **impact review**, not a blanket re-authentication of every record.

There is a separate source-review gate: the real human approved the *original Alcoa ceremony claim* through the gitignored M3 ledger with five checks and a prospective cutoff. That is **not** blanket authorization to publish the seed, alter the site revision, add public casefiles, or reinterpret the financing context.

## Public seed metadata audit

Read-only scan of all **13** public `data/seed/*.json` arrays on main `134e7bb1b8cad97b9de1f6f12cac77fe9ae85558`, analyzing exact ISO date values in nested records and preserving their field/record context:

| Public records | Count |
| --- | ---: |
| Control measures | 45 |
| Events | 65 |
| Financial commitments | 96 |
| Framing records | 57 |
| Jurisdictions | 8 |
| Materials | 14 |
| Organizations | 99 |
| Programmes | 12 |
| Project designations | 33 |
| Project-native milestones | 0 |
| Projects | 76 |
| Sources | 183 |
| Watchlist | 10 |
| **Total public array records** | **698** |

**Date observations after Oct 9 through proposed Oct 17: zero.** Every existing registered publisher/public-source date and historical source-access date remains at or before Oct 9. **Date values after Oct 17:** 21 entries, all future `control-measures.statusHistory[].until` boundaries: **19** suspend-until dates of **2026-11-10** and **2** distinct suspend-until dates of **2026-11-27** (2024 No. 46 U.S.-directed gallium/germanium/antimony denial and graphite end-use review, both suspended under 2025 No. 72). These are prospective suspension end dates, not independently observed resumptions or new restrictions. Their `until` values are **not** later-achieved suspension decisions, fresh reporting, or permission to assert those controls ended. No other dated fields in the public seed are beyond the proposed cutoff.

The separate candidate `groundbreaking_reported` is not in any public seed yet. Its original Alcoa report on Aug 24 and genuine review on Oct 17 would fit the proposed cutoff **if** publication is independently authorized.

Run the checked, read-only sensitivity audit on the draft branch, with no editor/source signatures or seed mutations:

```sh
node --import tsx scripts/audit-f5-corpus-cutoff-impact.ts --proposed-cutoff 2026-10-17
```

It explicitly returns `publicationAuthorized: false`, `allExternalSourcesRechecked: false`, `maintainerReviewRequired: true`. A null/zero count means only that **currently stored** date fields do not attest additional new records; it cannot identify new uncollected notices or prove all data remain current.

## Other release risk checks

1. **Physical milestone qualification:** original [Alcoa Aug 24 announcement](https://news.alcoa.com/press-releases/press-release-details/2026/Australia-Japan-the-United-States-and-Alcoa-Break-Ground-on-Gallium-Project-in-Western-Australia/default.aspx), opening paragraph, reports a ceremony marking a facility build start. Proposed public kind stays `groundbreaking_reported` at the named gallium plant. Do **not** promote to verified sustained construction or operating production.
2. **Financing is a separate evidence lane:** three associated finance records represent announced support/offtake context for one project and cannot be summed as multiple delivered physical outcomes or automatically relabeled `disbursed`. No financing seed is edited in this draft.
3. **Historical and forward semantics:** 21 future control-status `until` dates remain future boundaries on Oct 17. Capital amount and policy "as of" views cannot be assumed fully refreshed simply from a new curated revision date.
4. **Watchlist and monitoring:** current watchlist evidence must not acquire fabricated `lastCheckedAt` dates or an invented monitoring-start date. Neither is changed by this proposal.
5. **Public reviewer attribution:** published `ProjectMilestone` fields would include the human reviewer's real name and October 17 review date. The maintainer should review and explicitly authorize that attribution for the first publication. Private rationale and full private ledger must **not** be committed.
6. **Exact-head production regression:** applying the seed and changing `lastUpdated` will break several existing *intentional no-publication fixture assertions*. Do not weaken them preemptively. Replace with release-specific positive checks of exactly one new milestone plus no extra future/pending claims, and retain separate checks for the remaining unsigned pilot candidates.
7. **Preview exposure and deployment:** this draft has a remotely reachable Vercel preview. Therefore the live public seed remains **unchanged** until a separate final release decision. A follow-on live-seed commit itself creates a potentially accessible preview; coordinate that final step with the maintainer's release authorization, not merely a CI green signal.

## Editorial decision still needed

**Go for a separate supervised release commit** only after (a) the maintainer affirms this is a *curated revision* rather than a false assertion that everything was rechecked, (b) confirms the public kind and named facility/source caveat, (c) agrees to reviewer-name/date display, (d) independently confirms the locally held ledger and updated digest are still valid, and (e) explicitly authorizes **publication and deployment**, beyond the permission already granted to stage the draft proposal.

This document is an impact assessment, not a request to alter source/finance records or an automatic release switch.
