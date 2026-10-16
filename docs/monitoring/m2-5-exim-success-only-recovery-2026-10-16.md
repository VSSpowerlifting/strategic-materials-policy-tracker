# M2.5 — EXIM shadow state recovery admission: successful run and paired evidence

**2026-10-16 — operations continuity hardening, not a new source or finance publication.**

## Real operating state examined

- [EXIM scheduled collection 38943546778](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38943546778) completed successfully October 16, 2026, and produced both unexpired, nonempty, same-attempt `smpt-exim-state-38943546778-1` and `smpt-exim-report-38943546778-1` artifacts. The retrieved metadata associates both with the same original `workflow_run.id`, branch `main`, and exact head SHA. The [separate EXIM reliability evidence 38943616585](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38943616585) was also green. [M1 source-monitor pilot 38940056374](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38940056374) is separately green and **must remain an independent monitoring stream**.
- The older [EXIM collection 38783596607](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38783596607) likewise has a matched state/report artifact pair from attempt 1. This shows the intended independent recovery chain exists today; **no bootstrap or reset is needed**.

## Identified continuity vulnerability

Previously, `.github/workflows/exim-shadow-monitor.yml` enumerated up to 70 preceding runs and picked the most recent with `run.status === 'completed'` plus a nonexpired EXIM state artifact. But the same workflow uploads restored `.monitor-exim/state.json` under `if: always()`, including when **collection or verification fails**. A failed run may therefore contain an otherwise well-formed copy of an older approved state. The old selector could elevate that **failed run's artifact** as the next recovery provenance even if its own article fetch, source integrity, window continuity, report or verification gate had failed.

The current scanner refuses to advance state on degradation, so this is primarily a **provenance and run-admission failure**, not proof that corrupted finance data or a false milestone was published. State selection must still fail closed: a prior workflow *attempt* is authoritative only if the full run and the required report/state proof succeeded.

## Engineering change

The recovery step now accepts a candidate only if all are true:

1. The candidate is **not the running job**, is `completed`, has `conclusion === 'success'`, ran on `main` and was actually a scheduled or manually dispatched **EXIM** run. A PR event, cancelled job, stale in-progress job and `workflow_run` event do not qualify.
2. Its `run_attempt` is a positive safe integer. The artifacts must match **that same run ID and exact attempt**, not a previous attempt or a different run.
3. Exactly **one unexpired nonempty state artifact** and **one unexpired nonempty report artifact** must exist, and each artifact's embedded `workflow_run.id` must equal the candidate. A partial, zero-byte, expired, mismatched, or duplicate artifact is not enough.
4. Candidates with incomplete pairs are logged as warnings and skipped; the scanner can recover from an older successful, complete pair within the existing 70-run bounded window. If none exists, it leaves restore outputs unset. The downstream existing `monitor:exim` command **fails red rather than silently bootstrapping**.

The `if: always()` uploads remain useful to diagnose failed collections, but no longer confer state-recovery authority. The 30-day retention, `contents: read` / `actions: read` permissions, daily EXIM schedule `14:07 UTC`, separate EXIM watchdog and EXIM editorial/finance distinction remain unchanged. No data/seed, finance history, state-schema, new source, private review, M1 publication, routes or exports changed.

## Exact-code acceptance

`tests/exim-state-recovery-admission.test.ts` extracts the **actual embedded GitHub Actions JavaScript** from the workflow YAML and evaluates it against an isolated mocked Actions API without network access or tokens. Cases include clean latest acceptance, a failed run with a complete copied state/report pair, skipped cancelled/PR/nonmain/current runs, mismatched attempt and embedded run ID, duplicate artifacts, zero-byte/expired artifacts, older-success fallback and no-valid-pair red behavior. This is more reliable than testing a rewritten selector that could diverge from the workflow itself.

Test with exact-head `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Because this change modifies the daily **production EXIM workflow**, merge only with complete exact-head CI. Do not manually bootstrap/rebaseline EXIM on merge; inspect the next actual scheduled run and subsequent EXIM reliability and missing-schedule watchdog receipts. A successful CI proves test coverage, **not a later successful cron execution**.

Unrelated open PRs #86, #130, #132, #133, #134 remain untouched.
