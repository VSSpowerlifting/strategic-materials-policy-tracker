# M2.5a — DOE CMEI filtered-list scoping correction (2026-10-08)

**Status:** source forensics fix under review. No DOE source collection or publication activation.

## Precisely what failed

[DOE preflight workflow #37816498552](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37816498552) ran successfully up to the deliberate source-admission check; the completed job returned `degraded_do_not_activate`, with its report artifact archived.

- The official DOE filtered listing `/collection/view?page=0&paragraph=822121` and `page=1` both returned HTTP **200**, each with **13** article-shaped anchors in the *entire raw HTML document*.
- The first 3 links were identical on **both** pages: **Genesis Mission Awards**, **Fact Sheet: Delivering on ... Prosperity and Security**, and **Fact Sheet: Golden Era of American Nuclear Energy**. The other ten links on each page were distinct.
- These three generic featured-news URLs are absent from the corresponding filtered results displayed in DOE's official page body. That suggests **site-level chrome contamination**, not a publisher listing rollover. The earlier extractor scanned **all page anchors**, including header/sidebar elements, and the original fail-closed overlap rule correctly refused collector eligibility.
- All 3 directly requested article samples returned HTTP 200 with unique H1 headings. The September 30 mining-selections example's raw HTML contains `article:published_time=2026-09-28...` and `article:modified_time=2026-09-30...`, while the visible listing says **September 30**. This illustrates why article metadata timestamps **cannot silently substitute for displayed publisher publication dates**. No new/revised designation or financial status can be inferred.

## Narrow correction

- Require **exactly one** bounded `<main>...</main>` region in the official listing HTML (or fail closed). Only article-shaped official links **inside** that region count toward potential page entries and pagination overlap.
- Record other official news-shaped links outside the main region in a **separate, explicitly excluded** `outsideMainArticleHints` field and in the artifact summary so reviewers can verify the source of contamination. These are diagnostics, not archived publications.
- Preserve both `/cmei/articles/...` and `/articles/...` publisher paths **if they occur within main**; rejecting all DOE-wide article paths would silently omit genuine filtered records such as the September 9 mining announcement.
- Retain source timeouts, official-host/redirect guards, bounded page size, unique H1 checks, negative-control article, two-page pagination cross-check, explicit no-activation result, and no persistent identities.
- The strict unique-main scope is a **hypothesis to test live**. It must **not** be considered a verified DOE article-card boundary until the new GitHub runner output shows those 3 off-main, a clean 10-vs-10 paginated sample, and actual DOE DOM grouping is separately reviewed. If these URLs remain within main, the source remains red and should receive a further DOM-structure inspection rather than loosening the overlap check.

## Gate

After exact-head CI passes, owner may squash-merge and manually dispatch **SMPT DOE CMEI source provenance preflight** on `main` again. Inspect the new report artifact, especially `outsideMainArticleHints`, `anchorCandidates` for each page, and the warnings. Never run a DOE bootstrap: no DOE collector exists. All preflight findings remain nonbinding editorial evidence and are excluded from SMPT event/financial totals.
