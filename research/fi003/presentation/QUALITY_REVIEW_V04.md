# FI003 exact-file QC — draft 0.4

**READY FOR HUMAN FINANCIAL/EDITORIAL REVIEW · publication HOLD**

November 6, 2026 · Codex agent assessment · starting head `a07167f25675957be779af8a56961f10e6face41` (includes the sent Jiho assignment and conditional-date correction).

[Editable PPTX](../outputs/presentation-draft-v04/SMPT_FI003_JPMorgan_MP_Draft_v04.pptx) · [matching PDF](../outputs/presentation-draft-v04/SMPT_FI003_JPMorgan_MP_Draft_v04.pdf) · [contact sheet](../outputs/presentation-draft-v04/contact-sheet.jpg) · [33-file candidate ZIP](../outputs/review-candidate-v04/FI003_Review_Candidate_v04.zip) · [per-file hashes](../outputs/review-candidate-v04/contents.json) · [single tracker](../PUBLICATION_PLAN.md).

## Changes and editorial boundary

This implements Benjamin's request to apply more varied analytical graphics to FI003. It preserves the financing-flexibility thesis, all financial source facts and assumptions, the claim/source registers, model 1.0, original numerical series and all historical binaries/verification. The original source rows remain in the slide manifest alongside their new visual text. There is no new financial research, causal finding, model assumption or recommendation in this phase. [Design/provenance checks](../outputs/presentation-draft-v04/design-verification.json).

The guidance comes from [the separate visual-repertoire draft at b7f4c8c](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/b7f4c8c409017cb3f1fa4507eb4e85ea6f7d7a91/docs/design/presentations/VISUAL_REPERTOIRE_AND_REFERENCES.md). PR #222 is not merged or imported into this branch. The deck uses original editable SMPT exhibits, with the established Archivo/cream/graphite/gold system. No external consulting screenshot, client slide, logo or artwork is reproduced.

| Slide | Reader task / selected form | Fidelity constraint |
|---|---|---|
| 1 | Version identification | Title, scope and financial context retained |
| 3 | Follow financing substitution / dated schematic timeline | Equal spacing explicitly schematic; 16 July is pricing, while net cash is attributed to July completion; commitments, cash, conditional capacity and expiration stay distinct |
| 5 | Compare explanations / ranked evidence assessment | Original four explanations and evidence limits retained; no invented confidence scores |
| 9 | Understand the covenant trigger / conditional-stage exhibit | Both earlier-delivery routes, four-quarter basis, assumed delivery, subsequent quarter-end, ratios and commissioning/COD distinction retained |
| 11 | Compare threshold states / native column chart | Pre-COD threshold withheld, not a zero observation; 2029 50% illustration uses original 75.7702512 and 151.5405024 values; display 75.8/151.5; notice, milestone, target and cash/EBITDA limitations retained |
| 13 | Explain historical liquidity / true-scaled waterfall | All seven signed movements preserved at full precision; labels display one decimal; darker PP&E/financing outflows; restricted-cash release clarified; corporate/project boundary retained |
| 14 | Assign next decisions / owner and action-condition exhibit | All three original conditional recommendations and owners retained |

Six native tables remain on 4, 6, 8, 10, 12 and 15 for precise roles, calculations, contract comparisons and evidence gaps. Three native charts on 6, 7 and 11 have literal editable XLSX snapshots. Nine native waterfall bars, all text and diagram elements remain editable. The deck remains 15 slides. The full contact-sheet review found no need to add a chart merely to meet a variety quota.

## Five publication gates

| Gate | Agent disposition | Evidence / remaining condition |
|---|---|---|
| A Analytical substance | Preserved; human review pending | The prior final financial review controls the argument. No optimal-capital-mix, actual-headroom or completion-funding inference added |
| B Prose authenticity | PASS for bounded presentation revision | Full visible copy read; bridge interpretation simplified without changing the financial finding. Benjamin's editorial judgment pending |
| C Visual integrity / accessibility | PASS for rendered draft and bounded static tagging repair; manual checks open | All 15 exact-PDF pages individually inspected. Actual Archivo embedded; selectable text; 46 links; footer contrast at least 6.042:1. Main headlines H1, selected actual subheadings H2; no unnamed Figure tags. Native PowerPoint and screen-reader navigation remain untested |
| D Quantitative/source fidelity | PASS for existing financial checks; human review pending | 24 tests, 11 schedules, controlling specification and 388 saved workbook formula values pass. Original charts/waterfall, source rows and baseline hashes/controls match predecessor. Three embedded chart-workbook caches verified; no model/claim/source edits |
| E Publication coherence | PASS for review package; release HOLD | 33 allowlisted files plus manifest; exact member bytes/hashes checked; extracted tests/schedules/specification/manuscript and presentation verification pass. Exact-file/source-rights approval, separate integration and publication authorization pending |

