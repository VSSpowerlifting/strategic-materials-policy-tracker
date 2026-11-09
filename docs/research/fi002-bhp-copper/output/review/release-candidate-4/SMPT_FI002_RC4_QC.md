# FI002 executive deck — release candidate 4 quality-control record

- **Publication / version:** SMPT Financial Intelligence 002, *Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision*, executive deck release candidate 4 (RC4). It is a candidate only. Nothing is live, and no human has approved it.
- **Derived from:**
  - **Accepted baseline:** RC3, archived unchanged in [`../release-candidate-3/`](../release-candidate-3/) with its own [QC record](../release-candidate-3/SMPT_FI002_RC3_QC.md).
  - **Source deck:** revision 5, saved in [`../revision-5/`](../revision-5/), the same source RC2 and RC3 were built from.
  - **Release step:** RC4 repeats RC3's release step, then marks the source links visibly and adds them to the PPTX.
- **Builder:** [`release/make_release_candidate.py --candidate rc4`](../../../release/make_release_candidate.py). The `rc1`, `rc2` and `rc3` entries are unchanged.
- **Research cutoff:** 5 November 2026, unchanged. RC4 changes no findings, sources, evidence references, figures, wording or layout.

## Why RC4 exists

RC3's 29 PDF links were invisible, and the PPTX had no links. RC4 fixes both and nothing else.

- **Visible links:** each linked phrase has a single underline and the SMPT accessible accent, `#7A5510` (about 6.0:1 on the cream `#F5F3EE` slide background). The surrounding source text is `#5B5548`. No label or icon was added.
- **PPTX links:** the same 29 phrases are now real PowerPoint hyperlinks, so they work in the editable deck as well as in the PDF. The theme's hyperlink and followed-hyperlink colours are also `#7A5510`, and each run carries the "use text colour" extension so PowerPoint does not recolour it.
- **Accessible PDF links:** LibreOffice exports each hyperlink as a URI annotation and as a tagged `/Link` structure element. Each annotation has a `/Contents` description equal to its visible text. The tagging was audited on its own, not assumed.
- **Everything else:** slide and notes text, charts, embedded workbooks, fonts and layout are unchanged from RC3.

## Files

| File | Path (from `docs/research/fi002-bhp-copper/`) | SHA-256 |
| --- | --- | --- |
| Editable deck | `output/review/release-candidate-4/SMPT_FI002_BHP_Copper_Strategy_Deck_RC4.pptx` | `54e0d620bf07a2bcae71227d0b464c0defadc64c9cc2ad106401118797132168` |
| PDF | `output/review/release-candidate-4/SMPT_FI002_BHP_Copper_Strategy_Deck_RC4.pdf` | `9e1c9765f7856bc5947efb54522d95378bf66566ac9f418118008516ac9bba07` |
| Contact sheet | `output/review/release-candidate-4/SMPT_FI002_RC4_contact_sheet.png` | `c3d807c9d15d4537bc3bef016bdac0f418d1d7fe1e48025110692ff234b683a4` |
| Manifest | `output/review/release-candidate-4/SMPT_FI002_BHP_Copper_Strategy_Deck_RC4.manifest.json` | `62966f5cd4d51a7a8f423cfe4e7ac1cda8c530b9fbd5263a3c2caffaa26642db` |
| Slide renders | `output/review/release-candidate-4/renders/slide-01.png` to `slide-11.png` | listed in the manifest |

The PPTX and PDF are the exact files to review and, if approved, publish. This record is committed beside them and cannot hold its own hash, so the committed commit SHA is the record of what was reviewed.

Historical archives were re-hashed after RC4 was built and did not change:

