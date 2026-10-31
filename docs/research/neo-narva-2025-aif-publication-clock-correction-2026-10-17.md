# Neo Narva AIF — source publication clock correction

**October 17, 2026 · source-integrity change only.** Related to F5 pilot issue #110 and the independent unsigned original-source handoff in draft PR #172. This note does not record a human adjudication or source-body checksum.

## Original-document and filing verification

- [Original Neo Performance Materials 2025 Annual Information Form (issuer PDF)](https://www.neomaterials.com/wp-content/uploads/2026/03/NPM-AIF-2026.pdf), **PDF cover p. 1**, prints **MARCH 19, 2026**. The title's **2025** is the reporting fiscal year ended December 31, **not** the document publication date. The `/2026/03/` upload directory establishes the month only, not March 1.
- [Neo's 2026 management information circular](https://www.neomaterials.com/wp-content/uploads/2026/05/NPM-Info-Circular-2026-vSEDAR.pdf), paragraph on Audit Committee, independently identifies the company's prior AIF as **filed on March 19, 2026**. [Neo's March 19 FY2025 results announcement](https://www.neomaterials.com/neo-performance-materials-reports-fourth-quarter-2025-results/) anchors the reporting-day context, not the exact contents of the AIF.
- Registry ID **`src-neo-aif-2026`** previously had **`datePublished: "2026-03-01"`**, with no exact-day evidence. Correct to **`"2026-03-19"`**, preserving registered **`dateAccessed: "2026-10-02"`**. The verified AIF filing day is distinct from the end of the fiscal year it describes, from 2025 grant-accounting dates, and from the repository's own later research/check date.

## Scope and non-inferences

This edit touches **one date field in one registered source record**; it does not add any new source or change content, citation links, issuer title, URL, registered historical access day or confidence tier.

The AIF currently supports the Neo/Narva JTF grant context (approximately EUR 14.8 million and issuer-reported cumulative USD 8.4 million received through year-end 2025). It does **not** retrospectively date a November 2024 grant amendment, create a cash payment on March 19, establish a new award, or date the commencement of permanent-magnet production.

Do not reconcile the existing EUR 14.7M versus approximately EUR 14.8M source-report discrepancy by changing this document clock. The F4 amount-history gate remains unresolved. Do not edit `financialAmountHistory`, `financialStatusHistory`, amount, parent financing, source uses or `site.lastUpdated`.

## Reviewer metadata / provenance impact

The canonical Narva M3 proposed physical claim cites **`src-neo-commercial-production-2026`** with its own September 14 original publisher assertion. The AIF is only a supplemental grant-context source in the finance registry. Under the currently implemented M3 worksheet digest contract, an AIF-only `datePublished` correction **does not change** the canonical Narva production worksheet fingerprint, and that invariant is regression-tested.

This **does not waive fresh contextual source inspection** by the real reviewer. A checksum over the M3 primary proposal and linked finance-status observations is not a checksum of every supplemental document in a financing record, nor proof that issuer-published material was actually authenticated. Existing unsigned decisions remain unsigned; real decisions require a named reviewer and the existing local M3 authority. No private reviewer file is read or published.

## Release verification

- Recheck that the source registry contains 183 entries, only `src-neo-aif-2026.datePublished` changes, and the October 2 registered access date is unchanged.
- Run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` against the **exact PR head**.
- Regression checks cover document clock, preserved finance standing, empty public milestone register and Narva M3 digest parity.
- Release independently of research-only PR #172. Do not import its private gitignored reviewer handoff artifacts, and do not interpret its source-check report as a signature.
