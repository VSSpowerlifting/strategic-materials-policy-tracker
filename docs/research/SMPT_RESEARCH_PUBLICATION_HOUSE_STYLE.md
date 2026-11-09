# SMPT research publication house style — v2.1

**Adopted on 4 November 2026; typography updated on 6 November 2026.** Applies to the website, social research editions, executive memos, long-form research dossiers, and reader-facing research pages. Existing publication binaries remain frozen until a separately reviewed and verified replacement is authorized.

## Publication identity

- Use the SMPT palette: near-black/charcoal (#262523), warm paper (#FBFAF7), body ink (#252421), muted gold (#98752D), warm neutral table bands (#F0EEE8), and fine rules (#D0CCC3). No green.
- **Archivo is the SMPT primary typeface** for the website, research pages, data tables, titles, navigation and future publications. Establish hierarchy with size, regular/medium/semibold weights, spacing and rules rather than switching between serif and sans-serif.
- For new PDFs, embed Archivo when the publishing environment supports it. Arial or Liberation Sans may serve as explicitly documented compatibility fallbacks for editable Word, PowerPoint and Google exports. Use one sans-serif family within each document, including cover, headings, body, notes, tables and captions. Avoid Georgia headings and decorative typeface changes.
- JetBrains Mono is reserved for actual source identifiers, machine-readable codes, literal URLs and programming notation. Use Archivo with tabular numerals for dates, numerical KPIs, financial tables, navigation labels, and provenance captions.
- Dense tables and two-column analytical prose are welcome when the information warrants them. Use full-width figures for comparisons requiring greater space. Preserve readable type at page and mobile-view size.
- Apply restrained running headers, page numbers, section numbering, gold rules, exhibit numbers, and documentary captions. Avoid marketing decks, dramatic isolated fragments, decorative oversized whitespace, and arbitrary visual clutter.

## Public research categories

The public research index and article headers use **two categories only**:

- **Policy Research** — original research dossiers and shorter policy analyses grounded in policy instruments, source records, implementation and industrial effects.
- **Strategy & Finance** — financial intelligence, capital-allocation studies and applied strategy cases involving explicit assumptions, scenarios and decision models.

Use these reader-facing labels consistently in article headers, the research index and metadata. Titles, bylines and publication dates do the rest of the explanatory work. Avoid promoting internal project numbers (R001, FI001, FI002, Applied Strategy 001, Policy Analysis 001) into public category headings. **Keep existing report and model identifiers in filenames, evidence registers, archival records and suggested citations** so that references to published research remain stable. Descriptions such as *report*, *dossier*, *financial model* and *strategy deck* remain appropriate when they accurately name a downloadable format.

This is an editorial grouping, not a change in method. Legal-status research, forecast-based financial modeling and hypothetical strategy cases retain their separate evidence, scenario and publication standards.

## Language and evidence

- Write descriptive headings that identify the company, jurisdiction, instrument, financing status, industrial project, or documented activity.
- Avoid two-sentence punchlines, rhetorical negations, repeated disclaimers, AI-style framing, and standalone asides explaining what the research is supposedly not.
- Explain substantive uncertainty within the analytical paragraph where it changes interpretation. Keep approved facts and financial/status distinctions: legal action, designation, approval, obligation, drawdown, disbursement, construction, commissioning, achieved output, and shipments are different observations.
- Preserve units, original amounts, dates, source identifiers, and frozen research cutoff. Editorial and presentation work must never silently become a source/data release or factual revision.

## Natural-language review — mandatory for reader-facing copy

**Before drafting:** Read this guide directly. Identify the concrete development, the reader's reason to care, and the primary-source facts that support each paragraph. Begin with the action and its consequence; introduce document numbers and methodological qualifications where they clarify the story. Write as a knowledgeable reporter or analyst explaining something to another person, rather than as a validator describing a database row.

**While writing:** Prefer complete paragraphs with specific actors, verbs, dates and cause-and-effect explanations that the evidence supports. Vary sentence rhythm naturally. Make analytical implications tangible: which contract term, regulatory date, financing condition or production constraint changes for the reader? Use tables when detailed comparison helps, but avoid repeating the same deadline or disclaimer in every row. A legal instrument can be described once in full and then referred to clearly by year and number where ambiguity remains.

**Remove on the editorial pass:**
- Repeated self-references such as “this article examines,” “the analysis does not estimate,” and “our framework shows,” when the paragraph can directly state the finding.
- Standalone disclaimers, rhetorical negations, manufactured three-part takeaways, generic “important implications” claims, and headings that merely label the writing process (“Commercial interpretation,” “Analysis: procurement”).
- Sentences that sound authoritative without identifying what the source actually establishes; avoid claiming certainty, causality, material supply effects or negotiation motives from an instrument that states only legal dates.
- Bloated chronology in prose when a timeline already supplies the dates. Keep the paragraph that explains what makes the dates consequential.

**Preserve:** Material negative facts, unknowns and boundaries when they determine interpretation. “Announcement X does not include the April rules” can be an indispensable legal distinction. The aim is precise, readable prose, never a mechanical ban on particular words. Keep every relevant source link, original-language nuance, quantitative condition, effective date, uncertainty and status distinction. Do not replace uncertainty with confident-sounding guesses.

**Examples of the desired adjustment:**

| Labored drafting | More natural, equally careful |
| --- | --- |
| “Commercial interpretation. This section does not estimate effects on prices, supply or individual firms.” | “For buyers planning deliveries into 2027, the stated suspension end date is the relevant deadline.” |
| “The instrument offers two months of stated certainty, with post-expiry standing undetermined.” | “The suspension runs through 10 January 2027. The announcement gives no date beyond that.” |
| “This analysis examines the implications of these developments for procurement stakeholders.” | “Manufacturers relying on the affected inputs need to check which provisions govern their orders after the suspension ends.” |

**Before handing off a publication**, perform one focused editorial read of the rendered text, not just the source code. Check: Is the opening worth reading? Does each paragraph contribute a fact or meaningful interpretation? Do readers understand the commercial stakes without being told that they are “significant”? Does the conclusion add a real point rather than repeat the lead? Are any negations legally necessary? Are uncertainty, quotation, dates, instrument scope and links unchanged? Read at mobile and desktop widths. Note unresolved editorial questions in the review handoff; an automated checker cannot certify natural voice.

## Sources and link treatment

- Primary-source hyperlinks must be **real, visible, underlined links**, using bold and a sufficiently dark accent on cream/paper. Do not rely on color alone.
- The dossier should provide source URLs or fully resolved bibliography hyperlinks; figures should retain nearby original-source IDs or concrete source notes.
- PDFs require tested link annotations. The web research article should use a clearly underlined evidence-links treatment with adequate contrast.
- The LinkedIn edition should offer a clear route to the full publication and its evidence workbook.

## Formats

**LinkedIn research edition:** Eight pages, portrait 4:5, with a cover, jurisdictional mechanisms, finance, chronology, project comparison, industrial support, evidence matrix, and research-access page. Favor digestible tables and compact two-column analysis; retain sufficient phone-size legibility.

**Executive memo:** Two letter-size pages, strong central findings, evidence table, and full report link.

**Long-form dossier:** Letter-size, two-column research prose, typically 9.5–10.5 pt body with 14–15 pt leading, full-width complex tables/figures, an appendix with source register and methods. Let length be determined by editorial content rather than a target page count.

## R001 publication integrity

The author-approved R001 public release was published from main commit `10f70abc35484c8c0d1582af9e183d750793575c` on 4 November 2026, using the research corpus frozen at `4fc59c7ea38ca788eb7537353274a953c90e13eb` and a 3 November 2026 source cutoff.

The newly approved editorial-design candidates have the following **local** SHA-256 digests; those digests do not attest to GitHub deployment:

| Intended public file | Candidate source filename | Pages | Candidate SHA-256 |
| --- | --- | ---: | --- |
| `public/research/r001/tungsten-supply-security.pdf` | `SMPT_R001_Dossier_Editorial_Final.pdf` | 23 | `31ca303c95940776508cc071e32295f3fefa45f832dab252a0842d51d2370d8a` |
| `public/research/r001/tungsten-supply-security-memo.pdf` | `SMPT_R001_Executive_Memo_Editorial_Final.pdf` | 2 | `a2e642908f9829d17cbfc360b33c2c92c31204d76894b26cb5e069ffc9ba27fb` |
| `public/research/r001/tungsten-supply-security-slides.pdf` | `SMPT_R001_LinkedIn_Editorial_Final.pdf` | 8 | `1cd5895ea12ebe6a8963117c26fa9b4fcd93f6d252a76684c3e2107dae4303c6` |

**Release gate:** Keep the original public PDF binaries, links, and their original checksums in `docs/research/r001-tungsten-publication-2026-11-04.md` until the three approved candidate assets are installed. The replacement must compare source facts and exhibit fidelity against the exact author-approved public files, render and inspect all pages, validate the new file hashes and link annotations, update publication manifest and 26-page UI label to 23-page, run repo checks, and verify the exact production deployment. Preserve the evidence workbook unchanged and record this as a format revision rather than a newer research cutoff. No user-facing claim of an updated PDF release until the new assets are live.
