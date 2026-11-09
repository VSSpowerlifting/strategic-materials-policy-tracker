# FI003 draft 0.9: visual and editorial refinement (historical)

## Status

**Historical.** Superseded by draft 0.9.1, which the maintainer adopted as the working and reviewer baseline on 8 November 2026 ([QUALITY_REVIEW_V091](QUALITY_REVIEW_V091.md)). This record and the 0.9 outputs are kept unchanged as version history. At the time of writing, 0.9 was a proposed visual revision of draft 0.8. The publication HOLD stands. Nothing has been merged, published or deployed.

## What the draft is

The same 16-slide decision report as draft 0.8. The argument, its order, model 1.0, every figure, the source register, the 6 November research cutoff and the proposed recommendation are unchanged. This pass changes how the exhibits carry the argument. It does not change what they say.

The audience is a senior finance or strategy reader. The aim was fewer reading aids, stronger hierarchy on the decision slides, and interpretation that states financial consequences, not mechanics.

## Diagnosis: slides 7 and 8 "blur"

The PDF is not raster. `pdfimages -list` reports no images on any page. Slides 7 (revolver capacity, stacked bar) and 8 (liquidity bridge, waterfall) are native PowerPoint charts with embedded workbooks, and they export as vector paths with Archivo text. The softness came from the 80-dpi PNG thumbnails used for earlier contact sheets. Draft 0.9 previews are rendered at 150 dpi from the PDF. The chart pipeline needed no change for sharpness. Both slides still got hierarchy fixes (see below).

## What changed

| Slide | Exhibit | Change | Why |
|---|---|---|---|
| 1 | Cover | Version line reads 0.9 and states that 0.8 remains the baseline and the HOLD stands | Prevents a reader taking 0.9 as adopted |
| 2 | Executive answer | Notes heading "WHAT EACH FIGURE MEANS" | Labels the notes as financial meaning, not a key |
| 3 | Bank roles | Dot matrix becomes a text ledger: each cell states the role ("Joint largest", "Smaller share"); empty cells read "Not named"; the Underwriting column is emphasised | Repeated circles needed a legend; words carry the role directly |
| 4 | Financing timeline | Reading-convention note removed | The marker shapes are self-evident beside dated labels |
| 7 | Revolver capacity | Bars keep chronological order; legend widths fit the labels | A sort by total reordered the dates and hid the trend |
| 8 | Liquidity bridge | "Cash capital spending" and "Financing cash flows" value labels set bold | These are the two movements the slide argues from |
| 9 | Milestone strip | Convention note removed | Reported and targeted states are already distinguished |
| 10 | Counterparty map | Relationship caption ("equal spokes carry no magnitude") removed from the exhibit and subtitle | It explained how to read the chart; the methodology note keeps the caveat |
| 11 | Options | Dot matrix becomes a ledger; empty cells "—"; subtitle shortened | Same reasoning as slide 3 |
| **12** | **Criterion matrix** | Marks replaced by text ("Meets", "Partly", "Does not"); new decision subtitle: *Only equity plus a revolver meets both funding certainty and later liquidity; categorical, unweighted* | The circles repeated a legend lookup on every cell; the subtitle now gives the answer and the caveat |
| 13, 15 | Condition trees | Legend and kind note removed; a falling branch's label sits below its line | Connectors had crossed labels; the highlighted route carries the example alone |
| **14** | **Equity alone vs equity plus revolver** | Ledger with the "Equity+revolver" column emphasised; the two identical "Same equity" / "Same" rows removed, and the fact moved to the subtitle ("both raise the same equity at the same dilution"); annotation tightened | The rows carried no difference; the slide now shows only where the options differ |
| **16** | **Objections** | Ledger with the "Answer" column emphasised | Puts the reader's eye on the response, not on the objection grid |
| all | Judgment label | Reads "draft 0.9" | Version accuracy |

The donut on the equity slide and both waterfalls are kept. No caveat was removed. Where a caveat lived only in a reading aid, it now sits in the subtitle (slides 12 and 14) or stays in the notes and methodology.

## Shared-code changes and their effect on committed drafts

All renderer options are **opt-in**. Omitting an option parses to `undefined`, and the renderer then behaves as before.

