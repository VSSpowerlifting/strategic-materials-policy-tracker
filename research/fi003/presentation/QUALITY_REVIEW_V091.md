# FI003 draft 0.9.1: decision-clarity refinement (proposed)

## Status

Proposed editorial and design refinement of draft 0.9. **Draft 0.8 remains the review baseline.** Draft 0.9 and 0.9.1 are both proposals until the maintainer adopts one. The publication HOLD stands. Nothing has been merged, published or deployed. This is not a new research or modeling phase.

## What the draft is

It is the same 16-slide decision report as draft 0.9. The argument and its order are unchanged, as are model 1.0, every figure, the source register, the 6 November research cutoff and the proposed recommendation. Five slides (11, 12, 14, 15 and 16) are reworded and relaid so that a senior executive new to the case can see the alternatives, what each one costs and why the recommendation follows.

## Diagnosis: slide 14

In draft 0.9, slide 14 listed differences without saying what they meant. The row labels assumed the reader already knew the deal: "Undrawn capacity", "From trigger", "Draw, then raise". The repeated "—" cells under Equity only made that option look incomplete. They did not show how it would respond to the same circumstances. The slide never stated the trade-off it was there to show:

- A revolver gives conditional liquidity if construction costs exceed cash. In return the company pays fees, must meet draw conditions, is exposed to covenants and takes on repayment.
- Equity only avoids those obligations. It may need a new raise if the project runs short.

## What changed

| Slide | Exhibit | Change | Why |
|---|---|---|---|
| **14** | **Equity plus revolver vs equity only** | The title now states the trade-off: *A revolver buys conditional overrun liquidity at the cost of fees, conditions, covenants and repayment*. The subtitle keeps the shared fact: both options raise the same $724.2m of equity at the same dilution. The rows are now five situations, each answered in a sentence for both options. See the table below. The annotation says that remaining capacity is conditional borrowing, not cash, and does not guarantee that an overrun is covered. | The reader sees how each option responds to the same five circumstances. Every Equity only cell now gives a substantive answer, not a dash. |
| 11 | Options | The title says what distinguishes the paths: *Four financing paths differ in what is committed now and what must hold later*. The columns are now What it is / In this case / Depends on, filled with sentence cells. Empty cells read "Not observed in this case". | Says what each path is and what it relies on. A bare "—" could be read as missing data. |
| 12 | Criterion matrix | The title gives the answer: *Only equity plus a revolver both funds the build up front and keeps later liquidity*. The subtitle names the cost: some covenant freedom, and debt service if drawn. It keeps "categorical marks, unweighted". | The recommendation's cost sits beside its advantage. |
| 15 | Condition tree | The title says the recommendation is conditional: *Equity plus a revolver holds only while three conditions hold; each failure points elsewhere*. The first node now reads "Cost to finish above cash plus borrowing capacity?" | Keeps cash and borrowing capacity separate in the test itself. |
| 16 | Objections | The columns are now Conceded / Answer / What remains, with the Answer column emphasised and sentence cells. The annotation is unchanged from 0.9. | Each objection shows what is conceded and what risk is left, not just a rebuttal. |
| 1, all | Cover, judgment label | The labels read 0.9.1. The cover states that 0.8 remains the baseline. | Version accuracy. |

Slide 14's situation rows:

| Situation | Equity + revolver | Equity only |
|---|---|---|
| Costs exceed cash on hand | May draw on $203m of remaining capacity if conditions are met | Needs a new raise on later terms; more dilution if it is equity |
| Cost while unused | About $0.71m a year in commitment fees | No facility cost |
| Before each draw | Representations must hold and no default may exist | No lender conditions |
| Covenant tests | $500m liquidity floor; leverage and coverage tests after trigger | No facility covenants |
| Repayment | Any loans due by Aug 2030, or earlier under a springing maturity | No repayment obligation |

Every figure and term already appears in draft 0.9 and its sources:

- the $203m remaining capacity (30 Jun and 30 Sep 2026);
- the $0.7105m expired commitment fees, the same figure as the 0.9 annotation;
- the $500m minimum liquidity covenant;
- the springing maturity and the August 2030 maturity;
- the $724.2m net equity.

