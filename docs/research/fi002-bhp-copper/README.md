# SMPT Financial Intelligence 002 — Research publication package

**Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision**
Near-term earnings exposure, replacement economics and the case for conditional investment readiness

Research cutoff: **5 November 2026**. **READY FOR EDITORIAL REVIEW.** Independent SMPT research; neither Goldman Sachs nor BHP commissioned, sponsored or endorsed it. Internal publication preparation only. No public release is authorized.

Start with the [14-page flagship PDF](output/SMPT_FI002_BHP_Copper_Research_Report.pdf) or [standalone editable HTML](output/SMPT_FI002_BHP_Copper_Research_Report.html). The [publication summary](output/SMPT_FI002_Publication_Summary.md) contains the abstract, findings and download inventory.

## Reader files

| Purpose | File |
| --- | --- |
| Editable report narrative | [Markdown](output/SMPT_FI002_BHP_Copper_Research_Report.md), with original SVG exhibits in `output/figures/` |
| Live 11-tab financial model | [University Google Sheet](https://docs.google.com/spreadsheets/d/1MysAjBqAQ4-63XPo7YtncDle3q4faZDsBpTaVBWsg1k/edit?usp=drivesdk) |
| Local editable model | [Excel workbook](output/SMPT_FI002_BHP_Copper_Model.xlsx) |
| Executive edition | [12-slide PowerPoint](output/SMPT_FI002_BHP_Copper_Strategy_Deck.pptx), [PDF](output/SMPT_FI002_BHP_Copper_Strategy_Deck.pdf) |
| Decision brief | [Two-page PDF](output/SMPT_FI002_BHP_Copper_Memo.pdf), [editable narrative](output/SMPT_FI002_BHP_Copper_Memo.md) |
| Evidence | [Source/access register](output/SMPT_FI002_Evidence_Register.csv), [major-claim matrix](output/SMPT_FI002_Claim_Source_Matrix.csv) |
| Technical methods | [Methodology](output/SMPT_FI002_Methodology.md), four calculation CSVs in `output/` |
| Research reconciliation | [Material corrections and differences](output/SMPT_FI002_Reconciliation.md) |
| Editorial gate and QA | [Quality review](output/SMPT_FI002_Quality_Review.md), [80-check result](output/SMPT_FI002_Verification_Results.json) |
| Eventual website phase | [Approval-pending publication handoff](output/SMPT_FI002_Website_Handoff.md) |
| Authorized durable delivery | [Existing university Drive folder](https://drive.google.com/drive/folders/1gSNclpsNdzgCbGy3EaQDqsV_NOUrI8Zf), account `ben.yang@gwmail.gwu.edu` |

The model and report are consistent: the main operating result uses BHP's disclosed FY26 sensitivity, not a forward earnings forecast. The 199/333/416ktpa calculations remain hypothetical reverse appraisal. Construction timing cannot be ranked without a with-build/no-build operating plan. The original Goldman annual-average note was not obtained; public reporting is clearly attributed.

## Provenance and branch boundary

This work resumes the local prototype originally created at detached HEAD `2286648f3bbb699eee5b6171f334792ffa2d545d`. Its complete useful outputs and builders are preserved in `archive/2026-11-04/`. The six-page prototype memo is superseded by the flagship report and shorter current brief; archived conclusions are not current publication claims.

The new isolated branch is `codex/fi002-research-publication`, based on `649d5ab30c765e863bc237efbbff3e26dccc1531` from `research/fi002-bhp-copper-handoff-2026-11-05`. [PR #202](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/202) remains the discoverable independent research baseline. Its `research/fi002/` directory is unchanged. The new draft PR is stacked on that branch to keep this package's review diff separate; do not merge either automatically.

Only `docs/research/fi002-bhp-copper/` is changed. No public data, website copy, schema, reviewer gate, CI or deployment file is changed. A private Drive upload is authorized delivery, not public release.

## Reproduce

`build/report-narrative.json` is the canonical final editorial narrative; edit it and run `report.py` to regenerate the matching PDF, Markdown and standalone HTML. Python calculations and ReportLab generate the report, two-page brief and original vector figures. The bundled `@oai/artifact-tool` authors the workbook and native PowerPoint objects. `openpyxl` is used for read-only verification and extraction of native update requests, not workbook authoring.

Current build order, from the repository root:

```sh
python3 docs/research/fi002-bhp-copper/build/research_v2.py
node docs/research/fi002-bhp-copper/build/build.mjs
python3 docs/research/fi002-bhp-copper/build/report.py
python3 docs/research/fi002-bhp-copper/build/executive_brief.py
node docs/research/fi002-bhp-copper/build/executive_deck.mjs
python3 docs/research/fi002-bhp-copper/build/export_deck_pdf.py
python3 docs/research/fi002-bhp-copper/build/write_support.py
python3 docs/research/fi002-bhp-copper/build/verify.py
```

Use the installed Codex primary runtime Node/Python binaries in this environment; the source records their font and presentation-validator paths. Python dependencies: ReportLab, pypdf, openpyxl, Pillow; Node: `@oai/artifact-tool`. The Node build directory resolves dependencies through a local ignored symlink to the bundled modules. Equivalent installations must update the runtime/font/validator paths. Node used here: 24.22.1. The original authoring environment's spreadsheet/presentation skills and finalizer are required for identical Office regeneration.

The presentation finalizer intentionally refuses to overwrite an existing final artifact or receipt. To regenerate, preserve the prior file/receipt under a new revision name and point the script to a new receipt path. Do not remove these protections or overwrite the dated prototype. PDF metadata and Office package IDs may vary on regeneration; compare numerical outputs and content, not regenerated binary hashes.

`native_update.py` builds bounded raw Google Sheets requests from the verified local workbook, but does not make network changes. The authenticated university connector applies them to the existing model. `build/native-v2-checks.json` records six actual native recalculations. `audit/SMPT_FI002_Native_Model_Readback.xlsx` is the final exported native snapshot used for the formula-cache comparison; it is an audit artifact, not a second active model. `readback.mjs` renders a new export from `build/native-readback.xlsx` when available. `verify.py` falls back to the durable audit snapshot. Formula manifests, local scenario checks, the presentation validation receipt and final verification results are retained in `build/`.

The calculation CSVs and Python arithmetic can be inspected without artifact-tool. Original primary financial documents remain linked; the package does not redistribute proprietary bank research or issuer-owned presentation exhibits.

## Delivery and next action

`output/SMPT_FI002_Delivery_Index.md` records verified university Drive links after upload. The final Git commit and draft PR are reported in the completion handoff. Editorial review is the next action. Any public download destination, website edit, sharing-permission change, merge or deployment requires separate authorization.

The final expert/editorial audit is recorded in the [Quality Review](output/SMPT_FI002_Quality_Review.md). It preserves the model and brief and updates the executive deck’s typography, palette and source locators without numerical changes. The completed research commit `f7515ca9968c32f74e7a40e7e4c4f8ee952d5263` remains the accessible pre-editorial baseline on [draft PR #203](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/203).

Deck revision: Presentation Standard v2 and its companion authenticity/exhibit rules were inspected on GitHub `main` at `b688516763447b669b6755d9083726e691753ac7`. The report follows the one-family research house style; the deck uses Georgia/Arial, the permitted installed fallback for Source Sans 3. The v5 finalization receipt validates a private revision under `output/editorial/revision-3/`; after review, its PPTX bytes were copied unchanged to the existing current filename. The PDF was regenerated through `export_deck_pdf.py` with verified Georgia/Arial embedding. For regeneration, use a fresh private revision/receipt path and promote only after QA.

Revision 4 (review copy, 9 November 2026): [`output/review/revision-4/`](output/review/revision-4/) holds an 11-slide editorial and visual redesign. It was rebuilt in the repository exhibit system with Archivo and the SMPT palette, has no kickers or micro-labels, and changes no figures. The folder contains the editable PPTX, the PDF, slide renders, a contact sheet and the [gate A–E QC record](output/review/revision-4/SMPT_FI002_rev4_QC.md). It awaits human publication review. The live 12-slide deck linked above stays current until the exact revision-4 release files are approved.

Release candidate 1 (9 November 2026): [`output/review/release-candidate-1/`](output/review/release-candidate-1/) holds a public-release candidate built from the revision-4 PPTX by [`release/make_release_candidate.py`](release/make_release_candidate.py). It removes the DRAFT · REVIEW GATES PENDING badge, the cover notice and the other internal labels, and changes no figures or wording. Archivo is embedded in the PDF. The [RC1 QC record](output/review/release-candidate-1/SMPT_FI002_RC1_QC.md) gives the hashes, font, LibreOffice and browser link checks. Revision 4 stays archived unchanged. RC1 awaits human approval of the exact files. The live deck, the public downloads and the current Drive presentation stay unchanged until then.
