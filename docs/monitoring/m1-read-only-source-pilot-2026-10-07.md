# SMPT M1: read-only official-source monitoring pilot

**Initiated 2026-10-07.** Scope: source observations, **not** event classification, financial updates, policy publication or a production monitoring-start declaration. PR based on merged `main` `316e2306`.

## Registered sources and why

1. **Natural Resources Canada**: `watch-ca-nrcan-news`, using the existing, registered Government of Canada Atom feed (`watchlist.json`). The feed includes all ministry releases, not only critical-minerals policy. Candidate items are *publication discoveries*, not verified critical-mineral interventions.
2. **U.S. Federal Register, Interior Department**: `watch-us-federal-register-interior`, read through the [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1) with its `conditions[agencies][]=interior-department` filter. The API is a convenient discovery interface; the Federal Register website's XML edition itself warns it is **not** the legally authoritative edition. A future human reviewer must check the official document/PDF and legal status before classifying a measure.

The two collectors correspond to pre-existing *active* source IDs. No fresh watchlist, event, citation, status or framing source is fabricated.

## Execution

After a maintainer squash-merges the PR, the default-branch GitHub Actions workflow **SMPT source-monitor pilot** is eligible for `workflow_dispatch` (manual Day-0 bootstrap) and a **weekly Tuesday 13:17 UTC** cron. A workflow does not become operational merely by existing in a PR, and GitHub's schedule may run later than its specified time. No Vercel entitlement or deployment is needed for the **monitor runner**, though that does not make the new data publicly published.

`npm run monitor:pilot` runs the same Node/TypeScript collector locally. It writes **ignored** files under `.monitor-pilot/`:

- `state.json`: previous stable publication identifiers and fingerprints, including the last healthy source-specific check; cached only as a best-effort GitHub Actions cache between scheduled runs.
- `report.json`: UTC observation timestamp, per-source health, HTTP status, number observed, whether bootstrapping, newly seen publications, revised same-ID publications, possible feed-window gap, and review-only metadata (public titles, dates, canonical source URLs).
- `summary.md`: bounded, number-only GitHub Actions Job Summary. The workflow's artifact (30-day retention) contains only public-source observations, no private candidate notes.

The workflow saves state and report before checking source health. HTTP 401/403/429/451 are **blocked**, not “zero new.” Non-2xx, timeouts, malformed feeds, incomplete entries, and invalid response bodies are explicitly reported and mark the job **failed**, with artifacts retained. A source failure never clears its previously observed identity set or its last successful date. The monitor has no write permission to the repository: `contents: read`, no PR/issue creation, and no Vercel or site API calls.

## Historical-baseline and deduplication rules

- **No previous state** (first run, lost cache, cache eviction): successful observation starts a baseline; it reports **zero new**, **zero revised**, and marks `baseline: true`. This is not evidence that the source has not changed since a previous uncached run. A bad/corrupt state fails closed rather than silently resetting.
- **With a prior state**: publication identity is a SHA-256 digest of the registered source ID and source-native stable ID (Atom `id`, Federal Register `document_number`). Titles, canonical URLs and published dates are separately fingerprinted. Same ID/same fingerprint is not repeated; a changed title/URL/date is logged as a **revision**, not another distinct publication. An entirely new identity becomes a *review-only observation*, never a policy event.
- The finite feed windows are at most 50 NRCan releases and 100 Interior records. A full window that no longer includes the prior latest identity raises a **possible coverage gap**; it is not automatically filled or declared complete. Local state retains up to 5,000 identities per source; GitHub cache retention is best effort, not a durable archive guarantee.
- Title-only keyword matching is strictly a **review priority hint**, not a positive/negative substantive eligibility determination. **All** newly seen official publications remain available in the report whether or not the title contains a mineral keyword. Analysts inspect the full legal text, effective date, agency, material scope, and whether a prior SMPT record already covers the action before any proposed event or source enters the private review flow.

## Gate and Day 0 / Day 7 / Day 14 / Day 30 reliability evidence

| Checkpoint | Required proof | Action if not met |
| --- | --- | --- |
| PR merge / offline | Data validation, typecheck, lint, full tests, production build; parser tests with synthetic Atom/JSON, state loss, stable ID, changed ID/fingerprint, blocked and malformed inputs | Do not call the pilot operational |
| Day 0 manual dispatch | First full `workflow_dispatch` report, timestamp, both source response classifications, one cache snapshot; all successful first detections marked baseline | Investigate network/parse access; never populate `lastCheckedAt` from failure |
| Day 7 | At least two spaced, successful scans, with both sources' stable source identities retained and no unexplained feed rollover; distinguish week-to-week new/revised counts | Repair collector, reduce window/interval risk, rerun manual proof |
| Day 14 | Review recurring source health and human triage of genuine source documents; **then** decide whether to include an additional official agency or source | Remain two-source pilot if reliability or review capacity is insufficient |
| Day 30 | Inspect a full month of reports, changes, failures and retention gap; decide whether to graduate to continuously monitored intake with review/promotion controls | Keep in shadow and retain `site.monitoringStartedAt: null` |

**Monitoring governance:** `site.monitoringStartedAt` and the watchlist's `lastCheckedAt` remain **unchanged** in M1. A scanner run alone does not establish the editorial/verification and actual publication process the project requires to claim full prospective monitoring. When a later phase meets that bar, promote only with human review and source evidence, and use the true launch/checked timestamps, never reconstructed historic dates.

**Never** import `.monitor-pilot` into `lib/data.ts`, `app/`, `/api/v1`, exports, search or `data/seed`. Never put unapproved interpretations in a workflow artifact or public GitHub issue. This phase makes no factual classification or published-record changes.
