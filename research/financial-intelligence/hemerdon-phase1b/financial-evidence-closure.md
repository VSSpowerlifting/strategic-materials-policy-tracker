# Phase 1B decision: conditionally ready for a financing-structure case

**Outcome B — Conditionally ready.** A public financial case can address financing structure, government intervention, remaining-spend guidance and explicitly bounded scenarios. Current liquidity, a complete funding gap, project valuation and debt-repayment sufficiency remain outside the supported conclusions. This decision is a research acceptance gate, not editorial or publication approval. No public memo or presentation was produced.

Cutoff: **4 November 2026**. Worktree `1bd1`, branch `codex/hemerdon-financial-phase1a`. Phase 1A's original 16 files were reviewed, rechecked and preserved unchanged in commit **`4582fb529c86dffc1a6329218e8081fe16550043`**. The Phase 1B changes extend that baseline; they do not replace its audit trail.

## All four principal findings survive, with their financial meanings bounded

| Finding | Evidence and date | Independent calculation / model location | Accepted wording and limitation |
|---|---|---|---|
| Up to £71m NWF headline | 25 August NWF and issuer releases; FY2026 accounts approved 2 September; October presentation slide33. `hfi-nwf-equity`, `hfi-nwf-loan`, `hfi-nwf-accordion` | £36m equity + £25m core loan = £61m gross; adding £10m uncommitted accordion reconciles £71m. Funding D8:D12. | £61m gross equity/core-loan transaction financing; £10m remains uncommitted. Full £25m draw disclosed by approval. This is neither £71m received nor current cash. |
| £40–45m remaining project spend | October presentation, released 13 October, slide20. `hfi-remaining-low/high`, `hfs-oct-presentation-release` | Midpoint £42.5m; FY2027 £25–35m; following year is balance. Funding D16:D17, D27:D28. | Company guidance at an October snapshot, excluding operating costs. Do not add it to August uses, or call £134m less remaining spend audited cash spent. |
| £5.75m downside increment | October capital range; accounts printed p38 three-month fallback-processing sensitivity; separately labeled analyst rate stress | (£45m − £42.5m) + £3m + (1% × £25m × one year) = £5.75m. Funding D18:D23 in Downside. | Combined analyst stress above the midpoint reference. It combines a company delay sensitivity and a simple annual rate exposure proxy. It is not management guidance, a dated cash forecast, contractual interest or the current total funding gap. |
| £2m deficit in original August plan | Issuer RNS9611R, 25 August, Appendix Sources and Uses; `hfi-aug-*` | £88m sources − £15m projected receipts − (£88m stated uses − £13m reserve) = negative £2m. August plan D35:D37 with receipts factor0. | Approximately £2m **on stated-total basis**, holding other original-plan items fixed. Summing rounded detailed uses instead gives approximately £1m deficit. No statistical £1–2m confidence interval is implied. Neither is an observed cash deficit or current forecast. |

The statements above reconcile to both the workbook and [independent engine results](validation-results.json). The £438.15/mtu base tungsten-only core coverage reference also reproduces. Its exclusions and contract-coefficient assumptions continue to prevent use as project break-even or lender DSCR.

## The latest supportable position remains a set of dated observations

| Date / evidence horizon | Corporate or project observation | Treatment |
|---|---|---|
| 31 March 2026, published 3 September | Consolidated cash £25,485,511; separately restricted escrow £14,912,042. Accounts printed pp34,54. | Latest exact audited general-use cash balance located. The later publication date does not move the balance-sheet date. Neither is standalone DRL project liquidity. |
| Year to 31 March | Net equity cash proceeds £41,029,253; CLN cash £5,205,000. | Already included in March closing cash. Adding them to that stock again double-counts funding. £197,212,441 CLN conversion is non-cash. |
| 31 March | Borrowings/leases/hire purchase £1,846,950, combining £1,742,223 non-current and £104,727 current; CLN nil. | Historical financing liabilities, not November principal. Do not overlay the August NWF loan onto the March statement and label the result current debt. |
| April, confirmed in subsequent-event note36 | £3m Hargreaves payment was made. £7m further payment due by 15 May 2027. | A confirmed post-March cash outflow and a separate future requirement. April8 RNS described the payment prospectively; the later accounts close its paid/planned distinction. |
| 21 May | Binding USD25m bridge, SOFR+4.5% with quarterly step, unsecured; USD85m larger package still being finalized. | Facility limit is not a draw. No unsupported GBP conversion or receipt amount. Do not count the unfinished USD85m package as another committed facility. |
| 25 August original plan | £7m opening cash, £5m provision recovery, £36m equity, £25m debt and £15m expected receipts; £18m planned bridge repayment; £13m planned reserve. | Dated plan with unspecified opening/peak dates. Recovery and receipts are plan sources, not verified cash received. Keep outside the actual cash bridge. |
| 28 August | Company reports the May bridge fully repaid and NWF debt effective. | Retire the earlier bridge exposure at the reported date. Exact GBP principal, FX, interest and fees paid remain unquantified. |
| By 2 September approval | £25m NWF core loan fully drawn; approximately £36m equity raise reported. Auditor describes checking related funding receipts/drawdowns against bank statements. | Receipt/draw evidence is stronger than an announcement. Public sources still do not provide an exact net NWF equity bank credit or complete cash uses after receipt. |
| 16/24 September and 1 October | Option exercises described as providing £41,429.88, £8,285.97 and £33,314.91 of additional funding. | £83,030.76 total stated prospective funding. Notices say “will provide”; not independently confirmed bank receipts. Preserve stated amounts; nominal share value does not establish exercise price. |
| October presentation | Equipment finance £11m current and approximately £22m committed for ordered machines; NWF facility £25m plus uncommitted £10m. | No verified same-date total drawn principal. The April £22.3m equipment agreement cannot be reconciled to those October scope labels from the available slide alone. Do not sum £22.3m, £22m and £11m. |
| 4 November cutoff | No complete post-March cash rollforward or newer exact cash stock located in the reviewed primary corpus. | Closing unrestricted cash, current net funding gap and current aggregate debt remain unavailable. This is the result of a bounded disclosure search, not proof that no other public evidence exists. |

