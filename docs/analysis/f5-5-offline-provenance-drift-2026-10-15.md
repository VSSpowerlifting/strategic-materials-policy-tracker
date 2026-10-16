# F5-5 / Phase 0 — offline, nonpromoting source-drift review receipts

**October 15, 2026 · prepublication support for #114. Not a scheduled collector, registered milestone, physical-outcome verification or public release.**

## Problem and explicit boundary

A primary-source link can change because of a grant amendment, corrected release, changed target, updated filing metadata, CMS template update, provider outage or a vanished document. Those events are *not equivalent*. The F5 Observatory cannot silently treat a new byte digest, 404, recovered URL, or amended publication day as an industrial milestone, a disbursement, a contractual amendment or a verified policy event.

This phase deliberately **does not depend on F5-3 public casefiles**, which remain blocked by unapproved physical claims. It provides a small reusable, maintainer-operated audit contract. The existing M1/EXIM/DOE monitors and M3 private reviewer system remain untouched.

## Files and operation

- lib/f5-source-drift.ts: pure deterministic comparator. Inputs are manually preserved snapshots and the existing published source registry. It validates stable source ID, exact registered HTTPS URL, SHA-256 digest, retrieval/publication clocks, health and HTTP status. No random IDs, clock reads, mutation or network.
- scripts/audit-f5-source-drift.ts: read-only local CLI. Takes explicitly supplied private JSON files, checks the bounded size, returns human-readable or JSON receipt. No default fetches or scanning.
- tests/f5-source-drift.test.ts: synthetic cases for baseline, byte changes, metadata-only corrections, disappearance, timeout, recovery, duplicates, idempotent retries, unscanned records, timestamp conflicts, bad URLs and no production writes.
- .f5-drift/ is ignored so a maintainer may store source captures or receipts there without committing them.

### Local manual dry run

Create **two distinct private files**, each a JSON array of source captures. Use a *registered* sourceId and exactly its registered HTTPS URL from data/seed/sources.json. Example schema with **placeholder IDs and hashes only** (not a claim about a real source):

    [
      {
        "sourceId": "src-registered-example",
        "url": "https://issuer.example.org/registered-original",
        "retrievedAt": "2026-10-15T20:00:00Z",
        "health": "ok",
        "httpStatus": 200,
        "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "publicationDate": null
      }
    ]

For failures, use health of not_found, blocked, timeout, or error, with sha256: null and publicationDate: null; explicit not_found requires HTTP 404 or 410. Never fabricate a failed HTTP result from a missing scan.

    npm run audit:f5-drift -- --check-runtime
    npm run audit:f5-drift -- --before .f5-drift/prior.json --after .f5-drift/current.json
    npm run audit:f5-drift -- --before .f5-drift/prior.json --after .f5-drift/current.json --json

The CLI **reads only**. It does not write the current snapshot back as the new baseline; a human must preserve the actual checked original and decide whether to adopt a new observation. Capture collection and page-body preservation are external, manual and not implemented here. Invalid source identity, status, digest, timestamps or out-of-order conflicting observations fail closed.

### Audit semantics

| Observation | Output | May infer new event? |
| --- | --- | --- |
| No prior capture | baseline_only | No |
| Identical digest/publication metadata | unchanged | No |
| SHA-256 or publication date changed | content_or_metadata_revised | No; human reads original and compares claims |
| Actual 404 or 410 after previous capture | source_unavailable | No; find source backup or official alternate |
| Blocked, timeout or parsing/network error | retrieval_degraded | No; separate outage from source revision |
| Valid source reappears after 404/410 | source_restored | No; human checks restored content |
| Successful capture after degraded retrieval | retrieval_recovered | No; human examines changes |
| Earlier source omitted from current scan | not_scanned | No; **not** an observed disappearance |

A review key is SHA-256 over source identity, disposition and prior/current evidence signatures, excluding the **retrieval time**. Replays of the same transition produce the same key, not duplicate cases. A changed publication date alone is reviewed as **metadata**, not substituted for an unknown industrial occurrence date. Multi-field changes to one source produce **one** review case.

The output carries publisher, exact URL, previous/current health, HTTP status, hashes, stated publication day and observed retrieval clocks. It intentionally carries **no** editable finance status, inferred industrial stage, proposed event date, project attribution, approver name or signed review verdict. Every positive change remains unreviewed and publicSeedChangeAuthorized: false.

## Coverage against #114 regression scenarios

**Detectable without claiming semantic knowledge:** source revised bytes (including possible grant amendments, a newly visible signed agreement or a revised commissioning target), publication-day metadata correction, explicit disappearance, restoration, access outage, same-source retries and duplicate input rows.

**Not inferable from checksums alone:** that changed bytes represent an actual grant amendment, a second financier's independent construction milestone, recipient-versus-subsidiary identity, a legally executed contract, changed disbursement, or a real commissioning date. Those require full original-source inspection, candidate entity linking and existing M3/M1 reviewer adjudication. No automatic source URL fetching, PDF scraping, semantic diff or LLM claim extraction is introduced.

## Next independent engineering phase (after this PR's CI)

1. Design the **private** source-claim side-by-side comparison format using preserved original paragraphs, *not* just hashes. Add reviewer acknowledgments with date, source version and identity, never synthetic approvals.
2. Wire **explicitly reviewed** source IDs and entity-link candidates into the existing local M3/editorial queue without creating a second publication authority or leaking drafts to API, search, CSV, Pages or the public Observatory.
3. Only after an approved F5-3 casefile exists, add controlled drift-initiated follow-up checks, manual dry-run receipts and QA. Scheduling any monitor remains a separate deliberate decision.

**Release constraints:** no modifications to data/seed/, site.lastUpdated, casefile routes, financial amount/status histories, policy controls, production build output or existing collectors. The successful CI result is **engineering validation only**, not source review, adjudication or public-launch authorization.
