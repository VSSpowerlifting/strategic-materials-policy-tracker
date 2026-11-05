# FI001 presentation v2 — approved public edition

**Inside Tungsten West's £71 Million Restart Financing**
*Government Capital, Project Expenditure and Refinancing Risk at Hemerdon*

Versioned successor under SMPT Presentation Standard v2. Research cutoff **4 November 2026**; revision **5 November 2026**. **18 slides: 14 main and four appendix.** **Author-approved for public release on 5 November 2026**; the original ten-slide edition remains separately preserved.

| Review file | Purpose |
|---|---|
| [Editable PowerPoint](SMPT_FI001_Hemerdon_Presentation_v2.pptx) | Native text, instrument bars, comparison exhibits, six tables and two charts with embedded editing workbooks |
| [PDF](SMPT_FI001_Hemerdon_Presentation_v2.pdf) | Matching selectable-text review copy with 62 source hyperlinks |
| [Contact sheet](contact-sheet.png) | Deck-level visual inventory |
| [Source appendix](source-appendix.md) | Original sources, dates, slide claims, methods and rights |
| [Slide specifications](slide-specs.json) | Assertion, evidence class, exhibit type, mechanism and material caveat for every slide |
| [Exhibit inputs](exhibit-inputs.json) | Source IDs, locators and independently checked arithmetic |
| [QC report](publication-qc.md) | Five mandatory gates, skeptical review and corrections |
| [Handoff](publication-handoff.md) | Review scope and remaining authorization |
| [Validation results](validation-results.json) | Financial checks, source links, preservation and delivered-file hashes |
| [Deck-engine receipt](deck-validation-results.json) | Package, editability, font, geometry, chart-data and re-import checks |
| [HTTP link checks](source-link-checks.json) | HEAD-only host availability results, not new research |

The [original deck](../SMPT_FI001_Hemerdon_Strategy_Deck.pptx), [original PDF](../SMPT_FI001_Hemerdon_Strategy_Deck.pdf), [approved memo](../SMPT_FI001_Hemerdon_Financial_Memo.pdf) and [accepted model](../SMPT_FI001_Hemerdon_Financial_Model.xlsx) remain unchanged and independently accessible. The accepted financial record is [Phase1B](../../hemerdon-phase1b/financial-evidence-closure.md). No new evidence update or modeling was undertaken.

## Production and reproducibility

The original ten-slide `../build_deck.mjs`, its package/PDF styling utilities and the v2 master generator were inspected. This narrowly scoped successor reuses the existing Artifact Tool, native object, package-theme, PDF link-correction and validation approach. It independently lays out the new 18-slide narrative. It does not modify the original generator or general presentation infrastructure.

Requires the Codex bundled Node runtime with `@oai/artifact-tool`, Python with `lxml`, `openpyxl`, `pypdf`, `pdfplumber`, Pillow, and LibreOffice/Poppler. Call the workspace dependency loader to locate installed runtimes. The authoring skill's operation marker applies before beginning a new authoring task, not before every rebuild.

Set the task paths below to your installed runtime and presentation skill. All outputs remain within this directory; private candidates, finalizer receipts and individual renders go under ignored `.build/`. A temporary local `node_modules` link supplies the bundled package, without installing or committing dependencies.

```sh
export SMPT_RUNTIME=/path/to/bundled/dependencies
export SMPT_PRESENTATION_SKILL=/path/to/presentations/skills/presentations
export RUNTIME_NODE_MODULES="$SMPT_RUNTIME/node/node_modules"
ln -s "$RUNTIME_NODE_MODULES" node_modules
"$SMPT_RUNTIME/node/bin/node" build_deck.mjs "$PWD"
```

`style_package.py` sets the SMPT theme and metadata and removes unnecessary vertical table borders. `finalizePresentation` validates a private candidate, materializes two chart-editing workbooks from the complete literal chart datasets, and writes a unique private final file. The verified bytes are copied to the versioned filename. These embedded snapshots preserve chart values, not the accepted model's formula lineage. The canonical workbook stays untouched.

Export the resulting PowerPoint with LibreOffice, writing the intermediate PDF to `.build/`. Set `FONTCONFIG_FILE` to the bundled LibreOffice `Resources/fontconfig/fonts.conf` so the exporter resolves installed system Georgia and Arial:

```sh
FONTCONFIG_FILE=/path/to/LibreOffice.app/Contents/Resources/fontconfig/fonts.conf \
  "$SMPT_RUNTIME/bin/override/soffice" \
  -env:UserInstallation=file:///tmp/fi001-v2-lo \
  --headless --convert-to pdf --outdir .build SMPT_FI001_Hemerdon_Presentation_v2.pptx
"$SMPT_RUNTIME/python/bin/python3" export_pdf.py "$PWD"
"$SMPT_RUNTIME/python/bin/python3" validate_deck.py
```

`export_pdf.py` changes only LibreOffice's exact default hyperlink color to SMPT gold, sets metadata, renders every page with Poppler and creates the contact sheet. It preserves text, annotation targets, page geometry and financial content. `validate_deck.py` checks the financial figures independently against source values, workbook caches and the preserved independent scenario results. It also writes the input manifest and compares every original Phase1A–1C artifact to baseline `b688516763447b669b6755d9083726e691753ac7`.

Georgia Bold is used for assertions. Source Sans 3 was unavailable in the installed fonts, so body text uses the v2-approved **Arial fallback**. The final PDF embeds Georgia Bold and Arial regular/bold. No font binaries are included. Native PowerPoint/Excel opening, tagged-PDF accessibility certification, and human editorial approval are not claimed.

**Publication status:** Author-approved on 5 November 2026 for release under the documented limited-factual-use approach to source materials. Approval covers the exact v2 deck and PDF at production commit `2ac310a2c563c2b45a95cfb1584bb2889968f62e`. The publication QC and handoff retain their historical pre-release findings. The original model and ten-slide deck remain unchanged. Website distribution is tracked in the separate release PR.
