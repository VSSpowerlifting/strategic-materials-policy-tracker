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
- The curated corpus revision label **remains 2026-11-03 during review**. A separate, explicitly approved publication activation will advance it to **2026-11-04** after production deployment is available. The new date refers only to admitted records, not a whole-history rescan.
- Historical **2026-10-17** and **2026-11-03** cutoff snapshots remain fixed in F5 tests. `lifecycle.publishedAt` remains unset until actual deployment.

## Release acceptance

1. All three PR diffs are individually bounded and independently source-checked above.
2. Final combined head must pass dataset validation, TypeScript, lint, full test suite, production build, and targeted browser QA.
3. In the later deployment-activation phase, update the current-cutoff-bound private review fixtures to accept or explicitly preserve historical review dates; verify on production that revision label is 4 Nov. Expected proposed corpus counts: **71 policy events, 97 financial instruments, 103 projects, 197 sources, 10 jurisdictions**, with DOE selected shares outside all public-commitment totals.
4. Verify source routes, navigation, exports, research pages and nonbinding-selection labels.
5. Record original-source and corpus-revision boundaries in PR and release notes. No claim that every past record was revalidated, contracts signed, DOE award shares paid, or facilities operating.

## Review signoff

This audit is source-level research performed with official primary documents and software checks. It is a **technical/editorial review memorandum**, not a separately documented human expert approval. The maintainer must authorize release and acceptance of the dated corpus revision; independent reviewer signature or recorded approval may be added to the release record.

**Follow-on (separate phase):** after release, evaluate seven selected grant proposals as individually coded `selection_proposal` financial rows with verified sources and no committed-money leakage; only then evaluate project registration. Nine other DOE pilot proposals remain research-only pending recipient-level facility and amount records.

## Release blocker found during exact-head verification

- Vercel refused new preview builds with `build-rate-limit` and an upgrade link on 4 November 2026. Do not assume preview or production deployability.
- Advancing `site.lastUpdated` from 3 to 4 November triggered 23 failures in guided private M3/F5 review tests because historical prepared review candidates were supplied with a 3 November proposed cutoff. Those tests are protecting historical review workflow semantics, not denying the newly researched DOE/Korean/Brazilian facts. We restored the site cutoff to **3 November** during staging and kept a **separate proposed 4 November cutoff audit** that does not authorize publication. A future, dedicated activation phase must decide how to preserve old review fixtures without rewriting original evidence.
- No deployment or merge was performed during this review. The code and source corrections remain on the review branch pending resolved deployment capacity, final CI and maintainer approval.


## 4 November release activation addendum

The maintainer directed the release workflow to continue despite Vercel's current build-rate quota. This is approval to proceed with verified GitHub changes, **not evidence that production has deployed**.

- The release branch now proposes `site.lastUpdated = 2026-11-04`; the previous `2026-11-03` cutoff remains a fixed historical fixture in M3/F5 retrospective tests.
- Existing synthetic private reviewer fixtures were explicitly pinned to their original test cutoff. New review sessions continue to require a proposed date on or after the live site cutoff. A regression test rejects attempts to reuse 3 November after the 4 November activation.
- Separate policy-event and original-source audit shows 71 events, 97 finance rows, 103 projects, 197 sources, 10 jurisdictions, with no federal DOE selected shares treated as commitments.
- The Vercel `build-rate-limit` status may persist even when GitHub CI passes. A merge alone is **not** a deployment confirmation. Verify exact deployment commit and live export parity independently before announcing a public release as live.
- All historical signed human reviews, candidate files, source access receipts and project milestones must retain their original dates and contents.

**Activation checklist:** final full CI/Chromium QA green; merge #195, #198, then #200 using exact heads with no intervening unreviewed changes; check main deployment status; distinguish code merged from live publication.
