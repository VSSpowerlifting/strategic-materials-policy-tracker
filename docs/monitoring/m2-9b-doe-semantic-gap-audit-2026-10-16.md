# M2.9b — DOE structural coverage gap audit (manual source-only probe)

**October 16, 2026 — internal publisher evidence, not an active DOE source.**

## Why this phase matters

The merged M2.7 parser has demonstrably recovered two original DOE CMEI-filtered listing pages and verified DOE article title, publisher-visible release date and issuer from three independent original headers. M2.8 extracts long-text fields and accordion headings into a bounded **experimental** hash. M2.9a defines a future **offline, approval-gated** shadow-state transition but correctly rejects M2.8 hashes as production publication identities.

That still leaves a direct risk: an original article could acquire a substantive **table, image caption, embedded PDF/video, separately rendered paragraph, heading or download** without changing the **experimental M2.8 fingerprint**. A green sample can therefore be a false negative for material source revision. This phase does not attempt to certify completeness. It makes those *known structural blind spots visible* in exactly the same **manual-only, five-publisher-request** experiment.

## Focused code changes

- `scripts/doe-cmei-semantic-coverage.ts` is a pure, 2 MB-bounded offline risk inventory that **first invokes existing M2.8 official header/long-text validation**, then limits counting to the original publisher-owned `schema:Article` inside `main`. It classifies structural risks **only**, not policy materiality, copyright, rights, actual body completeness or semantic hash approval:
  - `structured_table`: `table`, `thead`, `tbody`, `tfoot`, including tables inside known long-text fields (linearized cell order can obscure meaning);
  - `image_or_caption`: `img`, `picture`, `figure`, `figcaption`, `source`;
  - `embedded_media`: `iframe`, `embed`, `object`, `video`, `audio`, `canvas`, `svg`;
  - `outside_text_field`: meaningful `p`, `h2`–`h6`, `ol`, `ul` or `blockquote` not inside the existing text-field/accordion-heading coverage, excluding the article's own `beneath-title` publisher metadata;
  - `outside_cited_link`: hyperlinks appearing outside currently fingerprinted fields/accordion headings, excluding publisher metadata.
- Results contain **only counts, bounded up to 24 semantic element fingerprints and structural tag classifications** (maximum 300 candidate risks per article), **no full article text, no copied HTML or outbound link targets**. If markup structure is inconsistent or source boundaries are unavailable, the audit fails closed. A detected element fingerprint is an **engineering-only diagnostic** and is not a certified source-version SHA.
- `scripts/probe-doe-body.ts` now adds this diagnosis to each of the three existing manually sampled official articles. The experiment remains **five total bounded official publisher requests**, **workflow_dispatch only**, **no automatic baseline, state, review authority, official source registry or publication**. A zero-risk inventory **does not certify a full semantic boundary**—known selector risks are not an exhaustive proof of every possible DOE CMS element, and no rights determination has been made.
- `tests/doe-cmei-semantic-coverage.test.ts` demonstrates that substantive **out-of-field table edits are invisible to M2.8 but detectable in this risk ledger**, and checks changed images, media, paragraphs, separate citation links, publisher chrome exclusion, malformed content rejection, sample limits and no activation.

## Limits that must survive review

1. This is a **diagnostic**, not a production semantic parser: recognition is limited to known HTML elements and assumes matching tags in a bounded publisher `schema:Article`. HTML with omitted closing tags, client-side rendering, custom Web Components, CSS-hidden unrecognized text, markup encoded in scripts, dynamic CMS blocks and other novel structures may escape these categories or fail closed. The absence of a signal is **not proof of completeness**.
2. Original DOE stories can contain mixed `CMEI` and `Energy.gov` listings; do not infer issue-specific CMEI authorship from the filtered listing alone. A story about **selections for award negotiations** must never be equated with an executed grant, disbursement or physical industrial accomplishment.
3. **No rights/source-use approval** or archived complete source-body hash is asserted; sample structural fingerprints are not evidence of authorized reuse of official article photographs or copyrighted third-party elements.
4. No M1/EXIM/DOE state artifact, daily schedule, developer secrets, public source/finance/policy/milestone seeds, routes/exports or monitor activation changes are permitted in this phase. The status flags `fullBodyBoundaryConfirmed:false`, `eligibleForRevisionTracking:false`, `collectorActivationAuthorized:false` and `sourceUseApproved:false` cannot be set true by these results.
5. The **next** engineering step—if original live sample audits are green—would be human DOM/source-rights review across a larger, explicitly bounded **representative article sample** before proposing an independently versioned, approved DOE semantic parser. A passing three-story diagnostic alone is not such approval. M2.9a's first baseline and source-state recovery conditions remain unsatisfied.

## Operator verification

1. Exact-head CI: dependency audit, `npm run validate`, `npm run typecheck`, `npm run lint`, all `npm test` and `npm run build`.
2. Independent read-only manual DOE workflow after merge: [DOE CMEI experimental body evidence](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-body-proof.yml). Examine the summary's new **unmodeled structure occurrences** column and report JSON's risk buckets for each of the two mineral-related samples and one unrelated negative control.
3. Treat nonzero risk as a lead for actual publisher DOM inspection, not an automatic incident or changed policy measure. Treat **zero risk as unknown**, not independently proven complete. Keep the DOE monitor unscheduled and no review items/financing published.

Work remains separate from open F5 PRs #130, #132, #133, #134 and F4 #86.
