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
  `operations_started`. `funded_activity_completed` would imply the federal
  award paid for these assets, which the source does not state. No new label
  is proposed.
- `claimMode`: `occurred`. `scope`: `named_facility`, with `scopeAsStated`
  taken from the filing's own wording. The speaker is the issuer, United
  States Antimony Corporation, not a government; say so in `note`.
- `occurredOn`: **null.** The filing says "late in the second quarter of 2026"
  and gives no day. The schema needs a full date and forbids substituting the
  filing date.
- Primary source: the Form 10-Q for the quarter ended 30 June 2026, Note 9:
  https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/R15.htm
  The candidate statement says the expansion was "substantially completed" and
  that $4.1 million of the related assets were placed in service late in Q2
  2026.
- Corroboration:
  - The issuer release of 11 August 2026 says the expansion was "substantially
    completed":
    https://www.sec.gov/Archives/edgar/data/101538/000110465926094130/tm2622899d1_ex99-1.htm
  - The release of 14 May 2026 says the expansion was "nearing completion":
    https://www.sec.gov/Archives/edgar/data/101538/000110465926061217/tm2614673d1_ex99-1.htm
- Limits:
  - Full operation of all furnaces is forward-looking in the August release.
    Do not code it.
  - The milestone shows the issuer's own physical progress. It does not show
    that the Department of War award paid for those assets.

**Verification caveat.** The excerpts above reached this note through a
research agent's fetch summary. They have **not** been checked character by
character. Before admission, the reviewer (or a `source-verifier` pass) must
open the 10-Q note and confirm the exact sentence, the locator and the
$4.1 million figure.

**Recommendation: admit.** Do so after the verbatim check, with a null date
and the issuer named as speaker. Effect: Thompson Falls moves from the
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
