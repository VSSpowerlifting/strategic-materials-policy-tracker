# SMPT exhibit system

Added 7 November 2026 · Development reference for SMPT research decks. It is not part of the public site, and nothing here is cleared for publication.

The system turns a JSON fixture into a native, editable PowerPoint exhibit. It contains 38 registered patterns in 11 families. Each pattern has a data contract, integrity checks, an editability statement and a documented alternative it was chosen over. Use it with [Presentation Standard v2](../SMPT_PRESENTATION_STANDARD_V2.md), [Exhibit and Chart Rules](../EXHIBIT_AND_CHART_RULES.md), [Visual Integrity](../EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) and the [Visual Repertoire](../VISUAL_REPERTOIRE_AND_REFERENCES.md).

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
| J | Structure and flow | state-diagram, condition-tree, value-chain-measured, conversion-flow, dependency-network |
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

**Runtime.** `pptxgenjs` and `jszip` are not repository dependencies. `build-gallery.ts` resolves them from the bundled Codex runtime, or from the directory in `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Verification and previews use `python3`, and the LibreOffice tier uses `soffice`. Without `soffice`, that tier is reported as skipped, not passed.

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
| `native-shapes` | Positioned native shapes and text boxes. Editable as objects, but not data-bound, so a new value means moving shapes by hand | 17 |
| `table` | Native PowerPoint table | 6 |
| `text` | Native text boxes (titles, interpretation, source, notices) | all slides |
| `raster` | Embedded image | none used |

Each pattern spec states what is editable, what is positioned but not data-bound, and what (if anything) is raster. No pattern uses a raster image.

**Verification levels.** These are reported separately in `editability-report.json` and are never merged:

1. **Structural (automated, passing).** The OOXML is inspected for:
   - every manifest name present and nothing unnamed added
   - zero `p:pic` elements
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
