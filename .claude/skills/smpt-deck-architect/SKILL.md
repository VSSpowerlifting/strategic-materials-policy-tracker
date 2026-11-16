---
name: smpt-deck-architect
description: Orchestrate end-to-end creation, redesign, or rigorous production QA of an SMPT research PowerPoint deck. Use for an Applied Strategy, Financial Intelligence, industrial-policy briefing, or research-dossier presentation when the user wants a finished evidence-linked deck, an improved existing deck, or a production plan. Coordinates existing SMPT research skills, the editable exhibit renderer, visual review, and human publication gates. Do not use for unrelated website design, tracker ingestion, or a request to change only one chart renderer.
---

# SMPT Deck Architect

Own the **presentation production workflow**, from a bounded decision question through an editable draft PPTX and inspectable review packet. This is an orchestrator, not a replacement for the eight focused `smpt-*` research skills, the renderer, or human editorial authority.

## Start with repository truth

1. Read `AGENTS.md`, `CLAUDE.md`, `PROJECT_STATE.md` only where relevant, and the product's existing manifest, evidence register, model, review holds and cutoff.
2. Read these governing standards before drafting slides:
   - `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md`
   - `docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md`
   - `docs/design/presentations/SMPT_PRESENTATION_STANDARD_V2.md` (v3 standard; stable filename)
   - `docs/design/presentations/EXHIBIT_AND_CHART_RULES.md`
   - `docs/design/presentations/EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md`
   - `docs/design/presentations/VISUAL_REPERTOIRE_AND_REFERENCES.md`
3. Read [workflow](references/workflow.md) for the deliverable contract and [quality rubric](references/quality-rubric.md) for the review. For a new engagement, fill [deck brief](references/deck-brief.md).

## Choose a mode

- **New deck:** frame the decision and audience, freeze cutoff, build source baseline and any required model, decide options, then write the storyline. No rendering from a vague topic.
- **Redesign existing deck:** pin existing artifacts and research cutoff; distinguish *format-only* work from new analytical claims. Format-only work must preserve values, assumptions, title scope, status terms, sources and conclusions. A substantive change requires a newly approved research version.
- **Production audit:** inspect a pinned deck, manifest, PDF and preview contact sheet; report defects and a bounded revision plan. Do not quietly change the work being reviewed.

## Operating sequence

1. **Brief and holds.** Name the decision-maker (explicitly hypothetical if necessary), user question, audience, product category, publication status, target length, controlling evidence/model, frozen as-of date and material unknowns. Apply the standard's slide budgets: 8 executive, 16 Applied Strategy, 20 Financial Intelligence / dossier maximum; 20 is the absolute deck ceiling including appendix.
2. **Analysis routing.** Use `smpt-engagement-framing` → `smpt-evidence-baseline` → the relevant `smpt-market-competitive`, `smpt-financing-structure`, `smpt-investment-appraisal` and/or `smpt-options-decision` workflows. Do not force a financial model into a nonquantitative briefing. Evidence and model integrity precede deck design.
3. **Story first.** Use `smpt-executive-narrative` to produce an answer-first judgment, a title-only argument, and a slide-spec table. Each important title must resolve to a claim ID, calculation, scenario or labelled judgment. Give each analytical slide one precise question and one principal insight.
4. **Exhibit design.** For every slide, identify the exact comparison/relationship the reader needs, select an original pattern via `npm run exhibits:select -- --question ... --traits ... --items ...`, inspect its data contract and limitations, and provide a table alternative where appropriate. Choose visual form for meaning, not spectacle. Preserve units, date basis, financing/legal status, direct labels, source footers and methodological qualifications. Do not depict speculative causality as a demonstrated dependency.
5. **Build.** Use the current `scripts/exhibit-system/research-deck.ts` research contract; keep real-data specs, images and output outside the synthetic gallery. Reuse tokenized SMPT identity, editable PowerPoint charts/shapes, and the renderer's provenance mechanism. No synthetic fixture may enter research. Favor a real, rights-cleared subject photograph for an optional hero; pin provenance and hash; otherwise use a plainly conceptual original asset or standard cover.
6. **Verify.** Run structural and composition validation, independent numerical reconciliation, editable-object checks, render-to-PDF and a full slide-by-slide visual inspection at presentation and thumbnail sizes. Use [quality rubric](references/quality-rubric.md); record failing slides, not a blanket aesthetic pass. Audit links, source legibility, fonts, accessibility, crop/overflow and title-only coherence.
7. **Handoff.** Apply `smpt-review-gate` as a separate adversarial review. Deliver editable draft PPTX, canonical font-embedded PDF if available, source and calculation register, spec/manifest, contact sheet, reproducibility commands, QC results and a concise decision log. If renderers or fonts are unavailable, report the missing checks; never call the product fully verified.

## Existing renderer commands

```bash
npm ci
npm run exhibits:registry
npm run exhibits:select -- --question rank --traits single-measure --items 7
npm run exhibits:review -- path/to/research-spec.json --strict
npm run exhibits:render -- path/to/research-spec.json path/to/NEW-draft.pptx
python3 scripts/exhibit-system/verify_editability.py --deck path/to/NEW-draft.pptx --manifest path/to/NEW-draft.manifest.json
```

The selector arguments above are **an example**, not the correct choice for every slide. `exhibits:render` refuses to overwrite an existing output and enforces research provenance; inspect the current exhibit-system README before using it. Never claim a PowerPoint manual editing test occurred if only structural/LibreOffice verification ran.

## Non-negotiable boundaries

- Publication authorization, explicit founder/editorial sign-off, GitHub merge and website release are separate steps; this skill cannot grant them. Research renders retain their draft notice.
- Never silently move a research cutoff, change frozen model outputs, import synthetic examples as findings, claim third-party commissioning, or edit `data/seed/` to make a deck.
- The skill may propose renderer features, but any implementation beyond a commissioned deck belongs to a separate scoped engineering phase; protect byte-identical historical fixtures/exports where required.
- Stop at the agreed artifact handoff or a documented blocker. Do not expand into unrelated cleanup, release engineering or follow-on cases.
