# F5/M3 — Construction progress as a reported observation
**Engineering proposal: October 9, 2026. This document does not certify a physical milestone or authorize publication.**

## Decision and boundary

Introduce a **reusable** `construction_progress_reported` project-native milestone kind, distinct from `construction_started`, `commissioning_started`, `operations_started`, and `funded_activity_completed`.

This records **what a named primary-source issuer reports about a specified facility's construction progress**. It is not a point-in-time construction start, a blanket project-completion decision, commissioning, full operations, or rated production. A company may describe an expansion as “substantially completed” while still reporting large construction-in-progress balances and only partial assets in service.

Strict validation requires:
- `claimMode: "occurred"` (not future/planned), `scope: "named_facility"` with nonblank explicit `scopeAsStated`.
- `occurredOn: null` and `targetOn: null` because a reporting period or filing date does not establish an exact physical event date.
- A bona fide registered primary source, a bounded original statement/English translation, pinpoint evidence, and a nonblank `note` that expressly limits the physical interpretation.
- A real separately obtained reviewer identity and review date for any **eventual public milestone**; syntax and synthetic test approvals do not constitute original-source review.

No automatic project maturity rating, financial amount, package sum, government-money-to-construction causal arrow, or forward target should be derived from this kind. Missing project-native observations are evidence gaps rather than inactivity.

## Thompson Falls source handling

Existing source: [United States Antimony Corporation 2026 Q2 Form 10-Q (SEC)](https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm), filed August 11, 2026; `src-usac-2026-q2-10q`.

- **Note 9:** the company states the Thompson Falls facility expansion was substantially completed, and **$4.1 million** of associated assets entered service late in Q2 2026.
- **Note 16:** of roughly **$39 million** in planned expansion expenditures, approximately **$33 million** had been incurred at June 30; approximately **$29 million** gross expansion project costs remained classified as construction in progress. This PP&E accounting does not translate to additional U.S. government commitments or completed full-facility throughput.
- The `$27M` government-award parent, `$20M` Thompson Falls project child, `$7M` Alaska child, and `$12.8M` reported April payment all retain their **separate instrument and financial-status identities**. Nothing in this taxonomy phase revises those source-backed financing rows.

Following [#123](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/123), update **only** `review-m3-2-thompson-falls-q2-expansion`: map its unsupported `construction_substantially_completed_reported` suggestion to canonical `construction_progress_reported`, and move the **structural gate** from `taxonomy_blocked` to `human_source_review`. The original source passage, `occurredOn: null`, `relatedFinanceIds: []`, existing caveats and all separate private reviewer decisions remain unchanged or explicitly clarified. No child financing-row `implementationStatusHistory` is fabricated to qualify project-native evidence.

## Status and stop condition

- Seven M3 review cases total: **five** await human original-source adjudication; **two** remain taxonomy-blocked (INL prototype demonstrations, Stibnite Burntlog access infrastructure).
- `reviewVerdict` is still **unreviewed**, and all seven example adjudications are **pending** with null real reviewer metadata and unchecked checklists.
- `data/seed/project-milestones.json` is still `[]`. No UI, API, export, `/pathways` public page, financing/source registry, `site.lastUpdated`, or monitoring behavior changes.
- A synthetic test reviewer can exercise structurally valid *nonpublishing* proposal generation, but cannot authorize a genuine physical claim. Real reviewer attestation and a separate maintainer-approved seed PR remain mandatory.
- The next substantial phase is the **human source-review decision**, not expanding taxonomy to cover unrelated cases or advancing F5-3 publication.

**Verification:** exact-head dependency audit, seeded data validation, typecheck, lint, full test suite, production build, and separate Vercel/GitHub checks. Keep PR independent, reviewable, and stop once green.
