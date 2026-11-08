# SMPT research publication house style — v2.2

**Adopted on 4 November 2026; typography updated on 6 November 2026; sentence-cadence preference clarified on 8 November 2026.** Applies to the website, social research editions, executive memos, long-form research dossiers, and reader-facing research pages. Existing publication binaries remain frozen until a separately reviewed and verified replacement is authorized.

## Publication identity

- Use the SMPT palette: near-black/charcoal (#262523), warm paper (#FBFAF7), body ink (#252421), muted gold (#98752D), warm neutral table bands (#F0EEE8), and fine rules (#D0CCC3). No green.
- **Archivo is the SMPT primary typeface** for the website, research pages, data tables, titles, navigation and future publications. Establish hierarchy with size, regular/medium/semibold weights, spacing and rules rather than switching between serif and sans-serif.
- For new PDFs, embed Archivo when the publishing environment supports it. Arial or Liberation Sans may serve as explicitly documented compatibility fallbacks for editable Word, PowerPoint and Google exports. Use one sans-serif family within each document, including cover, headings, body, notes, tables and captions. Avoid Georgia headings and decorative typeface changes.
- JetBrains Mono is reserved for actual source identifiers, machine-readable codes, literal URLs and programming notation. Use Archivo with tabular numerals for dates, numerical KPIs, financial tables, navigation labels, and provenance captions.
- Dense tables and two-column analytical prose are welcome when the information warrants them. Use full-width figures for comparisons requiring greater space. Preserve readable type at page and mobile-view size.
- Apply restrained running headers, page numbers, section numbering, gold rules, exhibit numbers, and documentary captions. Avoid marketing decks, dramatic isolated fragments, decorative oversized whitespace, and arbitrary visual clutter.

## Language and evidence

- Write descriptive headings that identify the company, jurisdiction, instrument, financing status, industrial project, or documented activity.
- Avoid two-sentence punchlines, rhetorical negations, repeated disclaimers, AI-style framing, and standalone asides explaining what the research is supposedly not.
- **Owner-preferred analytical cadence:** Favor occasional **fronted adverbial clauses** that establish time, commercial context or conditions before the main claim; grammatical inversion and delayed subjects can also create natural variation. For example: “When construction is still underway and shipments may be years away, a long-term purchasing commitment can help financiers assess prospective revenue.” Use longer compound or complex sentences when the clauses carry a single connected explanation. Integrate material qualifications into the relevant sentence, including through subordinate clauses or em dashes, without burying important conditions.
- **Owner-preferred narrative movement:** Build explanations cumulatively across sentences, following named companies, transactions and developments before drawing the economic inference. Let chronological markers and occasional conversational transitions orient the reader when they express a real relationship; mix precise financial terminology with ordinary explanatory language. Vary openings and sentence shapes on purpose, including direct subject-first sentences. Avoid manufactured rhetorical contrasts, overcompression and repetitive fact → implication conclusions. These are stylistic options, not mandatory forms, and never supersede evidence, original units, financing/status distinctions or source attribution.
- Explain substantive uncertainty within the analytical paragraph where it changes interpretation. Keep approved facts and financial/status distinctions: legal action, designation, approval, obligation, drawdown, disbursement, construction, commissioning, achieved output, and shipments are different observations.
- Preserve units, original amounts, dates, source identifiers, and frozen research cutoff. Editorial and presentation work must never silently become a source/data release or factual revision.

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
