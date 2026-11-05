# SMPT presentation system — version 2.0

**Status:** Adopted editorial design standard for new SMPT decks, 5 November 2026  
**Owner:** SMPT editorial/research lead  
**Scope:** Executive briefings, applied-strategy cases, financial-intelligence cases, and visual research dossiers  
**Hard ceiling:** **20 slides total**, including title, executive summary, conclusion, methods, references, and appendix. No exceptions by renaming a section "backup."

SMPT publishes independently authored, source-linked industrial-policy and financial research. This system translates the analysis into readable, defensible, editable PowerPoint presentations. It borrows **principles** of disciplined consulting communication, not another firm's branding or proprietary slide designs.

## Read in this order

1. [Presentation Standard v2](SMPT_PRESENTATION_STANDARD_V2.md) — definitive governance, type, palette, slide structures, length budgets, editorial and QA rules.
2. [Exhibits and Chart Rules](EXHIBIT_AND_CHART_RULES.md) — chart selection, scales, status encodings, sensitivity reconciliation and source methods.
3. [Editorial Authenticity & Visual Integrity](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) — mandatory affirmative-writing, graphic-purpose, AI-assisted production, and five-gate review standard.
4. [Reference Analysis](REFERENCE_ANALYSIS.md) — annotated evaluation of the four supplied McKinsey/BCG decks and additional institutional resources.
5. [FI001 Redesign Brief](FI001_REDESIGN_BRIEF.md) — suggested **18-slide** versioned redesign, not an authorization to overwrite the published FI001 edition.
6. [Original slide previews](examples/) — four SMPT-authored vector examples demonstrating the system. These are not copies of consultant slide screenshots.
7. [Editable PowerPoint master generator](templates/create_master.py) — reproducible eight-layout starter using editable PowerPoint text and shapes.

## Original examples

The illustrations below are original SMPT designs using **already disclosed FI001 research data**. Values are illustrative *exhibits from that research*, not new models or refreshed figures.

![Core versus uncommitted financial instruments](examples/01-financing-structure.svg)

![Illustrative incremental downside sensitivity](examples/02-sensitivity-bridge.svg)

![Milestone-to-cash-conversion evidence](examples/03-cash-conversion.svg)

![Executive financial thesis](examples/04-executive-findings.svg)

## Generate an editable PowerPoint starter

With Python 3 and [python-pptx](https://python-pptx.readthedocs.io/) installed:

```bash
python -m pip install python-pptx
python docs/design/presentations/templates/create_master.py SMPT_Research_Master_v2.pptx
```

The starter contains eight **illustrative** original layouts and example FI001 figures, **not** an approved republished research edition. Replace examples using the controlling model and evidence register before publication. Convert a finished PPTX to PDF using an available office renderer, inspect every slide, and validate font substitutions and hyperlinks. Source Sans 3 and Georgia are only font *names* in the PPTX; no font files are bundled. When these fonts are unavailable, common renderers may fall back to other serif/sans families.

## What is included / excluded

Included: rules, layouts, chart grammar, editorial standards, original examples, publicly accessible research references, and a bounded FI001 design brief.

Not included: McKinsey, BCG, Bain or Strategy& slide screenshots, logos, font binaries, copied template files, or a revised FI001 publication. Several supplied PDFs carry explicit reuse restrictions; link to sources rather than rehosting their content.

**Production note:** Run the [editorial authenticity and visual integrity gates](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) and record their evidence before declaring a new deck publication-ready. Before declaring a new deck publication-ready, its editable PowerPoint and PDF must be rendered and visually inspected, calculations reconciled to the controlling research model, and author/editorial approval recorded. A style guide is not itself publication approval.