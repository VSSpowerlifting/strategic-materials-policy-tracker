# FI002 revision 6: cover options A and B for editorial comparison

- **What this is:** two versions of the FI002 deck, rendered by the same `cover_hero_split` renderer, that differ only in the cover image. Both are drafts and every slide keeps `DRAFT · REVIEW GATES PENDING`. Nobody has approved either one, and the default is unchanged: revision 6 in `../revision-6/` is still the candidate.
- **Option A:** the existing conceptual artwork (`../revision-6/assets/fi002-cover-contours.png`, unchanged).
- **Option B:** a NASA astronaut photograph of the Escondida tailings impoundment, taken 9 December 2009.
- **Shared change:** both options get the same new footer: "Benjamin Yang · Strategic Materials Policy Tracker · Research cutoff 5 November 2026". The byline and date come from `app/research/escondida-copper/page.tsx` ("By Benjamin Yang · Research cutoff 5 November 2026"). The publisher is the site name. The article gives no separate issue date, so the research cutoff is the dated element and no publication date was invented.
- **Comparison sheet:** [`SMPT_FI002_rev6_cover_options_side_by_side.png`](SMPT_FI002_rev6_cover_options_side_by_side.png) shows both covers at 2× from the PDFs. The "A" and "B" labels appear only on this sheet, not in the decks.

## Files

| File | SHA-256 |
| --- | --- |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6a.pptx` | `b38685512257a2781360ae82fe2f6b0d969263de3e882d0ecb1babeb774b429b` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6a.pdf` | `d9ed9d6c44c4328ddca9f662fe334a10337cc1c1c93f631febc3a56b14936960` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6a.spec.json` | `bf5cd8b2611e06dacc288cdcd0c2aac8fa035d9e40fff0d8f16757b679a5ab33` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6a.manifest.json` | `75f487e59a2d6c13b8f220f1917295b926c6d827165c1c336024c89c19d67bee` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6b.pptx` | `84e39e25a5edccbc13bc1ef6c862c2e6913f5fb2be2a1834ae25eb451590b6d2` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6b.pdf` | `f44347e7b064257ed892698fbf39a87ad6e4c044b9e00a035d769632b1ff06fe` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6b.spec.json` | `34eba3fe63e7a549237560db57b5f7e5471aba77d41125026ad22127487fcff0` |
| `SMPT_FI002_BHP_Copper_Strategy_Deck_rev6b.manifest.json` | `27c6e69ebcb245bfbcb6c49d17e5326f4b1314fcff3d8cb5e608be207c15bcdc` |
| `assets/fi002-cover-escondida-iss022-e-8282.jpg` | `a1ea806791fa14fb45a1ea521c196a9a49cbb53d7097276a32464f118cb17a83` |
| `assets/fi002-cover-escondida-iss022-e-8282.jpg.provenance.json` | `f3151b94ebbac5bbadd5d9e12afa980f329ed1afb8c6473a91cd50eecd525847` |
| `SMPT_FI002_rev6_cover_options_side_by_side.png` | `bed0c4f6d9862cd4b8f09a456c7ba5cfdbbcaa2a1aa2174f45e13e54d27c7a19` |

## Option B photograph: verification

| Check | Finding | Source |
| --- | --- | --- |
| Identity | NASA photo ISS022-E-8282, ISS Expedition 22, Nikon D2Xs, 800 mm lens | [NASA Gateway to Astronaut Photography, frame page](https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?mission=ISS022&roll=E&frame=8282) |
| Acquisition | 9 December 2009, 20:56:50 GMT; photo centre 24.4° S, 69.1° W | Same page |
| Subject | Tailings impoundment of the Escondida mine complex: a liquid-tailings pond, dried tailings and a retaining dam just over 1 km long. NASA's caption says the open pits lie to the north and are not shown. | Same page; [NASA Earth Observatory, 5 April 2010](https://science.nasa.gov/earth/earth-observatory/escondida-copper-mine-atacama-desert-chile-43394/) |
| Rights | NASA material, not protected by copyright; it may be reproduced without further permission. The requested credit is "Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center", with the photo number and eol.jsc.nasa.gov. No NASA logo is used and no endorsement is implied. | [Gateway FAQ, conditions of use](https://eol.jsc.nasa.gov/FAQ/default.htm), read 9 November 2026 |
| Source file | `https://eol.jsc.nasa.gov/DatabaseImages/ESC/large/ISS022/ISS022-E-8282.JPG`: 910,066 bytes, 4288 × 2929 px (the uncropped frame plus an 81 px catalogue label strip), SHA-256 `cb1e1632…c67ee`, downloaded 9 November 2026. The source file is not committed. | Download |
| Processing | Cropped to 4:5 (box 1000,0–3276,2845 px; the label strip is excluded) and downsampled to 1800 × 2250 px with Lanczos. The bottom of the image is darkened by a gradient (factor 1.0 at 1900 px down to 0.62 at 2080 px, held to the bottom edge) so the caption stays legible. No other edits. Full parameters are in the provenance file. | `assets/…provenance.json` |

