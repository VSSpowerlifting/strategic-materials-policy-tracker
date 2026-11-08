---
name: smpt-options-decision
description: Turn SMPT evidence and analysis into a decision — a mutually exclusive option set, explicit criteria, an option-by-criterion comparison, a conditional recommendation, triggers that would change it, implementation steps and monitoring indicators. Use when a product must recommend, rank or choose among policy, financing or corporate options, or when a draft's recommendation is unconditional, unranked or untied to evidence.
---

# SMPT options and decision

Converts analysis into a recommendation a decision-maker can act on and audit: what the options are, how they were judged, which wins under which conditions, and what would change the answer. The recommendation is a labelled judgment resting on named evidence, never a finding.

Governing rules: `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md` §2 (mandate: decision, decision-maker, options), §5 Decision value and Governance; the "no synthetic scores" rule in `CLAUDE.md`.

## When to use

- After the baseline and the relevant analysis skills, when the product must recommend.
- When a draft gives a recommendation without alternatives, criteria or conditions.
- When a draft scores options with weighted points that hide the judgment.

## Method

1. **Options.** Three to five options that are mutually exclusive and include "do nothing / continue current course" as a baseline. Each is described concretely enough to be implemented (who does what, with which instrument, by when).
2. **Criteria.** Four to six criteria tied to the decision-maker's stated objective (from the mandate): e.g. supply security at a named stage, fiscal exposure, legal feasibility, time to effect, reversibility, partner alignment. Define each and say what evidence measures it.
3. **Comparison.** Fill `references/decision-matrix-template.md` with categorical assessments (stronger / comparable / weaker, or met / partly / not met) and the evidence ID behind each cell. No weighted numeric total. Where a cell rests on a modeled figure or scenario, label it.
4. **Recommendation.** State the preferred option as a conditional judgment: "Under conditions X and Y, option B is preferred because …; if Z, option C." Name whose judgment it is (draft, author) and the two or three pieces of evidence it rests on most.
5. **Triggers.** List the observable events that would change the recommendation, each with the source to watch and the option it would favour.
6. **Implementation and risks.** Sequence first steps, owners and dependencies; list the main risks with mitigations. Keep it short — this is a research product, not a project plan.
7. **Monitoring.** Three to six indicators (KPIs) that are observable from public sources, with baseline value, source and review date. Do not invent targets the decision-maker has not set.

## Deliverables

- Option set with baseline.
- Criteria definitions.
- Decision matrix with evidence IDs.
- Conditional recommendation with its basis.
- Trigger table, implementation sketch, monitoring indicators.

## Verification

- Options are mutually exclusive and include the baseline.
- Every matrix cell cites evidence or is marked judgment; no composite score.
- The recommendation states its conditions and at least one trigger that would reverse it.
- No recommendation depends on a figure the baseline marks unresolved.
- Run `references/decision-checklist.md`.

## Completion

Complete when the decision-maker can see why the preferred option beats each alternative on the stated criteria, what would make them choose differently, and how they will know.

## Boundaries

- Not investment advice: no buy/sell/hold on securities, no price targets.
- A recommendation is a draft judgment until human approval; never describe it as SMPT's approved position.
- Do not recommend changes to the tracker taxonomy or records; those go to the maintainer separately.
