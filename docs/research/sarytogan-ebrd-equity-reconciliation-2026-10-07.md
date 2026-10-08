# Sarytogan Graphite: reconcile EBRD equity with ResourceEU statement

Review date: 2026-10-07. Narrow source-and-capital-integrity tranche. No currency conversion, money attributed to the EU budget, or physical project-status promotion.

## Source hierarchy and factual findings

1. [EBRD announcement of 9 August 2024](https://www.ebrd.com/home/news-and-events/news/2024/ebrd-acquires-stake-in-sarytogan-graphite-limited.html), [EBRD Project 54699](https://www.ebrd.com/home/work-with-us/projects/psd/54699.html): initial direct equity investment of **A$5,000,000**, about **€3 million** in the bank's contemporaneous description, in **Sarytogan Graphite Limited**, an ASX-listed Australian company developing a Kazakh graphite project. The EBRD project lists status Signed but does not date the execution. Project 54699 covers this original financing and does not independently establish the follow-on.
2. [Fasken, counsel to EBRD on the original investment](https://www.fasken.com/en/experience/2025/03/the-european-bank-for-reconstruction-and-development-completes-equity-investment): original A$5 million share investment **closed 10 February 2025**, in two tranches. The law firm's reported share count multiplied by its reported share price does *not* reconcile to its reported total: the ledger trusts the A$5M lender figure, records the closing date from counsel, and does not claim a calculated share total.
3. [Sarytogan ASX announcement of 30 April 2026, reproduced by Market Index](https://www.marketindex.com.au/asx/sga/announcements/14m-funds-received-6A1323055): issuer confirms a **separate** EBRD top-up placement, agreed 6 November 2025, amended 18 November, for **17,457,264 shares at A$0.08**, with **A$1,396,581.12 cash received 30 April 2026** after Kazakh MIC, Australian FIRB and shareholder approvals. The issuer documents an exact cash amount; do not round it to the bank's press shorthand.
4. [EBRD follow-on announcement, 2026](https://www.ebrd.com/home/news-and-events/news/2026/ebrd-increases-stake-in-sarytogan-graphite-limited.html): bank independently identifies a follow-on **about A$1.4M** share investment, raising EBRD ownership to **18.4%**. Intended funds support an upstream definitive feasibility study and other development work, not demonstrated construction or industrial production.
5. [European Commission, RESourceEU, COM(2025) 945, 3 December 2025](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A52025DC0945): reports EBRD equity of **around €3.6M** in Sarytogan as a retrospective project-level description. It gives *no transaction dates or breakdown* explaining the mismatch to the lender's A$5M first tranche and later agreed top-up; in December 2025 the latter placement remained conditional, and its cash would only arrive April 2026. **Do not** equate €3.6M with an exact total of both AUD share placements; do not add it as a third investment or assert an FX reconciliation unsupported by the Commission.

## Changes to the existing seed

- Preserve ID `fin-ebrd-2025-sarytogan-equity` (stable links), but fix **direct recipient** to `Sarytogan Graphite Limited` (`org-sarytogan`); replace Commission's approximate **€3.6M** with lender's exact original **A$5M**.
- Retain contracted status with **unknown** original signing date and add completed/disbursed status at **2025-02-10** based on transaction counsel. Do not backdate a contract to a public press-release date.
- Introduce distinct `fin-ebrd-2026-sarytogan-topup-equity` for precise **A$1,396,581.12** (signed conditional placement 2025-11-06, payment 2026-04-30), same investee and Kazakh project.
- Both transactions are direct EBRD multilateral equity, recorded with `providerJurisdiction: null`. Not EU-budget finance and not attributed to an individual jurisdiction. The parent `evt-eu-resourceeu-2025` is retained as the existing *policy context*, not as a representation that the Commission's December 2025 communication documents April 2026 payment.
- Preserve the existing Sarytogan project stage (mining) as the **intended project**, not evidence of an operational mine. Neither equity investment establishes physical production.
- No parent/child capital relationships between the two investment amounts: the EBRD and investee characterize the latter as **incremental**, not a drawn-from allocation of A$5M. The Commission's approximate euro report is excluded from transaction totals.
- Avoid converting across EUR/AUD or treating the whole EBRD program as funded by a tracked national government.

## Future verification

Watch for an EBRD or Commission formal breakdown explaining the €3.6M wording and revise the narrative only if it supplies explicit transaction or FX attribution. Current public primary sources support two distinct Australian-dollar investments, no third row.
