# M2.9d — Compare two independent DOE manual body reports without activating monitoring

**2026-10-16 — a source-evidence comparison tool, not source-state persistence.**

## Problem addressed

The M2.9b original live sample ([Actions run 38955466705](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38955466705), artifact [12069737637](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38955466705/artifacts/12069737637)) established working DOE article retrieval and **nine omitted structural elements**, seven external-to-text-field links and two external-to-text-field lists. M2.9c [PR #148](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/148) added bounded sanitized DOM ancestry to later manual reports. Merely running the publisher probe twice does not yet tell the reviewer **which candidates changed**, how many risk elements appeared/disappeared, or whether the sample was incomplete.

This phase adds a strictly **offline** comparison between two *original manually acquired* reports. It requires two complete, successful, nonactivated source runs, from two different increasing UTC instants, each with the same three source URLs and publisher role assignments. It compares:

- The original DOE official **article title, publication date and issuer attribution** (differences require source inspection; do not assume an editorial event occurred).
- The **experimental M2.8 text/accordion candidate fingerprint** and recognized field/heading/character/citation counts. These are neither a complete semantic identity nor a stable final source revision.
- Five original structural risk categories, their **counts**, and their available **kind/tag/inside-field/fingerprint** multisets. The report deliberately ignores `ancestorTrail` when comparing hashes so the addition of M2.9c reviewer hints does not invent a source edit.
- The risk inventory truncation contract (24 hash samples/article): if any risk set was truncated, **no exhaustive risk-sample comparison** is possible, and human review is always required even when the first 24 hashes match.

**Output contains no original text, article previews, unpublished author data, raw DOE source bodies, original hrefs, or previously untrusted file bytes.** It displays approved source sample URLs, source roles, per-role difference codes, timestamps and risk counts only. All rights, content completeness and activation flags are **false**.

## Exact operating instructions

1. Open the [DOE CMEI experimental body evidence](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-body-proof.yml) workflow and use **Run workflow → main** to produce a *new*, distinct successful run with M2.9c `ancestorTrail` hints. Do not create any scheduled collector.
2. In **both** [run 38955466705](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38955466705) and the later manually dispatched run, download the `smpt-doe-body-evidence-RUN-ATTEMPT` artifacts, and extract each archive's **`report.json`** into separate **local** directories outside tracked Git paths. Record the actual run URL and artifact ID in your private review log. If an original report is missing, degraded, from a different schema, or associated with a failed workflow, **do not compare it as verified source evidence**. This CLI validates the report's internal provenance contract, *not* GitHub's API attestation of its run ID/status/artifact SHA.
3. From the repository root, run:
   ```sh
   npx tsx scripts/compare-doe-manual-reports.ts /private/path/older/report.json /private/path/newer/report.json
   ```
   It writes **JSON to standard output only**. For confidential review you may save it under an existing gitignored directory; do not commit private source artifacts or arbitrary report contents to public git. The CLI uses no network, GitHub token, browser, state baseline, source registration, scheduled workflow, exports, or seed modifications.
4. If `status: manual_source_review_needed`, open each flagged original publisher URL and inspect the exact source versions; verify whether changed data reflects meaningful body text, external article citations, link-only page furniture, content revisions, publisher date edits, or dynamic CMS boilerplate. Record independently reviewed source-version dates/hashes under **existing private editorial/source tooling**, not automatically from this output.
5. If `status: no_difference_detected_in_bounded_evidence`, **do not infer the DOE article was unchanged**: all three initial source bodies have unconfirmed full boundaries, the first live evidence flags nine omitted structures, M2.8 hashes only recognized fields, and a zero-difference report is **not** completeness certification. Unsampled or dynamically generated publisher content can change without appearing in either report.

## Stop conditions and external dependencies

- The CLI **fails closed** on compromised sample identity, mismatched candidate/coverage fingerprints, corrupt risk counts or sample hashes, non-chronological source observations, unknown role/URL, promoted source-use/activation flags, missing or partial publisher listing, degraded/errors reports, or unsafe M2.9c DOM breadcrumbs.
- A legitimate source-wide article addition/removal from the original two listing pages would require an additional separately approved source-window investigation. This three-article comparison is **not** a full source-listing change monitor.
- Even two healthy runs do **not** approve the future `doe-semantic-v1` full-body fingerprint, source-use/copyright conditions, independent first baseline, recovered replay, scheduled monitoring or automatically issued finance/policy claims. The [M2.9a shadow-state contract](m2-9a-doe-shadow-state-continuity-contract-2026-10-08.md) continues to block unapproved recovery/activation.
- No changes to the M1/EXIM monitors, financial amount histories, policies, source registry, F5 Observatory/public seeds, routes, exports, or ongoing PRs #86/#130/#132/#133/#134.

## Test acceptance

Run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and exact-head CI. Focused tests cover the **real live sample's three role/count shapes** using synthetic hashes; in particular a new M2.9c DOM ancestry field must **not** spuriously create a revision signal, whereas a modified out-of-field link fingerprint must yield a human review signal even if M2.8 body hash stays the same. A tampered claim of source-use approval cannot be converted into a state transition.

**Current live evidence count:** one post-M2.9b manual success (run 38955466705). There is **not yet a second, M2.9c-compatible run**. No invented later source observations or successful two-run comparisons are claimed.
