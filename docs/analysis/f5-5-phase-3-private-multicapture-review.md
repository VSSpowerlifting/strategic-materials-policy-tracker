# F5-5 Phase 3 — private multi-capture editorial reconciliation

**Engineering continuation of issue #114.** Depends on the merged offline drift receipts (#135), private source-version diff (#136), and original M3/M1 reviewer bridge (#137). This implements a deterministic, maintainer-operated multi-source worklist: it is **not** live monitoring, source authentication, editorial fact approval, private-state persistence, or publication. No new public routes, exports, seed records, financial history, collectors, scheduled workflows, or M3 decision authorities.

## Why a multi-capture review batch

One-off source diffs were reproducible but did not answer three operational questions: *Which observations are genuinely new after repeated retrieval attempts? Are omissions really outages? Which existing M3 work is implicated by multiple source changes without counting the same groundbreaking three times?* This phase uses the verified Phase 0/1/2 primitives rather than inventing a new reviewer system.

The engine audits all snapshots against registered SMPT source IDs and **exact official HTTPS URLs**, preserving each original retrieval clock, publication date, HTTP disposition and SHA-256. Every adjacent snapshot is compared with the existing drift auditor. Absence from a snapshot is **not scanned**, not 404, not failure to fund, and not an industrial event. A new source introduced without a prior capture is baseline-only, never an asserted amendment. Out-of-order or same-time contradictory captures fail closed.

### Stable identity, no duplicate approvals

The Phase 0 reviewKey is unchanged. Equivalent capture retries share one review identity. The batch reports every transition in chronological coverage and deduplicates repeated review-worthy transitions even when the previous version returns later (A → B → A → B). There are **two distinct digests** with deliberately narrow meanings:

- **reviewKey**: identity of a specific observed original-source transition; does not certify source authenticity.
- **bridgeInputDigestSha256**: fingerprint of the existing exact M3 reviewer worksheet digests and relevant optional private M1 ledger cross-references. An acknowledgment cannot be reused if its context changes.
- **reviewSetDigestSha256**: a stable digest of the unique batch review set, independent of repeated unchanged captures. This is **not** a source-body digest or a reviewer signature.

The output still distinguishes total review transitions observed, unique review cases, repeated transitions removed, not-scanned coverage, missing text pairs, access-only review cases, and private receipt acknowledgments. None of these is a public timeliness or project-completion metric.

## Source and entity reconciliation

Each review case passes through the existing **buildF5PrivateReviewerBridge** with the full M3 reviewer packet report. Project and existing finance IDs arise only from exact registered source-ID matches. A source that lacks a known M3 match remains **unlinked pending identity review**. No fuzzy matching of subsidiary, sponsor, financier, project, URL headline or country can fabricate an identity.

A project cluster groups source review keys, distinct registered source IDs, M3 candidate IDs and deduplicated legacy finance references. **A cluster is not an industrial event or financing total**. Alcoa's three preexisting finance-linked citations to the same grounding statement still generate one source transition and one potential physical occurrence for separate original-source adjudication. M3 taxonomy holds (including Stibnite early works and INL prototypes) are preserved, not bypassed.

The optional existing M1 private ledger is read and validated, with only the already registered exact citation-source references shown. Its recorded status, run IDs, history and candidate decisions are never changed.

## Maintainer workflow: no network and no writes

All real inputs are private local files. Use the existing gitignored .f5-drift/ folder for snapshot history, source bodies and receipt acknowledgments. Preserve M1 editorial decisions only in .monitor-editorial/ and M3 adjudications only in .project-execution-review/. **Never paste private evidence or reviewer names/notes into a public issue, workflow log, CI artifact, application source, route, published export, or pull-request diff.**

1. Independently capture originals with a real UTC retrieval time, HTTP health/status, publisher URL and source-body SHA-256. Do **not** invent successful captures for inaccessible originals. PDF or binary bodies are outside the Phase 1 UTF-8 paragraph diff; investigate them manually.
2. Assemble an explicitly ordered local .f5-drift/sequence.json. Every snapshot is a bounded array of registered source captures. Example structure (synthetic placeholder fields; replace with accurate locally captured values only):

    {
      "schemaVersion": "f5-5-private-capture-sequence-1",
      "snapshots": [
        {"label": "first-pass", "captures": [{"sourceId": "REGISTERED_SOURCE_ID", "url": "https://publisher.example/source", "retrievedAt": "2026-10-12T10:00:00Z", "health": "ok", "httpStatus": 200, "sha256": "64_REAL_HEX_DIGITS", "publicationDate": null}]},
        {"label": "follow-up", "captures": [{"sourceId": "REGISTERED_SOURCE_ID", "url": "https://publisher.example/source", "retrievedAt": "2026-10-13T10:00:00Z", "health": "not_found", "httpStatus": 404, "sha256": null, "publicationDate": null}]}
      ]
    }

   This shape documents the contract, **not a validated or live publisher receipt**. The actual source URL must match registered SMPT metadata; hashes must be exactly 64 lowercase hex characters for a successful retrieval.

