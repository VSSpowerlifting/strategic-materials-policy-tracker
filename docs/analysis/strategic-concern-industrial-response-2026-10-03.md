# Strategic Concern → Industrial Response: first baseline on merged main

Prepared 2026-10-04 · analysis as-of **2026-10-03** · data: `origin/main` = `b4183f8fc68beea7a53496d73d9e04c93d553a69`
(PR #43, "Consolidate lifecycle refreshes #36-#42 …") · dataset record-as-of `site.lastUpdated` = **2026-10-02**.

**This is the first baseline of this analysis, not a rerun of an existing published analysis.** No earlier version exists in
the repository or its history (see section 1). It is a **draft**: nothing here is a human-approved classification, and no seed
record was changed.

Generated tables (every number below comes from them): [`concern-response-tables-2026-10-03.md`](concern-response-tables-2026-10-03.md).
Generator: [`scripts/analyze-concern-response.ts`](../../scripts/analyze-concern-response.ts). Checks run: section 10.

## Bottom line

1. Rationale and binding instruments are common; recorded physical progress is thinner and only partly overlaps them.
   Of 29 projects with a government commitment, 18 have a binding one and 9 record construction or later (8 on a strict
   reading). **The two sets are not nested: 7 projects are in both (6 strict)**, 11 are binding without construction recorded
   (10 of them with no physical status at all), and 2 record construction without a binding government commitment.
2. Financial status and physical status are independent axes. Records carry one without the other, in both directions, and
   neither is evidence about the other's maturity.
3. The US rare-earth and magnet response is dense in instruments and thin in recorded physical evidence. Neodymium and
   praseodymium rest on one binding public instrument, the DoD price floor, which the queue flags P1.
4. Antimony and germanium differ sharply, and **both conclusions rest on rows the queue marks P1**: all 6 antimony and all 3
   germanium government-commitment rows. Germanium records no binding public commitment.
5. Controls and responses share material and stage cells, but **no record links a response to a control**, so the data cannot
   show a response *to* a control. 21 of 45 control clauses carry a stated end date after the as-of date.
6. Official government framing is present on 23 of the 31 commitment-bearing events (24 counting any source). The one claim
   that fails the official test, `fc-us-dod-mp-natsec`, is secondary reporting of an unnamed spokesperson (Finding 3) and is
   excluded from every count that requires verified government framing.

Next task: a bounded source review of 11 rows in 8 P1 bundles, 10 of them to verify (section 8), not another sweep.

## 1. Scope, dates and provenance of the figures

| Item | Value | Basis |
| --- | --- | --- |
| Repository / HEAD | `strategic-materials-policy-tracker`, detached at `b4183f8`, equal to `origin/main` | observed (`git rev-parse`) |
| Starting state | checkout was on `codex/animated-title` (`716953f`); switched to detached `origin/main`; that branch is untouched | observed |
| Corpus | 61 events, 85 financial rows, 45 control clauses, 57 framing claims, 57 registry projects | regenerated (`npm run validate` passes) |
| Lifecycle queue at 2026-10-03 | P0 0 · P1 18 bundles (25 rows individually P1, 29 rows in P1 bundles) · P2 16 · P3 19; 53 bundles | regenerated; **matches** the checkpoint figures Ben gave |
| CI, production deploy, citation/title checks, closure of #36–#42/#28/#32 | passed / closed | **reported by Ben; not re-verified here** |
| Window | events from April 2025 forward plus foundational instruments already in the seed (the corpus includes 2022–2024 rows) | corpus scope, not widened |

Two dates are used and kept apart: the **as-of date** (`--as-of 2026-10-03`, passed explicitly; the script reads no clock)
sets ages and control status, and `site.lastUpdated` (2026-10-02) is when the records were last stamped. The merge commit's
author date is 2026-10-04, after the as-of date; ages are measured to 2026-10-03 as instructed.

**What `--as-of` controls, and what it does not.** `--as-of` fixes the date for the dated calculations: the lifecycle queue's
ages and priorities, control status on that date (`controlStatusOn`, including the stage-response map), and the day counts for
stated ends and source ages. It does **not** date-slice current financial or physical status. `currentFinancialStatus` returns
the last entry of a row's `financialStatusHistory`, and the script reads the last `implementationStatusHistory` entry, whatever
those entries' dates. Every financial-status, binding and physical-status count here is the status at the analysed data
revision, not a reconstruction of the status that held on 2026-10-03. At `b4183f8` no financial or implementation status entry is
dated after 2026-10-03 (the latest are 2026-09-07 and 2026-09-14), so the as-of date and the current status coincide for this
baseline, and the findings are unaffected. That would not hold for later data, which can carry entries dated after the as-of date
or undated entries that reflect evidence reviewed later.

No prior "Strategic Concern → Industrial Response" document or script exists in the repository or its history (searched `docs/`,
`scripts/` and `PROJECT_STATE.md`; `git log --all -S "Industrial Response"` finds only PR commits that mention it in
`PROJECT_STATE.md`). `PROJECT_STATE.md` recorded this analysis as **deferred until the lifecycle sweep was complete**; this baseline
proceeds with 18 P1 bundles still open, which is why section 6 is part of the analysis. The method is built from the corpus's own
counting rules and the operating playbook.

## 2. Definitions and method

**Definitions** (each is implemented in the script and restated in its output):

- **Government commitment (GC) row.** A financial row with value role `commitment`, a providing tracked government
  (`providerJurisdiction`), and not ended (withdrawn or lapsed). 62 rows; **44 after folding** parts into packages that are
  themselves GC rows (`isFoldedPart`), so a package is counted once and never together with its parts. A GC row can be money
  (equity, grant, loan, loan guarantee) or not money: a price floor, offtake, procurement right or tax credit carries no amount
  and is never added to money rows. Folded GC rows by instrument and legal standing are in generated section 3.
- **Kept apart from GC** (23 rows, by role): `funding_option` (an option is not a commitment and never backing), indications
  (letters of interest, preliminary non-binding intent), program envelopes, appropriations, lending authority, private financing,
  `recipient_own_funds` (a cash balance a company says it will use), total project cost, expected co-investment, one commitment
  with no tracked providing government, and ended rows. None is counted as government response.
- **Binding instrument.** A GC row whose current financial status is `contracted`, `partially_disbursed` or `disbursed`
  (the corpus's `legalStanding` = binding). `announced`, `authorized`, `allocated` and `decided` are **not binding**; `decided`
  includes conditional approvals (Ucore's "conditionally approved" Canadian funding; OSC's $700 million **conditional** Vulcan/ReElement
  loan commitment). An unstated status is its own bucket, never read as not-yet-binding. "Funded" = `partially_disbursed` or `disbursed`.
- **Project denominator.** The 57 registry projects; 32 are linked by at least one commitment row of any role; **29 have at least
  one GC row and are the denominator for every project measure**. The other three (`prj-ca-trail-strategic-metals`,
  `prj-ca-vianode-st-thomas`, `prj-kz-sarytogan`) carry only indications or a commitment with no tracked providing government. A
  project is binding if any linked GC row is binding.
- **"Construction or later".** The project's current recorded physical status is `construction`, `commissioning`, `operational`
  or `completed`. Physical status lives on commitment rows' `implementationStatusHistory`, so a project's status is the current
  entry on its linked rows (any role); no project's linked rows disagree. `announced` and `feasibility` are below the threshold;
  no recorded status is **unknown**, not "not built". **Strict** drops a status that records completion of a funded activity rather
  than a statement about the facility (one project, Finding 1).
- **Official government framing.** A framing claim whose source is `sourceType` official. Framing is the quoted rationale of the
  responder at the announcing event; it is never evidence that a control caused an investment.

**Method.**

- **Ladder (my presentation framework, not a corpus field):** rationale quoted → named project → instrument decided → binding →
  funded → physical construction or later. It orders the tables, is never a per-material score (hard rule 1), and financial and
  physical status are read as independent axes. The GC definition above is likewise mine.
- **Unknown stays visible.** "None recorded" (no physical history on a row where one applies) is distinguished from "not
  applicable". Neither shows that nothing was built.
- **No money is totalled or converted.** Amounts are quoted as stated with qualifier and currency; instruments and currencies are
  never combined; counts are records, not magnitudes.
- **Material rows are not additive.** A row tagged to several materials appears in each (extreme: `fin-au-cmpti-2025-production-tax-offset`,
  ten materials; the four USA Rare Earth parents name four or five).

## 3. Denominators

| Measure | Count | Out of |
| --- | --- | --- |
| Events carrying ≥1 financial row | 31 | 61 events |
| …with ≥1 framing claim, any source | 24 | 31 |
| …with ≥1 framing claim from an official source | **23** | 31 |
| Events carrying ≥1 control clause | 19 | 61 |
| Events carrying both commitments and controls | 2 | 61 |
| Financial rows by role | 63 commitment · 8 envelope · 5 indication · 3 appropriation · 1 each: co-investment, option, lending authority, private financing, own funds, total project cost | 85 |
| GC rows | 62 unfolded / 44 folded | 85 |
| Registry projects linked by ≥1 row | 32 | 57 |
| …with ≥1 GC row (**project denominator**) | 29 | 32 |
| …with a binding GC row | 18 | 29 |
| …with a funded GC row | 6 | 29 |
| …with any physical status recorded | 13 | 29 |
| …with construction or later recorded | 9 (strict 8) | 29 |
| Folded GC rows with no registry project | 15 | 44 |

**Folded GC rows by instrument (generated section 3).** Binding / not yet binding: equity 6 / 2, grant 5 / 7, loan 2 / 2, loan
guarantee 1 / 0, mixed 0 / 1, offtake 3 / 1, price floor 1 / 0, procurement right 0 / 1, tax credit 0 / 1, unspecified 2 / 9.
So of 20 binding folded rows, 4 are non-money (3 offtakes and the price floor).

**Overlap of the binding and construction-or-later sets (not nested).**

| | Construction or later recorded | Physical status below construction | No physical status recorded | Total |
| --- | --- | --- | --- | --- |
| **Binding GC row** | 7 (strict 6) | 1 (`prj-na-lofdal`, feasibility) | 10 | 18 |
| **No binding GC row** | 2 (`prj-au-alcoa-sojitz-gallium`, `prj-ca-ggt-regolith-graphite`) | 3 (Ucore, Wicheeda, Allied tungsten) | 6 | 11 |
| **Total** | 9 (strict 8) | 4 | 16 | 29 |

The seven in both: Cyclic Kingston Centre of Excellence, Cyclic Kingston demonstration plant, Matawinie, Neo's Estonian magnet
project, the INL antimony pilot, MP's 10X facility, Stibnite. Strict drops the Cyclic demonstration plant. Of the 11 binding projects
without construction recorded, none can be called "behind": 10 simply have no status in the corpus.

Stage placement: 57 of 85 capital rows and 18 of 45 control clauses sit on a material × stage cell; 27 clauses do not (16 have no
stage by rule, 11 for another reason), so the stage map under-represents controls.

## 4. Material-by-material comparison

Counts are per material and **must not be summed** across rows. "GC" is the folded count. Binding and funded are of the GC rows.
"Named projects" are distinct registry projects behind unfolded GC rows. "P1-exposed" is GC rows whose own queue priority is P1
(a description of the queue, not a finding about the facts). Framing counts are **official sources only**.

| Material | Events naming it | Official framing claims on commitment-bearing events | Control clauses (in force / suspended / announced / concluded) | GC rows | Binding | Funded | Named projects → construction or later | P1-exposed GC rows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| antimony | 20 | 9 | 3 (1 / 1 / 1 / 0) | 6 | 4 | 3 | 3 → 2 | **6 of 6** |
| dysprosium | 11 | 4 | 3 (3 / 0 / 0 / 0) | 6 | 5 | 2 | 2 → 0 | 1 |
| gallium | 19 | 6 | 4 (2 / 1 / 1 / 0) | 6 | 2 | 0 | 2 → 1 | 1 |
| germanium | 17 | 5 | 3 (1 / 1 / 1 / 0) | 3 | **0** | 0 | 2 → 0 | **3 of 3** |
| graphite | 22 | 7 | 7 (2 / 3 / 0 / 2) | 9 | 3 | 1 | 4 → 2 | 4 |
| neodymium | 8 | 1 | 1 (1 / 0 / 0 / 0) | 2 | 1 | 0 | 0 → 0 | 2 of 2 |
| praseodymium | 9 | 1 | 1 (1 / 0 / 0 / 0) | 2 | 1 | 0 | 0 → 0 | 2 of 2 |
| rare-earth-elements | 38 | 13 | 25 (8 / 15 / 1 / 1) | 18 | 9 | 4 | 12 → 2 | 4 (+2 bundle-only) |
| ndfeb-magnets | 13 | 4 | 12 (5 / 6 / 0 / 1) | 6 | 5 | 2 | 4 → 2 | 0 (+2 bundle-only) |
| terbium | 12 | 4 | 3 (3 / 0 / 0 / 0) | 6 | 5 | 2 | 2 → 0 | 1 |
| tungsten | 18 | 4 | 2 (1 / 0 / 1 / 0) | 6 | **0** | 0 | 3 → 0 | 2 |

Counting the non-official claim (`fc-us-dod-mp-natsec`) would give neodymium 2, praseodymium 2, rare-earth-elements 14 and NdFeB
magnets 5; every other row is unchanged. "→ construction or later" is the headline reading; the strict reading differs only for
rare-earth-elements (2 → 1, both headline projects being Cyclic's).

Reading notes (generated sections 4a–4c, 8):

- **Who responds, by material.** Antimony is a US response (5 of 6 GC rows; one Australian). Graphite is Canadian (7 of 9).
  Tungsten is UK and Japan (4 of 6) with no binding row. Dysprosium and terbium are Japan-led (3 of 6) with US and Australian rows.
  NdFeB magnets are US (5 of 6) plus the EU's Neo grant. Neodymium and praseodymium have two rows each: the Australian tax offset
  and the US price floor.
- **Framing.** Antimony, gallium, germanium and graphite are named by 17–22 events each but have only 3–7 control clauses. Their
  official framing on commitment-bearing events is mostly `supply_chain_resilience`. National-security framing there appears for
  antimony (6 claims), germanium (3), gallium (1), rare-earth-elements (1), NdFeB magnets (1) and tungsten (1, a UK event); graphite
  has none.
- **Tag inflation.** Rare-earth-elements, gallium and the heavy rare earths are lifted by the CMPTI tax offset and the USA Rare
  Earth packages. Gallium's two binding GC rows are the USA Rare Earth direct-funding and loan-guarantee packages, which carry
  gallium through multi-material tagging (`includes_untracked`); the Alcoa–Sojitz gallium rows are only `announced`. Treat gallium and
  the heavy-rare-earth rows as the least reliable in the table.

## 5. Findings

Each finding states what the data supports and what it does not. Record ids are exact; locators are copied from
`evidence[].locator` (generated section 10 lists every status-supporting locator on the rows named here; none is recorded as null).

### Finding 1 — Binding instruments and recorded physical progress overlap only partly

*Observed (overlap table).* 18 projects have a binding GC row and 9 record construction or later; 7 are in both, 11 are binding
without construction recorded, 2 record construction without a binding GC row. **10 binding projects record no physical status at
all**: `prj-au-nolans`, `prj-ca-ggt-graphite-recycling-pilot`, `prj-ee-co2graphite`, `prj-us-estelle-antimony`,
`prj-us-mountain-pass-samarium`, and the five USA Rare Earth projects (`prj-us-usar-round-top`, `-stillwater-magnet`,
`-stillwater-metal`, `-magnet-project-2`, `-metal-project-2`).

*Not supported.* "None recorded" is an unknown, not an absence. The USA Rare Earth rows were contracted on 2026-06-03, 122 days
before the as-of date, so little physical evidence would be expected yet; their physical clock is P2. Three of the ten sit on rows the
queue marks P1 (CO2Graphite, Estelle, the samarium loan). No claim is made that any of these projects is stalled.

*Project-level physical evidence is not attributed to funding deliverables.* For all nine construction-or-later projects the status
entry's own note and source were read against what each says. Eight are statements about the project or facility itself:
Wagerup groundbreaking ("start of construction at Wagerup", `src-alcoa-wagerup-groundbreaking-2026`); Cyclic "now constructing its
first commercial-scale Hub in Kingston" (`src-cgf-cyclic-2026`); NMG's Phase 2 Matawinie construction start, which its note keeps
separate from the FID and financing (`src-nmg-q2-mda-2026`); GGT's Mississauga demonstration facility entering final commissioning
(`src-ggt-mississauga-demo-commissioning-20260811`); Neo's European facility in commercial production
(`src-neo-commercial-production-2026`); the Army's opening of the INL prototype facility (`src-us-army-antimony-pilot-2026`); MP's
Northlake construction (`src-mp-10q-2026-q2`, Note 6); and Stibnite early-works and later critical-path construction
(`src-perpetua-stibnite-construction-2026`). Three of these attach to a funding row only through the registry's project link:
GGT's own post does not name the NRCan award (the row note says so), the INL pilot being operational is not completion of the
OTIA agreement's deliverables, and MP's Northlake status sits on the lapsed bank-financing row and the offtake row because it is
the project's own fact. **The ninth, `prj-ca-cyclic-kingston-demonstration-plant`, does not support a facility reading:** its
`completed` status comes from NRCan's funded-project page, which says the Kingston Demonstration Plant – "Extended Operations"
project was launched in 2024 and completed in March 2026 (`src-nrcan-cmrdd-programme`; the source has an access date only). That is
completion of a funded activity, so the headline count of 9 is kept as recorded and the strict count of 8 (6 in both sets) drops it.

### Finding 2 — Financial and physical status are independent axes

The records show each status without the other, in both directions. None of the examples shows one axis "ahead" of the other in
maturity; they show that neither can be read from the other.

- *Physical evidence recorded, financial status earlier or lower.* `fin-ca-pdac-2026-ggt-eip` is `announced` (2026-03-03,
  `src-nrcan-pdac-2026`) while the project's demonstration facility is `commissioning` (2026-08-11). The Alcoa–Sojitz gallium rows
  (`fin-au-alcoa-sojitz-gallium-2025-equity`, `-offtake-right`, `fin-us-alcoa-sojitz-gallium-2025-equity`) are `announced` while the
  project is in `construction` (2026-08-24). The financial entries are older than the physical ones; a later financial event may
  simply not be recorded. The GGT facility is the registry's reading of a post that does not name the award.
- *Financial status recorded, no physical status.* `fin-us-dod-mp-2025-samarium-loan` is `disbursed` with no physical history
  (`src-mp-10k-2025`, published 2026-02-26, "MD&A, DoW Transactions; Liquidity and Capital Resources"), and no lifecycle review date
  is recorded for its physical status. That is an unknown, not a lag.
- *Different dimensions, not a gap.* Ucore's three rows (`fin-ca-g7-2025-ucore-*`) are `decided` — a **conditional** approval —
  and the facility is `announced`. A conditional funding decision and an announced facility are two facts about an early-stage
  project; together they do not establish that finance is ahead of anything, and no maturity order is claimed. Wicheeda
  (`fin-ca-pdac-2026-wicheeda-flmf`, `decided`; project at `feasibility`) is the same pattern, and feasibility is not completion of the
  funded transmission-line works.
- *Instrument vs project.* `fin-us-dod-perpetua-stibnite-dpa` is `disbursed` and Stibnite is in `construction` with no single start
  date (the source gives early works in October 2025 and critical-path construction in May 2026). The INL pilot is `operational`
  (2026-07-29) while `fin-us-army-perpetua-antimony-otia` is `partially_disbursed`; a working pilot is a fact about the project, not
  completion of the OTIA deliverables.

No ordinal score combining the axes would be defensible. Across 29 projects no linked rows disagree on physical status.

### Finding 3 — US rare earths and magnets: dense instruments, thin physical record, one-instrument NdPr response

*Instruments (quoted as stated, never added; kinds kept apart).* GC rows from DoD–MP: `fin-us-dod-mp-2025-preferred-equity` ($400
million equity investment, contracted 2025-07-09 → disbursed, undated; `src-mp-10q-2026-q2`, "Note 12, Redeemable Preferred Stock");
`fin-us-dod-mp-2025-price-floor` (a price floor with **no amount stated**: a government commitment, not money;
`src-dod-mp-transaction-agreement-2025`, "Item 1.01, Price Protection Agreement"); `fin-us-dod-mp-2025-samarium-loan` ($150,000,000
loan, decided 2025-07-09 → contracted → disbursed, the last two undated); `fin-us-dod-mp-2025-magnet-offtake` (offtake, contracted
2025-07-09). **Not GC, kept apart:** `fin-us-dod-mp-2025-additional-preferred-option` (an **option** for up to $350 million, a
`funding_option`), `fin-us-dod-mp-2025-company-cash` (up to $600,000,000 of the company's own cash, `recipient_own_funds`),
`fin-us-dod-mp-2025-bank-financing` (private, at least $1,000,000,000, **lapsed 2025-08-26**, `src-mp-10q-2025-q3`). USA Rare Earth:
direct funding up to $277.0 million and a loan guarantee up to $1.3 billion, contracted 2026-06-03, with ten project child rows
folded into the two. OSC Vulcan/ReElement: a $700 million **conditional** commitment, `decided` only, hence not binding.

*Locators.* `fin-us-dod-mp-2025-samarium-loan`: `src-dod-mp-transaction-agreement-2025` "Item 1.01, Transaction Agreement; Item 2.03"
(2025-07-10), `src-osc-mp-loan-2025` "First and third paragraphs" (2025-08-10), `src-mp-10k-2025` "MD&A, DoW Transactions; Liquidity and
Capital Resources" (2026-02-26). Bank-financing lapse: `src-mp-10q-2025-q3` "Note 3 (Public-Private Partnership), Commitment Letter for
Facility Construction" (2025-11-07). `fin-us-dod-mp-2025-magnet-offtake` physical status: `src-mp-10q-2026-q2` "Note 1; Note 6, Property,
Plant and Equipment; … MD&A, DoW Offtake Agreement and Magnetics segment" (2026-08-07).

*Physical.* Only the 10X facility records construction (undated, `src-mp-10q-2026-q2`). The samarium loan has none recorded, and none
of the five USA Rare Earth projects does.

*NdPr.* For neodymium and praseodymium the only binding GC row is `fin-us-dod-mp-2025-price-floor`; the other row for each is the
Australian CMPTI tax offset, `authorized` (not binding). Both rows are P1-exposed, so "one binding instrument" is exactly as fresh as a
2025-07-10 source (450 days at the as-of date). It stays in the baseline; queue membership does not invalidate it.

*Recognition evidence: `fc-us-dod-mp-natsec` is not verified government framing.* Checked against the raw source page (not a
summary). The quotation appears in Fortune's 2025-08-12 article (`src-fortune-dod-mp`, `sourceType` news, `confidence` secondary) as a
statement by "A Defense Department spokesperson" who "told Fortune"; the speaker is unnamed and the corpus holds no DoD release,
document or filing carrying the statement. The speaker is therefore, per the reporter, a DoD spokesperson, but the evidence is
secondary reporting. Two further problems: (a) the stored quote ends "…rare earth magnet sectors of the U.S." while the sentence
continues "…U.S. industrial base won't happen overnight, but DOD is taking immediate action to streamline processes and identify
opportunities to strengthen critical minerals production" — so the record is cut mid-phrase and drops the hedge and the stated
action; (b) the record's note presents the sentence as "stated rationale of the DoD–MP Materials partnership", but the sentence is a
general statement about rebuilding the sectors. Treatment: identified as secondary reporting and **excluded from every count that
requires verified government framing** (generated sections 1, 4a, 5). Without it, 23 of 31 commitment-bearing events carry official
framing, and `evt-us-dod-mp-2025` (9 financial rows, the largest DoD–MP event) carries none; neodymium and praseodymium fall from 2 to 1
official claims, NdFeB magnets from 5 to 4 and rare-earth-elements from 14 to 13, and national-security framing on NdFeB magnets and
rare-earth-elements from 2 to 1 each. **The seed record was not altered** (see section 7). Only this claim's quotation integrity was
audited; for the other 56 claims only the source type was checked (54 official primary, 1 official translation, 1 government media;
none news).

*Framing that remains official.* `fc-us-chips-usar-2026-chokepoints` (supply-chain resilience, `src-nist-chips-usar-2026`, 2026-01-26).
The "controls" on `evt-us-dod-mp-2025` and `evt-us-chips-usar-2026` (`ctl-us-dod-mp-2025-ownership-covenants`, `-restricted-buyers`,
`ctl-us-chips-usar-2026-covenants`) are contract covenants of the deals themselves, not external controls the deals answer.

### Finding 4 — Antimony has the densest binding US record; germanium has none; both rest on queue-flagged rows

*Antimony.* Six GC rows (five US, one Australian): `fin-us-army-perpetua-antimony-otia` (partially disbursed; estimated $27.1 million),
`fin-us-dod-perpetua-stibnite-dpa` ($59.2 million, disbursed), `fin-us-dow-arr-antimony-2025` ($43.4 million, contracted 2025-10-01),
`fin-us-dow-usac-antimony-2026` ($27 million, partially disbursed), `fin-us-exim-perpetua-stibnite-2026` (2,906 US$ millions, **decided
2026-05-21, not binding**), plus CMPTI. Four are binding, three funded. Physical evidence sits on two projects: INL pilot (operational)
and Stibnite (construction, undated). Estelle has none; the USAC row names no project. Chinese controls: `ctl-cn-antimony-2024-export-licensing`
(in force from 2024-09-15; `src-mofcom-33`, published 2024-08-15, "Preamble; Items 1(1) and 8") and the US-denial clause
`ctl-cn-us-2024-gallium-germanium-antimony-denial` (suspended until 2026-11-27; `src-mofcom-72`, published 2025-11-09, "Operative sentence";
original measure `src-mofcom-46`, 2024-12-03, "Item 2"). Row locators: OTIA `src-perpetua-sec-2026-q2` "DOW Ordnance Technology Consortium
Grant" (access date only) and `src-us-army-antimony-pilot-2026` "Opening and programme-history paragraphs" (2026-08-06); Stibnite DPA
`src-perpetua-sec-2026-q2` "Government Funding / DPA Grant" and `src-perpetua-stibnite-construction-2026` "Construction update" (2026-06-01);
EXIM `src-exim-stibnite-board-2026` "Transaction AP768324XX" (2026-05-21); USAC `src-usac-2026-q2-10q` "Note 9 — Government Grant; Property,
Plant and Equipment" (2026-08-11).

*Germanium.* Three GC rows, none binding: `fin-us-dod-5n-germanium-2024` ($14.4 million, `decided` 2024-04-16, `src-dod-5n-germanium-2024`,
900 days), `fin-us-dow-5n-germanium-2025` ($18.1 million, `decided` 2025-12-15, `src-dow-5n-germanium-2026`, 292 days), and CMPTI
(`authorized`). Canada's `fin-ca-trail-cgf-2026-indication` (up to $400 million, germanium/antimony/gallium) is an indication only. No
physical status is recorded on either 5N row. Chinese clauses: `ctl-cn-gage-2023-export-licensing` (in force from 2023-08-01; `src-mofcom-23`,
published 2023-07-03, "Preamble; Items 1, 2 and 8") and the same suspended US-denial clause. Row locators: `src-dod-5n-germanium-2024`
"Opening through technical-effort paragraphs" (2024-04-16) and `src-5n-germanium-2024` "Opening and award-description paragraphs"
(2024-04-18); `src-dow-5n-germanium-2026` "Opening through capacity paragraphs" (2026-01-29); Trail `src-nrcan-trail-strategic-metals-2026`
"Opening and investment-framework paragraphs" (2026-07-07).

*Limit.* "No binding public germanium commitment is recorded" means *recorded*. No lifecycle review date is recorded for either 5N row,
and the cited sources are announcements; a binding agreement may exist that the corpus has not coded. This is the most
refresh-sensitive claim in the analysis.

### Finding 5 — Controls and responses share cells, but no record links them, and most China clauses carry a stated end

*Co-location.* Of 52 material × stage cells, 28 hold both capital and controls, 22 capital only, 2 controls only (rare-earth
cross-cutting; NdFeB recycling, 0 capital rows against 3 China clauses). Only 2 events carry both commitments and control clauses, and
in both the clauses are the deal's own covenants (Finding 3). The corpus has no field linking a response to an external control, so
**no causal, sequencing or "in response to" claim is supportable**. Sharing a cell shows overlap, not effect (a control's stage is
where its covered items sit).

*Stated ends.* 21 of 45 clauses have a current status with a stated end after the as-of date: 18 suspended until 2026-11-10 (38 days
out), one in force until 2026-11-10 (`ctl-cn-ree-2025-11-suspension`, the suspension instrument itself), and 2 suspended until
2026-11-27 (55 days out). The 2026-11-10 group rests on `src-mofcom-70` (published 2025-11-07, "Operative sentence"), the 2026-11-27 pair
on `src-mofcom-72` (2025-11-09, "Operative sentence"); clause-by-clause locators (for example `src-mofcom-56` "Preamble; Item 2
(1C914.a–c); closing paragraphs") are in generated section 11. What China does at those dates is not coded, so any "response under
suspension" reading changes shortly after the as-of horizon.

*Same-event covenants.* `ctl-us-dod-mp-2025-ownership-covenants` and `-restricted-buyers`: `src-dod-mp-transaction-agreement-2025`
"Item 1.01, Transaction Agreement" and "Item 1.01, Price Protection Agreement and Offtake Agreement"; `ctl-us-chips-usar-2026-covenants`:
`src-usar-8k-2026-06-03` "Item 1.01, Representations, Warranties and Covenants".

## 6. Freshness: what depends on the 18 remaining P1 bundles

The queue gives each row a **categorical** priority (P0–P3) on two separate clocks, financial status and physical status; a row's
priority is the higher of the two and a bundle's the highest of its rows. This analysis adds no freshness score. P1 is a maintenance
flag: it does not say a fact is wrong, and it does not establish that a row was never reviewed in the past — the corpus records review
dates (`lifecycleReview`) only where one was entered. Where the queue's own reason text says a status "has never had" a review, this
document reads it as **no lifecycle review date recorded**; historical non-review is not established. That verbatim text appears
only in generated section 7. Of the 25 individually P1 rows, 18 are P1 on the financial clock and 14 on the physical clock (7 on both).
The causes differ:

- **Old status evidence:** `fin-us-dod-mp-2025-price-floor`, `-additional-preferred-option`, `-company-cash` (all cite only the
  2025-07-10 agreement, 450 days); `fin-us-dod-5n-germanium-2024` (900 days); `fin-us-osc-obbba-2025-*` (2025-08-10 source, 419 days);
  the Indian and Canada-2022 envelope rows (`src-pib-ncmm-2025`, `src-nrcan-cms-2022`); `fin-au-cmpti-2025-production-tax-offset`.
- **Recent evidence, but a clock with no dated entry or no review date recorded:** `fin-us-dod-mp-2025-samarium-loan` (financial
  `disbursed`, 10-K published 2026-02-26, 219 days; its financial clock is P3 and it is P1 only on the physical clock, where no status
  and no review date are recorded), `fin-us-dod-perpetua-stibnite-dpa` and `fin-us-exim-perpetua-stibnite-2026` (construction source
  2026-06-01, 124 days, but the status entry is undated and no review date is recorded), `fin-us-army-perpetua-antimony-otia`
  (physical `operational` from a 2026-08-06 source, P3; the `partially_disbursed` entry is undated, so the 1,142-day financial clock
  runs from 2023-08-18), `fin-us-dow-usac-antimony-2026` (10-Q published 2026-08-11, 53 days; no physical status or review date recorded).
- A source with only an access date (for example `src-perpetua-sec-2026-q2`, 2026-10-02) is labelled as such in section 7 and is not
  treated as an evidence date.

**Diagnostic sensitivity scenario (generated section 8).** The baseline keeps every supported P1 row; queue membership does not
invalidate a fact. To see which baseline counts rest on queue-flagged rows, the scenario removes them. It is a diagnostic, not an
estimate of the truth. With P1-exposed rows removed: antimony 0 binding and 0 funded GC rows (baseline 4 and 3) and 0 construction-or-later
named projects (baseline 2); germanium 0 (baseline 0); neodymium and praseodymium 0 binding (baseline 1). Gallium is unchanged (its two
binding rows are not P1), tungsten has no binding row to remove, graphite binding goes 3→2, and dysprosium, terbium, NdFeB and
rare-earth-elements barely move (5→5, 5→5, 5→5, 9→8). So the NdPr clause of Finding 3 and Finding 4 are the conclusions most exposed to the
review queue; Findings 1, 2 and 5 are not materially (three of Finding 1's ten projects sit on queue-flagged rows).

## 7. Unresolved facts that would change a conclusion

Exact records and the evidence needed. Nothing here was checked against a primary source except the provenance of `fc-us-dod-mp-natsec`.

| Record | Fact | Evidence needed | Changes |
| --- | --- | --- | --- |
| `fin-us-dod-mp-2025-samarium-loan` | Physical status of the Samarium Project | Dated statement of construction or commissioning status in MP's latest 10-Q/10-K or release | Findings 2–3: `disbursed` with no physical record |
| `fin-us-dod-mp-2025-price-floor` | Whether the Price Protection Agreement remains in force as agreed | Post-2025-07-10 MP filing discussion of the agreement | Finding 3: the NdPr single binding instrument |
| `fin-us-dod-mp-2025-additional-preferred-option` | Exercised, lapsed or open | MP 10-Q Note 12 or later | capital stack, not GC counts |
| `fin-us-dod-5n-germanium-2024`, `fin-us-dow-5n-germanium-2025` | Whether award agreements were executed (decided → contracted) and any St. George physical status | A later 5N Plus periodic disclosure or the DoD/DoW award record; the corpus cites announcements (`src-5n-germanium-2024`, the 2026-01-29 DoW release) | Finding 4: germanium binding 0 → up to 2 |
| `fin-us-exim-perpetua-stibnite-2026` | Closed (contracted) vs decided | Perpetua or EXIM closing disclosure after 2026-05-21 | antimony binding 4 → 5 |
| `fin-us-dod-perpetua-stibnite-dpa`, `-exim-…` | Construction start date | Dated statement in `src-perpetua-stibnite-construction-2026` or a later filing | dating only |
| `fin-us-dow-arr-antimony-2025` | Physical status of Estelle | Dated project construction or permitting statement | Finding 1 |
| `fin-us-dow-usac-antimony-2026` | Linked project and physical status | USAC disclosure naming the funded facility; the cited `src-usac-2026-q2-10q` locator "Note 9 — Government Grant; Property, Plant and Equipment" is the first place to read (not read here) | Findings 1, 4 |
| `fc-us-dod-mp-natsec` (framing record, **not edited**) | Government attribution and quotation | The DoD's own release or statement carrying the sentence; then either re-source the claim and quote the full sentence, or recode it as secondary (and its `quoteEn` as a fragment) | Finding 3 and the official-framing counts |
| `prj-ca-cyclic-kingston-demonstration-plant` status | Whether any source states facility status | A source on the plant itself (the cited page is a funded-project listing) | Finding 1 strict count |

## 8. Next task (do not start yet): bounded source review, 11 rows in 8 P1 bundles

Eight of the 18 P1 bundles hold the records the movable conclusions rest on. They contain **11 rows; 10 need verification**, and
`fin-us-dod-mp-2025-preferred-equity` is a P3 bundle-mate (status rests on a 2026-08-07 filing; confirm only). Ben's brief counted 12
rows in 8 bundles; the twelfth, `fin-us-dod-mp-2025-company-cash`, sits in its own ninth bundle and is a recipient cash balance, not a
government commitment, so it is excluded and no finding depends on it.

| # | Bundle (queue title) | Rows | Evidence to find |
| --- | --- | --- | --- |
| 1 | US Department of Defense — evt-us-dod-mp-2025 | `fin-us-dod-mp-2025-price-floor`, `-additional-preferred-option` (verify); `-preferred-equity` (confirm only) | MP 10-Q/10-K on the Price Protection Agreement and the option |
| 2 | Mountain Pass heavy rare earth separation expansion (Samarium Project) | `fin-us-dod-mp-2025-samarium-loan` | Dated physical status |
| 3 | INL antimony sulfide modular pilot plant | `fin-us-army-perpetua-antimony-otia` | A dated source for `partially_disbursed` |
| 4 | Estelle Gold and Critical Minerals Project | `fin-us-dow-arr-antimony-2025` | Dated project status |
| 5 | Stibnite Gold Project | `fin-us-dod-perpetua-stibnite-dpa`, `fin-us-exim-perpetua-stibnite-2026` | Dated disbursement and construction statements; EXIM closing |
| 6 | U.S. Department of War — evt-us-dow-usac-antimony-2026 | `fin-us-dow-usac-antimony-2026` | Linked facility and physical status |
| 7 | St. George germanium recovery and refining expansion | `fin-us-dow-5n-germanium-2025` | Executed award; physical status |
| 8 | St. George space-qualified germanium substrate capacity expansion | `fin-us-dod-5n-germanium-2024` | Executed award; physical status |

Use `source-verifier` per row; AI output stays draft until approved; do not widen to the other 10 P1 bundles.

## 9. Limitations

- Counts are records, not economic magnitudes. The corpus holds 8 jurisdictions, including UK and India events beyond the six actors
  named in the scope rule; they are counted as found. Absence of a row is absence of a *recorded* row.
- Material rows share tagged rows; counts per material overlap and cannot be added.
- The ladder, the GC definition and the strict physical reading are mine; a different rule (for example, counting loan guarantees as
  contingent) would change counts. Binding follows the corpus's `legalStanding`, and the binding counts include non-money instruments
  (price floor, offtakes); generated section 3 splits them by instrument.
- Physical status is recorded on 13 of 29 projects; unrecorded is unknown. A project's status can come from any linked row, including a
  non-GC row (the lapsed MP bank-financing row carries the 10X status because it is the project's own fact).
- Framing quotes are as coded; only `fc-us-dod-mp-natsec` was audited for quotation integrity.
- 15 of 44 folded GC rows have no registry project (programme-level, tax-offset, geoscience, or company-level rows) and cannot be
  followed to physical execution at all.
- Control clauses are only partly placed on stages (18 of 45).
- `--as-of` does not date-slice current financial or physical status (section 1), so these counts describe the analysed revision, not
  an earlier date; a historical reconstruction would need a date-aware status helper that the shared code does not have.

## 10. Reproduction and checks

**Reproduction requires the pinned baseline revision and data.** The tables are reproducible only from a checkout whose
`data/seed` and `lib` equal revision `b4183f8fc68beea7a53496d73d9e04c93d553a69`, which the `git diff --quiet` line below checks. Running
the script on later seed data, including `main` after any data change, is a **new comparison, not a reproduction** of these tables:
its output will differ, and it must go to a new file and be described as a comparison against this baseline. The
historical tables are never regenerated over. From a later `main`, reproduce in a detached worktree of the pinned revision with only
the script copied in:

```bash
git worktree add --detach ../baseline-repro b4183f8fc68beea7a53496d73d9e04c93d553a69
cp scripts/analyze-concern-response.ts ../baseline-repro/scripts/   # the script is read-only; the worktree needs node_modules
cd ../baseline-repro
git diff --quiet b4183f8fc68beea7a53496d73d9e04c93d553a69 -- data/seed lib && echo "pinned data and lib: reproduction"
node --import tsx scripts/analyze-concern-response.ts --as-of 2026-10-03 > /tmp/concern-response-tables-repro.md
cmp /tmp/concern-response-tables-repro.md <path to docs/analysis/concern-response-tables-2026-10-03.md>   # must print nothing
npm run audit:lifecycle   # queue, for cross-checking section 2 of the tables
```

`node --import tsx` is used because the `tsx` CLI could not open its IPC socket in the authoring environment. `--as-of` is required.
The script is read-only, reads no clock and writes only to stdout; the table file is its unedited output, and a second run at the
pinned revision is byte-identical.

Checks: see the PR description for the run results on the final commit. Scoped lint is `npx eslint . --ignore-pattern '.claude/**'`.
Plain `npm run lint` scans nested worktrees under `.claude/worktrees/` and fails there (538 errors and 5,552 warnings, all in those
worktrees, 538 errors in `smpt-antimony-productscope`; none in the main tree). Repository-wide lint configuration was not changed and the
unrelated worktrees were not touched.
