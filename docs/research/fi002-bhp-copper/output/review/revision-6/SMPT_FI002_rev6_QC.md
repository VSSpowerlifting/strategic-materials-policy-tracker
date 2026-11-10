# FI002 executive deck — revision 6 (cover review candidate) quality-control record

- **What this is:** a review candidate for a new cover on the FI002 executive deck, built with the new `cover_hero_split` pattern. The deck is still a draft: every slide keeps `DRAFT · REVIEW GATES PENDING`. Nothing is live, and no human has approved it.
- **What changed:** slide 1 only. Slides 2 to 11 are the revision 5 slides, byte for byte. Revision 5 is RC4's source: it still has the draft badges and no source links, so this candidate is not a drop-in for the published RC4 deck, which is untouched. A release version would need its own RC5 step.
- **Spec:** [`SMPT_FI002_BHP_Copper_Strategy_Deck_rev6.spec.json`](SMPT_FI002_BHP_Copper_Strategy_Deck_rev6.spec.json). It is the revision 5 spec with the title's apostrophes made curly and `cover_lines` replaced by a `cover` block. `slides` and `evidence` are identical to revision 5.
- **Renderer:** `npm run exhibits:render` with the `cover_hero_split` support added in this branch. The PDF was exported by LibreOffice with the installed Archivo faces, the same route as revision 5.
- **Research cutoff:** 5 November 2026, unchanged.

## Files

| File | SHA-256 |
| --- | --- |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6.pptx` | `4f57add538ff7b0c13ab7e0053efc707db47e7a29efa46761cfa2929bd6ba664` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6.pdf` | `30e20c2690a855ec2a2178cc7f521f43c2e6137eb1d26665e22f05c9fb5f8e09` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6.manifest.json` | `971c0810a98677e87894ff2e7086186ce53a9178ca102198d16ba389f1c1d2de` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6.spec.json` | `591658e8f896bff2b4bb4035c64737cc2db0ef362a59c8cab295984bf8d63539` |
| `SMPT_FI002_rev6_contact_sheet.png` | `a80a603f9b4f25a7dbe55295a8401cca27fa5e92cd4d00061529e8908d341f21` |
| `assets/fi002-cover-contours.png` (hero image) | `8f743f5fcd35f2dbe133a958db6fc3871f6384c5b820d3c7f106ce0b7a105647` |
| `assets/fi002-cover-contours.png.provenance.json` | `38ebcf18549af24aef29064760c56ef37361cfdd03c07345bafe030446b95231` |
| `renders/slide-01.png` to `slide-11.png` | 2× renders of the PDF pages |

Revision 5 was re-hashed afterwards and is unchanged (PPTX `071a67e8…`, PDF `2e449d0c…`, spec `7b07df24…`, manifest `dab173b6…`, the values in the RC4 record).

## The cover

| Element | Content | Basis |
| --- | --- | --- |
| Title | Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision | `lib/fi002.ts` publication title (curly apostrophes, as published) |
| Subtitle | Near-term earnings exposure and the economics of replacement | Revision 5 cover line |
| Thesis | Goldman Sachs’ higher copper outlook implies a large near-term earnings sensitivity for BHP, while the proposed Escondida concentrator will be judged on the mine output and cash flow it preserves over a much longer period. | Lede of `app/research/escondida-copper/page.tsx`; "implies", "sensitivity" and "proposed" are kept |
| Callout | $2.83bn · FY2026-static EBITDA sensitivity to Goldman’s reported $1,600/t copper revision · An illustration, not a 2027 forecast | Model `SMPT_FI002_BHP_Copper_Model.xlsx`, tab 04 Operating Sensitivity, D45 = 2,830.416 (US$m, "GS revision FY26-static EBITDA"); tab 09 Decision Dashboard D6 = 2,830.416, labelled "Illustration, not 2027 forecast or FCF". The same figure as slide 2's headline. Evidence S01, S18, SMPT. |
| Hero image | Gold contour lines on graphite, suggesting terraced benches | Original artwork from `scripts/exhibit-system/cover_art.py`, seed 2026. Not a map or image of Escondida. The slide caption says "Conceptual artwork, not a map". |
| Footer | Strategic Materials Policy Tracker · Research cutoff: 5 November 2026 | Revision 5 cover line |

