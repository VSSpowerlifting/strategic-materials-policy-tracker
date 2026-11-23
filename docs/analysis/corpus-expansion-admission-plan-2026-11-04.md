# SMPT corpus expansion — source audit and admission workplan

**Review date:** 2026-11-04  
**Scope:** Existing public seed data; initial primary-source leads for Korea, Brazil, U.S. financing and EU/Canada follow-up  
**Status:** Research intake. Public seed data remain unchanged.

## 1. Baseline

Counts read from the default branch's `data/seed/*.json` on 2026-11-04:

| Entity | Count |
| --- | ---: |
| Policy events | 66 |
| Financial commitments | 96 |
| Control measures | 45 |
| Projects | 102 |
| Project designations | 59 |
| Organizations | 122 |
| Programmes | 12 |
| Materials | 14 |
| Jurisdictions | 8 |
| Registered sources | 189 |
| Framing claims | 57 |

- No duplicate `id` values were observed within any of the eleven inspected files.
- All 96 financial commitments have an existing event reference; all nonnull `projectId` references resolve.
- 66 of 96 financial commitments reference a project ID. **56 of 102 projects are not referenced by any financial commitment.** This is a *coverage triage*, not evidence of missing financial support; project-designation-only entries and unfunded projects are legitimate.
- 30 of 96 commitment rows contain at least one implementation-status history entry; 24 contain more than one financial-status entry.
- 46 of 189 source records have `datePublished` empty; review whether the original is undated before classifying as a defect.
- There are no duplicate normalized source URLs in this sample.
- Policy events by jurisdiction: US 20, China 16, Canada 10, Japan 7, EU 6, Australia 3, UK 3, India 1. South Korea and Brazil require new jurisdiction taxonomy support.

The project milestone work already has an M3/F5 review workflow; reuse the existing source-review gate and avoid constructing another review system.

## 2. Verified primary-source entry points

These are research entry points only. Each proposed entity must still pass exact-text review, deduplication, typed evidence references and the established private candidate gate before public promotion.

### A. South Korea

**KR-01 — Rare-earth supply-chain measures, 4–6 February 2026**  
Official MOTIR publication: https://english.motir.go.kr/eng/article/EATCLdfa319ada/2497/view

The ministry reports Resource Security Council approval on 4 February and publication on 6 February, covering all 17 rare earths, refined customs codes, overseas resource-development loan budget growth (KRW 39.0bn in 2025 to KRW 67.5bn in 2026), and support for domestic facilities and recycling. Candidate: `PolicyEvent` and jurisdiction/framing work. Treat the overseas-loan budget as a **programme budget**, with no named project award implied. Check original Korean text and preserve the distinction between the approval date and publication date.

**KR-02 — Korea–Japan Supply Chain Partnership Arrangement implementation, 2 September 2026**  
Official MOTIR publication: https://english.motir.go.kr/eng/article/EATCLdfa319ada/2723/view

The ministry states the SCPA was signed in March 2026; the September meeting discussed implementation and critical-mineral cooperation. Candidate for policy/cooperation record only if the instrument satisfies current inclusion criteria. Obtain the underlying SCPA to distinguish the agreement from the follow-up meeting.

**KR-03 — Korea–Central Asia supply-chain cooperation, 14–16 September 2026**  
Official MOTIR publication: https://english.motir.go.kr/eng/article/EATCLdfa319ada/2737/view

Includes intergovernmental MOUs, including a Korea–Uzbekistan critical-minerals platform. Evaluate admissible agreement-level records; treat company MOUs as preliminary expressions and seek subsequent contracts before economic-implementation coding.

### B. Brazil

**BR-01 — BNDES/Finep strategic-minerals transformation call, 12 June 2025**  
Official BNDES publication: https://agenciadenoticias.bndes.gov.br/noticia/BNDES-e-Finep-concluem-avaliacao-de-propostas-de-chamada-publica-de-projetos-com-foco-em-minerais-estrategicos

BNDES/Finep selected **56 business plans** for the joint-support-plan stage, with **R$45.8bn of estimated project investment**. The R$45.8bn measures the selected business plans, **not a public finance commitment**. Research the programme and selection status before coding recipient/project identities; check the published list and subsequent agreements.

**BR-02 — Piauí Níquel approved financing, 13 July 2026**  
Official BNDES publication: https://agenciadenoticias.bndes.gov.br/noticia/BNDES-aprova-R$-100-mi-para-apoiar-processamento-de-niquel-no-Piaui/

BNDES approved **R$100m** for Piauí Níquel Metais S/A to procure equipment and services supporting high-purity nickel/cobalt processing in Piauí. Candidate `PolicyEvent`, `FinancialCommitment`, `Project`, `Organization` and issuer evidence. Status is **approved financing** as reported by BNDES; do not infer signature, disbursement or completed capacity. Production dates and annual-capacity figures in this release are company/project expectations.

