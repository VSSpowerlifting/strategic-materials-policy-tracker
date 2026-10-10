# F5 — Fail-closed pilot casefile readiness gate (October 9, 2026)

Parent: [F5 epic #108](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/108). Supports [F5-1 #110](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/110) evidence review and [F5-3 #112](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/112) UI; does **not** publish F5-3 or change any seed.

## Why this is needed

The F5-2 project graph can inspect recorded finance/legal evidence while the currently published `project-milestones.json` contains zero entries. Finance-row reports that construction/production began are **not** the same as project-scoped, independent project-native assertions. A public casefile must not label a source-rich financing path as independently verified physical progress.

## Implementation

- `auditF5CasefileReadiness(input, corpusDate, projectIds?)` composes the existing strict milestone contract with the F5-2 typed project-pathway audit.
- It checks three named pilot projects: Alcoa–Sojitz gallium, Neo/NPM Narva magnet project, and Stibnite/Perpetua.
- An individual pilot becomes *eligible for additional manual casefile QA* only when it has **at least one** structurally valid, registered, occurred (not merely planned), scoped project-native milestone; every registered occurred milestone has a nonblank source pinpoint; and project identity has source evidence.
- Planned targets never satisfy occurred status. Unreviewed financier implementation notes remain counted **only as legacy observations**; direct finance and nonallocative association remain distinct counts. The report excludes all amounts and provides no policy-impact or production-readiness measure.
- A malformed milestone date, source reference, claim mode, scope or attestation metadata fails the whole audit rather than silently displaying an incomplete green receipt.
- Results are deterministic under project ID order; no seed is mutated, and candidate/private research is not loaded.

**Critical distinction:** a syntactically present `reviewedBy` is not independent verification that the document was actually read. Passing this gate means *sufficient registered metadata for a human to begin the final editorial/source + browser review*, not source truth, publication eligibility, or signoff. `publicReleaseAuthorized` is **unconditionally false**.

## Operator commands

```sh
npm run audit:f5-casefiles
npm run audit:f5-casefiles -- --json
npm run audit:f5-casefiles -- --strict
```

By default, the command returns a visible blocked report with exit status 0, since the current empty milestone seed is an **expected research state**, not a production failure. With `--strict`, incomplete pilot coverage gives a nonzero status for an explicit human-driven readiness checkpoint. Unknown flags fail. The validator's date cutoff uses `site.lastUpdated` (the curated-corpus date, **not** a claim that all public material was known then); the cutoff must be deliberately advanced when a later-dated approved milestone is entered. This is not a historical as-of or discovery-time model.

## Baseline and next gate

As of the October 9 code review, all three pilot projects have **zero published native project milestones**. The readiness report therefore blocks each for missing occurred, source-reviewed project-native evidence. It does not say the facilities are inactive, the industrial projects failed, or there was no public support.

Before advancing F5-3:

1. Human reviewer independently inspects each original primary-source passage, language, project/funded-activity scope, source pinpoint and actual-versus-target dates under F5-1, then expressly authorizes a narrow published `mil-*` seed record.
2. Merge approved milestone records with their complete review receipts and execute this audit again against the deliberately updated corpus cutoff. An eligible-for-QA report still does not release anything.
3. Audit every displayed claim, source, financing instrument, project scope and unknown state; run desktop/tablet/mobile, keyboard/focus, responsive/a11y checks and maintainer signoff separately. No public `/pathways`, API, export or sitemap exposure is added by this branch.

## Exclusions and validation

No source monitoring, financial amount histories, agreement/payment totals, source promotions, project registry edits, physical milestone creation, editorial publication, deployment or web route. Run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run audit:f5-casefiles`; independent CI and maintainer review before merge. Test fixtures use explicitly *synthetic* reporter passages; they are **not evidence of real-world construction or reviewer approval**.