| Archive file | SHA-256 |
| --- | --- |
| RC3 PPTX | `fcadecae7053fe490ec8adf5be796f1c2847d990ef140e0f39807c99fd8cd8f5` |
| RC3 PDF | `03b3095834bb9177dd687014f8823b980bce4add61a315ff99415012392d82b6` |
| RC3 contact sheet | `750c7343d4d8e09a5e5e5f28fca57418940c11f56f88e8c86e9c34aa0bcacf3e` |
| RC3 manifest | `ace8ee6a6722d1ffcb277f468a9eec02fe1fd6c4b39e0bd6cfb409539d68dcbb` |
| RC2 PDF | `599e5502ee7af5159a017e83d6103d84ff484ec5e963a3cc221fb613100f1ede` |
| RC2 manifest | `28d4e494e20f19116225981c25b58f914b4f9dd3ec6a9d694c30c0f408170afe` |
| RC1 PDF | `868694774f7bae75745298af0827c18ee129cf6506eb418645b174797cc60486` |
| Revision 5 spec | `7b07df249f5b8b0ecec82b375534ac8cbc26c02f3a0602fd3807933285da1a6c` |
| Revision 5 PPTX | `071a67e82a2fcb3b0031ad18ce1c2ec93127d8e8d77496e70cd31e6c3ca483b6` |
| Revision 5 PDF | `2e449d0c86262d7036b4b516846d041cb3674a215d7e5e7cb4441936c6623109` |
| Revision 5 manifest | `dab173b66cb7a400e71623f79ef06dde47868c809c7200b61daa25d98cad61f8` |

## How the links were added

