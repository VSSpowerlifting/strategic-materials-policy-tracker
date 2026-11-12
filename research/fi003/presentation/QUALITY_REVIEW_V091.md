# FI003 draft 0.9.1: decision-clarity refinement (adopted review baseline)

## Status

**Draft 0.9.1 is the adopted working and reviewer baseline** (maintainer decision, 8 November 2026). Drafts 0.8 and 0.9 are kept unchanged as version history. Their outputs were not regenerated. The publication HOLD stands. Nothing has been merged, published or deployed. Model 1.0 is unchanged. This is not a new research or modeling phase. The recommendation is still a proposed editorial judgment that awaits Jiho's financial review, Ambrose's commercial review and Benjamin's approval.

## What the draft is

It is the same 16-slide decision report as draft 0.9. The argument and its order are unchanged, as are model 1.0, every figure, the source register, the 6 November research cutoff and the proposed recommendation. Five slides (11, 12, 14, 15 and 16) are reworded and relaid so that a senior executive new to the case can see the alternatives, what each one costs and why the recommendation follows.

## Diagnosis: slide 14

In draft 0.9, slide 14 listed differences without saying what they meant. The row labels assumed the reader already knew the deal: "Undrawn capacity", "From trigger", "Draw, then raise". The repeated "—" cells under Equity only made that option look incomplete. They did not show how it would respond to the same circumstances. The slide never stated the trade-off it was there to show:

- A revolver gives conditional liquidity if construction costs exceed cash. In return the company pays fees, must meet draw conditions, is exposed to covenants and takes on repayment.
- Equity only avoids those obligations. If costs exceed cash, it may need more funding, spending changes or a delay. A new equity issuance is one possible response, not the only one.

## What changed

| Slide | Exhibit | Change | Why |
|---|---|---|---|
| **14** | **Equity plus revolver vs equity only** | The title states the trade-off: *A revolver buys conditional overrun liquidity at the cost of fees, conditions, covenants and repayment*. The subtitle keeps the shared fact: both options raise the same $724.2m of equity at the same dilution. The rows are five situations, each answered in a sentence for both options (table below). Equity only cells name "this financing option", so they do not claim the company has no other obligations. The annotation says that remaining capacity is conditional borrowing, not cash, and may not cover an overrun, and that the $500m floor is a liquidity test, not cash set aside for the build. | The reader sees how each option responds to the same five circumstances, and every Equity only cell gives a substantive answer. |
| 11 | Options | Title: *Four financing paths differ in what is committed now and what must hold later*. Columns: What it is / In this case / Depends on, with sentence cells. Empty cells read "Not observed in this case". Equity only "Depends on": "More funding, spending changes or delay if costs exceed cash". | Says what each path is and what it relies on. A bare "—" could be read as missing data. |
| 12 | Criterion matrix | Title: *Only equity plus a revolver pairs equity raised up front with conditional later borrowing*. Subtitle: *No option is shown to fully fund 10X; this one costs covenant freedom and debt service if drawn; unweighted*. Criteria rows: "Capital raised or committed before build" and "Conditional liquidity for later". | The 0.9.1 proposal title ("both funds the build up front") implied full funding. There is no verified 10X cost-to-complete, so the slide now separates equity raised up front from borrowing that is conditional and later. |
| 15 | Condition tree | Title: *Equity plus a revolver holds only while three conditions hold; each failure points elsewhere*. The first node reads "Cost to finish above cash plus borrowing capacity?" | Keeps cash and borrowing capacity separate in the test itself. |
| 16 | Objections | Columns: Conceded / Answer / What remains, with the Answer column emphasised and sentence cells. Annotation unchanged from 0.9. | Each objection shows what is conceded and what risk is left. |
| 1, all | Cover, judgment label | Cover: "Review baseline for financial and commercial review; drafts 0.8 and 0.9 are historical. Publication hold remains in place." Judgment label: "draft 0.9.1 (review baseline)". | Version accuracy. |

Slide 14's situation rows:

| Situation | Equity + revolver | Equity only |
|---|---|---|
| Costs exceed cash on hand | May draw on $203m of remaining capacity if conditions are met | More funding, spending changes or delay; new equity is one route |
| Cost while unused | About $0.71m a year in commitment fees | No facility cost from this financing option |
| Before each draw | Representations must hold and no Default may exist | No draw conditions from this financing option |
| Covenant tests | Until trigger, $500m liquidity floor; then leverage and coverage | No covenants from this financing option |
| Repayment | Any loans due by Aug 2030, or earlier under a springing maturity | No repayment from this financing option |

