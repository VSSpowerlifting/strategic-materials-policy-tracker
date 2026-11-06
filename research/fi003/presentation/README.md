# FI003 presentation draft 0.3

Research cutoff: **6 November 2026**. This is a reviewable draft, prepared under the managerial-review request. Financial conclusions and publication remain subject to Benjamin's review. [PUBLICATION_PLAN](../PUBLICATION_PLAN.md) is the only owner/date/gate tracker.

- [Editable PowerPoint](../outputs/presentation-draft-v03/SMPT_FI003_JPMorgan_MP_Draft_v03.pptx)
- [Matching selectable-text PDF](../outputs/presentation-draft-v03/SMPT_FI003_JPMorgan_MP_Draft_v03.pdf)
- [Quality review and exact-file hashes](QUALITY_REVIEW_V03.md)
- [Numerical/package verification](../outputs/presentation-draft-v03/verification.json)
- [Frozen slide manuscript and provenance](slide-manifest.json)
- [Independent managerial assessment](../MANAGERIAL_REVIEW.md)
- [Bounded final review](../FINAL_REVIEW.md)
- [Reader guide](../READER_GUIDE.md) and [allowlisted candidate ZIP](../outputs/review-candidate-v03/FI003_Review_Candidate_v03.zip)

Drafts 0.1 and 0.2 remain unchanged. Their source generators are preserved at `2b1c4558de5389214e9fd33830b304bbad499ae2` and `3975390968968da63059fb0fa4a5c9175de46ec3` respectively. Draft 0.3 clarifies contract states, conditions and support labels; pins model/claim/source links; repairs identity metadata and adds evidence descriptions. No model, assumption or numerical exhibit changes. Visible copy changes affect 1 (version), 9–12 and 15. The exact changes and remaining accessibility defects are recorded in FINAL_REVIEW and QUALITY_REVIEW_V03.

## Source and build contract

Model 1.0 remains unchanged and controls numerical exhibits. `prepare.py` reads the original inputs, source register and Python schedules, retaining the model's input/specification/XLSX hashes and baseline controls. Financial formulas and assumptions are not moved into the slide builder. The two native charts contain literal embedded-workbook snapshots, rather than automatic links back to the controlling financial workbook. Ownership fractions round to twelve decimal places solely for portable chart storage; displayed percentages are unchanged at two decimals. Eleven native tables and a true waterfall of native data bars remain editable.

`build.mjs` reads the manifest and uses the bundled `@oai/artifact-tool`. `finish_package.py` adds identity metadata and chart/waterfall descriptions before finalization, without changing quantitative data. The deck uses Archivo, the established palette and original evidence. It does not replace public site assets, model 1.0 or the native Sheet. The finalizer refuses existing output/receipt paths.

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
  "$FI003_DECK_OUTPUT/SMPT_FI003_JPMorgan_MP_Draft_v03.pptx"
```

`verify.py` verifies the current committed draft directory and writes its verification receipt (or a separate `--report` path). It checks unchanged model hashes, fresh manuscript, native chart values/axes, embedded workbooks, table text, Archivo embedding, evidence descriptions, metadata and links. Use Python with PyMuPDF available; this local host required a temporary environment for PyMuPDF. The package finalizer requires Python 3.10+; bundled Python 3.12 completed its checks. The default system Python 3.9 cannot run that finalizer.

```sh
"$CODEX_PRIMARY_RUNTIME_PYTHON" research/fi003/presentation/verify.py
```

On this host, LibreOffice's isolated font configuration initially ignored installed Archivo and substituted another face. The failed export was rejected. Setting a temporary `FONTCONFIG_FILE` with a directory of official static Archivo faces and a temporary font cache fixed the export. Inspect the actual PDF fonts after every render; installing a font alone does not prove its use. Do not commit standalone font files or change runtime libraries.

`package_review.py` builds the explicit 27-file draft candidate, refuses to overwrite it, and supports `--check` for byte/hash/contents verification. Internal README/tracker, private native-Sheet links, originals and font files are excluded. The extracted package’s tests, schedules, model specification and manuscript reproduce.

Rerender modified slides and inspect the full deck. Package validation does not establish financial accuracy, PowerPoint behavior or human approval. Basic PDF tags were inspected; 30 decorative figures and generic heading tags remain accessibility work, with no PDF/UA or assistive-technology certification. Future corrections need a successor version and affected verification before publication.
