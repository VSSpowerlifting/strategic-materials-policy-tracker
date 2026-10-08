# F4-A implementation ledger — exact current loan amount vs bounded historical versions

Reviewed 2026-10-08. Feature branch: `feat/f4-amount-window-pilot-20261008`. Baseline: `d2ab8f72aa7510a44d408949fc255c4afc681ee6`.

## Primary source chronology

- [DOE Thacker Pass October 2024 project summary](https://www.energy.gov/edf/thacker-pass): facility at original signed close **approximately $2.26B**, composed of **$1.97B principal plus about $289.7M capitalized interest**. The 2024 loan closing date is **28 October 2024** as stated by issuer [Form 10-Q Note 4](https://www.sec.gov/Archives/edgar/data/1966983/000119312526347826/lac-20260630.htm).
- [Lithium Americas Form 8-K Item 1.01 dated 7 October 2025](https://www.sec.gov/Archives/edgar/data/1966983/000119312525233937/d10878d8k.htm): parties entered an amendment **which will become effective upon satisfaction of conditions precedent**. Its Exhibit 99.1 describes the proposed amended **approximately $2.23B** facility. Oct 7 is a signing and *earliest possible* operative date, **not** a proven operative date.
- [Issuer Q2 2026 10-Q, Note 4](https://www.sec.gov/Archives/edgar/data/1966983/000119312526347826/lac-20260630.htm): amended loan is established, its revised estimated capitalized interest **$256M**, principal unchanged **$1.97B**. First loan advance **$435M on 20 October 2025** establishes the amended facility operative **no later than** that date. Later advances $432M and $342M do not change the facility face amount or create additional entries.
- The actual effective day of the signed OWCA conditions is **not evidenced** by these sources. The helper therefore reports `indeterminate_transition` for **7 October through 19 October 2025**, and the original approximate amount through October 6 and amended approximate amount from October 20. That is a bounded legal inference, **not** an assertion the amendment became effective on October 20.

## Contract / invariants

The new `FinancialCommitment.financialAmountHistory?` is **optional**, and **only Thacker Pass** is populated in this pilot. It contains an original amount and one conditional amendment **on a single existing loan**. The existing row's canonical `amount`, status histories, issuer, provider, project, stage and all financing relationships are unchanged.

Validation requires original-first, increasing nonoverlapping date windows, same currency, latest amount matching the current amount and source-supported amount evidence per version. Existence without versions is rejected; omission is unreviewed. The pure `financialAmountOn(row, asOf)` emits tagged results `quantified`, `unquantified`, `not_yet_evidenced`, `indeterminate_transition` or `history_unreviewed`. No historical sums, UI consumers or updates to `totalCommitments`; historical amount is **not** cash paid.

For example, legal-standing query on Oct 8 2025: `financialStatusOn` still returns **contracted**, while operative amount returns **indeterminate**, because the amendment was conditional. No chart may treat the exact dollar amount as certified on that date.

The last amount version must match current amount. Sourced amounts use decimal strings and retain qualifier `approximately`. Qualifiers do not silently change to `exact`. An as-of record is reconstructed from **current corpus evidence**, not a claim about what had been publicly known or indexed on that day.

## Guardrails / acceptance

F4-A deliberately does **not** alter the current financial totals, venture/grant/guarantee distinctions, parent-child folding or dashboard; see dedicated tests. Earlier PRs #84 (Rhyolite Ridge) and #85 (Thompson Falls), EXIM monitoring, and design RFC #86 remain independent.

CI must pass exact-head `npm run validate`, `typecheck`, `lint`, full `test`, and `build`. If Vercel is quota-blocked, mark it separately. No merge/deployment without maintainer authorization. Source date and conditional amendment window should receive independent human review before F4-C historical aggregation.
