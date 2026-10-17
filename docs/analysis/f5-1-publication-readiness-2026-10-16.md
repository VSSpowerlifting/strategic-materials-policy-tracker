# F5-1 publication-readiness assessment (2026-10-16)

**Verdict: nothing is publishable.** `data/seed/project-milestones.json` stays `[]`.
This PR adds unsigned research, a fail-closed builder and tests. It records no review,
no approval and no milestone, and it does not move `site.lastUpdated`, which stays at
2026-10-09.

| Pilot | Disposition | Gate | What it takes to publish |
| --- | --- | --- | --- |
| Wagerup (`review-m3-2-alcoa-wagerup`) | Conditionally supportable with a specified caveat | `human_source_review` | A named reviewer chooses between `construction_started` and `groundbreaking_reported`, attests all five checks against digest `90e16522…`, and the cutoff advance is approved |
| Narva (`review-m3-2-neo-narva-magnets`) | Awaiting human review | `human_source_review` | A named reviewer confirms an undated `production_reported` state that is kept apart from the full commercial ramp, and the cutoff advance is approved |
| Stibnite early works (`review-m3-2-stibnite-early-works`) | Taxonomy blocked | `taxonomy_blocked` | A maintainer taxonomy decision, then a separate scope-correcting PR, then human review and the cutoff advance |
| Stibnite Burntlog (`review-m3-2-stibnite-burntlog`) | Taxonomy blocked | `taxonomy_blocked` | As for early works |

## Gates that hold for every pilot

1. **Human adjudication.** `adjudicateProjectExecutionReview` refuses pending decisions
   presented as complete. It also refuses unnamed reviewers, stale or missing worksheet
   digests, duplicate decisions and out-of-order decisions. The reviewer CLI
   (`npm run audit:project-execution-adjudications`) now also refuses machine or
   placeholder reviewer names, and duplicate reviewer identities that differ only in
   case, spacing or Unicode form, so one person cannot appear as two independent
   reviewers.
2. **Corpus cutoff.** Any real review is dated after 2026-10-09, so the adjudicator
   returns the cutoff blocker. Clearing it requires a separately authorized
   `site.lastUpdated` revision. Backdating a review is not an option.
3. **Source registration.** Only the canonical source of each case is registered.
   Before any unregistered corroborating lead (the ministerial, JOGMEC, Neo Q2/opening
   and Perpetua 8-K/PDF leads) could be cited, it would need authorized curation into
   `data/seed/sources.json`. This PR does not touch that file.
4. **Taxonomy.** `named_infrastructure` is not a canonical scope. See the decision
   request in `f5-1-stibnite-dossier-2026-10-16.md`. It is not implemented here.

## What the evidence already supports, without publication

- One dated physical event at Wagerup on 2026-08-24, corroborated by the issuer and the
  Australian government. The three financing rows do not multiply it.
- Neo's Narva facility was reported to be in commercial production by 2026-09-14. The
  start day is unknown.
- At Stibnite there were three distinct dated steps in 2025 (approval, financial
  assurance and the early-works start), and a later Burntlog start on 2026-05-30. Full
  construction and 2029 operations are still targets.

## Contradicted readings this work prevents

- Treating up to 10% of world gallium supply as an outcome.
- Treating Neo's 2,000 t/yr figure as output.
- Treating the JTF, EXIM or DPA financing as causing, or being drawn for, any physical
  event.
- Treating Burntlog as the first Stibnite construction, or as the start of full mine
  construction.

## /response financing semantics

The cells are unchanged. Alcoa stays `binding_not_evidenced` / `not_yet_binding`, and Neo
and Stibnite stay `binding` / `binding`. All three remain `construction_or_later` with a
financing basis. The new tests pin these values (§7 test 12).
