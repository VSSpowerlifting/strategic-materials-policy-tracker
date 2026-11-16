# SMPT deck quality rubric

Use for an **evidence-based critique**, not an automatic publication score. Record 0–4 for each dimension with cited slide examples and specific repairs. These ratings guide prioritization; the existing editorial review gates A–E and seven Applied Strategy gates control readiness.

| Dimension | 0 · Blocked | 2 · Serviceable | 4 · Excellent |
| --- | --- | --- | --- |
| Analytical argument | Thesis absent, contradictory, or unsupported | Answer exists but slide order or logic requires work | Titles alone form a coherent, defensible answer with explicit decision implication |
| Evidentiary integrity | Material unsourced claim, model mismatch, false status or causal overreach | Sources exist but some basis/cutoff/caveat work is needed | Every material chart and claim traceable; evidence classes, uncertain links and statuses explicit |
| Financial and strategic depth | Figures or options copied without mechanism or testing | Some calculations/scenarios; limited alternatives | Reconciled mechanics, sensitivities, credible options and reversal triggers answer a real decision |
| Visual reasoning | Data distorted, false relationships or chart unreadable | Appropriate patterns but repetition/overdensity remains | Graphical form makes otherwise difficult comparisons fast and accurate; scale/unit semantics preserved |
| Editorial craft | Generic claims, verbose filler, unqualified numerical rhetoric | Mostly clear with uneven concision/hierarchy | Specific, human, direct writing; one sharp insight per slide and a useful annotation |
| Production integrity | Broken slide, missing sources/rights, failed render or irreproducible file | Editable draft exists but some checks unrun | Editable PPTX, faithful canonical PDF, readable slide contact sheet, provenance, and reproducible checks |

For each dimension, `1` means material defects beyond acceptable serviceability, and `3` means strong with bounded corrections. Do not average away a hard hold. A 24/24 score would still not confer publication approval.

## Hard holds independent of aesthetics

A deck is on **HOLD** if it contains fabricated or untraceable material claims, incorrectly describes a financing/legal stage, shows non-comparable quantities as a single reconciled total, presents a model assumption as observed fact, omits a material qualifier that flips the inference, violates source/image rights, exceeds the governing slide limit, imports synthetic fixtures as research, or fails the applicable source/model/visual gates. Missing verification is reported as unrun, not as PASS.

## Per-slide visual inspection

Inspect the exported PDF or image at full presentation resolution **and** as part of a multi-slide contact sheet. Check:

1. Is the headline a claim rather than a topic? Does the slide prove precisely that claim?
2. Can a new reader identify its measure, unit, denominator, date, source, and the main comparison within seconds?
3. Are axis origins, scales, stacked totals, scenario assumptions and status encodings truthful?
4. Are annotations useful, not another paraphrase of the headline? Are the source footer and necessary caveats readable?
5. Are text and numbers cropped, touching, overlapping or improperly wrapped? Are numeric decimal places and units consistent?
6. Are table densities and small labels justified? Could the slide be split or its low-value content cut within the length budget?
7. Are contrast, color-blind alternative encodings, reading order and object editability acceptable?
8. Does the cover asset show the real subject accurately, with documented rights, or clearly identify conceptual artwork?

For each defect write `slide / severity / evidence / exact repair / owner / recheck`. Re-render repaired slides and the full contact sheet. Visual variety alone is never a quality target; pattern selection must correspond to analytical relationships.

## Visual benchmark and regression test ideas

For engineering changes (a separate scoped phase): maintain a small, frozen, synthetic **golden deck** with one sample per layout family; compare slide geometry, font presence, visible labels, PNG contact sheets, source notes, embedded workbooks and editable object counts. Confirm existing FI002/FI003 artifacts remain unaffected unless a particular versioned migration is expressly commissioned. Test charts for zero, negative, missing and non-comparable bases, long headings, dense legends, multiple currencies and long source footers.
