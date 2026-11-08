# FI003 presentation draft 0.8: strategic recommendation and verification report

Status: proposed draft for maintainer review. The publication HOLD stays in place. Draft 0.7 remains the baseline for Jiho's independent assessment (feedback expected about 16–17 November 2026); draft 0.8 does not replace it for that review. A clean build does not authorize publication, and this report records no financial, editorial or human approval.

## What draft 0.8 is

Draft 0.8 turns the FI003 case into a decision-oriented strategy report for the CFO and board of a hypothetical U.S. critical-minerals company, with implications for lenders. It compares four financing options against eight criteria, states a recommendation, defends it against the strongest alternative and answers six objections in the body.

Every recommendation, mark and trigger in the deck is labelled on the slide as: "Proposed editorial judgment, draft 0.8, 8 November 2026; pending maintainer review." None is presented as a decision by MP Materials, JPMorgan or any government.

Unchanged: model 1.0, the source registers (`sources.json`, `evidence.csv`), the exhibit CSVs, every calculation, the historical facts and the 6 November 2026 research cutoff. Draft 0.7 and all earlier outputs are byte-for-byte unchanged.

## The recommendation (editorial judgment)

**Raise permanent equity first and hold an undrawn committed revolver as a conditional backstop** ("equity plus revolver").

- **Why.** The case shows equity delivered $724.2m of net cash with no fixed charges before revenue, while the $1bn committed facility expired undrawn after $7.4m of commitment fees. The revolver adds $203.0m of undrawn availability (of $275m, with $72m used by letters of credit) for an unused fee of about $0.71m a year. Liquid assets still fell $492.4m, so a backstop has real value during commissioning, which is expected from 2028 with no disclosed cost-to-complete.
- **What it is not.** It is not a cost-of-capital ranking: loan terms are not public. It is not an optimal structure and not a fully funded plan.

### Why it beats the strongest alternative (equity only)

Slide 14 compares the two directly. They raise the same cash with the same dilution (8.31% of the pre-offering basic count; 7.68% of the isolated post-offering base). The difference is the revolver alone:

| Revolver adds | Revolver costs |
|---------------|----------------|
| $203.0m of conditional, undrawn liquidity for commissioning delay | About $0.71m a year in unused fees |
| | Covenant tests that start at a trigger (headroom not disclosed) |
| | A 2030 springing maturity |

The judgment is that a small, known fee buys conditional liquidity when cost-to-complete is undisclosed. Equity only wins if covenant tests would bind before 10X revenue; that is a stated reversal trigger, not a hidden assumption.

### Conditions and reversal triggers (slide 15)

| If | Then |
|----|------|
| The equity window is closed | Committed debt, or delay to milestones |
| Cost-to-complete exceeds cash plus undrawn capacity | Raise more equity first |
| Covenant tests would bind before 10X revenue | Equity only |
| Otherwise | Equity plus revolver |

The slide also states the transfer limit: a sponsor without an anchor offtake, a price floor or a fallback preferred may not have the equity window MP had.

## Objections and how they are handled (slide 16)

Each objection is answered in the body with what is conceded, the answer and the limit kept.

| Objection | Conceded | Answer | Limit kept |
|-----------|----------|--------|------------|
| Equity is not always cheaper | Cost is not ranked | The case turns on fixed charges before revenue, not price | No public loan terms |
| The $1bn commitment expired undrawn | It was never funded | It was a bridge to the offering, not a loan used | Commitment fees were still paid |
| JPMorgan acted with Goldman and others | Roles were joint | Roles are stated per filing (slide 3) | No fee split is disclosed |
| Government support does not remove risk | Risk remains | Only named risks are treated as shifted | MP still funds the build |
| A revolver is conditional, not cash | It is not cash | It is shown as a backstop only, never as funding | Covenant tests apply |
| There is no optimal or fully funded plan | No optimum is claimed | The deck sets triggers instead | No cost-to-complete estimate |

## What changed from draft 0.7

Draft 0.7 had 13 slides; draft 0.8 has 16 (plus cover). Slides carried over keep their exhibits, data and evidence references; the changes are in framing.

