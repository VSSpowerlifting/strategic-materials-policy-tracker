---
name: smpt-evidence-baseline
description: Build the evidence baseline for an SMPT strategy product — a source register frozen at a cutoff, a claim-to-source matrix, a four-layer map with hypothesised links, and a status ladder that keeps announcement, authorization, commitment, drawdown, expenditure and operation apart. Use after framing and before any calculation, when a figure's status (envelope, signed, drawn, paid, capacity, output) is unclear, or when a draft mixes facts, assumptions and judgments.
---

# SMPT evidence baseline

Turns a framed question into an inspectable evidence base: what is known, from whom, as of when, and in what status. Every later skill draws its inputs from this baseline, and nothing is calculated from a figure whose status is unresolved.

Governing rules: `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md` §1, §2.3, §4 ("state and verify whether inputs describe…") and §5 Evidence; the source rules and Capital & Control rules in `CLAUDE.md`; status ladder in `docs/design/presentations/EXHIBIT_AND_CHART_RULES.md`.

## When to use

- Immediately after `smpt-engagement-framing`, before any arithmetic.
- When an amount could be an envelope, a ceiling, a signed commitment, a drawdown or a payment and the draft does not say which.
- When a draft states a causal link between a policy and a company action.

For verifying an individual claim against its primary in depth, use `ben-source-verify` (or the `source-verifier` agent for independent context). This skill builds the register and map; it does not replace reading the complete original.

## Method

1. **Register.** One row per source in `references/source-register-template.md`: stable ID, issuer, title, document type, publication date, as-of/effective date, locator (URL plus page, section or table), access date and tier (primary official, binding filing, issuer disclosure, secondary). Record the cutoff; anything later is out of scope or explicitly flagged as post-cutoff.
2. **Claims.** List each material claim and figure with its source ID, exact locator and evidence class: **reported** (stated in source), **derived** (arithmetic on reported values, with formula), **modeled** (depends on an analyst assumption), **judgment** (interpretation). Never upgrade a class.
3. **Status ladder.** For every money, capacity or legal figure, place it on its own dimension using `references/status-ladder.md`. Keep amount roles apart (ceiling, committed, drawn, disbursed, spent) and legal states apart (announced, proposed, adopted, effective, implemented). One figure carries one status at one date.
4. **Four-layer map.** Map evidence to policy, capital, execution and commercial layers. Draw each link between layers as a hypothesis with mechanism, timing, the evidence for and against, and a competing explanation. A shared date or material is not a link.
5. **Reconcile.** Where two sources disagree (dates, amounts, units, entity names), record both, the reason and the adopted value. Check identity: the same entity under aliases, parent versus subsidiary, borrower versus guarantor.
6. **Gaps.** List what the decision needs but the evidence cannot show. Gaps become limitations or diligence items, never filled by inference.

## Deliverables

- Source register and cutoff statement.
- Claim-to-source matrix with evidence class.
- Status table for every amount, capacity and legal status used downstream.
- Four-layer map with link hypotheses and gaps.

## Verification

Run `references/baseline-checklist.md`. At minimum: every figure has a locator and a status; no link between layers is stated as fact; currencies are original; issuer statements are attributed to the issuer; tracker records quoted are cited by their IDs and not rewritten.

## Completion

The baseline is complete when an independent reviewer could trace each figure in a later exhibit to a locator and status without asking the author, and the gaps list says what is unknown.

## Boundaries

- Read-only toward the tracker: never edit `data/seed/*` or create candidates from a strategy product. A new fact that belongs in the tracker goes through `data/candidates/README.md` separately.
- Do not convert currency in the baseline. A normalized illustration, if needed, is built later with its sourced rate and labelled as analysis (§4).
- Compressed or summarized text (Headroom, search snippets) is never the locator for a quotation, date, figure or legal status.
- Unknown is recorded as unknown, never as zero or "not applicable".
