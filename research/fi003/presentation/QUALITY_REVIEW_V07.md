# FI003 presentation draft 0.7: editorial refinement and verification report

Status: draft for review. The publication HOLD stays in place, and Jiho's independent assessment is still pending (feedback expected about 16–17 November 2026). A clean build does not authorize publication, and this report records no financial or editorial approval.

## What changed from draft 0.6

Draft 0.7 is a bounded editorial revision of draft 0.6. It keeps the same 13 slides, the same exhibit system and the same inputs. Model 1.0, the source registers, the exhibit CSVs, the calculations, the historical facts and the research cutoff (6 November 2026) are unchanged. Draft 0.6 and its outputs are unchanged.

| # | Change | Why |
|---|--------|-----|
| 1 | Version label set to 0.7 | Identification |
| 2 | Reading note now says JPMorgan's fees, retention and internal credit decisions are not disclosed | Evidence limit A |
| 4 | Share waterfall kept, and a native editable ownership doughnut added on the right. The layout runs left to right: arithmetic, then composition. The title, subtitle and interpretation now state both denominators. | Decision A |
| 8 | Reading note now says covenant headroom is not disclosed | Evidence limit C |
| 13 | Reframed as "Recommended considerations for comparable industrial sponsors and lenders" | Decision B |

All other slides are unchanged. That includes the existing evidence limits on slides 3, 5 and 9.

## Slide 4: denominators

| Figure | Numerator | Denominator | Result |
|--------|-----------|-------------|--------|
| Increase in the basic share count | 13,590,908 new shares | 163,477,816 basic shares before the July 2025 offering | 8.31% |
| Share of the isolated post-offering base | 13,590,908 | 177,068,724 isolated pro forma basic shares | 7.68% |
| Existing holders' share of that base | 163,477,816 | 177,068,724 | 92.32% |

- **The waterfall** reads 163.478 + 13.591 = 177.069 million shares.
- **The doughnut** uses the same start and end inputs. Its slices are 92.32% and 7.68%, totalling 100.00%. The renderer checks this, and also checks that the two printed labels add to 100.00.
- **What the slide claims.** The interpretation says that 7.68% is measured against the isolated post-offering base and is "Not a fully diluted figure": later issuance and potential shares are excluded. The slide does not present 7.68% as a verified change for any individual holder.
- **Sources.** The footer cites S06 and S11, as in draft 0.6.

The doughnut comes from a small optional `share` block in the existing waterfall renderer, not from a general donut library. It is drawn only when every movement is an increase. Otherwise the renderer's `share-composition` check rejects it.

## Slide 13: how the considerations read

- **Title and subtitle.** The title is "Recommended considerations for comparable industrial sponsors and lenders". The subtitle reads "Illustrative analytical considerations drawn from the FI003 record; not decisions by MP Materials or JPMorgan."
- **Footer.** The footer reads "FI003 analysis of the reviewed record; illustrative".
- **The key** reads "Analytical judgment, not sourced decisions."

The slide has five rows, each split between sponsors and lenders:

| Consideration | Sponsors watch | Lenders watch |
|---------------|----------------|---------------|
| Flexibility versus dilution and funding certainty | Price dilution | Expiry, fees |
| Conditional capital versus remaining build needs | Draw conditions | Unfunded scope |
| Liquidity and credit usage apart from headlines | Cash runway | LC usage |
| Covenant test dates and reversal mechanics | Test timing | Addback reversal |
| Government support kept apart from causal claims | Support terms | No causal credit |

The interpretation reads "Forward-looking analysis only. A reliable remaining construction funding gap cannot be forecast from the public record."

Nothing on the slide is attributed to MP's or JPMorgan's decisions. The draft 0.6 owner labels (Treasury, CFO and board, Lenders, Credit teams) are removed. That resolves draft 0.6 maintainer decision 2.

## Evidence limits (no new slide)

