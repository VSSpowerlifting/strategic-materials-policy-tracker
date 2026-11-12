# SMPT Presentation Standard v3.0

Adopted **5 November 2026** · Applies to **new and revised research presentations**  
Visual repertoire update **6 November 2026**. Identity update (v3.0) **11 November 2026**: decks adopt the Architectural Research Studio palette and type pairing; length budgets, narrative architecture, exhibit discipline and publication gates are unchanged. The file keeps its `_V2` name so existing links hold.
Companion standards: [Exhibits and Chart Rules](EXHIBIT_AND_CHART_RULES.md) · [Editorial Authenticity & Visual Integrity](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) · [Visual Repertoire & Consulting References](VISUAL_REPERTOIRE_AND_REFERENCES.md) · [Reference Analysis](REFERENCE_ANALYSIS.md)

## Purpose and operating principles

An SMPT research deck answers a real economic, financing or strategy question. It should be persuasive **because the evidence is traceable and the analysis is coherent**, not because the slides resemble a consulting firm's marketing material.

A successful deck enables a professional reader to:
- Understand the governing question, answer, and confidence level quickly.
- Verify that the exhibits substantiate each principal claim.
- Distinguish announcements, authorized commitments, executed financing, disbursement, operational production and commercial cash receipts.
- See what analytical work SMPT performed rather than simply reading corporate or government claims.
- Locate sources, model inputs, dates and limitations without searching the entire publication.

The five governing tests are **argument**, **evidence**, **economic mechanism**, **decision relevance**, and **visual legibility**. Failing any one requires revision.

## 1. Length budgets — including everything

| Product | Typical total | Maximum total | Main use |
|---|---:|---:|---|
| Executive briefing | 5–8 | 8 | Answer-first institutional briefing |
| Applied Strategy | 9–14 | 16 | Compare actual decisions and modeled trade-offs |
| Financial Intelligence | 12–18 | 20 | Financing mechanics, scenarios and commercial execution |
| Research dossier presentation | 12–18 | **20** | Visual companion to a full written dossier |

**Twenty is a hard ceiling, including cover, contents, section dividers, executive findings, methods, references and appendix.** Target 14–18 for substantial financial cases. The body must not become a 20-slide dump just because the maximum exists. A 9-slide argument with nine strong exhibits is better than 18 redundant slides.

Long methods tables belong in an accompanying source appendix or workbook, with the relevant caveat and source on the slide. If legitimate evidence requires more than 20 slides, produce a separately titled second volume or a long-form memo; do not disguise continuation as an appendix to bypass the ceiling.

## 2. Narrative architecture

Default sequence; adjust to the research question:

1. **Cover and scope.** Precisely name subject, analytical question, author, issue date, source cutoff.
2. **Executive financial/strategic judgment.** State the supported answer, 2–3 decisive facts, and key decision implication.
3. **Situation.** Establish only context needed to understand the analysis.
4. **Evidence and mechanisms.** Group findings in causal or financial order: transactions → cash obligations → operations → revenue/working-capital consequences.
5. **Scenarios or alternatives.** Expose assumptions, calculations, sensitivity and limitations.
6. **Implications and monitoring.** Differentiate what stakeholders should do, track or request.
7. **Compact appendix.** Reconciliation, dates, source scope and unresolved diligence, counted within the cap.

The sequence should pass a **headline-only read**: read the action titles in order; they should form a defensible argument without chart or speaker notes.

Reserve one distinct insight per analytical slide. If two independent findings each require evidence, create two slides *only if both earn their place*. A chart title is not a substitute for interpretation: at least one concise explanation should say why the exhibit matters.

## 3. Page system and grid

- 16:9 landscape, 13.333 × 7.5 in. No 4:3 legacy layout.
- Safety margin: 0.50–0.65 in left/right and 0.35–0.50 in top/bottom.
- Consistent title x-coordinate, exhibit x-coordinate and footer baseline.
- Four functional bands on standard exhibit slides:
  1. **Finding/title** (top 15–20%).
  2. **Scope/measure** (short line specifying time, units, or population).
  3. **One dominant exhibit** (middle 60–65%), optionally with 25–35% interpretation column.
  4. **Source and assumptions** (bottom band).
- Use fewer boxes. Structural rules and spacing establish hierarchy; borders and rounded cards are exceptions.
- Titles should be declarative findings, not generic labels ("Debt maturity" alone is a weak title). Use a question title only when the question itself frames an explicitly unresolved issue.
- Avoid page-by-page large decorative photography. Use imagery sparingly on covers or as direct evidence with provenance.

