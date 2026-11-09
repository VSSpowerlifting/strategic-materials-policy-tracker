# FI002 executive deck — release candidate 3 quality-control record

- **Publication / version:** SMPT Financial Intelligence 002, *Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision*, executive deck release candidate 3 (RC3). It is a candidate only. Nothing is live, and no human has approved it.
- **Derived from:**
  - **Accepted baseline:** RC2, archived unchanged in [`../release-candidate-2/`](../release-candidate-2/) with its own [QC record](../release-candidate-2/SMPT_FI002_RC2_QC.md).
  - **Source deck:** revision 5, saved in [`../revision-5/`](../revision-5/), the same source RC2 was built from.
  - **Release step:** RC3 repeats RC2's release step unchanged, then adds clickable source links to the PDF.
- **Builder:** [`release/make_release_candidate.py --candidate rc3`](../../../release/make_release_candidate.py). The `rc1` and `rc2` entries are unchanged.
- **Research cutoff:** 5 November 2026, unchanged. RC3 changes no findings, sources, evidence references, figures or layout.

## Why RC3 exists

RC2's PDF had no clickable links, so a reader could not follow a source line to the evidence. RC3 fixes that and nothing else.

- **PPTX:** byte-identical to RC2.
- **PDF:** RC2's LibreOffice export with 29 link annotations added by an incremental save. The page content, fonts, tagging and layout are untouched.
- **Slide renders and contact sheet:** pixel-identical to RC2's.
- **PDF page text:** equal to RC2's on all 11 pages.

## Files

| File | Path (from `docs/research/fi002-bhp-copper/`) | SHA-256 |
| --- | --- | --- |
| Editable deck | `output/review/release-candidate-3/SMPT_FI002_BHP_Copper_Strategy_Deck_RC3.pptx` | `fcadecae7053fe490ec8adf5be796f1c2847d990ef140e0f39807c99fd8cd8f5` |
| PDF | `output/review/release-candidate-3/SMPT_FI002_BHP_Copper_Strategy_Deck_RC3.pdf` | `03b3095834bb9177dd687014f8823b980bce4add61a315ff99415012392d82b6` |
| Contact sheet | `output/review/release-candidate-3/SMPT_FI002_RC3_contact_sheet.png` | `750c7343d4d8e09a5e5e5f28fca57418940c11f56f88e8c86e9c34aa0bcacf3e` |
| Manifest | `output/review/release-candidate-3/SMPT_FI002_BHP_Copper_Strategy_Deck_RC3.manifest.json` | `ace8ee6a6722d1ffcb277f468a9eec02fe1fd6c4b39e0bd6cfb409539d68dcbb` |
| Slide renders | `output/review/release-candidate-3/renders/slide-01.png` to `slide-11.png` | listed in the manifest |

The RC3 PPTX and contact sheet hashes equal RC2's. Historical archives were re-hashed after RC3 was built and did not change:

| Archive file | SHA-256 |
| --- | --- |
| RC2 PDF | `599e5502ee7af5159a017e83d6103d84ff484ec5e963a3cc221fb613100f1ede` |
| RC2 manifest | `28d4e494e20f19116225981c25b58f914b4f9dd3ec6a9d694c30c0f408170afe` |
| RC1 PDF | `868694774f7bae75745298af0827c18ee129cf6506eb418645b174797cc60486` |
| Revision 5 spec | `7b07df249f5b8b0ecec82b375534ac8cbc26c02f3a0602fd3807933285da1a6c` |
| Revision 5 PPTX | `071a67e82a2fcb3b0031ad18ce1c2ec93127d8e8d77496e70cd31e6c3ca483b6` |
| Revision 5 PDF | `2e449d0c86262d7036b4b516846d041cb3674a215d7e5e7cb4441936c6623109` |
| Revision 5 manifest | `dab173b66cb7a400e71623f79ef06dde47868c809c7200b61daa25d98cad61f8` |

## How the links were added

- **Method:** after the LibreOffice export, PyMuPDF finds each source-line phrase in the footer band of its page and adds a URI link annotation over that phrase, then saves incrementally.
- **Placement:** each phrase must match exactly once on its page, or the build fails.
- **Targets:** each URL is the `url` of the matching entry in the revision 5 spec's evidence list (S01 to S20 and SMPT). No URL was added or changed.
- **Audit:** the builder re-opens the PDF and checks the per-page count, that the text under each link rectangle equals its phrase, and that each URI matches the spec. The source PDF it started from is asserted to have 0 links.
- **Visual change:** none. The links carry no underline or colour.

### Link table

| Page | Linked text | Evidence | Target |
| --- | --- | --- | --- |
| 2 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 2 | Annual Report 2026 | S03 | BHP Annual Report 2026 PDF |
| 2 | World Bank CMO October 2026 | S12 | World Bank CMO October 2026 PDF |
| 2 | Goldman Sachs revision as publicly reported | S18 | FinancialJuice item |
| 2 | SMPT calculations | SMPT | Methodology on GitHub `main` |
| 3 | World Bank CMO October 2026, Table 1 | S12 | World Bank CMO October 2026 PDF |
| 3 | FinancialJuice | S18 | FinancialJuice item |
| 3 | Reuters via Business Recorder | S20 | Business Recorder article |
| 3 | Goldman Sachs Exchanges, 23 October 2026 | S16 | Goldman Sachs Exchanges page |
| 4 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 4 | exchange release | S02 | BHP exchange release PDF |
| 4 | BHP Annual Report 2026 | S03 | BHP Annual Report 2026 PDF |
| 5 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 5 | BHP Q1 FY2027 operational review | S05 | BHP Q1 FY2027 operational review PDF |
| 5 | SMPT Price_Sensitivity calculations | SMPT | Methodology on GitHub `main` |
| 6 | BHP Q1 FY2027 operational review guidance | S05 | BHP Q1 FY2027 operational review PDF |
| 6 | SMPT methodology proxy calculation | SMPT | Methodology on GitHub `main` |
| 7 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 7 | BHP Escondida permit submission, March 2026 | S07 | BHP news article |
| 7 | SEIA index, retrieved 5 November 2026 | S17 | ambihub.cl SEIA record |
| 8 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 8 | SMPT methodology and Threshold_Sensitivities calculations | SMPT | Methodology on GitHub `main` |
| 9 | SMPT Threshold_Sensitivities calculations | SMPT | Methodology on GitHub `main` |
| 9 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 10 | BHP Annual Report 2026 | S03 | BHP Annual Report 2026 PDF |
| 10 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 11 | BHP FY2026 results presentation | S01 | BHP results presentation PDF |
| 11 | Annual Report 2026 | S03 | BHP Annual Report 2026 PDF |
| 11 | SMPT methodology | SMPT | Methodology on GitHub `main` |

