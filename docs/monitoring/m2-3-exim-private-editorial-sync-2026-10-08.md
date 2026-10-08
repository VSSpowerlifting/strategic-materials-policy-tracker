# M2.3 — EXIM review-only source observations into the private human editorial inbox

**Status:** implementation candidate, awaiting exact-head CI and maintainer approval. No personal/local private inbox has been modified by this PR, and EXIM releases remain unverified observations.

## Confirmed prerequisites

- EXIM first persisted baseline: [run #37800436243](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37800436243), 20 releases, `health=ok`, saved independent state and report artifacts.
- EXIM restored replay: [run #37801575996](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37801575996), verified recovery, 20 releases, zero new/revised, no gap; state and report re-archived.
- M2.2 reliability PR #87 merged at `feb77f0`, post-merge [CI #37804408191](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37804408191) green. Its independent read-only audit awaits real consecutive scheduled runs. This M2.3 phase does **not** alter that audit or claim 7/14/30-day maturity.

## Narrow data flow

```
EXIM official press releases (unchanged collector)
  -> independent GitHub Actions EXIM report/queue artifact (30-day retention)
  -> maintainer's local `npm run editorial:inbox -- sync-exim` (explicit only)
     -> verify all publisher-derived metadata, identities and report/queue agreement
     -> translate ONLY release listings into shared unverified inbox schema
     -> import into existing ignored `.monitor-editorial/inbox.json`
       using original source artifact-byte hash receipt and private backups
     -> named reviewer opens complete official source and records disposition
     -> candidate only if reviewer separately marks needs_verification
        and invokes start-candidate with --ack-source-read
```

**Important:** this is a local pull-only CLI, not a server-side integration or real-time inbox subscription. No GitHub write authorization is requested; `gh` must already be authenticated on the maintainer's machine.

## Exact operator steps after squash merge

From the SMPT repository on a trusted computer, with `gh` already authenticated:

```bash
git switch main
git pull --ff-only
npm ci
npm run editorial:inbox -- sync-exim --check-runtime
npm run editorial:inbox -- sync-exim --dry-run
npm run editorial:inbox -- sync-exim
npm run editorial:inbox -- list --status unreviewed
```

The dry run lists pending Actions metadata and **does not fetch report artifacts, write files or mark any news relevant**. The real sync processes completed, valid EXIM source runs oldest first, skipping previously imported run receipts. It starts at verified baseline run `37800436243`; the five earlier safely failed bootstrap experiments are outside this verified rollout. The first two valid runs had **zero** new/revised publications; they should produce receipts but no EXIM review items. Later source publications, if any, may create unreviewed items.

Run sync again to confirm previously imported runs are not duplicated. Revisions reopen previously disposed entries but retain their private decision audit. If an already-started candidate was linked, recheck it manually. Do not run `editorial:inbox -- import` on EXIM's raw artifact: the EXIM-specific adapter is required.

## Source integrity and separation

- Only `exim-shadow-monitor.yml` runs on `main` with `workflow_dispatch` or `schedule`, from the known first baseline, can be ingested. Incomplete runs are noted, later **red** runs block progress; rerun attempts require manual lineage reconciliation.
- Require the unexpired `smpt-exim-state-RUN-ATTEMPT` **and** `smpt-exim-report-RUN-ATTEMPT` artifacts before pulling report contents. The report artifact must contain both `editorial-review-queue.json` and `report.json`.
- Reject degraded/gapped state, non-200 publisher status, malformed dates, unsafe noncanonical hosts/paths, duplicate/changed observation identities, unexpected publisher title or date differences, and any imbalance between EXIM source `reviewOnly` and its queue. Publisher IDs must match SHA256 of the exact source ID + canonical URL. The verified body fingerprints in the report must be valid SHA256 digests, but this phase does not re-fetch and re-verify original full texts (source collector does).
- The normalized EXIM queue has empty `exactCitationSourceIds` and a `countMatchingCitations: 0` **because matching is deliberately *unassessed*, not because no duplicate SMPT policy event exists**. The human reviewer must compare existing events/financial rows independently.
- M1.3 ledger accepts EXIM identities for private storage but the preexisting generic manual `import` and M1-only `sync` **do not** accept EXIM rows. Only the EXIM validation adapter may use the dedicated origin policy. The candidate jurisdiction is explicitly `us`.
- Each original report/queue pair is hashed in a stable raw-byte receipt under its numeric run ID. Reimport of identical evidence is idempotent; different contents under the same run ID fail closed. The existing local backup logic preserves reviewer notes/audit before mutation.
- No publication, event classification, source lifecycle changes, financing totals, shadow collector, scheduling, GitHub artifact contents, M1 collection, Vercel, UI pages or public assets are altered. This PR does not promote releases into `data/seed`, create binding finance claims, automatically classify keywords, or approve candidates.

## Read-only limitations and next gate

- Private ledger is stored only on the maintainer's device, is Git-ignored but not encrypted by that mechanism, and requires an independent encrypted backup.
- GitHub Actions artifacts expire after 30 days; sync at least every few days. A failed prior run must be investigated and reconciled; no silent backfilling after artifact expiration. A later durable central editorial system would be a new scoped product phase.
- This source-integration gate is distinct from M2.2 reliability. The first scheduled-day observation is still unproven until the daily EXIM workflow actually fires and passes.
- Acceptance: exact-head validate/typecheck/lint/test/build; initial two EXIM receipt-only imports; second sync idempotent; real new/revised EXIM item requires human review before any candidate. **Do not claim a verified financial intervention from an EXIM announcement.**
