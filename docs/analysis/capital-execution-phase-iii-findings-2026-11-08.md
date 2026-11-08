# Capital-to-execution comparison: Phase III research findings and adjudication packets

Status: **decisions recorded 2026-11-08 (see Decision record). P3-02 is in
`data/seed/`; the five milestone rulings await per-check attestation and a cutoff
authorization.** The original framing follows: Every proposal below needs a named
human reviewer. AI research cannot supply `reviewedBy`, `reviewedAt` or
`approvedBy`, so this note records evidence and asks for decisions.

Corpus revision: `site.lastUpdated` = 2026-11-06 (unchanged). Branch:
`claude/smpt-phase-iii-expansion-aa0f03`, from `main` at `688b6108`. Research
date: 2026-11-08. Counts are those pinned in `tests/capital-execution.test.ts`.

## Decision record (2026-11-08)

Benjamin Yang approved all six rulings on 2026-11-08 as substantive editorial
decisions, after reading the original sources. Before that, an AI-assisted
cross-check (Claude, not a human reviewer) had found that the cited passages
support each proposal. What was done with that
approval:

- **P3-02, implemented in seed.** `fin-us-dow-usac-antimony-2026-thompson-falls`
  now carries one `implementationStatusHistory` entry: `construction`, `date`
  null, `sourceId` `src-usac-2026-q2-10q`, with a note naming the issuer as
  the speaker. The financial status, amount, obligation and disbursement
  fields are untouched. Nothing implies the full grant was received.
  Live counts: `executionGaps` 14 → 13, `fundedGaps` 4 → 3, `aheadOfBinding`
  unchanged at 2.
- **P3-02's queue side effect.** The M3.2 Thompson Falls packet now links
  that finance row (`relatedFinanceIds`) and says the status rests on the
  same 10-Q. As a result, its worksheet fingerprint changed to
  `2c911929…7998`. The other six M3.2 fingerprints are unchanged and pinned.
  This change is forced, not incidental. With the P3-02 seed status in place
  and the Thompson row restored exactly as at `ec3bfde`, the M3.2 audit fails
  with "project-native review cannot omit existing matching finance/source
  observations". Keeping the old fingerprint would therefore mean dropping
  P3-02. The 2026-11-08 approval of P3-01 predates this worksheet change, so
  Benjamin Yang still needs to confirm the new Thompson worksheet.
- **P3-01 and P3-03 to P3-06, recorded as local decisions.** The gitignored
  files `.project-execution-review/adjudications.json` (P3-01) and
  `m3-3-adjudications.json` (P3-03 to P3-06) record verdict `approved`,
  `reviewedBy` "Benjamin Yang", `reviewedAt` 2026-11-08, a rationale and the
  current fingerprint. With the checks left `false`, the adjudicator stops at
  the checklist gate. Its later checks therefore did not run on the real files.
  Those checks are the `mil-` ID format, duplicate and live-ID clashes, the
  cutoff, single-row validation and combined validation. A scratch simulation
  ran them on 2026-11-08 without writing back to any file. It used in-memory
  copies with every check set to `true`, a hypothetical 2026-11-08 cutoff and
  the digests recomputed at that cutoff, because the cutoff is part of the
  fingerprint. All six proposals passed. A combined
  `validateProjectMilestones` pass over the two seeded milestones and the six
  proposals also returned no issues. This is a structural result only. It is
  not an attestation.
- **Still blocked from seed.** The five per-check attestations (`fullSourceRead`,
  `quotedPassageMatches`, `scopeIsExplicit`, `eventAndEvidenceDatesSeparated`,
  `noFinancingOrOperationsInference`) were not individually supplied, so they
  stay `false`. The adjudicator therefore blocks every approved row.
  Separately, `reviewedAt` 2026-11-08 postdates the curated cutoff
  (2026-11-06), so moving the cutoff needs its own authorization. No
  `ProjectMilestone` row and no Stillwater source entry has been added.
- **P3-06 deferral.** Stibnite's financing-row implementation dates are
  deferred for separate reconciliation. Neither M3.2 Stibnite packet changes;
  both remain taxonomy blocked. The approved M3.3 workstream rows supersede
  them editorially.

