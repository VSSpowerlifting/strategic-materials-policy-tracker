# SMPT exhibit system

Added 7 November 2026 · Development reference for SMPT research decks. It is not part of the public site, and nothing here is cleared for publication.

The system turns a JSON fixture into a native, editable PowerPoint exhibit. It contains 39 registered patterns in 11 families. Each pattern has a data contract, integrity checks, an editability statement and a documented alternative it was chosen over. Use it with [Presentation Standard v2](../SMPT_PRESENTATION_STANDARD_V2.md), [Exhibit and Chart Rules](../EXHIBIT_AND_CHART_RULES.md), [Visual Integrity](../EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) and the [Visual Repertoire](../VISUAL_REPERTOIRE_AND_REFERENCES.md).

> **Synthetic data only.** Every name, figure and date in the fixtures, the gallery deck, the demo deck and the previews was made up for layout. None of it is an SMPT research finding. Fixtures use invented entities (such as "Programme Gamma" or "Facility Alpha"), a notional currency (`CU`) and demonstration cut-off dates. `parseFixture` rejects any fixture whose `classification` is not `synthetic-demonstration`, and every non-cover slide carries the synthetic notice.

## What is here

| Path | Contents |
|---|---|
| `patterns/<id>.json` | One spec per pattern: reader question, relationship, question types, required and incompatible data traits, capacity, use/avoid conditions, data contract, units, editability, integrity rules, table alternative, variations, limitations, excluded alternatives, design references |
| `fixtures/<id>.json` | Synthetic data plus slide title, subtitle, interpretation, source line and the `visual_text` strings verification must find |
| `exhibit-registry.json` | Generated, ordered registry of all patterns (family A–K, then order) |
| `exhibit-gallery.pptx` | Cover plus one slide per pattern; gallery slide = registry position + 2 |
| `demo-deck.json` / `demo-deck.pptx` | A 13-exhibit demonstration argument built from registered patterns |
| `element-manifest.json` | Every named object on every slide, with its editability tier |
| `editability-report.json` | Verification results, one entry per tier and deck |
| `gallery/index.html` | Static development gallery (noindex), generated from the registry |
| `gallery/previews/<id>.png` | LibreOffice renders of the gallery slides at 72 dpi |

Code lives in `scripts/exhibit-system/`, and tests in `tests/exhibit-system.test.ts`, which runs as part of `npm test`.

## Families

| Code | Family | Patterns |
|---|---|---|
| A | Comparison | ranked-bar, ranked-dot, grouped-bar, range-interval |
| B | Change between two observations | dumbbell, slope |
| C | Time series | annotated-line, small-multiples, indexed-lines |
| D | Composition | stacked-bar, percent-stacked, status-separated-capital |
| E | Reconciliation | waterfall, sources-and-uses, parallel-basis-panels |
| F | Sensitivity | tornado, sensitivity-grid |
| G | Relationship | scatter, threshold-scatter, bubble |
| H | Distribution and uncertainty | strip-plot, box-interval, histogram |
| I | Time and sequence | two-lane-timeline, swimlane, evidence-milestone-strip, stage-ladder, duration-bars |
| J | Structure and flow | state-diagram, condition-tree, value-chain-measured, conversion-flow, dependency-network, counterparty-map |
| K | Lookup and decision | criterion-matrix, role-matrix, option-profile, exhibit-with-interpretation, location-table |

## Commands

```bash
npm run exhibits:registry   # validate pattern specs and fixtures, write exhibit-registry.json
npm run exhibits:build      # write exhibit-gallery.pptx, demo-deck.pptx, element-manifest.json
npm run exhibits:verify     # structural + LibreOffice editability checks, write editability-report.json
npm run exhibits:previews   # render gallery/previews/*.png (needs soffice and pdftoppm)
npm run exhibits:gallery    # write gallery/index.html
npm run exhibits:select -- --question rank --traits single-measure --items 7
npm run exhibits:review     # deck-composition review of demo-deck.json (or pass a manifest path)
```

Run them in that order after changing a pattern or fixture. Builds are deterministic: zip timestamps and document dates are fixed, so an unchanged input rebuilds byte for byte.

