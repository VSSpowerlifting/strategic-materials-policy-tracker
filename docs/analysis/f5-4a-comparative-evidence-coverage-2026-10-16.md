# F5-4a — Registry-wide evidence-coverage comparison (internal, 2026-10-16)

Issue: [F5-4 #113](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/113)

## Editorial purpose

Readers currently have a policy/event matrix at `/compare`, a government-commitment-to-physical **financier-reported** matrix at `/response`, and a private F5 project-native industrial evidence pathway. These use **different denominators and evidence authorities**. Merging their counts into a single implied "success" measure would be misleading.

This phase introduces a deterministic **read-only comparison inventory** over all published project registry rows. It does not create a second historical-finance classifier: the `/response` inclusion and binding tags are reused *exactly* from `buildIndustrialResponse(asOf)`. The F5-0 audited graph supplies direct-vs-associated links and registered human-reviewed milestones, retaining source identifiers for each structural connection.

## Denominators and counting units

- **Registry denominator:** each unique published project ID, including those with no recorded financing or milestone. A filter selects a **new explicit subset** of these projects.
- **Material/stage filters:** project registry tags, not fuzzy inference from a shared finance announcement.
- **Provider filter:** any finance instrument directly linked **or nonallocatively associated** to the project and tagged to that jurisdiction. Provider association does NOT establish capital attributable to the project. Public response government eligibility is a separate independently defined subset.
- **Direct finance count:** distinct project IDs with at least one directly linked instrument; **not** counts of dollars or finance rows. Package/child financial rows can coexist, but the project is still counted once.
- **Government commitment reference:** at least one **direct** finance row with `valueRole: commitment` and nonnull provider jurisdiction; **not** equivalent to active/binding/paid.
- **Designation count:** recognition/priority, never fiscal funding.
- **Native physical progress:** separately counts projects with human-reviewed `occurred` and `planned` milestones. A planned construction date never becomes an occurrence merely because time passes. Absence means **not yet recorded**, not inactivity.
- **Legacy finance-reported physical:** recorded for editorial triage only. It is **not** independently authenticated, source-scoped project-native progress.
- **Public response legal standing:** `/response` source-evidence-bound F4 **legal-as-of** semantics at `site.lastUpdated`. Physical notes remain current-corpus revision, NOT historical physical-as-of.
- **Per-material totals:** each material row is a distinct-project count; a polymetallic project legitimately occupies multiple rows. **Never sum material rows into a global unique-project count.**

## Reproduction

```sh
npm run audit:f5-coverage
npm run audit:f5-coverage -- --json
npm run audit:f5-coverage -- --material gallium
npm run audit:f5-coverage -- --stage processing
npm run audit:f5-coverage -- --provider us
```

All commands read published seeds only; no writes, pages, APIs, exports, watchers, approvals or source refresh. CLI validates supplied taxonomy selectors. Every result declares its cohort and cutoff. Unfiltered output has a whole-corpus denominator.

## Outstanding F5-4 release gates

This is phase A, **not the public comparison feature**. Before a public route or export: inspect actual distribution/coverage against original publishers, add explicit standing and scoped milestone controls with source boundaries, design observation-horizon handling that does not turn publication into physical-effective dates, compare accessibility/browser ergonomics, and obtain reviewer authorization. Do not use a blanket historical cutoff for physical claims. Protect private M3/F5 source-review work: no automatic seed promotion or authority duplication.

The existing open source/source-scope PRs #130, #132, #133, #134 and the F4 RFC #86 remain separate. No changes to published corpus seeds, financing classifications, source metadata, existing pages or automated collectors.
