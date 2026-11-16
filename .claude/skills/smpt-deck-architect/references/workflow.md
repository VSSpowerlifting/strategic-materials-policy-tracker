# Deck production workflow and handoff contract

Use this reference when producing a new or revised SMPT deck. Reuse existing product-folder conventions; do not invent a new top-level directory or alter a published edition.

| Stage | Artifact | Required exit check |
| --- | --- | --- |
| D0 · Scope | Deck brief with audience, decision, cutoff, status, product class and slide budget | Question changes an action or explicitly says the product is explanatory |
| D1 · Evidence | Source register and claim-to-source/status matrix; uncertainty and conflicts logged | Material figures trace to primary locators; no unearned policy → capital → execution → commercial causal links |
| D2 · Economics | Controlling model or explicit N/A, scenario assumptions and independent recalculation | Every derived/modelled headline figure reproducible and units/bases compatible |
| D3 · Argument | One-paragraph executive judgment, title-only storyline, slide specifications | The title sequence gives the answer; claims have evidence IDs; length cap satisfied |
| D4 · Design | Question → pattern → data contract → sketch/slide spec; cover provenance if applicable | Chart selection is defensible and varied; source/legal-status semantics survive design |
| D5 · Production | New immutable spec, editable draft PPTX, generated manifest, PDF and contact sheet if tooling available | Composition holds absent; render and slide-by-slide inspection completed or limitations logged |
| D6 · Challenge | Independent QA/review record, reconciliations, change log and unresolved holds | Max state: READY FOR HUMAN PUBLICATION REVIEW, never publication approval |

## Slide spec fields

Capture the following in the product's slide-spec table. These fields are a **planning contract**; they are not a replacement schema for `research-deck.ts`.

- `slide_id`, order, intended reader and decision relevance.
- One affirmative assertion headline; `claim_ids`, `evidence_class` (reported / derived / modeled / judgment).
- The reader's specific comparison, mechanism, or relationship; why the exhibit improves comprehension.
- Exhibit family / candidate pattern / rejected alternative and reason; `table_reason` when necessary.
- Data source and exact cells or field IDs; unit, denominator, population, currency, valuation basis and as-of window.
- Figure status where material: announced / selected / committed / drawn / spent / produced / shipped / invoiced / collected.
- Most important uncertainty and required on-slide qualifier; visual interpretation and source footer.
- Visual-layout risks, image rights/provenance, final QA result and reviewer note.

## Research spec and source constraints

The production parser currently expects a top-level object with `classification: "research"`, `title`, `evidence` and `slides`. Each evidence item carries `id`, `url`, `title` and `locator`. Each slide has a registered `pattern` and `exhibit` with `title`, `subtitle`, `annotation`, `source`, `evidence_refs` and renderer-specific `data`. The spec may include `cover_lines` or a source/rights-controlled `cover`, but not both. Consult `docs/design/presentations/exhibit-system/README.md` and `scripts/exhibit-system/research-deck.ts` for the authoritative, changing schema.

Real-data specs and deliverables must live outside `docs/design/presentations/exhibit-system/`, `app/` and `public/`. Keep superseded versions rather than overwriting them. If an exhibit is unsupported by the current registry, document the gap and either use an honest existing pattern or open a **separate** engineering change; do not draw a misleading approximation.

## Finished handoff

Provide links/paths and hashes for available PPTX, PDF, spec and manifest; model or worksheet version; source register; a contact sheet; review record with individual slide findings; exact validation commands/results; all checks not run; and the list of matters awaiting author/founder sign-off. Distinguish `BUILD PASSED`, `VISUAL REVIEW COMPLETED`, and `PUBLICATION APPROVED` — these are different claims.