| Limit | Where it appears |
|-------|------------------|
| JPMorgan's economics and internal credit decisions are undisclosed | Slide 2, reading note |
| The effect of government support on equity demand is not isolated | Slide 3 (as in draft 0.6) and slide 13, row 5 |
| Covenant headroom is undisclosed | Slide 8, reading note |
| Funding is conditional or unavailable | Slide 5 (reference minimum for a commitment that expired undrawn), slide 9 (fallback preferred only if net financing falls short) and slide 13, row 2 |
| No reliable forecast of the remaining construction funding gap | Slide 13, interpretation |

## Shared-code changes

All three changes are opt-in or no-ops for existing specs.

- **`renderers/waterfall.ts`** adds the optional `share` doughnut and its checks. The doughnut's workbook value is trimmed to the input precision, so the embedded sheet shows 13.591 rather than 13.590999….
- **`renderers/role-matrix.ts`** adds an optional `layout` block: row header, label width, count column and key text.
- **`build-gallery.ts`** adds `unifyChartTypeface`, applied when the output is normalised. pptxgenjs hard-codes Arial in the doughnut's data-label text properties, and the verifier flagged it. The chart XML now uses Archivo, like the rest of the deck. The function does nothing to charts that already use Archivo.
- **Draft 0.6 is unaffected.** It was re-rendered with the changed code into a scratch directory. The result has the same zip entries as the committed draft 0.6 PPTX, and every entry's bytes are identical.

## Outputs (`research/fi003/outputs/presentation-draft-v07/`)

| File | SHA-256 |
|------|---------|
| `fi003-jpmorgan-mp-materials-draft-0.7.pptx` (editable: native charts with embedded workbooks, plus native tables, shapes and text) | `c7bf3458…785ecc` |
| `fi003-jpmorgan-mp-materials-draft-0.7.pdf` (tagged; Archivo Regular and Bold embedded) | `6f00cd0c…eb83bc5` |
| `fi003-draft-0.7-contact-sheet.png` | `e4de034f…d0249ad` |
| `fi003-jpmorgan-mp-materials-draft-0.7.manifest.json` (`review_gates: pending-human-review`, `publication_authorization: not-granted`) | `6ec5292c…8faf9de3` |

To reproduce from the repository root, run these three commands in order:

```bash
python3 research/fi003/presentation/v07/build_spec.py
npm run exhibits:render -- research/fi003/presentation/v07/spec.json research/fi003/outputs/presentation-draft-v07/fi003-jpmorgan-mp-materials-draft-0.7.pptx
bash research/fi003/presentation/v07/export_pdf.sh
```

The renderer refuses to overwrite its outputs. Delete the existing PPTX, manifest and PDF first.

## Verified

- **Visual inspection.**
  - Every slide was inspected on the contact sheet.
  - Slides 4 and 13 were also inspected at full size, and both are clean.
  - No overflow or overlap was found.
  - Source footers and caveats are present on every content slide.
- **Draft 0.6 comparison.** A diff of `v06/build_spec.py` against `v07/build_spec.py` shows that only the slide 1, 2, 4, 8 and 13 entries changed. Every other slide's spec is identical, and on the contact sheet those slides match draft 0.6.
- **Structural verifier.** `npm run exhibits:verify` with `--deck` and `--manifest` passes. That includes the chart-typeface check that first flagged Arial on the new doughnut.
- **Editability.** Slide 4's waterfall and doughnut are native chart parts, each with an embedded workbook. The doughnut's workbook holds 163.478 and 13.591.
- **PDF and PPTX correspond.** The PDF has 13 pages with the same slide order and text. It is exported from this PPTX by `export_pdf.sh`.
- **Unit tests.** `tests/exhibit-system-v07-options.test.ts` adds 8 tests:
  - the doughnut slices total 100 and match 8.31 and 7.68
  - decreases are rejected
  - the share block is optional
  - the typeface normalisation
  - the role-matrix layout defaults and bounds
  - The full suite passes: 1,142 of 1,142.
