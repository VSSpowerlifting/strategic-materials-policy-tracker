# Coverage / reverse-provenance parity — October 17, 2026

## Problem

The original coverage report's `sources.orphaned` field (exposed by `/api/v1/coverage`) counted a source as used only if cited by a **policy event, framing claim or actor**. As the SMPT corpus grew to include source-cited financing, industrial projects, organizations, materials, programmes, control clauses, designations and human-reviewed project milestones, this legacy subset became misleading. A source supporting only a signed financing observation or a registered project could be labeled *orphaned* even while its `/sources/[id]` dossier showed exact direct citations.

This was a metadata **consistency problem**, not a finding that published records or original publishers were invalid. There is no new research judgment.

## Change

- Extract the existing **exact** `buildSourceUseIndex` algorithm, data types and source-use ordering into a loader-free `lib/source-citation-index.ts`; `lib/source-usage.ts` keeps its public re-exports and published-data loader intact. This avoids a circular dependency through `lib/data.ts → lib/coverage.ts`.
- `getCoverageReport()` now builds that same pure index from the complete published corpus and defines `sources.orphaned` as registered sources **with zero explicit directly citing records of any supported kind**. It adds an additive `sources.cited` count/denominator; the original field and API path retain their shape.
- `getEvidenceSummary()` forwards the new cited share. `/coverage` publishes its exact numerator/denominator with a link to the established `/sources?citingKind=not_cited` filter where necessary, rather than a made-up quality score.
- Existing reverse provenance deliberately remains **explicit only**: a shared policy event or project does not cause its sources to be inherited by child financial instruments, and a financial link does not establish physical construction or industrial progress.
- Timeliness, legal history, source confidence tiers and event-level primary-source coverage remain unchanged.

## Verification and boundaries

Tests require exact equality across three independent public views: `getCoverageReport().sources.orphaned`, `getSourceUses()` / `buildSourceUseIndex()`, and the Source Register's uncited filter. A synthetic case with **finance-only** status and **project-only** source citations asserts that these are never treated as uncited simply because no event cites them. API/coverage page checks assert unambiguous copy and deep links.

No curated source changes, data seeds, financial totals, public-finance status calculations, M3/F5 private review, monitored input or deployment configuration. No claim that every source is independent or current. Counts describe only registered sources and recorded uses.

Release only after full exact-head validation, tests, TypeScript, lint, production build, scoped browser checks if applicable, and a successful Vercel preview. Do not merge past Vercel account-rate-limit failure.
