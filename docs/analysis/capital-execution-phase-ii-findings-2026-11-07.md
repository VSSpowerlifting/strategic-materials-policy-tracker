# Capital-to-execution comparison: Phase II findings

Corpus revision: `site.lastUpdated` = 2026-11-06. Branch:
`claude/smpt-phase-ii-expansion-75868a`. Every count below is computed by
`buildCapitalExecution` (`lib/capital-execution.ts`). That function sits on top of
`buildIndustrialResponse` and never re-classifies its rows. The live-corpus
assertions in `tests/capital-execution.test.ts` pin these counts. No money figure
in this note is a sum; amounts appear as each source states them.

## What shipped

- **`lib/capital-execution.ts`**, a derivation module with no money arithmetic:
  - It deduplicates physical observations by (source, status, date). Several
    financing rows that cite one physical observation now show it once.
  - It assigns each project one evidence tier: a human-reviewed project
    milestone, a usable status on a financing row, or none.
  - It lists every directly linked government commitment that is not binding as
    of the revision. The list is grouped by the recorded `FINANCIAL_STATUSES`
    value, and each row keeps its source note and names any package it is
    `part_of`.
  - It lists execution gaps: binding or disbursed finance with no
    construction-or-later record.
  - It lists projects whose physical progress was reported before any binding
    public instrument.
- **`/response`, sections 04–06:**
  - 04: physical evidence quality.
  - 05: conditional commitments by financing stage.
  - 06: binding finance with no construction record.

  The page's interpretation section moves to 07. Sections 01–03 (the matrix,
  material view and register) are unchanged.
- **No taxonomy, schema or seed changes, and no new labels.**

## Findings

### 1. Where finance and physical progress both stand on record

| Item | Count |
| --- | --- |
| Government-backed projects (direct links only) | 49 |
| Projects with at least one binding government instrument | 25 |
| Projects with disbursement recorded | 10 |

The binding-finance × construction-or-later cell holds **11 projects**:

- 10X Facility
- INL antimony pilot: operational on 2026-07-29
- Keliber
- Kingston Centre of Excellence: construction on 2026-01-20
- Kingston Demonstration Plant: completed, no date stated
- Marathon
- Matawinie: construction on 2026-04-13
- Neo Performance's Estonia magnet plant: operational on 2026-09-14
- Nolans
- Stibnite
- Thacker Pass Phase 1 processing: construction on 2026-06-30

Only **Neo Estonia** is supported by a human-reviewed project milestone. The
other ten rest on implementation statuses carried on financing rows, and six of
those statuses are undated (10X, Keliber, Kingston Demonstration Plant,
Marathon, Nolans, Stibnite).

**Implication:** the claim that finance became physical progress rests mostly on
the financing record's own status field. It does not rest on independent project
milestones. The milestone register is the binding constraint on stronger
claims.

### 2. Physical progress ahead of binding public finance

Two projects report construction or commissioning while no recorded government
instrument is binding:

- **Alcoa-Sojitz gallium.** Groundbreaking was reported on 2026-08-24 and is a
  reviewed milestone. The Australian equity, Australian offtake and US equity
  rows were all only announced on 2025-10-20.
- **GGT / Regolith battery-grade graphite.** Commissioning was reported on
  2026-08-11. The NRCan Energy Innovation Program funding was announced on
  2026-03-03.

**Implication:** in these cases private or sponsor capital moved first. This
does not show that the public commitment was irrelevant, since announcement
effects are not observable here. It does mean physical progress cannot be
attributed to disbursed public money.

### 3. Conditional commitments

There are **35** non-binding, directly linked government rows across **27**
projects: **19 announced** and **16 decided**. **3** of these rows sit on
projects that also hold a binding instrument. The conditional set clusters in:

- **Canadian programme awards.** Many come from the 2026-03-03 and 2025-10-31
  NRCan and NRC releases, and are often stated as "conditionally approved".
- **JOGMEC subsidy decisions.** These cover Shin-Etsu, Santoku, Allied Material
  and Japan New Metals, stated in 億円.
- **2026 credit and equity announcements.** These include the EXIM letters of
  interest (5E Boron, Kellyton), the UK National Wealth Fund's Hemerdon /
  Tungsten West package, and Donald (Export Finance Australia and the National
  Reconstruction Fund).

**Packages are shown with their components and never added together:**

- Alcoa-Sojitz equity is `part_of` the US-Australia framework financing.
- Tungsten West equity and lending are `part_of` the NWF package.
- USAC Alaska is `part_of` the Department of War antimony award.
- The Ucore FedDev and NRCan rows are `part_of` the up to $36.3 million Canada
  package.

**Implication:** a large share of the 2026 public-finance record is still a
statement of intent. Readers should treat the 35 rows as the pipeline, not as
capital in place.

### 4. Binding finance with no construction record (14 projects; 4 with disbursement)

The four projects with disbursement recorded are:

- Lofdal
- Mountain Pass samarium
- 5N St George germanium substrates
- USAC Thompson Falls

The other ten:

- **Five USA Rare Earth projects** under CHIPS awards contracted on 2026-06-03:
  Round Top, Stillwater Magnet, Stillwater Metal, Magnet Project 2 and Metal
  Project 2.
- NORAM lithium electrolysis
- Estelle antimony
- Telescope Li-PICK
- GGT graphite recycling pilot
- Rhyolite Ridge processing

A missing entry is a research gap, not evidence of a stall. The page says so.

### 5. Dependencies

- **Evidence dependency.** Stronger execution claims need reviewed milestones.
  The register holds two. Every new milestone requires a named human reviewer;
  see the adjudication note.
- **Financing dependency.** Several packages turn binding only through later
  agreements: EXIM final commitments, the NWF transaction close, Ucore's
  conditional approval and the Alcoa-Sojitz definitive agreements. Each is a
  dated status change to watch, not a figure to estimate.
- **Issuer-disclosure dependency.** For several US gaps, the only near-term
  physical evidence will be issuer filings. These are admissible for the facts
  they state directly. They must stay attributed to the issuer, never to the
  government.

## Follow-on research (ranked by analytical value)

1. **USAC Thompson Falls.** A milestone is ready for adjudication; see
   `capital-execution-milestone-adjudication-2026-11-07.md`. If approved, the
   reviewed-milestone tier grows from 2 to 3. The project leaves the funded-gap
   list only if its financing row also gains a sourced construction-stage
   status.
2. **USA Rare Earth CHIPS projects (5).** Look for construction notices or
   10-Q statements on Stillwater and Round Top.
3. **Undated construction statuses.** These are 10X, Keliber, Nolans, Stibnite,
   Marathon and the Kingston Demonstration Plant. Dating them would let the
   timeline compare finance and execution sequences.
4. **Conditional-to-binding transitions.** The candidates are Ucore, Hemerdon,
   Donald and the EXIM letters of interest. Record each status change only when
   a source dates it.
5. **Mountain Pass samarium.** Separate the samarium scope from the February 2022
   heavy-rare-earth award. Resolve the conflicting loan dates (July vs August
   2025) against the primary source before coding anything.

## Limitations

- The comparison uses direct project links only. **17** government financing
  rows carry no project, and **8** `associatedProjectIds` links are deliberately
  non-allocative.
- Coverage is selective and uneven across jurisdictions. A cell count is not a
  measure of a jurisdiction's industrial performance.
- Shared dates, materials or sponsors do not establish causality between finance
  and physical progress.