- **Repository checks.** The results are in the PR description for the commit that adds this report. The model and prototype checks were run on that commit: `model.py --check`, `prototype.py --check` and the FI003 unit tests. So were `npm run validate`, `lint`, `typecheck` and `build`.

## PDF accessibility against the draft 0.5 standard

The draft 0.5 PDF was post-processed by `remediate_pdf.py` (receipt: `outputs/presentation-draft-v05/accessibility.json`). Draft 0.6 was not. The draft 0.7 export, `fi003-jpmorgan-mp-materials-draft-0.7.pdf`, **stays unremediated** and byte-for-byte unchanged (sha256 `6f00cd0c05cdc3aff859e7ab7c6af770015cc15a0c0bdac48a6956d21eb83bc5`). A separate file, `fi003-jpmorgan-mp-materials-draft-0.7-accessible.pdf`, is written from it by `v07/remediate_pdf_v07.py`. Its receipt is `fi003-jpmorgan-mp-materials-draft-0.7-accessible.receipt.json`.

| File | sha256 |
|------|--------|
| Accessible PDF | `957aa972b40509632c8e494ffe427203b2dfd8ee2fb283269fa79b960a6d306c` |
| Receipt | `2a52da0e65cd81f351e81d665f5abe01fbe47015682aa00fa7bddaaa129d0cce` |

Two runs produced byte-identical PDFs and receipts. Measured from the tag tree:

| Check | Draft 0.5 (remediated) | Draft 0.7 export (unremediated) | Draft 0.7 accessible PDF |
|-------|------------------------|---------------------------------|--------------------------|
| Tagged (`/Marked`), `/Lang` en-US, title shown | Yes | Yes. Title: "FI003 JPMorgan and MP Materials, draft 0.7" | Yes, unchanged |
| Fonts | Archivo embedded | Archivo Regular and Bold embedded | Unchanged |
| Slide headings tagged H1 or H2 | 15 H1, 21 H2 (15 pages) | None | 13 H1, 4 H2. Every slide opens with one H1 |
| Decorative vectors artifacted | 50 | None. 151 of 155 Figure tags have no Alt text | 147 artifacted. 8 Figures remain, all with Alt text |
| Meaningful figures with descriptions | 12 | 4 | 8: three charts (slides 4, 6, 12), the slide 4 doughnut and four diagrams (slides 3, 7, 8, 9) |
| Tables | 5 | 5 (18 TH, 77 TD, 27 TR) | Unchanged |
| Links | 46 | 34 | 34, URIs and rectangles unchanged |
| Page pixels and extracted text | — | — | All 13 pages identical to the export |

Draft 0.7 has 13 slides against draft 0.5's 15, and draft 0.5 tagged several H2 subheadings per slide. The H1 count is one per slide in both. Draft 0.7 has fewer H2s because only four slides carry a real subheading; card labels and table captions were not promoted to headings.

**Against the draft 0.5 standard.** Measured by coverage, the accessible PDF meets the draft 0.5 standard. Its raw counts are lower than draft 0.5's only because the deck has fewer slides and fewer visuals.

- Every slide opens with an H1.
- No Figure is left without Alt text, the same as draft 0.5.
- Every meaningful visual has a described Figure: the charts and doughnut on slides 4, 6 and 12, and the diagrams on slides 3, 7, 8 and 9. That is 8 Figures, against 12 in draft 0.5.
- The remaining slides need no Figure:
  - the cover (slide 1);
  - the tables (slides 5, 10 and 11);
  - the two role matrices (slides 2 and 13), whose marks are artifacts. See the limits below.
- Every evidence reference is linked.

**What the script changes.** It re-marks unnamed, text-free vector Figures as `/Artifact` and removes their structure elements and ParentTree slots. Each diagram keeps one representative vector as a Figure carrying the diagram description. The three chart Alts are replaced with descriptions built from the values drawn on the slide; the script fails if a stated value is not among the drawn labels. Slide titles become H1 and the four subheadings H2. The per-page artifact counts are pinned in the script, and any change fails the run. Content bytes outside the marked-content wrappers are not rewritten.

