# SMPT Capital & Industrial Execution Expansion — Source Review and Admission Receipt

**Review date:** 5 November 2026  
**Branch:** `data/2026-11-05-capital-execution-expansion`  
**Scope:** Add primary-sourced financing transactions, linked physical projects, two investment programmes plus the UK accelerator, and material taxonomy. Maintain clear boundaries between headline amount, legal approval, instrument execution, cash disbursement and physical implementation.

## Source-qualified additions

| Case | Source | Coded amount and status | Evidence guardrails |
| --- | --- | --- | --- |
| U.S. EXIM August loans | [EXIM, 7 Aug 2026](https://exim.gov/news/trump-administration-announces-58m-major-new-critical-mineral-deals-white-house-roundtable) | Three separate **announced** loans: US$25m Westwater (graphite), US$25m Global Advanced Metals (tantalum/niobium), US$8m 5E (boron) | No grouped $58m public-money row; no inference of contracts or disbursements. [Westwater SEC filing](https://www.sec.gov/Archives/edgar/data/839470/000110465926092955/wwr-20260630x10q.htm) reports loan approval subject to documentation, with a Kellyton project identity. The separate 5E EMP filing describes a different-sized proposed facility and is not conflated. |
| U.S. Project Vault | [EXIM, 2 Feb 2026](https://www.exim.gov/news/project-vault) | Direct loan **approved**, **up to** US$10bn | A decided public financing ceiling, not documented payment, executed facility or stocked minerals. No fabricated physical project or particular material. |
| Australia Donald + GAM | [Australian Government, 27 Oct 2026](https://www.minister.industry.gov.au/t-ayres/media/more-investment-more-jobs-australias-critical-minerals-future) | **Conditionally approved** up to A$70m EFA to Donald, A$110m NRF investment to Donald, and US$41.4m EFA loan to GAM | EFA Donald and NRF legal instrument type not specified; retained as `unspecified`. Separate currencies are not converted/summed. Australian GAM loan is distinct from the U.S. EXIM GAM transaction. |
| Canada SRF aluminium | [ISED, 23 Oct 2026](https://www.canada.ca/en/innovation-science-economic-development/news/2026/10/government-of-canada-invests-over-190-million-to-advance-canadas-critical-minerals-sector-and-strengthen-aluminum-processing.html) | **Announced** C$164.8m Rio Tinto; C$28.5m Alouette | C$193.3m is a two-recipient headline, not an additional transaction. Rio support covers **two separate named facilities**; the amount is not falsely allocated to either. C$818.5m / C$135m are project costs, not public financing. |
| Canada Growth Fund Marathon | [CGF, 15 Sep 2026](https://www.cgf-fcc.ca/en/news/canada-growth-fund-commits-to-invest-140-million-in-generation-mining-to-mobilize-private-capital-for-ontarios-marathon-critical-minerals-project/) | **Announced**, subject to closing: approximately C$90m equity, C$50m convertible note | C$140m indicative headline is not another row; C$200m equity financing and C$100m note round are broader rounds, not additional CGF support. Convertible debt is coded `unspecified` as no specific subtype exists in the existing instrument taxonomy. No construction milestone inferred from “shovel-ready”. |
| UK Critical Minerals Accelerator | [GOV.UK, 5 Aug 2026 / updated Sep](https://www.gov.uk/government/publications/critical-minerals-programme-critical-minerals-accelerator) | **Programme envelope**, **up to** £25m | No named project award is admitted, and no future award may be counted on top of its parent envelope. Decision expected Nov–Dec 2026. |

## Execution milestone: Nolans

The [8 October 2026 Australian Government release](https://www.minister.industry.gov.au/t-ayres/media/construction-starts-arafura-rare-earths-project) states construction at Arafura's Nolans project had commenced. The existing EFA equity record now stores physical **construction** evidence with `date: null`, because the release does not identify the exact day construction started. The equity's financial status remains **contracted** from the independently sourced 1 April subscription agreement and **is not** promoted to paid/disbursed. Physical stages are not evidence of funding drawdowns.

## Material expansion and reverse-link hygiene

The corpus now codes six additional categories: **tantalum, niobium, boron, aluminium (aluminum), copper and palladium**, each grounded in admitted financing/project evidence. All new event-to-material and jurisdiction-to-event reverse indexes were rebuilt from the event side. No broad historical reclassification is made without checking each older primary.

The new entities are:
- 6 policy events (US EXIM loans, Project Vault, Australian financing, Canada SRF, CGF Marathon, UK accelerator)
- 12 distinct financing rows (3 + 1 + 3 + 2 + 2 + 1)
- 7 physical project rows (including distinct Alma and Grande-Baie sites)
- 10 organizations, 3 programmes, 8 additional original sources (including Nolans), 2 source-quoted framing claims and 6 additional material types
- 1 lifecycle update to existing Nolans financing and project records

## Dated high-risk control review

**10 November 2026:** MOFCOM/GACC [Announcement No. 70](https://www.mofcom.gov.cn/zcfb/blgg/gg/2025/art/2025/art_da147202d0934ddebe252772e95ed7b3.html) suspends six 2025 announcements through this date. A [September 2026 MOFCOM public policy statement](https://www.mofcom.gov.cn/syxwfb/art/2026/art_d9ea01824fc44fd8a29f7dc3f8ca9c72.html) discusses extending the bilateral trade arrangement to January 2027, but **does not itself amend** No. 70. See [issue #207](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/207) for the primary-law review and conditional coding gate. No speculative extension or activation is entered into the seed.

## Review and release gate

1. Run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `git diff --check` on the PR head. Newly added post-November-4 source-review dates must remain flagged as unreleased by the 2026-11-04 cutoff audit pending publication authorization; older cutoff tests isolate this new batch rather than rewriting past history.
2. Independently verify the source statements, legal categories and `associatedProjectIds` schema/renderer treatment, especially the two-site Rio entry.
3. Verify all new project/org/programme foreign keys, material and jurisdiction inverse links, zero orphan projects, and source register resolution.
4. Inspect /events, /capital, /projects, /programmes, /materials, /portfolios, /coverage and exports at preview.
5. Resolve any validation/test/build failures **before** approval. Reviewer retains release authority; no automatic merge or deployment.

This branch also adds regression coverage for Nolans construction-versus-payment and updates historical count assertions and responsive Chromium QA to match the source-linked expansion. Browsers must continue to verify actual record cardinality rather than relying on pre-expansion literals.

No calculation of undisclosed private capital, conditional financing drawdown or production capacity is permitted in this tranche.
