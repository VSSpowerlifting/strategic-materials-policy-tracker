# F5-3a: private editorial casefile preview contract

**Status:** engineering-only draft. **Not a reader-facing route, release or approval.**

Parent: [F5 observatory #108](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/108). The final site casefiles remain [F5-3 #112](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/112), blocked by actual independently source-reviewed, published native execution milestones under F5-1.

## Narrow purpose

F5-0 defines provenance-bearing structural relationships; F5-2 resolves the actual project-specific references; and merged #118 audits whether a casefile can *even begin* manual source and browser QA. This phase supplies one strictly private, read-only presentation-model contract: `buildF5EditorialCasefilePreview(projectId, corpus, curatedCorpusCutoff)`. It explicitly groups **parent policy**, **finance**, **designation**, and **native physical** evidence into distinct lanes, while preserving source citations and unknown physical dates.

The preview does not decide whether a governmental intervention **caused** physical activity or whether financing was paid. Policy parent events may be linked by an existing finance or designation record, but coannounced controls are **not displayed as project-specific causes**. Financial instrument relationships distinguish direct project attribution from nonallocative multi-project associations and provide **no amounts** or financial sum. Finance-package relationships are nonadditive. Financier-reported construction comments appear only as **unreviewed counts** and never as project-native physical claims.

## Live pilot boundary (Oct 9)

The curated main corpus still has **zero** approved native physical milestones. Thus the private Alcoa–Sojitz gallium, Neo/NPM Narva, and Stibnite drafts have an explicit `no_approved_occurred_claims` outcome; all remain **ineligible for casefile QA** until a source reviewer signs off and a separate publication PR is approved. This is an editorial coverage gap, not evidence of stalled projects.

Even synthetic tests that provide structurally valid review metadata can only advance `eligibleForManualSourceAndBrowserQa` for that one project. The draft's `publicReleaseAuthorized` and `autonomouslyApprovedClaims` flags remain **false** regardless of milestone count. The October 9 Stibnite source-registration proposal on #121 and candidate M3 review queue are deliberately **not imported** here. The preview uses only approved seed data and the supplied declared corpus cutoff.

## Explicit non-goals

- No `/pathways` page or linked project page, API, sitemap, search result, analytics, export, or social metadata
- No published milestone, source-registration, finance-history, source-monitor, amount, or status change
- No invented site last-updated revision, reviewer identity, translation, disbursement, plant output, facility start date or attributable budget
- No project maturity score, automatic publishing condition, inferential causal arrow, historical as-of sum, or cross-currency total

## Next release gates

1. Finish independent original-source adjudication for at least one pilot in M3/F5-1 with documented actual reviewer, pinpoint, scope and occurred-vs-target clock. **Do not manufacture human attestation.**
2. After the review, obtain explicit maintainer authorization for a narrowly source-backed `data/seed/project-milestones.json` edit and appropriate curated-corpus revision.
3. Only then use this preview as one input to a separately approved F5-3 UI phase. Check every rendered quote, source URL, unknown label, document clock, and financing interpretation; perform full desktop/tablet/mobile screenshot and keyboard/accessibility QA.
4. Keep site routes, exports and monitors unchanged until that subsequent release passes.

## Verification

Run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` on the exact feature head in CI. The synthetic tests assert (a) no automatic release; (b) original source publication dates never substitute for unknown production start; (c) planned targets are not observed achievements; (d) broken source contracts fail closed; (e) result determinism under row reordering; and (f) no allocation or cash sum.
