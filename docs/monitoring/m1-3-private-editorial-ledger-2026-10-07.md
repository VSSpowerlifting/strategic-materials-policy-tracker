# M1.3 — Private, persistent editorial inbox and draft handoff

**Purpose:** A maintainer can preserve source-monitor observations and their human review decisions *beyond individual 30-day GitHub Actions artifacts*, without exposing internal research notes on the public website, repository, or monitor workflow.

**What this is:** an offline, local, Git-ignored ledger and a guarded command-line handoff to the project's existing private `data/candidates` workflow. **What it is not:** a hosted team review dashboard, an automatic cloud synchronization service, an auto-classifier, a policy-event creator, a verification engine, or a source archive. Daily M1.2 monitoring continues unchanged. No government sources, caches, published events, monetary figures, API routes or site pages are modified.

## Privacy and durability boundaries

- `.monitor-editorial/inbox.json` holds the persistent review ledger: per-source publication identity, first and last seen observation timestamps, listing metadata, a status, source change history, explicit reviewer notes and a timestamped disposition audit.
- `.monitor-editorial/backups/` holds local pre-write snapshots of the ledger and (for a draft handoff) `data/candidates/candidates.json`. Everything under `.monitor-editorial/` is **Git-ignored**. Real `data/candidates/candidates.json` is already ignored by the repository.
- Neither the monitoring workflow nor the public Next.js build imports or uploads these private documents. **The maintainer is responsible for keeping private files on an access-controlled device and including them in their own encrypted backups.** Git ignore does not encrypt files, and a machine without this directory has no saved human decision history.
- The incoming `editorial-review-queue.json` *is* the existing run-scoped public-official metadata from GitHub Actions. Download it **before its 30-day retention expires**. Observation import is manual; if you skip importing and the upstream artifacts expire, M1.3 cannot recover those old review observations. No claims of unattended cloud durability.

## Everyday commands

From the repository root, after checking out the merge of the M1.3 PR:

1. In **GitHub Actions → SMPT source-monitor pilot**, open the latest run, then download and unzip the `smpt-source-pilot-<run>-<attempt>` artifact. Locate `editorial-review-queue.json`. Inspect its health summary before proceeding. If a scan is degraded or a feed-window gap is flagged, separately investigate that coverage failure.
2. Import that exact artifact, using the matching numeric GitHub Actions run ID (replace the path and number):
   ```bash
   npm run editorial:inbox -- import ./editorial-review-queue.json --run-id 37724982482
   npm run editorial:inbox -- list
   npm run editorial:inbox -- list --status unreviewed
   ```
   The first import creates `.monitor-editorial/inbox.json`. Re-importing the same run and same bytes makes **no duplicate entries**; reusing a run ID with different bytes is an error. **You can import older runs later**; they will never overwrite a newer observed version. Initial baselines and quiet runs result in zero new items, correctly.
3. For a listed key `<watched-source-id>:<64-character-observation-hash>`, open the underlying complete official text yourself. Determine whether the source actually describes a relevant operative policy measure, rather than relying on the listing title or keyword hint. Compare the existing SMPT event records. Record your disposition, for example:
   ```bash
   npm run editorial:inbox -- decide '<source-id>:<observation-id>' investigating --by 'Editor Name' --reason 'Reading the full primary source and checking event overlap'
   npm run editorial:inbox -- decide '<source-id>:<observation-id>' already_covered --by 'Editor Name' --reason 'Same operative measure already appears in the published event register'
   npm run editorial:inbox -- decide '<source-id>:<observation-id>' out_of_scope --by 'Editor Name' --reason 'Source concerns a non-policy item unrelated to tracked materials'
   npm run editorial:inbox -- decide '<source-id>:<observation-id>' needs_verification --by 'Editor Name' --reason 'Possible new measure; authoritative text requires source verification'
   ```
   The mutable *current* status never deletes the disposition audit. A subsequent revised observation automatically reopens the item for review while retaining its prior decisions. It does **not** claim that the full legal text changed or that a policy event was amended.
4. **Only when a human has opened the full original source and deliberately marked the item `needs_verification`:**
   ```bash
   npm run editorial:inbox -- start-candidate '<source-id>:<observation-id>' cand-my-measure-2026 --by 'Editor Name' --ack-source-read
   ```
   The command creates a new record in ignored `data/candidates/candidates.json` with `status: draft`, `verification.verdict: pending`, `classification.confidence: low`, and `promotion.promoted: false`. It copies the listing title only as an **unverified working title**, assigns the jurisdiction from the registered Canada/US source identity, and includes open questions for the verifier. Leave `intakeMode` unset in the early draft: SMPT’s monitored-candidate validator requires `verificationStatus: verified` and evidenced official-publication/discovery lifecycle dates whenever that field is set. Add it only once verification and lifecycle are complete. It **does not** fabricate the issuing body, original instrument date, policy status, material scope, quotations or capital records. It never changes `data/seed`, issues a PR for a source measure, or touches `site.monitoringStartedAt`.
5. Continue with `data/candidates/README.md`: establish full source evidence, run verification and classification, complete necessary fields, and obtain explicit human approval before any promotion. Run `npm run validate` and the CI gates.

## Safety behavior and limits

- **One ledger item per watched source and publisher-native hashed observation ID**, not one per GitHub run. Repeated run IDs are idempotent; different content under the same run ID is refused.
- Invalid or corrupt private ledger files **fail closed**; the CLI never silently resets them. Every mutation saves a previous private copy first. If starting a candidate is interrupted between candidate write and ledger write, reconcile the candidate ID manually from the private candidate file/backup before retrying.
- Review states: `unreviewed`, `investigating`, `already_covered`, `out_of_scope`, `needs_verification`, `candidate_started`. The last is **not** directly assignable: only the guarded draft creation command may set it.
- Editor decisions require a named reviewer, UTC timestamp and meaningful explanation. Keyword hints and exact-URL citation matches are triage hints, not verified classifications or proof of policy effects.
- New review-queue imports can reopen previously reviewed items on publisher listing revision, while preserving the audit trail and any linked candidate identifier. If an already-started candidate is linked, manually inspect it for newly relevant changes.
- These are **local private operational files**, so they are not automatically shared between editors or computers. There is no authenticated shared storage or team concurrency mechanism. External sharing of private files is deliberately out of scope.
- This stage should not trigger the published source lifecycle `lastCheckedAt` or monitoring start date.

## Acceptance evidence

- Pure offline tests for idempotent run imports, duplicate/tampered artifacts, manual-review audit, stable identity across revised publications, out-of-order imported artifacts, invalid sources and genuine human-gated candidate creation.
- Exact-head repository validation, TypeScript, ESLint, full tests and build.
- **Operator acceptance after merge:** download an actual monitoring artifact, import it twice under the correct run ID, confirm a stable local private inbox and no leaked records. The recent two-source scans had zero new publications; those prove clean *empty* imports, not a real editorial decision. A source-backed new candidate requires a genuinely relevant publication and explicit human review.
