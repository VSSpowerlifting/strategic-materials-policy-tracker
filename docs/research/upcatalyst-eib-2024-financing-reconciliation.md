# EIB UP Catalyst 2024 signature reconciliation

Reviewed 2026-10-08 against `main` ee1e76aa717c58e5eb0b756455a5b8a41cac38f5. Single-row correction to `fin-eu-eib-2025-up-catalyst-loan`, not a second financing transaction.

## Primary-source evidence
- [EIB project 20240127](https://www.eib.org/en/projects/all/20240127): the **Signature(s)** table records **€18,000,000, 20 December 2024**, identified promoter **UP CATALYST OU**, Estonia. The **€46M** figure is *approximate total project cost*; it must not be counted as additional lending. Description: two Gen 4 demonstrator reactors for synthetic graphite and multi-walled carbon nanotubes, plus corporate R&D. Additionality describes **equity-type venture debt** backed by InvestEU. Signed does not imply advanced or operational.
- [Commission RESourceEU COM(2025) 945 final](https://single-market-economy.ec.europa.eu/document/download/01c448d6-dc93-40d7-9afe-4c2af448d00c_en): retrospectively mentions EIB lending to UpCatalyst; not a new 2025 loan.
- [Commission CRMA annex, C(2025)1904](https://single-market-economy.ec.europa.eu/document/download/e9c90c91-7492-4047-bc51-d0c9d5e89a2f_en?filename=C_2025_1904_1_EN_annexe_acte_autonome_part1_v2.pdf): entry (11) separately designates **CO2Graphite**, promoted by UP Catalyst OU.
- [UP Catalyst financing announcement](https://upcatalyst.com/up-catalyst-gets-e18-million-eib-financing-to-advance-the-eus-critical-raw-material-production/): recipient describes an €18M venture-debt facility for graphite and nanotube scale-up, not the bank loan's disbursement history.

## Model decisions
- Update existing row with EIB primary signing evidence, exact signature-table €18M, `contracted` dated **2024-12-20**, and recognized legal promoter name (organization alias already registered); no payment or operational upgrade.
- This is *company-level* financing of the named EIB R&D/demo undertaking. Primary sources reviewed do not prove a direct full €18M allocation to the distinct CRMA `prj-ee-co2graphite`. Change `projectId` to null, preserving the EIB project name in `project` and retaining provider/recipient links. This is a conservative reversal of the former weak project association, not evidence that projects are unrelated.
- Processing and R&D share undisclosed funds; carbon nanotubes are named untracked material. Neither stage nor graphite-specific totals should imply an exclusive amount.
- Keep existing retrospective `evt-eu-resourceeu-2025` association without implying the 2024 contract was signed in 2025; a new EIB-specific event, if desired, should be separately adjudicated.
- One loan, not a duplicate; InvestEU backing does not create a second €18M item. No monitoring, EXIM, Vercel, candidate promotion, or other financial rows altered.

## Acceptance
CI must validate seeds, TypeScript, lint, full tests and production build on exact PR head. Owner reviews and authorizes merge. Confirm direct-project attribution remains excluded from Industrial Response Maturity without affecting EIB provider/UP Catalyst recipient portfolios.
