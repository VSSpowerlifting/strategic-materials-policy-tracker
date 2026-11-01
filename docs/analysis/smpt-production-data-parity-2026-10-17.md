# SMPT production public-data parity audit

**Manual, read-only operational check — no deployment, no monitor-state mutation, no Vercel API usage, and no publishing authority.**

## Actual failure mode this detects

October 17, 2026: PR #177 merged to `main` with the first human-reviewed Wagerup milestone added to the full downloadable JSON and the versioned project API. Exact-head PR CI, static builds, endpoint browser QA, and a Vercel PREVIEW passed. The `main` merge was real, but Vercel PRODUCTION still served a deployment from commit `22693a9` because the Free project's **100 deployments/day** quota had been exhausted. Green GitHub CI and a READY preview therefore did **not** prove the live site exposed the new JSON endpoints.

This tool independently compares **actual public production JSON** against the checked-out, committed `main` seed and export contract. It identifies a stale release instead of declaring production successful from a green build alone.

## Run only when useful

From a currently checked-out SMPT repository:

```sh
npm ci
npm run audit:production-parity -- --origin https://strategic-materials-policy-tracker.vercel.app/
```

Or use GitHub **Actions → Public data release parity (manual, read-only) → Run workflow**. The workflow is `workflow_dispatch` **only**: no schedule, cron, automated PR-triggered runs or notifications. It uses a public HTTPS GET against the site, not deployment APIs, tokens, Vercel builds, or billing changes.

The script compares:

1. `/api/v1/project-milestones` against the **whole approved public native milestone array** (the Wagerup `groundbreaking_reported` record now; signed-only future additions as they are genuinely released).
2. `/api/export/dataset.json` against the **entire canonical full public dataset**, including the curated corpus revision, source/financial/policy rows, counts and reviewed milestones. It does not rely on mere counts or assume that a static Next.js route exists because code compiled.
3. Every project ID with a published native milestone at `/api/v1/projects/<id>`. Checks its separately labeled native claims, registered original-source references, and preservation of the legacy financing-lane response fields.

This is **data-content parity**, not evidence that source documents were fetched on the current day, or that finance support caused a physical outcome.

## Interpreting results

- `IN_SYNC` (exit 0): exact public JSON data parity for the checked-out repository and stated production origin.
- `STALE_OR_MISMATCHED` (exit 1): a route is missing (e.g. stale 404), public JSON mismatches the committed corpus, reviewed source metadata drifted, or a project response dropped existing financing structure.
- `UNREACHABLE` (exit 2): a network request failed or a public endpoint returned invalid JSON. This is not evidence of a stale deployment; investigate network/server availability independently.

Never convert an HTTP 404 into a successful source review, financial event or new public claim. False negatives are possible if an unrelated deployment serves identical public JSON; **the script does NOT verify the actual Vercel commit SHA**. Exact production-SHA proof still requires independently checking the Vercel deployment metadata and that its aliases point at the intended production build. If the data checks pass but SHA metadata is unavailable, state only that data parity was verified, not that the exact commit was deployed.

## Security / independence

Uses **only public HTTPS GETs** with a 12-second per-request timeout and no credentials. Rejects URL credentials, non-HTTPS origins, paths, queries, cross-origin requests and unrelated non-API paths. Nothing is written to tracked seeds, private M3/F5 reviewer ledgers, Github repository state, deployment state, monitoring baselines or public routes. F5 `/pathways` remains a separate release authority.

The audit intentionally is **not a required pull-request CI check** while production is stale or Vercel is rate-limited: current code can be correct even when a previously merged release has not deployed. Run it **after the new production deployment** to validate the actual data readers receive. Failed parity is an operational follow-up, not an excuse to backdate sources, override human source review or bypass plan limits.

## Tests

`tests/production-release-parity.test.ts` compares exact fixture payloads, stale pre-API 404 and previous JSON snapshot, mismatched primary-source metadata, network failure, HTML/invalid JSON, and HTTPS-only same-origin restrictions. It never makes a live Vercel API or website request during routine CI.
