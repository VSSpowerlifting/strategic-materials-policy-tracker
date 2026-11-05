# Inside Tungsten West's £71 Million Restart Financing

Government Capital, Project Expenditure and Refinancing Risk at Hemerdon

## Evidence and methodology appendix

**Research cutoff: 4 November 2026. Production date: 5 November 2026.** Publication-review edition.

## Evidence hierarchy and scope

Audited accounts establish dated consolidated balances. Issuer presentations establish management guidance and claimed milestones. Announcements establish the described transaction status at their date. A filed security deed establishes documentary terms, subject to its scope. Analyst arithmetic and scenarios are explicitly identified. Neither disclosure nor source verification independently validates forecast operating outcomes.

## Financial classifications

| Term | Treatment |
|---|---|
| Equity | Gross subscription is transaction financing. Net bank credit requires fees and payment reconciliation. Equity is residual risk capital, with ownership consequences. |
| Core loan | Commitment, effective facility, drawdown and current principal are separate statuses. Full £25m draw disclosed by 2 September does not establish November principal. |
| Accordion | £10m uncommitted additional debt capacity. No default availability or receipt assumed. |
| Restricted cash | £14,912,042 escrow at 31 March is separately restricted and excluded from general-use cash. |
| Receipts | The August £15m is anticipated operating receipts, not financing or collected cash. |
| Remaining spend | October £40–45m project guidance excludes opex. Do not add to overlapping August uses. |
| Non-cash accounting | CLN conversion and fair-value remeasurement do not fund construction or measure cash burn. |

## Model reconciliation and scenarios

Exhibits use the publication workbook, an unchanged copy of the Phase 1B accepted model. `publication-exhibits.json` records the controlling workbook hash, output values, cells and source aliases. `build_publication.py` derives and asserts the four principal results using cached workbook values and independent arithmetic. The independent validator recalculates disposable copies.

| Finding | Derivation | Workbook |
|---|---|---|
| A | £36m equity + £25m core = £61m. Add £10m uncommitted = £71m headline. | Funding D8:D12 |
| B | (£40m + £45m) / 2 = £42.5m reference convention. | Funding D16:D17, Base |
| C | (£45m − £42.5m) + £3m + 1% × £25m × one year = £5.75m. Analyst combined stress. | Funding D18:D21, Downside |
| D | £88m − £15m − (£88m − £13m) = −£2m. Detailed rounded uses £87m instead imply −£1m. | August plan D35:D37, receipts factor 0 |

The August reserve-target shortfall is £15m. The ending cash deficit on stated totals is £2m. These metrics differ. The rounded £1m difference is retained, not plugged. The original peak date is unspecified. No current deficit is inferred.

The £5.75m stress and August receipt counterfactual have different bases and must not be added. The rate proxy assumes constant principal and one year. It does not reconstruct contractual pricing or fees. Upside uses £40m project spend, Base £42.5m, Downside £45m. The producer floors incremental stress at zero, so the Upside output is zero rather than negative cash generation. The £2.5m reduction in spending remains visible in the spend comparison.

## Operating metric definitions

The FY2028 core cash reference is £70–75m opex/sustaining capex + approximately £6m equipment service + approximately £26m NWF service + £7m Hargreaves = £109–114m. Midpoint is £111.5m. This is a selected annual cash reference, not CFADS or a monthly liquidity forecast.

Tungsten receipt coefficient = 3,300 tonnes × 100 mtu/tonne × 79.5% payability × (1 − 3% modeled deduction) = 254,479.5. A metric tonne unit (mtu) represents 10 kg of WO3. Output is contained WO3, not tungsten metal. The 3,300-tonne reference is below issuer guidance of more than 3,300 tonnes. At fixed coefficients, a £100/mtu GBP APT-reference change moves annual receipts proxy by £25,447,950.

Core coverage = core cash reference / receipt coefficient, producing £428.33/£438.15/£447.97 per mtu. Tin and aggregate receipts, restart capex, growth, taxes and working capital are excluded. Missing items work in both directions. This is neither total break-even nor a conservative bound. Contract-specific coefficients require confirmation. No forward commodity price, FX forecast or executed Elmet price is assumed.

## Unavailable disclosures and publication boundaries

Current unrestricted cash, current aggregate debt, a complete funding gap, valuation, NPV/IRR, DSCR, covenant headroom, repayment sufficiency and default probability remain unavailable. See the Phase 1B information-request checklist. Priorities are a bank-reconciled post-March cash ledger, an unpaid capex ledger, executed loan terms, equipment-debt reconciliation and monthly production-to-collection forecasts.

The loan tenor origin differs between announcement and accounts. The security deed does not name NWF or settle maturity, priority or enforceability. April equipment agreement and October current/ordered amounts are not added. Prospective option funding is not treated as bank cash. A £6,104 historical lease-payment presentation difference remains open for any future contractual debt-service bridge.

## Source rights and review

This package contains original analysis and limited factual paraphrase, with hyperlinks to underlying sources. It redistributes no source PDFs, AMC tables or proprietary benchmark series. The AMC executive summary is indexed for rights awareness and contributes no restricted tables or model inputs. Public accessibility is not a redistribution licence. Source-specific rights clearance and independent human finance/editorial approval remain release gates. Role-based skeptical review in the QC report is an AI second pass, not an independent human sign-off.

## Publication source aliases