**What the script checks.** Each MCID in a content stream resolves through the ParentTree to the element that owns it. Each link annotation resolves to a Link element. Every page renders pixel-identical and extracts identical text compared with the export. Language, Marked, DisplayDocTitle, Info, XMP, tab order and file ID are unchanged. `test_presentation_v07_accessibility.py` repeats the structural checks on the committed files with pypdf alone.

### Link audit: why 46 became 34

Draft 0.5 had 46 link annotations over 15 unique URIs: 12 source-register URLs and 3 GitHub package links (the working-model XLSX, `evidence.csv` and `sources.json`). Draft 0.7 has 34 over 14 unique URIs, all source-register URLs (S01–S09, S11, S13, S15, S17 and S19). Every source URL in draft 0.5 is still linked in 0.7, and S05 and S08 are new.

The drop comes from slides that draft 0.7 does not have:

- **Linked cover (4 links).** The draft 0.7 cover carries no citations.
- **Package/closing slide (7 links).** These included the 3 GitHub package links.
- **Content slides: 35 → 34.** The remaining content slides each cite their own evidence.

On every draft 0.7 page, the links equal that slide's `evidence_refs` in `v07/spec.json`, in order. Each link's visible text is the evidence ID. All 14 URLs match `research/fi003/sources.json`. Per page the counts are 0, 4, 4, 2, 4, 3, 1, 5, 4, 1, 2, 1 and 3.

No source link was lost. The only URIs no longer present are the three repository package links. They were not added back: that would add content to the slides, and the package links belong to final release packaging.

### Limits and manual review still required

These are bounded static checks. They are not a PDF/UA (ISO 14289) or WCAG audit, and no accessibility certification is claimed. Still open:

- A screen-reader pass (NVDA, JAWS or VoiceOver) of reading order, table navigation and Alt text.
- **Role-matrix marks on slides 2 and 13** are artifacts. Each marked cell carries its own text, but the key text still refers to marks that assistive technology does not announce.
- **Slide 7 legend** names a route highlight that is not drawn. That is a content issue for the next publication revision, and it was not edited here.
- Link annotations have no `/Contents`; the visible evidence ID is the link text.
- Native Microsoft PowerPoint acceptance of the source deck.

## Not verified or pending

- **Native Microsoft PowerPoint: pending.** PowerPoint is not installed on this machine, so the open, Edit Data, save and reopen test was not run. The test was LibreOffice rendering plus inspection of the chart XML and the embedded workbooks.
- **Screen readers.** No screen-reader test was run on either PDF. The accessible PDF's reading order and tag tree were checked statically only.
- **Unused legend item.** The slide 4 waterfall legend still shows a "Decrease" item even though there are no decreases. That is the renderer's standard legend, and it is unchanged from draft 0.6. It is left alone to avoid redesigning the shared waterfall.
- **Layout drift.** The PDF is exported with LibreOffice, so layout in PowerPoint may differ slightly.

## Decisions for the maintainer

1. **Accessibility remediation.** Draft 0.7 now has a separate accessible PDF from `v07/remediate_pdf_v07.py`. The script is pinned to this deck, so it fails on any re-render. Decide whether later decks should get a re-targeted script or heading and artifact tagging in the exhibit export itself. Also decide which PDF a release would ship; packaging is a separate phase.
2. **Slide 4 legend.** Decide whether the waterfall should hide legend items for series it does not use. This is a shared-renderer change and would also alter draft 0.6 if re-rendered.
3. **Already resolved.** Draft 0.6 decisions 1 (the ownership donut), 2 (owner assignments on slide 13) and 4 (evidence limits) are resolved by draft 0.7 decisions A, B and C. Decision 3 still stands: the split between the base and option portions is not stated on any slide.
