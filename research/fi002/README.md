# SMPT Financial Intelligence 002 — BHP Copper Research Handoff

**Prepared:** 2026-11-05  
**Status:** Internal working research; **not publication-approved**  
**Subject:** BHP Group, Escondida New Concentrator, and the reported October 2026 Goldman Sachs copper forecast  
**Storage:** Isolated research folder; not part of SMPT's curated public seed dataset

## Working files (six preserved originals)

1. [Research continuation and decision gate](SMPT_FI002_Research_Continuation_2026-11-05.md) — competing theses, financial and permit research, source limitations, and the gate to modeling
2. [Evidence register](SMPT_FI002_Evidence_Register_2026-11-05.csv) — 38 claim/input records with citations, evidence classifications, and unresolved limitations
3. [Copper-price sensitivity illustrations](SMPT_FI002_Price_Sensitivity_Illustrations_2026-11-05.csv) — four FY2026-basis static-portfolio EBITDA sensitivity illustrations; **not FY2027 earnings forecasts**
4. [Independent quality review](SMPT_FI002_Independent_Quality_Review_2026-11-05.md) — 16-item risk register, independent review perspectives, unresolved questions, and readiness decision
5. [Financial model specification](SMPT_FI002_Financial_Model_Specification_2026-11-05.md) — proposed formula-based workbook, provenance rules, accounting/ownership controls, scenarios and tests
6. [Reproducibility audit](SMPT_FI002_Reproducibility_Audit_2026-11-05.py) — bounded arithmetic and CSV integrity checks

These are the original files generated in the research conversation. The GitHub blob hashes were checked against the local originals after upload. Preserve original versions as a dated baseline; add any revised work separately with source and calculation change notes.

## Immediate Codex next action

1. Inspect existing local worktrees, commits, branches, and untracked files for **FI002**, **BHP**, **Escondida**, or **copper** before implementing anything. Some prior Codex work may exist only locally; this handoff does **not** certify that all earlier work is on GitHub.
2. Compare that work with this dated research and model specification. Keep independently verified prior work; record differences, discrepancies, and blockers rather than silently overwriting it.
3. Build **only a bounded, editable financial workbook**: sourced BHP historical financials, clearly classified copper-price cases, group/segment exposure, properly reconciled capex and financing, and scenario/decision sensitivities supported by disclosures.
4. Run explicit formula, ownership, units, cash-flow, source-provenance, and scenario-propagation checks. Preserve original input records and provide a reproducible validation log.

**Local smoke test:**

```sh
python3 research/fi002/SMPT_FI002_Reproducibility_Audit_2026-11-05.py
```

### Critical safeguards

- The reported Goldman Sachs **2027 average** copper-price forecast is not a long-term Escondida price assumption and its primary-source accessibility remains limited.
- New Concentrator production replaces Los Colorados capacity; do not treat the entire facility output as incremental mine production.
- BHP corporate/group, copper segment, mine-level gross project, ownership-attributable, and equity-accounted figures must not be combined without reconciliation.
- Do not deduct capex twice from management's already-after-investment free-cash-flow outlook.
- Do not invent project cash flows or advertise an independently reproduced **16–18%** project IRR/NPV.
- The example EBITDA sensitivities are static analytical illustrations, **not** FY2027 forecasts, project cash flows, or cash immediately available for investment.

### Stop condition and boundaries

Finish with the **tested editable workbook, methodology and validation results, discrepancy register, and a short next-phase checkpoint**. A separately scoped phase should evaluate strategy and prepare a publishable memo/presentation.

**Not authorized:** changing SMPT public seed records, altering production data/site pages or workflows, merging this draft branch, deploying, publishing, sending messages, reproducing proprietary bank research, or presenting FI002 as sponsored or commissioned by Goldman Sachs or BHP.

## Handoff note

The evidence and QC files document an analytical gate, not a completed valuation or assurance opinion. Check the original documents and current issuance dates before promoting quantitative claims into a decision memo. The site and current tracker corpus remain outside the scope of this working-research branch.