## Why this phase ships no seed change

Phase III's aim was more verified industrial evidence and better project
timelines. The research found three new physical milestones and confirmed
two existing ones. None can be published without a human reviewer:

- A `ProjectMilestone` needs a named `reviewedBy` / `reviewedAt`.
- A new dated `implementationStatusHistory` entry changes what `/response`
  reports as fact, so it needs the same review.
- The M3.2 queue (`research/project-execution/m3-2-source-review-queue.json`)
  is a closed, digest-pinned cohort of seven packets. A trial append of three
  packets broke 91 pinned tests (packet counts, digests, positional indices
  and the F5 corpus row counts). Rewriting those pins to fit unreviewed rows
  would be fixture editing to make a run pass, so the packets live here
  instead.
- Registering the new USA Rare Earth source in `data/seed/sources.json` with
  no linked record would publish unapproved evidence. Its full entry is below
  for copy-paste on approval.

**The phase's success criterion is met only when the reviewer decides the
packets.** Section "Implementation path once approved" lists the mechanical
diff each decision produces.

## Decisions requested

| ID | Project | Decision | Recommendation |
| --- | --- | --- | --- |
| P3-01 | USAC Thompson Falls | Admit milestone (already queued, M3.2) | Admit, null date |
| P3-02 | USAC Thompson Falls | Add a status to the DPA financing row | Reviewer's call; evidence below |
| P3-03 | Marathon | Admit early-works milestone | Admit, null date |
| P3-04 | Nolans | Admit construction milestone; choose date reading | Admit; date reading is the reviewer's |
| P3-05 | USA Rare Earth Stillwater | Admit Phase 1a commissioning milestone; register source | Admit, null date |
| P3-06 | Stibnite | Resolve the two taxonomy-blocked packets; date finance-row status | Reviewer's call |

### P3-01. USAC Thompson Falls milestone

Unchanged from `capital-execution-milestone-adjudication-2026-11-07.md`, which
holds the full packet (Form 10-Q for the quarter ended 30 June 2026, Note 9,
"The Thompson Falls facility expansion was substantially completed",
`construction_progress_reported`, `named_facility`, `occurredOn` null, issuer
as speaker). It is packet `review-m3-2-thompson-falls-q2-expansion` in the
M3.2 queue. Phase III found no later filing that dates it more precisely; the
issuer's Q3 2026 10-Q had not been filed when this research was done.

### P3-02. Thompson Falls financing-row status

`fin-us-dow-usac-antimony-2026-thompson-falls` has no
`implementationStatusHistory`. The 10-Q Note 9 states the issuer applied the
$12.8 million of DPA Title III milestone proceeds collected in April 2026 to
the carrying amount of the expansion PP&E, and that the expansion was
substantially completed late in Q2 2026. If the reviewer accepts an issuer
statement for this field, the row could carry a `construction` entry with
`date` null and `sourceId` `src-usac-2026-q2-10q`, attributed to the issuer in
the note. **Effect:** `executionGaps` 14 → 13 and `fundedGaps` 4 → 3. Without
this decision, Thompson Falls stays in `/response` section 06 even if P3-01 is
admitted.

### P3-03. Marathon early works

- Project `prj-ca-marathon-copper-palladium`. Source
  `src-ca-genm-marathon-construction-2026` (already in seed): Generation
  Mining release of 1 October 2026,
  https://genmining.com/news/2026/generation-mining-commences-construction-at-marath-15486/
- Proposed: `kind` `construction_started`, `scope`
  `bounded_project_workstream`, `scopeAsStated` "early works program at the
  Marathon copper-palladium project", `claimMode` `occurred`, `occurredOn`
  null.
- Statement (English original, `statementEnSource` `na`): "Early works have
  commenced following the posting of the construction phase financial
  assurance under the Project's filed Closure Plan." Locator: opening
  paragraphs.
- Related finance: `fin-ca-cgf-marathon-equity-2026`.
- Caution: issuer statement. It shows early works had begun by 1 October
  2026, not the first day. The program's run through Q4 2026 into 2027 is
  forward-looking and not coded. Early works are a bounded workstream, not
  full mine construction. The Canada Growth Fund row already carries an
  undated construction status from this source; this packet does not date it.

