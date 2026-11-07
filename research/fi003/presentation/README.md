# FI003 presentation draft 0.4

Research cutoff: **6 November 2026**. This is a reviewable draft, prepared under the managerial-review request. Financial conclusions and publication remain subject to Benjamin's review. [PUBLICATION_PLAN](../PUBLICATION_PLAN.md) is the only owner/date/gate tracker.

- [Editable PowerPoint](../outputs/presentation-draft-v04/SMPT_FI003_JPMorgan_MP_Draft_v04.pptx)
- [Matching selectable-text PDF](../outputs/presentation-draft-v04/SMPT_FI003_JPMorgan_MP_Draft_v04.pdf)
- [Quality review and exact-file hashes](QUALITY_REVIEW_V04.md)
- [Numerical/package verification](../outputs/presentation-draft-v04/verification.json)
- [Frozen slide manuscript and provenance](slide-manifest.json)
- [Independent managerial assessment](../MANAGERIAL_REVIEW.md)
- [Bounded final review](../FINAL_REVIEW.md)
- [Reader guide](../READER_GUIDE.md) and [allowlisted candidate ZIP](../outputs/review-candidate-v04/FI003_Review_Candidate_v04.zip)

Drafts 0.1–0.3 remain unchanged. Draft 0.3's production source is preserved at `2ededa317980f11031f38f53670c970c49412b5a`; the current starting head was `a07167f25675957be779af8a56961f10e6face41`. Draft 0.4 applies the visual guidance pinned at `b7f4c8c409017cb3f1fa4507eb4e85ea6f7d7a91` (separate draft PR #222, not merged here). It changes presentation form on slides 3, 5, 9, 11, 13 and 14, and version identification on 1. No model, source fact, assumption or financial conclusion changes. See QUALITY_REVIEW_V04 for the exhibit inventory and all five gates.

## Source and build contract

Model 1.0 remains unchanged and controls numerical exhibits. `prepare.py` reads the original inputs, source register and Python schedules, retaining the model's input/specification/XLSX hashes and baseline controls. Financial formulas and assumptions are not moved into the slide builder. The three native charts contain literal embedded-workbook snapshots, rather than automatic links back to the controlling financial workbook. Ownership fractions round to twelve decimal places solely for portable chart storage; displayed percentages are unchanged at two decimals. Six native tables and a true waterfall of native data bars remain editable.

`build.mjs` reads the manifest and uses the bundled `@oai/artifact-tool`. `finish_package.py` adds identity metadata, evidence descriptions and native chart-label no-wrap formatting before finalization, without changing quantitative data. The deck uses Archivo, the established palette and original evidence. It does not replace public site assets, model 1.0 or the native Sheet. The finalizer refuses existing output/receipt paths.

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
# Export to a fresh intermediate directory, retaining this raw tagged export.
# FONTCONFIG_FILE must resolve actual official static Archivo faces. This runner
# used Omnibus-Type/Archivo at 211127f; no font binaries are in the repository.
FONTCONFIG_FILE=/absolute/path/to/archivo-fontconfig.conf \
soffice -env:UserInstallation=file:///tmp/fi003-lo-new \
  --headless --convert-to 'pdf:impress_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"}}' \
  --outdir /absolute/path/to/fresh-raw-export \
  "$FI003_DECK_OUTPUT/SMPT_FI003_JPMorgan_MP_Draft_v04.pptx"
"$CODEX_PRIMARY_RUNTIME_PYTHON" research/fi003/presentation/remediate_pdf.py \
  /absolute/path/to/fresh-raw-export/SMPT_FI003_JPMorgan_MP_Draft_v04.pdf \
  "$FI003_DECK_OUTPUT/SMPT_FI003_JPMorgan_MP_Draft_v04.pdf" \
  --report "$FI003_DECK_OUTPUT/accessibility.json"
```

`verify.py` verifies the current committed draft directory and writes its verification receipt (or a separate `--report` path). It checks unchanged model hashes, fresh manuscript, native chart values/axes, embedded workbooks, table text, Archivo embedding, evidence descriptions, metadata and links. Use the bundled Python 3.12 with PyMuPDF and pypdf. The package finalizer requires Python 3.10+; an earlier host’s default Python 3.9 could not run it.

```sh
"$CODEX_PRIMARY_RUNTIME_PYTHON" research/fi003/presentation/verify.py
```

The first export in this revision substituted Noto Sans because Archivo was unavailable to LibreOffice. The failed export was rejected. Setting a temporary `FONTCONFIG_FILE` with a directory of official static Archivo faces and a temporary font cache fixed the export. Inspect the actual PDF fonts after every render; installing a font alone does not prove its use. Do not commit standalone font files or change runtime libraries.

`package_review.py` builds the explicit 33-file draft candidate, refuses to overwrite it, and supports `--check` for byte/hash/contents verification. Internal README/tracker, private native-Sheet links, originals and font files are excluded. The extracted package’s tests, schedules, model specification and manuscript reproduce.

`remediate_pdf.py` classifies only text-free vector Figure content as decoration, replaces its wrapper with `/Artifact BMC`, removes the corresponding structure children and nulls their ParentTree slots. It tags exact matched main headlines as H1 and selected real subheadings as H2. Raw drawing/color-number bytes stay unchanged, avoiding parser float-rounding effects. It refuses complex/unnamed figures containing text, images or XObjects. It preserves meaningful Alt strings, table/header/cell and Link counts, all annotation rectangles/targets, text and exact page-render pixels. Its receipt records 42 artifacts, 15 H1, 17 H2, 12 meaningful figures, six tables and 46 links. All remaining MCIDs resolve to live ParentTree entries. These are bounded static checks, not PDF/UA or screen-reader certification.

Rerender modified slides and inspect the full deck. Package validation does not establish financial accuracy, native PowerPoint behavior or human approval. Native open/edit/save/reopen, live screen-reader navigation/reading order, broader accessibility review, exact-file/source-rights approval and separate publication authorization remain open. The PR's known merge conflicts with main require a later separately scoped integration phase. No integration/release work belongs in this visual pass.
