# FI003 presentation draft 0.6: design and verification report

Status: draft for review. The publication HOLD stays in place. Jiho's independent assessment is pending (feedback expected about 16–17 November 2026). A clean build is not publication authorization.

## What changed from draft 0.5

Draft 0.6 is rebuilt from the exhibit-pattern library (PR #224) with `npm run exhibits:render`. It has 13 slides (ceiling 20). Each slide answers one financial question. Versions 0.5 and earlier are untouched.

| # | Question | Pattern |
|---|----------|---------|
| 2 | What role did JPMorgan hold in each instrument? | role-matrix |
| 3 | In what order did commitment, equity and revolver arrive? | two-lane-timeline |
| 4 | How much did the new shares dilute holders? | waterfall (shares) |
| 5 | Did equity replace the committed route like for like? | table with reading notes |
| 6 | How much revolver capacity remained after letters of credit? | stacked bar |
| 7 | How can the covenant addback reverse? | condition-tree |
| 8 | When could covenant tests begin against commissioning? | evidence-milestone-strip |
| 9 | What government support links to MP? | counterparty-map |
| 10 | How does the offtake threshold scale with capacity? | table with reading notes |
| 11 | Are price-protection income and cash the same? | table with reading notes |
| 12 | Where did liquidity go? | waterfall (liquidity) |
| 13 | Which decisions follow, and who owns them? | role-matrix |

Source: `research/fi003/presentation/v06/build_spec.py` writes `spec.json` from `research/fi003/sources.json` and `research/fi003/exhibits/*.csv`. Figures are computed from the CSVs, not typed in. No synthetic gallery values were imported. Model 1.0, inputs, formulas and registers are unchanged (`git status` shows only new files under `presentation/v06` and `outputs/presentation-draft-v06`).

## Outputs (`research/fi003/outputs/presentation-draft-v06/`)

- `fi003-jpmorgan-mp-materials-draft-0.6.pptx` (editable, native shapes, tables and text)
- `fi003-jpmorgan-mp-materials-draft-0.6.pdf` (Archivo embedded)
- `fi003-draft-0.6-contact-sheet.png`
- `fi003-jpmorgan-mp-materials-draft-0.6.manifest.json` (slide and exhibit manifest; `review_gates: pending-human-review`, `publication_authorization: not-granted`)

Reproduce: `python3 research/fi003/presentation/v06/build_spec.py`, `npm run exhibits:render -- research/fi003/presentation/v06/spec.json <out.pptx>`, then `bash research/fi003/presentation/v06/export_pdf.sh`.

## Verified

- Every slide rendered from the PDF and inspected, plus the contact sheet. Overlap on slide 3 and wrapped branch labels on slide 7 were found and fixed; both re-inspected clean.
- `npm run exhibits:verify` with `--deck` and `--manifest`: structural pass (LibreOffice and PowerPoint tiers not run by that tool).
- PDF fonts: `pdffonts` shows Archivo Regular and Bold embedded.
- Figures cross-checked to the accepted model: dilution 8.31% of basic and 7.68% isolated; net equity $724.2m against the $1bn reference; revolver $275m with letters of credit $40m, $72m, $72m; offtake threshold; price-protection income against cash; liquidity 1,830.3 to 1,337.9 (change −492.4).
- `model.py --check`, `prototype.py --check` and the 24 unit tests pass.
- `npm run validate`, `lint` (0 errors, 28 pre-existing warnings), `typecheck` and `build` pass.

## Not verified or limited

- No native PowerPoint open, edit or save test. No screen-reader test. PDF accessibility (tags, reading order) was not assessed.
- Positioned-shape graphics (timeline, milestone strip, condition tree, counterparty map, waterfalls) are not data-bound; only the table and stacked-bar content is native chart or table data.
- The PDF is exported with LibreOffice using a private profile that loads the repo's Archivo files; layout in PowerPoint may differ slightly.
- Slides 8 to 11 carry some empty space; accepted for draft.

## Decisions for the maintainer

1. The ownership donut became a share waterfall (no donut renderer; percent-stacked needs 3 to 6 rows). The relationship diagram became the role matrix plus a counterparty map.
2. Slide 13 owner assignments (Treasury, CFO and board, Lenders, Credit teams) are analytical judgment, not sourced facts; the footer says "Model analysis of the reviewed record". Consider retitling or dropping.
3. The split of the new shares between the base and option portions is inferred in the model and is not stated on any slide.
4. No ranked-explanations or evidence-limits slide was added; room remains under the 20-slide ceiling.
