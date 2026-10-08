# M1.4 — Local read-only synchronization for the private editorial inbox

**Outcome:** One local command catches up the private M1.3 inbox from completed GitHub Actions source-monitoring runs. Manual downloading and unzipping each artifact is no longer required. It **does not** store editor notes in GitHub, automate candidate review, or make a cloud editorial dashboard.

## Install and prerequisites (Mac)

You must have a local SMPT checkout and an authenticated `gh` CLI. After M1.4 merges:

```bash
git switch main
git pull --ff-only
npm ci
gh --version
gh auth status
```

If `gh` is missing, install GitHub CLI (for example `brew install gh`) then run `gh auth login` with your GitHub account. The sync uses existing local GitHub CLI authentication; **never paste tokens into scripts or commit credentials**.

Run from the repository root:

```bash
# Check locally installed CLI startup without hitting GitHub or writing files:
npm run editorial:inbox -- sync --check-runtime

# Read-only plan; lists run counts but does not download, inspect artifacts or change local files:
npm run editorial:inbox -- sync --dry-run

# Pull and validate all completed, not-yet-imported eligible runs; save in the ignored ledger:
npm run editorial:inbox -- sync

# Show actual items requiring editor attention:
npm run editorial:inbox -- list --status unreviewed
```

The first full sync will preserve the manually imported [run 37724982482](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37724982482) and attempt to backfill other completed M1.1 queue runs (starting with [run 37722920588](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37722920588)). Those early runs found zero new or revised publications; a correct sync may add **zero review items while importing more run receipts**.

## Scope and safeguards

- Repository fixed to `VSSpowerlifting/strategic-materials-policy-tracker` and workflow fixed to `.github/workflows/source-monitor-pilot.yml` **main-branch scheduled/manual runs**. No other repository or workflow is fetched.
- The GitHub CLI executes only **read operations**: `gh api` for run/artifact listings and `gh run download` for an artifact. It does not make API edits, commits, issues, PRs, workflow dispatches, or uploads.
- Run coverage is paginated (100 per API page, capped at 1,500 listings; fail rather than silently omit). Runs prior to M1.1's first editorial queue (#37722920588) are out of scope because no review-queue artifact existed.
- Only a **completed-success** run may be ingested. Failed or cancelled completed runs that have not already been imported **block sync** and require manual inspection of the run health, any source gap and missing publications. In-flight runs are reported but not imported.
- Every pending run must have a unique, unexpired `smpt-source-pilot-RUN-ATTEMPT` artifact. The downloader obtains a temporary local copy of `editorial-review-queue.json` and `report.json`; temporary files are deleted. Missing/expired artifacts fail visibly rather than silently clearing the backlog.
- Report and queue must match on time and new/revised counts; both registered sources must have healthy responses with **no possible feed-window gaps**. Source-health failures stop import.
- Repeated imports respect M1.3's run-ID/content-hash ledger. Existing manually imported receipts are skipped; missing runs are processed **oldest first**. Each verified run is written to the private inbox with M1.3's atomic write and pre-write backup. A later failure leaves prior successfully imported runs preserved; rerunning sync resumes.
- A GitHub Actions **rerun attempt** (attempt number greater than 1) is not automatically reconciled because M1.3 keys imports only by the numeric run ID. It fails closed with a manual intervention message, rather than misidentifying two possibly different queue contents as one event.
- The private inbox remains `.monitor-editorial/inbox.json` and pre-write backups remain `.monitor-editorial/backups/`, ignored by Git. The maintainer must keep an **encrypted independent backup**. Git ignore is not encryption.
- This command is **local and on demand**. It does not run in GitHub Actions or automatically on your Mac, so you should run it periodically, ideally every few days and always **within the Actions artifact 30-day retention**. Expired unimported artifacts cannot be reconstructed by this tool.
- It does **not** evaluate primary-source facts, add policy events, alter financing totals, write `data/seed`, trigger publication, or update source lifecycle timestamps. Reviewed-source handoff stays explicitly human-gated through M1.3's `decide` and `start-candidate`.

## Acceptance after merge

1. Verify post-merge CI; run `npm run editorial:inbox -- sync --check-runtime` then `--dry-run`. The dry-run must show unimported source-monitor runs without modifying the ledger.
2. Run `npm run editorial:inbox -- sync`, confirm successful import receipts and `npm run editorial:inbox -- list`. The already imported manual run remains present, and earlier eligible queues should be backfilled once, not duplicated.
3. Run `sync` again. The previously ingested runs must be counted as already imported; **zero additional receipts and zero duplicate publications**.
4. Inspect remaining Day-7/14/30 source-monitor observations before claiming operational monitoring reliability. No live new-publication editorial decision or candidate is simulated here.