**Dependencies.** `pptxgenjs` 4.0.1 and `jszip` 3.10.1 are exact-pinned repository devDependencies. Run `npm ci` with development dependencies enabled. Generation imports these packages normally and needs no Codex runtime or `NODE_PATH`. Verification and previews use Python 3 (standard library), LibreOffice Impress and Poppler. Tool lookup uses `SOFFICE` / `PDFTOPPM`, then `PATH`, then standard installation locations; it never searches a private runtime. A missing LibreOffice tier is reported as skipped, never passed.

```sh
# macOS
brew install --cask libreoffice
brew install poppler
# Debian / Ubuntu
sudo apt-get install libreoffice-impress poppler-utils
```

An environment may provide these executables on `PATH`; this does not change the portable installation requirements.

**Fonts.** Decks name Archivo and embed no font files. Font binaries must not be committed. For faithful previews, point `FONTCONFIG_FILE` at a fontconfig file that includes a local Archivo directory. Without it, `render_previews.py` warns and LibreOffice substitutes another face.

## Selecting a pattern

1. Write the slide's reader question and the relationship the evidence supports.
2. Run `exhibits:select` with the question type, the data traits that are true of the evidence (for example `single-measure`, `two-observations`, `non-comparable-bases`), and the item count. It returns matching patterns with the reasons each matched. It also lists every rejected pattern with the reason: wrong question type, missing trait, incompatible trait or over capacity.
3. Read the candidate's `use_when`, `avoid_when`, `limitations` and `table_alternative` against the real evidence. Selection is advisory; it does not check sources.
4. Record the chosen family in the slide manifest. If a table is chosen for timing, change or state evidence, record a `table_reason`, as the Visual Repertoire requires.

## Deck review

`exhibits:review` reads an exhibit-system deck spec, a presentation-v2 `slide-specs` file or an executive slide-content array. It applies the objective and heuristic rows of the Visual Integrity standard, section 5. It flags:

- the slide ceiling
- runs of tables or one repeated family
- tables without a `table_reason` where a visual alternative exists
- missing source lines
- prohibited phrasing
- low family variety

Findings are `HOLD`, `REVIEW` or `INFO`, and `--strict` exits non-zero on `HOLD`. The tool never grants a pass. Review gates A–E remain human decisions.

## Editability

Each object is named `role:name` and recorded in `element-manifest.json` with one tier:

| Tier | Meaning | Patterns |
|---|---|---|
| `native-chart` | PowerPoint chart with an embedded workbook; values change through Edit Data | 14 |
| `native-chart-with-helper-series` | Native chart that uses invisible helper series (no fill, labels deleted) for geometry such as floating waterfall bars; edit the visible series, keep helpers consistent | 1 |
| `native-shapes` | Positioned native shapes and text boxes. Editable as objects, but not data-bound, so a new value means moving shapes by hand | 18 |
| `table` | Native PowerPoint table | 6 |
| `text` | Native text boxes (titles, interpretation, source, notices) | all slides |
| `raster` | Embedded image | none in the gallery; only a research `cover_hero_split` cover image |

Each pattern spec states what is editable, what is positioned but not data-bound, and what (if anything) is raster. No exhibit pattern uses a raster image. The one permitted raster is a research cover's hero image (see below), which never carries data.

**Verification levels.** These are reported separately in `editability-report.json` and are never merged:

1. **Structural (automated, passing).** The OOXML is inspected for:
   - every manifest name present and nothing unnamed added
   - zero `p:pic` elements, except one cover hero image that the manifest declares as a `raster` frame and that has alt text
   - every chart backed by an embedded workbook that opens
   - helper series that are transparent with labels deleted
   - tables as `a:tbl`
   - fixture `visual_text` present
   - the synthetic notice on every non-cover slide
   - Archivo as the only explicit Latin typeface
2. **LibreOffice (automated, passing).** Headless conversion to PDF must give one page per slide. A re-save to PPTX must keep the same number of chart parts and no images.
3. **PowerPoint (manual, not performed).** Opening, using Edit Data and saving in Microsoft PowerPoint has not been tested. Treat PowerPoint behaviour as unverified until someone records that test. Font metrics, label placement and bubble scaling may differ from the LibreOffice previews.

