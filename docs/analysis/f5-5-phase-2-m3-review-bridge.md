# F5-5 Phase 2 — private M3/editorial review bridge

Engineering-only continuation of issue #114 after merged PRs #135 and #136. This phase does not establish independent source verification, approve records, change published seeds, or publish an Observatory.

## Integration

1. Recompute the Phase 0 drift from manually preserved exact source captures. The stable reviewKey survives equivalent retrieval retries; it remains a source-byte/metadata transition identity, never an industrial event ID.
2. Build and audit the **entire existing M3.2 source-review queue** through buildM3ReviewerPackets. Exact registered source IDs yield suggested project and finance references, the existing taxonomy gate, and that worksheet's own metadata fingerprint. These are candidate-only links: they do not adjudicate sponsor/subsidiary identity or imply anything happened.
3. Optionally validate the gitignored M1 private editorial ledger through parsePrivateEditorialLedger. Only exact citation-source-ID references can be linked. Existing editorial statuses remain unmodified and are not an F5 verdict.
4. Optionally include the Phase 1 hash-checked original-body diff. For a 404, timeout or blocked access, omit the diff and present the access event only.
5. Optionally attach a human **receipt acknowledgment** (not a source approval) tied to reviewKey and bridgeInputDigestSha256. The latter fingerprints matched M3 worksheet digests and private M1 link context; a stale context refuses an acknowledgment. No new reviewer authority or decision ledger is introduced.

## Maintainer-only offline use

Keep inputs and outputs on the local device, under existing gitignored .f5-drift/, .monitor-editorial/ and .project-execution-review/ directories, or another confirmed private local directory. Never upload private source bodies, editorial ledgers or reviewer notes to PRs, Actions logs, artifacts or public exports.

Example commands:

    npm run review:f5-bridge -- --check-runtime
    npm run review:f5-bridge -- --before .f5-drift/prior.json --after .f5-drift/current.json --source-id REGISTERED_SOURCE_ID
    npm run review:f5-bridge -- --before .f5-drift/prior.json --after .f5-drift/current.json --source-id REGISTERED_SOURCE_ID --before-body .f5-drift/prior.txt --after-body .f5-drift/current.txt --ledger .monitor-editorial/ledger.json --json

To acknowledge receipt, first inspect the private JSON output. A real reviewer may then create an untracked file .f5-drift/ack.json with exactly five fields: reviewKey (copy), bridgeInputDigestSha256 (copy), acknowledgedBy (real name), acknowledgedAt (actual UTC timestamp), and note (specific description of *receipt*, not an unsupported verification claim). Rerun the same command with --ack .f5-drift/ack.json. Acknowledgment cannot be self-generated, cannot change existing M3 verdicts, and is invalid for changed context. No output files are created.

## Human review remains exclusively in existing workflows

A reviewer must independently access full publisher originals, recheck statements, translations, identities, chronology, scope and financier attribution. For real physical milestones, use the original M3 review worksheet and the existing gitignored .project-execution-review/adjudications.json, checked with npm run audit:project-execution-adjudications. The taxonomy-blocked M3 cases stay blocked. For original M1 monitoring observations, use the existing private editorial inbox rather than mutating that ledger from F5.

Published event, source, project-milestone and financial histories remain untouched. A date a website was retrieved or revised is not a project occurrence day. A vanished source is not a positive development. Any subsequent seed/corpus publication needs a separate, specifically authorized maintainer phase.

## Verification and outstanding work

Synthetic regression tests cover the exact M3 entity reference, recorded input digest, stable retry identity, stale/wrong acknowledgments, optional private ledger links, held taxonomy, missing M3 match, 404 access-only receipts, deterministic CLI, and no-publication invariants. No simulated reviewer is a human source-review attestation.

Issue #114 is still open after this engineering step. Remaining blockers are real publisher access, manual source-version and entity adjudication, actual reviewer acknowledgments and M3 decisions, and separately authorized publication if the evidence warrants it. Open PRs #130/#132/#133/#134 and finance RFC #86 are independent.
