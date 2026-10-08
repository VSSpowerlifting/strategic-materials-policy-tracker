# Rhyolite Ridge DOE ATVM guarantee — primary-source audit and attribution

Reviewed October 8, 2026; repository base `307db3e9f10dd2e0392885f4f9f3e8b65886d7ae`.

## Transaction and instrument

1. [DOE January 17, 2025 closing announcement](https://www.energy.gov/edf/articles/doe-announces-996-million-loan-guarantee-ioneer-rhyolite-ridge-advance-domestic) names **Ioneer Rhyolite Ridge LLC** as the transaction counterparty and calls the facility a **$996 million loan guarantee**: **$968 million principal + $28 million capitalized interest**. This supports **contracted** legal status, not payment.
2. [Issuer January 17, 2025 SEC-filed closing announcement](https://www.sec.gov/Archives/edgar/data/1896084/000114036125001367/ef20041815_ex99-1.htm) confirms the same closing, and explains the increase from a **January 2023 conditional loan offer**. The older offer is a prior stage of the same transaction, **not an additional financing row**.
3. [DOE EIS-0565 project description](https://www.energy.gov/nepa/doeeis-0565-rhyolite-ridge-lithium-boron-project-esmeralda-county-nevada) specifically excludes financing the open-pit mine: the guaranteed facility finances **on-site lithium processing, a sulfuric-acid plant and ancillary facilities**. The broader enterprise also produces boron, but no federal loan amount is allocated to boron separately. The earlier NEPA synopsis names **Rhyolite Ridge Holdings LLC** as a *proposed borrower*; the closing-era DOE release names **Ioneer Rhyolite Ridge LLC**. Do not assert equivalence absent corporate legal evidence.
4. [Ioneer 2026 Form 20-F](https://www.sec.gov/Archives/edgar/data/1896084/000114036126017853/ef20070398_20f.htm) identifies **first draw conditions precedent**: a strategic equity partner, additional required capital, and a project-finance model refresh. Ioneer says the earlier Sibanye-Stillwater project JV did not proceed in February 2025; don't count the contemplated equity as funded.
5. [July 30, 2026 quarterly activities release in SEC exhibit](https://www.sec.gov/Archives/edgar/data/1896084/000114036126030118/ef20078896_ex99-1.htm): the strategic partner process and FID remain outstanding, preliminary lithium-carbonate engineering continues, and the issuer **reported no production or development activities during June 2026 quarter**. July KIND/Hyundai MOUs are nonbinding.
6. [August 13, 2026 half-year financial report in SEC exhibit](https://www.sec.gov/Archives/edgar/data/1896084/000114036126032597/ef20079527_ex99-1.htm): loan remains closed/in compliance; **Note 10 unamortized DOE loan establishment fees $4.273M** (company costs, not disbursement); amortization begins upon first draw. **Note 9** says development decision has not been made. This is evidence of pre-FID status, not proof that a future draw never occurred.

## Model and research boundaries

- One `evt-us-doe-rhyolite-ridge-2025`, one `fin-us-doe-rhyolite-ridge-guarantee-2025`, one **processing-only** `prj-us-rhyolite-ridge-processing`. Borrower `org-ioneer-rhyolite-ridge-llc` is **not** public parent `org-ioneer-ltd`. DOE is already registered as `org-us-doe`.
- Instrument `loan_guarantee`, federal `capitalSource: public`, status **contracted from January 17, 2025**. No positive evidence of disbursement in sources reviewed; do not promote to paid status or treat fees as DOE advances.
- Physical stage **feasibility**, date **null**, as observed in July 30, 2026 issuer report; FID, construction, commissioning and operations are not evidenced. Source date is an observation boundary, not a manufactured actual transition date.
- The processed product lithium is tracked. Boron is an untracked co-product of the larger venture in the project registry; none of the guarantee is separately allocated to it. The guarantee **does not finance open-pit mining**.
- The DOE [live project summary](https://www.energy.gov/edf/rhyolite-ridge) contains an apparent table typo, **$968 billion**; do **not** import that figure. The official 2025 DOE release and recipient statements both establish **$968 million principal**.
- Army Tooele lease proposal, prospective KIND equity, Hyundai EPC activity, issuer's ~$50M private equity placement and Sibanye's abandoned JV are **not this loan guarantee** and are not imported as additional DOE financing.
- No operational changes, EXIM monitor changes, PR #80 changes or deployment. Amount is a closed guarantee ceiling, **not cash received**.

## Validation

Must pass `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` on exact PR SHA. Inspect aggregate instrument distinctions and the additional non-designated lithium processing project. No merge or deploy without maintainer approval.