**On the slide:** the caption reads "Escondida tailings impoundment, 9 Dec. 2009 · NASA ISS022-E-8282", bottom right in the existing caption style. It has no kicker label. The full credit line, the URL and the statement that the image shows 2009 operations, "not the open pits or the proposed New Concentrator", are in the speaker notes and the alt text. The slide face makes no claim about the concentrator.

**Considered and rejected:**
- NASA/JPL PIA11090 (ASTER, 23 April 2000) shows the pits and has the right shape, but it is credited "NASA/GSFC/METI/ERSDAC/JAROS". The JPL image-use policy says material owned by parties other than NASA/JPL may carry commercial-use restrictions, so it is not cleanly public domain.
- NASA SVS 15086 (a Landsat time series, 1985–2026) is published only as video.

## Verification

| Check | Result |
| --- | --- |
| Slides 2–11, PDF | Pixel-identical to revision 6, and so to revision 5, for both options: the maximum channel difference is 0 on every page at 2×. |
| Slides 2–11, PPTX | Option A differs from revision 6 only in `ppt/slides/slide1.xml` (the footer). Option B also differs in its cover media, slide 1 relationships and slide 1 notes. Every other part is byte-identical, so the financial figures and slides 2–11 are unchanged. |
| Reproducibility | Re-rendering each spec to a new path gives the same PPTX hash. |
| Verifier | `verify_editability.py` research tier: structural pass for both. |
| Fonts | PDF uses only Archivo Regular and Bold (`pdffonts`). |
| Footer | One line in both renders, with no wrap. |
| Caption contrast | `#B5AE9F` caption against the photo under the 45% overlay, measured on composited pixels in the caption box: about 4.0:1 before the gradient; 5.8:1 median and 5.1:1 worst pixel after it. Option A's caption sits on graphite (median 8.6:1), but where an artwork line passes behind it the contrast is lower (about 2:1 at the lines). |
| Renderer | Not changed. No new renderer and no change to the default. |
| Repository gates (9 Nov 2026) | `npm run validate` passed; `npm test` 1210/1210 pass; `npm run editorial:check` against merge base `5a16c14` exits 0 (no research page or review record changed). Lint, typecheck and build not re-run: this change adds only docs and assets, no code. |
| PowerPoint tier | Not run, because PowerPoint is not installed here. |

## Editorial notes for the reviewer

- B is a genuine Escondida image, but of the tailings facility, not the pit or the plant site. The caption says so. A reviewer may judge this an indirect subject for a deck about a concentrator decision.
- B shows the operation 17 years ago. Its date is on the slide, so it cannot be mistaken for current or proposed works.
- A is labelled "Conceptual artwork, not a map" and carries no factual claim.
- The gate E note from revision 6 still applies to both options: $2.83bn appears on the cover and again on slide 2.

## Release decision

- **Agent assessment:** both options are ready for human editorial comparison. No preference is set and the default is unchanged.
- **Human editorial choice and approval (name/date/option):** PENDING
