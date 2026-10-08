# Keliber EIB €150M legal borrower and later €17.5M Natixis signature

**Review date:** 2026-10-07. Source-integrity correction only. No new money and no source-free financing backfill.

## Reader decision

SMPT previously called **Keliber Oy** the recipient of the €150M European Investment Bank loan. The contemporaneous EIB news release does use that corporate name, but the *signed facility agreement* identifies **Keliber Technology Oy** as the borrower and **Keliber Oy** as an Original Guarantor. Loan-attribution and organization funding roles therefore follow the contract. These two names cannot be treated as interchangeable.

## Exact primary-source anchors

1. **Executed contract:** Sibanye Stillwater Limited's Form 6-K of 2025-04-25, Exhibit 4.8, the EIB €150,000,000 Facility Agreement dated 2024-08-20. Cover, "BETWEEN" parties and signatures specify European Investment Bank as Bank; **Keliber Technology Oy as Borrower**; **Keliber Oy as Original Guarantor**. SEC: https://www.sec.gov/Archives/edgar/data/1786909/000178690925000019/a2017-080488685financont.htm (`src-sec-keliber-eib-facility-agreement-2024`).
2. **Public lender announcement:** EIB, 2024-08-23, publicly announces €150M loan to "Keliber Oy" in a €500M total financing package. This is the public-facing group description, not the contract's identification of the borrowing legal entity. https://www.eib.org/en/press/all/2024-313-eu-and-sibanye-stillwater-through-its-keliber-lithium-project-in-finland-join-forces-in-eur150-million-deal-to-improve-eu-access-to-and-resilience-in-battery-materials (`src-eib-keliber-2024`).
3. **EIB official project ledger:** Project 20170804 lists two signatures: €150M on **2024-08-20** and €17.5M on **2024-12-20**, total €167.5M. The ledger does not specify a downstream borrower for the later signing. https://www.eib.org/en/projects/all/20170804 (`src-eib-keliber-project-20170804`).
4. **EIB 2024 lending report:** Finland country table (printed p.15; PDF page 21) lists KELIBER BATTERY GRADE LITHIUM PRODUCTION twice, with **Keliber Technology Oy** opposite **€150.0M** and **Natixis** opposite **€17.5M**. It therefore distinguishes the signature counterparties and cannot justify another €17.5M direct loan to either Keliber legal entity. https://www.eib.org/files/publications/20240236-250825-lending-report-2024-en.pdf (`src-eib-lending-report-2024`).

## Decision and boundaries

- Replace the existing €150M row's `recipient` and `recipientOrgIds` with Keliber Technology Oy, supported by the executed contract, with no change to its amount, signed date, status, project, stages, or terms.
- Update the organization registry and event/project descriptions. Preserve Keliber Oy as its own organization, marked as the original guarantor, not a second borrower.
- **Defer creating a €17.5M financing row.** A signature with Natixis is evidenced, but the EIB sources reviewed do not establish the precise instrument, how it connects to or is supported by the €150M facility, ultimate beneficiary, risk-transfer structure, or whether the additional commitment would overlap existing figures. Adding it today risks claiming €17.5M of additional *direct* Keliber finance without proof.
- Do not misrepresent the €500M total bank/ECA/EIB package as €500M of EIB financing; it includes other providers.
- Pre-merge gate: source-integrity review, validate, typecheck, lint, full tests, build and data diff. Vercel preview may remain unavailable due to deployment rate limiting.

## Future trigger for the deferred transaction

Only reconsider the €17.5M transaction if an EIB contract/register entry, Natixis filing, or similarly direct primary disclosure establishes the exact legal form, relationship to the first €150M signature, recipient and project financing flow. Record it with its real legal parties and a defensible non-overlap treatment, rather than as a second unverified loan to Keliber Oy.
