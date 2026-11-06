# FI003 verification and limits

**Research cutoff and local verification date: November 6, 2026.** This records a preliminary analytical prototype. No human financial, legal or publication approval has occurred.

## Evidence work performed

- Retrieved complete original documents for 18 register entries: July agreements and equity offering, August credit agreement, Q3 2025 10-Q, 2025 10-K, Q1/Q2 2026 10-Qs, November 5 Q3 release, JPMorgan's transaction account, its October 2026 strategy statement, Apple 8-K and SEC submissions metadata. Relevant operative sections and financial tables were read directly, rather than treating search snippets as evidence.
- The SEC submissions response contained Q2 as its most recent 2026 10-Q and the November 5 earnings 8-K. Q3 financials come from the separately furnished release; **no Q3 2026 10-Q is represented as reviewed**. This is a bounded retrieval finding, not a guarantee that no later filing appeared during November 6.
- Original documents were retrieved through HTTP into a temporary research cache. Direct retrieval succeeded where some web-reader requests returned 403/internal errors. The issuer's Q3 release page returned 403; its complete SEC-furnished Exhibit 99.1 was read instead. No paywall bypass was used.
- `sources.json` contains original URLs, issuance/retrieval dates, saved UTF-8 retrieval sizes and SHA-256 fingerprints. These fingerprints identify the retrieval used; they do not authenticate issuer signatures. Full bank articles/transcripts and source screenshots are not redistributed. Temporary originals are not a durable archive; future reviewers must retrieve originals using the register. A source change may require a new fingerprint and review.
- The 39-row claim ledger preserves reported facts, source claims, calculations, inferences and unresolved interpretations. Its source IDs join the register; numeric inputs separately identify source, locator, unit and as-of date. Omitted/redacted schedules remain a limit.

## Prototype scope and calculation checks

The standard-library Python script produces ten CSV schedules from `inputs.json`. It uses Decimal arithmetic, retains full precision until presentation, and has no network calls or implicit market inputs. Sourced facts are separate from hypothetical prices, SOFR, draws, capacity fractions, calendar years and clause examples. Those examples are not approved underwriting assumptions.

Fifteen automated tests cover independently calculated offering anchors, initial underwriting allocations, L-C/borrowing reconciliation, interest/fees, overdraw rejection, rate/draw direction, the actual liquid-asset bridge, PPA boundaries and milestone sharing, pre-COD exclusion, capacity scaling, isolated covenant adjustment, accounting/cash separation, provenance/cutoff failures, historical stability under scenario changes, claim-source integrity, CSV roundtrips and generated-output equality. A deterministic `--check` compares all ten committed schedules byte for byte without rewriting them.

Independent numeric anchors include:

| Check | Result |
|---|---:|
| Final share count × $55 | $747.499940m |
| Final share count × $53.35 | $725.0749418m |
| Final net $724.2m + $275m capacity − $1bn reference | −$0.8m |
| Before-other-expenses proceeds + capacity − reference | +$0.0749418m |
| $7.4m expense / $1bn reference | 0.74%; not annualized |
| June capacity: $275m − $72m L-C exposure | $203m; zero loan draws reported |
| Illustrative $150m draw at 4% SOFR + 2.5%, 360 days | $9.75m loan interest; $0.1855m unused fee; excludes other fees |
| September liquid assets less December | −$492.375m |
| Liquid-asset bridge residual | −$0.599m; not force-allocated |
| Recognized PPA income, 2025 plus 9m 2026 | $118.978m; not verified receipts |
| Hypothetical 2029, post-COD 50% capacity threshold | $75.7702512m; not CFADS |

The generated diff was reviewed as data: each table labels instrument status, period, units and source. There is no project DCF, actual covenant headroom, bank profitability, regulatory-capital model or automatic public-data update. The guarantee adjustment is isolated arithmetic; actual applicability and anti-duplication implementation remain with Jiho.

## Repository checks

Canonical delivery worktree: `/Users/benjaminyang/strategic-materials-policy-tracker-worktrees/fi003-research`; branch `codex/fi003-jpmorgan-financing-foundation`, based on `origin/main` at `fe1d5b3b2fd9ef99018fe2be6b032466b69c5771`. The PR/commit metadata supplies the final delivery revision; no self-referential commit hash is embedded here.

| Final-worktree check | Observed result |
|---|---|
| FI003 unittest discovery | **15 passed**, no failures |
| `prototype.py --check` | **10 schedules reproduce exactly** |
| `npm run validate` | Passed; existing source/framing warnings remain |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed: **0 errors, 27 warnings** in pre-existing files |
| `npm test` | **1,097 passed**, 0 failed |
| `npm run build` | Passed |
| Complete changed-file list and generated CSV diff | Reviewed; research package plus seven-line project-state addition only |
| `git diff --check` | Passed after normalizing the new ledger/chronology CSVs to LF |

Initial-checkout results are preserved rather than replaced by the clean-worktree results. The original checkout was on older local main `b4834d7`. Its full Node run passed 1,067/1,068 tests: `tests/editorial-ledger.test.ts:143` expected an empty import history, while the existing ignored `.monitor-editorial/inbox.json` had five imports and zero items. The unchanged CLI reads that local state. Broad lint there traversed embedded `.claude/worktrees` and reported 4,486 errors/46,858 warnings; limiting lint to tracked project files returned zero errors/nine warnings. Validation, typecheck and build passed there. No private ledger, embedded worktree or unrelated code was changed to clear these failures.

Fetching current main revealed that the original checkout's untracked screenshots were tracked upstream, so Git refused an in-place rebase. They were left in place. The FI003-only commit was transferred to the new worktree; the project-state conflict was resolved by adding the FI003 entry above the complete upstream state history. No upstream content was dropped. The original local research checkpoint remains at `a4bbd89` on `codex/fi003-jpmorgan-financing-research`; the foundation branch and its PR are the canonical handoff.

The complete suite was then run against the updated base in the isolated worktree, not merely the previously failing test in isolation. Only verification prose changed after those project checks. CI status must be read on the PR; local passes are not represented as CI results. A passing code check cannot establish a financial interpretation or authorize publication.

## Material unresolved evidence and human gates

1. Complete executed commitment/fee letter and exact cancellation arithmetic; JPMorgan's individual commitment and fee allocation.
2. Actual covenant certificates, guarantee addback, cash eligibility, netting-cap calculation and a September credit refresh.
3. Reliable remaining 10X capital-spend profile, incentive cash timing, operating ramp economics and CFADS. The latest reviewed investment expectation is **more than** $1.25bn, not a fixed budget.
4. Jiho's independent credit/commercial interpretation and accepted scenario assumptions; Benjamin's policy/industrial integration and final thesis choice.
5. A separately scoped workbook/deck phase, exact-output financial/source/editorial review and explicit human publication authorization.

No physical site inspection, borrower/bank confirmation, independent legal opinion, native Excel recalculation, finished-slide rendering, production deployment or public-content verification was performed. Those absent activities are not silently marked passed. The case is feasible as bounded financing research; project-return claims remain withheld.