## Source check of the slide 12 and 14 wording

Every figure and term already appears in draft 0.9 and its sources. None is new.

- **$203m remaining capacity** (30 Jun and 30 Sep 2026): conditional borrowing capacity, not cash. It is kept apart from cash on hand and from the $500m covenant on both slides.
- **About $0.71m a year commitment fee**: model 1.0's fee on the $203m remaining capacity at zero draw, at the 0.35% a year pre-trigger rate (S09 §2.09(a)) on an illustrative 360-day rate year. It is not the $7.4m aggregate commitment and structuring fee expense.
- **$500m Minimum Liquidity Covenant**: a liquidity test, not cash set aside for the build. Before a Covenant Trigger Event it tests unrestricted cash plus contractual Cash Equivalents (C15, S09 §7.11). The leverage and coverage tests apply after the trigger. It is not a cash pledge: cash, deposit and securities accounts are excluded from the collateral, subject to a proceeds carveback (C17, S09 §1.01).
- **Draw conditions** (C53, S09 §4.02): the representations must be true in all material respects, no Default may exist or result, and a Request for Credit Extension must be made. The slide cell states the first two, which are the substantive ones. Performance of the Defense agreements (S09 §6.16) is reached through the no-Default condition. The deck does not infer that any default exists.
- **Maturity**: August 2030, or earlier under a springing maturity.
- **$724.2m net equity**: the same for both slide 14 options.

The Equity only cells were checked against the requested wording: they refer to obligations "from this financing option", and the overrun response names more funding, spending changes or a delay, with new equity as one route.

**S09 retrieval note.** The S09 clauses (§1.01, §2.09(a), §4.02, §6.16, §7.11) were re-read on 8 November 2026 from a live SEC retrieval of 1,091,480 bytes (SHA-256 `33b1ed8d…`). `sources.json` registers 1,091,491 bytes (`7bff1464…`). The clause text read is consistent with the claim register. The difference is in the served bytes and was not investigated further. The re-read is therefore not a hash-verified match to the registered copy. `sources.json` was not changed.

## Shared-code change and its effect on committed drafts

| Renderer | Option | Integrity rule |
|---|---|---|
| `role-matrix` | `layout.cellText: "short" \| "sentence"` | Ledger style only (`layout-option`). `sentence` allows cells of up to 64 characters and a row height of 0.86 in. The default stays 16 characters and 0.56 in. |

The option is opt-in, and omitting it leaves rendering unchanged. `tests/exhibit-system-v091-options.test.ts` covers the parse, the length limits and the ledger-only rule (3 tests). Re-rendering the committed draft 0.9 spec produced a **byte-identical PPTX** (`9b8e32d5…`). The committed 0.6–0.9 outputs were not regenerated.

**Gap found.** `exhibits:review --strict` does not report a role-matrix cell over 64 characters. Only `exhibits:render` refuses it (`[cell-length]`). For this draft, the render step was the effective gate, and the final spec passes both. The gap should be fixed separately.

## Outputs

Inputs: `v091/build_spec.py`, `v091/spec.json`, `v091/export_pdf.sh`, `v091/remediate_pdf_v091.py`. Outputs: `outputs/presentation-draft-v091/`.

| File | Role | SHA-256 |
|---|---|---|
| `fi003-jpmorgan-mp-materials-draft-0.9.1.pptx` | **Original editable PowerPoint** (native charts with embedded workbooks) | `6d92e49690c5cd627a9fdea720a97fa1961b47f0371b37d3f19e51794e4445df` |
| `fi003-jpmorgan-mp-materials-draft-0.9.1-accessible.pdf` | **Remediated accessible PDF** (reading copy) | `dd0541d2b91eb3a176f113aac90262bacb7122107a5d1b62d7b4d918e631d54e` |
| `fi003-jpmorgan-mp-materials-draft-0.9.1-accessible.receipt.json` | Remediation receipt | `366c44fec2ba5908962590ce0e8e831f7dac1461b358a2d8242382033380bb50` |
| `fi003-jpmorgan-mp-materials-draft-0.9.1.pdf` | LibreOffice export (remediation source) | `18b73a441e7e1e0eff8dcf64cbcec19290d0193c1b885db3d43ea45c52c1303f` |
| `fi003-jpmorgan-mp-materials-draft-0.9.1.manifest.json` | Render manifest | `780bbc6934e59bee28d127d1c05724f9444997930e16f9062018553941c8bcc1` |
| `fi003-draft-0.9.1-contact-sheet.png` | Contact sheet | `a0ee50b021b615bc0270fb85d5d6e69960a2088bfd95d1893183a70d0adc2541` |
| `v091/spec.json` | Deck spec | `6ba0abe0abc8dd568252971e9ed9adaae6de21e2c6f53aaa5cfe1b0d33f6b300` |

