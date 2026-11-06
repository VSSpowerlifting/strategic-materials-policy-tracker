# FI003 presentation draft 0.1

Research cutoff: **6 November 2026**. This is a reviewable draft, prepared under the managerial-review request. Financial conclusions and publication remain subject to Benjamin's review. [PUBLICATION_PLAN](../PUBLICATION_PLAN.md) is the only owner/date/gate tracker.

- [Editable PowerPoint](../outputs/presentation-draft-v01/SMPT_FI003_JPMorgan_MP_Draft_v01.pptx)
- [Matching selectable-text PDF](../outputs/presentation-draft-v01/SMPT_FI003_JPMorgan_MP_Draft_v01.pdf)
- [Quality review and exact-file hashes](QUALITY_REVIEW.md)
- [Numerical/package verification](../outputs/presentation-draft-v01/verification.json)
- [Frozen slide manuscript and provenance](slide-manifest.json)
- [Independent managerial assessment](../MANAGERIAL_REVIEW.md)

## Source and build contract

Model 1.0 remains unchanged and controls numerical exhibits. `prepare.py` reads the original inputs, source register and Python schedules, retaining the model's input/specification/XLSX hashes and baseline controls. Financial formulas and assumptions are not moved into the slide builder. The two native charts contain literal embedded-workbook snapshots, rather than automatic links back to the controlling financial workbook. Ownership fractions round to twelve decimal places solely for portable chart storage; displayed percentages are unchanged at two decimals. Eleven native tables and a true waterfall of native data bars remain editable.

`build.mjs` reads the manifest and uses the bundled `@oai/artifact-tool`. It uses only Archivo, the established house palette and original quantitative evidence. It does not replace public site assets, the financial workbook or the native Sheet. The finalizer intentionally refuses existing output/receipt paths.

Reproduce the manuscript from the repository root:

```sh
python3 research/fi003/presentation/prepare.py --check
python3 research/fi003/prototype.py --check
python3 research/fi003/model.py --check
python3 -m unittest discover -s research/fi003 -p 'test_*.py' -v
```

For a new local render, use fresh absolute `FI003_DECK_BUILD` and `FI003_DECK_OUTPUT` directories inside `research/fi003/`. Set `FI003_PRESENTATION_SKILL` to the installed presentation-skill root if it differs from this runner. The bundled runtime must supply `CODEX_PRIMARY_RUNTIME_NODE_MODULES`, `CODEX_PRIMARY_RUNTIME_NODE` and `CODEX_PRIMARY_RUNTIME_PYTHON`. Install legitimate Archivo static faces in the rendering environment; do not commit font binaries. Then run:

```sh
"$CODEX_PRIMARY_RUNTIME_NODE" research/fi003/presentation/build.mjs
soffice -env:UserInstallation=file:///tmp/fi003-lo-deck \
  --headless --convert-to pdf --outdir "$FI003_DECK_OUTPUT" \
  "$FI003_DECK_OUTPUT/SMPT_FI003_JPMorgan_MP_Draft_v01.pptx"
```

`verify.py` verifies the committed draft directory. It checks unchanged model hashes, fresh manuscript reproduction, native chart values and zero-based axes, embedded chart workbooks, native tables, Archivo text, PDF content and source hyperlinks. Run with the bundled Python, which supplies PyMuPDF:

```sh
"$CODEX_PRIMARY_RUNTIME_PYTHON" research/fi003/presentation/verify.py
```

Rerender every modified slide, compare PDF text/links and inspect the full deck. The stored package finalization report is supplementary structural evidence; it does not establish financial accuracy, PowerPoint application behavior or human approval. No tagged-PDF/assistive-technology certification is claimed. Future review changes must update the manifest, exports, checks and tracker together, and assign a successor draft version before publication.