### P3-04. Nolans construction

- Project `prj-au-nolans`. Source `src-au-nolans-construction-2026` (already
  in seed): ministerial media release of 8 October 2026,
  https://www.minister.industry.gov.au/t-ayres/media/construction-starts-arafura-rare-earths-project
- Proposed: `kind` `construction_started`, `scope` `whole_project`,
  `scopeAsStated` null (the validator requires null for `whole_project`),
  `claimMode` `occurred`.
- Statement (English original): "Construction of a globally significant rare
  earths project has now commenced in the heart of the nation." Locator:
  opening sentence.
- Related finance: `fin-au-arafura-nolans-2025-equity`.
- **Date: two readings, reviewer's choice.**

  | Reading | Kind | `occurredOn` | Basis |
  | --- | --- | --- | --- |
  | A (proposed) | `construction_started` | null | "has now commenced" gives no start day |
  | B | `groundbreaking_reported` | 2026-10-08 | The minister's quotation later in the release: "Today's groundbreaking marks an important step" |

- Caution: government statement. It does not establish disbursement of any
  instrument. The equity row already carries an undated construction status
  from this source; this packet does not date it.

### P3-05. USA Rare Earth Stillwater Phase 1a commissioning

- Project `prj-us-usar-stillwater-magnet`. Proposed: `kind`
  `commissioning_started`, `scope` `named_facility`, `scopeAsStated`
  "commercial magnet production line (Phase 1a) at its facility in
  Stillwater, Oklahoma", `claimMode` `occurred`, `occurredOn` null.
- Statement (English original): "today announced the successful commissioning
  of its commercial magnet production line (Phase 1a) at its facility in
  Stillwater, Oklahoma." Locator: GlobeNewswire release of 26 March 2026,
  opening paragraph.
- Related finance: **none.** The release predates the 3 June 2026 CHIPS
  Direct Funding Agreement, so it is not evidence that any CHIPS-funded
  workstream executed, and no CHIPS financing row should gain a status from
  it. Stillwater Magnet therefore stays in section 06 whatever is decided
  here; the milestone adds a dated physical record ahead of binding public
  finance.
- Caution: issuer statement. "Today announced" dates the announcement; the
  reviewer may accept 2026-03-26 as `occurredOn` or keep null. Q2 orders, the
  600 mtpa ramp and Phase 1b are forward-looking and not coded.
- Source entry to add to `data/seed/sources.json` on approval (not yet in
  seed):

  ```json
  {
    "id": "src-usar-stillwater-phase1a-commissioning-2026",
    "title": "USA Rare Earth Achieves Major Operational and Strategic Milestone with Commissioning of Phase 1a Magnet Production at Stillwater Facility",
    "publisher": "USA Rare Earth, Inc. (via GlobeNewswire)",
    "url": "https://www.globenewswire.com/news-release/2026/03/26/3262865/0/en/usa-rare-earth-achieves-major-operational-and-strategic-milestone-with-commissioning-of-phase-1a-magnet-production-at-stillwater-facility.html",
    "language": "en",
    "datePublished": "2026-03-26",
    "dateAccessed": "2026-11-08",
    "sourceType": "other",
    "confidence": "primary",
    "notes": "Issuer release stating that the company \"today announced the successful commissioning of its commercial magnet production line (Phase 1a)\" at Stillwater, Oklahoma. It predates the 3 June 2026 CHIPS Direct Funding Agreement, so it says nothing about any CHIPS-funded workstream. Order, ramp-rate and Phase 1b statements are forward-looking and are not coded. Attributed to the issuer."
  }
  ```

### P3-06. Stibnite timeline

The record already holds both Stibnite physical events as M3.2 packets, each
`taxonomy_blocked`:

| Packet | Date | Source | Block |
| --- | --- | --- | --- |
| `review-m3-2-stibnite-early-works` | 2025-10-21 | `src-perpetua-stibnite-early-works-2025` ("we officially started early works construction today") | `whole_project` could imply full mine construction |
| `review-m3-2-stibnite-burntlog` | 2026-05-30 | `src-perpetua-stibnite-construction-2026` ("On Saturday, May 30, Perpetua commenced additional critical path construction activities") | Site-access infrastructure vs operating facility |

