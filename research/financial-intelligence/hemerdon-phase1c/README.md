# SMPT Financial Intelligence 001 — Hemerdon publication package

**READY FOR PUBLICATION REVIEW.** Research cutoff: **4 November 2026**. Produced **5 November 2026**. This package converts the accepted Phase 1A–1B record into original financial analysis and finished review files. It does not authorize public release.

## Read the publication

| Deliverable | Editable / source | Fixed edition |
|---|---|---|
| Eight-page financial memorandum | [Word](SMPT_FI001_Hemerdon_Financial_Memo.docx) | [PDF](SMPT_FI001_Hemerdon_Financial_Memo.pdf) |
| Ten-slide executive presentation | [PowerPoint](SMPT_FI001_Hemerdon_Strategy_Deck.pptx) | [PDF](SMPT_FI001_Hemerdon_Strategy_Deck.pdf) |
| Financial model | [Excel workbook](SMPT_FI001_Hemerdon_Financial_Model.xlsx) | [Model guide](SMPT_FI001_Model_Guide.md) |
| Evidence and methodology | [Appendix](SMPT_FI001_Evidence_Appendix.md) | 20 source records and 158 claim/input entries |
| Review and handoff | [Publication QC](SMPT_FI001_Publication_QC.md) | [Handoff](SMPT_FI001_Publication_Handoff.md) |
| Research abstract | [Abstract](SMPT_FI001_Research_Abstract.md) | |

## Controlling record

- [Phase 1A index](../hemerdon-phase1a/README.md), preserved at `4582fb529c86dffc1a6329218e8081fe16550043`.
- [Phase 1B evidence closure](../hemerdon-phase1b/financial-evidence-closure.md), accepted at `772f2f4c02631f533a0a893849c9bedb8a6ff8ad`.
- [Original dated funding bridge](../hemerdon-phase1b/funding-bridge.json) and [information-request checklist](../hemerdon-phase1b/information-request-checklist.md).
- [Draft PR #201](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/201).

The Phase 1C workbook is byte-identical to the accepted source. No original Phase 1A or Phase 1B file changed. All work is confined to this publication directory. No public site or application file changed.

## Production sources and validation

`publication-content.json` is the memo's reviewed narrative/table source and abstract. `publication-exhibits.json` records the four reconciliations, workbook cells, hash and citation aliases. `build_publication.py` creates the memo, source appendix, abstract and unchanged workbook copy from the controlling records. `build_deck.mjs` authors the native charts/tables and slide narrative, reconciles chart inputs to the same record, renders previews, and finalizes the PowerPoint. `style_pptx.py` applies SMPT hyperlink colors before final validation.

The deck embeds four literal chart-data workbooks for editing, with source provenance in notes. The embedded snapshots do not preserve the financial model's formulas and must not replace the separately delivered model. Exported charts remain original editable evidence exhibits.

`model-validation-results.json` is a fresh independent LibreOffice run of the publication copy: 32 cases, zero failures and zero cached differences across 167 formulas. `deck-validation-results.json` is the finalizer's structural/geometry/font/native-chart receipt. `publication-validation-results.json` records 130 cross-format checks and SHA-256 fingerprints. See QC for visual review and the boundaries of each check.

### Reproduce in the Codex bundled runtime

Use the dependency loader to resolve `PYTHON`, `NODE` and `NODE_MODULES`; do not install or modify repository packages. Python needs `python-docx`, `openpyxl`, `lxml` and `pypdf`. Deck authoring needs bundled `@oai/artifact-tool` and the presentation skill's finalizer. `build_deck.mjs` records this session's installed skill/runtime paths. Adapt those paths on another host. Rendering requires LibreOffice and Poppler. PDF fonts use Liberation Sans, SMPT's approved Arial-compatible family.

From the repository root, after assigning those runtime paths:

```sh
PHASE_C="$PWD/research/financial-intelligence/hemerdon-phase1c"
BUILD=/tmp/smpt-fi001-rebuild
mkdir -p "$BUILD"
"$PYTHON" "$PHASE_C/build_publication.py"
ln -s "$NODE_MODULES" "$BUILD/node_modules"
cp "$PHASE_C/build_deck.mjs" "$BUILD/build_deck.mjs"
RUNTIME_NODE_MODULES="$NODE_MODULES" "$NODE" "$BUILD/build_deck.mjs" "$PHASE_C" "$BUILD/previews"
```

The PowerPoint finalizer writes private files inside ignored `.build/`, then copies the validated deck to its delivery filename. The memo generator and final deck overwrite only Phase 1C generated deliveries. On an independent rebuild, use a separate copy of this publication directory if the accepted outputs must remain untouched. The recorded DOCX/PPTX ZIP bytes may change with metadata; reconciliation results must remain the same.

Render the DOCX using the document skill's `render_docx.py --emit_pdf`; copy its inspected PDF to the memo's delivery filename. Export the delivered PPTX through LibreOffice to its PDF filename. Render every PDF page with Poppler and inspect the images. Copy the finalizer's receipt to `deck-validation-results.json`, rerun the Phase 1B independent validator with the publication workbook as `--input`, then run:

```sh
"$PYTHON" "$PHASE_C/validate_publication.py"
"$PYTHON" -m unittest discover -s research/financial-intelligence/hemerdon-phase1a -p test_model.py
```

Rebuilding alone is not visual verification. Do not retain old QC or JSON receipts after changing their input files. Native Excel and PowerPoint execution are not represented as verified.

## Release gate

The substantive financial case supports instrument structure, dated expenditure and clearly defined scenarios. Current liquidity, complete current debt/funding gap, valuation, DSCR and repayment sufficiency remain outside scope. Independent human financial/editorial review, source-rights clearance and explicit user release authorization remain necessary. No original AMC tables, source PDFs or proprietary benchmark data are redistributed.
