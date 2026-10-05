# Strategic Concern -> Industrial Response: generated tables

As-of date: **2026-10-03** (explicit argument). Dataset record-as-of (`site.lastUpdated`): **2026-10-02**. These are different dates.
All figures are record counts over the checked-out seed data. No money is summed.

## 1. Denominators

| Record kind | Count |
| --- | --- |
| Policy events | 61 |
| Events carrying >=1 financial commitment row | 31 |
| Events carrying >=1 control clause | 19 |
| Events carrying both | 2 |
| Framing claims (quoted rationale) | 57 |
| Events with >=1 framing claim | 53 |
| Commitment-bearing events with >=1 framing claim (any source) | 24 |
| Commitment-bearing events with >=1 framing claim from an official source | 23 |
| Financial commitment rows | 85 |
| Control clauses | 45 |
| Project designations | 32 |
| Registry projects | 57 |
| Registry projects linked by >=1 commitment row | 32 |

Financial rows by value role (every row has exactly one):

| Value role | Rows |
| --- | --- |
| commitment | 63 |
| program_envelope | 8 |
| indication | 5 |
| budget_appropriation | 3 |
| expected_co_investment | 1 |
| funding_option | 1 |
| lending_authority | 1 |
| private_financing | 1 |
| recipient_own_funds | 1 |
| total_project_cost | 1 |

Financial rows by legal standing (rule in `legalStanding`; an unstated status is never read as not-yet-binding):

| Legal standing | Rows |
| --- | --- |
| binding | 34 |
| ended | 1 |
| not_yet_binding | 49 |
| status_not_stated | 1 |