[funding-bridge.json](funding-bridge.json) preserves the dated actual/plan distinction in machine-readable form. Funding rows 32:40 make the cash bridge's missing pieces visible in the workbook. No residual plug or partial subtotal is presented as current cash.

The bridge requires exact net equity credits, actual bridge draw/repayment cash and FX, operating receipts/spend, capital deposits and invoices, fees, equipment-finance cash flows, taxes and any restriction transfers. The March £10,642,212 deposits balance primarily reflects rebuild purchase-order deposits, explaining why PPE cash acquisitions alone do not capture all cash committed to redevelopment. Those deposits are already in the accounts and operating cash movements; they are not a new funding source.

## A filed security deed closes part of the documentation gap

A fresh direct Companies House retrieval found DRL charge **118544670005**, created 28 August2026, delivered 1 September, with a certificate dated 4 September. It includes an executed group security agreement naming DRL, PLC, Tungsten West Services and Aggregates West as chargors, and GLAS Trust Corporation Limited as security trustee. The deed contains fixed/floating security and a negative pledge, with exclusions for financed equipment under its defined terms. (`hfs-group-security-2026`; PDF pp3–4,7–9,38,42)

This materially improves the documentary foundation beyond announced security. It does **not** close NWF facility diligence. The deed references a loan agreement dated on or about the deed date but does not identify the lender by name or reproduce the complete loan terms. Its connection to the NWF transaction is consistent with timing and parties, but remains an attribution inference pending the loan agreement. No exact draw date, tenor-origin resolution, maturity, covenant headroom, security perfection opinion or collateral value follows from the registration.

The search tool initially returned an older charge list with no new charge. Direct HTTPS retrieval returned the fifth charge and its original filing. The dated filing and document, not the stale search result, support this finding. No assertion that the security was missing or invalid is retained.

## Independent validation found and repaired missing-input failures

Microsoft Excel was not located in `/Applications` or the Spotlight bundle-ID search. LibreOfficeDev 26.8.0.0.alpha0 was available. The preserved Phase 1A workbook was recalculated in disposable copies: all 161 cached formula values agreed with LibreOffice. An independent validator then ran 30 cases without importing `model.py` or `verify.mjs`.

The baseline produced12 failed cell expectations across missing-input cases: blank sources could become zero, partial source ranges could be averaged or summed, and a missing-volume check could incorrectly return Valid. These affect edit/refresh reliability rather than the intact-input four findings. [baseline-validation.json](baseline-validation.json) retains the failures instead of replacing them with the repaired results.

The repair guards numeric source links, midpoint prerequisites and full input counts; terminal checks now distinguish missing values from zero. It also adds the dated cash-bridge rows without inventing closing cash. Final acceptance evidence is [validation-results.json](validation-results.json); producer-engine results remain separately in Phase 1A `model-results.json`. The two engines, formula/reference/cycle review, source-value comparison, mutation tests and saved-file inspection are complementary checks. They do not constitute native Excel execution or an independent human finance sign-off.

## Publication scope is conditional

**Accepted for an attributed case:** NWF instrument structure and disclosed draw, the separation of funding from revenue, company-guided remaining spend, the original funding plan's receipt dependence, stated operational/commodity exposure and correctly labeled scenario arithmetic.

**Not accepted:** a present cash balance, current financing shortfall, full project break-even, independent NPV/IRR, equity target, DSCR/covenant headroom, repayment assurance, grant-equivalent subsidy or causal incremental production attributed to policy.

An independent human financial/editorial review and source-rights review should precede publication. RNS/AMC/benchmark rights remain source-specific; this phase redistributes no original documents. Native Excel testing remains desirable for an Excel-targeted public workbook; the available independent LibreOffice run is documented rather than passed off as Excel.

The next session may draft only within this accepted scope after separate authorization. To expand the case to liquidity or lender due diligence, complete the [information-request checklist](information-request-checklist.md). No requests have been sent and no public materials have been begun.
