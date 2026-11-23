# Material taxonomy expansion — evidence-linked admission order

**Review date:** 2026-11-04  
**Status:** source-supported taxonomy recommendations; **no public material records created**.

SMPT's 14 existing material records include broad rare-earth and magnet categories. Each new material must support concrete comparison and derive its current policy-position statements from sources. Do not admit blank shells just to raise a headline count.

## First three candidates (in evidence-review order)

| Candidate | Immediate, cited trigger | What to verify before promotion |
| --- | --- | --- |
| **Copper** | DOE's 18 August 2026 industrial-feedstock pilot selection identifies copper among cohort target materials; EU CRMA Annex I lists copper as *strategic* and Annex II as *critical*; USGS 2025 list also includes it | Identify an actual policy/project-specific copper source. DOE's release gives no copper-to-selectee mapping. Confirm mine/processing/recycling supply-chain stages and register issuer-backed status details |
| **Scandium** | DOE's $162m cohort explicitly includes scandium; EU CRMA Annex II includes scandium as *critical*; USGS 2025 critical list includes it | Find project/source identifying which selected pilot recovers scandium. The cohort release gives no one-to-one mapping. Confirm grade, input/output and current source-linked production position before completing material profile |
| **Silicon metal** | DOE's 20 August battery Round 3 project selection identifies Coreshell's silicon-anode electrodes/cells using metallurgical silicon; EU CRMA Annex I lists *silicon metal* as strategic; USGS 2025 list includes silicon | Distinguish silicon metal feedstock, silicon-anode active material, and semiconductor silicon. Verify Coreshell material input and production stage. Avoid conflating silicon-bearing products with silicon-metal mining/refining |

## Next wave after source-specific project admission

- **Manganese (battery grade):** strategic under EU Annex I; USGS 2025 lists manganese. Prefer source-backed grade and cathode-production distinctions over unqualified all-manganese classification.
- **Magnesium metal:** strategic under EU Annex I; USGS 2025 includes magnesium. DOE's June 2026 Big Blue Technologies pilot is a candidate for future project-specific source assessment.
- **Titanium metal:** strategic under EU Annex I; USGS 2025 includes titanium. Keep metal feedstock and titanium dioxide pigment distinct.
- **Platinum-group metals:** strategic group under EU Annex I. Consider group plus child metals only when primary project data supports element-level granularity; avoid double counting group and constituent events.
- **Niobium/beryllium:** included in EU Annex II and USGS 2025; qualify through source-specific finance, defense supply chain or industrial policy cases before opening new records.

## Taxonomy rules

1. Each material is keyed to `data/seed/materials.json` and may be cited only by events, projects or finance rows whose sources establish a **specific** connection, rather than a general statement about a broad cohort or its industry.
2. Admission requires a source-supported `statusSummary`, `chinaPositionNote`, relevant downstream sectors and linked references under the existing typed `Material` schema. Unknown current production/market structure must not be guessed.
3. Source wording controls substance and form: e.g. *silicon metal*, *battery-grade manganese*, *magnesium metal*, *platinum-group metals*. Record any normalization explicitly; keep the legal scope from the primary source.
4. Use a dedicated, small data PR with material source reviews, backward/forward reference tests and rendered dossier checks. Source-linked value comes before gross material count.

## Primary reference set

- [DOE $162m byproduct pilot selections, 18 August 2026](https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-162-million-accelerate)
- [DOE Round 3 selected silicon-anode project (Coreshell) and other 20 August 2026 selections](https://www.energy.gov/cmei/manufacturing/battery-manufacturing-and-recycling-grants)
- [EUR-Lex, Regulation (EU) 2024/1252 Annex I and II](https://eur-lex.europa.eu/eli/reg/2024/1252/oj)
- [USGS 2025 List of Critical Minerals](https://www.usgs.gov/media/images/2025-list-critical-minerals)

**Dependency:** finish Korea/Brazil draft PR #195 source review and DOE selection intake. The next implementation target is **three well-supported materials**, not eight unsourced taxonomy entries.
