# Design-validation package (unpublished)

**Draft. Unpublished design validation. Synthetic example data, not research.** These files check that the updated templates produce a coherent set of publication artifacts. They contain no finding about any real programme, project, policy or company, and they are not for distribution or citation.

All figures come from one synthetic fixture (`exhibit-system/fixtures/ranked-bar.json`: seven programmes, 1,750 CU million committed). The memo table in `specs/memo.json` is the single place the deck reads the figures from, so the deck, memo and cover agree.

| Artifact | File in `output/` | Built by | Template |
| --- | --- | --- | --- |
| Presentation (5 slides: cover, executive answer, comparison exhibit, status exhibit, method and evidence) | `smpt-validation-deck.pptx`, PDF export, `slide-1..5.png` | `build_validation_deck.py` | `templates/create_master.py` helpers |
| Executive memo page | `smpt-validation-memo.pdf`, `memo-page.png` | `scripts/publication/memo.py` | `specs/memo.json` |
| Publication cover and social image | `smpt-validation-publication-cover.pdf`, `cover-page.png`, `smpt-validation-publication-social.png` | `scripts/publication/cover.py` | `specs/cover.json` |

The PDF exports are the canonical rendering: PowerPoint cannot embed fonts, so the PPTX depends on Spectral and Archivo being installed where it is opened.

## Rebuild

Spectral and Archivo must be installed as TrueType (builds stop if either is missing; font binaries are never committed). Python packages run through `uv`; nothing is installed into the repository.

```bash
V=docs/design/presentations/validation
uv run --with python-pptx python $V/build_validation_deck.py $V/output/smpt-validation-deck.pptx
uv run --with reportlab python scripts/publication/memo.py $V/specs/memo.json $V/output/smpt-validation-memo.pdf
uv run --with reportlab python scripts/publication/cover.py $V/specs/cover.json $V/output
python3 scripts/publication/check_deck.py --strict $V/output/smpt-validation-deck.pptx
soffice --headless --convert-to pdf --outdir $V/output $V/output/smpt-validation-deck.pptx
```

## What was checked

- PPTX objects are native and editable: text boxes, rectangles and lines, with no embedded pictures. Bars are true to scale from zero.
- `check_deck.py --strict`: 0 violations and 0 warnings (palette, theme, typefaces, Spectral 28 pt floor, no gradients or shadows).
- Rendered PDFs embed only Archivo and Spectral; text is selectable; the methodology hyperlink is present in the PPTX and the PDF.
- Every page was inspected as a rendered image for clipping, overflow and font substitution.
- Not covered: rendering in PowerPoint itself (not available here); numerals are right-aligned rather than OpenType tabular in the memo and the deck.