## 4. Design identity

Decks use the **Architectural Research Studio** identity that the website uses ([ARCHITECTURAL_RESEARCH_STUDIO.md](../ARCHITECTURAL_RESEARCH_STUDIO.md)). Every value below is read from one file, [`docs/design/publication-tokens.json`](../publication-tokens.json); `tests/publication-tokens.test.ts` fails when it drifts from `app/globals.css`. Generators load the tokens (`scripts/publication/tokens.ts`, `scripts/publication/tokens.py`) and do not hard-code hex values. [PUBLICATION_DESIGN_SYSTEM.md](../PUBLICATION_DESIGN_SYSTEM.md) explains how the same tokens apply to memos, covers and social images.

| Role | Colour | Use on slides |
|---|---|---|
| Plaster | `#F6F5F1` | Slide ground, every slide including the cover and the close |
| Chalk | `#FBFAF7` | Quiet panels |
| Elevated | `#EEECE5` | Table heads, selected rows, soft bands |
| Plate | `#FDFDFB` | Exhibit ground when an exhibit needs a bounded panel; text on graphite or malachite fills |
| Graphite | `#1B1E21` | Text, primary rules, primary marks |
| Slate | `#555B61` | Secondary text |
| Faint | `#61666C` | Captions, axis labels, source lines |
| Border | `#DBD8CF` | Hairlines and gridlines |
| Border strong | `#B5B1A5` | Base lines and structural rules |
| Malachite | `#1F5C4D` | The single emphasised mark on a slide; hyperlinks |
| Hematite | `#9A3324` | Declines, controls, ended or lapsed status |
| Ochre | `#9A6A12` | Designations and cautions. Rules and markers only, never small text (4.3:1 on plaster) |

Colour carries meaning or nothing. Slides are light: graphite is a text, rule and mark colour, and a fill for a key bar or label chip, but it is not a slide ground. No gradients, no tinted cards, no shadows, square corners. The website has no dark mode, and light slides print, project and export to PDF more reliably.

**Data-visualisation series.** An exhibit may use the categorical set that the Markets charts use: graphite, malachite `#1E6353`, hematite, lapis `#4A7FD0`, ochre `#A27017` and plum `#8B4491`, assigned in that order, with a dash pattern on the last three. Use the single-hue malachite ramp (`#E6EDE9` to `#1E6353`) for ordered magnitude such as heat grids. Choose colours by the exhibit's purpose; do not add a colour for variety. Lapis and series ochre are 3.9–4.0:1 on plate: use them for lines, bars and markers, never for small text, and never rely on hue alone, because the dash pattern or a direct label identifies the series. Functional meanings stay fixed across a deck: hematite is always a decline, control or ended status; ochre is always a designation or caution; malachite is the one emphasised mark.

### Typography

**Two families, each with a job.** Spectral is the editorial display face and Archivo is the working face. Both are declared in the token file; JetBrains Mono is reserved for record identifiers.

| Element | Family and weight | Size |
|---|---|---|
| Cover title | Spectral Regular | 40–54 pt |
| Section divider title | Spectral Regular | 34–44 pt |
| Editorial statement (one governing sentence on a divider or the executive-answer slide) | Spectral Regular | 28–34 pt |
| Analytical slide title | Archivo SemiBold | 26–34 pt |
| Section or exhibit heading | Archivo Medium or SemiBold | 18–22 pt |
| Analytical body | Archivo Regular | 16–20 pt, rarely below 15 pt |
| Table text | Archivo Regular, tabular numerals | 11–14 pt |
| Chart data labels | Archivo Medium | 12–15 pt; axes 11–13 pt |
| Source footer and captions | Archivo Regular | 9.5–11 pt, retaining material qualifications and links |
| Labels | Archivo Medium, sentence case | 11–13 pt; no tracked all-caps |

Spectral is never used for analytical slide titles, paragraphs, tables, chart labels, source footers or dense financial content. Spectral is also never set below 28 pt. Financial figures and dates use Archivo with tabular numerals where supported.

**No silent substitution.** The generators check that both families resolve and stop when one does not; they never fall back to Georgia, Times, Arial or Liberation Sans. PowerPoint cannot embed fonts, so a recipient without Spectral and Archivo sees a substitute in the `.pptx`. The font-embedded PDF export is therefore the canonical read-only form and the `.pptx` is the editable companion. Verify with `pdffonts` that the PDF embeds both Spectral and Archivo. Arial may be used only as a clearly documented recipient-requested fallback, never mixed with Archivo within one deck. Do not commit or distribute font binaries.