- **PPTX:** the builder starts from the revision 5 deck with the badge, notices and speaker-note labels removed (RC3's derivation). For slides 2 to 11 it then rewrites the source-line paragraph so each source phrase is its own run with `a:hlinkClick`, an underline (`u="sng"`) and the `#7A5510` colour. It adds one external hyperlink relationship per run in each slide's rels file. The source text itself is unchanged.
- **PDF:** LibreOffice's headless export turns those hyperlinks into link annotations and tagged `/Link` elements. The builder then sets `/Contents` on each annotation to the whitespace-normalised text under it and saves incrementally.
- **Targets:** each URL is the `url` of the matching entry in the revision 5 spec's evidence list (S01 to S20 and SMPT). No URL was added or changed, and the 29 targets equal RC3's.
- **Audit:** the builder re-opens its own output. It checks the PPTX per slide (run count, relationship targets, underline, colour, extension), then the PDF per page (annotation count, URI, link text), then the structure tree (see Verification).

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

Page 1 (the cover) has no source line and no links. The full URLs are in the revision 5 spec's evidence list, in the PPTX relationships and in the PDF annotations. There are 11 distinct URLs.

## Verification

| Check | Result |
| --- | --- |
| Link count, PPTX | 29 hyperlink runs: slide 2 has 5, 3 has 4, 4 has 3, 5 has 3, 6 has 2, 7 has 3, 8 has 2, 9 has 2, 10 has 2, 11 has 3. Each is underlined, `#7A5510`, and has an external relationship. The builder's `verify_pptx_links` passed. |
| Link count, PDF | 29 link annotations: p1 0, p2 5, p3 4, p4 3, p5 3, p6 2, p7 3, p8 2, p9 2, p10 2, p11 3. The builder's `audit_links` passed. |
| Link targets | Each PDF URI and each PPTX relationship target equals the spec's URL for that evidence id, and the 29 equal RC3's. |
| Link text | The text under each PDF link rectangle equals its phrase, with one exception that is not a defect. On page 10 the "BHP Annual Report 2026" rectangle also reads the following comma, because its right edge overlaps that glyph's box by about 0.3 pt. The PPTX run has no comma. |
| PDF link accessibility (tagging) | The PDF is marked and tagged. There are 29 annotations and 29 `/Link` structure elements. Every annotation has a `/StructParent` that appears in the ParentTree and resolves to a `/Link` element. Each such element has exactly one object reference (OBJR) pointing back at that annotation, and has marked content. Every annotation has a non-empty `/Contents`. All four counts are 29 (`audit_link_structure`). |
| PDF link accessibility (limit of this test) | This is a structural audit. It was not run through a screen reader or PAC, so it shows the structure that assistive technology needs, not how a given reader announces it. |
| Visible link treatment | Slides 2 to 11 show the underline and darker accent on the linked phrases. Slide 1 is unchanged. Contact sheet and slide 3 were inspected. |
| Render comparison with RC3 | The only pixel differences are in the footer band (y 1013 to 1032) of slides 2 to 11. Slide 1 is identical. |
| PDF text, RC3 vs RC4 | Equal on all 11 pages. The largest word shift against RC3 is 0.31 pt (page 2, "SMPT calculations"). |
| Numerical reconciliation | The multiset of numeric tokens equals RC3's on all 11 PDF pages, and the RC4 PPTX's equals revision 5's on all 11 slides (238 numeric tokens in the PDF). PDF-only numbers on slides 3, 5, 6 and 9 come from the native charts, whose XML values match: slide 3 `15400, 14405, 13800, 13000`; slide 5 `4245.6, 2830.4, 1760.2`; slide 6 the `5%` leakage and `2274.3`; slide 9 the `416.49` to `165.62` ktpa series with its 8%, 12% and $3,000 or $5,000 labels. |
| Charts and workbooks | All 5 chart parts and all 5 embedded Excel workbooks are byte-identical to revision 5's. |
| PPTX diff against RC3 | 21 parts differ: slides 2 to 11, their relationship files and `theme1.xml`. Slide and notes text are identical. There are 11 slides, 5 native charts and 0 raster `p:pic` elements. |
| Internal labels | None. No "draft", "review gates", "not approved" or "human-gated" text in the PPTX or PDF. "5 November 2026" is on the cover. |
| Font embedding (`pdffonts`) | All 11 fonts are Archivo Regular or Bold, embedded and subset. No Liberation Sans, Arial or Calibri. |
| PDF properties (`pdfinfo`) | Tagged: yes. 11 pages. Same document title as RC3. |
| LibreOffice compatibility | The re-saved RC4 PPTX keeps 11 slides, 5 chart parts, 0 raster pictures and 29 `hlinkClick` elements. |
| `verify_editability.py`, structural tier | Not run on RC4 directly: the RC4 PPTX has no draft badge, so the revision 5 manifest hash no longer matches, as for RC2 and RC3. The structural facts above (parts identical or differing only as listed, charts and workbooks identical) stand in for it. |
| PowerPoint tier | **Not run.** Microsoft PowerPoint is not installed on this machine. A manual open, click-each-link, Edit Data and save test is outstanding. |
| Link reachability, automated client (9 Nov 2026) | 6 of the 11 distinct URLs return HTTP 200: World Bank CMO PDF, FinancialJuice, Business Recorder, Goldman Sachs Exchanges, ambihub.cl SEIA and the GitHub methodology. The 5 BHP URLs return HTTP 403 to `curl`, which is BHP's behaviour toward automated clients. |
| Link reachability, real browser | All 5 BHP URLs loaded in a browser session on 9 Nov 2026 during the RC3 check (four PDFs, plus the S07 permit article dated 17 Mar 2026). RC4's targets are the same URLs, so that result carries over. It was not repeated for RC4. |
| Goldman Sachs Exchanges page | Its URL slug names oil, but the page text discusses copper, including the $15,600 end-2027 figure. |
| Repository gates (9 Nov 2026) | `npm run validate` passed (78 events, 109 financial commitments, 46 control measures). `npm run lint`: 0 errors, 28 pre-existing warnings. `npm run typecheck` passed. `npm test`: 1164 of 1164 pass. `npm run build` passed. `npm run exhibits:build` passed, and the tracked gallery files are unchanged (`git status` shows only the builder change and the new RC4 folder). All six exited 0. |
| Continuous integration | Not recorded here: this file is committed in the same commit CI will test, so it cannot hold that result. Read the PR #233 checks on the pushed head. The previous head, `b3f42f2`, had CI run 42705196326 green. |

## Limitations

- **PowerPoint not tested:** neither the link behaviour nor the colour of the links was checked in PowerPoint. LibreOffice wrote the PDF, and PowerPoint's treatment of the hyperlink colour override was not observed.
- **PDF accessibility not tested with assistive technology:** only the structure was audited.
- **BHP hosts:** BHP URLs refuse automated clients (HTTP 403). They were confirmed in a browser session only, during the RC3 check.
- **Methodology link:** it points to the GitHub `main` branch, so it resolves only once this branch is merged and the repository is readable to the reader.
- **Sub-point geometry:** the page 10 link rectangle overlaps the following comma by about 0.3 pt, and the page 2 footer text sits about 0.3 pt from its RC3 position. Neither is visible.
- **Stale metadata, carried over from RC1:** `docProps/app.xml` still lists Arial and Calibri in its font summary. The slides do not use them.

## Google Drive review copies: BLOCKED

Nothing was uploaded. The Drive connector in this session cannot see folder `1gSNclpsNdzgCbGy3EaQDqsV_NOUrI8Zf` (metadata lookup returns "Requested entity was not found"). The brief requires `ben.yang@gwmail.gwu.edu` and forbids another account, so no upload was attempted. Once the connector uses the university account, upload the approved PPTX and PDF (and, if wanted, the contact sheet) under the RC4 filenames, alongside the existing files and without overwriting them.

## Release handoff (for the release session; none of this has been run)

Run these only after the maintainer has approved the exact RC4 files above. Replace `<HEAD>` with the PR head SHA the maintainer reviewed.

1. **Check the files first.** From the repository root, the three hashes must match the table above:

   ```bash
   cd docs/research/fi002-bhp-copper/output/review/release-candidate-4
   shasum -a 256 SMPT_FI002_BHP_Copper_Strategy_Deck_RC4.pptx SMPT_FI002_BHP_Copper_Strategy_Deck_RC4.pdf
   ```

2. **Run the PowerPoint test** on the RC4 PPTX: open it, click each of the 29 links, open Edit Data on all 5 charts, save, and reopen. Record the result here or in `PROJECT_STATE.md`.

3. **Merge PR #233** (a draft until now), pinned to the reviewed head:

   ```bash
   gh pr ready 233 --repo VSSpowerlifting/strategic-materials-policy-tracker
   gh pr merge 233 --repo VSSpowerlifting/strategic-materials-policy-tracker --squash --match-head-commit <HEAD>
   ```

   Use `--merge` instead of `--squash` if the maintainer wants the RC history kept.

4. **Replace the public downloads** on a new branch cut from the updated `main`. The two files keep their current names, and nothing else under `public/research/fi002/` changes:

   ```bash
   cp docs/research/fi002-bhp-copper/output/review/release-candidate-4/SMPT_FI002_BHP_Copper_Strategy_Deck_RC4.pptx public/research/fi002/executive-slides.pptx
   cp docs/research/fi002-bhp-copper/output/review/release-candidate-4/SMPT_FI002_BHP_Copper_Strategy_Deck_RC4.pdf  public/research/fi002/executive-slides.pdf
   shasum -a 256 public/research/fi002/executive-slides.pptx public/research/fi002/executive-slides.pdf
   ```

   The two hashes must equal the PPTX and PDF hashes above. Then open a PR for that change and let CI pass. `app/research/escondida-copper/page.tsx` and `lib/fi002.ts` are not touched by this step. If the page's slide count, file size or wording refers to the old 12-slide deck, that needs its own decision, which this record does not make.

5. **Drive:** with the connector signed in as `ben.yang@gwmail.gwu.edu`, confirm it can read folder `1gSNclpsNdzgCbGy3EaQDqsV_NOUrI8Zf`, then upload the PPTX and PDF under their RC4 filenames. Do not overwrite or delete the existing files, so the earlier versions stay in the folder. If the connector still cannot see the folder, stop and report it.

6. **After deployment,** on the live site: download both files from the public links and compare their SHA-256 hashes with the table. Open the PDF and click a link on each of pages 2 to 11. Open the PPTX and do the same. Confirm the methodology link now resolves.

## Release decision

- **Agent assessment:** READY FOR HUMAN INSPECTION OF THE EXACT CANDIDATE FILES, with the limitations above.
- **Unchanged:**
  - the website and the public downloads in `public/research/fi002/`;
  - the live 12-slide deck in `output/`;
  - the current Drive presentation;
  - the revision 4, RC1, RC2 and RC3 archives.
- **Human editorial approval (name/date/version):** PENDING
