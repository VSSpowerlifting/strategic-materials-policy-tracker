# DOE M2.7a: structural listing DOM correction (2026-10-08)

## Original failure — preserved evidence

[Live structured DOE validation #37823322024](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37823322024) was deliberately **red**, despite the previous [DOE manual preflight #37820293673](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37820293673) establishing **10 distinct official article-shaped links per page** and three verified article samples.

The newly stricter M2.7 publisher-card parser returned **0 accepted listing pages of 2**, reporting `DOE first two CMEI index pages require ten explicit listing cards`. Because there were no accepted listing entries, all three original article comparisons were blocked as downstream effects. It did **not** report DOE HTTP source failure. Its original run artifact is `smpt-doe-structured-evidence-37823322024-1`. Zero collector state, identities, finance/policy rows, or private review decisions were created.

The source of the suspected parser error is the original non-greedy global regex over list elements:

`/<ul\\b([^>]*)>([\\s\\S]*?)<\\/ul\\s*>/gi` and its matching `<li>` expression.

These **do not respect HTML nesting**: a parent list can consume child collection markup before the regex iterator ever reaches the `collection--page` opener, and the first nested closing tag can truncate the parent. The earlier successful probe used a publisher-scoped `<main>` and did not require nested list matching.

## Correction — narrow boundary

- Introduce a **same-tag depth-aware extractor**. Search all opening `ul` / `li` tags carrying the explicit official class, then match the closing tag by proper same-tag depth. Do not loosen `collection--page`, `collection-item`, `collection-item__link`, unique title/date/office checks, strict published calendar date, source URL, descending chronology, or zero same-URL page overlap.
- If fewer/more than **10 publisher-scoped rows**, duplicate publisher collection lists, unbalanced list boundaries, missing dates, changed issuing office, or original URL/header/date disagreement: remain **red**. Add the bounded observed card count to the error to speed diagnosis without promoting partial evidence.
- Regression fixtures include a collection nested within an unrelated DOE layout list, nested related-topic UL/LI within a publisher card, duplicate publisher collection lists, and an unclosed list.
- Manual structured DOE workflow remains **unscheduled**, **read-only**, **zero monitor baseline**, **zero approved intervention or financial commitment**, no EXIM/M1 memory or private editorial changes.

## Acceptance

1. Exact-head production security audit, validate, TypeScript, lint, full tests and Next.js build.
2. After human merge, rerun [DOE CMEI structured publisher validation](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-structured-provenance.yml) on `main`. Review its **actual source-generated** summary and artifact. No CI unit test may substitute for the live read.
3. Require actual `2/2` listing pages, **20 publisher-card-bound** unique URLs, zero page overlap, and **3/3 verified original article headers** (including home-builders unrelated scope). A green result stays `forensic_only` with `enabledForMonitoring:false` and `bodyBoundaryConfirmed:false`.
4. If another field fails, correct the specific source evidence. Never remove the office/date checks, skip failed rows, or bootstrap a DOE collector.