The existing 5 November 2026 research decks remain citation-stable until a replacement has passed source-link, numerical, editable-object, rendered-slide and human publication review. Historical versions remain accessible and are not restyled by this standard.

### Contrast and accessibility

- Text uses graphite, slate or faint on plaster, plate, chalk or elevated; every pair is at least 5.3:1 on plaster. Plate text sits only on graphite (16.4:1) or malachite (7.65:1) fills.
- Do not rely on colour alone. Use dash, marker shape, direct labels, legend text and position to encode status.
- Use direct labels, a straightforward reading order and descriptive link text. Spell out acronyms at first use.
- Hyperlinks are malachite, Archivo Medium and underlined.

## 5. Eight reusable layouts

These are **archetypes**, not eight mandatory slides or a fixed sequence.

**A — Research cover.** Plaster ground and the website's centred title block: a Spectral title, a hairline rule with a registration tick, an Archivo subtitle, then author, issue date and source cutoff as a short definition list. No consultant-brand mimicry, no photograph unless it is registered evidence with a caption.

**A2 — Section divider.** Plaster ground, a large number or short Spectral title, one governing sentence at most, and a hairline rule. Dividers count toward the 20-slide ceiling; omit them in decks under 12 slides.

**B — Executive findings.** One thesis, up to three quantified supporting findings with why they matter, plus a single clearly identified unresolved decision variable. The thesis may be set as a Spectral editorial statement; the findings, figures and labels stay in Archivo.

**C — Dominant exhibit.** Statement headline, large original chart, one explanatory paragraph or two brief interpretive notes, dated source footer. Preferred for time series, cross-jurisdiction comparisons and operating data.

**D — Financial bridge.** Sources-and-uses or movement in an actual balance, but only if arithmetic and status allow it; use labels to distinguish instrument classes, committed vs uncommitted, actual vs illustrative.

**E — Comparison matrix.** Alternatives or finance instruments by comparable dimensions: economic cost, status, risk bearer, timing and execution dependency. No traffic-light decoration without explicit rules.

**F — Milestone and cash-conversion timeline.** Show dated reported events, separating reported operating activity from verified production, contracted offtake, delivered product and collected cash. Do not infer automatic progression.

**G — Scenario analysis.** Baseline, exact driver decomposition, downside/upside, dated assumption and outputs, with a clear statement of what the scenario *is and is not* measuring.

**H — Decision synthesis.** Investor, lender, company and public-financier implications; ranked diligence requests or monitoring conditions; conclusions must be conditional when public evidence is insufficient.

### Exhibit variety and visual flow

Use the [visual repertoire and original examples](VISUAL_REPERTOIRE_AND_REFERENCES.md) to vary exhibit structure, composition and density across the argument. Maintain one recognizable identity through the Spectral and Archivo pairing, palette, alignment and source treatment. Broader graphic variety is expected where the evidence supports genuinely different relationships.

Include the reader question, analytical relationship, selected exhibit family and controlling data/source in the existing slide manifest before production. Consider timelines for sequence, state diagrams for conditional entitlements, bridges for reconciliations, small multiples for comparable series, and direct comparisons for alternatives. Tables should earn their place against those alternatives; exact role/contract matrices remain valid.

Review the full contact sheet as well as individual slides. Three or more substantially identical compositions in sequence trigger editorial review: retain repetition when it enables comparison, otherwise revise the slide that benefits most from another form. This is a judgment prompt, not a chart quota. New colors or icons alone do not provide analytical variety. Record the result in existing visual-integrity and publication-coherence gates.

## 6. Exhibit discipline

Use [the full exhibit and chart rules](EXHIBIT_AND_CHART_RULES.md). The essentials:

1. **Title asserts a finding; chart measures it.**
2. Give explicit units, period, geography, attribution and status.
3. Keep announcement, commitment, transaction execution, drawdown, project spend and cash availability distinct.
4. Do not combine historical timing scenarios with current-spend stresses into an invented current funding gap.
5. Set honest bar baselines, appropriately labeled axes and consistent comparative denominators.
6. Link each exhibit to the underlying primary-source document and, when applicable, a workbook cell or reproducible input.
7. Use a direct annotation on the chart for the insight instead of paragraph-length prose beneath it.
8. If a figure is unverified, show a withheld/unknown state or omit the chart; invented estimates do not improve the deck.

