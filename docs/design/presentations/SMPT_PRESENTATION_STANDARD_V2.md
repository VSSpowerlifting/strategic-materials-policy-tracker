# SMPT Presentation Standard v2.1

Adopted **5 November 2026** · Applies to **new and revised research presentations**  
Companion standards: [Exhibits and Chart Rules](EXHIBIT_AND_CHART_RULES.md) · [Editorial Authenticity & Visual Integrity](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) · [Reference Analysis](REFERENCE_ANALYSIS.md)

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

Adopt the website's actual established SMPT values from \`app/globals.css\`; the following is a versioned slide subset:

| Role | Color | Use |
|---|---|---|
| Graphite | \`#12110F\` | Cover, closing and narrow identity rail |
| Surface | \`#1A1814\` | Graphite alternate |
| Cream paper | \`#F5F3EE\` | Most data/analysis slides |
| Paper ink | \`#1B1915\` | Primary body/title text on cream |
| Warm gray | \`#5B5548\` | Secondary text on cream |
| Brand gold | \`#C8993E\` | Identity detail |
| Highlight gold | \`#E3B04B\` | Emphasis on graphite |
| Accessible paper accent | \`#7A5510\` | Gold-toned foreground text on paper |
| Pale border | \`#D8D3C7\` | Table rules, separators |
| Graphite foreground | \`#EFECE6\` | Text on dark surfaces |

Charts may introduce *functional* neutral grays for series differentiation; do not treat these as new brand colors. Gold highlights the analytical focus rather than decorating every row. No decorative blue/green gradient, busy background mesh, shiny beveled objects or artificial consultant-looking badges. Reserve strong caution color for an explicitly labeled risk/status, never as the sole encoding.

### Typography

**Archivo is the sole primary family for SMPT presentation design.** Use Archivo Regular, Medium and Semibold for the cover, headline, body, figure labels, axes, tables and source notes. This replaces the previous Georgia/Source Sans 3 pairing and aligns future decks with the website.

- Cover title: Archivo Semibold, **36–46 pt**, with measured line breaks.
- Major assertion title: Archivo Semibold, **28–34 pt** on analytical slides.
- Section/exhibit heading: Archivo Medium/Semibold, **18–22 pt**.
- Analytical body: Archivo Regular, **16–20 pt**; rarely below 15 pt.
- Chart data labels: Archivo Medium, 12–15 pt; axes 11–13 pt when justified.
- Footnotes/source line: Archivo Regular, 9.5–11 pt; retain material qualifications and links.
- Financial figures and dates: Archivo with tabular numerals where supported.
- Dense technical identifiers: fixed-width type is permitted selectively; avoid decorative monospace.

Always include an editable PowerPoint and matching selectable-text PDF. Embed the true Archivo face in PDF exports where software licenses and export engines permit; install Archivo in rendering environments and verify that the **PDF embeds Archivo** rather than silently substituting another family. For interoperability, Arial may be used only as a clearly documented fallback where the recipient requires a system font; never silently mix Archivo and Arial within the primary deck. Do not commit or distribute standalone font binaries.

The existing 5 November 2026 research decks remain citation-stable until a typography-only replacement has passed source-link, numerical, editable-object, rendered-slide and human publication review. Historical versions remain accessible.

### Contrast and accessibility

- Test dark-on-light and light-on-dark contrast; normal text aims for WCAG AA 4.5:1 where applicable.
- Avoid relying on color alone. Use outline/dash/pattern, legend text and position to encode an instrument's status.
- Use direct labels, straightforward reading order and link descriptions. Avoid unexplained acronyms in the first appearance.

## 5. Eight reusable layouts

These are **archetypes**, not eight mandatory slides or a fixed sequence.

**A — Research cover.** Graphite field, concise Archivo Semibold title, subdued topic/series rail, subtitle, author, issue date and source cutoff. No consultant-brand mimicry.

**B — Executive findings.** One thesis, up to three quantified supporting findings with why they matter, plus a single clearly identified unresolved decision variable.

**C — Dominant exhibit.** Statement headline, large original chart, one explanatory paragraph or two brief interpretive notes, dated source footer. Preferred for time series, cross-jurisdiction comparisons and operating data.

**D — Financial bridge.** Sources-and-uses or movement in an actual balance, but only if arithmetic and status allow it; use labels to distinguish instrument classes, committed vs uncommitted, actual vs illustrative.

**E — Comparison matrix.** Alternatives or finance instruments by comparable dimensions: economic cost, status, risk bearer, timing and execution dependency. No traffic-light decoration without explicit rules.

**F — Milestone and cash-conversion timeline.** Show dated reported events, separating reported operating activity from verified production, contracted offtake, delivered product and collected cash. Do not infer automatic progression.

**G — Scenario analysis.** Baseline, exact driver decomposition, downside/upside, dated assumption and outputs, with a clear statement of what the scenario *is and is not* measuring.

**H — Decision synthesis.** Investor, lender, company and public-financier implications; ranked diligence requests or monitoring conditions; conclusions must be conditional when public evidence is insufficient.

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
- Editable \`.pptx\` (text, tables, charts and callouts editable to the greatest practical extent).
- Accessible, selectable-text \`.pdf\` counterpart with working hyperlinks.
- Reproducible chart inputs/generator or documented workbook provenance.
- Original source/evidence appendix or links to controlling model.
- Visual QA: render **every slide** as image, inspect, fix clipping and contrast, rerender.
- Numerical QA: reconcile the deck with source register and accepted model. Include source cutoff and version in metadata.

Editorial QA:
- [ ] Five [authenticity and visual integrity review gates](EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) recorded as PASS / REVISE / HOLD with supporting evidence?
- Headline-only reading coherent?
- No asserted causality from mere temporal sequence?
- No uncommitted capacity visualized as cash?
- No investor guidance implied by unsupported valuation?
- Each slide earns its place; total ≤20?
- All externally shared images have rights clearance?
- Has a human author approved the exact release files?

**Publication status cannot be inferred from a green CI check.** Keep revisions versioned; do not overwrite a live PDF until the updated assets and links pass review and an explicit release decision is made.

## 10. Governance and application

- v2.1 with Archivo is the default **for future SMPT research decks**.
- Existing live FI001 publication remains unchanged until a new independently verified version has completed editorial and release gates.
- The [FI001 redesign brief](FI001_REDESIGN_BRIEF.md) is the first candidate application, targeting 18 slides including four appendix slides.
- The Financial Intelligence 002 case can subsequently reuse the same design grammar; do not expand this documentation task into FI002 development.
- This standard may evolve through focused, documented review after actual release use. Avoid ad hoc per-deck styling forks.

**Quality standard:** The slide's claim, chart and interpretation must be readable and defensible as a unit. The visual system exists to serve that test.