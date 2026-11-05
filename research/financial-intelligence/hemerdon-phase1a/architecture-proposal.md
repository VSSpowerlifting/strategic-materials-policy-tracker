# Extend financial evidence beside the existing corpus before adding production entities

Status: proposal, **not implemented as a production migration**. The current research files and case generator are the only Phase 1A implementation. This proposal is grounded in `lib/types.ts`, seed registries, amount/status histories, decimal utilities and the candidate-review/publication workflows.

## Preserve existing identities and counting rules

Continue using `org-*`, `prj-*`, `src-*`, `fin-*`, `evt-*`, `prg-*` and designation IDs. An organization is a legal or institutional party. A project is an industrial undertaking. Neither is an accounting statement or a financing transaction. A parent's sponsorship must not silently assign the parent's assets or debt to a subsidiary project.

Keep amount qualifiers, source currency, `valueRole`, `capitalSource`, package/component links and financial versus implementation status histories. A loan's limit, amount drawn, debt outstanding, cash received and expenses financed describe different measurements. Disbursement is not proof that an equal cash balance remains available. The existing exact-decimal approach should remain authoritative for money.

## Add research records with explicit accounting and evidence dimensions

| Proposed record | Minimum fields | Existing reuse / reason |
|---|---|---|
| Financial source detail | `sourceId`, document type, published date, reporting period, access date/method, document hash, rights, redistribution permission, verification | Extend a reference to `Source`, not a replacement source registry. Distinguish dated website updates from filing publication. Hash downloaded files where permitted. |
| Financial observation | Stable observation ID, org/project ID, statement scope, metric, decimal value/null, currency, unit, period start/end or stock date, qualifier, evidence class, source IDs + locators, restatement vintage, supersedes ID | Accounts need period, scope and restatement dimensions unavailable in a generic financing amount. A restatement supersedes a comparable observation, not the historical source itself. |
| Legal relationship | Parent/child IDs, relation, ownership and voting fractions, effective-date bounds, evidence | Reuse organization parent links where supported. Do not infer security or guarantees from 100% ownership. |
| Facility measurement | Existing `fin-*` ID, borrower/guarantor IDs, limit/drawn/received/outstanding amount kind, date, currency, qualifier, source/locator | Attach measurements to one facility to avoid treating an announcement and later draw as separate funding. Store uncommitted options distinctly. |
| Financing cash transaction | Stable transaction ID, facility ID, flow kind, date, gross/net basis, amount/currency, receipt/repayment/fee classification, evidence | A transaction changes a balance; a limit does not. Never sum parent envelopes with components or converted liabilities with cash issuance. |
| Model assumption | Stable ID, classification, driver, unit, period, source observation IDs or explicit analyst rationale, transform, scenario membership | Implemented locally through evidence IDs, assumptions cells and model formulas. Missing values remain null. Reported, Guidance, Derived, Assumption and Unavailable are separate classes. |
| Model run | Case ID/version, cutoff, input hashes, generator version, scenario definitions, calculation engine, output and check results | Reproducibility is substantive: record engine differences, missing inputs and executed scenario tests. File hash equality alone is insufficient. |

An illustrative observation shape, for a future reviewed schema:

```json
{
  "id": "fobs-example-cash",
  "orgId": "org-tungsten-west",
  "projectId": "prj-gb-hemerdon",
  "scope": "consolidated_group",
  "metric": "unrestricted_cash_and_equivalents",
  "value": "25485511",
  "currency": "GBP",
  "unit": "GBP",
  "stockDate": "2026-03-31",
  "classification": "Reported",
  "vintage": "FY2026_accounts",
  "evidence": [{"sourceId": "hfs-tw-ar2026", "locator": "printed p.34; PDF p.36"}]
}
```

This is a proposal example, not a valid new seed type or an approved public observation. The current case uses research-local `hfs-*` and `hfi-*` namespaces alongside existing public IDs. Any future promotion would assign approved public IDs and preserve a mapping.

## Add prices and policy relationships only when their rights and meanings are established

Candidate public sources include issuer annual/interim accounts, issuer-hosted presentations and circulars, Companies House entity and charge filings, FCA NSM announcements, NWF/government releases, HM Treasury and Parliament documents. Use the issuer or regulator rather than an aggregator's AI summary. Public filing access does not waive RNS distribution terms.

Bank of England benchmark and exchange-rate series may support historical financing analysis after verifying the exact rate definition and reuse conditions. A future USD/GBP forecast must be an explicit scenario, rather than today's spot rate relabeled as a future assumption. Commodity benchmark licenses can restrict storage, derivation and public redistribution; do not copy paid APT series from company charts into an open database. Public company price assertions may be retained as attributed disclosure, with date and unit, but do not become independent benchmark observations.

USGS, official trade statistics and other public mineral statistics can supply contextual observations where their revisions, lags, units and rights are captured. Connect a policy to an issuer claim or project evidence by explicit cited relationship and dates. Do not infer causal cash-flow effects from a shared material, date or government objective. Avoid composite geopolitical risk scores without a separate justified methodology.

## Validate the second case before choosing a generalized model

The next case should first use a separate research directory with the same source/claim conventions. Validate unique/resolving IDs, canonical decimal values, currency/unit/period/scope consistency, publication cutoff, input derivation cycles, source rights, duplicate transactions, restatement supersession and model missing-data behavior. Where one currency is converted, retain the original value, conversion rate, quote convention and evidence.

The minimum finance checks remain sources-and-uses reconciliation, cash rollforwards, balance-sheet identity, non-cash funding exclusion and no package/component double count. An operating model adds volume/grade/recovery/payability consistency, capex versus depreciation, working capital, cash tax and correctly dated discounting. Lender DSCR requires the agreement's CFADS and debt-service definitions. A formula named DSCR is insufficient.

Migration risks include changing existing public capital totals, retroactively treating upper bounds as commitments, conflating legal borrower with sponsor, mixing statement and cash dates, and releasing unapproved corporate or restricted source extracts. Preserve existing API and static-export contracts. Design a human-reviewed candidate/promotion mapping before any production implementation.

Dependencies for a second case are modest: a sourced legal/asset map, at least two comparable financial periods, verified financing terms and sources/uses, a rights-cleared input register, an evidence sufficiency decision and an independent financial review. Full automated ingestion, paid data connections, database changes and website features remain deferred.
