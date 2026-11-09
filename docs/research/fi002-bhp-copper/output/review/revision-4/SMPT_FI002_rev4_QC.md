# FI002 executive deck — revision 4 quality-control record

## Editorial authenticity and visual integrity review
- **Publication / version:** SMPT Financial Intelligence 002, *Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision*, executive deck revision 4 (review copy; not live)
- **Deck source:** [`SMPT_FI002_BHP_Copper_Strategy_Deck_rev4.spec.json`](SMPT_FI002_BHP_Copper_Strategy_Deck_rev4.spec.json), rendered with `npm run exhibits:render` (`plain_frame: true`)
- **Editable deck:** [`SMPT_FI002_BHP_Copper_Strategy_Deck_rev4.pptx`](SMPT_FI002_BHP_Copper_Strategy_Deck_rev4.pptx), SHA-256 `04a2cc279c77d44dc5a8c81b54c721cae7f4c375f1f79438ab6b737d72009939`, matches its [manifest](SMPT_FI002_BHP_Copper_Strategy_Deck_rev4.manifest.json)
- **Rendered PDF:** [`SMPT_FI002_BHP_Copper_Strategy_Deck_rev4.pdf`](SMPT_FI002_BHP_Copper_Strategy_Deck_rev4.pdf), SHA-256 `78343271ebfd548276d5eb54e1460fed705aa8b5a9fadbec9a09e6227b8ac1bd`. It is tagged, has 11 pages, embeds its fonts and carries the document title.
- **Renders:** `renders/slide-01.png` to `slide-11.png` and [contact sheet](SMPT_FI002_rev4_contact_sheet.png)
- **Base commit:** `d13b5bb` (branch `claude/fi002-presentation-redesign-8ed4f5`)
- **Research cutoff:** 5 November 2026. This revision adds no new research and changes no figures.
- **Reviewer:** Claude (AI agent). No human has reviewed this revision yet.
- **Slides rendered and inspected:** 11 / 11
- **Model/source checks executed:** every figure was reconciled against the four calculation CSVs in `output/` and recomputed in Python. Every source line and evidence reference was checked against the evidence register.
- **Full-copy read completed:** yes
- **Headline-only read completed:** yes. The ten titles alone carry the argument from price revision through earnings exposure, replacement economics and cash use to the timing position.

| Gate | Result | Evidence and substantive correction |
| --- | --- | --- |
| A. Analytical substance | PASS | Each slide states one finding and shows it in an exhibit. The live slides 11 and 12, on readiness and the missing no-build plan, are merged into one condition tree. That slide highlights "Maintain funded pre-FID readiness" and states that construction timing cannot be ranked without BHP's with-build/no-build operating plan. Nothing was added beyond the accepted research record. |
| B. Prose authenticity | PASS | The "SMPT FINANCIAL INTELLIGENCE 002" kicker is removed from every slide. The cover kicker, section labels, "INTERPRETATION" heading and "READING THE TABLE" heading are suppressed. Headings are declarative findings with no coined terms and no closing takeaway under each chart. The text was checked against the new §2 rule, "Manufactured terms and micro-labels". |
| C. Visual integrity | PASS | The deck uses 4 Comparison, 3 Lookup, 2 Reconciliation and 1 Structure exhibits. Tables appear only on slides 2, 4 and 8, which carry exact differentials, reported line items and annuity terms, and each records a `table_reason`. `exhibits:review --strict` returns 0 hold, 0 review and 0 info findings. The 11 pt floor is enforced by the renderer. Each render was inspected for overflow, overlap and clipping. |
| D. Quantitative/source fidelity | PASS | All numbers reconcile, and these distinctions are preserved on the slides. The $15,400/t calendar-2027 average is kept separate from the $15,600/t end-2027 view, which is noted and not charted (slide 3). The $2.83bn is labelled a sensitivity, not a forecast (slides 2 and 5). The 199/333/416ktpa thresholds are SMPT's hypothetical reverse appraisal, not BHP's disclosed economics (slides 8 and 9). Output replaces Los Colorados rather than adding capacity (slide 7). Permit submission (17 March 2026), pending RCA, FID CY2027–28 and pre-FID readiness are kept distinct (slides 7 and 11). The 5 November 2026 cutoff appears on the cover. |
| E. Publication coherence | PASS | The deck matches the flagship report, model and brief, with no change to numbers or conclusions. The live 12-slide deck and its PDF are untouched. The DRAFT · REVIEW GATES PENDING badge stays on every slide by renderer contract. |