## Adding a pattern

1. Write `patterns/<id>.json`, following an existing spec. Add a reference key only if the reference is in `REFERENCES` in `registry.ts`.
2. Write `fixtures/<id>.json` with `"classification": "synthetic-demonstration"`, invented entities and an explicit demonstration source line.
3. Implement a `Renderer` in `scripts/exhibit-system/renderers/` with three parts:
   - `parse`, which reads the data through the `contract.ts` helpers
   - `check`, which returns integrity issues through the `integrity.ts` rules
   - `render`, which draws through the named-object helpers in `primitives.ts`
4. Register the renderer in `renderers/index.ts`.
5. Add tests for the renderer's integrity rules, then run the command sequence above and `npm test`.
6. Inspect the new preview at full size before relying on it.

## Boundaries

- The gallery is a local development document. Do not link it from, or deploy it with, the research site without separate authorization.
- Consulting references are linked by URL and page in the registry. No external slide artwork, screenshot, logo or font is reproduced. The patterns are original SMPT compositions.
- A pattern is a form. Using one in a publication still requires the controlling model, the evidence register and the five review gates.

## Browsing the portfolio

Open [the gallery](gallery/index.html) locally. Search includes names, reader questions, data traits, integrity rules and use/avoid guidance. Family and editability filters combine with search, and the URL preserves them when served over HTTP. Family navigation clears other filters. Select two patterns to reveal a persistent comparison tray; enlarge any thumbnail for the full preview. Escape closes the dialog and returns focus. On narrow screens comparisons stack vertically. The pattern reference and image links remain available without JavaScript.

The editable source link on each pattern names its slide in [the gallery PPTX](exhibit-gallery.pptx). [The demo deck](demo-deck.pptx) shows 13 exhibits in a sequence. These are development documents; no public route or deployment is involved. For local HTTP browsing:

```sh
python3 -m http.server 8764 --bind 127.0.0.1 --directory docs/design/presentations/exhibit-system
# Open http://127.0.0.1:8764/gallery/index.html
```

Optional browser acceptance automation lives in `scripts/exhibit-system/check-gallery-browser.mjs`. It starts its own loopback server and tests search, combined filters, no matches, URL persistence, comparison selection/reset, previews, Escape/focus return, every PNG, PPTX downloads, responsive overflow and no-JavaScript browsing. Run `npm run exhibits:browser` with Playwright and its Chromium installed separately. `EXHIBITS_PLAYWRIGHT_MODULE` may name an absolute module entry file; `EXHIBITS_BROWSER_CHANNEL=chrome` uses an installed Chrome. Neither is needed to generate or browse the gallery.

## Research integration: draft output only

```sh
npm run exhibits:render -- /path/to/research-spec.json /path/to/private/draft.pptx
npm run exhibits:review -- /path/to/research-spec.json --strict
python3 scripts/exhibit-system/verify_editability.py --deck /path/to/private/draft.pptx --manifest /path/to/private/draft.manifest.json
```

Keep the spec and outputs outside this synthetic exhibit-system directory. Outputs must also be outside `public/` and `app/`. Existing decks and manifests cannot be overwritten. Symlinked directory paths are resolved before checking those boundaries. No controlled research product is migrated by this work.

The input object requires `classification: "research"`, a title, optional `cover_lines` or `cover` (below), an `evidence` array and `slides`. Each evidence entry requires a unique `id`, an HTTP(S) `url`, document `title` and source `locator` (page, section, table or model cell). Each slide names a registered `pattern`, a `label`, optional `table_reason` and an `exhibit` containing `title`, `subtitle`, `annotation`, `source`, nonempty `evidence_refs`, renderer `data`, optional `layout` and optional `visual_text`. References must resolve to evidence entries. All renderer parsing and integrity checks run before writing. Composition HOLDs, including the 20-slide research ceiling counting the generated cover, block generation. REVIEW findings are recorded for human adjudication.