Phase III confirms the sequence: early works from 21 October 2025, funded from
the company's own resources, then critical-path construction from 30 May
2026. The EXIM loan was still not a final commitment in the issuer's August
2026 disclosure, which expects it "later this year". So physical work at
Stibnite began before the EXIM loan became binding; only the DPA award
predates it.

Decisions for the reviewer:

1. Resolve the two taxonomy questions (already open in M3.2).
2. Both `fin-us-dod-perpetua-stibnite-dpa` and
   `fin-us-exim-perpetua-stibnite-2026` carry an undated `construction`
   status citing the May 2026 source. Dating it 2026-05-30 would let the
   timeline show the sequence. Because the EXIM row is not binding, dating its
   status does not move it out of the conditional list. No count changes.

## Implementation path once approved

Each approval produces a known diff. None of it is done in this branch.

1. **Milestones (P3-01, P3-03, P3-04, P3-05).** Add `ProjectMilestone` rows
   with the reviewer's name and date. Thompson Falls flows through M3.2. The
   three new packets need either a new review cohort file (recommended:
   `m3-3-…`, so M3.2's digests stay intact) or a deliberate M3.2 revision.
   A revision means updating, as a reviewed change, the seven-packet
   assertions and digests in `tests/project-execution-review.test.ts` and the
   M3 workbench, handoff, adjudication and fingerprint suites.
2. **Source (P3-05).** Add the entry above. This shifts the F5 corpus pins in
   `tests/f5-corpus-cutoff-impact.test.ts` (`totalPublicSeedRows` 698 / 700 /
   802 and source rows 183 / 189); update them in the same reviewed change.
3. **Capital-execution pins.** In `tests/capital-execution.test.ts`:
   - Reviewed milestones: 2 → 3 per admitted milestone on a project not yet
     in the reviewed tier (up to 2 → 6 if P3-01, P3-03, P3-04 and P3-05 are
     all admitted).
   - P3-02 approved: `executionGaps` 14 → 13, `fundedGaps` 4 → 3.
   - P3-06 dating: no count change.
4. Run `npm run validate`, `lint`, `typecheck`, `test`, `build`,
   `audit:project-execution-pilot` and
   `audit:project-execution-adjudications`.

## Negative findings

No construction-or-later evidence was found for these, so nothing is proposed:

| Project or transition | Finding |
| --- | --- |
| Ucore (Kingston / Louisiana) | Canadian funding remains conditionally approved; no dated conversion to a binding agreement found. |
| MP Materials 10X | No construction notice found for the 10X facility. |
| USA Rare Earth CHIPS projects (Round Top, Stillwater Metal, Magnet Project 2, Metal Project 2) | No construction or commissioning statement after the 3 June 2026 agreement, including in the Q3 2026 disclosures available on 2026-11-08. |
| Mountain Pass samarium | The July vs August 2025 loan-date conflict is unresolved; the samarium scope is still not separated from the February 2022 heavy-rare-earth award. |
| Lofdal | Feasibility-stage work only. |
| 5N St George substrates | Construction is "expected"; forward-looking, and not tied to the award. |

## Remaining research gaps

- Ten projects in section 06 still have no construction-or-later record:
  the five USA Rare Earth CHIPS projects, NORAM, Estelle, Telescope Li-PICK,
  the GGT recycling pilot and Rhyolite Ridge. Stillwater Magnet stays
  on this list even if P3-05 is approved, because a milestone never moves
  the physical axis and its commissioning predates the CHIPS funding. Not all were researched in
  depth this phase; see the table above for those that were.
- Conditional-to-binding transitions (Ucore, Hemerdon / NWF, Donald, the EXIM
  letters of interest, Stibnite's EXIM loan): none was dated in a source by
  2026-11-08. Watch for the dated status change; do not estimate.
- The undated construction statuses on 10X, Keliber and the Kingston
  Demonstration Plant were not dated this phase.
- Thompson Falls: the issuer's Q3 2026 10-Q may confirm full furnace
  operation, which is forward-looking in the August release.
