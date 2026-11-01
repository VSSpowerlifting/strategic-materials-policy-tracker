# F5-1 release rehearsal — first human-reviewed industrial milestone

**October 17, 2026 · engineering-only / internal maintainer phase.** Issue [#110](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/110), predecessor to the public casefiles in [#112](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/112).

## Why this is the next critical step

The production corpus revision remains **2026-10-09** and `data/seed/project-milestones.json` contains **zero approved milestone records**. The existing M3 queue and adjudicator already require full source review, five affirmative human checks, a named reviewer, rationale, exact metadata digest, genuine decision date, and source-specific eligibility. In normal operation, a decision made *after* the currently public corpus cutoff is correctly refused.

To prepare a real future seed PR without prematurely editing `site.lastUpdated`, this phase adds a **prospective cutoff dry-run**. The same canonical M3 metadata digest is computed at the *explicitly proposed* publication cutoff, and existing source-reviewed decisions are tested against that exact digest. This avoids an unsafe shortcut: backdating a real review to the obsolete 2026-10-09 date or automatically reusing an older checksum.

It adds **no alternative authority**: all approvals remain in the gitignored existing M3 adjudication ledger, and source facts are never authenticated by the tool. The following commands are for the maintainer's actual local checkout, not a CI approval mechanism.

## A. Generate a prospective original-source review worksheet

```sh
npm ci
npm run review:f5-prospective-worksheets -- --proposed-cutoff 2026-10-17 --id review-m3-2-alcoa-wagerup
npm run review:f5-prospective-worksheets -- --proposed-cutoff 2026-10-17 --id review-m3-2-alcoa-wagerup --json
```

Replace the example proposed date with the legitimate intended corpus publication revision; do not backdate a review. A changed prospective cutoff **changes the worksheet SHA-256**, so an earlier completed review needs an independent reconsideration and manual re-attestation against the actual packet. The CLI always audits the entire queue before filtering by ID.

**Wagerup original document:** [Alcoa, Australia/Japan/U.S. groundbreaking, published August 24, 2026](https://news.alcoa.com/press-releases/press-release-details/2026/Australia-Japan-the-United-States-and-Alcoa-Break-Ground-on-Gallium-Project-in-Western-Australia/default.aspx). The issuer describes a ceremony marking the beginning of *construction of the new gallium facility at Wagerup*, **not commissioning, production or an independently observed start of continuous building work**. Exact current M3 identity: `review-m3-2-alcoa-wagerup`; primary source `src-alcoa-wagerup-groundbreaking-2026`; project `prj-au-alcoa-sojitz-gallium`; proposed kind `groundbreaking_reported`, scope `named_facility`, reported day `2026-08-24` (classification updated 2026-10-17 following an editorial preference for the ceremony-level claim, not yet a signed source review); three finance-row citation uses concern the *same* physical reported event. The full original includes forward-looking qualifications: targeted future production cannot be treated as delivered output.

**Research integrity:** This page summarizes a publisher source examined during engineering, not a real M3 human signoff or publisher-body SHA capture. The registered `dateAccessed` is preserved; no backdated access receipt is created. The original-source assertion remains **issuer-reported** until independently verified by the actual reviewer. A reviewer should confirm the exact short anchor, scope, dates, speaker, and caveats against the complete original document before making a decision.

## B. Actual human decision in the existing gitignored ledger

```sh
mkdir -p .project-execution-review
cp research/project-execution/m3-2-adjudications.example.json .project-execution-review/adjudications.json
```

Only do the copy when creating an initial local ledger; **never overwrite existing real decisions**. The true reviewer reads the original source, decides `approved`, `rejected` or `needs_more_evidence`, records the actual date, name, substantive rationale and five personally verified checks, and manually transfers the **current prospective-cutoff** `reviewInputDigestSha256`. Keep every unrelated item pending; blocked taxonomy entries remain pending. Do not put real reviewer files in Git, CI artifacts, GitHub issue text or a model prompt.

A separate maintainer later decides whether the source-limited wording is appropriate for the public corpus. No approval is manufactured by the assistant or by this tooling.

## C. Rehearse the F5 casefile readiness change WITHOUT writing data

```sh
npm run review:f5-release -- --proposed-cutoff 2026-10-17 --json
# Explicit alternate local file for a permitted maintainer-owned review:
npm run review:f5-release -- --proposed-cutoff 2026-10-17 --file .project-execution-review/adjudications.json
```

The tool invokes the existing M3 adjudicator with the **same proposed cutoff**, checks original queue provenance and digest against the human file, and validates the union of existing public milestones plus any structurally eligible proposals. It then invokes the existing **F5 pilot casefile-readiness gate** both before and after staging. It reports counts, project IDs and blockers only—**no human reviewer name, rationale or private original-source notes**. Output has constant `publicationAuthorized: false`, `candidateSeedWritesAuthorized: false`, and `completeOriginalSourceVerificationProven: false`.

A valid all-pending example produces zero new milestones and no pilot suddenly ready. A real candidate that passes checks advances **only** a structural eligibility flag for *additional manual casefile/source/Chromium QA*. It does not approve seed writing, public routes, monitoring or publication. An invalid or taxonomy-blocked decision fails closed; a stale digest cannot be recycled.

## D. Independent public release is a future separate PR

1. Genuine editorial source review of Wagerup; optionally Narva, then Thompson Falls. For Stibnite early works and Burntlog infrastructure, preserve the existing taxonomy/scope hold until a separately adjudicated decision.
2. A distinct maintainer-authorized source-reviewed `data/seed/project-milestones.json` PR and a **deliberate** update of `site.lastUpdated`, with statement pinpoint and full original-source audit.
3. Run full `validate`, `typecheck`, `lint`, `test`, `build`, M3 and F5 audits at the exact code SHA, and an independent QA review. Existing policy/finance rows and links may not be silently rewritten to make a milestone pass.
4. Only then implement the public F5-3 `/pathways` casefiles from the existing `lib/project-evidence-pathway.ts`; retain finance and physical claims in separate lanes and show genuinely unknown states.

**Not permitted:** forged reviewer, autonomous signoff, a public test-fixture claim, source-material revision as a side effect, independent-physical-inspection claims, historic-as-of physical reconstructions, additive multi-provider capital totals, attribution/causality, or publishing a private reviewer packet through a public route. Do not use a metadata checksum as proof of original publisher-body authenticity.

## Invariants tested

- Entire existing canonical M3 queue is validated before selective worksheet generation.
- Current unsigned ledger does not create a milestone or ready casefile; source/project/finance records are not mutated.
- Synthetic in-memory approval of Wagerup shows only **structural** progress to manual QA, never release authorization.
- Changing the cutoff invalidates earlier reviewer digests; corrupt decisions fail the entire staged projection.
- Attempting to approve a taxonomy-held case never makes a candidate eligible even with all booleans true.
- CLI has **no writing**, signing, network-fetch, public route/export or publication flag.
