# Hemerdon Phase 1B validation gate

Cutoff: **4 November 2026**. Decision: **B — Conditionally ready** for financing structure, government intervention and bounded scenarios. Current liquidity, complete funding gap, valuation and repayment conclusions remain unsupported. No public memo or deck has been started.

| Artifact | Purpose |
|---|---|
| [Financial Evidence Closure Report](financial-evidence-closure.md) | Decision, all four findings, dated financial position and limits |
| [Funding bridge](funding-bridge.json) | Machine-readable historical-plan versus latest-supported observations; unknown closing balances |
| [Information checklist](information-request-checklist.md) | Exact outstanding financial/contract requests; nothing sent |
| [Source discovery log](source-discovery-log.json) | Bounded primary search, index and document hashes |
| [Independent validator](validate_workbook.py) | Recalculates disposable copies through LibreOffice without producer imports |
| [Baseline results](baseline-validation.json) | Original Phase 1A's correct caches and12 failed missing-input expectations |
| [Final results](validation-results.json) | Corrected workbook: 32 cases pass, 167 cached formula values agree |

The original 16 files are preserved at commit `4582fb529c86dffc1a6329218e8081fe16550043`. Updates are contained in the existing [Phase 1A artifacts](../hemerdon-phase1a/README.md) plus this directory. Source data now has 158 claims/inputs and 20 sources. The nine-sheet workbook retains its core output values and adds numeric-source completeness guards and a dated incomplete cash bridge. The £2m original-plan finding is now explicitly approximate and tied to the published-total convention.

## Reproduce acceptance

Use Python with `openpyxl==3.1.5` and an available LibreOffice `soffice` executable. From the repository root:

```sh
python -m unittest discover -s research/financial-intelligence/hemerdon-phase1a -p 'test_*.py' -v
python research/financial-intelligence/hemerdon-phase1b/validate_workbook.py
```

`--soffice` overrides executable discovery; `--input`, `--evidence` and `--output` select explicit artifacts. The validator does not modify the input workbook. It creates temporary case copies, independently recomputes outputs with Decimal arithmetic, checks source values and formula relationships, recalculates all 32 cases and compares the baseline formula caches. The final results record the exact workbook, evidence, validator and engine identities.

The producer workflow remains `model.py` followed by `verify.mjs` as documented in Phase 1A. A fresh Python generation alone has no formula caches; execute the producer verification or calculate in the target spreadsheet engine before running cache-agreement acceptance. Do not overwrite the original baseline results when validating a later build.

To revisit the original failures, extract the workbook **and evidence.json** from preservation commit `4582fb5` to temporary files and pass them through `--input` and `--evidence`; use a separate output path. Its source count and formula count differ from the corrected workbook. The preserved run had 30 cases; the final validator adds missing-accordion-ceiling and invalid-case tests. The preserved report's input hash identifies the committed bytes.

Native Microsoft Excel was not found. This session used bundled `LibreOfficeDev 26.8.0.0.alpha0`; its complete version is in the results. This is an independent engine check, not native Excel or independent human finance sign-off. Public editorial review, rights clearance and separate authorization remain necessary before publication.