Evidence references and full source metadata are retained in the manifest and speaker notes. This checks traceability and data contracts; it does **not** establish source authenticity, legal effect, analytical validity or human approval. The generated manifest records hashes of the input and PPTX, composition findings, `pending-human-review` gates and `not-granted` publication authorization. Research structural verification checks the PPTX hash, evidence-reference presence and draft labels.

`qc_record` in the spec or `--qc-record <file>` attaches technical QC metadata only. A relative spec path resolves beside the spec. Its contents never confer authority: **every research slide and cover retains `DRAFT · REVIEW GATES PENDING`, even if a QC file claims approval**. Publication still requires the controlling evidence/model review and explicit human gates A–E in a separate publication workflow. This tool has no release mode.

### Cover pattern: `cover_hero_split`

A research spec may replace `cover_lines` with a `cover` block (giving both is an error). The cover is a graphite field. The left 6 inches hold the title, subtitle, a one-sentence thesis, an optional key-figure callout, the draft notice and a footer. The right side is a full-height hero image under a graphite overlay at 45% transparency, so the artwork sits back and the text keeps its contrast. Every element is a named native text box or shape except the image, which is the only raster the verifier accepts.

```jsonc
"cover": {
  "pattern": "cover_hero_split",
  "title_lines": ["…", "…"],            // must join with spaces to the deck title
  "subtitle_lines": ["…"],
  "thesis": "One sentence, qualifiers kept.",
  "thesis_source": "Where the wording comes from (goes to speaker notes)",
  "callout": { "value": "$2.83bn", "label": "What the figure is\nWhat it is not", "basis": "Model cell", "evidence_refs": ["S01"] },
  "footer": "Strategic Materials Policy Tracker · Research cutoff: …",
  "hero": { "image": "assets/x.jpg", "sha256": "…", "alt": "…", "credit": "…", "caption": "…" }   // caption is optional
}
```

Rules the parser enforces: the image is a PNG or JPEG beside the spec, outside this directory, and must match its pinned SHA-256; the callout's evidence references must resolve; alt text and a credit are required. The `caption` is **optional**. When given it is drawn on the slide; when omitted the cover carries no image caption, and the credit, date caveats and subject description live in the alt text, speaker notes, the asset's provenance file and the PDF's accessibility metadata. Speaker notes hold the thesis source, the callout's basis and evidence, and the image credit and hash, one paragraph each.

`cover_hero_split` stays optional. For a flagship deck, prefer a relevant, rights-cleared photograph of the actual subject, with its origin, acquisition date, what it does and does not show, licence and requested credit recorded in a provenance file beside the asset. Do not force a visible caption or disclaimer onto the cover: attribution belongs in the notes, alt text and source documents unless the licence requires it on the slide. Never state a photo date, location or subject the provenance does not support, and never imply that the owner of the subject or the photo's publisher endorses the deck.

If no suitable photograph exists, fall back to original abstract artwork made by a reproducible script (`scripts/exhibit-system/cover_art.py` writes a provenance file beside its PNG), then a plain texture. Generated artwork must never look like a map or a picture of a real site, and must say it is conceptual (use a caption for that). Title sizes follow the presentation standard (36–46 pt); break `title_lines` by hand so no line runs into the image. Check text contrast against the rendered cover, not the source image.

## Diversity and scope

The library has no pattern-count quota. Add a pattern only when its analytical relationship earns a distinct encoding. Financing coverage includes reconciliation, sources/uses, status separation and scenario sensitivities; strategy includes criteria, options and condition trees; operations includes durations, milestones, states and quantified conversion; relationships include scatter/bubble, directed dependencies and qualitative counterparty roles.

The original radial **counterparty-map** adds an unweighted ego network around one project. Equal spokes make the shared exposure easy to see without inventing a directional chain. Angle and radius carry no analytical meaning. Use the dependency network for directed chains, the role matrix for several organisations across roles, and a table when amounts or edge-specific evidence must be read precisely. A radar chart would impose artificial common scales on qualitative roles; a donut would suggest parts of a whole. Neither is added for visual novelty.

See [the final engineering review](FINAL_REVIEW.md) for recovery provenance, checks, remaining limits and the manual PowerPoint acceptance procedure.
