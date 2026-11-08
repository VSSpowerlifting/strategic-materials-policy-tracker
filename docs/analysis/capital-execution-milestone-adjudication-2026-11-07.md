# Project milestone adjudication request: funded execution gaps

Status: **draft for human review. Nothing here is in `data/seed/` or
`data/candidates/`.** A published `ProjectMilestone` needs a named human
`reviewedBy` / `reviewedAt`. AI research cannot supply either, so this note
asks for a decision and does not record a milestone.

Scope: the four projects that `/response` section 06 lists as having a
disbursement recorded but no construction-or-later record (revision 2026-11-06).
These are Lofdal, Mountain Pass samarium, 5N St George germanium substrates and
USAC Thompson Falls.

## Decision requested

**USAC Thompson Falls expansion (`prj-us-usac-thompson-falls-expansion`).**
Should a project milestone be admitted?

- Proposed `kind`: `construction_progress_reported`. The filing says the
  expansion was "substantially completed", which falls short of
  `operations_started`. No new label is proposed.
- Alternative for the reviewer: `funded_activity_completed` with scope
  `funded_activity`. The filing does link the award to these assets (see
  "What the filing says about the award" below), so the link itself is not
  the obstacle. The obstacle is completion. The award's performance period
  runs through 4 January 2028, $14.2 million of the award was not yet
  recognized at 30 June 2026, and the remaining $10.8 million is subject to
  future authorization. "Substantially completed" describes the facility
  expansion, not the end of the funded activity. **Recommendation:** keep
  `construction_progress_reported`.
- `claimMode`: `occurred`. `scope`: `named_facility`, with `scopeAsStated`
  taken from the filing's own wording. The speaker is the issuer, United
  States Antimony Corporation, not a government; say so in `note`.
- `occurredOn`: **null.** The filing says "late in the second quarter of 2026"
  and gives no day. The schema needs a full date and forbids substituting the
  filing date.
- Primary source: the Form 10-Q for the quarter ended 30 June 2026, Note 9:
  https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/R15.htm
  Candidate statement, checked against the filing text on 2026-11-07: "The
  Thompson Falls facility expansion was substantially completed and $4.1
  million of the related assets were placed in service late in the second
  quarter of 2026."
- Corroboration:
  - The issuer release of 11 August 2026 says the company "substantially
    completed the Thompson Falls, Montana expansion":
    https://www.sec.gov/Archives/edgar/data/101538/000110465926094130/tm2622899d1_ex99-1.htm
  - The release of 14 May 2026 says the smelter expansion "is nearing
    completion":
    https://www.sec.gov/Archives/edgar/data/101538/000110465926061217/tm2614673d1_ex99-1.htm

**What the filing says about the award.** Note 9 records a $27.0 million
Defense Production Act Title III grant from March 2026. $16.2 million is
obligated, and the remaining $10.8 million is subject to future authorization.
On 25 March 2026 the Defense Industrial Base Consortium approved three
milestones worth $12.8 million, which the company collected in April 2026. The
company recognized those proceeds as a reduction of the carrying amount of the
PP&E associated with the Thompson Falls expansion. The 11 August release says
the expansion "was partially funded by" that payment. These are the issuer's
statements of its own accounting and contract facts. They are admissible for
those facts, attributed to the issuer, and they belong on the financing row's
evidence, not in the milestone.

- Limits:
  - Full operation of all furnaces is forward-looking in the August release
    (expected in the third quarter of 2026). Do not code it.
  - The milestone records physical progress as the issuer reports it. Partial
    grant funding of the expansion is a financing fact, and it does not make
    the facility's completion a government outcome.

**Recommendation: admit** as `construction_progress_reported`, with a null
date and the issuer named as speaker. Effect: Thompson Falls moves from the
financing-row tier to the reviewed-milestone tier, and its project page shows
the milestone. It stays in section 06, because milestones never move the
matrix's physical axis. Leaving section 06 needs a sourced implementation-status
entry on the financing row itself, which is a separate decision for the same
reviewer.

## No milestone proposed (negative findings)

| Project | What the record shows | Why nothing is proposed |
| --- | --- | --- |
| Lofdal (`prj-na-lofdal`) | NCMI releases of 20 Jul 2026 and 13 Oct 2026 describe feasibility-stage work. JOGMEC's role is a JV earn-in. | No construction or commissioning statement exists. Feasibility is already what the record shows. |
| Mountain Pass samarium (`prj-us-mountain-pass-samarium`) | Heavy-rare-earth separation work at Mountain Pass is tied to the separate February 2022 award of $35.0 million. Loan-date sources conflict (July vs August 2025). | No dated milestone has been found for the samarium scope itself. The 10-Q MD&A commissioning language has not been read in full. Resolve the scope and the date conflict first. |
| 5N St George substrates (`prj-us-5n-st-george-germanium-substrates`) | A September 2026 expansion item says construction is "expected" in Q3 2026. A conference poster is a lead only. | Nothing ties that expansion to the $14.4 million award. "Expected" is a forward-looking statement, not an observed milestone. |

## What this does not change

Release of the Phase II comparison does not depend on this decision. The page
already presents these four projects as research gaps, not stalls. If the
Thompson Falls milestone is admitted later, the live-corpus test in
`tests/capital-execution.test.ts` needs `reviewed_milestone` 2 → 3. If the
financing row also gains a construction-stage status, `executionGaps` falls
14 → 13 and `fundedGaps` 4 → 3.
