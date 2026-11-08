---
name: smpt-engagement-framing
description: Frame an SMPT Applied Strategy or Financial Intelligence engagement before any analysis — name the decision-maker and decision, freeze the evidence cutoff, build a MECE issue tree with falsifiable hypotheses, and route work to the other smpt-* skills. Use when starting a new strategy deck, decision memo, model or case study, when a brief names a topic rather than a decision, or when an existing engagement has lost its question.
---

# SMPT engagement framing

The entry point and router for SMPT strategy work. It turns a topic ("JPMorgan and MP Materials") into a decision ("Should a strategic offtaker take a minority stake before the 10X facility reaches commissioning?") and a work plan that the other `smpt-*` skills execute.

Governing standard: `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md` §1–2. Read it first; this skill applies it and does not replace it.

## When to use

- A new Applied Strategy or Financial Intelligence product (deck, memo, model, case note).
- A brief that names a company, transaction or material but no decision.
- Mid-engagement, when slides answer different questions or a model has no stated output.

Do **not** use for tracker data work (records, candidates, classifications). That is `ben-smpt-review` and the candidate workflow in `data/candidates/README.md`.

## Method

1. **Mandate (the six parts of §2).** Fill `references/mandate-template.md`: decision-maker (real, or an explicitly labelled hypothetical perspective), decision, horizon, alternatives, constraints, evidence cutoff, economic mechanism and the outcome measure. State that no organization commissioned or endorsed the work.
2. **Decision test.** The question must be answerable "yes / no / which / when / how much", and the answer must change what someone does. Rewrite topic questions until it passes. Record rejected framings and why.
3. **Cutoff and holds.** Freeze an as-of date. Check `PROJECT_STATE.md` and the product folder for an existing cutoff, publication hold or frozen model, and inherit it; never silently move a frozen cutoff.
4. **Issue tree.** Decompose the decision into 3–5 branches whose analytical questions are mutually exclusive and collectively exhaustive *for this decision*. MECE applies to the questions, not the evidence, so one source may inform several branches. Prefer the four-layer chain (policy → capital → execution → commercial) as the first cut when the mechanism runs through government action; otherwise use the decision's own economics (value drivers, options, risks). Each leaf is a question with a named evidence type.
5. **Hypotheses.** For each branch write a hypothesis that could be wrong, the evidence that would refute it, and the competing explanation. A hypothesis is a test plan, not a conclusion; do not draft headlines from it.
6. **Analysis plan and routing.** For each leaf assign one owning skill and its deliverable (table below). Mark leaves deliberately left out and why, so the gap shows later as a limitation rather than an omission.
7. **Scale check.** Choose the lightest product that answers the decision (memo, short deck, deck + workbook). A workbook is justified only when the recommendation depends materially on quantitative economics (§2.4, §4).

## Routing

| Need | Skill |
| --- | --- |
| Source register, four-layer map, fact/assumption split, status ladder | `smpt-evidence-baseline` |
| Market size, industry economics, competitive response | `smpt-market-competitive` |
| Capital structure, liquidity, covenants, financing stages, bridges | `smpt-financing-structure` |
| Returns, thresholds, sensitivities, scenarios | `smpt-investment-appraisal` |
| Options, criteria, recommendation, triggers, KPIs | `smpt-options-decision` |
| Memo or deck storyline and exhibits | `smpt-executive-narrative` |
| Pre-publication gates | `smpt-review-gate` |

Run `smpt-evidence-baseline` before any skill that calculates.

## Deliverables

- Completed mandate (`references/mandate-template.md`).
- Issue tree with hypotheses and refutation tests (`references/issue-tree-template.md`).
- Analysis plan: leaf → skill → deliverable → status.

## Verification

- Every leaf maps to the decision; no leaf only "provides context".
- No analytical question sits in two branches, and the branches together cover the decision. One source may inform several branches.
- Each hypothesis names the evidence that would refute it.
- The cutoff, holds and frozen inputs found in the repo are stated, with file paths.

## Completion

Framing is complete when someone else could read the mandate and plan and know what will be concluded *about*, what evidence would decide it, and which skill produces each piece. It is not complete when it merely lists topics.

## Boundaries

- Do not imply a real organization commissioned the work or endorses its output.
- Framing produces questions and test plans, never findings.
- Do not reopen a published or held product's conclusions; open a new version with its own mandate.
- Product files belong in the product folder named by the brief (e.g. `docs/research/<product>/` or `research/<id>/`), never in `data/seed/`.
