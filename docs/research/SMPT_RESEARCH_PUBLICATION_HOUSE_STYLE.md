# SMPT research publication house style — v2.0

**Adopted by the maintainer on 4 November 2026.** Applies to the social research edition, executive memo, long-form research dossiers, and reader-facing research pages. The site's broader application and dashboard components retain their existing visual system.

## Publication identity

- Use the SMPT palette: near-black/charcoal (#262523), warm paper (#FBFAF7), body ink (#252421), muted gold (#98752D), warm neutral table bands (#F0EEE8), and fine rules (#D0CCC3). No green.
- Use **one professional sans-serif font family per publication** for cover, headings, running headers, body, notes, tables, bibliography, and captions, with regular and bold weights. The November 2026 PDF candidates use Liberation Sans, an Arial-compatible family.
- Dense tables and two-column analytical prose are welcome when the information warrants them. Use full-width figures for comparisons requiring greater space. Preserve readable type at page and mobile-view size.
- Apply restrained running headers, page numbers, section numbering, gold rules, exhibit numbers, and documentary captions. Avoid marketing decks, dramatic isolated fragments, decorative oversized whitespace, and arbitrary visual clutter.

## Language and evidence

- Write descriptive headings that identify the company, jurisdiction, instrument, financing status, industrial project, or documented activity.
- Avoid two-sentence punchlines, rhetorical negations, repeated disclaimers, AI-style framing, and standalone asides explaining what the research is supposedly not.
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
