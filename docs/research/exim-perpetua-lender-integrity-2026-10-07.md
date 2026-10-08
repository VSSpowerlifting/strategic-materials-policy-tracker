# EXIM Perpetua public-lender identity — isolated provider-integrity review

Review date: 2026-10-07. Narrow legal/organizational attribution correction. No new financing, amounts, status promotion, or recipient changes.

## Primary records

- [EXIM Board of Directors meeting minutes, May 21, 2026](https://www.exim.gov/news/minutes/board-meeting-minutes-2026-05-21), Structured & Project Finance Division, transaction **AP768324XX**, identifies the Export-Import Bank of the United States as the approval authority for a **direct** Stibnite loan of about **US$2.906B**; **Perpetua Resources Idaho Inc.** is the prospective borrower/PSOR and **Perpetua Resources Corp.** its proposed guarantor. The “Guaranteed Lender” field says none because the bank is the lender, not a third-party guarantor.
- [EXIM Project and Structured Finance transactions](https://www.exim.gov/solutions/project-and-structured-finance/transactions) carries the transaction as **Authorized**.
- [Perpetua's 2026 Q2 Form 10-Q](https://www.sec.gov/Archives/edgar/data/1526243/000110465926097134/ppta-20260630x10q.htm), Project Financing from U.S. EXIM, explains that definitive documentation and conditions precedent remained outstanding. This source controls the repo's conservative **decided** status, not contracted or disbursed.

## Correction

- Register `org-us-exim` as a U.S. public financier with explicit lender-identity evidence from the already registered official sources.
- Set `fin-us-exim-perpetua-stibnite-2026.providerOrgIds` to `["org-us-exim"]`. Leave `recipientOrgIds` pointed **only** to `org-perpetua-resources-idaho`.
- Do not modify the US$2.906B amount, existing `decided` status, provider jurisdiction, capital source, instrument or project attribution. Linking EXIM in the provider organization view is not a claim of cash transferred.
- Do not link other broad financing labels to a specific agency without provider evidence: `Just Transition Fund`, `European Union (EU funds)` and Indian `PSUs, etc.` remain provider-unresolved by design.
- The four remaining unlinked `recipient` strings in the source dataset are three Alcoa–Sojitz **project** references, whose exact equity investee is unverified, plus an open statutory class of **CMPTI-eligible corporations**. They are not four newly identified corporate counterparties; do not fabricate recipients or sponsor organizations.

Validation gate: seed validation, typecheck, lint, full test suite, build on the exact branch head. No merge or deployment in the source-trace phase.
