# FI003 Studio v1 design candidate: visual QA and analytical-parity report

**Status: design candidate. Draft 1.0 is unchanged. Publication stays on HOLD. The Jiho, Ambrose and Benjamin review gates are not completed, and nothing here marks any gate passed.**

Visual production only. The Studio v3 publication identity (PR #262, `74fdc11`) is applied to the 18 slides of FI003 draft 1.0 (`6b93058`). The research cutoff stays 6 November 2026 and authorship is unchanged.

## Files

| File | Path |
|---|---|
| Editable deck (18 slides) | `research/fi003/outputs/presentation-studio-v1/fi003-mp-materials-10x-financing-studio-v1.pptx` |
| PDF, selectable text, Archivo and Spectral embedded | `…/fi003-mp-materials-10x-financing-studio-v1.pdf` |
| Contact sheet (all 18 slides) | `…/fi003-studio-v1-contact-sheet.png` |
| Individual previews, 150 dpi | `…/previews/slide-01.png` to `slide-18.png` |
| Build manifest | `…/fi003-mp-materials-10x-financing-studio-v1.manifest.json` |
| Build inputs | `research/fi003/presentation/studio-v1/` (`build_spec.py`, `export_pdf.sh`, `contact_sheet.py`, `spec.json`) |

Draft 1.0 (`outputs/presentation-draft-v100/`, `presentation/v100/`) was not edited. All 11 files were hash-compared with `6b93058` and are identical.

## What changed (presentation only)

- Plaster-white ground, graphite type, malachite emphasis; hematite, ochre and lapis stay functional (financial and contractual distinctions).
- Archivo for titles, body, tables, labels and figures. Spectral appears only on the cover title (44 pt, the permitted role).
- Cover: new left text column and right ledger. The ledger keeps the three instruments visibly separate: expired undrawn commitment (dashed outline), cash received (solid), committed capacity (outline, shaded where in use).
- Labels sentence-cased, with no tracked all-caps except the status badge "DRAFT · REVIEW GATES PENDING".
- Slide 7 (revolver availability): the "remaining capacity" bar uses a tint so data labels meet contrast.
- Renderer changes are opt-in only (`conventionNote`, `keepOrder`, `legendWidths`, `accentFill`, `notesHeading` without tracking, `publication_cover`). Default outputs of the shared exhibit system are unchanged and its tests pass.

## Analytical parity with draft 1.0

Compared with `parity.py` on the PPTX XML (text, hyperlink targets, notes, and table, chart and picture counts, slide by slide):

| Check | Result |
|---|---|
| Slide count | 18 and 18 |
| Hyperlinks | 64 and 64, identical targets on every slide |
| Speaker notes | identical on every slide |
| Tables, charts, pictures per slide | identical |
| Text, case-insensitive | identical on 17 slides; slide 1 only splits the cover title and subtitle into two paragraphs, same words |
| Text, case-sensitive | differs only where labels were sentence-cased (for example INTERPRETATION to Interpretation) |
| `spec.json` against draft 1.0 | identical apart from the `publication_cover` key and those label cases |

No number, chart value, status, citation, evidence ID, qualification or cutoff changed. In particular these distinctions are preserved as in draft 1.0:

- the expired undrawn JPMorgan commitment, net equity proceeds, revolving credit availability and letters of credit are separate items;
- the $500m minimum liquidity condition is a quarter-end test, not a locked reserve;
- about $232m and about $209m covenant EBITDA are alternative thresholds, not headroom;
- no cost-to-complete, funding gap, bank fee, WACC or DSCR is inferred;
- the pending-legal-review qualifications and the JPMorgan versus other-banks roles are unchanged.

## Checks run

| Check | Result |
|---|---|
| `scripts/publication/check_deck.py --strict` on the PPTX | 0 violations, 0 warnings |
| `scripts/exhibit-system/verify_editability.py --check` | structural pass (research mode) |
| `exhibits:review --strict` on the deck spec | 0 hold, 0 review, 0 info |
| `pdffonts` | Archivo-Regular, Archivo-Bold, Spectral-Regular, all embedded |
| `node --test tests/*` | 1309 pass, 0 fail |
| `npm run validate` | pass |
| `tsc --noEmit` (`typecheck`) | pass |
| `npm run lint` | 0 errors; 29 warnings, none in files changed here |
| `npm run build` | pass |
| `research/fi003/model.py --check` | pass |
| `research/fi003/prototype.py --check` | pass (11 schedules reproduce) |
| FI003 `unittest` (37 tests, includes the v1.0 accessibility test) | OK |

## Visual inspection

All 18 rendered slides were inspected. Slides 1, 5, 6, 7, 8, 10, 11 and 17 were re-inspected after the final rebuild.

Inherited from draft 1.0, not regressions, and left unchanged to keep the layout faithful:

- Slide 4: the "Apple agreement" and "2025" labels sit close together; the timeline renderer's label-width estimate is conservative.
- Slides 6 and 8: value labels on the bar and waterfall sit slightly offset from their bars.
- Slides 11, 12, 15, 16 and 17: three-line interpretation strips sit close to the footer rule.

## Design deviations to review

1. The cover is a text-plus-ledger split, not a centred title block. The ledger makes the instrument distinctions visible on slide 1.
2. Sentence-cased labels are typographic only; the words are unchanged.
3. The slide 7 accent tint.

## Not verified or not produced

- **Native PowerPoint and Keynote editing and rendering** were not tested. Only structural editability and a LibreOffice render were checked. PPTX cannot embed fonts, so the PDF is the canonical visual; the PPTX needs Archivo and Spectral installed.
- **Manual accessibility testing** (screen reader, keyboard, reading order) was not done.
- **Accessibility-tagged PDF variant** (the 1.0 package has one) was not produced: it needs PyMuPDF, which is not installed here, and installing it was not authorized. The PDF here has selectable text and embedded fonts but is not tag-remediated.
- **Draft PR against the FI003 foundation branch**: see the PR description for the integration finding.
- The Spectral font file was fetched into a temporary folder outside the repo for rendering only. No font binary is committed.

## Governance

Jiho review, Ambrose review and Benjamin's financial and methodological review are all pending. Publication remains on HOLD. PR #215 is not merged, and nothing is published, deployed or distributed.
