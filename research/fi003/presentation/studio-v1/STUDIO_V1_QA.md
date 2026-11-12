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
| Accessibility-tagged PDF (structure repair of the PDF above) | `…/fi003-mp-materials-10x-financing-studio-v1-accessible.pdf`, with `…-accessible.receipt.json` |
| Build manifest | `…/fi003-mp-materials-10x-financing-studio-v1.manifest.json` |
| Build inputs | `research/fi003/presentation/studio-v1/` (`build_spec.py`, `export_pdf.sh`, `contact_sheet.py`, `spec.json`) |

Draft 1.0 (`outputs/presentation-draft-v100/`, `presentation/v100/`) was not edited. All 11 files were hash-compared with `6b93058` and are identical. PR #215 (`codex/fi003-jpmorgan-financing-foundation`) head was still `6b93058` and open when checked on 12 November 2026.

This branch is cut from `main` (`74fdc11`), which does not contain the FI003 research files. A subset of `research/fi003` was copied verbatim from `6b93058` so the deck can be rebuilt (model outputs, exhibits, the v100 presentation inputs and the review and handoff documents). Earlier-version material in that tree was not imported. The copy is a build baseline for review, not a replacement for PR #215.

## What changed (presentation only)

- Plaster-white ground, graphite type, malachite emphasis; hematite, ochre and lapis stay functional (financial and contractual distinctions).
- Archivo for titles, body, tables, labels and figures. Spectral appears only on the cover title (44 pt, the permitted role).
- Cover: new left text column and right ledger. The ledger keeps the three instruments visibly separate: expired undrawn commitment (dashed outline), cash received (solid), committed capacity (outline, shaded where in use).
- Labels sentence-cased, with no tracked all-caps except the status badge "DRAFT · REVIEW GATES PENDING". On slide 11 the milestone status tags (Reported, Contractual, Conditional) use sentence case through the opt-in `stateCase` option.
- File properties mark the PPTX as a Studio v1 design candidate with review gates pending, through an opt-in `subject` field on the deck spec.
- Slide 7 (revolver availability): the "remaining capacity" bar uses a tint so data labels meet contrast.
- Renderer changes are opt-in only (`conventionNote`, `keepOrder`, `legendWidths`, `accentFill`, `stateCase`, `subject`, `notesHeading` without tracking, `publication_cover`). Default outputs of the shared exhibit system are unchanged and its tests pass.

## Analytical parity with draft 1.0

Compared with `parity.py` on the PPTX XML (text, hyperlink targets, notes, and table, chart and picture counts, slide by slide):

| Check | Result |
|---|---|
| Slide count | 18 and 18 |
| Hyperlinks | 64 and 64, identical targets on every slide (targets compared with draft 1.0; liveness was not tested) |
| Speaker notes | identical on every slide |
| Tables, charts, pictures per slide | identical |
| Text, case-insensitive | identical on 17 slides; slide 1 only splits the cover title and subtitle into two paragraphs, same words |
| Text, case-sensitive | differs only where labels were sentence-cased (for example INTERPRETATION to Interpretation; slide 11 status tags) |
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

## Tagged PDF

`presentation/studio-v1/remediate_pdf_studio_v1.py` (adapted from the draft 1.0 script, pinned to the SHA-256 of the exported PDF) writes the `-accessible.pdf` and its receipt without touching the source export. PyMuPDF 1.26.5 and pypdf 6.14.2 ran from a scratch virtual environment outside the repo, with the user's approval.

Receipt status PASS: 18 H1 slide titles (the cover title on slide 1) and 4 H2 subheadings; each slide opens with its H1; 10 Figures, all with Alt text (3 charts and 6 diagrams described from `spec.json`, plus the existing doughnut description); 198 decorative vectors re-marked as artifacts, counts pinned per page; 8 tables, 30 TH, 150 TD and 64 links preserved. All 18 pages are pixel- and text-identical to the export, and link URIs and rectangles are unchanged. Cover note: the seven text-free ledger vectors are decorative because every amount and status is also set as text.

Adaptation notes: the running page number is exported inside the chart range on slides 6 to 8, so the chart-label check now skips it. The per-page artifact counts match draft 1.0 except the cover (7 against 6), which follows the new ledger.

## Visual inspection

All 18 rendered slides were inspected during the build. After the final rebuild, slides 2 and 11 were viewed again to confirm the heading fix and the sentence-case status tags. Slides 1, 5, 6, 7, 8, 10 and 17 were last viewed before that final rebuild; the rebuild did not change their spec and the text-parity check passed on the rebuilt file, but their pixels were not re-viewed.

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
- **Screen-reader and PDF/UA testing** of the tagged PDF was not done. The tagged variant (below) is a bounded structure repair, not PDF/UA or WCAG certification, and link annotations have no `/Contents`; the visible evidence ID is the link text.
- **Draft PR against the FI003 foundation branch** was not opened. `git merge-tree` of this branch with `codex/fi003-jpmorgan-financing-foundation` (`6b93058`) reports 12 conflicts: `PROJECT_STATE.md`, `data/seed/materials.json`, `tests/f5-corpus-cutoff-impact.test.ts`, add/add in `scripts/exhibit-system/research-cover.ts` and `tests/exhibit-system-v100-cover.test.ts`, and content conflicts in `scripts/exhibit-system/{build-gallery,primitives,research-deck}.ts` and the `condition-tree`, `exhibit-with-interpretation`, `role-matrix` and `stacked-bar` renderers. The FI003 branch forked from an older `main` (`ea02a30`) and carries its own v1.0 cover and renderer edits. Opening a PR against `main` would land held FI003 material outside PR #215. The branch is pushed for review only; integration needs a decision on how to reconcile the exhibit-system code.
- The Spectral font file was fetched into a temporary folder outside the repo for rendering only. No font binary is committed.

## Governance

Jiho review, Ambrose review and Benjamin's financial and methodological review are all pending. Publication remains on HOLD. PR #215 is not merged, and nothing is published, deployed or distributed.
