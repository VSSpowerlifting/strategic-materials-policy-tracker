# F5-1e: M3 original-source human-review workbench

**Internal engineering phase only.** Reviewed evidence is still not in the public project-milestone register. Packet production does **not** fetch, copy, authenticate, attest, or approve external publications.

## Why this exists

SMPT has seven canonical M3 source-review candidates, including Alcoa Wagerup, Neo Narva, Stibnite early works and later Burntlog access infrastructure, funded Kingston extended operations, the Army INL demonstration, and Thompson Falls Q2 construction-progress reporting. Five have canonical types but still lack true source adjudication; two remain explicitly blocked on taxonomy. The candidate queue is intentionally separate from the public `data/seed/project-milestones.json`, which remains empty. A private human reviewer must be able to inspect the original issuer document, not infer an approved project state from a finance-row implementation note.

## Usage from the local repository

```sh
npm run review:m3-packets
npm run review:m3-packets -- --id review-m3-2-neo-narva-magnets
npm run review:m3-packets -- --json
npm run review:m3-packets -- --id review-m3-2-stibnite-early-works --json

# Optional, PRIVATE artifact on the maintainer machine (directory is gitignored):
mkdir -p .project-execution-review
npm run review:m3-packets > .project-execution-review/reviewer-worksheets.md
```

By default, output is printed to standard output. The CLI writes **no files**, invokes no model, makes **no source downloads or remote requests**, and never imports from `app/` or public data exports. Do not commit generated packets, actual reviewer notes, or human decisions. The existing `.project-execution-review/` gitignore rule protects local work from accidental ordinary staging, but each maintainer is still responsible for handling confidential drafts carefully.

## What a packet contains

- Canonical M3 review ID, proposed project identity and precise source URL/title/publisher/language, with original publication and existing registry access dates **kept separate**.
- Proposed kind, scope, original-language claim and translation basis, source pinpoint, exact occurred/target date or explicit **unknown**, relevant financing-row observations (context only), original editorial caveats, and unresolved taxonomy question where applicable.
- Five **unchecked** independent human review questions: full original document and quote, facility/funded scope, separate chronology and evidence clocks, occurred-vs-target and translation, and the explicit absence of funding-to-outcome causality.
- Deterministic SHA-256 digest of the canonical candidate row plus registered source/project metadata and cited finance-status observation context. The hash is a **metadata fingerprint**, not an archival checksum of the original HTML/PDF; it cannot establish authenticity, unchanged publisher content, completion or reviewer identity.
- `publicationAuthorized:false`, `automaticSourceApprovalAuthorized:false`, and `humanAttestationPresent:false` on every candidate, regardless of whether all five checks are later ticked in a private file.

The implementation audits the **whole** M3 queue before selecting a single review, so an invalid unrelated record cannot be hidden with `--id`. The original queue's sorting, valid primary sources, dates, finance links and taxonomy gates remain enforced. Unknown/duplicate or misleading flags such as `--publish` and `--approve` exit with usage error. Markdown source values are escaped and source URLs are limited to HTTP(S) without embedded credentials.

## Human editorial and eventual release gate

1. The **real reviewer** opens the complete original source using the provided URL and confirms the actual passage, pinpoint, project component, evidence date and corporate-finance distinctions. Where the publisher reports operations, mark it as a **publisher assertion**, not independently inspected physical output.
2. Record each actual reviewer verdict, decision date, checklist and reason in a **locally held** `.project-execution-review/adjudications.json` created from `research/project-execution/m3-2-adjudications.example.json`, following the original M3 adjudication workflow. Keep blocked taxonomy entries pending until a separate taxonomy decision. A source-review packet and a synthetic regression-test reviewer are **never** signatures.
3. Run `npm run audit:project-execution-adjudications` to inspect the **nonpublishing** proposal report. The audit rejects review dates after the current curated corpus cutoff `site.lastUpdated` unless a later genuine corpus revision is separately authorized; never backdate.
4. Human/maintainer approval, separately checked source identity, full seeded validation, and a distinct `data/seed/project-milestones.json` PR are mandatory before publishing anything into F5-3 casefiles. No packet emits public seed updates, source attestations or a release flag.

## Verification and non-goals

Tests confirm seven packets; five human-review candidates and two taxonomy holds; unchanged public milestone count; correct Narva/Thompson Falls date boundaries; unresolved Burntlog kind; deterministic input fingerprints; fail-closed altered sources and malformed queue/CLI flags; and **no writes**. Full CI: production dependencies, data validation, typecheck, lint, tests and build.

No change to financing, source registry, policy records, the last-curated date, public project display, source monitor, EXIM/DOE jobs, or finance-as-of functionality. The deliverable is a tool to facilitate genuine offline adjudication—**not** a substitute for it.
