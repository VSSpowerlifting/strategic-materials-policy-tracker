# M2.9a — DOE independent shadow-state and loss-recovery contract

**Date:** October 8, 2026. **Implementation:** pure offline state-transition preview only; there is **no activated, scheduled, or persistent DOE monitor** and no permission to baseline any DOE record.

## Evidence gates already met

- [M2.7 structured DOE validation #37825957544](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37825957544) completed on the official publisher: 2/2 fixed CMEI-filtered listing pages; 20 publisher-bound title/date/URL rows; 0 duplicate URLs; 3/3 matched original article headers. The actual 20 rows included **15** explicitly CMEI-credited and **5** `Energy.gov` sitewide-credited listings. A sitewide label cannot be upgraded into CMEI issuing-office attribution.
- [M2.8 original body proof #37827488148](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37827488148) succeeded from merged #101. The September 30 mining-project announcement contained **14** original publisher `field--name-field-text` long-text blocks, **12** accordion headings, 7,460 candidate body characters and 3 link targets; the September 14 prize example had 1 block/2,093 chars/2 links; the September 11 unrelated homebuilders negative control had 1 block/2,146 chars/3 links. No errors. These are engineering diagnostics, **not** a legal/source-use clearance, complete-body adjudication, stable production revision hash, or verified policy action.
- M2.8 hard-codes `fullBodyBoundaryConfirmed:false`, `eligibleForRevisionTracking:false`. Its SHA-256 values must **never** be imported as approved revisions through this contract.

## Pure, offline contract added

`scripts/doe-shadow-state-contract.ts` exports a uniquely namespaced `watch-us-doe-cmei-news-shadow` v1 continuity schema. The schema is **not** added to `lib/`, the production index, M1 `PILOT_SOURCE_IDS`, EXIM state, a GitHub workflow, or any persisted artifact.

### State input requirements

The only accepted **previous** DOE shadow state has the expected source ID/version, a matching approved semantic parser version (e.g. `doe-semantic-v1`, not the current `candidate-only-v1`), an explicit `lastLatestId`, a valid UTC `lastSuccessfulAt`, and 1–3,000 SHA-256 identities/fingerprints. Its newest known anchor must exist in the seen map.

If this state is **missing, corrupt, wrong-source, wrong-version, missing its anchor or incompatible with the approved semantic version**, the routine throws. No implicit baseline, fallback to zero changes, EXIM/M1 artifact reuse, or automatic bootstrap is possible.

### Transition proposal (no files written)

`previewDoeShadowTransition` takes valid previously recovered state, publisher article observations and a future, separately authorized completeness gate. It requires:
- The explicit **publisher full-body boundary certification**, source-use clearance, complete finite listing/article window, independently verified original headers and an external recovery receipt.
- Same approved semantic version as the previous state, strictly newer UTC timestamp and the bounded two-page source window. A future upgrade to three pages/new date semantics requires another reviewed contract version; never just increase this limit.
- Unique canonical official HTTPS article URLs, valid descending publisher-visible dates, title and independently verified original article header, valid 64-character **approved** semantic hashes, and literal original attribution. The 20 observed records are a **test snapshot**, not a hard-coded source corpus.
- Sitewide `Energy.gov` listing attribution stays literal, with **null** issuer until independently established; no policy/funding materiality inference.

If the source window cannot find the last trusted newest-article anchor, return **`coverage_gap`** with the **old state unchanged** and no claimed new/revised items. If anchor recovery succeeds, produce a **preview** of the next state and separately marked `unreviewed` source observations; no commit, write, published content, editorial promotion, or financial record exists in this code.

### Baseline and artifact contract for the later M2.9b implementation

A *future* reviewed DOE shadow scanner would require its **own** nonoverlapping state artifact (`smpt-doe-shadow-state-RUN-ATTEMPT`) and source report (`smpt-doe-shadow-report-RUN-ATTEMPT`), with independently verified original run identity, branch, artifacts and source health before any replay. Exact artifacts, first-run authorization and dispatch identity would be recorded in an operating log, not inferred from EXIM. Required loss behavior is **red + human investigation**; never silently create a fresh baseline from an expired/failed/partially restored artifact.

Those artifact names and the new source ID are **reserved design identifiers only** in this phase; no workflow emits them yet.

## Still blocked / next separately authorized work

1. Independent source-use/copyright and article-format review of all text fields, image captions, headings, lists, embeds, links and accordion project content. The M2.8 positive three-article smoke does not certify every official story.
2. A reviewed **stable production semantic-fingerprint version**, including publisher title/date/office, full meaningful body, cited links and handling of dynamic boilerplate. Tests must show substantive amendment changes hash while navigation and CMS timestamps do not.
3. Explicit first DOE baseline authorization and a dedicated **manual-only** collector runner, recovering from its **own** previously accepted artifact on each replay. Proof of a healthy bootstrap and recovered replay *before* unattended scheduling.
4. Dedicated review-only editorial path. Never treat DOE project selections, open prizes, allocation announcements or financial headlines as executed or disbursed commitments.

**Acceptance for this PR:** offline unit tests, security audit, `npm run validate`, typecheck, lint, complete tests and Next.js build. No GitHub workflow dispatch or deployment is needed to verify this pure contract. M2.9a should be a safe stopping point even if the 24-hour Vercel preview limit persists.
