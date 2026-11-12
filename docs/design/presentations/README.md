# SMPT presentation system — version 3.0

**Status:** Adopted editorial design standard for new SMPT decks, 5 November 2026; visual repertoire extended 6 November 2026; identity aligned with the Architectural Research Studio 11 November 2026 (proposed v3, pending maintainer approval)
**Owner:** SMPT editorial/research lead  
**Scope:** Executive briefings, applied-strategy cases, financial-intelligence cases, and visual research dossiers  
**Typefaces:** Spectral for covers, section dividers and large editorial statements; Archivo for analytical titles, text, tables, chart labels and source footers. Colours and faces come from [`../publication-tokens.json`](../publication-tokens.json). PowerPoint cannot embed fonts, so the font-embedded PDF is the canonical form; preserve native editable charts and source hyperlinks in the `.pptx`.

**Hard ceiling:** **20 slides total**, including title, executive summary, conclusion, methods, references, and appendix. No exceptions by renaming a section "backup."

SMPT publishes independently authored, source-linked industrial-policy and financial research. This system translates the analysis into readable, defensible, editable PowerPoint presentations. It borrows **principles** of disciplined consulting communication, not another firm's branding or proprietary slide designs.

## Read in this order

0. [Publication Design System](../PUBLICATION_DESIGN_SYSTEM.md) — how the shared tokens apply to decks, memos, covers, social images and exhibits, and which generators are migrated.
1. [Presentation Standard v3](SMPT_PRESENTATION_STANDARD_V2.md) — definitive governance, type, palette, slide structures, length budgets, editorial and QA rules (file name kept for link stability).
2. [Exhibits and Chart Rules](EXHIBIT_AND_CHART_RULES.md) — chart selection, scales, status encodings, sensitivity reconciliation and source methods.
3. [Editorial Authenticity & Visual Integrity](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) — mandatory affirmative-writing, graphic-purpose, AI-assisted production, and five-gate review standard.
4. [Visual Repertoire & Consulting References](VISUAL_REPERTOIRE_AND_REFERENCES.md) — required exhibit-selection workflow, six original graphic examples and exact public consulting references.
   - [Exhibit system](exhibit-system/README.md) — development reference: 39 synthetic-data exhibit patterns with native editable PPTX renderers, a selection command, deck-composition review and editability verification (structural and LibreOffice; not yet tested in PowerPoint).
5. [Reference Analysis](REFERENCE_ANALYSIS.md) — annotated evaluation of the four supplied McKinsey/BCG decks and additional institutional resources.
6. [FI001 Redesign Brief](FI001_REDESIGN_BRIEF.md) — suggested **18-slide** versioned redesign, not an authorization to overwrite the published FI001 edition.
7. [Original slide previews](examples/) — historical FI001 examples and six new Archivo exhibit patterns. These are not copies of consultant slide screenshots.
8. [PowerPoint master generator](templates/create_master.py) — eight-layout starter in the v3 identity using editable text and shapes.
9. [Design-validation package](validation/README.md) — unpublished sample cover, executive-answer slide, two exhibit slides, methodology slide, memo page and publication cover generated from the updated templates, using neutral example data.

## Varied exhibit forms

![Six original SMPT exhibit patterns with synthetic illustrative data](examples/05-visual-repertoire.svg)

*Frozen illustration in the earlier graphite-and-gold palette (v2). It shows form only and has not been regenerated; the exhibit-system gallery is the current v3 reference. `examples/render_visual_repertoire.py` is a legacy generator.*

See the [visual repertoire](VISUAL_REPERTOIRE_AND_REFERENCES.md) for data classifications, source examples and selection rules. The new gallery uses synthetic layout fixtures; it is separate from research findings.

For editable deck exhibits, use the [exhibit system](exhibit-system/README.md) and its development gallery (`exhibit-system/gallery/index.html`, not for publication).

## Historical FI001 examples

These historical previews retain their earlier graphite-and-gold, Archivo-only styling and are not restyled. Use the current standard when designing a new or revised deck; the exhibit-system gallery now renders in the v3 identity.

The illustrations below are original SMPT designs using **already disclosed FI001 research data**. Values are illustrative *exhibits from that research*, not new models or refreshed figures.

![Core versus uncommitted financial instruments](examples/01-financing-structure.svg)

![Illustrative incremental downside sensitivity](examples/02-sensitivity-bridge.svg)

![Milestone-to-cash-conversion evidence](examples/03-cash-conversion.svg)

![Executive financial thesis](examples/04-executive-findings.svg)

## Generate an editable PowerPoint starter

With Python 3 and [python-pptx](https://python-pptx.readthedocs.io/) installed:

```bash
python -m pip install python-pptx
python docs/design/presentations/templates/create_master.py SMPT_Research_Master_v3.pptx
```

The starter now follows the v3 identity: plaster ground, graphite text, malachite emphasis, Spectral on the cover and the closing statement, Archivo everywhere else, and no tracked all-caps. It loads `publication-tokens.json` and stops if Spectral or Archivo is not installed (set `SMPT_ALLOW_MISSING_FONTS=1` only for a layout-only dry run whose output must not be rendered or distributed).

The starter contains eight **illustrative** original layouts and example FI001 figures, **not** an approved republished research edition. Replace examples using the controlling model and evidence register before publication. Convert a finished PPTX to PDF using an available office renderer, inspect every slide, and validate font substitutions and hyperlinks. Spectral and Archivo are only font *names* in the PPTX; no font files are bundled or committed. A recipient without them sees a substitute, which is why the PDF export is canonical. Check the PDF with `pdffonts`.

## What is included / excluded

Included: rules, layouts, chart grammar, editorial standards, original examples, publicly accessible research references, and a bounded FI001 design brief.

Not included: McKinsey, BCG, Bain or Strategy& slide screenshots, logos, font binaries, copied template files, or a revised FI001 publication. Several supplied PDFs carry explicit reuse restrictions; link to sources rather than rehosting their content.

**Production note:** Run the [editorial authenticity and visual integrity gates](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) and record their evidence before declaring a new deck publication-ready. Before declaring a new deck publication-ready, its editable PowerPoint and PDF must be rendered and visually inspected, calculations reconciled to the controlling research model, and author/editorial approval recorded. A style guide is not itself publication approval.
