# FI002 executive deck — release candidate 1 quality-control record

- **Publication / version:** SMPT Financial Intelligence 002, *Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision*, executive deck release candidate 1 (RC1). It is a candidate only: nothing is live and it has no human approval.
- **Derived from:** revision 4, the accepted baseline, which is archived unchanged in [`../revision-4/`](../revision-4/) with its own [gate A–E QC record](../revision-4/SMPT_FI002_rev4_QC.md). The rev4 PPTX (`04a2cc27…9939`) and PDF (`78343271…bd`) were re-hashed after RC1 was built. Both are unchanged.
- **Builder:** [`release/make_release_candidate.py`](../../../release/make_release_candidate.py)
- **Research cutoff:** 5 November 2026, unchanged. RC1 changes no figures, wording, findings or sources.

## Files

| File | Path (from `docs/research/fi002-bhp-copper/`) | SHA-256 |
| --- | --- | --- |
| Editable deck | `output/review/release-candidate-1/SMPT_FI002_BHP_Copper_Strategy_Deck_RC1.pptx` | `c415a567c4dd47c088c08394881ddb7ae8c749bb8019d9b9435e6d3d8500cb11` |
| PDF | `output/review/release-candidate-1/SMPT_FI002_BHP_Copper_Strategy_Deck_RC1.pdf` | `868694774f7bae75745298af0827c18ee129cf6506eb418645b174797cc60486` |
| Contact sheet | `output/review/release-candidate-1/SMPT_FI002_RC1_contact_sheet.png` | `bf304060bf28d08e48dc5e8900336bcb23b8ef8e78c52705e75d6ab800f09c53` |
| Manifest | `output/review/release-candidate-1/SMPT_FI002_BHP_Copper_Strategy_Deck_RC1.manifest.json` | `d7f24364036f9b6c8dce01b891761be2557f7306410c10c05dbe24ba9d841b7b` |
| Slide renders | `output/review/release-candidate-1/renders/slide-01.png` to `slide-11.png` | listed in the manifest |

## What changed from revision 4

The builder works on the rev4 PPTX package, not on the spec, so no exhibit is rebuilt:

- It removes the `frame:draft-badge` shape from all 11 slides.
- It removes the `frame:cover-notice` shape from the cover.
- It strips the remaining internal editorial labels: 54 removals in total, including the badges and the notice.
- It maps the font slots in the slide master (×9) and the theme (×5) to Archivo, so no Arial or Calibri fallback is left.

The builder compares the result with rev4 XML: removing those shapes and making those font substitutions is the whole difference. Every slide's text equals the rev4 text minus the badge string, and the evidence and note URL sets equal rev4's.

## Verification

| Check | Result |
| --- | --- |
| PDF export | LibreOffice 26.8.2.2, headless. The Archivo TTFs were installed in the temporary profile's `user/fonts`. |
| Font embedding (`pdffonts`) | Every font is Archivo: 11 Archivo Regular and Bold subset fonts, all embedded, all subset, each with a Unicode map. No Liberation Sans, Arial or Calibri. This closes the rev4 font item. |
| PDF properties (`pdfinfo`) | Tagged: yes. 11 pages at 959.98 × 540 pt. Title "Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision". |
| Badge and label removal | `pdftotext` finds no "DRAFT" or "REVIEW GATES" text. The PPTX XML has no badge or notice shapes. |
| Text and link audit (`audit_pdf` in the builder) | PASS. Each page's text equals rev4's minus the badge. The evidence and note URL sets are identical. The source URLs sit in the slide notes and source lines, not in PDF link annotations, as in rev4. |
| Visual inspection after export | Done for all 11 slides and the contact sheet. No badge, internal label, overflow, overlap or clipping. All text is set in Archivo, and the figures match rev4. Slide 7 still reads "Permit submitted 17 March 2026; RCA pending; FID CY2027–28; first production CY2031–32". The titles on slides 10 and 11 wrap to two lines, which is acceptable. |
| `verify_editability.py`, structural tier | Run against the rev4 element manifest. It flags only the intended removals: the 11 `frame:draft-badge` shapes and `frame:cover-notice`, all reported as "research draft badge absent". Nothing else is flagged. The research-mode CLI refuses a deck without the badge by design, so this tier cannot pass a release deck. The check here is that the badges and notice are the only differences. |
| `verify_editability.py`, LibreOffice tier | PASS: it converted the deck to PDF and re-saved it as PPTX. The PDF has 11 pages; the re-saved PPTX keeps all 5 native chart parts and has 0 raster `p:pic` elements. |
| PowerPoint tier | Not run. Microsoft PowerPoint is not installed on this machine. A manual open, Edit Data and save test in PowerPoint is still outstanding. |
| BHP source links (browser, 9 Nov 2026) | All 6 BHP URLs work in a real browser session. The permit news page (S07) loads; its title is "Escondida \| BHP submits environmental permit to build a new concentrator plant", dated 17 Mar 2026. The FY2026 results presentation (S01), results exchange release (S02), Annual Report 2026 (S03) and Q1 FY2027 operational review (S05) each return HTTP 200 `application/pdf` to a same-origin HEAD request. Nothing was downloaded. The Escondida location page (S06) returns HTTP 200. The 403s recorded for rev4 came from automated clients only. |

### Notes for the human reviewer

- **Slide 11:** on the decision tree, the connector lines pass through the "No" and "Not shown" branch labels. The rev4 layout has the same overlap. RC1 leaves it alone because the brief rules out a redesign. Decide whether it is acceptable before release.
- **Stale metadata:** `docProps/app.xml` in the PPTX still lists Arial and Calibri in its font summary. The slides do not use them and PowerPoint rewrites this field on save. It was left as it is.

## Google Drive review copies: BLOCKED

Nothing was uploaded. The Drive connector in this session is signed in to an account that cannot see the FI002 folder `1gSNclpsNdzgCbGy3EaQDqsV_NOUrI8Zf`: a metadata lookup on 9 Nov 2026 returned "Requested entity was not found". The brief requires `ben.yang@gwmail.gwu.edu` and forbids a personal account, so no upload went through any other account. Once the connector uses the university account, upload the three files above under the RC1 filenames, alongside the existing files without overwriting them, and add the Drive links here. There are no Drive links yet.

## Release decision

- **Agent assessment:** READY FOR HUMAN INSPECTION OF THE EXACT CANDIDATE FILES
- **Unchanged:** the website, the public downloads, the live 12-slide deck in `output/` and the current Drive presentation.
- **Human editorial approval (name/date/version):** PENDING