Stage-lattice placement (from `stageLatticeGaps`; each kind's buckets are exclusive):

| Kind | Total | Placed on a material x stage cell | Not placed (why) |
| --- | --- | --- | --- |
| Capital rows | 85 | 57 | no providing tracked government 1; government row missing stage or material 6; other value roles 21 (program_envelope 8, budget_appropriation 3, indication 5, expected_co_investment 1, total_project_cost 1, private_financing 1, recipient_own_funds 1, lending_authority 1) |
| Control clauses | 45 | 18 | no stage by rule 16; no stage, other 11; stage but no tracked material 0 |
| Designations | 32 | 30 | unplaced 2 |

## 2. Lifecycle refresh queue regenerated at 2026-10-03

| Priority | Bundles | Rows (row's own priority) |
| --- | --- | --- |
| P0 | 0 | 0 |
| P1 | 18 | 25 |
| P2 | 16 | 27 |
| P3 | 19 | 33 |

P1 bundles: 18; rows in them: 29; of those rows, individually P1: 25; P1 only through bundle membership: 4.

## 3. Government commitments: financial standing x physical status (independent axes)

Government commitment (GC) rows: role `commitment`, a providing tracked government, not ended. 62 rows; 44 after folding parts into packages that are themselves GC rows (package counted once).
Not GC (23): budget_appropriation 3; commitment with no tracked providing government 1; ended private_financing 1; expected_co_investment 1; funding_option 1; indication 5; lending_authority 1; program_envelope 8; recipient_own_funds 1; total_project_cost 1.
GC rows by capital source: mixed_vehicle 1; not_stated 1; public 54; public_enterprise 6 (mixed_vehicle and not_stated are not public capital).

Unfolded GC rows (62), current financial status (rows) x current physical status of the row's own implementation history:

| Financial status | none recorded | not applicable | announced | feasibility | construction | commissioning | operational | completed | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| announced | 8 | 2 | 0 | 0 | 3 | 1 | 0 | 0 | 14 |
| authorized | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| decided | 4 | 4 | 4 | 1 | 2 | 0 | 0 | 0 | 15 |
| contracted | 14 | 4 | 0 | 0 | 4 | 0 | 0 | 1 | 23 |
| partially_disbursed | 1 | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 4 |
| disbursed | 1 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 5 |

Folded view (44):

| Financial status | none recorded | not applicable | announced | feasibility | construction | commissioning | operational | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| announced | 6 | 2 | 0 | 0 | 3 | 1 | 0 | 12 |
| authorized | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| decided | 4 | 2 | 2 | 1 | 2 | 0 | 0 | 11 |
| contracted | 3 | 4 | 0 | 0 | 4 | 0 | 0 | 11 |
| partially_disbursed | 1 | 0 | 0 | 1 | 0 | 0 | 2 | 4 |
| disbursed | 1 | 2 | 0 | 0 | 2 | 0 | 0 | 5 |

GC rows (folded, 44) by instrument and legal standing. Price floors, offtakes, procurement rights and tax credits carry no funding amount; they are commitments of the government but are not money, and are never added to money instruments. Conditional or preliminary decisions (status `decided`) are not binding.

| Instrument | Binding (contracted / part. disbursed / disbursed) | Not yet binding (announced / authorized / allocated / decided) | Status not stated | Total |
| --- | --- | --- | --- | --- |
| equity | 6 | 2 | 0 | 8 |
| grant | 5 | 7 | 0 | 12 |
| loan | 2 | 2 | 0 | 4 |
| loan_guarantee | 1 | 0 | 0 | 1 |
| mixed | 0 | 1 | 0 | 1 |
| offtake | 3 | 1 | 0 | 4 |
| price_floor | 1 | 0 | 0 | 1 |
| procurement_right | 0 | 1 | 0 | 1 |
| tax_credit | 0 | 1 | 0 | 1 |
| unspecified | 2 | 9 | 0 | 11 |

Rows named in the analysis and kept apart from GC: options (`funding_option`), indications, program envelopes, appropriations, lending authority, private financing, recipient own funds (a cash balance a company commits to spend), total project cost and expected co-investment. Their count by role is in section 1.

### 3b. Project-level view (deduplicated by registry project)

| Measure | Projects | Denominator |
| --- | --- | --- |
| Registry projects with >=1 commitment row of any role | 32 | 57 registry projects |
| ...with >=1 GC row | 29 | 32 |
| ...with >=1 binding GC row (contracted, partially disbursed or disbursed) | 18 | 29 |
| ...with >=1 funded GC row (partially disbursed or disbursed) | 6 | 29 |
| ...with a recorded physical status on any linked row | 13 | 29 |
| ...with a recorded physical status of construction or later on any linked row | 9 | 29 |
| ...binding GC row AND construction-or-later recorded | 7 | 29 |
| ...construction-or-later recorded but NO binding GC row | 2 | 29 |
| ...strict: construction-or-later recorded, excluding a funded-activity completion (see overlap table) | 8 | 29 |
| ...strict: binding GC row AND construction-or-later | 6 | 29 |
| ...binding GC row but NO physical status recorded | 10 | 29 |
| ...physical statuses that disagree across linked rows | 0 | 29 |

Overlap of the binding and construction-or-later sets (29 projects with a GC row; the two sets are **not nested**). Funded-activity completions: prj-ca-cyclic-kingston-demonstration-plant (status is the completion of a funded "Extended Operations" project per its own note, so it is counted in the headline but excluded from the strict column).

| Cell | Projects | Which |
| --- | --- | --- |
| Binding GC row AND construction-or-later (as recorded) | 7 | ca-cyclic-kingston-centre-of-excellence, ca-cyclic-kingston-demonstration-plant, ca-nmg-matawinie, ee-neo-rare-earth-magnet-project, us-inl-antimony-pilot, us-mp-10x-facility, us-stibnite |
| Binding GC row, construction-or-later NOT recorded: some physical status below construction | 1 | na-lofdal |
| Binding GC row, NO physical status recorded | 10 | au-nolans, ca-ggt-graphite-recycling-pilot, ee-co2graphite, us-estelle-antimony, us-mountain-pass-samarium, us-usar-magnet-project-2, us-usar-metal-project-2, us-usar-round-top, us-usar-stillwater-magnet, us-usar-stillwater-metal |
| NO binding GC row, construction-or-later recorded | 2 | au-alcoa-sojitz-gallium, ca-ggt-regolith-graphite |
| NO binding GC row, some physical status below construction | 3 | ca-ucore-kingston, ca-wicheeda, jp-almt-tungsten |
| NO binding GC row, NO physical status recorded | 6 | gb-hemerdon, jp-japan-new-metals-tungsten, jp-santoku-rare-earth, jp-shin-etsu-rare-earth, us-5n-st-george-germanium-refining, us-5n-st-george-germanium-substrates |
| Total | 29 | - |

Project register (every registry project with a commitment row; physical status is a fact about the project's linked rows as recorded, not completion of any one instrument's deliverables):

| Project | Name | Rows (id: role, financial status) | Recorded physical status (row: history) |
| --- | --- | --- | --- |
| prj-au-alcoa-sojitz-gallium | Alcoa-Sojitz Gallium Recovery Project | au-alcoa-sojitz-gallium-2025-equity: commitment, announced; au-alcoa-sojitz-gallium-2025-offtake-right: commitment, announced; us-alcoa-sojitz-gallium-2025-equity: commitment, announced | au-alcoa-sojitz-gallium-2025-equity: construction@2026-08-24; au-alcoa-sojitz-gallium-2025-offtake-right: construction@2026-08-24; us-alcoa-sojitz-gallium-2025-equity: construction@2026-08-24 |
| prj-au-nolans | Nolans project | au-arafura-nolans-2025-equity: commitment, contracted | au-arafura-nolans-2025-equity: none recorded |
| prj-ca-cyclic-kingston-centre-of-excellence | Kingston Centre of Excellence for Rare Earth Recycling | ca-cgf-cyclic-2026-equity: commitment, contracted; ca-feddev-cyclic-2025-contribution: commitment, contracted; ca-gpi-cyclic-2026-centre-excellence: commitment, decided | ca-cgf-cyclic-2026-equity: construction@2026-01-20; ca-feddev-cyclic-2025-contribution: announced@2025-06-11 > construction@2026-01-20; ca-gpi-cyclic-2026-centre-excellence: construction@2026-01-20 |
| prj-ca-cyclic-kingston-demonstration-plant | Kingston Demonstration Plant | ca-cmrdd-2024-cyclic-materials: commitment, contracted | ca-cmrdd-2024-cyclic-materials: completed@undated |
| prj-ca-ggt-graphite-recycling-pilot | Recycling of Graphite from Secondary Sources for Use in Lithium-Ion Batteries | ca-cmrdd-2024-green-graphite: commitment, contracted | ca-cmrdd-2024-green-graphite: none recorded |
| prj-ca-ggt-regolith-graphite | Battery-Grade Graphite: A Canadian Low-GHG Solution From Regolith Resources | ca-pdac-2026-ggt-eip: commitment, announced | ca-pdac-2026-ggt-eip: commissioning@2026-08-11 |
| prj-ca-nmg-matawinie | Matawinie Mine | ca-g7-2025-nmg-canada-growth-fund: commitment, disbursed; ca-g7-2025-nmg-edc-letter-of-interest: indication (not GC), announced; ca-g7-2025-nmg-offtake: commitment, contracted | ca-g7-2025-nmg-canada-growth-fund: construction@2026-04-13; ca-g7-2025-nmg-edc-letter-of-interest: construction@2026-04-13; ca-g7-2025-nmg-offtake: construction@2026-04-13 |
| prj-ca-trail-strategic-metals | Trail Strategic Metals Initiative | ca-trail-cgf-2026-indication: indication (not GC), announced | ca-trail-cgf-2026-indication: none recorded |
| prj-ca-ucore-kingston | Ucore commercial rare earth processing facility, Kingston | ca-g7-2025-ucore-feddev: commitment, decided; ca-g7-2025-ucore-nrcan: commitment, decided; ca-g7-2025-ucore-package: commitment, decided | ca-g7-2025-ucore-feddev: announced@2025-10-31; ca-g7-2025-ucore-nrcan: announced@2025-10-31; ca-g7-2025-ucore-package: announced@2025-10-31 |
| prj-ca-vianode-st-thomas | Vianode synthetic graphite facility, St. Thomas | ca-g7-2025-vianode-edc-letter-of-interest: indication (not GC), announced; de-g7-2025-vianode-export-credit-guarantee: indication (not GC), announced | ca-g7-2025-vianode-edc-letter-of-interest: none recorded; de-g7-2025-vianode-export-credit-guarantee: none recorded |
| prj-ca-wicheeda | Wicheeda Rare Earth Elements Project | ca-pdac-2026-wicheeda-flmf: commitment, decided | ca-pdac-2026-wicheeda-flmf: feasibility@2026-07-13 |
| prj-ee-co2graphite | CO2Graphite | eu-eib-2025-up-catalyst-loan: commitment, contracted | eu-eib-2025-up-catalyst-loan: none recorded |
| prj-ee-neo-rare-earth-magnet-project | Neo Performance's rare earths magnet project in Estonia | eu-jtf-2025-neo-magnet-project: commitment, partially_disbursed | eu-jtf-2025-neo-magnet-project: operational@2026-09-14 |
| prj-gb-hemerdon | Hemerdon tungsten and tin mine | uk-nwf-2026-tungsten-procurement-right: commitment, announced; uk-nwf-2026-tungsten-west-equity: commitment, announced; uk-nwf-2026-tungsten-west-lending: commitment, announced; uk-nwf-2026-tungsten-west-package: commitment, announced | uk-nwf-2026-tungsten-procurement-right: none recorded; uk-nwf-2026-tungsten-west-equity: none recorded; uk-nwf-2026-tungsten-west-lending: none recorded; uk-nwf-2026-tungsten-west-package: none recorded |
| prj-jp-almt-tungsten | Allied Material tungsten reduction and carburisation facilities | jp-jogmec-almt-tungsten-grant: commitment, decided | jp-jogmec-almt-tungsten-grant: announced@2026-04-09 |
| prj-jp-japan-new-metals-tungsten | Japan New Metals tungsten hydrometallurgical refining facilities in Japan | jp-jogmec-japan-new-metals-tungsten-grant: commitment, announced | jp-jogmec-japan-new-metals-tungsten-grant: none recorded |
| prj-jp-santoku-rare-earth | Santoku rare earth smelting facilities in Japan | jp-jogmec-santoku-rare-earth-grant: commitment, decided | jp-jogmec-santoku-rare-earth-grant: none recorded |
| prj-jp-shin-etsu-rare-earth | Shin-Etsu Chemical rare earth smelting facilities in Japan | jp-jogmec-shin-etsu-rare-earth-grant: commitment, decided | jp-jogmec-shin-etsu-rare-earth-grant: none recorded |
| prj-kz-sarytogan | Sarytogan Graphite Project | ebrd-2025-sarytogan-equity: commitment (not GC), contracted | ebrd-2025-sarytogan-equity: none recorded |
| prj-na-lofdal | Lofdal heavy rare earth development project | jp-jogmec-lofdal-2026-equity: commitment, partially_disbursed | jp-jogmec-lofdal-2026-equity: feasibility@undated |
| prj-us-5n-st-george-germanium-refining | St. George germanium recovery and refining expansion | us-dow-5n-germanium-2025: commitment, decided | us-dow-5n-germanium-2025: none recorded |
| prj-us-5n-st-george-germanium-substrates | St. George space-qualified germanium substrate capacity expansion | us-dod-5n-germanium-2024: commitment, decided | us-dod-5n-germanium-2024: none recorded |
| prj-us-estelle-antimony | Estelle Gold and Critical Minerals Project — integrated antimony supply chain | us-dow-arr-antimony-2025: commitment, contracted | us-dow-arr-antimony-2025: none recorded |
| prj-us-inl-antimony-pilot | INL antimony sulfide modular pilot plant | us-army-perpetua-antimony-otia: commitment, partially_disbursed | us-army-perpetua-antimony-otia: operational@2026-07-29 |
| prj-us-mountain-pass-samarium | Mountain Pass heavy rare earth separation expansion (Samarium Project) | us-dod-mp-2025-samarium-loan: commitment, disbursed | us-dod-mp-2025-samarium-loan: none recorded |
| prj-us-mp-10x-facility | 10X Facility | us-dod-mp-2025-bank-financing: private_financing (not GC), lapsed; us-dod-mp-2025-magnet-offtake: commitment, contracted | us-dod-mp-2025-bank-financing: construction@undated; us-dod-mp-2025-magnet-offtake: announced@2025-07-10 > construction@undated |
| prj-us-stibnite | Stibnite Gold Project | us-dod-perpetua-stibnite-dpa: commitment, disbursed; us-exim-perpetua-stibnite-2026: commitment, decided | us-dod-perpetua-stibnite-dpa: construction@undated; us-exim-perpetua-stibnite-2026: construction@undated |
| prj-us-usar-magnet-project-2 | Magnet Project 2 | us-chips-usar-2026-magnet-project-2-direct-funding: commitment, contracted; us-chips-usar-2026-magnet-project-2-loan-guarantee: commitment, contracted | us-chips-usar-2026-magnet-project-2-direct-funding: none recorded; us-chips-usar-2026-magnet-project-2-loan-guarantee: none recorded |
| prj-us-usar-metal-project-2 | Metal Project 2 | us-chips-usar-2026-metal-project-2-direct-funding: commitment, contracted; us-chips-usar-2026-metal-project-2-loan-guarantee: commitment, contracted | us-chips-usar-2026-metal-project-2-direct-funding: none recorded; us-chips-usar-2026-metal-project-2-loan-guarantee: none recorded |
| prj-us-usar-round-top | Round Top Mine Project | us-chips-usar-2026-round-top-direct-funding: commitment, contracted; us-chips-usar-2026-round-top-loan-guarantee: commitment, contracted | us-chips-usar-2026-round-top-direct-funding: none recorded; us-chips-usar-2026-round-top-loan-guarantee: none recorded |
| prj-us-usar-stillwater-magnet | Stillwater Magnet Project | us-chips-usar-2026-stillwater-magnet-direct-funding: commitment, contracted; us-chips-usar-2026-stillwater-magnet-loan-guarantee: commitment, contracted | us-chips-usar-2026-stillwater-magnet-direct-funding: none recorded; us-chips-usar-2026-stillwater-magnet-loan-guarantee: none recorded |
| prj-us-usar-stillwater-metal | Stillwater Metal Project | us-chips-usar-2026-stillwater-metal-direct-funding: commitment, contracted; us-chips-usar-2026-stillwater-metal-loan-guarantee: commitment, contracted | us-chips-usar-2026-stillwater-metal-direct-funding: none recorded; us-chips-usar-2026-stillwater-metal-loan-guarantee: none recorded |

GC rows (folded) with no registry project: 15 of 44. By recipient: au-cmpti-2025-production-tax-offset (Constitutional corporations with registered CMPTI processing activities); ca-cmrdd-2024-kingston-awards (Cyclic Materials Incorporated and Green Graphite Technologies Inc.); ca-g7-2025-focus-graphite-gpi (Focus Graphite); ca-g7-2025-northern-graphite-nrc (Northern Graphite and Rain Carbon Canada); ca-pdac-2026-nb-granitoids-cmgd (New Brunswick Geological Survey); ca-pdac-2026-nb-maritimes-basin-cmgd (New Brunswick Geological Survey); ca-pdac-2026-ns-graphite-cmgd (Nova Scotia Department of Natural Resources); jp-jare-lynas-2023-equity (Lynas Rare Earths Limited); jp-jare-lynas-2023-hre-offtake (Lynas Rare Earths Limited); us-chips-usar-2026-direct-funding (USA Rare Earth, Inc.); us-chips-usar-2026-loan-guarantee (USA Rare Earth, Inc.); us-dod-mp-2025-preferred-equity (MP Materials Corp.); us-dod-mp-2025-price-floor (MP Materials Corp.); us-dow-usac-antimony-2026 (United States Antimony Corporation); us-osc-vulcan-reelement-2025-joint-commitment (Vulcan Elements and ReElement Technologies).

## 4. Material-by-material comparison

A row or clause tagged to several materials appears in each of those materials' rows below. **Material rows must never be added together.** Event and clause counts are likewise per material.

### 4a. Concern and controls

| Material | Events naming it | Framing claims on those events | of which on commitment-bearing events (responder framing, any source) | ...official source only | Framing categories on commitment-bearing events (official source only) | Control clauses tagged | Status on as-of: in force / suspended / announced / concluded | Clauses whose current status has a stated end after as-of |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| antimony | 20 | 22 | 9 | 9 | supply_chain_resilience 8, national_security 6, economic_security 4 | 3 | 1 / 1 / 1 / 0 | 1 |
| dysprosium | 11 | 12 | 4 | 4 | supply_chain_resilience 4, economic_security 1 | 3 | 3 / 0 / 0 / 0 | 0 |
| gallium | 19 | 21 | 6 | 6 | supply_chain_resilience 5, economic_security 4, allied_coordination 1, national_security 1 | 4 | 2 / 1 / 1 / 0 | 1 |
| germanium | 17 | 19 | 5 | 5 | supply_chain_resilience 5, economic_security 3, national_security 3 | 3 | 1 / 1 / 1 / 0 | 1 |
| graphite | 22 | 23 | 7 | 7 | supply_chain_resilience 6, economic_security 4, allied_coordination 2 | 7 | 2 / 3 / 0 / 2 | 3 |
| neodymium | 8 | 9 | 2 | 1 | economic_security 1, supply_chain_resilience 1 | 1 | 1 / 0 / 0 / 0 | 0 |
| praseodymium | 9 | 10 | 2 | 1 | economic_security 1, supply_chain_resilience 1 | 1 | 1 / 0 / 0 / 0 | 0 |
| rare-earth-elements | 38 | 36 | 14 | 13 | supply_chain_resilience 11, economic_security 5, allied_coordination 3, national_security 1 | 25 | 8 / 15 / 1 / 1 | 15 |
| ndfeb-magnets | 13 | 15 | 5 | 4 | supply_chain_resilience 4, economic_security 1, national_security 1 | 12 | 5 / 6 / 0 / 1 | 6 |
| terbium | 12 | 13 | 4 | 4 | supply_chain_resilience 4, economic_security 1 | 3 | 3 / 0 / 0 / 0 | 0 |
| tungsten | 18 | 18 | 4 | 4 | economic_security 3, supply_chain_resilience 3, national_security 1 | 2 | 1 / 0 / 1 / 0 | 0 |

### 4b. Government response: standing and physical, per material

Government commitment rows folded per material (a part folds only into a GC package that names the same material). "Named project rows" are GC rows with a registry project; "distinct projects" dedupes them.

| Material | GC rows (folded) | funded (part./full disb.) | contracted only | not yet binding | status not stated | named-project GC rows (folded) | distinct named projects (unfolded GC rows) | of those, construction-or-later recorded | funding options | indications | envelopes / appropriations / authority | private / own funds / total cost / expected co-invest | ended rows (any role) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| antimony | 6 | 3 | 1 | 2 | 0 | 4 | 3 | 2 | 0 | 1 | 1 | 0 | 0 |
| dysprosium | 6 | 2 | 3 | 1 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| gallium | 6 | 0 | 2 | 4 | 0 | 3 | 2 | 1 | 0 | 1 | 1 | 0 | 0 |
| germanium | 3 | 0 | 0 | 3 | 0 | 2 | 2 | 0 | 0 | 1 | 0 | 0 | 0 |
| graphite | 9 | 1 | 2 | 6 | 0 | 4 | 4 | 2 | 0 | 3 | 0 | 0 | 0 |
| neodymium | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| praseodymium | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| rare-earth-elements | 18 | 4 | 5 | 9 | 0 | 10 | 12 | 2 | 1 | 0 | 1 | 1 | 0 |
| ndfeb-magnets | 6 | 2 | 3 | 1 | 0 | 2 | 4 | 2 | 1 | 0 | 0 | 1 | 0 |
| terbium | 6 | 2 | 3 | 1 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| tungsten | 6 | 0 | 0 | 6 | 0 | 4 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |

Material tagging caveat. Rows naming at least three tracked materials (they inflate thin materials' rows):

| Row | Role | Materials | materialAttribution | stageAllocation |
| --- | --- | --- | --- | --- |
| fin-au-cmpti-2025-production-tax-offset | commitment | antimony, gallium, germanium, graphite, rare-earth-elements, dysprosium, neodymium, praseodymium, terbium, tungsten | includes_untracked | multi_stage_unallocated |
| fin-au-cmsr-2026-reserve | program_envelope | antimony, gallium, rare-earth-elements | tracked_only | not_stated |
| fin-ca-trail-cgf-2026-indication | indication | germanium, antimony, gallium | tracked_only | multi_stage_unallocated |
| fin-jp-jare-lynas-2023-equity | commitment | rare-earth-elements, dysprosium, terbium | tracked_only | not_stated |
| fin-jp-jogmec-lofdal-2026-equity | commitment | rare-earth-elements, dysprosium, terbium | tracked_only | multi_stage_unallocated |
| fin-us-chips-usar-2026-direct-funding | commitment | rare-earth-elements, gallium, dysprosium, terbium, ndfeb-magnets | includes_untracked | multi_stage_unallocated |
| fin-us-chips-usar-2026-loan-guarantee | commitment | rare-earth-elements, gallium, dysprosium, terbium, ndfeb-magnets | includes_untracked | multi_stage_unallocated |
| fin-us-chips-usar-2026-round-top-direct-funding | commitment | rare-earth-elements, gallium, dysprosium, terbium | includes_untracked | multi_stage_unallocated |
| fin-us-chips-usar-2026-round-top-loan-guarantee | commitment | rare-earth-elements, gallium, dysprosium, terbium | includes_untracked | multi_stage_unallocated |

### 4c. Providing government of GC rows (folded), per material

| Material | australia | canada | eu | japan | uk | us |
| --- | --- | --- | --- | --- | --- | --- |
| antimony | 1 | 0 | 0 | 0 | 0 | 5 |
| dysprosium | 1 | 0 | 0 | 3 | 0 | 2 |
| gallium | 3 | 0 | 0 | 0 | 0 | 3 |
| germanium | 1 | 0 | 0 | 0 | 0 | 2 |
| graphite | 1 | 7 | 1 | 0 | 0 | 0 |
| neodymium | 1 | 0 | 0 | 0 | 0 | 1 |
| praseodymium | 1 | 0 | 0 | 0 | 0 | 1 |
| rare-earth-elements | 2 | 7 | 0 | 4 | 0 | 5 |
| ndfeb-magnets | 0 | 0 | 1 | 0 | 0 | 5 |
| terbium | 1 | 0 | 0 | 3 | 0 | 2 |
| tungsten | 1 | 1 | 0 | 2 | 2 | 0 |

### 4d. Stage cells: capital and controls on the same material x stage (from `stageResponseMap`)

A cell holds record counts. A control's stage is where its covered items sit, not a claim that the clause restricts that stage; sharing a cell shows co-location, not effect or cause. Capital = non-ended government commitments (packages once); options and ended rows are apart.

Cells (material x stage with any record): 52. Capital and controls both: 28; capital only: 22; controls only: 2; designation/option/ended only: 0. (A row counted in a cell is counted once per cell; cells are not additive.)

| Material | Stage | Capital rows (actors) | Options | Ended | Control clauses (issuer) | Control status on as-of | Designations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| antimony | mining | 4 (us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| antimony | processing | 6 (australia/us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| antimony | refining | 3 (australia/us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| dysprosium | exploration | 1 (japan) | 0 | 0 | 0 | - | 0 |
| dysprosium | mining | 3 (japan/us) | 0 | 0 | 0 | - | 0 |
| dysprosium | separation | 1 (japan) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| dysprosium | processing | 3 (australia/us) | 0 | 0 | 0 | - | 0 |
| dysprosium | refining | 3 (australia/us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| dysprosium | component_manufacturing | 2 (us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| gallium | mining | 2 (us) | 0 | 0 | 0 | - | 1 |
| gallium | processing | 6 (australia/us) | 0 | 0 | 1 (china 1) | in_force 1 | 1 |
| gallium | refining | 3 (australia/us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| gallium | component_manufacturing | 2 (us) | 0 | 0 | 0 | - | 0 |
| germanium | processing | 1 (australia) | 0 | 0 | 1 (china 1) | in_force 1 | 1 |
| germanium | refining | 3 (australia/us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| germanium | component_manufacturing | 1 (us) | 0 | 0 | 0 | - | 0 |
| germanium | recycling | 1 (us) | 0 | 0 | 0 | - | 0 |
| graphite | exploration | 1 (canada) | 0 | 0 | 0 | - | 0 |
| graphite | mining | 2 (canada) | 0 | 0 | 1 (china 1) | in_force 1 | 6 |
| graphite | processing | 4 (australia/canada/eu) | 0 | 0 | 4 (china 2, us 2) | suspended 1, in_force 1, concluded 2 | 6 |
| graphite | refining | 1 (australia) | 0 | 0 | 0 | - | 0 |
| graphite | recycling | 1 (canada) | 0 | 0 | 0 | - | 3 |
| graphite | research_development | 1 (canada) | 0 | 0 | 0 | - | 0 |
| neodymium | processing | 1 (australia) | 0 | 0 | 0 | - | 0 |
| neodymium | refining | 1 (australia) | 0 | 0 | 0 | - | 0 |
| praseodymium | processing | 1 (australia) | 0 | 0 | 0 | - | 0 |
| praseodymium | refining | 1 (australia) | 0 | 0 | 0 | - | 0 |
| rare-earth-elements | exploration | 2 (canada/japan) | 0 | 0 | 0 | - | 0 |
| rare-earth-elements | mining | 4 (canada/japan/us) | 0 | 0 | 6 (china 6) | suspended 4, in_force 2 | 3 |
| rare-earth-elements | separation | 5 (canada/us) | 0 | 0 | 9 (china 9) | suspended 6, in_force 3 | 1 |
| rare-earth-elements | processing | 6 (australia/canada/us) | 0 | 0 | 3 (china 2, us 1) | suspended 2, concluded 1 | 3 |
| rare-earth-elements | refining | 7 (australia/canada/japan/us) | 0 | 0 | 6 (china 6) | suspended 5, in_force 1 | 2 |
| rare-earth-elements | component_manufacturing | 4 (us) | 0 | 0 | 6 (china 6) | suspended 5, in_force 1 | 0 |
| rare-earth-elements | recycling | 4 (canada) | 0 | 0 | 4 (china 4) | suspended 4 | 2 |
| rare-earth-elements | research_development | 1 (canada) | 0 | 0 | 0 | - | 0 |
| rare-earth-elements | cross_cutting | 0 | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| ndfeb-magnets | mining | 2 (us) | 0 | 0 | 2 (china 2) | suspended 2 | 0 |
| ndfeb-magnets | separation | 2 (us) | 0 | 0 | 4 (china 4) | suspended 3, in_force 1 | 0 |
| ndfeb-magnets | processing | 3 (us) | 0 | 0 | 2 (china 1, us 1) | suspended 1, concluded 1 | 0 |
| ndfeb-magnets | refining | 3 (us) | 0 | 0 | 4 (china 4) | suspended 3, in_force 1 | 0 |
| ndfeb-magnets | component_manufacturing | 6 (eu/us) | 0 | 0 | 4 (china 4) | suspended 3, in_force 1 | 0 |
| ndfeb-magnets | recycling | 0 | 0 | 0 | 3 (china 3) | suspended 3 | 0 |
| terbium | exploration | 1 (japan) | 0 | 0 | 0 | - | 0 |
| terbium | mining | 3 (japan/us) | 0 | 0 | 0 | - | 0 |
| terbium | separation | 1 (japan) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| terbium | processing | 3 (australia/us) | 0 | 0 | 0 | - | 0 |
| terbium | refining | 3 (australia/us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| terbium | component_manufacturing | 2 (us) | 0 | 0 | 1 (china 1) | in_force 1 | 0 |
| tungsten | exploration | 1 (canada) | 0 | 0 | 0 | - | 0 |
| tungsten | mining | 2 (uk) | 0 | 0 | 0 | - | 3 |
| tungsten | processing | 3 (australia/japan/uk) | 0 | 0 | 1 (china 1) | in_force 1 | 2 |
| tungsten | refining | 2 (australia/japan) | 0 | 0 | 1 (china 1) | in_force 1 | 1 |

## 5. Rationale on the announcing event, per commitment-bearing event

Framing attached to the event that announces a commitment is the announcing government's stated rationale for that event. It is quoted framing, not evidence that a control caused the instrument. Only events carrying commitment rows are listed. A claim whose source is not an official document is marked; it is excluded from every count that requires official government framing.

| Event | Actor | Date | Framing claims (id: categories) | Fin. rows | Control clauses on same event |
| --- | --- | --- | --- | --- | --- |
| evt-au-cmpti-2025 | australia | 2025-02-14 | fc-au-cmpti-processing: supply_chain_resilience+economic_security | 1 | 0 |
| evt-au-cmsr-2026 | australia | 2026-01-12 | fc-au-cmsr-econsec: economic_security | 4 | 0 |
| evt-ca-cgf-cyclic-2026 | canada | 2026-01-20 | none on record | 1 | 0 |
| evt-ca-cms-2022 | canada | 2022-12-09 | fc-ca-cms-allies: allied_coordination; fc-ca-cms-opportunity: economic_security+supply_chain_resilience | 1 | 0 |
| evt-ca-feddev-cyclic-2025 | canada | 2025-09-01 | none on record | 1 | 0 |
| evt-ca-g7-cmpa-2025 | canada | 2025-10-31 | fc-ca-g7-cmpa-2025-resilience: supply_chain_resilience+allied_coordination | 10 | 0 |
| evt-ca-g7-cmpa-2026 | canada | 2026-03-02 | none on record | 1 | 0 |
| evt-ca-nrcan-cmrdd-2024 | canada | 2024-09-04 | fc-ca-cmrdd-resilience: supply_chain_resilience | 3 | 0 |
| evt-ca-nrcan-pdac-2026 | canada | 2026-03-03 | none on record | 5 | 0 |
| evt-ca-trail-strategic-metals-2026 | canada | 2026-07-07 | fc-ca-trail-strategic-metals-2026-security: economic_security+national_security+supply_chain_resilience | 1 | 0 |
| evt-eu-resourceeu-2025 | eu | 2025-12-03 | fc-eu-resourceeu-2025-weaponisation: economic_security+supply_chain_resilience | 4 | 0 |
| evt-in-ncmm-2025 | india | 2025-01-29 | fc-in-ncmm-selfreliance: economic_security+supply_chain_resilience | 2 | 0 |
| evt-jp-espa-almt-tungsten-2026 | japan | 2026-03-18 | fc-jp-espa-almt-tungsten-supply: supply_chain_resilience+economic_security | 1 | 0 |
| evt-jp-espa-japan-new-metals-tungsten-2026 | japan | 2026-09-07 | none on record | 1 | 0 |
| evt-jp-espa-santoku-rare-earth-2026 | japan | 2026-07-29 | none on record | 1 | 0 |
| evt-jp-espa-shin-etsu-rare-earth-2026 | japan | 2026-05-19 | none on record | 1 | 0 |
| evt-jp-jogmec-lofdal-2026 | japan | 2026-07-23 | fc-jp-lofdal-supply: supply_chain_resilience | 1 | 0 |
| evt-jp-jogmec-lynas-2023 | japan | 2023-03-07 | fc-jp-jogmec-resilience: supply_chain_resilience | 2 | 0 |
| evt-uk-cms-2025 | uk | 2025-11-22 | fc-uk-cms2025-vision: economic_security+supply_chain_resilience | 1 | 0 |
| evt-uk-nwf-tungsten-west-2026 | uk | 2026-08-25 | fc-uk-nwf-natsec: national_security | 4 | 0 |
| evt-us-army-perpetua-otia-2023 | us | 2023-08-18 | fc-us-army-perpetua-otia-2023-resilience: national_security+supply_chain_resilience | 1 | 0 |
| evt-us-au-framework-2025 | australia | 2025-10-20 | fc-us-au-framework-resilience: supply_chain_resilience+allied_coordination | 7 | 0 |
| evt-us-chips-usar-2026 | us | 2026-01-26 | fc-us-chips-usar-2026-chokepoints: supply_chain_resilience | 12 | 1 |
| evt-us-dod-5n-germanium-2024 | us | 2024-04-16 | fc-us-dod-5n-germanium-2024-security: national_security+supply_chain_resilience | 1 | 0 |
| evt-us-dod-mp-2025 | us | 2025-07-10 | fc-us-dod-mp-natsec: national_security [source is news/secondary, not official] | 9 | 2 |
| evt-us-dod-perpetua-dpa-2022 | us | 2022-12-19 | fc-us-dod-perpetua-dpa-2022-resilience: national_security+supply_chain_resilience | 1 | 0 |
| evt-us-dow-5n-germanium-2025 | us | 2025-12-15 | fc-us-dow-5n-germanium-2025-priority: national_security+supply_chain_resilience | 1 | 0 |
| evt-us-dow-arr-antimony-2025 | us | 2025-09-30 | fc-us-dow-arr-antimony-2025-resilience: national_security+supply_chain_resilience | 1 | 0 |
| evt-us-dow-usac-antimony-2026 | us | 2026-03-04 | fc-us-dow-usac-antimony-2026-resilience: national_security+supply_chain_resilience | 1 | 0 |
| evt-us-exim-stibnite-2026 | us | 2026-05-21 | fc-us-exim-stibnite-2026-resilience: national_security+supply_chain_resilience | 1 | 0 |
| evt-us-osc-vulcan-reelement-2025 | us | 2025-11-21 | fc-us-osc-vulcan-magnets: supply_chain_resilience+national_security | 4 | 0 |

## 6. Control clauses and stated end dates at 2026-10-03

| Issuer, current status, stated end | Clauses | Days after as-of |
| --- | --- | --- |
| china in_force until 2026-11-10 | 1 | 38 |
| china suspended until 2026-11-10 | 18 | 38 |
| china suspended until 2026-11-27 | 2 | 55 |

Clause ids with a stated end after the as-of date: ctl-cn-56-2025-customs-declaration, ctl-cn-56-2025-equipment-licensing, ctl-cn-56-2025-raw-materials-licensing, ctl-cn-57-2025-customs-declaration, ctl-cn-57-2025-export-licensing, ctl-cn-58-2025-battery-cathode-licensing, ctl-cn-58-2025-customs-declaration, ctl-cn-58-2025-graphite-anode-licensing, ctl-cn-62-2025-knowledge-catch-all, ctl-cn-62-2025-overseas-support-ban, ctl-cn-62-2025-production-line-technology-licensing, ctl-cn-62-2025-technology-licensing, ctl-cn-ree-2025-10-advanced-chip-ai-review, ctl-cn-ree-2025-10-de-minimis-licensing, ctl-cn-ree-2025-10-foreign-direct-product-licensing, ctl-cn-ree-2025-10-military-listed-end-users, ctl-cn-ree-2025-10-origin-reexport-licensing, ctl-cn-ree-2025-10-prohibited-end-uses, ctl-cn-ree-2025-11-suspension, ctl-cn-us-2024-gallium-germanium-antimony-denial, ctl-cn-us-2024-graphite-end-use-review.

| Issuer | Direction | Status on as-of | Clauses |
| --- | --- | --- | --- |
| canada | inbound_investment | in_force | 3 |
| china | domestic | in_force | 4 |
| china | export | announced | 1 |
| china | export | in_force | 11 |
| china | export | suspended | 14 |
| china | re_export | suspended | 6 |
| us | domestic | in_force | 1 |
| us | import | concluded | 3 |
| us | inbound_investment | in_force | 2 |

## 7. P1-bundle rows: what the queue flag rests on

For each row in a P1 bundle: the queue's own categorical priorities for the two separate clocks (financial status and physical status), the `lifecycleReview` stamps as recorded, and the newest source cited for the status history (published date preferred; a source with only an access date is labelled and is not an evidence date). The flag is a maintenance flag; it does not say the status is wrong, and the rows stay in every baseline count. No freshness score is computed. The last column is the queue's own reason text, verbatim.

| Row | Role (GC?) | Bundle | Row priority | Financial clock | Physical clock | Review stamps (fin / phys) | Newest source in financial history | Newest source in physical history | Queue reason text (verbatim) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fin-eu-eib-2025-up-catalyst-loan | commitment (GC) | CO2Graphite | P1 | contracted, no dated evidence and no review date recorded, P1 | none recorded, no dated evidence and no review date recorded, P1 | none | src-ec-resourceeu-com-945 (published 2025-12-03; 304d) | no physical history | financial lifecycle has no dated status evidence or review; binding or funded commitment has never had a substantive physical-status review |
| fin-au-cmpti-2025-production-tax-offset | commitment (GC) | Commonwealth of Australia (refundable tax offset) — evt-au-cmpti-2025 | P1 | authorized, 596d, P1 | n/a | none | src-legislation-au-cmpti-2025 (published 2025-02-14; 596d) | no physical history | financial lifecycle has not been evidenced or reviewed for 596 days; no physical-project lifecycle is applicable to this row |
| fin-us-dow-arr-antimony-2025 | commitment (GC) | Estelle Gold and Critical Minerals Project — integrated antimony supply chain | P1 | contracted, 367d, P1 | none recorded, no dated evidence and no review date recorded, P1 | none | src-dow-arr-antimony-2025 (published 2025-09-30; 368d) | no physical history | financial lifecycle has not been evidenced or reviewed for 367 days; binding or funded commitment has never had a substantive physical-status review |
| fin-in-ncmm-2025-government-expenditure | program_envelope | Government of India — evt-in-ncmm-2025 | P1 | authorized, 612d, P1 | n/a | none | src-pib-ncmm-2025 (published 2025-01-29; 612d) | no physical history | financial lifecycle has not been evidenced or reviewed for 612 days; no physical-project lifecycle is applicable to this row |
| fin-us-army-perpetua-antimony-otia | commitment (GC) | INL antimony sulfide modular pilot plant | P1 | partially_disbursed, 1142d, P1 | operational, 66d, P3 | none | src-perpetua-sec-dotc-2023 (published 2023-08-21; 1139d) | src-us-army-antimony-pilot-2026 (published 2026-08-06; 58d) | financial lifecycle has not been evidenced or reviewed for 1142 days; physical lifecycle is operational |
| fin-in-ncmm-2025-psu-investment | expected_co_investment | Indian public-sector undertakings ("PSUs, etc.") — evt-in-ncmm-2025 | P1 | announced, 612d, P1 | n/a | none | src-pib-ncmm-2025 (published 2025-01-29; 612d) | no physical history | financial lifecycle has not been evidenced or reviewed for 612 days; no physical-project lifecycle is applicable to this row |
| fin-us-dod-mp-2025-samarium-loan | commitment (GC) | Mountain Pass heavy rare earth separation expansion (Samarium Project) | P1 | disbursed, 451d, P3 | none recorded, no dated evidence and no review date recorded, P1 | none | src-mp-10k-2025 (published 2026-02-26; 219d) | no physical history | financial lifecycle is fully disbursed; binding or funded commitment has never had a substantive physical-status review |
| fin-ca-pdac-2026-nb-granitoids-cmgd | commitment (GC) | Natural Resources Canada (Critical Minerals Geoscience and Data initiative) — evt-ca-nrcan-pdac-2026 | P1 | announced, 214d, P2 | none recorded, no dated evidence and no review date recorded, P1 | none | src-nrcan-pdac-2026 (published 2026-03-03; 214d) | no physical history | non-project financial status is 214 days old; named physical undertaking has never had an implementation review and its financial evidence is old or undated |
| fin-ca-pdac-2026-nb-maritimes-basin-cmgd | commitment (GC) | Natural Resources Canada (Critical Minerals Geoscience and Data initiative) — evt-ca-nrcan-pdac-2026 | P1 | announced, 214d, P2 | none recorded, no dated evidence and no review date recorded, P1 | none | src-nrcan-pdac-2026 (published 2026-03-03; 214d) | no physical history | non-project financial status is 214 days old; named physical undertaking has never had an implementation review and its financial evidence is old or undated |
| fin-ca-pdac-2026-ns-graphite-cmgd | commitment (GC) | Natural Resources Canada (Critical Minerals Geoscience and Data initiative) — evt-ca-nrcan-pdac-2026 | P1 | announced, 214d, P2 | none recorded, no dated evidence and no review date recorded, P1 | none | src-nrcan-pdac-2026 (published 2026-03-03; 214d) | no physical history | non-project financial status is 214 days old; named physical undertaking has never had an implementation review and its financial evidence is old or undated |
| fin-ca-cmrdd-2024-kingston-awards | commitment (GC) | Natural Resources Canada (Critical Minerals Research, Development and Demonstration program) — evt-ca-nrcan-cmrdd-2024 | P1 | announced, 759d, P1 | n/a | none | src-nrcan-cmrdd-2024 (published 2024-09-04; 759d) | no physical history | financial lifecycle has not been evidenced or reviewed for 759 days; no physical-project lifecycle is applicable to this row |
| fin-ca-cms-2022-budget-envelope | budget_appropriation | Natural Resources Canada (Critical Minerals Research, Development and Demonstration program) — evt-ca-nrcan-cmrdd-2024 | P1 | announced, 1394d, P1 | n/a | none | src-nrcan-cms-2022 (published 2022-12-09; 1394d) | no physical history | financial lifecycle has not been evidenced or reviewed for 1394 days; no physical-project lifecycle is applicable to this row |
| fin-ebrd-2025-sarytogan-equity | commitment | Sarytogan Graphite Project | P1 | contracted, no dated evidence and no review date recorded, P1 | none recorded, no dated evidence and no review date recorded, P1 | none | src-ec-resourceeu-com-945 (published 2025-12-03; 304d) | no physical history | financial lifecycle has no dated status evidence or review; binding or funded commitment has never had a substantive physical-status review |
| fin-us-dow-5n-germanium-2025 | commitment (GC) | St. George germanium recovery and refining expansion | P1 | decided, 292d, P1 | none recorded, no dated evidence and no review date recorded, P1 | none | src-dow-5n-germanium-2026 (published 2026-01-29; 247d) | no physical history | named-project financial status is pre-binding and 292 days old; named physical undertaking has never had an implementation review and its financial evidence is old or undated |
| fin-us-dod-5n-germanium-2024 | commitment (GC) | St. George space-qualified germanium substrate capacity expansion | P1 | decided, 900d, P1 | none recorded, no dated evidence and no review date recorded, P1 | none | src-dod-5n-germanium-2024 (published 2024-04-16; 900d) | no physical history | financial lifecycle has not been evidenced or reviewed for 900 days; named physical undertaking has never had an implementation review and its financial evidence is old or undated |
| fin-us-dod-perpetua-stibnite-dpa | commitment (GC) | Stibnite Gold Project | P1 | disbursed, 1387d, P3 | construction, no dated evidence and no review date recorded, P1 | none | src-perpetua-sec-dpa-2022 (published 2022-12-19; 1384d) | src-perpetua-stibnite-construction-2026 (published 2026-06-01; 124d) | financial lifecycle is fully disbursed; construction status has no dated evidence or review |
| fin-us-exim-perpetua-stibnite-2026 | commitment (GC) | Stibnite Gold Project | P1 | decided, 135d, P2 | construction, no dated evidence and no review date recorded, P1 | none | src-exim-stibnite-board-2026 (published 2026-05-21; 135d) | src-perpetua-stibnite-construction-2026 (published 2026-06-01; 124d) | pre-binding named-project status is 135 days old; construction status has no dated evidence or review |
| fin-us-dow-usac-antimony-2026 | commitment (GC) | U.S. Department of War — evt-us-dow-usac-antimony-2026 | P1 | partially_disbursed, 221d, P2 | none recorded, no dated evidence and no review date recorded, P1 | none | src-usac-2026-q2-10q (published 2026-08-11; 53d) | no physical history | non-project financial status is 221 days old; binding or funded commitment has never had a substantive physical-status review |
| fin-us-dod-mp-2025-additional-preferred-option | funding_option | US Department of Defense — evt-us-dod-mp-2025 | P1 | contracted, 451d, P1 | n/a | none | src-dod-mp-transaction-agreement-2025 (published 2025-07-10; 450d) | no physical history | financial lifecycle has not been evidenced or reviewed for 451 days; no physical-project lifecycle is applicable to this row |
| fin-us-dod-mp-2025-preferred-equity | commitment (GC) | US Department of Defense — evt-us-dod-mp-2025 | P3 | disbursed, 451d, P3 | n/a | none | src-mp-10q-2026-q2 (published 2026-08-07; 57d) | no physical history | financial lifecycle is fully disbursed; no physical-project lifecycle is applicable to this row |
| fin-us-dod-mp-2025-price-floor | commitment (GC) | US Department of Defense — evt-us-dod-mp-2025 | P1 | contracted, 451d, P1 | n/a | none | src-dod-mp-transaction-agreement-2025 (published 2025-07-10; 450d) | no physical history | financial lifecycle has not been evidenced or reviewed for 451 days; no physical-project lifecycle is applicable to this row |
| fin-us-osc-obbba-2025-credit-subsidy | budget_appropriation | US Department of Defense, Office of Strategic Capital — evt-us-dod-mp-2025 | P1 | authorized, 456d, P1 | n/a | none | src-osc-mp-loan-2025 (published 2025-08-10; 419d) | no physical history | financial lifecycle has not been evidenced or reviewed for 456 days; no physical-project lifecycle is applicable to this row |
| fin-us-osc-obbba-2025-lending-authority | lending_authority | US Department of Defense, Office of Strategic Capital — evt-us-dod-mp-2025 | P1 | authorized, 456d, P1 | n/a | none | src-osc-mp-loan-2025 (published 2025-08-10; 419d) | no physical history | financial lifecycle has not been evidenced or reviewed for 456 days; no physical-project lifecycle is applicable to this row |
| fin-us-osc-vulcan-reelement-2025-joint-commitment | commitment (GC) | US Department of Defense, Office of Strategic Capital — evt-us-dod-mp-2025 | P2 | decided, 316d, P2 | n/a | none | src-osc-vulcan-reelement-2025 (published 2025-11-21; 316d) | no physical history | non-project financial status is 316 days old; no physical-project lifecycle is applicable to this row |
| fin-us-osc-vulcan-reelement-2025-reelement-loan | commitment (GC) | US Department of Defense, Office of Strategic Capital — evt-us-dod-mp-2025 | P2 | decided, 316d, P2 | n/a | none | src-osc-vulcan-reelement-2025 (published 2025-11-21; 316d) | no physical history | non-project financial status is 316 days old; no physical-project lifecycle is applicable to this row |
| fin-us-osc-vulcan-reelement-2025-vulcan-elements-loan | commitment (GC) | US Department of Defense, Office of Strategic Capital — evt-us-dod-mp-2025 | P2 | decided, 316d, P2 | n/a | none | src-osc-vulcan-reelement-2025 (published 2025-11-21; 316d) | no physical history | non-project financial status is 316 days old; no physical-project lifecycle is applicable to this row |
| fin-ca-g7-2025-vianode-edc-letter-of-interest | indication | Vianode synthetic graphite facility, St. Thomas | P1 | announced, no dated evidence and no review date recorded, P1 | none recorded, no dated evidence and no review date recorded, P1 | none | src-nrcan-g7-cmpa-2025 (published 2025-10-31; 337d) | no physical history | financial lifecycle has no dated status evidence or review; named physical undertaking has never had an implementation review and its financial evidence is old or undated |
| fin-de-g7-2025-vianode-export-credit-guarantee | indication | Vianode synthetic graphite facility, St. Thomas | P1 | announced, no dated evidence and no review date recorded, P1 | none recorded, no dated evidence and no review date recorded, P1 | none | src-nrcan-g7-cmpa-2025 (published 2025-10-31; 337d) | no physical history | financial lifecycle has no dated status evidence or review; named physical undertaking has never had an implementation review and its financial evidence is old or undated |
| fin-us-dod-mp-2025-company-cash | recipient_own_funds | evt-us-dod-mp-2025 | P1 | decided, 451d, P1 | n/a | none | src-dod-mp-transaction-agreement-2025 (published 2025-07-10; 450d) | no physical history | financial lifecycle has not been evidenced or reviewed for 451 days; no physical-project lifecycle is applicable to this row |

| Row-level cause of P1 (rows individually P1) | Rows |
| --- | --- |
| financial clock P1 (age > 365d or undated, or pre-binding named project > 180d) | 18 |
| physical clock P1 (no review date recorded and binding/old financial status, or construction/feasibility undated or > 365d) | 14 |
| both clocks P1 | 7 |
| physical clock only (financial clock below P1) | 7 |
| financial clock only (physical clock below P1 or n/a) | 11 |

## 8. Diagnostic sensitivity scenario: material counts with P1-exposed rows removed

This is a diagnostic scenario, not an estimate. Every row stays in the baseline; queue membership does not invalidate a supported fact. It shows how many baseline counts rest on rows the queue marks for review. "P1-exposed" = the row's own queue priority is P1. "Bundle-only" rows sit in a P1 bundle but are not individually P1 (kept in the base). The base is the folded GC rows of 4b.

| Material | GC rows (folded) | P1-exposed | bundle-only | binding GC rows: all | scenario: binding GC rows with P1-exposed removed | funded GC rows: all | scenario: funded with P1-exposed removed | named projects with construction-or-later: all | scenario: ...with projects having a P1-exposed row removed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| antimony | 6 | 6 | 0 | 4 | 0 | 3 | 0 | 2 | 0 |
| dysprosium | 6 | 1 | 0 | 5 | 5 | 2 | 2 | 0 | 0 |
| gallium | 6 | 1 | 0 | 2 | 2 | 0 | 0 | 1 | 1 |
| germanium | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| graphite | 9 | 4 | 0 | 3 | 2 | 1 | 1 | 2 | 2 |
| neodymium | 2 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| praseodymium | 2 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| rare-earth-elements | 18 | 4 | 2 | 9 | 8 | 4 | 3 | 2 | 2 |
| ndfeb-magnets | 6 | 0 | 2 | 5 | 5 | 2 | 2 | 2 | 2 |
| terbium | 6 | 1 | 0 | 5 | 5 | 2 | 2 | 0 | 0 |
| tungsten | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 9. Row ledger (all 85 financial rows; amounts exactly as stated, never converted or summed)

| Row | Actor | Role | Capital source | Instrument | Amount as stated [qualifier currency] | Financial history | Physical history | Project | Materials | Queue priority (fin/phys/row) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fin-au-alcoa-sojitz-gallium-2025-equity | australia | commitment | public | equity | up to USD$200 million in concessional equity finance for the project [up_to USD] | announced@2025-10-20 | construction@2026-08-24 | prj-au-alcoa-sojitz-gallium | gallium | P3/P3/P3 |
| fin-au-alcoa-sojitz-gallium-2025-offtake-right | australia | commitment | public | offtake | no amount stated | announced@2025-10-20 | construction@2026-08-24 | prj-au-alcoa-sojitz-gallium | gallium | P3/P3/P3 |
| fin-au-arafura-nolans-2025-equity | australia | commitment | public | equity | a USD$100 million equity investment in the project [exact USD] | announced@2025-10-20 > contracted@2026-04-01 | none recorded | prj-au-nolans | rare-earth-elements | P3/P3/P3 |
| fin-au-cmf-2026-expanded-facility | australia | program_envelope | public | mixed | the expanded $5 billion Critical Minerals Facility [exact AUD] | not_stated@undated | not applicable | - | - | P2/n/a/P2 |
| fin-au-cmpti-2025-production-tax-offset | australia | commitment | public | tax_credit | no amount stated | authorized@2025-02-14 | not applicable | - | antimony, gallium, germanium, graphite, rare-earth-elements, dysprosium, neodymium, praseodymium, terbium, tungsten | P1/n/a/P1 |
| fin-au-cmsr-2026-reserve | australia | program_envelope | public | mixed | $1.2 billion Critical Minerals Strategic Reserve [exact AUD] | announced@2026-01-12 | not applicable | - | antimony, gallium, rare-earth-elements | P2/n/a/P2 |
| fin-au-cmsr-2026-stockpiling-allocation | australia | budget_appropriation | public | stockpile_purchase | A further $185 million has been allocated for selective stockpiling of minerals, where required, and other implementation costs. [exact AUD] | allocated@undated | not applicable | - | - | P2/n/a/P2 |
| fin-au-cmsr-2026-transactions | australia | program_envelope | public | unspecified | The Reserve includes $1 billion for transactions to be drawn from the expanded $5 billion Critical Minerals Facility [exact AUD] | announced@2026-01-12 | not applicable | - | - | P2/n/a/P2 |
| fin-ca-cgf-cyclic-2026-equity | canada | commitment | public_enterprise | equity | US$25 million [exact USD] | contracted@2026-01-20 | construction@2026-01-20 | prj-ca-cyclic-kingston-centre-of-excellence | rare-earth-elements | P3/P3/P3 |
| fin-ca-cmrdd-2024-cyclic-materials | canada | commitment | public | unspecified | Amount funded: $4,893,125 [exact CAD] | contracted@2024-07-17 | completed@undated | prj-ca-cyclic-kingston-demonstration-plant | rare-earth-elements | P3/P3/P3 |
| fin-ca-cmrdd-2024-green-graphite | canada | commitment | public | unspecified | NRCan is providing $3.5 million to GGT for this initiative [exact CAD] | contracted@2024-08-09 | none recorded | prj-ca-ggt-graphite-recycling-pilot | graphite | P3/P3/P3 |
| fin-ca-cmrdd-2024-kingston-awards | canada | commitment | public | unspecified | almost $8.4 million in investments [approximately CAD] | announced@2024-09-04 | not applicable | - | rare-earth-elements, graphite | P1/n/a/P1 |
| fin-ca-cms-2022-budget-envelope | canada | budget_appropriation | public | unspecified | backed by up to $3.8 billion in federal funding allocated in Budget 2022 [up_to CAD] | allocated@undated > announced@2022-12-09 | not applicable | - | - | P1/n/a/P1 |
| fin-ca-feddev-cyclic-2025-contribution | canada | commitment | public | unspecified | $5,000,000.00 [exact CAD] | contracted@2025-09-01 | announced@2025-06-11 > construction@2026-01-20 | prj-ca-cyclic-kingston-centre-of-excellence | rare-earth-elements | P3/P3/P3 |
| fin-ca-g7-2025-focus-graphite-gpi | canada | commitment | public | unspecified | a conditionally approved investment of up to $14.1 million from Natural Resources Canada’s Global Partnerships Initiative [up_to CAD] | decided@2025-10-31 | not applicable | - | graphite | P2/n/a/P2 |
| fin-ca-g7-2025-nmg-canada-growth-fund | canada | commitment | public_enterprise | equity | more than $35 million from the Canada Growth Fund [at_least CAD] | not_stated@undated > contracted@2024-12-16 > disbursed@2024-12-20 | construction@2026-04-13 | prj-ca-nmg-matawinie | graphite | P3/P3/P3 |
| fin-ca-g7-2025-nmg-edc-letter-of-interest | canada | indication | public_enterprise | unspecified | a letter of interest for up to US$430 million from Export Development Canada [up_to USD] | announced@undated | construction@2026-04-13 | prj-ca-nmg-matawinie | graphite | P3/P3/P3 |
| fin-ca-g7-2025-nmg-offtake | canada | commitment | public | offtake | no amount stated | announced@2025-10-31 > contracted@2026-05-13 | construction@2026-04-13 | prj-ca-nmg-matawinie | graphite | P3/P3/P3 |
| fin-ca-g7-2025-northern-graphite-nrc | canada | commitment | public | unspecified | $860,000 in funding through the National Research Council of Canada’s Canada–Germany Collaborative Industrial Research and Development Program [exact CAD] | announced@2025-10-31 | not applicable | - | graphite | P2/n/a/P2 |
| fin-ca-g7-2025-ucore-feddev | canada | commitment | public | unspecified | up to $10 million through the Federal Economic Development Agency for Southern Ontario [up_to CAD] | decided@2025-10-31 | announced@2025-10-31 | prj-ca-ucore-kingston | rare-earth-elements | P3/P3/P3 |
| fin-ca-g7-2025-ucore-nrcan | canada | commitment | public | grant | up to $26.3 million through Natural Resources Canada [up_to CAD] | decided@2025-10-31 | announced@2025-10-31 | prj-ca-ucore-kingston | rare-earth-elements | P3/P3/P3 |
| fin-ca-g7-2025-ucore-package | canada | commitment | public | unspecified | a conditionally approved investment of up to $36.3 million from the Government of Canada [up_to CAD] | decided@2025-10-31 | announced@2025-10-31 | prj-ca-ucore-kingston | rare-earth-elements | P3/P3/P3 |
| fin-ca-g7-2025-vianode-edc-letter-of-interest | canada | indication | public_enterprise | unspecified | a letter of interest for up to US$500 million in potential financing from Export Development Canada [up_to USD] | announced@undated | none recorded | prj-ca-vianode-st-thomas | graphite | P1/P1/P1 |
| fin-ca-gpi-cyclic-2026-centre-excellence | canada | commitment | public | grant | up to $9.1 million [up_to CAD] | decided@2026-03-02 | construction@2026-01-20 | prj-ca-cyclic-kingston-centre-of-excellence | rare-earth-elements | P3/P3/P3 |
| fin-ca-pdac-2026-ggt-eip | canada | commitment | public | unspecified | Funding amount: $4,750,000 [exact CAD] | announced@2026-03-03 | commissioning@2026-08-11 | prj-ca-ggt-regolith-graphite | graphite | P3/P3/P3 |
| fin-ca-pdac-2026-nb-granitoids-cmgd | canada | commitment | public | unspecified | Funding amount: $172,000 [exact CAD] | announced@2026-03-03 | none recorded | - | tungsten | P2/P1/P1 |
| fin-ca-pdac-2026-nb-maritimes-basin-cmgd | canada | commitment | public | unspecified | Funding amount: $232,600 [exact CAD] | announced@2026-03-03 | none recorded | - | rare-earth-elements | P2/P1/P1 |
| fin-ca-pdac-2026-ns-graphite-cmgd | canada | commitment | public | unspecified | Funding amount: $97,000 [exact CAD] | announced@2026-03-03 | none recorded | - | graphite | P2/P1/P1 |
| fin-ca-pdac-2026-wicheeda-flmf | canada | commitment | public | unspecified | Funding amount: $1,878,250 [exact CAD] | decided@2026-03-03 | feasibility@2026-07-13 | prj-ca-wicheeda | rare-earth-elements | P3/P3/P3 |
| fin-ca-trail-cgf-2026-indication | canada | indication | public_enterprise | unspecified | up to $400 million [up_to CAD] | announced@2026-07-07 | none recorded | prj-ca-trail-strategic-metals | germanium, antimony, gallium | P3/P3/P3 |
| fin-de-g7-2025-vianode-export-credit-guarantee | - | indication | public | loan_guarantee | a letter of interest from the German government for the potential support of the project with an export credit guarantee amount of up to US$300 million [up_to USD] | announced@undated | none recorded | prj-ca-vianode-st-thomas | graphite | P1/P1/P1 |
| fin-ebrd-2025-sarytogan-equity | - | commitment | public | equity | around EUR 6 million in the EuroManganese Strategic Project in the Czech Republic and EUR 3.6 million in the Sarytogan Graphite Strategic Project in Kazakhstan [approximately EUR] | contracted@undated | none recorded | prj-kz-sarytogan | graphite | P1/P1/P1 |
| fin-eu-eib-2025-up-catalyst-loan | eu | commitment | public_enterprise | loan | no amount stated | contracted@undated | none recorded | prj-ee-co2graphite | graphite | P1/P1/P1 |
| fin-eu-jtf-2025-neo-magnet-project | eu | commitment | public | grant | grant amount of approximately €14.8 million [approximately EUR] | decided@2022-11-09 > partially_disbursed@2025-12-31 | operational@2026-09-14 | prj-ee-neo-rare-earth-magnet-project | ndfeb-magnets | P3/P3/P3 |
| fin-eu-resourceeu-2025-eu-funds | eu | program_envelope | public | unspecified | the EU should mobilise EUR 3 billion of EU funds within the next 12 months in direct support of the CRM value chain [exact EUR] | announced@2025-12-03 | not applicable | - | - | P2/n/a/P2 |
| fin-in-ncmm-2025-government-expenditure | india | program_envelope | public | unspecified | an expenditure of Rs.16,300 crore [exact INR] | authorized@2025-01-29 | not applicable | - | - | P1/n/a/P1 |
| fin-in-ncmm-2025-psu-investment | india | expected_co_investment | public_enterprise | unspecified | expected investment of Rs.18,000 crore by PSUs, etc. [exact INR] | announced@2025-01-29 | not applicable | - | - | P1/n/a/P1 |
| fin-jp-jare-lynas-2023-equity | japan | commitment | mixed_vehicle | equity | an additional AUD 200million worth investment in the equity of Lynas Rare Earths Limited [exact AUD] | decided@2023-03-07 > contracted@2023-03-07 > disbursed@undated | not applicable | - | rare-earth-elements, dysprosium, terbium | P3/n/a/P3 |
| fin-jp-jare-lynas-2023-hre-offtake | japan | commitment | not_stated | offtake | no amount stated | contracted@undated | not applicable | - | dysprosium, terbium | P2/n/a/P2 |
| fin-jp-jogmec-almt-tungsten-grant | japan | commitment | public | grant | ※助成額は約75億円 [approximately JPY] | announced@2026-03-18 > decided@undated | announced@2026-04-09 | prj-jp-almt-tungsten | tungsten | P3/P3/P3 |
| fin-jp-jogmec-japan-new-metals-tungsten-grant | japan | commitment | public | grant | ※助成額は約20億円 [approximately JPY] | announced@2026-09-07 | none recorded | prj-jp-japan-new-metals-tungsten | tungsten | P3/P3/P3 |
| fin-jp-jogmec-lofdal-2026-equity | japan | commitment | public | equity | up to 47.668 million Canadian dollars (approximately 5.5 billion yen) [up_to CAD] | decided@undated > partially_disbursed@2026-07-23 | feasibility@undated | prj-na-lofdal | rare-earth-elements, dysprosium, terbium | P3/P3/P3 |
| fin-jp-jogmec-santoku-rare-earth-grant | japan | commitment | public | grant | ※助成額は約8億円 [approximately JPY] | announced@2026-07-29 > decided@undated | none recorded | prj-jp-santoku-rare-earth | rare-earth-elements | P3/P3/P3 |
| fin-jp-jogmec-shin-etsu-rare-earth-grant | japan | commitment | public | grant | ※助成額は約175億円 [approximately JPY] | announced@2026-05-19 > decided@undated | none recorded | prj-jp-shin-etsu-rare-earth | rare-earth-elements | P2/P2/P2 |
| fin-uk-cms-2025-critical-mineral-fund | uk | program_envelope | public | grant | funding of up to £50 million will be made available by DBT to support critical mineral projects [up_to GBP] | announced@2025-11-22 | not applicable | - | - | P2/n/a/P2 |
| fin-uk-nwf-2026-tungsten-procurement-right | uk | commitment | public | procurement_right | no amount stated | announced@2026-08-25 | none recorded | prj-gb-hemerdon | tungsten | P3/P3/P3 |
| fin-uk-nwf-2026-tungsten-west-equity | uk | commitment | public_enterprise | equity | a £36 million equity investment [exact GBP] | announced@2026-08-25 | none recorded | prj-gb-hemerdon | tungsten | P3/P3/P3 |
| fin-uk-nwf-2026-tungsten-west-lending | uk | commitment | public_enterprise | loan | up to £35 million of lending [up_to GBP] | announced@2026-08-25 | none recorded | prj-gb-hemerdon | tungsten | P3/P3/P3 |
| fin-uk-nwf-2026-tungsten-west-package | uk | commitment | public_enterprise | mixed | an investment of up to £71 million in Tungsten West [up_to GBP] | announced@2026-08-25 | none recorded | prj-gb-hemerdon | tungsten | P3/P3/P3 |
| fin-us-alcoa-sojitz-gallium-2025-equity | us | commitment | public | equity | no amount stated | announced@2025-10-20 | construction@2026-08-24 | prj-au-alcoa-sojitz-gallium | gallium | P3/P3/P3 |
| fin-us-army-perpetua-antimony-otia | us | commitment | public | grant | The current estimated amount is $27.1 million [approximately USD] | contracted@2023-08-18 > partially_disbursed@undated | operational@2026-07-29 | prj-us-inl-antimony-pilot | antimony | P1/P3/P1 |
| fin-us-au-framework-2025-au-financing | australia | program_envelope | public | mixed | the US and Australia will take measures to each provide at least USD$1 billion in investments [at_least USD] | announced@2025-10-20 | not applicable | - | - | P2/n/a/P2 |
| fin-us-au-framework-2025-project-pipeline | - | total_project_cost | not_stated | unspecified | an USD$8.5 billion pipeline of priority critical minerals projects in Australia and the United States [exact USD] | announced@2025-10-20 | not applicable | - | - | P2/n/a/P2 |
| fin-us-au-framework-2025-us-financing | us | program_envelope | public | mixed | the US and Australia will take measures to each provide at least USD$1 billion in investments [at_least USD] | announced@2025-10-20 | not applicable | - | - | P2/n/a/P2 |
| fin-us-chips-usar-2026-direct-funding | us | commitment | public | unspecified | direct funding awards (the “Direct Funding”) with a maximum award amount of $277.0 million in the aggregate [up_to USD] | announced@2026-01-26 > contracted@2026-06-03 | not applicable | - | rare-earth-elements, gallium, dysprosium, terbium, ndfeb-magnets | P3/n/a/P3 |
| fin-us-chips-usar-2026-loan-guarantee | us | commitment | public | loan_guarantee | to guarantee the repayment by USAR and its affiliates of advances in an aggregate principal amount of $1.3 billion (“FFB Advances” and, together with the Direct Funding, the “Awards”) made by the Federal Financing Bank [up_to USD] | announced@2026-01-26 > contracted@2026-06-03 | not applicable | - | rare-earth-elements, gallium, dysprosium, terbium, ndfeb-magnets | P3/n/a/P3 |
| fin-us-chips-usar-2026-magnet-project-2-direct-funding | us | commitment | public | unspecified | (d) $60.0 million for the construction of a new magnet making facility [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-magnet-project-2 | ndfeb-magnets | P3/P2/P2 |
| fin-us-chips-usar-2026-magnet-project-2-loan-guarantee | us | commitment | public | loan_guarantee | (d) $325.0 million for the Magnet Project 2 [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-magnet-project-2 | ndfeb-magnets | P3/P2/P2 |
| fin-us-chips-usar-2026-metal-project-2-direct-funding | us | commitment | public | unspecified | (e) $15.0 million for the construction of a new strip casting and metal making facility [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-metal-project-2 | rare-earth-elements | P3/P2/P2 |
| fin-us-chips-usar-2026-metal-project-2-loan-guarantee | us | commitment | public | loan_guarantee | (e) $75.0 million for the Metal Project 2 [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-metal-project-2 | rare-earth-elements | P3/P2/P2 |
| fin-us-chips-usar-2026-round-top-direct-funding | us | commitment | public | unspecified | (a) $132.0 million for the construction of a rare earth mining and processing facility in Sierra Blanca, Texas [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-round-top | rare-earth-elements, gallium, dysprosium, terbium | P3/P2/P2 |
| fin-us-chips-usar-2026-round-top-loan-guarantee | us | commitment | public | loan_guarantee | (a) $550.0 million for the Round Top Mine Project [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-round-top | rare-earth-elements, gallium, dysprosium, terbium | P3/P2/P2 |
| fin-us-chips-usar-2026-stillwater-magnet-direct-funding | us | commitment | public | unspecified | (b) $50.0 million for the expansion and modernization of the existing magnet making facility located in Stillwater, Oklahoma [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-stillwater-magnet | ndfeb-magnets | P3/P2/P2 |
| fin-us-chips-usar-2026-stillwater-magnet-loan-guarantee | us | commitment | public | loan_guarantee | (b) $250.0 million for the Stillwater Magnet Project [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-stillwater-magnet | ndfeb-magnets | P3/P2/P2 |
| fin-us-chips-usar-2026-stillwater-metal-direct-funding | us | commitment | public | unspecified | (c) $20.0 million for the expansion and modernization of the existing strip casting and metal making facility located in Stillwater, Oklahoma [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-stillwater-metal | rare-earth-elements | P3/P2/P2 |
| fin-us-chips-usar-2026-stillwater-metal-loan-guarantee | us | commitment | public | loan_guarantee | (c) $100.0 million for the Stillwater Metal Project [up_to USD] | contracted@2026-06-03 | none recorded | prj-us-usar-stillwater-metal | rare-earth-elements | P3/P2/P2 |
| fin-us-commerce-chips-vulcan-2025-incentives | us | indication | public | unspecified | a preliminary non-binding letter of intent to provide $50 million in proposed federal incentives under the CHIPS and Science Act [exact USD] | announced@2025-11-21 | not applicable | - | - | P2/n/a/P2 |
| fin-us-dod-5n-germanium-2024 | us | commitment | public | grant | $14.4 million [exact USD] | decided@2024-04-16 | none recorded | prj-us-5n-st-george-germanium-substrates | germanium | P1/P1/P1 |
| fin-us-dod-mp-2025-additional-preferred-option | us | funding_option | public | equity | a commitment for up to $350 million in additional funding in the form of additional Series A Preferred Stock [up_to USD] | contracted@2025-07-09 | not applicable | - | rare-earth-elements, ndfeb-magnets | P1/n/a/P1 |
| fin-us-dod-mp-2025-bank-financing | - | private_financing | private | loan | committed secured financing ... in an amount equal to, in the aggregate, at least $1,000,000,000 (the "10X Facility Funding") [at_least USD] | decided@2025-07-09 > lapsed@2025-08-26 | construction@undated | prj-us-mp-10x-facility | - | P3/P3/P3 |
| fin-us-dod-mp-2025-company-cash | - | recipient_own_funds | private | unspecified | The Company has also agreed to use up to $600,000,000 of its existing cash to fund the above projects. [up_to USD] | decided@2025-07-09 | not applicable | - | rare-earth-elements, ndfeb-magnets | P1/n/a/P1 |
| fin-us-dod-mp-2025-magnet-offtake | us | commitment | public | offtake | no amount stated | contracted@2025-07-09 | announced@2025-07-10 > construction@undated | prj-us-mp-10x-facility | ndfeb-magnets | P3/P3/P3 |
| fin-us-dod-mp-2025-preferred-equity | us | commitment | public | equity | $400 million equity investment [exact USD] | contracted@2025-07-09 > disbursed@undated | not applicable | - | rare-earth-elements, ndfeb-magnets | P3/n/a/P3 |
| fin-us-dod-mp-2025-price-floor | us | commitment | public | price_floor | no amount stated | contracted@2025-07-09 | not applicable | - | neodymium, praseodymium | P1/n/a/P1 |
| fin-us-dod-mp-2025-samarium-loan | us | commitment | public | loan | a loan to the Company in the aggregate principal amount of $150,000,000 (the "Samarium Project Loan") [exact USD] | decided@2025-07-09 > contracted@undated > disbursed@undated | none recorded | prj-us-mountain-pass-samarium | rare-earth-elements | P3/P1/P1 |
| fin-us-dod-perpetua-stibnite-dpa | us | commitment | public | grant | $59.2 million [up_to USD] | contracted@2022-12-16 > disbursed@undated | construction@undated | prj-us-stibnite | antimony | P3/P1/P1 |
| fin-us-dow-5n-germanium-2025 | us | commitment | public | grant | $18.1 million [exact USD] | decided@2025-12-15 | none recorded | prj-us-5n-st-george-germanium-refining | germanium | P1/P1/P1 |
| fin-us-dow-arr-antimony-2025 | us | commitment | public | grant | $43.4 million [exact USD] | decided@2025-09-30 > contracted@2025-10-01 | none recorded | prj-us-estelle-antimony | antimony | P1/P1/P1 |
| fin-us-dow-usac-antimony-2026 | us | commitment | public | grant | $27 million [exact USD] | contracted@2026-02-24 > partially_disbursed@undated | none recorded | - | antimony | P2/P1/P1 |
| fin-us-exim-perpetua-stibnite-2026 | us | commitment | public | loan | 2,906 [US$ millions] [exact USD] | decided@2026-05-21 | construction@undated | prj-us-stibnite | antimony | P2/P1/P1 |
| fin-us-osc-obbba-2025-credit-subsidy | us | budget_appropriation | public | loan | $500 million of credit subsidy funding [exact USD] | authorized@2025-07-04 | not applicable | - | - | P1/n/a/P1 |
| fin-us-osc-obbba-2025-lending-authority | us | lending_authority | public | loan | creating up to $100 billion in available loan funds specifically for critical minerals production and related industries and projects [up_to USD] | authorized@2025-07-04 | not applicable | - | - | P1/n/a/P1 |
| fin-us-osc-vulcan-reelement-2025-joint-commitment | us | commitment | public | loan | a joint $700 million conditional loan commitment [exact USD] | decided@2025-11-21 | not applicable | - | rare-earth-elements, ndfeb-magnets | P2/n/a/P2 |
| fin-us-osc-vulcan-reelement-2025-reelement-loan | us | commitment | public | loan | one to ReElement for $80 million [exact USD] | decided@2025-11-21 | not applicable | - | rare-earth-elements, ndfeb-magnets | P2/n/a/P2 |
| fin-us-osc-vulcan-reelement-2025-vulcan-elements-loan | us | commitment | public | loan | one to Vulcan for $620 million [exact USD] | decided@2025-11-21 | not applicable | - | rare-earth-elements, ndfeb-magnets | P2/n/a/P2 |

## 10. Source locators behind the current statuses of rows cited in the analysis

Locators are copied from `evidence[].locator`; "locator not recorded" means the field is null. Evidence entries are listed where their `supports` path touches a status history.

| Row | Supports | Source | Source published / accessed | Locator |
| --- | --- | --- | --- | --- |
| fin-au-alcoa-sojitz-gallium-2025-equity | ["instrument","value_role","capital_source","amount","provider","recipient","project","location","materials","status","outcomes"] | src-pm-us-au-framework-2025 | 2025-10-21 / 2026-09-23 | Fifth and sixth paragraphs |
| fin-au-alcoa-sojitz-gallium-2025-equity | ["status"] | src-alcoa-wagerup-groundbreaking-2026 | 2026-08-24 / 2026-10-02 | Opening paragraphs |
| fin-au-alcoa-sojitz-gallium-2025-offtake-right | ["instrument","value_role","capital_source","provider","recipient","project","location","materials","status"] | src-pm-us-au-framework-2025 | 2025-10-21 / 2026-09-23 | Sixth paragraph |
| fin-au-alcoa-sojitz-gallium-2025-offtake-right | ["status"] | src-alcoa-wagerup-groundbreaking-2026 | 2026-08-24 / 2026-10-02 | Opening paragraphs |
| fin-au-cmpti-2025-production-tax-offset | ["instrument","value_role","capital_source","provider","legal_authority","recipient","location","stages","materials","status","terms","programme"] | src-legislation-au-cmpti-2025 | 2025-02-14 / 2026-08-12 | Schedule 2, ss 419-5, 419-10, 419-15, 419-20 (pp. 36–39 of the authorised PDF) |
| fin-ca-cmrdd-2024-cyclic-materials | ["instrument","value_role","capital_source","provider","recipient","project","relationships","stages","materials","status","programme"] | src-nrcan-cmrdd-2024 | 2024-09-04 / 2026-09-23 | Paragraph on Cyclic Materials |
| fin-ca-cmrdd-2024-cyclic-materials | ["amount","status"] | src-nrcan-cmrdd-programme | no published date / 2026-10-02 | Funded Projects: "Kingston Demonstration Plant – Extended Operations" |
| fin-ca-cmrdd-2024-cyclic-materials | ["status"] | src-canada-grant-cyclic-cmrdd-2024 | no published date / 2026-10-02 | Agreement number CMRDD2-048; Agreement Date |
| fin-ca-g7-2025-ucore-feddev | ["instrument","value_role","capital_source","amount","provider","recipient","status","project","location","materials","relationships"] | src-nrcan-g7-cmpa-2025 | 2025-10-31 / 2026-09-23 | Ucore paragraph |
| fin-ca-g7-2025-ucore-feddev | ["status","project"] | src-ucore-canada-conditional-20251031 | 2025-10-31 / 2026-10-02 | Opening paragraphs and contribution-agreement conditions |
| fin-ca-g7-2025-ucore-feddev | ["status"] | src-ucore-mda-q2-2026 | 2026-08-26 / 2026-10-02 | Government of Canada Funding for a Samarium and Gadolinium Facility |
| fin-ca-g7-2025-ucore-feddev | ["status"] | src-ucore-us-ota-modification-20260914 | 2026-09-14 / 2026-10-02 | Opening paragraphs and program scope |
| fin-ca-g7-2025-ucore-nrcan | ["value_role","capital_source","amount","provider","recipient","status","project","location","materials","relationships"] | src-nrcan-g7-cmpa-2025 | 2025-10-31 / 2026-09-23 | Ucore paragraph |
| fin-ca-g7-2025-ucore-nrcan | ["status","project"] | src-ucore-canada-conditional-20251031 | 2025-10-31 / 2026-10-02 | Opening paragraphs and contribution-agreement conditions |
| fin-ca-g7-2025-ucore-nrcan | ["status"] | src-ucore-mda-q2-2026 | 2026-08-26 / 2026-10-02 | Government of Canada Funding for a Samarium and Gadolinium Facility |
| fin-ca-g7-2025-ucore-nrcan | ["status"] | src-ucore-us-ota-modification-20260914 | 2026-09-14 / 2026-10-02 | Opening paragraphs and program scope |
| fin-ca-g7-2025-ucore-package | ["instrument","value_role","capital_source","amount","provider","recipient","status","project","location","materials"] | src-nrcan-g7-cmpa-2025 | 2025-10-31 / 2026-09-23 | Ucore paragraph |
| fin-ca-g7-2025-ucore-package | ["status","project"] | src-ucore-canada-conditional-20251031 | 2025-10-31 / 2026-10-02 | Opening paragraphs and contribution-agreement conditions |
| fin-ca-g7-2025-ucore-package | ["status"] | src-ucore-mda-q2-2026 | 2026-08-26 / 2026-10-02 | Government of Canada Funding for a Samarium and Gadolinium Facility |
| fin-ca-g7-2025-ucore-package | ["status"] | src-ucore-us-ota-modification-20260914 | 2026-09-14 / 2026-10-02 | Opening paragraphs and program scope |
| fin-ca-pdac-2026-ggt-eip | ["instrument","value_role","capital_source","amount","provider","recipient","status","project","materials"] | src-nrcan-pdac-2026 | 2026-03-03 / 2026-09-23 | Energy Innovation Program: Green Graphite Technologies entry |
| fin-ca-pdac-2026-ggt-eip | ["status"] | src-ggt-mississauga-demo-commissioning-20260811 | 2026-08-11 / 2026-10-03 | Opening sentence |
| fin-ca-pdac-2026-wicheeda-flmf | ["instrument","value_role","capital_source","amount","provider","recipient","status","project","materials"] | src-nrcan-pdac-2026 | 2026-03-03 / 2026-09-23 | First and Last Mile Fund: Wicheeda entry |
| fin-ca-pdac-2026-wicheeda-flmf | ["status","project"] | src-defense-metals-wicheeda-flmf-20260304 | 2026-03-04 / 2026-10-02 | Pages 1–2: conditional approval and project scope |
| fin-ca-pdac-2026-wicheeda-flmf | ["status"] | src-defense-metals-wicheeda-update-20260713 | 2026-07-13 / 2026-10-02 | Pages 1–2: ongoing feasibility, pilot testing and conditional funding |
| fin-ca-pdac-2026-wicheeda-flmf | ["status"] | src-defense-metals-wicheeda-proposal-20260812 | 2026-08-12 / 2026-10-02 | Page 1: invitation to submit a full project proposal |
| fin-ca-trail-cgf-2026-indication | ["instrument","value_role","capital_source","amount","provider","legal_authority","recipient","project","facility","location","stages","materials","status","terms","outcomes"] | src-nrcan-trail-strategic-metals-2026 | 2026-07-07 / 2026-10-02 | Opening and investment-framework paragraphs |
| fin-ca-trail-cgf-2026-indication | ["value_role","amount","provider","recipient","project","facility","location","stages","materials","status","terms"] | src-teck-trail-strategic-metals-2026 | 2026-07-07 / 2026-10-02 | Opening through conditions paragraph |
| fin-eu-eib-2025-up-catalyst-loan | ["instrument","value_role","capital_source","provider","recipient","stages","materials","status"] | src-ec-resourceeu-com-945 | 2025-12-03 / 2026-09-23 | Section 2.1, third paragraph |
| fin-us-alcoa-sojitz-gallium-2025-equity | ["instrument","value_role","capital_source","provider","recipient","project","location","materials","status"] | src-pm-us-au-framework-2025 | 2025-10-21 / 2026-09-23 | Sixth paragraph |
| fin-us-alcoa-sojitz-gallium-2025-equity | ["status"] | src-alcoa-wagerup-groundbreaking-2026 | 2026-08-24 / 2026-10-02 | Opening paragraphs |
| fin-us-army-perpetua-antimony-otia | ["instrument","value_role","capital_source","provider","legal_authority","recipient","project","stages","materials","status"] | src-perpetua-sec-dotc-2023 | 2023-08-21 / 2026-10-02 | Item 8.01 |
| fin-us-army-perpetua-antimony-otia | ["amount","status"] | src-perpetua-sec-2026-q2 | no published date / 2026-10-02 | DOW Ordnance Technology Consortium Grant |
| fin-us-army-perpetua-antimony-otia | ["project","facility","location","stages","materials","status"] | src-us-army-antimony-pilot-2026 | 2026-08-06 / 2026-10-02 | Opening and programme-history paragraphs |
| fin-us-chips-usar-2026-direct-funding | ["value_role","capital_source","provider","recipient","status","materials","stages"] | src-nist-chips-usar-2026 | 2026-01-26 / 2026-09-23 | First to fourth paragraphs |
| fin-us-chips-usar-2026-direct-funding | ["amount","provider","recipient","programme","legal_authority","status","terms"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Direct Funding Agreement; Securities Issuance Agreement |
| fin-us-chips-usar-2026-direct-funding | ["status"] | src-usar-direct-funding-agreement-2026-06-03 | 2026-06-03 / 2026-09-24 | Section 2.1(b) |
| fin-us-chips-usar-2026-loan-guarantee | ["value_role","capital_source","provider","recipient","status","materials","stages"] | src-nist-chips-usar-2026 | 2026-01-26 / 2026-09-23 | First to fourth paragraphs |
| fin-us-chips-usar-2026-loan-guarantee | ["instrument","amount","provider","recipient","programme","legal_authority","status","terms"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Loan Guarantee Agreement |
| fin-us-chips-usar-2026-magnet-project-2-direct-funding | ["value_role","capital_source","amount","relationships","provider","programme","recipient","project","status"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Direct Funding (d) |
| fin-us-chips-usar-2026-magnet-project-2-direct-funding | ["status"] | src-usar-direct-funding-agreement-2026-06-03 | 2026-06-03 / 2026-09-24 | Section 2.1(b) |
| fin-us-chips-usar-2026-magnet-project-2-loan-guarantee | ["instrument","value_role","capital_source","amount","relationships","provider","programme","recipient","project","status"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, FFB Advances (d) |
| fin-us-chips-usar-2026-metal-project-2-direct-funding | ["value_role","capital_source","amount","relationships","provider","programme","recipient","project","status"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Direct Funding (e) |
| fin-us-chips-usar-2026-metal-project-2-direct-funding | ["status"] | src-usar-direct-funding-agreement-2026-06-03 | 2026-06-03 / 2026-09-24 | Section 2.1(b) |
| fin-us-chips-usar-2026-metal-project-2-loan-guarantee | ["instrument","value_role","capital_source","amount","relationships","provider","programme","recipient","project","status"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, FFB Advances (e) |
| fin-us-chips-usar-2026-round-top-direct-funding | ["value_role","capital_source","amount","relationships","provider","programme","recipient","project","status","location"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Direct Funding (a) |
| fin-us-chips-usar-2026-round-top-direct-funding | ["status"] | src-usar-direct-funding-agreement-2026-06-03 | 2026-06-03 / 2026-09-24 | Section 2.1(b) |
| fin-us-chips-usar-2026-round-top-loan-guarantee | ["instrument","value_role","capital_source","amount","relationships","provider","programme","recipient","project","status","location"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, FFB Advances (a) |
| fin-us-chips-usar-2026-stillwater-magnet-direct-funding | ["value_role","capital_source","amount","relationships","provider","programme","recipient","project","status","location"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Direct Funding (b) |
| fin-us-chips-usar-2026-stillwater-magnet-direct-funding | ["status"] | src-usar-direct-funding-agreement-2026-06-03 | 2026-06-03 / 2026-09-24 | Section 2.1(b) |
| fin-us-chips-usar-2026-stillwater-magnet-loan-guarantee | ["instrument","value_role","capital_source","amount","relationships","provider","programme","recipient","project","status","location"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, FFB Advances (b) |
| fin-us-chips-usar-2026-stillwater-metal-direct-funding | ["value_role","capital_source","amount","relationships","provider","programme","recipient","project","status","location"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Direct Funding (c) |
| fin-us-chips-usar-2026-stillwater-metal-direct-funding | ["status"] | src-usar-direct-funding-agreement-2026-06-03 | 2026-06-03 / 2026-09-24 | Section 2.1(b) |
| fin-us-chips-usar-2026-stillwater-metal-loan-guarantee | ["instrument","value_role","capital_source","amount","relationships","provider","programme","recipient","project","status","location"] | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, FFB Advances (c) |
| fin-us-dod-5n-germanium-2024 | ["instrument","value_role","capital_source","amount","provider","legal_authority","recipient","project","facility","location","stages","materials","status","terms"] | src-dod-5n-germanium-2024 | 2024-04-16 / 2026-10-02 | Opening through technical-effort paragraphs |
| fin-us-dod-5n-germanium-2024 | ["recipient","project","facility","location","materials","status","terms"] | src-5n-germanium-2024 | 2024-04-18 / 2026-10-02 | Opening and award-description paragraphs |
| fin-us-dod-mp-2025-additional-preferred-option | ["instrument","value_role","capital_source","amount","provider","recipient","materials","status","terms"] | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Introductory paragraph; Item 1.01, Transaction Agreement (Funding Allocation) |
| fin-us-dod-mp-2025-bank-financing | ["instrument","value_role","capital_source","amount","provider","recipient","facility","status","terms","project"] | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Item 1.01, 10X Facility Funding |
| fin-us-dod-mp-2025-bank-financing | ["status"] | src-mp-10q-2025-q3 | 2025-11-07 / 2026-10-03 | Note 3 (Public-Private Partnership), Commitment Letter for Facility Construction |
| fin-us-dod-mp-2025-bank-financing | ["status"] | src-mp-q2-results-20260806 | 2026-08-06 / 2026-10-03 | CEO comments in second-quarter 2026 results |
| fin-us-dod-mp-2025-bank-financing | ["status"] | src-mp-10q-2026-q2 | 2026-08-07 / 2026-10-03 | Note 1; Note 6, Property, Plant and Equipment; MD&A, Magnetics segment |
| fin-us-dod-mp-2025-company-cash | ["instrument","value_role","capital_source","amount","recipient","project","stages","materials","status","outcomes"] | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Item 1.01, Transaction Agreement |
| fin-us-dod-mp-2025-magnet-offtake | ["instrument","value_role","capital_source","provider","recipient","project","facility","stages","materials","status","terms"] | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Item 1.01, Offtake Agreement |
| fin-us-dod-mp-2025-magnet-offtake | ["status","outcomes"] | src-mp-dod-2025 | 2025-07-10 / 2026-06-13 | Opening paragraphs |
| fin-us-dod-mp-2025-magnet-offtake | ["status"] | src-mp-10q-2026-q2 | 2026-08-07 / 2026-10-03 | Note 1; Note 6, Property, Plant and Equipment; Note 9, Operating Leases; Note 13, Other Current Assets; MD&A, DoW Offtake Agreement and Magnetics segment |
| fin-us-dod-mp-2025-magnet-offtake | ["status"] | src-mp-q2-results-20260806 | 2026-08-06 / 2026-10-03 | CEO comments in second-quarter 2026 results |
| fin-us-dod-mp-2025-preferred-equity | ["instrument","value_role","capital_source","amount","provider","recipient","materials","status","terms"] | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Introductory paragraph; Item 1.01, Series A Preferred Stock and Warrant |
| fin-us-dod-mp-2025-preferred-equity | ["status"] | src-mp-10q-2026-q2 | 2026-08-07 / 2026-10-03 | Note 12, Redeemable Preferred Stock |
| fin-us-dod-mp-2025-price-floor | ["instrument","value_role","capital_source","provider","recipient","materials","status","terms"] | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Item 1.01, Price Protection Agreement |
| fin-us-dod-mp-2025-samarium-loan | ["instrument","value_role","capital_source","amount","provider","recipient","project","facility","location","stages","materials","status","terms"] | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Item 1.01, Transaction Agreement; Item 2.03 |
| fin-us-dod-mp-2025-samarium-loan | ["instrument","amount","provider","legal_authority","relationships","status","programme"] | src-osc-mp-loan-2025 | 2025-08-10 / 2026-09-23 | First and third paragraphs |
| fin-us-dod-mp-2025-samarium-loan | ["status"] | src-mp-10k-2025 | 2026-02-26 / 2026-09-23 | MD&A, DoW Transactions; Liquidity and Capital Resources |
| fin-us-dod-perpetua-stibnite-dpa | ["instrument","value_role","capital_source","amount","provider","legal_authority","recipient","project","status"] | src-perpetua-sec-2024-q2 | no published date / 2026-10-02 | DPA Grant / liquidity disclosures |
| fin-us-dod-perpetua-stibnite-dpa | ["status"] | src-perpetua-sec-2026-q2 | no published date / 2026-10-02 | Government Funding / DPA Grant |
| fin-us-dod-perpetua-stibnite-dpa | ["status"] | src-perpetua-stibnite-construction-2026 | 2026-06-01 / 2026-10-02 | Construction update |
| fin-us-dod-perpetua-stibnite-dpa | ["status"] | src-perpetua-sec-dpa-2022 | 2022-12-19 / 2026-10-02 | Item 1.01 |
| fin-us-dow-5n-germanium-2025 | ["instrument","value_role","capital_source","amount","provider","legal_authority","recipient","project","facility","location","stages","materials","status"] | src-dow-5n-germanium-2026 | 2026-01-29 / 2026-10-02 | Opening through capacity paragraphs |
| fin-us-dow-arr-antimony-2025 | ["instrument","value_role","capital_source","amount","provider","legal_authority","recipient","project","location","stages","materials","status"] | src-dow-arr-antimony-2025 | 2025-09-30 / 2026-10-02 | Opening and award-scope paragraphs |
| fin-us-dow-arr-antimony-2025 | ["recipient","project","location","stages","materials","status","terms"] | src-nova-arr-h1-2026 | no published date / 2026-10-02 | U.S. Department of War Grant; Refinery & Equipment Procurement |
| fin-us-dow-usac-antimony-2026 | ["instrument","value_role","capital_source","amount","provider","legal_authority","recipient","project","location","stages","materials","status"] | src-dow-usac-antimony-2026 | 2026-03-04 / 2026-10-02 | Opening and award-scope paragraphs |
| fin-us-dow-usac-antimony-2026 | ["recipient","project","location","stages","materials","status","terms"] | src-usac-2026-q2-10q | 2026-08-11 / 2026-10-02 | Note 9 — Government Grant; Property, Plant and Equipment |
| fin-us-exim-perpetua-stibnite-2026 | ["instrument","value_role","capital_source","amount","provider","recipient","project","location","materials","status"] | src-exim-stibnite-transactions-2026 | no published date / 2026-10-02 | 2026 Perpetua Resources Corp. transaction row |
| fin-us-exim-perpetua-stibnite-2026 | ["instrument","provider","recipient","project","materials","status"] | src-exim-stibnite-board-2026 | 2026-05-21 / 2026-10-02 | Transaction AP768324XX |
| fin-us-exim-perpetua-stibnite-2026 | ["status","legal_authority"] | src-perpetua-sec-2026-q2 | no published date / 2026-10-02 | Project Financing from U.S. EXIM |
| fin-us-exim-perpetua-stibnite-2026 | ["status"] | src-perpetua-stibnite-construction-2026 | 2026-06-01 / 2026-10-02 | Construction update |
| fin-us-osc-vulcan-reelement-2025-joint-commitment | ["instrument","value_role","capital_source","amount","provider","legal_authority","recipient","relationships","materials","status","terms","outcomes","programme"] | src-osc-vulcan-reelement-2025 | 2025-11-21 / 2026-09-23 | First to fourth paragraphs |
| fin-us-osc-vulcan-reelement-2025-reelement-loan | ["instrument","value_role","capital_source","amount","provider","recipient","relationships","materials","status","programme"] | src-osc-vulcan-reelement-2025 | 2025-11-21 / 2026-09-23 | Second paragraph |
| fin-us-osc-vulcan-reelement-2025-vulcan-elements-loan | ["instrument","value_role","capital_source","amount","provider","recipient","relationships","materials","status","programme"] | src-osc-vulcan-reelement-2025 | 2025-11-21 / 2026-09-23 | Second paragraph |

## 11. Control-clause status and evidence locators

Clauses listed: every clause whose current status has a stated end after 2026-10-03, the clauses on antimony and germanium, and the clauses on the two events that carry both commitments and controls. Evidence is listed where its `supports` touches `status`; "locator not recorded" means the field is null.

| Clause | Issuer / direction | Status on as-of (current entry: from, until) | Source | Source published / accessed | Locator |
| --- | --- | --- | --- | --- | --- |
| ctl-cn-56-2025-customs-declaration | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-56 | 2025-10-09 / 2026-09-23 | Paragraph after the item list; preamble |
| ctl-cn-56-2025-customs-declaration | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-56-2025-equipment-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-56 | 2025-10-09 / 2026-09-23 | Preamble; Item 1 (2B902.a–z); closing paragraphs |
| ctl-cn-56-2025-equipment-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-56-2025-raw-materials-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-56 | 2025-10-09 / 2026-09-23 | Preamble; Item 2 (1C914.a–c); closing paragraphs |
| ctl-cn-56-2025-raw-materials-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-57-2025-customs-declaration | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-57 | 2025-10-09 / 2026-09-23 | Paragraph after the explanatory notes; preamble |
| ctl-cn-57-2025-customs-declaration | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-57-2025-export-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-57 | 2025-10-09 / 2026-09-23 | Preamble; Items 1–5; explanatory notes; closing paragraphs |
| ctl-cn-57-2025-export-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-58-2025-battery-cathode-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-58 | 2025-10-09 / 2026-09-23 | Preamble; Items 1–2; closing paragraphs |
| ctl-cn-58-2025-battery-cathode-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-58-2025-customs-declaration | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-58 | 2025-10-09 / 2026-09-23 | Paragraph after the item list; preamble |
| ctl-cn-58-2025-customs-declaration | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-58-2025-graphite-anode-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-58 | 2025-10-09 / 2026-09-23 | Preamble; Item 3; closing paragraphs |
| ctl-cn-58-2025-graphite-anode-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-62-2025-knowledge-catch-all | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-62 | 2025-10-09 / 2026-09-23 | Item 1, second paragraph; Item 8 |
| ctl-cn-62-2025-knowledge-catch-all | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-62-2025-overseas-support-ban | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-62 | 2025-10-09 / 2026-09-23 | Item 7; Items 2 and 8 |
| ctl-cn-62-2025-overseas-support-ban | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-62-2025-production-line-technology-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-62 | 2025-10-09 / 2026-09-23 | Item 1(2); Item 8 |
| ctl-cn-62-2025-production-line-technology-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-62-2025-technology-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-62 | 2025-10-09 / 2026-09-23 | Item 1(1) and its definitions paragraph; Item 8 |
| ctl-cn-62-2025-technology-licensing | china / export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-antimony-2024-export-licensing | china / export | in_force (in_force, 2024-09-15, no stated end) | src-mofcom-33 | 2024-08-15 / 2026-07-09 | Preamble; Items 1(1) and 8 |
| ctl-cn-antismuggling-2025-strategic-minerals | china / export | announced (announced, 2025-05-09, no stated end) | src-mofcom-antismuggling-2025 | 2025-05-09 / 2026-09-22 | First and second paragraphs |
| ctl-cn-gage-2023-export-licensing | china / export | in_force (in_force, 2023-08-01, no stated end) | src-mofcom-23 | 2023-07-03 / 2026-08-10 | Preamble; Items 1, 2 and 8 |
| ctl-cn-ree-2025-10-advanced-chip-ai-review | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-61 | 2025-10-09 / 2026-08-12 | Item 8 |
| ctl-cn-ree-2025-10-advanced-chip-ai-review | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-ree-2025-10-de-minimis-licensing | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-61 | 2025-10-09 / 2026-08-12 | Items 1(1) and 8 |
| ctl-cn-ree-2025-10-de-minimis-licensing | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-ree-2025-10-foreign-direct-product-licensing | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-61 | 2025-10-09 / 2026-08-12 | Items 1(2) and 8 |
| ctl-cn-ree-2025-10-foreign-direct-product-licensing | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-ree-2025-10-military-listed-end-users | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-61 | 2025-10-09 / 2026-08-12 | Item 8 |
| ctl-cn-ree-2025-10-military-listed-end-users | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-ree-2025-10-origin-reexport-licensing | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-61 | 2025-10-09 / 2026-08-12 | Items 1(3) and 8 |
| ctl-cn-ree-2025-10-origin-reexport-licensing | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-ree-2025-10-prohibited-end-uses | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-61 | 2025-10-09 / 2026-08-12 | Item 8 |
| ctl-cn-ree-2025-10-prohibited-end-uses | china / re_export | suspended (suspended, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-ree-2025-11-suspension | china / export | in_force (in_force, 2025-11-07, 2026-11-10) | src-mofcom-70 | 2025-11-07 / 2026-07-09 | Operative sentence |
| ctl-cn-us-2024-gallium-germanium-antimony-denial | china / export | suspended (suspended, 2025-11-09, 2026-11-27) | src-mofcom-46 | 2024-12-03 / 2026-08-12 | Item 2 |
| ctl-cn-us-2024-gallium-germanium-antimony-denial | china / export | suspended (suspended, 2025-11-09, 2026-11-27) | src-mofcom-72 | 2025-11-09 / 2026-08-12 | Operative sentence |
| ctl-cn-us-2024-graphite-end-use-review | china / export | suspended (suspended, 2025-11-09, 2026-11-27) | src-mofcom-46 | 2024-12-03 / 2026-08-12 | Item 2 |
| ctl-cn-us-2024-graphite-end-use-review | china / export | suspended (suspended, 2025-11-09, 2026-11-27) | src-mofcom-72 | 2025-11-09 / 2026-08-12 | Operative sentence |
| ctl-us-chips-usar-2026-covenants | us / inbound_investment | in_force (in_force, 2026-06-03, no stated end) | src-usar-8k-2026-06-03 | 2026-06-03 / 2026-09-23 | Item 1.01, Representations, Warranties and Covenants |
| ctl-us-dod-mp-2025-ownership-covenants | us / inbound_investment | in_force (in_force, 2025-07-09, no stated end) | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Item 1.01, Transaction Agreement |
| ctl-us-dod-mp-2025-restricted-buyers | us / domestic | in_force (in_force, 2025-07-09, no stated end) | src-dod-mp-transaction-agreement-2025 | 2025-07-10 / 2026-10-03 | Item 1.01, Price Protection Agreement and Offtake Agreement |
