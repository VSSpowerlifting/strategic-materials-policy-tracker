# Issue #219 — final Archivo legibility verification

**Draft PR #223 · 6 November 2026 · publication HOLD**

## Source adjustment
The release candidate's original 8.2–9.6 pt identity, link and methodological text was too small. The revised generator increases footer identity to 9.5 pt, content-link labels to at least 10.4 pt, explanatory source/qualification notes to 11.2 pt, and reallocates the dense antimony comparison and execution slides. R001 Japan slide 6 now separates recipient investment, physical capacity and proposed delivery dates into independent text rows. It makes no new financial claim and preserves source destinations and original research cutoffs.

## Reproducibility and exact staged files
Generator: `research/reissues/archivo-remaining/build_decks.js`

[Revised source QA run #42326459155](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/42326459155) passed. [Staging/release validation run #42326455286](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/42326455286) passed and committed the following reviewed binaries to this draft branch:

| Case | Format | Exact SHA-256 |
|---|---|---|
| R001 tungsten | alternate PDF | `64818234a204a004100c0161cb2b8dadb7364f71142a2adf74cc8ef256fe9812` |
| R001 tungsten | editable PPTX | `e5da53a575fc373610c1d309d31980f9a3e92c80ed9e25dbcc1ddd604dc82b70` |
| Applied Strategy 001 antimony | alternate PDF | `6e040cfb7126e55e57b813a80c002cac1bcb7393e482d2de346f47f0deb3d4b1` |
| Applied Strategy 001 antimony | editable PPTX | `5e52e21c154842db5a619b5dbb7753affca421608aa505ab2dbabe1d31bc40c7` |

Manifest: `public/research/archivo-alternate-editions-manifest.json`. The original R001 portrait PDF remains SHA-256 `1cd5895ea12ebe6a8963117c26fa9b4fcd93f6d252a76684c3e2107dae4303c6`, and original A001 PDF remains `bdd169c7f6112924c45d9dff317bd39c6c8fce4382e1b63f10ac7002af3507a6`.

## Visual and programmatic acceptance
- Both revised PDFs have eight 16:9 pages, genuine embedded Archivo, 24 (R001) and 34 (A001) PDF source links. Both PPTXs remain native editable vectors/text with eight slides and no picture-shape slides.
- Programmatically checked all sixteen rendered pages for text leaving the page: **zero**. Smallest extracted content text, excluding the intentionally separate identity footer below 510 PDF points, is **10.29 pt** (cover) and **10.4 pt or above** on substantive pages. The label-size threshold is now asserted in the branch staging script.
- Inspected the final contact sheets, particularly R001 Japan slide 6, antimony policy comparison slides 2 and 4, reversal slide 7, and source directory slide 8. Japan labels and the methodological note no longer materially overlap. All source/investment/dated qualification anchors remain visible.
- Latest pre-stage source head `b1a5844671228c184d24efbb3e238ac098793a08` passed combined CI and independent slide QA. Final staged binary head is followed by this review-record commit to retrigger complete branch CI. Do not claim a final green head until those results are observed.
- Source research dates and public legacy PDFs are unchanged. The new editions are **alternates**, not replacement research or certified original masters.

## Publication gates remaining
- [ ] Final CI/build and preview PDF/PPTX routes green on this exact final branch head.
- [ ] Human editorial acceptance of condensed source coverage and phone-size footnotes; these are more readable but still presentation footnotes.
- [ ] Native Microsoft PowerPoint open/edit/save/reopen and real-font fallback/recipient behavior; LibreOffice round-trip and OOXML checks do not establish native compatibility.
- [ ] Explicit authorization to merge; then independently verify production links and binary hashes before closing Issue #219.

**Status: draft / no automatic publication.**
