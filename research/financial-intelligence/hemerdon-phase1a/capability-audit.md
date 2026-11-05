# Existing SMPT structures support provenance, with financial modeling kept in research

Audit basis: assigned worktree at `2286648`. Clean detached HEAD at entry; work branch `codex/hemerdon-financial-phase1a`. Repository root and origin match the assignment. The desktop attachment is supplied by the session context; shell checks verify the filesystem identity, not a separate desktop internal attachment API. Open PRs #199 (finance ontology), #193 (corpus audit) and #185 (DFARS brief) were inspected by title/base/head. None is a declared dependency. No other worktree was edited.

## Existing entities can anchor a financial case

| Capability | Observed implementation | Reuse and limitation for Hemerdon |
|---|---|---|
| Organizations and assets | `lib/types.ts`, `data/seed/organizations.json`, `projects.json` | Reuse `org-tungsten-west` and `prj-gb-hemerdon`. Sponsors identify the parent company. Organization parent links exist, but the Hemerdon records do not enumerate DRL or other subsidiaries. A project sponsor is not necessarily the contractual borrower. |
| Financial instruments | `data/seed/financial-commitments.json` | Four Hemerdon rows: package, equity, lending and procurement negotiation right. Equity and lending have `part_of` links to the package. The right is distinct and has no cash amount. Existing £35m lending is an August upper bound, not verified £35m debt outstanding. |
| Funding status and dates | `FinancialCommitment.financialStatusHistory`, `lib/capital-control.ts` | Announced, contracted and disbursed histories are supported separately from physical implementation. Existing Hemerdon histories stop at announcement. Later company filings need independent review before promotion. |
| Amount history | Optional `financialAmountHistory`, `financialAmountOn`, F4 docs and tests | Reuse the distinction between amount evidence and effective-date bounds. A changed upper bound is not a second loan. It does not yet provide account balances or a debt amortisation schedule. |
| Sources and claim locators | `Source`, `EvidenceReference`, `InstrumentTerm`, `StatedOutcome` in `lib/types.ts` | Source IDs and field-level locators can anchor the financial register. They do not directly encode accounting period, restatement vintage, statement scope or model cell lineage. |
| Capital aggregation | `lib/capital-control.ts`, `lib/capital-intelligence.ts`, `lib/decimal.ts` | Reuse conceptual counting rules: package/component exclusion, public/private/value-role distinction, currency separation and decimal strings. Do not import a public-capital sum as corporate cash available. |
| Financial reading | `lib/financial-reading.ts`, financial status/as-of tests | Existing captions distinguish a stated commitment from amounts paid. Helpful terminology, not a cash model or receipt confirmation. |
| Implementation review | `research/project-execution/README.md`, candidate workflow | Read-only evidence review, adjudication and human publication gates already exist. Operational announcements are separate from finance. This case does not promote either. |
| Research outputs | R001 publication record and `public/research/r001/*` | The 26-page dossier already reconciles the NWF package, draw and commercial relationship on pp.11–14. Its nine-sheet evidence workbook has ten formulas and source IDs S14/S18/S20/S21/S31/S35 relevant here. Those links were reused and primary sources reopened. No project-finance generator or antimony financial workbook was located among tracked files in this checkout. The task's broader antimony model may exist elsewhere; its location remains unresolved. |
| Validation | `scripts/validate-data.ts`, capital/control validator, `tests/*` | Existing checks enforce IDs, references, decimal amounts, date order, evidence and candidate isolation. Add local research tests rather than changing production validators in Phase 1A. |
| Rights and publication | Source notes, R001 editorial author approval, candidate human-promotion gate | Public access and citation do not grant redistribution rights. Existing source register notes are not a granular rights clearance system. Add a research-only rights/access field; obtain clearance separately. |

The site uses typed local JSON and static export routes, with no production financial database to migrate. `lib/data.ts` loads the seed corpus; no application or component imports this new research area. R001 source S31's PDF hash matches the independently downloaded FY2026 accounts. The existing financial evidence is therefore a reusable starting point, while this phase adds financial statement history, October operating guidance, source-classified model inputs and executable scenario/reconciliation QA.

## The actual gaps are accounting scope, dated balances and executable lineage

Existing project and source IDs support project-level analysis as anchors. They do not make consolidated company accounts a standalone asset model. DRL operates the mine, while PLC financing and shareholder dilution have different scopes. This case preserves those distinctions in `scope` and company/project IDs without adding entities to public seeds.

Status histories can distinguish announcement, commitment and payment. The Hemerdon data has not yet incorporated the later full £25m draw disclosure. The £10m accordion should be modeled as uncommitted rather than folded into available debt. The old bridge repayment must remove the earlier exposure instead of being treated as another use financed indefinitely alongside NWF.

Model inputs now trace to source ID, printed/PDF locator, publication date through the register, reporting period, unit, currency, qualifier and evidence class. Formulas reference an ID-to-cell map created from the register. Unknown values are null; missing price inputs do not turn into a zero revenue forecast.

## A second case should reuse three small components

1. Keep the source/claim pattern and validation rules, including restated comparative vintage, scope and missing values.
2. Reuse restrained workbook formatting, source hyperlinks, stable input IDs and reconciliation conventions. The present generator is intentionally case-specific; generalize only after a second case demonstrates repeated needs.
3. Reuse scenario mutation QA, independent arithmetic, reference/cycle checks and an explicit valuation sufficiency gate.

Do not extend the production taxonomy, add feeds or create a general valuation engine before a second evidence set tests these needs. The architecture proposal identifies a possible future boundary without implementing it.