The spec and PPTX are deterministic. The PDF and contact sheet come from LibreOffice and are not expected to be byte-reproducible across machines. The accessible PDF is pinned to the source PDF hash above.

```sh
python3 research/fi003/presentation/v091/build_spec.py
npm run -s exhibits:review -- research/fi003/presentation/v091/spec.json --strict
npm run exhibits:render -- research/fi003/presentation/v091/spec.json research/fi003/outputs/presentation-draft-v091/fi003-jpmorgan-mp-materials-draft-0.9.1.pptx
bash research/fi003/presentation/v091/export_pdf.sh
uv run -q --no-project --with pymupdf==1.26.4 --with pypdf==6.14.2 python research/fi003/presentation/v091/remediate_pdf_v091.py
uv run -q --no-project --with pypdf==6.14.2 python -m unittest research/fi003/test_presentation_v091_accessibility.py
```

The render step refuses to overwrite an existing PPTX.

## Verified

- Strict deck review: 0 hold, 0 review, 0 info findings, subject to the cell-length gap above. The render step also accepts the final spec.
- All 16 slides were inspected at 150 dpi, individually for the changed slides and on the contact sheet. There is no overflow, clipping or collision. The slide 14 annotation clears the source line.
- The PDF has 16 pages, Archivo embedded and no raster images.
- **Charts and embedded data.** The donut (slide 6), the revolver stacked bar (slide 7) and the liquidity waterfall (slide 8) are native charts. Their chart XML and embedded `.xlsx` workbooks are byte-identical to draft 0.9, so their values did not change.
- Figures and source references match draft 0.9. Model 1.0 was not touched. All 48 link annotations (14 unique URLs) point to URLs registered in `sources.json`. Links were not fetched live in this pass.
- `npm run validate`, `typecheck` and `build` pass. `lint` reports 0 errors and 28 warnings, the same as before. `npm test` passes all 1,158 tests.

## Accessible PDF

Produced by `v091/remediate_pdf_v091.py`, ported from the 0.8 remediation and pinned to the 0.9.1 source PDF. Receipt status: **PASS**.

- Structure: 16 H1 slide titles and 3 H2 headings. 7 tables with 27 header cells and 135 data cells.
- Figures: 170 Figure tags before (166 without alt text), 9 after (0 without alt text). The 9 are the three charts and six diagrams. Their alt text is derived from the spec. Decorative shapes and ledger rules are artifacts. The 0.9.1 ledgers and criterion cells are native text.
- 48 link annotations, all retained.
- Every page is pixel-identical and text-identical to the source PDF.
- `test_presentation_v091_accessibility.py` passes (10 tests; 20 with the 0.8 test).

## Not verified or pending

- Opening, editing (including Edit Data on the charts), saving and reopening in native Microsoft PowerPoint. The PPTX was checked through its XML, LibreOffice and the strict review only.
- A screen-reader pass of the accessible PDF, and a full PDF/UA or WCAG audit. The link annotations lack `/Contents` descriptions.
- **Human financial and editorial review** of the wording on slides 11, 12, 14, 15 and 16. This is assigned to Jiho (financial) and Ambrose (commercial).
- Source-rights approval, publication authorization and the PR's merge conflicts with main. These are out of scope.
- **Drive upload not done.** This session's Drive connector could not reach the private FI003 folder. A title search found nothing, and the known draft 0.5 Slides and model-sheet IDs returned "not found". The PPTX and the accessible PDF are staged with their upload titles and hashes in [DRIVE_UPLOAD.md](../outputs/presentation-draft-v091/DRIVE_UPLOAD.md). No folder was created and no sharing was changed.

## Decisions for the maintainer

1. Confirm the slide 12 and slide 14 wording after Jiho's and Ambrose's reviews.
2. Decide whether to fix the strict-review cell-length gap in a separate change.
