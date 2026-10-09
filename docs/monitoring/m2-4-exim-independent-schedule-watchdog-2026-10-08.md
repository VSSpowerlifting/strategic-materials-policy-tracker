# M2.4 — Independent EXIM missing-schedule watchdog

**Implementation candidate.** This is a second GitHub Actions timer that reads other Actions run metadata; it is **not** an external uptime-monitoring service and cannot guarantee that GitHub will execute either cron. Its purpose is to cover the known M2.2 blind spot: a `workflow_run` audit cannot start when EXIM itself never runs.

## Observed operating baseline (October 8, 2026)

- EXIM initial persisted manually dispatched baseline [#37800436243](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37800436243): 20 full-body verified news releases, HTTP 200, green report, real state and report artifacts.
- Restored manually dispatched replay [#37801575996](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37801575996): original baseline restored, 20 releases, zero new/revised, health OK and no gap. M2.3 local source-ingestion imported two receipts without creating review items.
- M2.2 `SMPT EXIM reliability evidence` automatically starts after an EXIM workflow run completes, checks the original state and report, and evaluates 7/14/30-day distinct scheduled evidence. Since all proven green EXIM runs so far are `workflow_dispatch`, **no unattended scheduled-day success is yet established**.
- EXIM scan is configured for `14:07 UTC` daily. First eligible scheduled UTC date is **October 9**; nothing before then should be classified as a missing post-baseline cron.

## Architecture

`.github/workflows/exim-schedule-watchdog.yml` schedules an isolated **22:37 UTC** read-only check daily, with optional manual `workflow_dispatch`. It has `contents: read` and `actions: read` only and checks out trusted `main` without persisted Git credentials. An 8-hour-30-minute grace period after the 14:07 UTC EXIM schedule reduces false alarms from ordinary Actions queuing (does not eliminate them).

`scripts/check-exim-schedule.ts` fetches **only** the fixed EXIM workflow's Actions metadata on `main` and unexpired artifacts for relevant, successful scheduled runs; it never makes requests to EXIM and never invokes its source collector. It requires discovery of verified baseline run **37800436243**, constrains the history lookup to 10 pages of 100 and each artifact list to 100, and fails closed on invalid/partial API evidence.

`lib/exim-schedule-watchdog.ts` checks the latest **seven due UTC calendar days**. Each day is accepted only if GitHub shows at least one actual `schedule` event for that day, completed successfully, with the exact unique `smpt-exim-state-RUN-ATTEMPT` and `smpt-exim-report-RUN-ATTEMPT` artifact pair still available. These artifacts are the same health-gated ones emitted by the existing EXIM source monitor. Any missing day, failed scan without a healthy same-day replacement, incomplete queued job past grace, or missing/expired required artifact yields a failed watchdog job. A failed scheduled run remains separately reported even if a later scheduled run succeeds that day. **Manual EXIM dispatches never fill a missing scheduled day.**

The watchdog prints a GitHub job summary, creates `audit.json` and `summary.md` in an ignored `.monitor-exim-watchdog/` runner directory, and archives them for 30 days with a distinct `smpt-exim-schedule-watchdog-RUN-ATTEMPT` name. No original scan state, source evidence, private editorial decisions, seeded policies, capital totals or public pages are altered.

## Acceptance

1. Exact-head CI: `npm ci`, `npm audit --omit=dev --audit-level=moderate`, `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. The test suite covers Day 0 and pre-grace Day 1, first truly scheduled successful run, manual non-substitution, missing and delayed scans, failure, missing or expired artifacts, same-day retries, rolling seven-day coverage, bad provenance and read-only workflow isolation.
2. On merge, **no new EXIM bootstrap or manual collector run is needed**. Both existing EXIM scanning and M2.2 completion-triggered audits remain unchanged.
3. You may manually dispatch **SMPT EXIM independent schedule watchdog** on October 8 as a no-source-fetch smoke; its correct result is `awaiting_first_due_day`, not reliability success. This is optional and cannot prove tomorrow's scheduled run will occur.
4. After **October 9 at 22:37 UTC**, inspect the first automatically scheduled watchdog run. It should have an actual Oct 9 EXIM `schedule` run ID and both genuine EXIM state/report artifacts, or **fail red** with a missing/degraded-day diagnosis. Also inspect the separate M2.2 companion run that should have triggered when EXIM completed. Do **not** rebaseline to make the alert green.
5. Continue actual Day-7/14/30 M2.2 evidence; M2.4's latest-seven-day check is complementary and not a substitute.

## Limitations

- Both timers are on GitHub Actions. If GitHub skips **both** cron events, this watchdog cannot alert by itself. An external independently hosted uptime probe is a later, separately authorized phase.
- UTC calendar-bucket attribution is based on GitHub's run creation timestamp, not on a publisher release time, queued-job start or the scanner's internal observedAt. A severely delayed cron can be counted on the following day and require human resolution.
- A healthy Actions conclusion and artifact names rely on the separate collector's health/no-window-gap gate, not an independent reread of private artifact bytes.
- Past seven-day windows are not retained permanently: 30-day receipt artifacts eventually expire, and Day-7/14/30 evidence remains under M2.2.
- No financial announcement is an approved source claim without independent human and legal/financial-document review.
