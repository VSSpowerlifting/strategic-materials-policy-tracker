# M1.1 — Editorial intake from monitored official publications

Status: **review-only proposal, not a publication mechanism**. First Day-0 pilot scan [#37721756213](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37721756213) on `main` `a7a492b` succeeded at 2026-10-08T03:14Z (October 7 Eastern): 50 NRCan and 100 U.S. Interior Department publications reached, both feeds healthy. Both were first baselines, therefore **zero reported new or revised**. Cache and `report.json`/summary artifact saved. That proves **one live collection**, not continuity. The second live scan has **not been verified**.

## Editor's task

The reader should be able to inspect *only truly new/revised publications observed since a retained successful baseline*, decide whether their full official texts contain strategic-materials measures in SMPT's scope, check for already-coded measures, and begin a private candidate **only after verification**. An RSS/news/document listing alone is not a measure, a verified source for all details, a classification, or evidence of legal effect.

The command `npm run monitor:pilot` now produces the existing `.monitor-pilot/report.json`, `.monitor-pilot/summary.md`, and `.monitor-pilot/state.json`, plus these **new ignored files**:

- `.monitor-pilot/editorial-review-queue.json`: versioned, machine-readable run-scoped `shadow_unverified_editorial_queue`, UTC observation time, source degradation list, and each observed change's stable publication ID, date/title/URL, `new` or `revised` tag, *keyword hint only*, exact citation-URL source matches, and initial `unreviewed` status.
- `.monitor-pilot/editorial-review-queue.csv`: spreadsheet-ready equivalent with **two empty columns** for a reviewer's private disposition and notes. Official-source titles are quoted and formula-escaped. Save a separate **local/private copy** if annotating; never upload an annotated copy to a public Actions artifact, repository commit, or issue.

The existing GitHub Actions job includes both queue exports in the same 30-day run artifact as the source health report, with no public website or API import. The short Actions Job Summary shows only observation counts and number of exact citation matches, not titles or human interpretation.

## Exact-match and triage boundaries

- The collector detects repeat publications using a stable source-native ID and title/URL/date fingerprint, preserved in a best-effort cache. It never claims that absent items in a finite feed are not policy news.
- **Only new/revised items** enter the queue. A successful first-run bootstrap yields an empty queue, not 150 retrospective candidates. A failed source yields no queue items for that source and stays visibly degraded in source health.
- Source-URL matching compares only complete HTTPS URL (ignoring fragment) against the **already published source register**. The resulting `exactCitationSourceIds` is a **possible coverage hint**, not a conclusive match to an intervention or evidence that the detected publication has been evaluated. Unmatched URLs may still describe existing SMPT events. No fuzzy/title-based deduplication.
- The title keyword hint is **not** a relevance classification: `NO` does not mean irrelevant. The source's supplied title is unverified listing metadata; review requires opening the original text and checking agency, date, materials, operative provisions, implementation and prior event coverage.
- The JSON `reviewStatus: unreviewed` is a fixed output declaration, not an editable state. Neither editor decisions nor candidate promotions persist automatically. This artifact is a **run-scoped inbox**, not a durable issue tracker; queued discoveries risk loss after artifact retention expires, and prior observations are not recreated after cache eviction.

## Private human review procedure

1. Open the monitor workflow's **run artifact**, inspect `summary.md` and `report.json` for source health, baseline, and finite-window coverage gaps. If the run is degraded, treat its output as partial.
2. Read `editorial-review-queue.csv` for *all* new/revised official publications (optionally prioritize keyword-hint YES). Open the source URL and its underlying official/PDF document. Check exact source citation matches, then search SMPT's current policy-event index manually to catch *semantic* duplicates.
3. In a **private working copy**, record a disposition such as `investigate`, `already covered`, `outside scope`, `insufficient evidence`, or `requires follow-up`, with original-source and adjudication notes. An annotated private sheet must not be uploaded to GitHub's public artifact workflow.
4. Only for a materially relevant, source-grounded new policy action: use the existing private `data/candidates/candidates.json` workflow in `data/candidates/README.md`. Add a draft candidate, run source-verifier and policy-classifier gates and human approval, and promote via the existing documented process. **This monitoring phase does not create private candidates automatically**, nor change published events, controls, capital records, watchlist timestamps, or `site.monitoringStartedAt`.

## Evidence and acceptance gates

- No modifications to `data/seed`, `data/candidates`, `app`, exports, or site data loaders. No automatic PR, issue or site release.
- Unit tests prove first-run zero queue, new/revised item identity, exact URL matches only, malformed count rejection, degraded-source isolation, CSV formula safety, deterministic output, and no policy-event/candidate metadata in queue.
- Exact-head `validate`, `typecheck`, `lint`, `test`, `build` must be green before merge.
- **Separately** run a second real scan using `workflow_dispatch` on `main` to verify cache restoration and deduplication. Expected behavior is `baseline: no`; changes may legitimately be nonzero if government sources published in between. Review the cache restore line and both source reports. **Do not claim continuity based on synthetic tests or the first run alone**.

## Limitation to address after Day 7/14

A run-scoped CSV/JSON inbox is useful for human triage but is **not a persistent decision-tracking system**. Once the editorial practice is stable, a later phase can design private durable dispositions and a guarded path from observation to private candidate, with access controls and explicit approval. Do not prematurely connect this to the public website or claim all source publications have been read.
