# FI002 executive deck — release candidate 5 quality-control record

- **Publication / version:** SMPT Financial Intelligence 002, *Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision*, executive deck RC5.
- **Authority:** GitHub Issue #252. Final decision: revision 6 Option B, the NASA Escondida photograph. The maintainer authorised merge and publication without another aesthetic review, provided the integrity, numerical and publication checks pass.
- **Baseline:** published RC4 ([`../release-candidate-4/`](../release-candidate-4/)), unchanged. RC5 changes the cover only.
- **Cover source:** [`../revision-6-cover-options/`](../revision-6-cover-options/) `…rev6c.*`, rendered with the `cover_hero_split` pattern and no hero caption.
- **Builder:** [`release/make_release_candidate.py --candidate rc5`](../../../release/make_release_candidate.py). The `rc1`–`rc4` entries are unchanged.
- **Research cutoff:** 5 November 2026, unchanged.

## What changed from RC4

- Slide 1: the generated contour artwork and its "Conceptual artwork, not a map" label are removed. The right panel is NASA photograph ISS022-E-8282, the Escondida tailings impoundment, taken 9 December 2009 (20:56:50Z). It is not the open pits and not the proposed New Concentrator. No visible image caption.
- Attribution, date, subject limits and rights live in the alt text, speaker notes, the asset's provenance file and the PDF metadata.
- Slides 2–11, the 29 source links, figures, fonts and charts are unchanged.

## Files

| File | SHA-256 | Bytes |
| --- | --- | --- |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_RC5.pptx` | `1432779dd3ba720df452098c5244ef840479f89c87a74ae790cad4c6d418cf83` | 595,756 |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_RC5.pdf` | `52b8006767536bc98708cd67be1a04dbf44e6a23692efe3af4cef8957db8f218` | 598,843 |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_RC5.manifest.json` | `ce649d3c06808e1ed1e4a4ce3e3be9f517c43f2ea8abe004926c73845dc89cca` | |
| `SMPT_FI002_RC5_contact_sheet.png` | `d21c9e626e08a0f162d829a862a2b2b279e39dee354cbce891b26f75275f5a86` | |

Pinned photo asset: `…/revision-6-cover-options/assets/fi002-cover-escondida-iss022-e-8282.jpg`, SHA-256 `a1ea806791fa14fb45a1ea521c196a9a49cbb53d7097276a32464f118cb17a83`; provenance file SHA-256 `f3151b94ebbac5bbadd5d9e12afa980f329ed1afb8c6473a91cd50eecd525847`. Both are unchanged.

RC4 baseline (preserved): PPTX `54e0d620bf07a2bcae71227d0b464c0defadc64c9cc2ad106401118797132168` (95,824 B); PDF `9e1c9765f7856bc5947efb54522d95378bf66566ac9f418118008516ac9bba07` (176,575 B).

## Verification

| Check | Result |
| --- | --- |
| Slides 2–11 vs RC4 | Pixel-identical at 144 dpi (max channel difference 0). |
| Slide count | 11 in PPTX and PDF. |
| Hyperlinks | 29 in the PPTX and 29 URI annotations in the PDF; targets equal RC4's. |
| PDF accessibility | Tagged PDF, 29 tagged `/Link` structure elements with `/Contents`, document title set. |
| Fonts | PDF fonts are Archivo only; PPTX theme and runs map to Archivo. |
| Native charts | 5 chart parts and their embedded workbooks, byte-identical to RC4. |
| PPTX part diff vs RC4 | Only `ppt/media/image-1-1.jpeg`, `notesSlide1.xml`, `slide1.xml`, `slide1.xml.rels` and `docProps/core.xml`. The `core.xml` difference is apostrophe encoding in the title (`’` vs `&apos;`), harmless. |
| Embedded cover image | SHA-256 equals the pinned photo asset. |
| Cover text | Title, subtitle, thesis, author/publisher, 5 Nov 2026 cutoff and "$2.83bn" with its "FY2026-static EBITDA illustration" qualifiers are present. No caption and no "Conceptual" text. |
| Cover contrast | Every cover text span measures at least 7.26:1 against its rendered background (text sits on the flat graphite panel, not over the photo). |
| Numbers | PDF text and numeric tokens for pages 2–11 equal RC4's. New page-1 figures ($2.83bn, $1,600/t, 5 November 2026, $6 Billion) match slide 2. |
| Structural verifier | Passed on the rev6c source deck. The RC5 PPTX is a derivative and, like RC2–RC4, cannot be checked against its source manifest. |
| Rights and identity | NASA material, not copyrighted per the Gateway to Astronaut Photography conditions of use (read 2026-11-09). Credit in notes and provenance. No NASA logo, no endorsement. No photo date other than the catalogued 2009-12-09. |

## Notes and limitations

- **PowerPoint was not run.** Only LibreOffice and structural inspection were available. Open the PPTX in PowerPoint to confirm the hyperlinks and cover render.
- The pinned provenance file still describes a "caption_scrim" tuned for a slide caption. RC5 has no caption, so that wording is stale. The file is hash-pinned and was left unchanged.
- The photograph shows the tailings impoundment, per NASA's own caption; the open pits lie to the north and are not shown.
- BHP URLs may return 403 to automated clients; RC4's browser check of the 29 targets is carried over and the targets are unchanged.
- This record sits beside the files and cannot hold its own hash; the commit SHA records what was reviewed.

## Repository gates (run on this branch before the PR)

`npm run validate`, `npm run lint` (0 errors, 28 pre-existing warnings), `npm run typecheck`, `npm run build`, `npm test` (1211 pass, 0 fail) and `npm run exhibits:build` (tracked gallery files unchanged) all passed.
