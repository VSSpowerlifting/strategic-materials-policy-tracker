# SMPT Publication Design System

Status: v3.0, **draft awaiting maintainer approval** of the palette and type positions below. Nothing here changes a published binary, a finding or a data record.

This document is the map between the website identity in [Architectural Research Studio](ARCHITECTURAL_RESEARCH_STUDIO.md) and the things SMPT produces off the website: decks, executive memos, report covers, social images and financial exhibits. The rules for each product stay in their own standards; this file says where the shared values live, how each medium applies them, and which tools enforce them.

## One source of values

`docs/design/publication-tokens.json` is the only place publication colours, faces, sizes and geometry are defined. It is read by `scripts/publication/tokens.ts` (the exhibit system) and `scripts/publication/tokens.py` (python-pptx, reportlab, Pillow). `tests/publication-tokens.test.ts` compares it with `app/globals.css`, so the website and the publication files cannot drift apart silently. Change the JSON, then the CSS if the website should follow; do not copy hex values into a generator.

| Role | Value | Notes |
| --- | --- | --- |
| Ground (plaster) | `#F6F5F1` | Every slide, memo and cover. Graphite is never a slide ground. |
| Text (graphite) | `#1B1E21` | Slate `#555B61` and faint `#61666C` for secondary text; all pass 4.5:1 on plaster. |
| Accent (malachite) | `#1F5C4D` | Links, the focus mark, the highlighted series. |
| Functional | hematite `#9A3324`, ochre `#9A6A12` | Negative or at-risk; caution or unverified. Ochre is a mark or rule, never text. |
| Series (data) | graphite, malachite `#1E6353`, hematite, lapis `#4A7FD0`, ochre `#A27017`, plum `#8B4491` | The last three carry a dash (`7 4`) so series stay distinguishable without colour. |
| Neutrals | `#3D4247`, `#83888D`, `#C8CBCC` | Marks and fills only, never text. |
| Sequential ramp | `#E6EDE9`, `#C4D7CF`, `#8FB3A6`, `#4F8272`, `#1E6353` | One magnitude, one hue. Interpolating between adjacent steps is allowed. |

Text on a plate fill (`#FDFDFB`) is allowed only on graphite or malachite. Pure white is not used.

## Type

- **Spectral** (Regular; 300 to 500 available): covers, section dividers, one governing statement on an executive-answer slide, and memo and report titles. Never below 28 pt, never inside an exhibit.
- **Archivo**: analytical slide titles (26 pt), body text, tables, chart labels, source footers and dense financial content. Sentence-case labels, no tracked capitals.
- **JetBrains Mono**: record identifiers only.
- A missing Spectral or Archivo stops every build. PowerPoint cannot embed fonts, so the **PDF export is the canonical form**; the PPTX is the editable source and needs both faces installed. Font binaries are never committed.

## Covers and imagery