Page 1 (the cover) has no source line and no links. The full URLs are in the revision 5 spec's evidence list and in the PDF annotations.

## Verification

| Check | Result |
| --- | --- |
| Link count | 29 link annotations: p1 0, p2 5, p3 4, p4 3, p5 3, p6 2, p7 3, p8 2, p9 2, p10 2, p11 3. The builder's `audit_links` passed. |
| Link text and targets | Re-read from the final PDF: each link rectangle covers exactly its phrase, and each URI equals the spec's URL for that evidence id. |
| Link reachability, automated client | 6 distinct URLs return HTTP 200: World Bank CMO PDF, FinancialJuice, Business Recorder, Goldman Sachs Exchanges, ambihub.cl SEIA and the GitHub methodology. The 5 BHP URLs return HTTP 403 to `curl`, which is BHP's behaviour toward automated clients. |
| Link reachability, real browser (9 Nov 2026) | All 5 BHP URLs load in a browser session. The four PDFs (S01, S02, S03, S05) return `application/pdf` with a `%PDF` header, and the S07 Escondida permit article loads with the matching title and 17 Mar 2026 date. |
| Goldman Sachs Exchanges page | Its URL slug names oil, but the page text discusses copper, including the $15,600 end-2027 figure. |
| PDF text, RC2 vs RC3 | Equal on all 11 pages. No "DRAFT" or "REVIEW GATES" text. "5 November 2026" is on the cover. |
| Slide renders and contact sheet | Pixel-identical to RC2's. |
| Font embedding (`pdffonts`) | All 11 fonts are Archivo Regular or Bold, embedded and subset. No Liberation Sans, Arial or Calibri. |
| PDF properties (`pdfinfo`) | Tagged: yes. 11 pages. Same document title as RC2. |
| `verify_editability.py`, structural tier | Run on the revision 5 deck and manifest: pass, exit 0. It cannot be run on RC3 directly because the RC3 PPTX has no draft badge, so the revision 5 manifest hash no longer matches. The RC3 PPTX is byte-identical to RC2's, whose only structural flags were the intended badge and notice removals. |
| LibreOffice tier | Re-run on RC3: the re-saved PPTX keeps 11 slides and all 5 native chart parts, with 0 raster `p:pic` elements. |
| PowerPoint tier | Not run. Microsoft PowerPoint is not installed on this machine. A manual open, Edit Data and save test is still outstanding. |
| Repository gates (9 Nov 2026, merged tree) | `npm run validate` passed (78 events, 109 financial commitments, 46 control measures). `npm run lint`: 0 errors, 28 pre-existing warnings. `npm run typecheck` passed. `npm test`: 1164 of 1164 pass. `npm run build` passed. `npm run exhibits:build` passed, and the tracked gallery files are unchanged. `jszip` and `pptxgenjs` were missing from this worktree's `node_modules`, so `npm ci` was run first. |
| Continuous integration | Not run on the merged head. The merge commit is local and unpushed, and repository policy forbids pushing without maintainer approval. |

## Limitations

- **No visual cue:** the links have no underline or colour, so a reader cannot see which text is clickable. Adding a cue would change the accepted layout and needs approval.
- **PDF only:** the PPTX source lines are not hyperlinked. The URLs remain in the speaker notes.
- **Untagged annotations:** the link annotations are not in the PDF structure tree, so some screen readers may not announce them as links.
- **BHP hosts:** BHP URLs refuse automated clients (HTTP 403). They were confirmed in a browser session only.
- **Methodology link:** it points to the GitHub `main` branch, so it resolves only once this branch is merged and the repository is readable to the reader.
- **PowerPoint tier:** not run.
- **Stale metadata, carried over from RC1:** `docProps/app.xml` still lists Arial and Calibri in its font summary. The slides do not use them.

## Google Drive review copies: BLOCKED

Nothing was uploaded. The Drive connector in this session cannot see folder `1gSNclpsNdzgCbGy3EaQDqsV_NOUrI8Zf` (metadata lookup returns "Requested entity was not found"). The brief requires `ben.yang@gwmail.gwu.edu` and forbids another account, so no upload was attempted. Once the connector uses the university account, upload the PPTX, PDF and contact sheet under the RC3 filenames, alongside the existing files and without overwriting them.

## Release decision

- **Agent assessment:** READY FOR HUMAN INSPECTION OF THE EXACT CANDIDATE FILES, with the limitations above.
- **Unchanged:**
  - the website and the public downloads in `public/research/fi002/`;
  - the live 12-slide deck in `output/`;
  - the current Drive presentation;
  - the revision 4, RC1 and RC2 archives.
- **Human editorial approval (name/date/version):** PENDING