| Page | Slide | Change |
|------|-------|--------|
| 1 | Cover | Version 0.8; audience line |
| 2 | Executive answer | **New.** States the recommendation with five figures from the record, each labelled; an annotation says they are not additive and cost of capital is not ranked |
| 3–10 | Case evidence | Carried from 0.7 (roles, timeline, replacement, share waterfall, revolver, liquidity, milestones, counterparties) with titles reworded as decision evidence. Slide 6's waterfall no longer shows an unused "Decrease" legend item (see shared code) |
| 11 | Options | **New.** Four options, each with its instrument, case evidence and main assumption. Delay has no case evidence, and the slide says so |
| 12 | Criterion matrix | **New.** Seven criteria × four options, categorical marks only (Meets / Partly / Does not / Not stated). No scores, weights or totals; the renderer rejects them |
| 13 | Clause condition tree | Carried from 0.7 |
| 14 | Strongest alternative | **New.** Equity plus revolver against equity only |
| 15 | Reversal triggers | **New.** Decision tree of conditions and triggers |
| 16 | Objections | **New.** Replaces 0.7's "Recommended considerations" slide; the six objections, each with conceded / answer / limit kept |

The eight criteria from the brief appear as seven rows on slide 12: "flexibility" is carried by the liquidity and commissioning-delay rows and by the reversal triggers, not by a separate mark.

### Criterion marks (slide 12)

| Criterion | Committed debt | Equity only | Equity + revolver | Delay to milestones |
|-----------|----------------|-------------|-------------------|---------------------|
| Funding certain | Partly | Meets | Meets | Does not |
| No dilution | Meets | Does not | Does not | Partly |
| No debt service pre-revenue | Does not | Meets | Partly | Meets |
| Few covenants | Not stated | Meets | Partly | Meets |
| Liquidity to draw later | Partly | Does not | Meets | Partly |
| Low refinancing exposure | Not stated | Meets | Partly | Meets |
| Absorbs commissioning delay | Not stated | Partly | Partly | Does not |

"Not stated" marks where the record does not support a judgment for committed debt (its terms were never disclosed). The marks are editorial judgments and are not summed.

## Evidence limits kept on the slides

| Limit | Where |
|-------|-------|
| No cost-of-capital ranking; loan terms not public | Slides 2, 14, 16 |
| Covenant headroom not disclosed; tests start at a trigger | Slides 8, 14, 16 |
| No cost-to-complete disclosed; no fully funded plan | Slides 9, 15, 16 |
| JPMorgan's fees and internal credit decisions not disclosed | Slides 3, 16 |
| Government support's effect on equity demand not isolated | Slide 16 |
| Delay option has no case evidence | Slide 11 |

## Shared-code changes

Both are in `scripts/exhibit-system/renderers/` and apply to any re-render.

- **`waterfall.ts`.** The legend now keys only the movements the bridge draws: "Increase" appears only if a step increases, "Decrease" only if one decreases. This resolves draft 0.7 maintainer decision 2.
- **`criterion-matrix.ts`.** Row height now shrinks (never grows) so the table and the marks key fit the exhibit area at the seven-criterion maximum. First used by draft 0.8.

**Effect on committed drafts.** The draft 0.6 and 0.7 specs were re-rendered with the changed code into a scratch directory. In both, every zip entry is byte-identical to the committed PPTX except `ppt/slides/slide4.xml`, the share waterfall, which loses its unused "Decrease" legend item (all 13.591m movements are increases). The liquidity waterfall has movements in both directions and is unchanged. Neither draft uses the criterion matrix. The committed draft 0.6 and 0.7 files are not regenerated and stay as reviewed.

## Outputs (`research/fi003/outputs/presentation-draft-v08/`)

| File | SHA-256 |
|------|---------|
| `fi003-jpmorgan-mp-materials-draft-0.8.pptx` (editable: native charts with embedded workbooks, native tables, shapes and text; Archivo) | `dfc9ff9dc73d649677f73b74d1b7e3b4b7d25b53011971fb184033aec68394ae` |
| `fi003-jpmorgan-mp-materials-draft-0.8.manifest.json` (`review_gates: pending-human-review`, `publication_authorization: not-granted`) | `3ed887466855cf69419b77400d50e1623bde33597d5a23e7b81dc1a46fa45f8b` |
| `fi003-jpmorgan-mp-materials-draft-0.8.pdf` (tagged export; Archivo embedded) | `b878f752493945bd69d0453531a6f4cc1d221982d7c1e70b64ecd88dcf9a6189` |
| `fi003-jpmorgan-mp-materials-draft-0.8-accessible.pdf` | `12689294e7a34b5e38384e58edc6aee66cffa539fb995859b8d45a406ab9ab73` |
| `fi003-jpmorgan-mp-materials-draft-0.8-accessible.receipt.json` | `43c6c270d75c2b71774e2e84e77c2d0171df52504767ad1367daa858279037b1` |
| `fi003-draft-0.8-contact-sheet.png` | `046a098a1431495daa323cc3004e33b6d2498b52d1387f92d1f21863034208bf` |

