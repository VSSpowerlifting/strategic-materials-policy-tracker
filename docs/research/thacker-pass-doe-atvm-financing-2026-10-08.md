# DOE Thacker Pass ATVM loan — legal identity, amended facility and draws

Reviewed 2026-10-08 against official DOE and SEC primary records. Applies to the single existing-in-reality ATVM direct-loan facility, Loan No. **A1034**, newly entered in SMPT as `fin-us-doe-thacker-pass-atvm-2024`. No other government/private capital or mining finance is inferred.

## Signed instrument and borrower

1. [DOE project summary](https://www.energy.gov/edf/thacker-pass) states October 2024 direct-loan closing, **approximately $2.26B** including **$1.97B principal** and **$289.7M estimated capitalized interest**, financing battery-grade lithium-carbonate processing facilities in Humboldt County.
2. [Executed Loan Arrangement and Reimbursement Agreement, 28 October 2024, Exhibit 10.11](https://www.sec.gov/Archives/edgar/data/1966983/000095017025046424/lac-ex10_11.htm): borrower **Lithium Nevada Corp.**, lender/arranging government agreement party DOE, ATVM/FFB financing mechanics, Loan No. A1034. This is executed, not a mere DOE conditional commitment.
3. [7 October 2025 omnibus amendment, Exhibit 10.1](https://www.sec.gov/Archives/edgar/data/1966983/000119312526115081/lac-ex10_1.htm): named borrower **Lithium Nevada LLC (formerly known as Lithium Nevada Corp.)**; **Lithium Americas Corp.** is the **Sponsor**, not the direct borrowing entity. The original 2024 facility was amended, not replaced by a second independently countable loan.
4. [Lithium Americas Form 10-Q, quarter ended 30 June 2026, filed 13 August 2026](https://www.sec.gov/Archives/edgar/data/1966983/000119312526347826/lac-20260630.htm), Note 4 and MD&A: 7 October 2025 amendment preserved $1.97B principal, revised estimated capitalized interest to $256M, and lowered **expected total to approximately $2.23B**. Arithmetic ($1.97B + $256M) yields $2.226B; the current display rounds and explicitly uses `qualifier: approximately`.
5. [DOE NEPA scope](https://www.energy.gov/nepa/doeeis-0561-thacker-pass-lithium-mine-project) states DOE financing **covers mine processing facilities and associated infrastructure, not development and operation of the open-pit mine**. The project, stage, physical response and amount must preserve this boundary.

## Draw and physical evidence

Issuer Form 10-Q dated 13 August 2026 reports cash advances **$435M on 20 Oct 2025**, **$432M on 24 Feb 2026**, and **$342M on 3 Jun 2026**, cumulative **$1.209B by 30 Jun 2026**. Only the first advance creates the financial status change from `contracted` to `partially_disbursed`; later advances remain notes within **the same** loan. No invented extra financial rows, payment to the listed parent, or full-disbursement assertion. The issuer's Q2 carrying amount **$988.018M** is net of debt-issuance costs and reflects accounting accruals and must not be confused with cumulative cash advanced.

As of 30 Jun 2026, ongoing construction of the Phase 1 processing plant is evidenced by issuer MD&A ($1.6217B cumulative construction costs within its project capex estimate). It is **construction**, not operation, and not evidence DOE funded all of those costs.

The [30 September 2025 DOE restructuring announcement](https://www.energy.gov/articles/department-energy-restructures-lithium-americas-deal-protect-taxpayers-and-onshore) discusses government warrants to obtain equity interests. Warrants are loan restructuring/collateral terms, not evidence of an already exercised 5% stake or incremental government equity cash.

## Registry and historic modeling

- One `evt-us-doe-thacker-pass-loan-2024`, one `fin-us-doe-thacker-pass-atvm-2024`, one processing-scope `prj-us-thacker-pass-phase1-processing`, two organizations (DOE and **Lithium Nevada LLC**, alias former corporation); source-linked lithium dossier.
- Loan financial history: **contracted 2024-10-28**, **partially_disbursed 2025-10-20**. Physical processing plant: **construction evidenced by 2026-06-30**. Later draw dates documented but not fabricated into separate commitments or an invented date-sliced paid-amount table.
- The existing F4 financial-status as-of model does **not** version monetary amount. The row's **current amended ~$2.23B** will appear even when a consumer asks for the 2024 financial status. The contemporaneous 2024 ~$2.26B must be preserved in notes and sources; **do not call the amended figure the amount known in October 2024**. Full historical amount series remains separate design work.
- Loan is financial public support; GM/JV equity and warrant arrangements are neither duplicate public capital nor the direct federal loan recipient. DOE and Federal Financing Bank legal mechanics refer to the same ATVM financing and should not generate a double count.
- No source evidence here establishes open-pit mine financing by DOE, conversion plant operation, fourth advance, full draw, or the actual exercise of DOE warrants.

## Scope and review

Changes: five registered source records, one event, one loan, two organizations, one physical project, lithium dossier link, focused regression tests, decision ledger and project checkpoint. No EXIM monitoring, no source-watch state, no unrelated financiers, no public UI changes.

Verification: exact-head `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` in CI. Do not merge or deploy without maintainer approval. Inspect potential historical-as-of amount impressions after merging before presenting temporal monetary comparisons.
