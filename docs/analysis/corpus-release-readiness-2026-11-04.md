# SMPT 4 November 2026 corpus release — original-source review and reconciliation

**Prepared:** 2026-11-04  
**Review scope:** Korea/Brazil draft PR #195, DOE intake PR #198 and selection-stage finance-ontology PR #200, reviewed in dependency order.  
**Editorial state:** Source-level review complete for listed claims and metadata; full historical corpus **not** rechecked. CI and site revision check required on exact final head. Deployment requires maintainer signoff.

## Source-level findings

| Claim | Primary document | Verification disposition |
| --- | --- | --- |
| Korean Resource Security Council approved comprehensive rare-earth measures 4 Feb; official public release 6 Feb; all 17 elements; KRW 39.0bn (2025) to 67.5bn (2026) overseas-resource development loans | [MOTIR](https://english.motir.go.kr/eng/article/EATCLdfa319ada/2497/view) | Supported. **Correction:** source mentions rare-earth permanent magnets generally, not the narrower NdFeB material taxonomy. Removed the NdFeB event link and defense-sector attribution. Keep programme budget outside project finance. |
| BNDES/Finep chose 56 strategic mineral business plans for individual support-plan development, aggregate R$45.8bn estimated project investment | [BNDES 12 Jun 2025](https://agenciadenoticias.bndes.gov.br/noticia/BNDES-e-Finep-concluem-avaliacao-de-propostas-de-chamada-publica-de-projetos-com-foco-em-minerais-estrategicos) | Supported. The R$45.8bn is **project-plan estimate**, not a state financing award or sum of disbursed public money. |
| BNDES approved R$100m for Piauí Níquel Metais to acquire machinery, equipment and industrial services for nickel/cobalt MHP | [BNDES 13 Jul 2026](https://agenciadenoticias.bndes.gov.br/noticia/BNDES-aprova-R$-100-mi-para-apoiar-processamento-de-niquel-no-Piaui/) and [BNDES Máquinas e Serviços](https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/bndes-maquinas-e-servicos) | Supported: `financialStatus=decided`, public loan, R$100m. Issuer **does not establish** signed contract, disbursement or realized 2028/2029 planned production. |
| DOE Round 3 selected seven applicants 20 Aug for total of $500m proposed federal share, three $100m and four $50m | [DOE announcement](https://www.energy.gov/articles/energy-department-announces-500-million-secure-americas-critical-mineral-and-battery), [materials processing programme page](https://www.energy.gov/cmei/manufacturing/battery-materials-processing-grants), [manufacturing/recycling programme page](https://www.energy.gov/cmei/manufacturing/battery-manufacturing-and-recycling-grants) | Seven individual proposed shares supported. **Correction:** FOA `DE-FOA-0003585` belongs to the funding opportunity rather than the announcement; `documentNumber` set null. No seven finance seed rows or public projects in this release. |
| DOE selected nine industrial byproduct-recovery pilots 18 Aug, $162m collective selections | [DOE 18 Aug issuer release](https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-162-million-accelerate) | Nine company names and two topic areas supported. Individual $ amounts and physical sites unspecified; headquarters not sites. DOE explicitly identifies selections as negotiations-stage, subject to rescission. No nine invented finance rows or project materials. |

## Change control

- PR **#195** contributes 3 source-backed policy events, 4 official source records, 2 new jurisdictions, 1 R$100m **approved** loan record, 1 Piauí industrial project, 2 organizations and a finance programme.
- PR **#198** contributes 2 DOE selection-stage policy events, 4 official source records, a 16-selectee research register and 7 complete research-only project/applicant proposals. No selection-stage financing promoted in this release.
- PR **#200** defines `selection_proposal` and `selected_for_negotiations` as distinct public vocabulary **without new financial rows**; tests confirm these are excluded from committed-capital totals, government backers, project capital and disbursement.
- Curated corpus revision label advances to **2026-11-04**; it refers to admission of newly reviewed records and never represents a whole-history rescan.
- Historical **2026-10-17** and **2026-11-03** cutoff snapshots remain fixed in F5 tests. `lifecycle.publishedAt` remains unset until actual deployment.

## Release acceptance

1. All three PR diffs are individually bounded and independently source-checked above.
2. Final combined head must pass dataset validation, TypeScript, lint, full test suite, production build, and targeted browser QA.
3. Verify on production that revision label is 4 Nov; record counts should reflect **71 policy events, 97 financial instruments, 103 projects, 197 sources, 10 jurisdictions**, with DOE selected shares outside all public-commitment totals.
4. Verify source routes, navigation, exports, research pages and nonbinding-selection labels.
5. Record original-source and corpus-revision boundaries in PR and release notes. No claim that every past record was revalidated, contracts signed, DOE award shares paid, or facilities operating.

## Review signoff

This audit is source-level research performed with official primary documents and software checks. It is a **technical/editorial review memorandum**, not a separately documented human expert approval. The maintainer must authorize release and acceptance of the dated corpus revision; independent reviewer signature or recorded approval may be added to the release record.

**Follow-on (separate phase):** after release, evaluate seven selected grant proposals as individually coded `selection_proposal` financial rows with verified sources and no committed-money leakage; only then evaluate project registration. Nine other DOE pilot proposals remain research-only pending recipient-level facility and amount records.
