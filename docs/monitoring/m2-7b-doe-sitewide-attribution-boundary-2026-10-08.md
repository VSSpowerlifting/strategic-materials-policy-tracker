# M2.7b — CMEI-filtered DOE listings can carry sitewide attribution

**Date:** October 8, 2026. **Status:** candidate correction; no source collector is activated.

## Live source failure and verified cause

[Structured validation 37824471003](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37824471003) ran on the squash merge of M2.7a (#98), with both official DOE listing HTTP requests returning data. The depth-aware nested-list matcher advanced beyond the prior card-count error, but the source gate rejected both listing pages at `DOE CMEI filtered row lacks verified issuing office`. The original article comparisons were subsequently blocked by the lack of accepted source index rows.

Direct review of the **current official publisher pages**:
- [CMEI-filtered page 0](https://www.energy.gov/collection/view?page=0&paragraph=822121) lists several articles with per-item `Office of Critical Minerals and Energy Innovation`, but also DOE-wide items labeled **`Energy.gov`** (including the September 9 mining-technology article, the August 21 steelmaking story, and the August 20 supply-chain story).
- [CMEI-filtered page 1](https://www.energy.gov/collection/view?page=1&paragraph=822121) likewise includes **`Energy.gov`** entries (August 7 workforce initiative and July 2 proposed appliance rule), alongside explicit CMEI-attributed articles, plus a **Blog** item alongside press releases.
- DOE's **listing filter** states that these items are included on the CMEI desk; it does **not** establish CMEI as the issuing office of each item. Sitewide `Energy.gov` is not a concrete ministry/office attribution and must not be rewritten to CMEI merely to satisfy a parser.
- On the two observed pages, 15 items show the explicit CMEI office attribution and 5 show `Energy.gov`; these counts are **snapshots**, not a fixed schema/health expectation as the listing updates.

## Narrow fix

The parser now requires an exact **observed publisher label allowlist** in each original `collection-item__office`: either `Office of Critical Minerals and Energy Innovation` or `Energy.gov`. Unknown/empty/multiple/malformed labels remain rejected. The output keeps:
- `attributionAsListed` = publisher literal (preserved, provenance-first).
- `issuingOffice` = explicitly reported CMEI office, or **null** when `Energy.gov` appears. Null is **not** a request to default/guess.
- The article title, URL, displayed date, original document type, page chronology, zero duplicated URLs, mandatory ten bounded cards per page, and verified source host remain unchanged.

When a sampled original article URL/date/title is compared with an `Energy.gov`-labeled card, the comparison continues to require original URL/title/date to agree, but **cannot compare an issuing office absent from the listing**. It requires a publisher's distinct `schema:Article` `primary-office` field on the original article; the index's CMEI filter is never used as a substitute. The report explicitly separates **sitewide attribution only** from **office confirmed by the listing**.

As a diagnostic improvement, original article headers are independently parsed even if an index page fails. If an index match is missing, the receipt remains **red** and records the directly observed publisher header separately, rather than misleadingly implying DOE's article HTTP endpoint was unavailable.

## Hard boundaries and next evidence

- This remains a **manual-only source admission and forensic validation**. There is no DOE shadow scanner, recurring schedule, baseline, source identity or fingerprint, publication feed, human editorial decision, public event or financial commitment.
- A successful run will still return `forensic_only`, `enabledForMonitoring:false` and `bodyBoundaryConfirmed:false`.
- Exact-head CI must pass security audit, data validation, TypeScript, lint, all tests, and Next.js build. Test fixtures reproduce both observed attribution labels and prove `Energy.gov` entries do not acquire a fabricated issuing office.
- After merge, manually rerun [DOE CMEI structured publisher validation](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-structured-provenance.yml) and inspect the live report for **2/2 complete pages, 20 distinct source cards, zero overlapping URLs, exact publisher attribution preserved, and 3/3 original article headers**. If any new field fails, investigate rather than relax the issuer/date gate.
- A standalone DOE source scanner remains gated on **full article-body boundary verification**, continuity state design and verified historical rollover coverage. A selected-for-negotiation amount is not a binding or disbursed commitment.
