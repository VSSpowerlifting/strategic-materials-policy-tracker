# FI003 — JPMorgan Chase / MP Materials

**Research foundation and exploratory prototype · cutoff November 6, 2026 · human review pending**

Working question: **What did JPMorgan's replaceable construction commitment accomplish, and how did government contracts, equity underwriting and corporate credit change the financing path for MP's 10X expansion?**

The strongest provisional thesis is that JPMorgan helped assemble a transaction that could close with contingent construction financing and subsequently move to equity funding and a smaller corporate revolver. The credit agreement explicitly recognizes government-backed minimum payments in its covenant EBITDA definition. Public information supports these contractual mechanisms; it does not establish JPMorgan's internal underwriting conclusions or the project's eventual commercial returns.

Start with [the research analysis](analysis.md), then [Jiho's independent assignment](JIHO_HANDOFF.md). The [publication plan](PUBLICATION_PLAN.md) identifies the human decisions and next implementation phase. [Verification](VERIFICATION.md) records checks and limits.

| Artifact | Purpose |
|---|---|
| [Evidence ledger](evidence.csv) | 39 claims with source IDs, exact section locators, status, dates and limitations |
| [Source register](sources.json) | 18 original-source URLs, issuance/retrieval dates and retrieval fingerprints |
| [Chronology](chronology.csv) | Reconciles signing, capital raising, expiration and later disclosures |
| [Inputs](inputs.json) | 43 sourced numeric facts, separately labeled illustrative assumptions |
| [Prototype](prototype.py) / [tests](test_prototype.py) | Standard-library Python calculations; no external package required |
| [Exploratory schedules](exhibits/) | Ten generated CSV exhibits; source notes and classifications remain in each table |

Reproduce from the repository root:

```sh
python3 research/fi003/prototype.py
python3 -m unittest discover -s research/fi003 -p 'test_*.py' -v
python3 research/fi003/prototype.py --check
```

Use normal Python execution; `python -O` disables assertion checks. CSV precision is retained for audit; publication displays should round to the disclosure's precision. These schedules are an analytical prototype, not a publication-ready workbook, forecast, valuation or investment recommendation. No source-corpus records, existing publications or site output are changed.

## Standards and prior-work provenance

The four requested standards and FI002 research/model specification were absent from starting `main` (`b4834d75068459a0f60006735e9480df782fdaae`). They were read from existing branch `codex/fi002-production-verification` at **`fe1d5b3b2fd9ef99018fe2be6b032466b69c5771`**, without importing that branch:

- `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md`
- `docs/design/presentations/SMPT_PRESENTATION_STANDARD_V2.md`
- `docs/design/presentations/EXHIBIT_AND_CHART_RULES.md`
- `docs/design/presentations/EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md`
- `research/fi002/README.md` and `SMPT_FI002_Financial_Model_Specification_2026-11-05.md`

The useful FI002 precedent is the separation of source facts, arithmetic, scenarios and human decisions. FI003 instead uses financing reconciliation and contract mechanics; a project DCF would exceed the evidence. The newer presentation standard's 20-slide **total** cap governs the proposed future deck. No slides are produced here. The referenced global `RTK.md` was not found in the checkout or checked parent/Codex locations; no rules were fabricated from it.

After fetching current GitHub main, the research-only change was transferred to `codex/fi003-jpmorgan-financing-foundation` in the isolated `fi003-research` worktree, based on that same `fe1d5b3` revision. The original checkout's pre-existing untracked screenshots were preserved. This foundation branch and its draft PR are the canonical review version; see [verification](VERIFICATION.md) for both environments' check results.

Benjamin Yang retains direction, integration and publication authority. Jiho is a prospective collaborator; all work reserved for him remains unperformed by him. This packet was produced with Codex assistance and makes no claim of human financial review.
