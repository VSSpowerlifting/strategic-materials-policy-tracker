# DOE August 2026 selection intake — author review

**State:** draft data PR and review-gated research records, **not published**.

## Current qualified additions

Two US policy events and four primary DOE sources are staged in public-seed JSON for editorial review:

- 18 August 2026: DOE selected nine industrial-byproduct pilot applicants under Topic Area 2, **$162 million in aggregate**. DOE supplies headquarters but no individual award shares, project facilities or selectee-to-material mapping.
- 20 August 2026: DOE selected seven battery-processing, manufacturing and recycling applicants, **$500 million in proposed federal shares**. The two DOE programme pages provide the seven companies, their project activities, and three $100m plus four $50m proposed shares.

The selected applicants are **not contractually funded or operating facilities** on this evidence. No `FinancialCommitment` or `ProjectMilestone` is created.

The existing SMPT public `Project` registry requires a link to a financial record or designation. The seven well-described DOE facilities cannot yet be linked because the current finance value-role vocabulary describes committed amounts, programme ceilings or letters of interest, rather than DOE selections for negotiations. CI's registry-integrity test correctly rejected unlinked project records. We preserved the full set of seven proposed project rows and seven applicant organizations as a structured, explicitly **research-only** proposal file.

## Reproducible research files

- [16-selectee cohort register](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/data/2026-11-doe-selected-projects/research/doe-august-2026-cohorts.json) — DOE source URLs, candidate IDs, seven individual proposed shares, nine unspecified shares, location specificity and reviewer questions
- [Seven proposed project and applicant rows](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/data/2026-11-doe-selected-projects/research/doe-august-2026-project-proposals.json) — complete proposed project/org schema, explicit `research_only_do_not_promote` gate
- [Original full research review](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/research/2026-11-04-corpus-expansion-audit/docs/analysis/doe-august-2026-cohort-source-review.md)

## Official sources

1. [DOE, 20 August 2026: $500m selection announcement](https://www.energy.gov/articles/energy-department-announces-500-million-secure-americas-critical-mineral-and-battery)
2. [DOE Battery Materials Processing Round 3 recipients](https://www.energy.gov/cmei/manufacturing/battery-materials-processing-grants) — Waterleaf $100m and Formation/Jervois $100m
3. [DOE Battery Manufacturing and Recycling Round 3 recipients](https://www.energy.gov/cmei/manufacturing/battery-manufacturing-and-recycling-grants) — Nth Cycle $100m, Princeton NuEnergy $50m, Arcanum $50m, Elevated Materials $50m and Coreshell $50m
4. [DOE, 18 August 2026: $162m industrial-byproduct pilot selections](https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-162-million-accelerate)

DOE expressly states for the byproduct pilot that selection for award negotiations does not commit it to make an award and that amounts can change. Do not classify announcement-stage federal shares as binding public financing. The $500m cohort figure is the sum of seven individual proposals, and the nine byproduct selections have no issuer-provided dollar apportionments.

The DOE material references in the **aggregate policy events** are not selectee-specific critical mineral attributions. Coreshell's silicon substitution is not graphite production; Arcanum's ethylene carbonate and Coreshell's metallurgical silicon sit outside the current 14-material taxonomy. Location labels such as Gulf Coast, southeastern U.S. and site TBD are preserved in the research file without invented addresses.

## Admission and publication gate

- [ ] Source-author review of both events, exact DOE titles, selected applicants, classifications and original URLs
- [ ] All data validation, typecheck, lint, tests, build, project/browser checks; historical 3 November 2026 cutoff snapshots preserved
- [ ] Restore this PR's base from `main` (used temporarily to trigger CI) to the Korea–Brazil PR #195 branch after tests
- [ ] Authorize a new corpus revision date before any public release; maintain `lifecycle.verifiedAt: null` and `publishedAt: null` during draft stage
- [ ] As a separate engineering phase, introduce a rigorously defined **selected-for-negotiations** financial value role that remains outside public commitments, totals, obligations and disbursements. Only then re-evaluate the seven project/organization proposals for public admission with correct financial linkage

**Stop condition:** reviewed, valid draft PR; no merge or deployment before maintainer approval. 
