# DOE Round 3 grant selections — financing ontology and admission review

**Reviewed 4 November 2026 · Draft implementation · No public release**

## What changed

A separate `selected_proposal` financing value role and `selected_for_negotiations` status distinguish a DOE grant applicant selected for award negotiations from a legally committed or paid grant. This is an affirmative record of DOE's selection action and the proposed federal share stated in its two official Round 3 programme lists.

Seven individual selection-stage finance rows, seven identified facility proposals, seven selectee organizations and two DOE grant programmes are staged in this branch on top of the [original DOE selection events PR #198](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/198). The seven proposed federal shares total **$500 million**, three $100 million selections and four $50 million selections. These amounts are *not* committed federal funding, legally obligated grants, financial disbursements or verified industrial outcomes.

## Official evidence

- [DOE 20 August 2026 $500 million selected-project announcement](https://www.energy.gov/articles/energy-department-announces-500-million-secure-americas-critical-mineral-and-battery)
- [DOE Battery Materials Processing Grants](https://www.energy.gov/cmei/manufacturing/battery-materials-processing-grants) — Waterleaf P1 HoldCo, $100m; Formation Holdings US / Jervois, $100m; grant programme funded under IIJA §40207(b)
- [DOE Battery Manufacturing and Recycling Grants](https://www.energy.gov/cmei/manufacturing/battery-manufacturing-and-recycling-grants) — Nth Cycle, $100m; Princeton NuEnergy, Arcanum Ventures, Elevated Materials and Coreshell Technologies, each $50m; grant programme funded under IIJA §40207(c)
- [DOE 18 August 2026 byproduct pilot selections](https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-162-million-accelerate) — separate $162m cohort covering nine selectees, **not included** in the seven financial rows because individual funding shares, facilities and source-specific material assignments remain unknown

The DOE programme-page headings refer to programme-level funding authorization, distinct from each selected applicant's proposed share. No combined $500 million envelope was inserted into the public financing rows, preventing aggregate/child double counting. The 2022–2026 programme budget figures on DOE programme pages likewise are not counted as grants to Round 3 recipients.

## Safeguards across readers and analytics

1. `valueRole: selected_proposal` rows have their own `selected_for_negotiations` financial status and a public-source-proven project link. The validator rejects pairing the selection role with a contracted, decided or paid status, and rejects using the selection status with other roles.
2. `layerOf` assigns a standalone `selected_proposal` layer with **no totals**; `isBackingRow` excludes these rows from project and organization backing and government capital-stack attribution.
3. `publicCommitmentRows` excludes selection proposals from public commitments. `totalCommitments` expressly refuses to sum a selection role, even if passed directly. The capital page shows a separate section labelled **Selected grant proposals under negotiation**; project pages explain their absence from backed capital.
4. Source links, printed share values, issuer context and site specificity are preserved. Formation's actual site is TBD, Nth Cycle only has the Southeastern U.S. region, Arcanum only the U.S. Gulf Coast, and Elevated Materials only the United States. Headquarters cannot stand in for project sites.
5. Arcanum's ethylene carbonate and Coreshell's metallurgical silicon remain explicit untracked-product mentions; Nth Cycle remains without a claimed specific recovered mineral. No source-reviewed physical milestone was created.
6. A subsequent executed grant, amended selection, withdrawal or payment must have separate dated original-source evidence and a separate commitment row when binding. The selections themselves remain traceable historically.

## Review gate

- [ ] Primary-source, selectee, location, material and status review by a human maintainer
- [ ] Full `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, relevant Playwright browser QA, and `git diff --check`
- [ ] Verify API/CSV exports preserve the distinct `valueRole` and `financialStatus` values and ensure analytics never total their $500 million as commitments
- [ ] Review any grant agreements/termination notices dated after the selection before a public release
- [ ] Approve a new curated corpus revision date. Do not silently change the public 3 November revision label or invent event `publishedAt` dates.
- [ ] Merge Korea/Brazil #195, DOE event intake #198 and this phase in dependency order only after independent review; no automatic merging or deployment.

**Stop condition:** reviewed draft PR with status semantics proven and financial totals safeguarded. Material taxonomy expansion (copper/scandium/silicon) and nine DOE byproduct pilot cases are separate phases.
