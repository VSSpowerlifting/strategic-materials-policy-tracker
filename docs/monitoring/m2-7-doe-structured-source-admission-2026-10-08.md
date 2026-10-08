# M2.7 — DOE CMEI structured article-card and original-date admission

**Status:** manual-only, read-only acceptance candidate. This does **not** activate a DOE collector, create any source identity baseline, deliver an editorial queue or publish a policy/financial measure.

## Verified source observations

The [successful DOE M2.6 original-HTML preflight #37820293673](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37820293673) on merged `main` `b857511` furnished actual bounded DOE markup:

- `<ul class="collection collection--page ...">` contains **10** top-level `<li class="collection-item">` rows on each of first two filtered DOE pages. Each row exposes a unique `collection-item__link` URL/headline, a visibly formatted `collection-item__date`, `collection-item__icon_type`, and `collection-item__office` with the explicit source office. No row URL overlap between the two pages.
- The original press releases have a publisher-owned `<article about="..." typeof="schema:Article">` and `<div class="beneath-title">` with a `<p class="primary-office">` and a `<span class="display-date">`. The visibly displayed **September 30, September 14, September 11** release dates differ from some publisher CMS metadata and global navigation dates. Those other dates **must not** be substituted for the visible publisher dates.
- One September 30 DOE release concerns **$29.5 million selections for award negotiations**, not executed project financing. Another is a $16 million workforce prize competition. The home-building news sample is the deliberately unrelated negative control. The source's scope and financing instrument must be reviewed by humans.

## New code

- `scripts/doe-cmei-structured-parser.ts`: a pure, fail-closed card-and-header parser. Only the exact known filtered DOE index URLs (page 0 and page 1, paragraph 822121) are accepted, with exactly one main and one collection list and ten fully populated cards. The parser demands one publisher-bound card URL/title/date/issuing office/document type per row, official canonical article URLs, unique card identities, and descending calendar order. Different dates and URLs on the two pages are checked; page overlap or discontinuity is rejected. DOI broad `/articles/` and CMEI `/cmei/articles/` routes are both accepted *when publisher-bound to a card*, never as standalone site navigation.
- Article header validation uses one `schema:Article` region, the publisher-visible `display-date`, explicit CMEI `primary-office`, the main H1 and the article's official `about` URL. Its title/date/issuer/URL must agree with the original listing card. CMS `article:published_time` and `article:modified_time` are deliberately ignored as publication dates. The return type explicitly records `bodyBoundaryConfirmed: false`.
- `scripts/probe-doe-structured.ts`: a separate **manual-only** read-only source audit fetching the same five bounded DOE URLs as M2.6 (two list pages plus the two mineral-themed articles and non-minerals control). Reuses existing allowlisted HTTPS official host, 18-second timeout and 2 MB response cap. Reports all 20 card-scoped source-only observations, three original header comparisons and up to four **bounded markup hints per original article** for identifying the remaining body-text selector. It always returns `enabledForMonitoring:false`, `sourceStateCreated:false`, `bodyBoundaryConfirmed:false`. Errors yield `degraded` and red CI-style workflow status *after* evidence is archived; genuine finance amounts are never inferred or inserted.
- `.github/workflows/doe-structured-provenance.yml`: **workflow_dispatch-only** with `contents:read`, no cron, no write/push, 30-day report artifacts and GitHub step summaries.
- New tests cover accurate listings, negative controls, impossible dates, missing CMS fields, duplicate URLs, changed template, unexpected office, page overlap and actual original article mismatch. The existing DOE M2.5/M2.6 preflight remains unchanged except exporting its bounded host-verified HTML fetch helper.

## Acceptance steps

1. Pass exact-head `npm ci`, production npm security audit, `validate`, `typecheck`, `lint`, full tests and build. Reviewer examines that the only changes are offline DOE tooling, manual workflow and docs; no automatic monitoring activation or publications.
2. Human squash-merge only with permitted checks; Vercel preview can be rate-limited independently.
3. One manual [SMPT DOE CMEI structured publisher validation](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-structured-provenance.yml) on `main`. **Passing must be confirmed from actual GitHub Actions run**. Inspect `report.json` for all 20 issuer-bound listings and three article-header matches. Any live template deviation is new source evidence and must remain red until diagnosed, not silently discarded.
4. Inspect the bounded source-body selector hints in that report for the actual original article-body class and footer cutoff; do **not** fingerprint an entire webpage or accept broad visible text as the article body.
5. Only once the original article *full body* is independently scoped, candidate M2.8 can implement a **standalone, initially manual-only DOE shadow publication monitor**, with original full-text fingerprinting, strict dates, 2-3 page rollover, separate baseline state/artifact recovery, negative-control tagging and human-only editorial approval. No M1/EXIM source ID changes.

Successful M2.7 proves publisher *source metadata* parsing, not daily collector health, source completeness or any financial policy commitment.
