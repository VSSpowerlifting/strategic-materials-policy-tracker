# F5 — Thompson Falls 2026 Q2 physical observation: source-first M3 intake

**Status: unsigned, taxonomy-blocked research. No public physical milestone or financing-row status revision.**

This phase rescues the original SEC evidence investigated in the older [PR #85](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/85), but **does not transplant that obsolete financing-row physical implementation patch**. The M3/F5 contract now requires project-native physical observations to be independently scoped and reviewed; an issuer filing alone cannot auto-promote a public facility status.

## SEC evidence independently checked

- **Original registered source:** `src-usac-2026-q2-10q`, [United States Antimony Corporation June 30, 2026 Form 10-Q](https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm), filed **August 11, 2026** (SEC EDGAR accession 0001104659-26-094035).
- **Note 9 — Government Grant:** reports that Thompson Falls facility expansion was **substantially completed**, with approximately **$4.1 million of related assets placed in service late in the second quarter of 2026**.
- **Note 16 — Thompson Falls, Montana Facility Expansion:** describes approximately **$39 million estimated expansion expenditures**, approximately **$33 million incurred by June 30**, about **$4 million transferred from construction in progress to PP&E**, and approximately **$29 million of gross project costs remaining classified as construction in progress** (with net PP&E presentation affected by $12.8 million recognized grant funding).
- These are **company-reported physical and corporate-cost facts**. They do **not** prove a precise day of construction start, substantial completion, commissioning, final scope closeout, full facility throughput, or that the entire $39 million corporate expansion budget is government money.
- The same filing's grant accounting reports a **$27 million** DPA package, of which **$16.2 million was obligated** and **$10.8 million required further authorization**, and **$12.8 million** associated with approved milestones was paid in April. The separate **$20 million Thompson Falls / $7 million Alaska** split is attributed to the previously registered issuer call, not extra grants.

## New canonical, *unapproved* M3 intake

One record, `review-m3-2-thompson-falls-q2-expansion`, now uses:

- `projectId: prj-us-usac-thompson-falls-expansion`
- `sourceId: src-usac-2026-q2-10q`, existing primary SEC disclosure; exact original issuer sentence anchored to **Note 9**, with Note 16 corroboration and **no new source-record access/date revisions**
- `kindProposal: construction_substantially_completed_reported`, an **intentionally unsupported proposal**; `gate: taxonomy_blocked`. It is **not** a newly approved milestone kind.
- `scopeProposal: named_facility`; `claimMode: occurred`; `occurredOn: null`; `targetOn: null`. The issuer gives a quarter, not a calendar day. Publisher date is an evidence boundary, not physical completion date.
- `relatedFinanceIds: []`: no original financial *implementation-status* observation exists for the 10-Q source. Existing financial status and cash receipts remain registered on the child row and are not hidden; the review queue's finance-link rule requires an actual same-source implementation observation before one can be linked.
- `reviewVerdict: unreviewed`, with matching example decision still `pending`, all five checkboxes false, null `reviewedBy`, null `reviewedAt` and no milestone ID. Thus the adjudicator **cannot** propose a published physical milestone for this source.

The earlier PR #85 remains a **separate, conflicted legacy implementation**, and should **not be merged unchanged** with this review-intake PR. Closing or rewriting that PR is a maintainer action after assessing whether source/project metadata enrichments should be handled independently from any source-reviewed physical milestone.

## Editorial and technical gates

1. Original-document reviewer must decide whether `construction_substantially_completed_reported` merits an expanded, reusable physical observation taxonomy, or instead keep this as a conservative non-publishing research record. **Never mislabel the SEC's near-completion report as a dated construction start, commissioning or full operations.**
2. If a new taxonomy is accepted, define schema, validator, canonical type, and tests in an **independent** reviewable phase; do not bypass a taxonomy block by populating decision checkboxes.
3. A real named and dated human source adjudication remains mandatory before any `mil-*` record is published. A later reviewer date requires an explicitly updated curated corpus cutoff; no backdating.
4. Neither the `$27M` parent nor `$20M` Thompson Falls child nor `$7M` Alaska child changes. No additional government award, payout, amount history, project stage, public casefile, status banner, API, monitor, or export is authorized.

## Tests

New assertions check that the source is primary and dated, the pending review is deterministic, `occurredOn` stays unknown, the child financial-status observations survive unchanged, `implementationStatusHistory` stays empty, the taxonomy gate cannot be bypassed, and the public project-native milestone seed remains empty. Run production audit, `validate`, `typecheck`, `lint`, full `test`, and `build` on exact PR head.