Use the live [Research index](https://strategic-materials-policy-tracker.vercel.app/research) and the corresponding article as the visual references for a deck, report or social cover. Start with a clear Spectral title, a short Archivo standfirst if it adds context, and a compact byline and date. Use the plaster ground, fine rules and consistent alignment to frame the page. Interior slides and report pages use the same type roles and put the evidence first.

When the website cover has a documentary photograph that fits the publication and its license permits reuse in the export, use that asset from the site’s registry (`lib/photography.ts`). Keep the caption with the subject, location, date, credit and source link. Keep any qualification needed to understand what the image depicts. Use a crop that keeps the identified subject visible, and carry its alt text into the deck or tagged PDF when the format supports it. A site image can be cleared for one use and need a separate rights check for another.

When there is no suitable cleared photograph, use the shared typographic cover. A case can also open on a sourced exhibit when it explains the finding directly. Use the documentary image as a cover element or as evidence where it helps the reader. Follow the [automatic cover policy](../research/AUTOMATIC_COVER_POLICY.md) for image selection and provenance.

## Applying the system by medium

| Medium | Layout | Tool | Check |
| --- | --- | --- | --- |
| Research deck (cover, answer, exhibits, method) | 13.333 x 7.5 in, plaster ground, hairline rules, 0.62 in margins, source footer on every slide | `templates/create_master.py` (python-pptx starter) and `scripts/exhibit-system/` (pptxgenjs exhibits and research decks) | `scripts/publication/check_deck.py`, `npm run exhibits:verify`, rendered-page review |
| Executive memo | US Letter, 0.9 in margins, Spectral title, Archivo body, one exhibit table | `scripts/publication/memo.py` | PDF font and page-count check |
| Report cover | US Letter, centred Spectral title, hairline sheet rule with registration tick, definition grid | `scripts/publication/cover.py` | PDF font check |
| Social image | 1200 x 630 PNG, same title block; flattened, so the page that uses it supplies the alt text | `scripts/publication/cover.py` | Visual review |
| Financial exhibits | Native shapes, true to scale from zero, labelled units and status, one idea per exhibit | `scripts/exhibit-system/` renderers; rules in [Exhibit and Chart Rules](presentations/EXHIBIT_AND_CHART_RULES.md) | `exhibits:verify` (editable objects and geometry) |

Both generators also brand the PPTX theme part (colour scheme "SMPT Studio", Archivo/Spectral theme faces), so a shape a user adds in PowerPoint starts from SMPT colours and fonts rather than the Office defaults.

Shared conventions: conclusion-led titles, one source line per slide, the status distinction (announced, committed, drawn, operating) kept visible, outlined rather than filled shapes for anything uncommitted or unverified, and no gradients, shadows or tinted cards. Do not force one layout on every product; the memo, the deck and the cover share values, not a template.

## Commands

```bash
# Starter deck (python-pptx), checked and rendered
uv run --with python-pptx python docs/design/presentations/templates/create_master.py out.pptx
python3 scripts/publication/check_deck.py --strict out.pptx

# Memo and cover (reportlab)
uv run --with reportlab python scripts/publication/memo.py spec.json memo.pdf
uv run --with reportlab python scripts/publication/cover.py spec.json out_dir

# Exhibit system (pptxgenjs)
npm run exhibits:build && npm run exhibits:verify

# Tests for the tokens and the checker
node --import tsx --test tests/publication-tokens.test.ts
```

`check_deck.py` exits 0 when clean, 1 on violations, 2 on a usage error. It flags non-token colours, non-token faces (theme faces are resolved), Spectral below 28 pt, gradients, shadows and large corner radii. It does not resolve text contrast over fills or replace the rendered-page review.

## Migration status

Migrated to v3: the Presentation Standard (content v3.0; the file keeps its V2 name so links stay valid), Exhibit and Chart Rules, the house style cross-references, the exhibit system and its gallery (decks, previews, element manifest), the starter template, the memo and cover generators, and the validation package in [validation/](presentations/validation/README.md).

### Legacy generators and compatibility concerns

These were not changed. Each either writes protected historical artifacts or has no safe migration without regenerating one.

| Item | Why it stays |
| --- | --- |
| `docs/research/fi002-bhp-copper/`, `public/research/fi002/` | Published FI002 binaries and sources; protected. |
| FI001 and R001 binaries, including `public/research/fi001/presentation-v2-archivo.pptx` | Published; protected. `check_deck.py` correctly rejects the FI001 deck (graphite-and-gold, Archivo only). |
| `scripts/prepare-fi002-public.py`, `scripts/fi002-review-assets.py`, `scripts/reissue_archivo_decks.py` | Write or reissue historical publications. |
| `docs/design/presentations/examples/render_visual_repertoire.py` and its SVG/PNG | Needs matplotlib and uses the v2 gold palette. The images are labelled as frozen v2 illustrations. |
| `docs/design/presentations/SMPT_PRESENTATION_STANDARD_V2.md` file name | Content is v3.0; renaming would break inbound links. |
| Root Open Graph image | Rendered by the site in the built-in sans, not Spectral or Archivo. |
| PPTX font embedding | Not possible in PowerPoint; the PDF export is canonical. |
| Tabular numerals (memo, cover and decks) | The house style asks for tabular figures in financial tables. No generator can enable the OpenType `tnum` feature (reportlab, python-pptx and pptxgenjs expose no font-feature control), so numerals are right-aligned instead and alignment depends on Archivo's default figures. |

## Applying the system to FI003

Do this in a separate production phase; this migration does not regenerate FI003 or touch its analysis.

1. Keep every finding, calculation, evidence register, model, publication date and source cut-off as approved. Change presentation only.
2. Read the [house style](../research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md), the [Applied Strategy Standard](../research/SMPT_APPLIED_STRATEGY_STANDARD.md) and the [Presentation Standard](presentations/SMPT_PRESENTATION_STANDARD_V2.md) first.
3. Build the deck through `scripts/exhibit-system/research-deck.ts` with the FI003 slide manifest and real fixtures. That path rejects synthetic fixtures by design. Use the exhibit families the manifest already plans; keep tables where exact comparison matters.
4. Produce the memo and cover from specs through `memo.py` and `cover.py`, with the approved title, status and dates, and the social image alt text.
5. Run `check_deck.py --strict`, `exhibits:verify`, the editorial checks, and review every rendered page for clipping, font substitution and legibility of dense financial content.
6. Export the PDF as the canonical form, confirm only Archivo and Spectral are embedded, text is selectable and every source link works.
7. Record the five review gates in the publication QC handoff. Automated passes do not stand in for the maintainer's approval.
8. Do not overwrite any published FI001, FI002 or R001 file; version FI003 outputs as their own paths.
