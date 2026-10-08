# Perpetua parent/operating subsidiary recipient attribution

Review date: 2026-10-07. Narrow entity-integrity correction after the Keliber contract-borrower fix. No new intervention, financing amount, financing row, or project sponsor inference.

## Primary-source facts

1. [EXIM board agenda/minutes of 21 May 2026](https://www.exim.gov/news/minutes/board-meeting-minutes-2026-05-21), Structured & Project Finance Division, transaction AP768324XX: **Borrower/PSOR: Perpetua Resources Idaho Inc.**; **Guarantor: Perpetua Resources Corp.**; **Guaranteed Lender: None (direct loan)**. This is an approved proposed financing, not proof that financing documents or a guarantee were executed (`src-exim-stibnite-board-2026`).
2. [Perpetua Resources Corp. 2025 Form 10-K, signed 31 March 2026](https://www.sec.gov/Archives/edgar/data/1526243/000110465926037403/ppta-20251231x10k.htm), cover, Corporate Structure and financial-statement notes: parent **Perpetua Resources Corp.** is incorporated in British Columbia, Canada. **Perpetua Resources Idaho, Inc. (PRII)** is wholly owned and manages the Stibnite project as its operating entity. **Idaho Gold Resources Company, LLC**, a *different* subsidiary, holds title to the project property. Neither the Canadian parent nor PRII should be coded as direct land-title holder from these facts (`src-sec-perpetua-2025-10k`).
3. Existing SEC sources `src-perpetua-sec-dpa-2022` and `src-perpetua-sec-dotc-2023` identify PRII as the award/OTIA recipient. Existing June 2026 10-Q provenance establishes amounts and lifecycle progression.

## Narrow correction

- Register two distinct legal organizations: `org-perpetua-resources-corp` (Canadian-incorporated parent and **proposed** EXIM guarantor), and `org-perpetua-resources-idaho` (wholly owned operating subsidiary and recipient).
- Link **only** the three existing financial rows to the subsidiary: `fin-us-dod-perpetua-stibnite-dpa`, `fin-us-army-perpetua-antimony-otia`, and `fin-us-exim-perpetua-stibnite-2026`.
- Preserve the amounts ($59.2M DPA ceiling, estimated $27.1M OTIA, and $2.906B EXIM authorization) and their different status ladders; this is an identity fix, not $2.99B newly committed.
- Leave PRII's registry domicile `countryCode` null because these reviewed records establish U.S. operating scope but do not explicitly confirm the subsidiary's state of incorporation.
- Do not add either company as property owner or change project sponsors; PRII's operating role and property title are distinct. Do not infer an executed EXIM loan, guarantee, or disbursement.
- No automated roll-up of subsidiary receipts into the parent: organizational linkage is provenance, not a second financing beneficiary.

Required before merge: data validation, typecheck, lint, full tests, build. A Vercel preview may remain blocked by deployment rate limiting; this branch is never a production deployment.
