# M2.1 — Independent EXIM shadow collection with full-text revision checks

**Status:** implementation candidate awaiting exact-head CI and a *real* GitHub Actions bootstrap/replay after merge. **No EXIM measure is verified or published.**

## Why EXIM, and what is actually proven

M2.0 discovery [GitHub run 37728686586](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37728686586) fetched the EXIM news listing successfully (HTTP 200, 23 article-shaped official links). The DOE listing also worked (12 links), while the defense index timed out. M2.1 selects **only EXIM**. Its [official news index](https://www.exim.gov/news) shows dated release cards and its releases have their own publication date in a `FOR IMMEDIATE RELEASE` heading. For example, EXIM's [September 23 U.S.–Argentina framework](https://www.exim.gov/news/exim-signs-7-billion-argentina-build-future-framework-prioritize-energy-security-and-critical) describes mobilizing financing *up to* $7 billion for several sectors. It is NOT evidence of a binding $7 billion project-specific mineral commitment, obligation or disbursement.

**No live M2.1 parser or article-body scan has yet run** as of this code review; its real HTML compatibility will be established only after a manual GitHub-runner bootstrap. The M2.0 link-shape probe was much less strict than this scanner and cannot prove it will work.

## Source-specific parser and continuity invariants

- The independently registered source is `watch-us-exim-news-shadow`, **not** part of M1's `PILOT_SOURCE_IDS`. M1 Canada/Interior caches and recovery are unchanged; no seed watchlist row, public status, published source `lastCheckedAt`, candidate or financing data is edited.
- Start at `https://www.exim.gov/news?page=0`. The public index exposes `?page=1`; when the previous latest release is not present, traverse up to **three bounded 5-or-more-release pages** at `?page=0,1,2`, and stop when the previous anchor reappears. A repeated item at a page boundary or the previous anchor absent after three pages is **uncertain continuity**, not success. It is surfaced as a source failure/window gap, and the old memory remains intact. This does not guarantee full historical coverage or prove that the oldest missing releases are recoverable.
- Require each HTML listing entry to contain an article-shaped official EXIM URL, a nearby explicit publication date and a nonempty title. Canonicalize apex/www publisher aliases and hash the source ID plus canonical article URL for a stable identity.
- Retrieve the full official HTML body of every release in the bounded current observation window. Match the published date against the dated index, confirm headline identity, and fingerprint normalized release text between `FOR IMMEDIATE RELEASE` and `ABOUT EXIM:`, excluding navigation/footer churn. A source-title or article-body change emits a *revised publication* observation only, **not** a legal or financial amendment claim.
- Set hard 2 MB index and 1 MB article limits, 18-second HTTP request timeouts, three pages, up to 35 items per page, 3,000 hashed persistent IDs. Every request is read-only to `exim.gov`/`www.exim.gov`. Parsing invalidity, HTTP blocks, off-host redirects or missing dates fail the source without overwriting prior healthy memory. HTML template drift may require a parser update.
- Review queue `shadow_unverified_exim_editorial_queue` records only observation ID, time, new/revised status, title, official URL, date and keyword-only hints. This is a **distinct EXIM review schema**, not yet importable through the M1 local `editorial:inbox -- sync` command. It is stored in a report artifact for explicit human review; no one should claim an integrated private candidate pipeline until a separate reviewed schema-unification phase.

## Separate schedule and guarded bootstrap

Workflow: [SMPT EXIM shadow monitoring](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/exim-shadow-monitor.yml)

- Independent concurrency group, daily **14:07 UTC** schedule (10:07 EDT / 9:07 EST) and manual `workflow_dispatch`.
- After merge, **run manually first** on `main` with **`bootstrap=true`**. This is a *one-time intentional baseline*, not a claim of any new discoveries. If GitHub already has a previous EXIM state artifact, this flag rejects the attempt to re-bootstrap.
- The workflow finds the most recent valid archived hashed state artifact among earlier completed EXIM runs; if one exists, restores it before any scan. Retains separate `smpt-exim-state-RUN-ATTEMPT` and `smpt-exim-report-RUN-ATTEMPT` artifacts for 30 days. These contain hashed source identities/metadata only, not human decisions or published policy claims. If state is missing and `bootstrap=false`, **fail closed** before source requests.
- Following an accepted bootstrap, run **one manual replay with `bootstrap=false`**. Confirm `baseline: no`, `health: ok`, zero new/revised if EXIM changed nothing, and that the log actually downloaded the prior run's state. The optional `force_recovery` checkbox is informational because this EXIM workflow **always** restores state from a prior artifact rather than using cache; it does not change behavior.
- The next scheduled run should preserve the restored baseline. GitHub cron is not evidence a scan actually ran; monitor Day-7/14/30 with spaced healthy runs. Artifact retention is **not permanent storage**: if 30 days of state history disappear, restore a trusted older backup or obtain explicit approval for a reviewed reset.
- Source degraded or possible-window-gap scans archive evidence before returning failure; restored prior state is carried forward, never silently reset. Never automatically translate EXIM announcements into finance totals or a policy event.

## Acceptance

CI must pass `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and exact CLI startup check; tests cover signed-off bootstrap, duplicate replay, source-body revisions, new published item, bounded pagination, missing anchor, interrupted/blocked HTTP, corrupt state, article/index date disagreement, and M1 isolation.

**Operator gate before calling EXIM live:** one healthy explicit bootstrap, one healthy restored replay, preserved independent artifacts, and manual spot-check of at least two sample dated releases and one unrelated news release. If the HTML fails strict date/body validation, fix the parser with live evidence and tests—**do not** disable the date/continuity checks or mark HTTP 200 alone as a pass.