- **S1** — [Annual Report and Accounts 2026](https://cdn.prod.website-files.com/69d6c3cf43485ab7fac9a296/6a995da54cb744f81ed2b6f3_Tungsten%20West%20Plc%20-%202026%20Audit%20Signed%20Accounts.pdf). Tungsten West plc. Published 2026-09-03. Canonical ID `hfs-tw-ar2026`.
- **S2** — [Unlocking Hemerdon: Corporate Presentation October 2026](https://cdn.prod.website-files.com/69d6c3cf43485ab7fac9a296/6acd6cb2e4f003daa6f036a1_TW_Corporate_Presentation_Oct2026_Master.pdf). Tungsten West plc. Published 2026-10-13. Canonical ID `hfs-tw-oct2026`.
- **S3** — [National Wealth Fund backs Tungsten West to unlock critical UK tungsten supply](https://www.nationalwealthfund.org.uk/news-and-publications/news/national-wealth-fund-backs-tungsten-west-to-unlock-critical-uk-tungsten-supply/). National Wealth Fund. Published 2026-08-25. Canonical ID `src-nwf-tungsten-west-2026`.
- **S4** — [Strategic Investment by the UK Government National Wealth Fund, RNS9611R](https://www.lse.co.uk/rns/strategic-investment-by-the-uk-government-nwf-yqliknoaeuaxugf.html). Tungsten West plc. Published 2026-08-25. Canonical ID `hfs-nwf-terms`.
- **S5** — [Short-Term Loan Repayment](https://www.investegate.co.uk/index.php/announcement/rns/tungsten-west--tun/short-term-loan-repayment/9745287). Tungsten West plc. Published 2026-08-28. Canonical ID `hfs-bridge-repaid`.
- **S6** — [Processing operations commence during visit by NWF, RNS7152U](https://www.lse.co.uk/rns/processing-operations-commence-during-visit-by-nwf-tc6mhjidfgjazfe.html?mobile_view=desktop). Tungsten West plc. Published 2026-09-15. Canonical ID `hfs-processing`.
- **S7** — [Strategic Tungsten Supply and Offtake Agreement with The Elmet Group, RNS 8695V](https://data.fca.org.uk/artefacts/NSM/RNS/5863657b-8c2a-4537-999f-c7e5ee92f995.html). Tungsten West plc. Published 2026-09-23. Canonical ID `hfs-elmet-rns`.
- **S8** — [DRL charge118544670005 and executed group security agreement](https://find-and-update.company-information.service.gov.uk/company/11854467/filing-history/MzU0MTkxODI3NGFkaXF6a2N4/document?format=pdf&download=0). Companies House; instrument executed by group chargors and GLAS. Published date not established. Canonical ID `hfs-group-security-2026`.
- **S9** — [Q1 2026 Project Update, RNS5416Z](https://data.fca.org.uk/artefacts/NSM/RNS/4f5dac34-61c4-449e-a77a-80de4a3011ad.html). Tungsten West plc. Published 2026-04-08. Canonical ID `hfs-tw-apr2026`.
- **S10** — [Q1 2026 Project Funding and Debt Update](https://www.investegate.co.uk/index.php/announcement/rns/tungsten-west--tun/q1-2026-project-funding-and-debt-update-/9579011). Tungsten West plc. Published 2026-05-21. Canonical ID `hfs-tw-may2026`.

Locators: S1 printed pp29,33–38,53–57,64 (PDF page = printed +2). S2 slides4,15,20,22–23,33. S3 announcement body. S4 Debt Facility, Relationship Agreement and Sources and Uses appendix. S5 announcement body. S6 processing announcement body. S7 highlights and Further information. S8 PDF pp3–4,7–9,38,42. S9 project funding/equipment update. S10 funding update. Claim-specific locators below control over this summary.

## Complete source register

### hfs-tw-ar2026
[Annual Report and Accounts 2026](https://cdn.prod.website-files.com/69d6c3cf43485ab7fac9a296/6a995da54cb744f81ed2b6f3_Tungsten%20West%20Plc%20-%202026%20Audit%20Signed%20Accounts.pdf)
Issuer: Tungsten West plc. Type: audited_annual_report. Published: 2026-09-03. Accessed: 2026-11-04.
Publicly accessible, copyright retained by issuer. Link and limited factual extraction only; no raw document redistributed.

### hfs-tw-ar2025
[Financial Results for year ended 31 March 2025](https://cdn.prod.website-files.com/69d6c3cf43485ab7fac9a296/69e761e31f4c3f45660f99f0_Financial%20Results%20for%20year%20ended%2031%20March%202025.pdf)
Issuer: Tungsten West plc. Type: audited_annual_report. Published: 2025-09-04. Accessed: 2026-11-04.
Publicly accessible, copyright retained by issuer. Link and limited factual extraction only; no raw document redistributed.

### hfs-tw-oct2026
[Unlocking Hemerdon: Corporate Presentation October 2026](https://cdn.prod.website-files.com/69d6c3cf43485ab7fac9a296/6acd6cb2e4f003daa6f036a1_TW_Corporate_Presentation_Oct2026_Master.pdf)
Issuer: Tungsten West plc. Type: investor_presentation. Published: 2026-10-13. Accessed: 2026-11-04.
Publicly accessible, copyright retained by issuer. Link and limited factual extraction only; no raw document redistributed.

### src-nwf-tungsten-west-2026
[National Wealth Fund backs Tungsten West to unlock critical UK tungsten supply](https://www.nationalwealthfund.org.uk/news-and-publications/news/national-wealth-fund-backs-tungsten-west-to-unlock-critical-uk-tungsten-supply/)
Issuer: National Wealth Fund. Type: government_announcement. Published: 2026-08-25. Accessed: 2026-11-04.
Publicly accessible, copyright retained by issuer. Link and limited factual extraction only; no raw document redistributed.

### hfs-tw-investors
[Investor relations and AIM Rule 26](https://www.tungstenwest.com/investors)
Issuer: Tungsten West plc. Type: issuer_website. Published: 2026-10-01. Accessed: 2026-11-04.
Publicly accessible, copyright retained by issuer. Link and limited factual extraction only; no raw document redistributed.

### hfs-mayer-nwf
[Mayer Brown advises Tungsten West on strategic investment by NWF](https://www.mayerbrown.com/en/news/2026/09/mayer-brown-advises-tungsten-west-on-strategic-investment-by-the-uk-governments-national-wealth-fund-in-the-hemerdon-tungsten-tin-project)
Issuer: Mayer Brown. Type: transaction_adviser_release. Published: 2026-09-04. Accessed: 2026-11-04.
Publicly accessible, copyright retained by issuer. Link and limited factual extraction only; no raw document redistributed.

### hfs-elmet-rns
[Strategic Tungsten Supply and Offtake Agreement with The Elmet Group, RNS 8695V](https://data.fca.org.uk/artefacts/NSM/RNS/5863657b-8c2a-4537-999f-c7e5ee92f995.html)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-09-23. Accessed: 2026-11-04.
Issuer RNS text in FCA NSM. RNS distribution terms and jurisdiction restrictions apply. Facts paraphrased; no full text republished.

### hfs-bridge-repaid
[Short-Term Loan Repayment](https://www.investegate.co.uk/index.php/announcement/rns/tungsten-west--tun/short-term-loan-repayment/9745287)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-08-28. Accessed: 2026-11-04.
Issuer RNS text on third-party host. Only announcement body read, AI summary excluded. RNS and host distribution terms apply.

### hfs-fs2025
[Hemerdon Feasibility Study executive summary, AMC 0424083](https://cdn.prod.website-files.com/69d6c3cf43485ab7fac9a296/69e75d33346a12940781167a_Tungsten%20West%20Feasability%20Study%20-%20August%202025.pdf)
Issuer: AMC Consultants for Tungsten West. Type: technical_study_summary. Published: 2025-08-04. Accessed: 2026-11-04.
PDF p. ii expressly restricts disclosure, copying, quotation and publication without AMC consent. Metadata and restrictions indexed. No tables or operating model inputs reproduced from this document. Obtain consent before reuse.

### hfs-gm-feb2026
[Notice of General Meeting February 2026](https://cdn.prod.website-files.com/69d6c3cf43485ab7fac9a296/69e015653060e7f863ce0344_Notice%20of%20General%20Meeting%2C%20February%202026.pdf)
Issuer: Tungsten West plc. Type: shareholder_circular. Published: 2026-02-09. Accessed: 2026-11-04.
Publicly accessible, copyright retained by issuer. Link and limited factual extraction only; no raw document redistributed.

### hfs-nwf-terms
[Strategic Investment by the UK Government National Wealth Fund, RNS9611R](https://www.lse.co.uk/rns/strategic-investment-by-the-uk-government-nwf-yqliknoaeuaxugf.html)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-08-25. Accessed: 2026-11-04.
Issuer RNS on London South East mirror, not London Stock Exchange. RNS distribution and jurisdiction restrictions apply. Limited paraphrased factual extraction, no full text redistribution.

### hfs-processing
[Processing operations commence during visit by NWF, RNS7152U](https://www.lse.co.uk/rns/processing-operations-commence-during-visit-by-nwf-tc6mhjidfgjazfe.html?mobile_view=desktop)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-09-15. Accessed: 2026-11-04.
Issuer RNS on London South East mirror, not London Stock Exchange. RNS distribution and jurisdiction restrictions apply. Limited paraphrased factual extraction, no full text redistribution.

### hfs-issuer-rns-index
[Issuer-embedded regulatory announcement index](https://irtools.co.uk/tools/news/08d178d7-60ce-4bb7-b141-d4dbedca9f9a)
Issuer: Tungsten West plc. Type: announcement_index. Published: unknown / not applicable. Accessed: 2026-11-04.
Publicly accessible original disclosure. Copyright and RNS distribution terms may apply. Limited factual extraction only; no raw source redistributed.

### hfs-tw-apr2026
[Q1 2026 Project Update, RNS5416Z](https://data.fca.org.uk/artefacts/NSM/RNS/4f5dac34-61c4-449e-a77a-80de4a3011ad.html)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-04-08. Accessed: 2026-11-04.
Publicly accessible original disclosure. Copyright and RNS distribution terms may apply. Limited factual extraction only; no raw source redistributed.

### hfs-tw-may2026
[Q1 2026 Project Funding and Debt Update](https://www.investegate.co.uk/index.php/announcement/rns/tungsten-west--tun/q1-2026-project-funding-and-debt-update-/9579011)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-05-21. Accessed: 2026-11-04.
Publicly accessible original disclosure. Copyright and RNS distribution terms may apply. Limited factual extraction only; no raw source redistributed.

### hfs-group-security-2026
[DRL charge118544670005 and executed group security agreement](https://find-and-update.company-information.service.gov.uk/company/11854467/filing-history/MzU0MTkxODI3NGFkaXF6a2N4/document?format=pdf&download=0)
Issuer: Companies House; instrument executed by group chargors and GLAS. Type: official_filing. Published: unknown / not applicable. Accessed: 2026-11-04.
Companies House public filing. Original company/security-document rights retained. Metadata and short factual paraphrases only; no raw filing redistributed.

### hfs-options-sep16
[Exercise of Options & TVR](https://cdn.irtools.co.uk/pdf/bad3ab88-c3ab-48a0-96c3-04827000d01f.pdf)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-09-16. Accessed: 2026-11-04.
Publicly accessible original disclosure. Copyright and RNS distribution terms may apply. Limited factual extraction only; no raw source redistributed.

### hfs-options-sep24
[Exercise of Options & TVR](https://cdn.irtools.co.uk/pdf/8821ae8e-9d27-4632-ac8f-538f2274a1a0.pdf)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-09-24. Accessed: 2026-11-04.
Publicly accessible original disclosure. Copyright and RNS distribution terms may apply. Limited factual extraction only; no raw source redistributed.

### hfs-options-oct1
[Exercise of Options & TVR](https://cdn.irtools.co.uk/pdf/f9c0c2dd-c65f-4353-adb4-7444f931422b.pdf)
Issuer: Tungsten West plc. Type: regulatory_announcement. Published: 2026-10-01. Accessed: 2026-11-04.
Publicly accessible original disclosure. Copyright and RNS distribution terms may apply. Limited factual extraction only; no raw source redistributed.

### hfs-oct-presentation-release
[Corporate Presentation](https://cdn.irtools.co.uk/pdf/5a89fa6a-e710-45aa-8ae6-9a693da00af3.pdf)
Issuer: Tungsten West plc. Type: non_regulatory_announcement. Published: 2026-10-13. Accessed: 2026-11-04.
Publicly accessible original disclosure. Copyright and RNS distribution terms may apply. Limited factual extraction only; no raw source redistributed.

## Claim to source and model input ledger

The following entries are generated directly from the accepted 158-record evidence register. Values retain original units and nulls. Full qualifiers remain in the canonical JSON; no numerical records are retyped.

### hfi-revenue-2025 — Revenue FY2025
Value: `0` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.33 income statement; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-revenue-2026 — Revenue FY2026
Value: `601550` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.33 income statement; PDF page is printed page + 2.
Interpretation:

### hfi-operating-loss-2025 — Operating loss FY2025
Value: `-19013454` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.33 income statement; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-operating-loss-2026 — Operating loss FY2026
Value: `-7905318` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.33 income statement; PDF page is printed page + 2.
Interpretation:

### hfi-net-loss-2025 — Net loss FY2025
Value: `-24693013` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.33 income statement; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-net-loss-2026 — Net loss FY2026
Value: `-175446271` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.33 income statement; PDF page is printed page + 2.
Interpretation:

### hfi-cash-2025 — Cash FY2025
Value: `18442` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; note 22; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-cash-2026 — Cash FY2026
Value: `25485511` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; note 22; PDF page is printed page + 2.
Interpretation:

### hfi-escrow-2025 — Escrow FY2025
Value: `14633857` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34; note 20; note 37 p.66; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-escrow-2026 — Escrow FY2026
Value: `14912042` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34; note 20; note 37 p.66; PDF page is printed page + 2.
Interpretation: Escrow excluded from general-use cash.

### hfi-assets-2025 — Assets FY2025
Value: `31887582` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-assets-2026 — Assets FY2026
Value: `72200212` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation:

### hfi-liabilities-2025 — Liabilities FY2025
Value: `36321742` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-liabilities-2026 — Liabilities FY2026
Value: `13931476` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation:

### hfi-equity-2025 — Equity FY2025
Value: `-4434160` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-equity-2026 — Equity FY2026
Value: `58268736` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation:

### hfi-current-assets-2025 — Current assets FY2025
Value: `3035164` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-current-assets-2026 — Current assets FY2026
Value: `38089767` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation:

### hfi-current-liabilities-2025 — Current liabilities FY2025
Value: `27340624` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-current-liabilities-2026 — Current liabilities FY2026
Value: `4753069` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.34 financial position; PDF page is printed page + 2.
Interpretation:

### hfi-borrowings-current-2025 — Borrowings current FY2025
Value: `24770575` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.55 note 25; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-borrowings-current-2026 — Borrowings current FY2026
Value: `104727` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.55 note 25; PDF page is printed page + 2.
Interpretation:

### hfi-borrowings-noncurrent-2025 — Borrowings noncurrent FY2025
Value: `1870366` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.55 note 25; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-borrowings-noncurrent-2026 — Borrowings noncurrent FY2026
Value: `1742223` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.55 note 25; PDF page is printed page + 2.
Interpretation:

### hfi-operating-cashflow-2025 — Operating cashflow FY2025
Value: `-8078462` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-operating-cashflow-2026 — Operating cashflow FY2026
Value: `-15058419` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-investing-cashflow-2025 — Investing cashflow FY2025
Value: `-16285` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-investing-cashflow-2026 — Investing cashflow FY2026
Value: `-5334869` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-financing-cashflow-2025 — Financing cashflow FY2025
Value: `6531654` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-financing-cashflow-2026 — Financing cashflow FY2026
Value: `45860357` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-cash-change-2025 — Cash change FY2025
Value: `-1563093` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-cash-change-2026 — Cash change FY2026
Value: `25467069` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-ppe-cash-2025 — Ppe cash FY2025
Value: `-19885` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-ppe-cash-2026 — Ppe cash FY2026
Value: `-5633715` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-equity-net-2025 — Equity net FY2025
Value: `16572` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-equity-net-2026 — Equity net FY2026
Value: `41029253` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-cln-cash-2025 — Cln cash FY2025
Value: `6751000` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-cln-cash-2026 — Cln cash FY2026
Value: `5205000` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-cln-close-2025 — Cln close FY2025
Value: `24683100` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.57 note 25; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-cln-close-2026 — Cln close FY2026
Value: `0` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.57 note 25; PDF page is printed page + 2.
Interpretation:

### hfi-cln-fair-value-2025 — Cln fair value FY2025
Value: `6346879` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.57 note 25; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-cln-fair-value-2026 — Cln fair value FY2026
Value: `167324341` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.57 note 25; PDF page is printed page + 2.
Interpretation: Non-cash remeasurement, not cash burn.

### hfi-cln-conversion-2025 — Cln conversion FY2025
Value: `2000` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.57 note 25; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-cln-conversion-2026 — Cln conversion FY2026
Value: `197212441` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.57 note 25; PDF page is printed page + 2.
Interpretation: Non-cash debt conversion, not new cash financing.

### hfi-interest-paid-2025 — Interest paid FY2025
Value: `-5766` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-interest-paid-2026 — Interest paid FY2026
Value: `-155154` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-lease-payment-2025 — Lease payment FY2025
Value: `-198279` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-lease-payment-2026 — Lease payment FY2026
Value: `-212345` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-hire-payment-2025 — Hire payment FY2025
Value: `-31873` GBP. Classification: Reported. Period: FY ended 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation: FY2025 is the restated comparative in FY2026 accounts.

### hfi-hire-payment-2026 — Hire payment FY2026
Value: `-6397` GBP. Classification: Reported. Period: FY ended 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36 cash flows; PDF page is printed page + 2.
Interpretation:

### hfi-cash-open-2025 — Opening unrestricted cash FY2025
Value: `1581535` GBP. Classification: Reported. Period: 2024-04-01. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.36, PDF p.38.
Interpretation:

### hfi-equity-gross-feb2026 — February 2026 equity gross
Value: `43000000` GBP. Classification: Reported. Period: February 2026. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p.11 and note 2 p.37.
Interpretation: Directors report p.25 also uses approximately £44m. Use exact net cash £41,029,253 in cash reconciliations; do not derive precise fees from rounded gross.

### hfi-nwf-equity — NWF equity subscription gross
Value: `36000000` GBP. Classification: Reported. Period: As disclosed in source. Scope: corporate_financing.
Source IDs: src-nwf-tungsten-west-2026. Locator: Opening financing paragraphs.
Interpretation: Not project revenue or unrestricted cash at cutoff. Auditor p.29 describes bank verification of funding proceeds.

### hfi-nwf-loan — NWF core loan drawn
Value: `25000000` GBP. Classification: Reported. Period: As disclosed in source. Scope: corporate_financing.
Source IDs: hfs-tw-ar2026. Locator: Printed pp.37,65; PDF pp.39,67.
Interpretation: Drawn in full by accounts approval 2026-09-02; cutoff outstanding balance not independently confirmed.

### hfi-nwf-accordion — NWF uncommitted accordion
Value: `10000000` GBP. Classification: Reported. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: No committed liquidity or draw assumed.

### hfi-nwf-package — NWF package headline
Value: `71000000` GBP. Classification: Reported. Period: As disclosed in source. Scope: corporate_financing.
Source IDs: src-nwf-tungsten-west-2026. Locator: Opening paragraphs.
Interpretation: Parent envelope; never add to its equity and loan components.

### hfi-nwf-tenor — NWF tenor from drawdown
Value: `366` days. Classification: Reported. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: Accounts printed p.38 says 366 days from drawdown; initial RNS says from definitive agreement. October slide33 states 366 days without start. Exact maturity unresolved.

### hfi-nwf-margin — NWF initial margin
Value: `0.055` fraction. Classification: Reported. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: SONIA plus margin; presentation only, executed facility not obtained.

### hfi-nwf-step — NWF quarterly interest step
Value: `0.01` fraction. Classification: Reported. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: Plus one percentage point per quarter. No exact day-count/compounding mechanics obtained.

### hfi-fleet-current — Equipment finance current amount
Value: `11000000` GBP. Classification: Reported. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: October management snapshot; not March balance-sheet debt.

### hfi-fleet-ordered — Equipment finance machines ordered
Value: `22000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: Incremental versus included scope of current amount requires contract confirmation; not summed as debt outstanding.

### hfi-fleet-term-min — Equipment finance term lower bound
Value: `3` years. Classification: Reported. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: 3–5 years; security over financed equipment.

### hfi-fleet-term-max — Equipment finance term upper bound
Value: `5` years. Classification: Reported. Period: October 2026 snapshot. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: Rate margin over GBP IRS at commissioning, approximately 10% all-in per issuer.

### hfi-remaining-low — Remaining project spend lower guidance
Value: `40000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Excludes cost of operations. Timing within October not specified.

### hfi-remaining-high — Remaining project spend upper guidance
Value: `45000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Excludes cost of operations. No bridge to cash or committed financing supplied.

### hfi-fy27-low — FY2027 remaining spend lower guidance
Value: `25000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Financial year ending March 2027; FY2028 is balance.

### hfi-fy27-high — FY2027 remaining spend upper guidance
Value: `35000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Financial year ending March 2027.

### hfi-capex-rebuild — Original restart scope forecast
Value: `67000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Forecast total, excludes cost of operations.

### hfi-capex-mining — Mining equipment forecast
Value: `33000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Contains equipment-financed capital; do not treat as all cash remaining.

### hfi-capex-property — Property bonds commitments forecast
Value: `18000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Forecast total.

### hfi-capex-expansion — Expansion and improvements forecast
Value: `16000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Changed scope; not comparable with original study on a like-for-like basis.

### hfi-capex-total — Total project forecast
Value: `134000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Forecast total versus £122m budget; £12m variance is not all execution overrun.

### hfi-capex-budget — Total project budget
Value: `122000000` GBP. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 20.
Interpretation: Published October comparison basis.

### hfi-wo3-fy28 — FY2028 contained WO3 lower guidance
Value: `3300` tonnes_WO3. Classification: Guidance. Period: FY ending 2028-03-31. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 23.
Interpretation: 3300+ disclosed; model uses 3300 as conservative volume reference, not precise forecast.

### hfi-tin-fy28 — FY2028 contained tin lower guidance
Value: `600` tonnes_Sn. Classification: Guidance. Period: FY ending 2028-03-31. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 23.
Interpretation: 600+; tin price/FX not supplied to model.

### hfi-payability — WO3 payability from FS25
Value: `0.795` fraction. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 22.
Interpretation: FS25 coefficient carried into illustrative FY2028 coverage calculation. Elmet contract-specific formula is unavailable.

### hfi-royalty — Metal royalties and sales cost
Value: `0.03` fraction. Classification: Guidance. Period: October 2026 snapshot. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slides 22–23.
Interpretation: Applied to payable tungsten revenue in illustrative coverage metric. Contract base requires confirmation.

### hfi-opex-low — FY2028 cash opex plus sustaining capex low
Value: `70000000` GBP. Classification: Guidance. Period: FY ending 2028-03-31. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 23 footnote 1.
Interpretation: Excludes £7m Hargreaves termination. Do not subtract sustaining capital twice.

### hfi-opex-high — FY2028 cash opex plus sustaining capex high
Value: `75000000` GBP. Classification: Guidance. Period: FY ending 2028-03-31. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 23 footnote 1.
Interpretation: Company estimate; excludes taxes, working-capital bridge and optional growth.

### hfi-fleet-service — FY2028 fleet principal plus interest
Value: `6000000` GBP. Classification: Guidance. Period: FY ending 2028-03-31. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 23.
Interpretation: Separate from cash operating costs; no amortisation schedule available.

### hfi-nwf-service — FY2028 NWF principal plus interest
Value: `26000000` GBP. Classification: Guidance. Period: FY ending 2028-03-31. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide 23.
Interpretation: Company approximate fiscal-year cash guidance; not an independently built total-life interest calculation.

### hfi-hargreaves — FY2028 Hargreaves termination payment
Value: `7000000` GBP. Classification: Guidance. Period: FY ending 2028-03-31. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 23 footnote 1.
Interpretation: Excluded from cash opex guidance; included once in coverage requirement.

### hfi-growth-low — FY2028 discretionary new growth low
Value: `20000000` GBP. Classification: Guidance. Period: FY ending 2028-03-31. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 23 footnote 2.
Interpretation: Non-committed projects beyond slide20; excluded from core coverage requirement.

### hfi-growth-high — FY2028 discretionary new growth high
Value: `40000000` GBP. Classification: Guidance. Period: FY ending 2028-03-31. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide 23 footnote 2.
Interpretation: Planned operating cash funding is guidance, not committed liquidity.

### hfi-delay-cost — Three-month crushing delay incremental opex
Value: `3000000` GBP. Classification: Guidance. Period: As disclosed in source. Scope: project.
Source IDs: hfs-tw-ar2026. Locator: Printed p.38, PDF p.40, going concern.
Interpretation: Company sensitivity, fallback crushing route. Not uniform monthly corporate burn.

### hfi-delay-months — Delay duration in company sensitivity
Value: `3` months. Classification: Guidance. Period: As disclosed in source. Scope: project.
Source IDs: hfs-tw-ar2026. Locator: Printed p.38, PDF p.40.
Interpretation: Applied once in downside incremental stress; not asserted to occur in FY2028.

### hfi-elmet-volume — Elmet annual contracted contained WO3
Value: `1000` tonnes_WO3. Classification: Reported. Period: As disclosed in source. Scope: project.
Source IDs: hfs-elmet-rns. Locator: Highlights; Further information.
Interpretation: Eight-year agreement. Variable APT-linked pricing; no price floor or guaranteed revenue disclosed.

### hfi-elmet-years — Elmet contract term
Value: `8` years. Classification: Reported. Period: As disclosed in source. Scope: project.
Source IDs: hfs-elmet-rns. Locator: Further information.
Interpretation: No delivery start date or collection schedule inferred.

### hfi-elmet-option — Elmet additional processing endeavour
Value: `500` tonnes_WO3. Classification: Reported. Period: As disclosed in source. Scope: project.
Source IDs: hfs-elmet-rns. Locator: Further information.
Interpretation: Commercially reasonable endeavours, subject to commercial/delivery terms. Not firm additional sales.

### hfi-ordinary — Ordinary shares October snapshot
Value: `1355958899` shares. Classification: Reported. Period: October 2026 snapshot. Scope: shareholder.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: October snapshot; founders options expected expiry in October makes fully diluted cutoff number unverified.

### hfi-b-shares — Non-voting B shares October snapshot
Value: `257075833` shares. Classification: Reported. Period: October 2026 snapshot. Scope: shareholder.
Source IDs: hfs-tw-oct2026. Locator: Slide 33.
Interpretation: Both share classes relevant to economic ownership.

### hfi-nwf-shares — Ordinary shares subscribed by NWF
Value: `100000000` shares. Classification: Reported. Period: As disclosed in source. Scope: shareholder.
Source IDs: hfs-mayer-nwf. Locator: Transaction paragraph.
Interpretation: No modeled additional equity issue or share-price forecast.

### hfi-cutoff-cash — Unrestricted cash at research cutoff
Value: `None` GBP. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: No complete post-March cash rollforward obtained.

### hfi-remaining-gap — Current net project funding gap
Value: `None` GBP. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: Requires same-date cash, remaining uses, costs, draw/repayment schedule and ring-fencing.

### hfi-sonia — Applicable daily SONIA path
Value: `None` fraction. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: No verified daily contractual benchmark series used.

### hfi-apt-fx — USD per GBP conversion for forecast
Value: `None` USD_per_GBP. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: No independent future exchange-rate assumption adopted.

### hfi-realized-apt — Future realized APT reference price
Value: `None` GBP_per_mtu. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: No independent commodity forecast adopted.

### hfi-tax-wc — FY2028 cash taxes and working capital
Value: `None` GBP. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: Full forecast tax, inventory, receivables and collection timing unavailable.

### hfi-draw-date — NWF exact drawdown date
Value: `None` date. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: Full draw by 2 September; exact start and maturity date not obtained.

### hfi-covenants — NWF covenant thresholds and cure rights
Value: `None` text. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: Executed agreement not obtained.

### hfi-npv — Independent project NPV
Value: `None` GBP. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: Updated dated life-of-mine cash flows and fiscal assumptions missing.

### hfi-irr — Independent project IRR
Value: `None` fraction. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: Updated project cash-flow schedule unavailable.

### hfi-dscr — Lender DSCR
Value: `None` ratio. Classification: Unavailable. Period: 2026-11-04. Scope: group.
Source IDs: Analyst convention / missing disclosure. Locator: Evidence gap.
Interpretation: No CFADS definition, covenant or scheduled debt service periods obtained.

### hfi-legal — Legal entity and listing
Value: `Tungsten West plc, company 11310159, AIM:TUN` text. Classification: Reported. Period: Page update 2026-10-01. Scope: corporate.
Source IDs: hfs-tw-investors. Locator: AIM Rule 26.
Interpretation:

### hfi-drl — Operating subsidiary
Value: `Drakelands Restoration Limited 11854467, 100% owned` text. Classification: Reported. Period: 2026-03-31. Scope: corporate.
Source IDs: hfs-tw-ar2026. Locator: Printed p.53 note19; PDF p.55.
Interpretation: Direct ownership of DRL marked by single asterisk. Two other subsidiaries have 100% group ownership; direct parent not specified by note.

### hfi-going-concern — Going concern conclusion
Value: `Directors adopt going concern basis; prior year material uncertainty changed after financing` text. Classification: Reported. Period: Approved 2026-09-02. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed pp.29,37–38; PDF pp.31,39–40.
Interpretation: Auditor supports appropriateness of basis, not assurance guidance or repayment capacity will be achieved.

### hfi-nwf-security — NWF security
Value: `Fixed and floating debenture` text. Classification: Reported. Period: October2026. Scope: corporate_financing.
Source IDs: hfs-tw-oct2026. Locator: Slide33.
Interpretation: Security priority, guarantors and covenant definitions unavailable.

### hfi-bridge-status — May 2026 short-term facility
Value: `Repaid in full; NWF debt facility effective` text. Classification: Reported. Period: 2026-08-28. Scope: corporate_financing.
Source IDs: hfs-bridge-repaid. Locator: Announcement body, first two paragraphs.
Interpretation: Repayment amount and currency conversion not established from this release.

### hfi-capex-rebuild-budget — Original restart scope budget
Value: `72000000` GBP. Classification: Guidance. Period: October2026 project forecast. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide20.
Interpretation:

### hfi-capex-mining-budget — Mining equipment budget
Value: `36000000` GBP. Classification: Guidance. Period: October2026 project forecast. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide20.
Interpretation:

### hfi-capex-property-budget — Property bonds commitments budget
Value: `12000000` GBP. Classification: Guidance. Period: October2026 project forecast. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide20.
Interpretation:

### hfi-capex-expansion-budget — Expansion improvements budget
Value: `2000000` GBP. Classification: Guidance. Period: October2026 project forecast. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide20.
Interpretation:

### hfi-original-assets-2025 — FY2025 assets before restatement
Value: `34065367` GBP. Classification: Reported. Period: 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2025. Locator: Printed p.34, PDF p.34.
Interpretation: Superseded by FY2026 comparative for model history.

### hfi-original-equity-2025 — FY2025 equity before restatement
Value: `-520408` GBP. Classification: Reported. Period: 2025-03-31. Scope: group.
Source IDs: hfs-tw-ar2025. Locator: Printed p.34, PDF p.34.
Interpretation: Superseded by FY2026 comparative for model history.

### hfi-core-nwf-total — Gross NWF equity plus core loan
Value: `61000000` GBP. Classification: Derived. Period: August2026 financing. Scope: corporate_financing.
Source IDs: Analyst convention / missing disclosure. Locator: Funding!D10.
Interpretation: Sum of gross equity and core loan, not net cash at cutoff.

### hfi-capex-mid — Remaining project-spend midpoint
Value: `42500000` GBP. Classification: Derived. Period: October2026 guidance. Scope: project.
Source IDs: Analyst convention / missing disclosure. Locator: Funding!D17.
Interpretation: Arithmetic midpoint, independent scenario convention.

### hfi-opex-mid — FY2028 opex and sustaining midpoint
Value: `72500000` GBP. Classification: Derived. Period: FY ending2028-03-31. Scope: project.
Source IDs: Analyst convention / missing disclosure. Locator: Assumptions!E9.
Interpretation: Arithmetic midpoint, independent scenario convention.

### hfi-core-cash-mid — FY2028 core cash requirement midpoint
Value: `111500000` GBP. Classification: Derived. Period: FY ending2028-03-31. Scope: project_and_financing.
Source IDs: Analyst convention / missing disclosure. Locator: Operating!D20.
Interpretation: Excludes taxes, working capital, remaining restart capex, discretionary new growth and other-product receipts.

### hfi-mtu-per-tonne — Metric tonne units per tonne contained WO3
Value: `100` mtu_per_tonne. Classification: Assumption. Period: Physical unit definition. Scope: project.
Source IDs: Analyst convention / missing disclosure. Locator: Operating!D9.
Interpretation: Unit conversion convention: 1000 kg / 10 kg. Same unit equivalence independently stated in Elmet announcement: 1000 tonnes = 100000 mtu.

### hfi-apt-net-coef — Net tungsten receipts per GBP1/mtu reference
Value: `254479.5` mtu_equivalent. Classification: Derived. Period: FY ending2028-03-31. Scope: project.
Source IDs: Analyst convention / missing disclosure. Locator: Operating!D13.
Interpretation: Uses 3300 floor and royalty on payable receipts; contract-specific coefficients not established.

### hfi-nwf-negotiation — UK government procurement negotiation right
Value: `50` percent. Classification: Reported. Period: 2026-08-25. Scope: project.
Source IDs: src-nwf-tungsten-west-2026. Locator: Third paragraph and separate-negotiation note.
Interpretation: Up to 50% of study production; no concluded offtake or price floor established.

### hfi-elmet-indicative — Elmet indicative nominal contract value
Value: `1400000000` GBP. Classification: Reported. Period: 2026-09-23. Scope: project.
Source IDs: hfs-elmet-rns. Locator: Further information.
Interpretation: Issuer states OVER £1.4bn at prevailing prices and FX, not guaranteed revenue. Not used in model cash flow.

### hfi-aug-mine-opex — August plan mining opex
Value: `3000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-process-opex — August plan processing opex
Value: `2000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-other-opex — August plan other opex
Value: `8000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-finance-cost — August plan financing costs
Value: `4000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-wc — August plan working capital
Value: `6000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-mining-capital — August plan mining capital
Value: `7000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-site-capital — August plan site project costs
Value: `16000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-other-capital — August plan other project costs
Value: `5000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-bridge-repay — August plan bridge repayment
Value: `18000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-ea-provision — August plan EA financial provision
Value: `5000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-reserve — August plan cash reserve
Value: `13000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-total-uses — August plan stated total uses
Value: `88000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-cash-open — August plan opening cash
Value: `7000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-ea-recovery — August plan EA provision recovery
Value: `5000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-interest — August plan interest source
Value: `0` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-revenue — August plan anticipated revenue receipts
Value: `15000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-total-sources — August plan stated total sources
Value: `88000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-nwf-borrower — Proposed NWF borrower and guarantors
Value: `Borrower DRL; guarantors Tungsten West plc, Tungsten West Services Ltd and Aggregates West Ltd` text. Classification: Reported. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Debt Facility, first paragraph.
Interpretation: Proposed terms disclosed 25 August; executed agreement not obtained.

### hfi-maturity-conflict — Loan tenor start conflict
Value: `Initial RNS says definitive agreement date; annual accounts say drawdown; October slide33 gives tenor only` text. Classification: Reported. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Debt Facility tenor bullet; compare hfs-tw-ar2026 printed p.38 and hfs-tw-oct2026 slide33.
Interpretation: Do not infer exact maturity until executed agreement and dates obtained.

### hfi-nwf-share-rights — NWF shareholder rights
Value: `Board nomination/observer and specified information/veto rights` text. Classification: Reported. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Relationship Agreement section.
Interpretation: Relationship agreement persists while at least50m ordinary shares held; certain protections stated for12months. Not a guarantee of future funds.

### hfi-aug-equity — August plan equity financing
Value: `36000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-aug-loan — August plan core loan financing
Value: `25000000` GBP. Classification: Guidance. Period: 25 August 2026 plan up to unspecified scheduled peak funding date. Scope: group_project_funding_plan.
Source IDs: hfs-nwf-terms. Locator: Appendix Sources and Uses.
Interpretation: Original forward funding plan; not observed cash flow at cutoff.

### hfi-mine-life — FS25 base mining life
Value: `11` years. Classification: Guidance. Period: FS25 mine plan disclosed in October2026. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide22.
Interpretation: Current permit and lease extensions require separate verification.

### hfi-stockpile-life — FS25 killas processing phase
Value: `4` years. Classification: Guidance. Period: FS25 mine plan disclosed in October2026. Scope: project.
Source IDs: hfs-tw-oct2026. Locator: Slide22.
Interpretation: Current permit and lease extensions require separate verification.

### hfi-equity-proposed-feb2026 — February2026 conditionally raised gross in circular
Value: `43040000` GBP. Classification: Guidance. Period: Proposed February2026 fundraising as of9February. Scope: group.
Source IDs: hfs-gm-feb2026. Locator: Printed p.13; PDF p.13, Introduction.
Interpretation: Circular is prospective; completion and costs follow in audited accounts.

### hfi-harg-paid-apr2026 — Hargreaves termination cash paid in April2026
Value: `3000000` GBP. Classification: Reported. Period: April2026. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p64 note36; PDF p66.
Interpretation: Accounts say payment was made. April8 RNS had described scheduled payment. Do not subtract again from later October remaining spend without a scope bridge.

### hfi-capital-deposits-2026 — Capital and other deposits at31March2026
Value: `10642212` GBP. Classification: Reported. Period: 2026-03-31. Scope: group.
Source IDs: hfs-tw-ar2026. Locator: Printed p54 note21; PDF p56.
Interpretation: Deposits primarily against rebuild purchase orders. Included within receivables and operating cash movements, not an additional cash balance or free funding source.

### hfi-may-bridge-limit — May bridging facility limit
Value: `25000000` USD. Classification: Reported. Period: 2026-05-21. Scope: corporate_financing.
Source IDs: hfs-tw-may2026. Locator: Project Funding Update and key terms.
Interpretation: Binding facility limit; not evidence all USD25m drawn or exact GBP cash received. Repaid by28August per separate issuer release.

### hfi-equipment-apr-facility — April equipment finance agreement
Value: `22300000` GBP. Classification: Reported. Period: 2026-04-08. Scope: project_financing.
Source IDs: hfs-tw-apr2026. Locator: Mining Services Contract and Highlights.
Interpretation: Binding McHale Komatsu equipment finance stated. No draw/scope reconciliation to October £11m current and ~£22m ordered. Not a second cash receipt.

### hfi-option-sep16 — Additional funding anticipated from founder option exercise
Value: `41429.88` GBP. Classification: Guidance. Period: 2026-09-16. Scope: shareholder_financing.
Source IDs: hfs-options-sep16. Locator: PDF p1 first paragraph.
Interpretation: Announcement says will provide funding, not verified bank receipt. Preserve stated cash amount; nominal share value is not independently established exercise price.

### hfi-option-sep24 — Additional funding anticipated from founder option exercise
Value: `8285.97` GBP. Classification: Guidance. Period: 2026-09-24. Scope: shareholder_financing.
Source IDs: hfs-options-sep24. Locator: PDF p1 first paragraph.
Interpretation: Announcement says will provide funding, not verified bank receipt. Preserve stated cash amount; nominal share value is not independently established exercise price.

### hfi-option-oct1 — Additional funding anticipated from founder option exercise
Value: `33314.91` GBP. Classification: Guidance. Period: 2026-10-01. Scope: shareholder_financing.
Source IDs: hfs-options-oct1. Locator: PDF p1 first paragraph.
Interpretation: Announcement says will provide funding, not verified bank receipt. Preserve stated cash amount; nominal share value is not independently established exercise price.

### hfi-options-total — Sum of stated additional option funding
Value: `83030.76` GBP. Classification: Derived. Period: 2026-09-16 to2026-10-01. Scope: shareholder_financing.
Source IDs: Analyst convention / missing disclosure. Locator: Sum of three September/October announcements.
Interpretation: Sum of prospective stated proceeds, not confirmed cash received.

### hfi-security-deed — Executed group security deed
Value: `Deed dated28August2026; GLAS security trustee; four group chargors` text. Classification: Reported. Period: 2026-08-28. Scope: group_security.
Source IDs: hfs-group-security-2026. Locator: PDF pp3–4 certificate/cover; p38 Schedule1.
Interpretation: DRL, PLC, Services and Aggregates listed as chargors. Registration is documentary evidence, not an independent opinion on enforceability or collateral value.

### hfi-security-loan-reference — Security deed loan reference
Value: `Loan agreement on or about deed date; lender not named in inspected deed` text. Classification: Reported. Period: 2026-08-28. Scope: group_security.
Source IDs: hfs-group-security-2026. Locator: PDF p9, printed p5, Loan Agreement definition.
Interpretation: Consistent in timing with NWF facility; lender attribution remains an inference until loan agreement obtained. No exact draw date, tenor start, maturity, margin/covenant tests established by this reference.

### hfi-security-exclusions — Security deed equipment exclusions
Value: `Financed mobile fleet/Komatsu equipment excluded subject to deed definitions` text. Classification: Reported. Period: 2026-08-28. Scope: group_security.
Source IDs: hfs-group-security-2026. Locator: PDF pp7–8 clause1.1; p42 Schedule5.
Interpretation: Do not describe blanket security over all equipment. Additional permitted-equipment exclusion conditions are not a verified blanket cap on total project borrowing.