3. Run the batch locally:

    npm run review:f5-batch -- --check-runtime
    npm run review:f5-batch -- --sequence .f5-drift/sequence.json
    npm run review:f5-batch -- --sequence .f5-drift/sequence.json --json

4. To attach hash-verified source body comparisons, save a PRIVATE .f5-drift/body-paths.json of this shape, plus two distinct UTF-8 local text files per reviewKey:

    {
      "schemaVersion": "f5-5-private-body-paths-1",
      "entries": [{"reviewKey": "REAL_64_HEX_REVIEW_KEY", "beforePath": "prior.txt", "afterPath": "current.txt"}]
    }

   Both body paths are relative to the manifest's own directory; no absolute paths, parent traversal, symlinks, repeated files, or files reused as input manifests. Each body must remain below 128 KB, with the existing paragraph limits. The recorded SHA-256 must exactly match the respective input's **actual UTF-8 bytes**.

    npm run review:f5-batch -- --sequence .f5-drift/sequence.json --bodies .f5-drift/body-paths.json --require-content-diffs --json

   If the strict flag is set, any changed content lacking both local bodies fails closed rather than declaring the batch ready. Metadata-only corrections and source outages never need a fabricated content diff. The optional text diff does not prove the original publisher served the supplied bytes.

5. Optional private M1 ledger and acknowledgment:

    npm run review:f5-batch -- --sequence .f5-drift/sequence.json --ledger .monitor-editorial/ledger.json --json
    npm run review:f5-batch -- --sequence .f5-drift/sequence.json --ack .f5-drift/acknowledgments.json --json

   The acknowledgment file, if used, is an array of the **existing Phase 2 five-field records**: reviewKey, bridgeInputDigestSha256, acknowledgedBy, acknowledgedAt, note. A real human creates it manually after seeing a packet. The batch refuses duplicate, orphan, stale, backdated or extra-field acknowledgments. **Receiving a packet is not verification or approval.**

### Deliberate hard stops

- Invalid original source URL, wrong source registry ID, malformed capture SHA/HTTP status/date, repeated label, stale clock, or contradictory same-time evidence.
- Duplicate or orphan body pairs; access-only observations incorrectly supplied as new source text; body hash mismatch or paragraph bounds exceeded.
- Unknown/duplicate receipt acknowledgment, invented approval field, or context digest mismatch.
- Attempted approval, promotion, seed write or publication CLI flags.
- Attempted body-path escape, symlink, oversized content, or input-file alias.
- Silent conflation of multiple finance instruments into one newly disbursed payment; no financing quantities are aggregated here.

## Genuine work still needed before F5-5 acceptance

1. Real independently accessible original publisher versions and exact passage differences, with source authenticity documented outside this synthetic engineering phase.
2. A human adjudicator must resolve source identity, project/facility scope, publisher versus sponsor/subsidiary, date boundaries, linked financing provenance and actual industrial milestones. A changed grant amount or commissioning target is only a **review lead**.
3. Use the original M3 packets and .project-execution-review/adjudications.json for any physical outcome. Existing taxonomy holds and human signoff remain mandatory.
4. If real facts merit changes, prepare a **separately authorized** source/finance/milestone/corpus PR. Public seeds, route/export/search isolation, historical finance semantics and monitoring schedules do not change under Phase 3.
5. Monitor integration is explicitly last and requires separate authorization; this PR does not add a crawler, scheduled review, network request or reviewer record persistence.

## Verification

The synthetic suite exercises: capture order conflicts, exact-source integrity, A→B→A→B deduplication, unchanged retries, multiple materials/projects, Alcoa's three finance references, publisher 404/410 and recovery, blocked source, unscanned schedule gap, metadata-only clock revision, changed content without bodies, unknown or stale acknowledgment, unresolved identity, optional body manifest containment, deterministic offline CLI and unchanged public milestones and financing records.

The suite is **engineering verification, not original-source review**. The usual exact-head CI and isolated unpublished Chromium checks must pass before merge. No actual new industrial event is asserted or published by these tests.