| Renderer | Option | Integrity rule |
|---|---|---|
| `waterfall` | `emphasis: string[]` (bold step value labels) | `accent-resolves`: must name a step, not the start or end |
| `stacked-bar` | `keepOrder`, `legendWidths` | width count must equal component count |
| `criterion-matrix` | `display: "marks" \| "text"` | unknown values rejected at parse |
| `condition-tree` | `conventionNote`, `labelClear` | booleans only |
| `role-matrix` | `layout.style: "marks" \| "ledger"`, `emptyText`, `emphasisColumn` | `accent-resolves` for the column; `layout-option` flags ledger-only options used without the ledger; `keyText` stays required without a style |
| `counterparty-map` | `showRelationship` | — |
| `two-lane-timeline`, `evidence-milestone-strip` | `conventionNote` | — |
| `exhibit-with-interpretation` | `notesHeading` | — |

`tests/exhibit-system-v09-options.test.ts` covers parsing, the integrity rules and the opt-in default (8 tests). Re-rendering the committed draft 0.8 spec produces a **byte-identical PPTX**. Its manifest differs only in the absolute spec path. The committed 0.6, 0.7 and 0.8 outputs were not regenerated.

## Outputs

Inputs: `v09/build_spec.py`, `v09/spec.json`, `v09/export_pdf.sh`, `v09/contact_sheet.py`. Outputs: `outputs/presentation-draft-v09/`.

| File | SHA-256 |
|---|---|
| `fi003-jpmorgan-mp-materials-draft-0.9.pptx` | `9b8e32d5303b5b0806706d23b3f9ae9ae8583f060adc1ff87e6c80e5c136ef29` |
| `fi003-jpmorgan-mp-materials-draft-0.9.manifest.json` | `90f96c69116b234a65fe96cf34772e0e91729b5beec005be9b875f9686424d85` |
| `fi003-jpmorgan-mp-materials-draft-0.9.pdf` | `b5187bce429431740b17fcb0b55ee02e83c5a35427640bd6dc53a5a718388541` |
| `fi003-draft-0.9-contact-sheet.png` | `c8b3a95bb9fb7f6b77302df293c76aea897d3f0896312499be425840b900230a` |
| `v09/spec.json` | `33b52f2ba4d289f7f3ae85c287ac8e1ab870e925d213a5a70b18fb2767eef1db` |

The PDF and contact sheet come from LibreOffice and are not expected to be byte-reproducible across machines. The spec and PPTX are deterministic.

```sh
python3 research/fi003/presentation/v09/build_spec.py
npm run -s exhibits:review -- research/fi003/presentation/v09/spec.json --strict
npm run exhibits:render -- research/fi003/presentation/v09/spec.json research/fi003/outputs/presentation-draft-v09/fi003-jpmorgan-mp-materials-draft-0.9.pptx
bash research/fi003/presentation/v09/export_pdf.sh
```

The render step refuses to overwrite an existing PPTX.

## Verified

- Strict deck review: 0 hold, 0 review, 0 info findings.
- All 16 slides were rendered and inspected at 150 dpi, individually and on the contact sheet. No overflow, clipping, connector/label collision or orphaned legend was found.
- The PDF has 16 pages, Archivo embedded (subset TrueType) and no raster images.
- Figures, labels and source references match draft 0.8 slide for slide. Model 1.0 was not touched.
- `npm run validate`, `typecheck` and `build` pass. `lint` reports 0 errors and 28 warnings, none in the changed renderers' new code paths. `npm test` passes 1,155 of 1,155, including the new option tests.

## Accessible PDF

**Not produced for 0.9.** An accessible PDF was later produced for the adopted draft 0.9.1 (`v091/remediate_pdf_v091.py`). `v08/remediate_pdf_v08.py` is pinned to the 0.8 source hash, page artifacts and heading counts. Porting it is a separate step once the maintainer decides whether 0.9 replaces 0.8. The 0.8 accessible PDF remains the accessible reference. The 0.9 PDF is LibreOffice-tagged only and has not been remediated or link-audited.

## Not verified or pending

- Native Microsoft PowerPoint open, Edit Data, save and reopen.
- Screen-reader reading order. The ledger cells are native text, which should read better than glyph marks, but this has not been tested.
- Human financial and editorial review of the revised subtitles on slides 12 and 14, which restate the existing conclusion in new words.
- Source-rights approval, publication authorization and the PR's merge conflicts with main. These are out of scope for this pass.

## Decisions for the maintainer

Resolved on 8 November 2026: draft 0.9.1, not 0.9, was adopted as the review baseline, and its accessible PDF was produced. The original list is kept below.


1. Adopt 0.9 as the review baseline, or keep 0.8 and treat 0.9 as a design proposal.
2. If adopted, approve the reworded subtitles on slides 12 and 14, and decide whether Jiho and Ambrose should receive 0.9 in place of 0.8.
3. If adopted, authorize porting the accessible-PDF remediation to 0.9.