`v08/spec.json` sha256 is `99bf1a729109f30cbf56d199f4777271ef2163fe1838f1870e728f5693f7467e`.

To reproduce from the repository root (delete the existing PPTX, manifest and PDFs first; the renderer refuses to overwrite):

```bash
python3 research/fi003/presentation/v08/build_spec.py
npm run exhibits:render -- research/fi003/presentation/v08/spec.json research/fi003/outputs/presentation-draft-v08/fi003-jpmorgan-mp-materials-draft-0.8.pptx
bash research/fi003/presentation/v08/export_pdf.sh
uv run --no-project --with pymupdf==1.26.4 --with pypdf==6.14.2 python research/fi003/presentation/v08/remediate_pdf_v08.py
```

## Verified

- **Spec review.** `npm run exhibits:review -- research/fi003/presentation/v08/spec.json --strict` passes, including the criterion matrix's no-score and aligned-marks checks.
- **Structural verifier.** `npm run exhibits:verify -- --deck … --manifest …` passes, including the Archivo chart-typeface check.
- **Visual inspection.** Every page inspected on the contact sheet, and pages 2, 11, 12, 14, 15 and 16 at full size. No overflow or overlap; source footers and the editorial-judgment label are present on every content slide.
- **Figures against the record.** Every number on the new slides (724.2, 747.5, 22.4, 275, 72, 203.0, 0.7105, 7.4, 8.31%, 7.68%, 492.4, 2028, 2030) traces to the frozen model 1.0 outputs and the existing exhibit CSVs. No new figure was computed for draft 0.8.
- **PDF and PPTX correspond.** 16 pages, same order and text, exported from this PPTX by `export_pdf.sh`.

## Accessible PDF

`v08/remediate_pdf_v08.py` writes a separate accessible PDF from the export, as for draft 0.7. The export itself is left unremediated. The receipt status is PASS.

| Check | Draft 0.7 accessible | Draft 0.8 accessible |
|-------|----------------------|----------------------|
| Pages | 13 | 16 |
| Tagged, `/Lang` en-US, title shown | Yes | Yes |
| Slide headings | 13 H1, 4 H2 | 16 H1, 3 H2; every slide opens with one H1 |
| Decorative vectors artifacted | 147 | 255 |
| Figures, all with Alt text | 8 | 9 |
| Tables (TH / TD / TR) | 5 (18 / 77 / 27) | 7 (27 / 146 / 45) |
| Links | 34 | 48; per page 0, 4, 4, 4, 4, 2, 3, 1, 5, 4, 4, 3, 1, 2, 2, 5 |
| Pages pixel- and text-identical to the export | 13 of 13 | 16 of 16 |

On every page the links equal that slide's `evidence_refs` in `v08/spec.json`, and every URL matches `research/fi003/sources.json`. `test_presentation_v08_accessibility.py` repeats the structural checks on the committed files; with the draft 0.7 tests, 19 of 19 pass.

These are bounded static checks, not a PDF/UA (ISO 14289) or WCAG audit. No accessibility certification is claimed.

## Not verified or pending

- **Native Microsoft PowerPoint.** Not installed here; open, Edit Data, save and reopen were not tested. LibreOffice rendering plus chart XML and workbook inspection only.
- **Screen readers.** No NVDA, JAWS or VoiceOver pass on either PDF.
- **Criterion and role-matrix marks** (slides 3, 11, 12, 14, 16) are artifacts in the accessible PDF. Each cell carries its mark as text, but the key text refers to glyphs that assistive technology does not announce.
- **Layout drift.** The PDF is a LibreOffice export; PowerPoint layout may differ slightly.
- **Human review.** No human has reviewed the recommendation, the marks or the triggers.

## Decisions for the maintainer

1. **Adopt or reject the recommendation.** It is labelled as a proposed editorial judgment. Decide whether FI003 should carry an explicit recommendation at all, or keep 0.7's considerations framing.
2. **Criterion marks.** Review the 28 marks on slide 12, especially the "Not stated" marks for committed debt and "Partly" for equity plus revolver on covenants and refinancing.
3. **Which draft goes to Jiho.** Draft 0.7 stays the independent-review baseline. Decide whether 0.8 is shared after that feedback, or folded into a later draft.
4. **Shared-renderer legend change.** Confirm the waterfall legend change; it alters draft 0.6 and 0.7 slide 4 if they are ever re-rendered.
5. **Still open from draft 0.6.** Decision 3 (the base and option split is not stated on any slide) is unchanged.