## 7. Editorial voice

The [Editorial Authenticity & Visual Integrity Standard](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) is mandatory for drafting, editing and reviewing AI-assisted presentation prose and graphics. Its affirmative-writing principle prioritizes direct claims and connective financial reasoning; necessary evidentiary negations remain intact.

Presentation language is a compressed version of serious research writing, not a chain of slogans.

- Use natural, varied syntax and explain the **mechanism** linking a financing fact to a strategic consequence.
- Use confident, plain sentences when evidence supports them; add caution exactly where the conclusion changes if the uncertainty is ignored.
- Avoid formulaic "not X, but Y", unsupported superlatives, "at the intersection", "landscape", "unprecedented", repeated rule-of-three lists, excessive em dashes and decorative quotation marks.
- Do not insert unnecessary "this slide shows" or "it is important to note" sentences.
- Preserve enough interpretation for a reader to understand the exhibit **without a live presenter**.
- Distinguish what management/government *says*, what records *establish* and what SMPT's model *calculates*.
- For publicly presented research, use "Independent SMPT analysis" as attribution only where justified; never imply external investment-bank review.

## 8. Evidence, intellectual property and rights

For every major quantitative exhibit, the footnote/caption must identify:
- Primary organization, document, section or page (ideally a hyperlink).
- Date of release and the **as-of date** of the measured activity where different.
- Calculation source / workbook version and illustrative status as needed.
- Definitions, currency, real vs nominal and ownership share where relevant.

Reference source materials may have restricted redistribution permissions. **Do not embed screenshots of McKinsey/BCG/Bain/Strategy& reference decks in this public repository.** Attribute design inspiration through links and written critique only. All SMPT visuals, chart structures and editable templates must be original. Do not bundle proprietary fonts or imply affiliation.

## 9. Production, file format and QA gates

Required outputs for a publication release:
- Editable `.pptx` (text, tables, charts and callouts editable to the greatest practical extent).
- Accessible, selectable-text `.pdf` counterpart with working hyperlinks. The PDF is the canonical, font-embedded form; confirm with `pdffonts` that it embeds Spectral and Archivo and nothing else.
- Palette check: every colour in the `.pptx` is a token from `publication-tokens.json` or a documented series colour (`scripts/publication/check_deck.py`).
- Reproducible chart inputs/generator or documented workbook provenance.
- Original source/evidence appendix or links to controlling model.
- Visual QA: render **every slide** as image, inspect, fix clipping and contrast, rerender.
- Numerical QA: reconcile the deck with source register and accepted model. Include source cutoff and version in metadata.

Editorial QA:
- [ ] Five [authenticity and visual integrity review gates](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) recorded as PASS / REVISE / HOLD with supporting evidence?
- [ ] Exhibit selection and contact-sheet review recorded, with repetitive compositions justified or revised?
- Headline-only reading coherent?
- No asserted causality from mere temporal sequence?
- No uncommitted capacity visualized as cash?
- No investor guidance implied by unsupported valuation?
- Each slide earns its place; total ≤20?
- All externally shared images have rights clearance?
- Has a human author approved the exact release files?

**Publication status cannot be inferred from a green CI check.** Keep revisions versioned; do not overwrite a live PDF until the updated assets and links pass review and an explicit release decision is made.

## 10. Governance and application

- v3.0 adopts the Architectural Research Studio identity for **future and revised SMPT research decks** and keeps the v2.2 visual-repertoire workflow. It does not restyle any published deck. The graphite-and-gold, Archivo-only identity of v2.0–v2.2 survives only in frozen historical binaries (FI001, FI002) and in generators that have not been migrated; the migration status is recorded in [PUBLICATION_DESIGN_SYSTEM.md](../PUBLICATION_DESIGN_SYSTEM.md).
- The type pairing and palette in section 4 await maintainer approval as the house position; until then treat them as the proposed v3 identity that the validation package demonstrates.
- Existing live FI001 publication remains unchanged until a new independently verified version has completed editorial and release gates.
- The [FI001 redesign brief](FI001_REDESIGN_BRIEF.md) is the first candidate application, targeting 18 slides including four appendix slides.
- The Financial Intelligence 002 case can subsequently reuse the same design grammar; do not expand this documentation task into FI002 development.
- This standard may evolve through focused, documented review after actual release use. Avoid ad hoc per-deck styling forks.

**Quality standard:** The slide's claim, chart and interpretation must be readable and defensible as a unit. The visual system exists to serve that test.
