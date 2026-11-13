---
name: smpt-executive-narrative
description: Build the answer-first storyline for an SMPT Applied Strategy or Financial Intelligence product — an executive judgment, a headline-only sequence of assertion titles, a slide-spec table that ties each claim to its evidence class and exhibit, and an executive summary. Use before rendering any deck or memo, when a draft's titles are topic labels rather than findings, when the deck exceeds its length budget, or when exhibits were chosen before the claims they must support.
---

# SMPT executive narrative

Turns accepted analysis into an argument a reader can follow from the titles alone. It sequences claims; it does not create them. Every title must already be supported in the evidence baseline, model or decision record.

Governing rules (read them; this skill does not restate them): `docs/design/presentations/SMPT_PRESENTATION_STANDARD_V2.md` §1–2 and §7, `docs/design/presentations/EXHIBIT_AND_CHART_RULES.md`, `docs/design/presentations/VISUAL_REPERTOIRE_AND_REFERENCES.md`, `docs/design/presentations/EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md` §1–4, and `docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md`.

## When to use

- After the baseline, analysis and (where required) decision record exist.
- Before any slide is rendered or any chart is designed.
- When a draft reads as a list of topics, repeats findings, or overruns its length budget.

## Method

1. **Inputs.** Confirm the input contract (Editorial Authenticity §4): question and audience, accepted source register and cutoff, controlling model and its check results, publication status and rights. Missing input → record it; do not draft around it.
2. **Executive judgment.** Write the answer in three to five sentences: the supported answer, the two or three decisive facts (with claim IDs), and the decision implication. Mark which parts are evidence, calculation, scenario and judgment.
3. **Headline sequence.** Draft assertion titles in order using the narrative architecture in Presentation Standard §2. Each title is a complete claim, one per slide. Read them alone: they must form a defensible argument.
4. **Budget.** Fit the product's length budget (Presentation Standard §1). Cut duplicated or low-value slides before compressing content; move long methods to the appendix or workbook.
5. **Slide specs.** For each analytical slide fill `references/slide-spec-template.md`: claim, evidence class, the comparison the exhibit must expose, exhibit family, data path, units and date basis, mechanism sentence, caveat, rights note. Choose exhibit families for the question (timing, change, state, composition, comparison) per the exhibit rules and visual repertoire; keep tables where precise comparison needs them.
6. **Language pass.** Apply the editorial voice: affirmative, specific, attributed. Keep necessary factual negations and status distinctions. Run `references/storyline-checklist.md`.
7. **Handoff.** Pass the storyline and specs to rendering, then to `smpt-review-gate`.

## Deliverables

- Executive judgment paragraph with claim IDs.
- Ordered headline list that passes a title-only read.
- Slide-spec table for every analytical slide.
- Note of anything cut, moved to appendix, or blocked by missing inputs.

## Verification

- Every title maps to a claim ID, calculation ID, scenario or labelled judgment.
- No title states more certainty, causality or status than its evidence supports.
- Slide count within budget, counting cover, dividers and appendix.
- Each modeled or scenario figure is labelled as such in title, exhibit or footnote.
- Run `references/storyline-checklist.md`.

## Completion

Complete when a reader of the titles alone gets the answer and its basis, and every analytical slide has a spec tracing its claim to evidence and its exhibit to data.

## Boundaries

- Does not render decks, design visuals or alter research conclusions, frozen models or published products; format-only revisions keep the research cutoff unchanged.
- For the rendering handoff, link the [Publication Design System](../../../docs/design/PUBLICATION_DESIGN_SYSTEM.md) for current type roles, cover imagery and export checks.
- Ends at handoff to `smpt-review-gate`; it never declares publication readiness.
