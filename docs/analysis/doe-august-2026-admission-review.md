# DOE August 2026 selection-stage corpus admission — author review

**Branch:** `data/2026-11-doe-selected-projects`, stacked on Korea–Brazil PR #195. **Release:** draft; no merge or deployment.

## Qualified seed changes

- **2 policy events**: DOE's August 18 byproduct-pilot selections ($162 million across nine) and August 20 battery Round 3 selections ($500 million across seven)
- **4 official DOE sources**: the two dated agency announcements and two live selected-project programme pages
- **7 individually described physical projects**: Waterleaf/Lilac, Formation/Jervois, Nth Cycle, Princeton NuEnergy, Arcanum Ventures, Elevated Materials and Coreshell Technologies
- **7 applicant organizations**, registered without invented corporate-incorporation locations
- **Material event references**: lithium, cobalt, nickel, antimony and rare earth elements where DOE identifies them for individual projects or the aggregate cohort
- **No new finance, construction, commissioning or production statuses**: DOE describes proposed federal support and selections for negotiation. No signed grant, payment or observed milestone is established by the reviewed pages.

## Primary sources

1. [DOE August 20 announcement](https://www.energy.gov/articles/energy-department-announces-500-million-secure-americas-critical-mineral-and-battery)
2. [DOE Battery Materials Processing Round 3 selected-project list](https://www.energy.gov/cmei/manufacturing/battery-materials-processing-grants) — Waterleaf $100m and Formation/Jervois $100m
3. [DOE Battery Manufacturing/Recycling Round 3 selected-project list](https://www.energy.gov/cmei/manufacturing/battery-manufacturing-and-recycling-grants) — Nth Cycle $100m, Princeton $50m, Arcanum $50m, Elevated $50m and Coreshell $50m
4. [DOE August 18 industrial-byproducts announcement](https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-162-million-accelerate) — nine selectees across two topic areas; aggregate $162m, no individual shares

The [detailed research source register](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/research/2026-11-04-corpus-expansion-audit/research/doe-august-2026-cohorts.json) preserves the seven proposed federal shares, nine other selectees, unknowns and exact issuer links.

## Accounting and identity restrictions

The present `FinancialCommitment.valueRole` categories do not capture selected-for-negotiation grants accurately. These selectee amounts are retained in research intake rather than entered as public commitments, programme envelopes or nonbinding letters of interest. The sum of the seven project shares is $500 million; it must not be stacked with an aggregate programme amount. The separate $162 million announcement does not assign dollars to individual selectees.

The nine August 18 companies are named with their **headquarters**, not project facilities. DOE does not map scandium/copper/antimony/rare-earth output to particular selectees. Their names and topic areas stay in the research manifest until project identity, location and material scope are verified by original sources.

The seven August 20 project names are normalized from DOE descriptions of **future/planned** facilities. Broad location labels (Southeastern U.S., Gulf Coast, United States) are preserved as such. Nth Cycle black mass does not establish individual recovered minerals in the DOE text; its `materialIds` remain empty. Coreshell's metallurgical silicon and Arcanum's ethylene carbonate are untracked material terms. Graphite substitution at Coreshell is not graphite-processing evidence.

`PolicyEvent.policyStatus: active` here represents the announcement action; it must not be interpreted as an executed award. `lifecycle.verifiedAt` and `lifecycle.publishedAt` are null. The site cutoff remains 3 November 2026 until a separate explicit release decision.

## Review and stop condition

Review each DOE list, selected recipient, site/region, stage, material and event title for issuer fidelity. Run complete validation, test and build gates plus relevant browser checks. Keep historical cutoff snapshot tests unchanged apart from excluding these separately dated rows. Seek independent author approval before promoting the stacked PR or merging. Do not combine with website UI changes or an unreviewed financing ontology extension.

**Subsequent phase:** if selected-but-unsigned awards are to appear in the public financial layer, define and test a clearly noncommitted selection value role/status first. After that, source-review any award agreements or cancellations. Track the nine byproduct pilots as research leads until individual descriptions are established.