### C. United States

**US-01 — DOE Round 3 selections, 20 August 2026**  
Official announcement: https://www.energy.gov/articles/energy-department-announces-500-million-secure-americas-critical-mineral-and-battery  
Official project lists:
- https://www.energy.gov/cmei/manufacturing/battery-materials-processing-grants
- https://www.energy.gov/cmei/manufacturing/battery-manufacturing-and-recycling-grants

**One announcement cohort, seven named selections and US$500m aggregate federal share**; avoid a second total from the same round in two programme pages:

| Selectee | Federal share | Source-stated facility/activity |
| --- | ---: | --- |
| Waterleaf P1 HoldCo (Lilac Solutions) | $100m | Lithium extraction/refining, West Promontory, UT |
| Formation Holdings US (Jervois) | $100m | Cobalt refinery; location pending |
| Nth Cycle | $100m | Battery black-mass refining, southeastern US |
| Princeton NuEnergy | $50m | Nickel-containing cathode recovery, Commerce, GA |
| Arcanum Ventures | $50m | Battery-grade ethylene carbonate, US Gulf Coast |
| Elevated Materials | $50m | Lithium-metal films; location pending |
| Coreshell Technologies | $50m | Silicon-anode electrode/cell manufacturing, San Leandro, CA |

Review each selectee for overlap with existing project/entity records. Record **selected**, with award negotiation, obligation and payment tracked only when separately evidenced. Confirm how the existing `FinancialCommitment` status taxonomy encodes selection; use the correct value role and avoid adding selected support to legally binding totals. Materialize known quantities only at the instrument level; keep $500m as the aggregate announcement, not a second summable award.

**US-02 — DOE Critical Materials Innovation Hub R&D selections, 26 August 2026**  
Official DOE publication: https://www.energy.gov/cmei/articles/does-critical-materials-innovation-hub-awards-10-million-early-stage-research-and

Seven projects selected for a stated **US$10m** R&D programme involving rare earths, copper and gallium. Although the headline uses “awards,” the article explicitly states selections are subject to negotiations and may be rescinded. Determine whether R&D activities meet SMPT's physical-project scope; otherwise retain the event/programme only.

### D. Canada and EU

**CA-01 — Strategic Response Fund project ledger**  
Official ISED registry: https://ised-isde.canada.ca/site/ised/en/programs-and-initiatives/strategic-response-fund/investments/projects

Select critical-minerals entries and reconcile names/financing with existing Canadian records. A programme-wide count of funded projects spans many sectors; it is not the critical-minerals denominator. Verify each project's funding, signing/approval stage, announcement and costs separately. Distinguish total project costs from public funding.

**EU-01 — CRMA designation/material reconciliation**  
Official EC list: https://single-market-economy.ec.europa.eu/sectors/raw-materials/areas-specific-interest/critical-raw-materials/strategic-projects-under-crma/selected-projects_en

The Commission lists 106 designated strategic projects overall. SMPT already has 59 `ProjectDesignation` records across its selected scope, including the 2026 second round. Reconcile by decision, beneficiary, project and material **before** adding any record. Candidate taxonomy expansion: copper, manganese, platinum-group metals, titanium, silicon and magnesium if source-backed demand justifies them. A designation remains a recognition event; record separate funding only with finance evidence.

## 3. First admission batch and exit criteria

1. **Build a private candidate intake file** for KR-01, BR-01, BR-02 and US-01's seven selectees; use the existing `data/candidates/` workflow. Treat KR-02/KR-03, US-02, CA-01 and EU-01 as second-pass discovery/reconciliation.
2. **Source and identity review:** original text and date, entity IDs and aliases, project/facility identity, legal instrument, source locator, payment/approval stage, provenance for each financial field, related event, and existing-public-record overlap.
3. **Taxonomy review:** Korea and Brazil jurisdictions, Portuguese/Korean original-title handling, materials and issuer bodies. Extend only existing enums/fields as needed; no new scoring model.
4. **Promotion:** only reviewed candidates enter the public seed. Use the repository's human source-review workflow and relevant original-source attestations. Update reverse references, APIs/exports and coverage, and run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and focused data-integrity tests.
5. **Acceptance:** no broken references, no duplicate programme/project/award counting, no selected awards labeled contracted or disbursed, and a reproducible source/reviewer receipt. Retain all candidate-only material outside the public build.

**Out of scope for this phase:** database migrations, new public front-end dashboards, automated scrapers, price forecasts, duplicate M3/F5 milestone workflows, and mass admission of unreviewed candidate data.