### Material edits
| Live slide | Revision 4 | Reason |
| --- | --- | --- |
| 1 cover, with kicker | Cover: "Near-term earnings exposure and the economics of replacement" plus the research cutoff | Kicker removed; the subtitle states the subject |
| 2 "forecast changes earnings exposure before sanction" | 2 "Goldman's revision is worth about $2.8bn on BHP's own FY2026 sensitivity" | States the number and its basis. The old title implied a forecast. |
| 3 | 3 "Goldman's revised 2027 average sits 18.5% above the World Bank" | Same-basis comparison; end-2027 view noted separately |
| 4 | 4 "Copper EBITDA rose to $18.2bn in FY2026 as production slipped" | Reported fact as heading |
| 5 | 5 "Each price comparison scales BHP's $39m sensitivity in a straight line" | Makes the linearity explicit |
| 6 | 6 "A guidance-volume proxy puts the FY2027 effect near $2.27bn" | Names the proxy |
| 7 "New Concentrator protects continuity" | 7 "BHP raised the concentrator capex range to $5.4–6.3bn in August" | Replaces a characterisation with the disclosed change; replacement-not-incremental note kept |
| 8 | 8 "The midpoint capex needs $839m a year of after-tax benefit at 10%" | Hypothetical requirement stated plainly |
| 9 | 9 "Shorter or later benefits raise the threshold from 199ktpa to 333ktpa" | Finding as heading |
| 10 | 10 "Dividends and minority payouts absorbed almost all FY2026 free cash flow" | Finding as heading |
| 11 + 12 | 11 "Public evidence supports funded readiness ahead of a construction decision" | Two slides merged; with-build/no-build caveat kept in the annotation |

The criterion matrix and milestone strip used in earlier drafts were dropped. Their dates and evidence tests are carried on slides 7 and 11.

**Renderer change.** `exhibit-with-interpretation` now drops its "READING THE TABLE" micro-heading only when a research spec opts into `plain_frame`. The synthetic gallery output is unchanged. `tests/exhibit-research.test.ts` asserts both cases.

**Standard change.** [`EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md`](../../../../../design/presentations/EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md) is now v1.1. A new §2 subsection, "Manufactured terms and micro-labels", sets out a reusable rule: use the source's vocabulary, coin no branded phrases, add no eyebrows, kickers or "Key takeaway" headings, and use a label only when it names a source, status, unit, scenario, navigation target or accessibility role.

**Re-render result:** the deck rendered once as revision 4, and the renderer refuses to overwrite it. The strict review, editability check, PDF export and renders all completed on that file.

### Repository gates (exit status)
`npm run validate`, `npm run lint`, `npm run typecheck`, `npm test` (1144/1144), `npm run build` and `npm run exhibits:build` each exited 0.

### Open issues and release decision
- **Material unresolved issues:** none in content.
- **Font:** Archivo is not installed on the build machine. The PPTX names Archivo and renders in it wherever it is installed. The PDF proof and PNG renders use Liberation Sans, which is metrically close. Re-export the PDF on a machine with Archivo before release.
- **Rights and accessibility:** no proprietary bank or issuer exhibits are reproduced, and every chart is drawn from SMPT data. The PDF is tagged. A pdftotext check confirmed the reading order on each slide: title, subtitle, exhibit, notes, interpretation, source.
- **Links:** 11 substantive URLs. ambihub, the World Bank CMO, brecorder, financialjuice, the Goldman transcript and the GitHub methodology page return HTTP 200. The BHP pages (annual report, results release, presentation, Q1 review, permit news) return 403 to automated requests. They are unchanged from the live deck, but a human should open them before release.
- **What automated checks did not run:**
  - The LibreOffice and PowerPoint tiers of `verify_editability.py`; only the structural tier ran, and it passed.
  - A manual open-and-edit test in PowerPoint.
  - A browser check of the BHP links.
- **DRAFT badge:** retained by contract. Removing it for release is a separate human-gated step.
- **Agent assessment:** READY FOR HUMAN PUBLICATION REVIEW
- **Human editorial approval (name/date/version):** PENDING. The live website and Drive files must not be replaced until the exact release files are approved.