The speaker notes give each of these sources, one paragraph each, plus the image's SHA-256.

**Palette and contrast** on the graphite field `#12110F`: title and subtitle `#F5F3EE` 17.0:1; thesis and callout label `#D8D3C7` 12.6:1; footer and caption `#B5AE9F` 8.6:1; callout value and draft notice `#C8993E` 7.3:1. The house gold `#98752D` (4.4:1) appears only in the artwork's fine lines, never in text. No green. Archivo only.

**Image rights.** The artwork is generated from scratch by a script in this repository. It uses no photograph, map data, elevation data or model output. The provenance file records the parameters, library versions and hash, so a reviewer can rebuild it and compare bytes.

### Licensed photograph: searched, not downloaded

The first preference was a licensed Escondida photograph. Wikimedia Commons was searched on 9 November 2026 and nothing was downloaded. The best candidates:

| File | Licence on Commons | Date | Notes |
| --- | --- | --- | --- |
| [Escondida Mine, Chile (ASTER).jpg](https://commons.wikimedia.org/wiki/File:Escondida_Mine,_Chile_(ASTER).jpg) | Public domain (NASA/METI/AIST/Japan Space Systems, catalogued by JPL) | 23 April 2000 | 2000×2500 portrait, which fits the panel. A 26-year-old scene would need a dated caption. Check the METI/AIST attribution terms before use. |
| [Escondida Copper Mine, Atacama Desert, Chile 2009-12-09 lrg.jpg](https://commons.wikimedia.org/wiki/File:Escondida_Copper_Mine,_Atacama_Desert,_Chile_2009-12-09_lrg.jpg) | Public domain (ISS Expedition 22 crew photograph, NASA Earth Observatory) | 9 December 2009 | 1440×960 landscape, so it needs a heavy crop for a 6×7.5 in panel. |
| [Mina La Escondida (Chile).jpg](https://commons.wikimedia.org/wiki/File:Mina_La_Escondida_(Chile).jpg) | CC BY-SA 3.0 | — | Share-alike licence; check before using it in a deck under SMPT terms. |

Downloading needs explicit permission and a decision about how a dated image is captioned, so this candidate uses the artwork. To switch, drop the file beside the spec, update `hero.image`, `sha256`, `alt`, `caption` (with the date and credit) and `credit`, and re-render.

## How to rebuild

From the repository root (the PPTX is byte-reproducible; the renderer refuses to overwrite, so render to a new path and compare hashes):

```bash
python3 scripts/exhibit-system/cover_art.py --seed 2026 --width-in 6.0 --height-in 7.5 --out /tmp/art/fi002-cover-contours.png   # with numpy, matplotlib, pillow
npm run exhibits:render -- docs/research/fi002-bhp-copper/output/review/revision-6/SMPT_FI002_BHP_Copper_Strategy_Deck_rev6.spec.json /tmp/rev6/rev6.pptx
```

The PDF was exported with `export_pdf()` from `release/make_release_candidate.py` (LibreOffice, temporary profile with the installed Archivo faces, tagged PDF). The renders are each PDF page drawn by PyMuPDF at 2× scale, and the contact sheet comes from `contact_sheet()` in `scripts/reissue_archivo_decks.py`. Those two steps were run from a scratch script that is not committed.

## Verification

| Check | Result |
| --- | --- |
| Slides 2–11, PPTX | Byte-identical to revision 5. Against revision 5, only `docProps/core.xml` (title), `ppt/slides/slide1.xml`, its relationships, `ppt/notesSlides/notesSlide1.xml` and the new `ppt/media/image-1-1.png` differ. |
| Slides 2–11, PDF renders | Pixel-identical to revision 5 at 2× (maximum channel difference 0 on every page). |
| Hero raster | One `p:pic` on slide 1, none elsewhere. It is declared in the manifest as a `raster` frame and has alt text. `verify_editability.py` research tier: **pass**. |
| PDF | 11 pages, tagged, Archivo Regular and Bold only, document title with curly apostrophes. |
| Callout figure | 2,830.416 in tab 04 D45 and tab 09 D6 rounds to $2.83bn, the figure on slide 2. |
| Default renderer unchanged | Re-rendering the revision 5 spec reproduces its committed PPTX hash `071a67e8…`. `npm run exhibits:build` leaves the gallery and demo deck byte-identical (no change under `docs/design`). |
| New tests | `tests/exhibit-hero-cover.test.ts`: hash pinning, title-line join, `cover` and `cover_lines` exclusive, callout references, required caption and image type; the image helper refuses non-frame roles and blank alt text; an end-to-end render passes the verifier, puts each notes line in its own paragraph, and fails the verifier once the manifest stops declaring the image. |
| Repository gates (9 Nov 2026) | `npm run validate` passed (78 events, 109 financial commitments, 46 control measures). `npm run lint`: 0 errors, 28 pre-existing warnings. `npm run typecheck` passed. `npm test`: 1210 of 1210 pass (re-run after merging `main` at `5a16c14`). `npm run build` passed. `npm run exhibits:build` passed, and `git status` shows no change to the generated gallery files (only the README edit in this branch). All six exited 0. |
| PowerPoint tier | **Not run.** PowerPoint is not installed here. Opening the deck, checking the image sits behind the overlay and that the text boxes edit cleanly is outstanding. |

## Review gates

The agent's assessment, for a human reviewer to confirm or overturn. None of these is an approval.

| Gate | Assessment | Evidence |
| --- | --- | --- |
| **A. Analytical substance** | PASS (cover only) | The thesis states the deck's two-part argument (near-term sensitivity, long-term replacement economics) without adding a claim. Slides 2–11 are unchanged and keep their revision 5 gate status. |
| **B. Prose authenticity** | PASS, pending an editor | Four text blocks; no slogans, kicker labels or rhetorical framing. The thesis is the published lede, not new copy. |
| **C. Visual integrity** | PASS, pending an editor | Every slide rendered and inspected; contact sheet reviewed. The artwork is labelled as conceptual on the slide and in its alt text, and carries no data. Contrast numbers above. No clipping or font substitution in the PDF. |
| **D. Quantitative/source fidelity** | PASS | $2.83bn traced to two model cells and slide 2; qualifiers ("FY2026-static", "reported", "an illustration, not a 2027 forecast") kept on the slide. Title matches `lib/fi002.ts`. |
| **E. Publication coherence** | REVIEW | The cover now repeats slide 2's headline figure. That makes the opening stronger but means $2.83bn appears twice in a row; an editor should decide whether that is wanted. Layout A in the presentation standard also lists author and issue date, which neither this cover nor revision 5's carries. |

## Limitations

- **Not released.** Producing a public RC5 (draft badge removed, links added as in RC4) is a separate, human-gated step through `release/make_release_candidate.py`, which has no `rc5` entry yet.
- **PowerPoint untested,** as above.
- **Editorial gate.** `npm run editorial:check` against the merge base reports that no published research page or review record changed, and exits 0. This branch does not touch `app/research/<slug>/page.tsx`, so it needs no editorial review file.
- **Notes split.** Speaker notes containing line breaks are now written one paragraph per line. Revision 5 and every gallery deck have no such notes, so their bytes do not change.

## Release decision

- **Agent assessment:** READY FOR HUMAN REVIEW OF THE COVER.
- **Human editorial approval (name/date/version):** PENDING