## PDF correction and actual checks

`remediate_pdf.py` reproducibly replaces only verified text-free vector Figure wrappers with artifacts, removes their structure children and repairs ParentTree slots. The new diagram rules/markers bring decoration to 42 in draft 0.4; all 42 are artifacted. The original draft 0.3 remains unchanged with its historical 30-decoration finding. All eleven pre-existing evidence descriptions remain represented; the new threshold chart adds a twelfth.

Final structure: **15 H1, 17 H2, 12 Figure tags with Alt, six tables, 14 TH, 52 TD and 46 Link tags**. Remaining content MCIDs resolve to live ParentTree structure entries. Meaningful Alt strings, table/header/cell and link counts are identical before/after tagging for the new export. The reduction from eleven predecessor tables is the authorized visual transformation, not a tagging deletion. All annotation destinations and rectangles, extracted text and rendered pixels remain identical on all 15 pages during remediation. [Exact structure receipt](../outputs/presentation-draft-v04/accessibility.json).

Static checks do **not** establish full PDF/UA conformance or assistive-technology usability. Live screen-reader reading order/navigation, broader accessibility auditing, and native Microsoft PowerPoint open/edit/save/reopen require human/application review. PowerPoint is unavailable in this environment. No PDF/UA or screen-reader certification is claimed.

The first local export substituted Noto Sans and was rejected. A font configuration pointing to official static Archivo faces (Omnibus-Type/Archivo commit `211127690e8ff106c36c935f7e5e697114cff103`) corrected the export; every actual PDF face and embedding is checked. A wrapped native chart label was corrected with no-wrap formatting. Parsed PDF float serialization initially caused one-level color differences; the accepted correction preserves raw drawing bytes and passes exact pixel identity. Rejected exports are excluded from delivery.

## Verification and limits

- [PPTX package/layout/reimport receipt](../outputs/presentation-draft-v04/package-validation.json) and [numerical/file verification](../outputs/presentation-draft-v04/verification.json) pass. No external chart dependencies, embedded source images or standalone fonts. PPTX references Archivo; legitimate fonts are required for native editing.
- Model 1.0, historical native verification and saved scenarios are preserved. This session rechecks saved XLSX values; no new live Sheets, Microsoft Excel or source-refresh session is claimed. Source cutoff stays November 6. Original-source rechecks in FINAL_REVIEW remain historical evidence, not re-executed work.
- Local data validation, lint (28 inherited warnings / zero errors), build and typecheck pass. A corrupt local Turbopack cache was moved aside before the clean successful build; application source was unchanged. CI must be read against the actual pushed SHA, separately from local checks.
- Known PR/main conflicts remain a separate integration phase after financial feedback. The live PR is draft and unmergeable; this visual phase does not resolve source/data histories or claim combined-main verification.
- The package adds the production builder, metadata/label finisher, PDF remediation script, presentation verifier and exact presentation/accessibility receipts to the prior 27-file scope. A bare-domain verifier deny-list is allowed by the packaging scanner, while actual Google document URLs remain rejected. No internal tracker/private Sheet/access records, original filings/articles/screenshots or standalone fonts are included. Human source-rights/exact-file approval remains required.
- Jiho's assignment is already sent; review pending, flexible November 16–17. November 20 remains the emailed aspiration and December 4 the conservative internal date; neither is a release commitment. No new outreach or sharing change occurred.

## SHA-256

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| SMPT_FI003_JPMorgan_MP_Draft_v04.pptx | 113,205 | `8b0d26589f18dac89f2c6ff496810af837db4023b4169367f41f1e937f515d3e` |
| SMPT_FI003_JPMorgan_MP_Draft_v04.pdf | 451,816 | `02e760946f5a47bd3ac2c6ff4dad76dbc6e7f537e1e52af172fd9538cd46c0b2` |
| Model 1.0 XLSX, unchanged | 43,058 | `4db87d45a083548cabfe5de85d8ce3bc6b7c9d69c4176ae75d897ca191ba337e` |
| Candidate ZIP | 486,175 | `feaa325b244562c80eef26d8a3ef95b68741d4483c6f7a3b2cb7e8f6d9acc454` |

**Next action:** Benjamin reviews exact draft 0.4 and the unchanged model, focusing on thesis, bank prominence, dilution denominator, covenant interpretation and conditional recommendations (suggested November 10). Jiho's independent assessment follows on the flexible November 16–17 schedule. Record/adjudicate feedback before further revision, integration or release. No merge, publication or deployment is authorized by this handoff.