None is new. The covenant cell says "liquidity floor", not "cash minimum". Before a trigger, the contract tests unrestricted cash plus contractual Cash Equivalents (C15, S09 §7.11). The covenant is also not a cash pledge, since cash, deposit and securities accounts are excluded from the collateral, subject to a proceeds carveback (C17, S09 §1.01). The draw-conditions cell restates S09 §4.02 (C53). The Equity only repayment cell was first drafted with a dilution comparison. That wording was dropped because both options carry the same equity dilution.

## Shared-code change and its effect on committed drafts

| Renderer | Option | Integrity rule |
|---|---|---|
| `role-matrix` | `layout.cellText: "short" \| "sentence"` | Ledger style only (`layout-option`). `sentence` allows cells of up to 64 characters and a row height of 0.86 in. The default stays 16 characters and 0.56 in. |

The option is opt-in, and omitting it leaves rendering unchanged. `tests/exhibit-system-v091-options.test.ts` covers the parse, the length limits and the ledger-only rule (3 tests). Re-rendering the committed draft 0.9 spec produced a **byte-identical PPTX** (`9b8e32d5…`). The committed 0.6–0.9 outputs were not regenerated. `git status` shows no change under `v09/` or `outputs/presentation-draft-v09/`.

**Gap found.** `exhibits:review --strict` did not report a role-matrix cell over 64 characters. Only `exhibits:render` refused it (`[cell-length]`). The review step does not appear to run the renderer's cell-length check. That should be fixed separately. For this draft, the render step was the effective gate, and the final spec passes both.

## Outputs

Inputs: `v091/build_spec.py`, `v091/spec.json`, `v091/export_pdf.sh`. Outputs: `outputs/presentation-draft-v091/`.

| File | SHA-256 |
|---|---|
| `fi003-jpmorgan-mp-materials-draft-0.9.1.pptx` | `58892a8e4a92931027bf35747131e85839dc821f4c65752b52a76f78de805a2b` |
| `fi003-jpmorgan-mp-materials-draft-0.9.1.manifest.json` | `bdd1fc96735aba7131ba5694c636116b05c76d30f7d985974e0bb72c441bbbbd` |
| `fi003-jpmorgan-mp-materials-draft-0.9.1.pdf` | `15db06bf5223e6ea3fc69f926baf7bdb96b0f04a078d4e43d56bd5e266e412ca` |
| `fi003-draft-0.9.1-contact-sheet.png` | `91be42e25f070acf06502cde12f4a42ac6f186d543560548be85f3ae8e4cdfa1` |
| `v091/spec.json` | `e08bd9e31b9ac4c75849206991d3df0ec207638c8124b43e1263ddf0b07160a7` |

The spec and PPTX are deterministic. The PDF and contact sheet come from LibreOffice and are not expected to be byte-reproducible across machines.

```sh
python3 research/fi003/presentation/v091/build_spec.py
npm run -s exhibits:review -- research/fi003/presentation/v091/spec.json --strict
npm run exhibits:render -- research/fi003/presentation/v091/spec.json research/fi003/outputs/presentation-draft-v091/fi003-jpmorgan-mp-materials-draft-0.9.1.pptx
bash research/fi003/presentation/v091/export_pdf.sh
```

The render step refuses to overwrite an existing PPTX.

## Verified

- The strict deck review passes, subject to the cell-length gap above. The render step also accepts the final spec.
- Changed slides 11, 12, 14, 15 and 16 were inspected at 150 dpi, and the whole deck was checked on the contact sheet. There is no overflow, clipping or collision.
- Figures and source references match draft 0.9. Model 1.0 was not touched.
- `npm run validate`, `typecheck` and `build` pass. `lint` reports 0 errors and 28 warnings, the same as before. `npm test` passes all 1,158 tests.

## Accessible PDF

**Not produced for 0.9.1**, as for 0.9. The 0.8 accessible PDF remains the accessible reference.

## Not verified or pending

- Opening, editing, saving and reopening in native Microsoft PowerPoint.
- Screen-reader reading order.
- **Human financial and editorial review of the new wording on slides 11, 12, 14, 15 and 16.** The slide 14 cells restate facility terms in plain language: the draw conditions, the covenant triggers and the springing maturity. A reviewer should confirm that each simplification holds against the credit agreement.
- Source-rights approval, publication authorization and the PR's merge conflicts with main. These are out of scope.

## Decisions for the maintainer

1. Choose the review baseline: 0.8 (current), 0.9 or 0.9.1.
2. If you choose 0.9.1, approve the new slide titles and the slide 14 situation wording.
3. Decide whether to fix the strict-review cell-length gap in a separate change.
