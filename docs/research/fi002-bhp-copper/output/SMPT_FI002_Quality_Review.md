# SMPT FI002 — Internal quality review and editorial gate

Date: 5 November 2026. **READY FOR EDITORIAL REVIEW.** This is internal agent review and reproducibility checking, not external professional assurance. Public release remains unauthorized.

The completed package is a 14-page, approximately 5,000-word flagship report, a consistent 12-slide executive edition, a two-page decision brief, an 11-tab editable local/native model and inspectable evidence and methodology. It makes an original exposure comparison and examines required replacement benefits without pretending to independently value the mine project.

## Substantive review

| Question | Assessment |
| --- | --- |
| Is the financial question meaningful? | Yes. A large near-term price revision changes the scale of BHP's earnings exposure, but the replacement asset first produces years later. The horizon and operating-counterfactual distinctions affect actual capital decisions. |
| Is Goldman substantive and attributed? | Yes. The reported revision and competing annual average drive the $2.83bn and $4.25bn original illustrations. Credible public reporting supports the annual average; a separate public bank transcript supports a related end-year forecast. Primary proprietary annual-average research remains unavailable. |
| Is the project correctly characterized? | Yes. Replacement of Los Colorados, nominal gross cost, 57.5% economic ownership, full consolidation, facility output, readiness approval and future FID remain distinct. |
| Are the quantitative conclusions defensible? | The static sensitivity and conditional reverse appraisal are reproducible. No independent project NPV, IRR, EPS or forward parent funding is claimed. The 199/333/416ktpa values are assumption tests, not actual benefits or viability verdicts. |
| Does the recommendation follow? | Fund pre-FID readiness and information that protects replacement continuity. The available evidence does not rank major construction acceleration versus deferral. Specified changes in lost production, alternatives, costs and permits would change the decision. |
| Are corporate alternatives considered? | Yes. Acceleration, staging, re-scoping and deferral receive explicit conditions. Portfolio cash demands and execution capacity matter, but headline project totals do not provide return rankings. |
| Is the report readable and useful? | It develops one argument with original exhibits and linked evidence, rather than reproducing a spreadsheet. Technical equations and changes in judgment are documented separately. |

## What was checked and corrected

- Reconciled the full local prototype with PR #202 and verified that the inherited `research/fi002/` baseline is unchanged. Its reproducibility audit passed earlier in this continuation.
- Adopted BHP's disclosed $39m/US-cent sensitivity and demoted the smaller FY27 volume proxy. Preserved history rather than silently erasing earlier conclusions.
- Withdrew the mixed-period funding forecast, separated management cumulative FCF from annual guidance and prevented repeated capex subtraction.
- Reviewed ownership, denominator, metric-tonne/pound conversion, fiscal/calendar horizons, nominal capital, benefit timing, and the with-build/no-build boundary.
- Re-examined the 199/416ktpa screen and added duration and cost sensitivity. A ten-year-from-2034 case produces 333ktpa, demonstrating why the base is not a viability test.
- Determined that the timing-option equations primarily restate assumed premiums. Replaced the prototype's stronger staging preference with a conditional readiness judgment.
- Improved Goldman attribution through substantive alternative public reporting, verified the related primary bank transcript, and opened the primary ICSG October PDF. Kept geographic balance definitions separate.
- Treated the November 4 permit filing as a request, not a grant or an estimated delay. Did not infer severity from inaccessible substantive official documents.
- Corrected chart labeling around negative values, a truncated presentation price axis and unequal numeric price intervals in the frontier. Reviewed displayed rounding and kept full model precision.

## Initial completion: automated and software verification

`SMPT_FI002_Verification_Results.json` records **70/70 passing checks**. These are checks on this research package, not repository CI or deployment tests.

- Six local selectable cases and four meaningful input perturbations passed. Six native Sheet scenario recalculations passed; the selector was restored to Base.
- Independent Python sums of annual capital and benefit discount factors match the six scenario thresholds and eight additional sensitivity cases.
- All **329 current formula results** agree between the local workbook and an exported native Sheet. No cached formula errors occur in either workbook. Google serializes two audit-comparison constants to 15 significant digits; their differences are below 1e-8 in workbook units, with unchanged calculation logic. Other formulas match exactly.
- Physical-unit, static exposure, financial-denominator, historical cash-flow, capital, ownership and source-lineage checks passed.
- PDFs contain 14 / 12 / 2 pages and **57 / 35 / 9 working URI annotations** for report / deck / brief. Destinations match the evidence and deliverable allowlist. No empty pages or tool placeholders were found. This validates embedded link targets, not perpetual availability of every external page.
- Finalized PowerPoint has 12 editable slides, eight native tables, three native charts and three embedded editable data workbooks. Native chart data pass portability validation. Chart display data use six decimal places because excess literal precision cannot be preserved in Excel chart workbooks; the research model retains its original precision.
- Presentation package-integrity and geometry validators report zero findings. Two conservative table-height warnings remain on slides 10 and 12. Both were inspected in the artifact renderer and final LibreOffice PDF: the tables end above the explanatory note, with no observed clipping or overlap.

Initial verification failures were investigated: the harness initially assumed a different valid chart-part path, treated “SMPT assumptions” as a source ID, and required byte-identical numeric serialization from Google. Those test assumptions were corrected; the complete final 70-check suite then passed. A real truncated chart-axis problem was fixed in the artifact itself before final validation. No failing broad check was disregarded because an isolated check passed.

## Initial completion: visual review and limits

All 14 report pages, all 12 slide renders, the final deck PDF contact sheet and both brief pages were visually inspected. The changed report title and numeric frontier were inspected again after their last edits. Bounded native-export views from all 11 model tabs were rendered and inspected, including the new disclosed-sensitivity module, duration cases, funding map, dashboard and validation ranges. This is not a cell-by-cell browser review of every off-screen row.

The university Sheet was updated in place through the authenticated university connector. The in-app browser had only a different account and could not open the private university file. Sharing was not changed to work around it. Native formula readback, scenario recalculation and exported-file rendering supply the spreadsheet QA. Native Microsoft PowerPoint/Excel rendering and font fidelity have not been verified; the PDF exports were checked using LibreOffice and PDF rendering. Source scripts use installed bundled runtimes; regeneration elsewhere requires the documented equivalent dependencies.

## Remaining substantive limitations and editorial judgment

The original Goldman proprietary note, detailed no-build mine plan, annual ramp-up and capital draws, project costs, fiscal/depreciation schedules and internal hurdle rate remain unavailable. Those gaps prevent a defensible independent project valuation or definitive construction-timing recommendation. They do not prevent publication of the narrower, explicitly bounded research findings.

Current environmental stage relies on an indexed mirror; substantive October official documents were inaccessible. Refresh source status, project guidance and administrative milestones immediately before any eventual release. Public forecasts can change. No project probabilities or forecast consensus are inferred from the selected cases.

The package is ready for Ben's editorial assessment of the argument, financial interpretation and presentation. A more definitive project investment rating would require new operating and fiscal evidence, not additional formatting. The next authorized phase would be editorial review, followed by separately approved website preparation and release. No merge, deployment, public sharing change or distribution was performed.

---

## Final expert research audit and editorial refinement

**Edition:** Final editorial refinement of completed research commit `f7515ca9968c32f74e7a40e7e4c4f8ee952d5263`, on the same branch and draft PR #203. Research cutoff remains **5 November 2026**. The review above records the original completion; this section records the subsequent audit and accepted editorial edition.

**Verdict: READY FOR EDITORIAL REVIEW / READY FOR HUMAN PUBLICATION REVIEW.** The central financial reasoning survives skeptical scrutiny. No material numerical error or need to rebuild the model was identified. The report is a defensible exposure and conditional capital-allocation study. Public evidence still cannot support a standalone Escondida valuation, financing assurance or definitive ranking of construction timing. This is a further internal agent review using professional analytical perspectives, not an external professional opinion or a second independent firm's assurance.

### Substantive scrutiny and resulting changes

| Review perspective | Finding and disposition |
| --- | --- |
| Metals and mining banking | The $2.83bn and $4.25bn illustrations measure a material difference in copper expectations. The revised report places them at about 9% and 13% of historical Group EBITDA solely to communicate scale, then explains why EBITDA exposure cannot become a parent funding allowance. No forward earnings bridge is introduced. |
| Natural resources equity research | Reported Copper earnings, ownership and denominator boundaries remain intact. The Q1 realized-price comparison is developed as evidence that Goldman's view could imply persistence of strong pricing, with provisional realization and benchmark differences retained. No price-volume causal attribution or EPS forecast is added. |
| Mining project finance | The main interpretive weakness was compression around duration and nominal economics. The report now separates 199→275ktpa from shortening benefits to ten years, and 275→333ktpa from moving those ten years to 2034. It explicitly states that margins are flat nominal assumptions, and that the fiscal-year disclosure is not an exact calendar-year cash-flow schedule. Model arithmetic is unchanged. |
| Corporate strategy and capital allocation | A low historical after-dividend subtotal cannot establish a financing shortfall; cash, borrowing and distributions affect flexibility. Readiness commitments should resolve defined uncertainties or protect costed schedule dependencies. Faster construction requires discounted avoided continuity losses exceeding premiums and risk. Staging depends on credible alternatives and weaker returns, not a mechanical timing formula. |
| Financial research editing | The main weakness was a sequence of labeled factual blocks. The accepted narrative now develops the connection from market expectations through company exposure and funding to replacement economics, with substantive headings and fuller paragraphs. Qualifications remain where they change interpretation and are consolidated elsewhere. |

The 199/333/416ktpa calculations retain their limited claim. No-build output, common-production cost differences, avoided sustaining expenditure, ramp-up, by-products and project fiscal schedules can materially change actual benefits. The report treats these missing inputs as information management needs, rather than using facility output to imply a valuation conclusion. The 10% nominal discount rate is an SMPT assumption; the flat nominal contribution convention does not constitute a real-price forecast with inflation escalation.

Goldman's annual average remains credibly attributed public reporting, distinct from its primary public end-year commentary. The secondary accounts may share one underlying note. No new market data or administrative events were imported during this editorial assignment. No probabilities were assigned to inaccessible permit documents.

### Representative editorial changes

Examples compare the completed-research report at the baseline commit with the accepted report generated from `build/report-narrative.json`.

**Earnings significance, report page 5**

Before: “The difference is financially meaningful, but applying a local sensitivity across a large shock assumes linear behavior and an unchanged historical portfolio.”

After: “The $2.83bn illustration is equivalent in scale to about 9% of BHP's $32.947bn FY2026 Group EBITDA; the $4.25bn spread is about 13%. These comparisons explain why the forecast debate matters to corporate finance. A price outcome of that magnitude could materially affect the resources generated by the existing portfolio and management's choices among investment, distributions and balance-sheet protection.”

The remainder of that paragraph identifies the older Goldman forecast as the comparison baseline. The next paragraph follows the earnings-to-cash boundary through taxes, working capital, financing and minority distributions. The change develops the economic implication without turning the illustration into a forecast.

**Duration and timing, report page 9**

Before: “If the screen credits only 10 benefit years beginning in 2034, the required equivalent rises to about 333ktpa at otherwise unchanged assumptions.”

After: “Reducing the benefit period from 20 years to ten, still beginning in 2032, raises the requirement from 199ktpa to about 275ktpa. Starting those ten years in 2034 raises it further to 333ktpa because unchanged construction spending is followed by a longer wait for benefits.”

This supplies the financial intuition and isolates the two effects already present in the accepted model. The paragraph retains the boundary between BHP's disclosed averaging window and an assumed project life.

**Funding interpretation, report page 11**

Before: “This is a historical cash-use observation, not a forecast of residual funding capacity.”

After: “The year demonstrates substantial cash generation alongside substantial existing uses. That small historical subtotal does not establish a financing shortfall: distribution choices, subsequent earnings, cash balances and borrowing affect future flexibility.”

### Newly adopted GitHub guidance

At the user's request, inspected GitHub `main` at **`b688516763447b669b6755d9083726e691753ac7`**, without merging unrelated main changes:

- [Research Publication House Style](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/b688516763447b669b6755d9083726e691753ac7/docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md)
- [Presentation Standard v2](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/b688516763447b669b6755d9083726e691753ac7/docs/design/presentations/SMPT_PRESENTATION_STANDARD_V2.md)
- [Editorial Authenticity and Visual Integrity](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/b688516763447b669b6755d9083726e691753ac7/docs/design/presentations/EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md)
- [Exhibit and Chart Rules](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/b688516763447b669b6755d9083726e691753ac7/docs/design/presentations/EXHIBIT_AND_CHART_RULES.md)
- [Four-Layer Analytical Framework](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob/b688516763447b669b6755d9083726e691753ac7/docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md)

The report retains its single sans-serif family, charcoal/paper/gold identity and readable full-width analytical exhibits. The deck adopts the presentation-specific Georgia Bold titles and palette, using the expressly permitted Arial fallback because Source Sans 3 is not installed. It retains 12 slides, eight native tables and three native editable charts. The research report remains the flagship under the user's explicit assignment; the generic framework's deck-first default does not replace it.

Deck changes are bounded: typography, graphite cover, accessible gold source links with document locators, neutral comparison bars with one gold focus, explicit tick spacing, and small interpretive edits consistent with the report. All chart values and native-table numeric tokens match the completed-research deck. Source/code and units remain inspectable in the expanded slide specification and notes. No source images, decorative graphics or font binaries are added.

### Editorial authenticity and visual integrity gates

**Artifacts reviewed:** current report PDF/Markdown/HTML; current executive PPTX/PDF; unchanged two-page brief; methodology; evidence register; claim matrix; accepted local workbook and saved native export; publication summary. Full-copy and headline-only readings: completed. Report pages inspected: **14/14**. Deck artifact renders and final font-correct PDF pages inspected: **12/12**, with affected chart renders repeated after repairs. Reviewer: internal Codex agent, applying the perspectives above.

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Analytical substance | PASS | Decision, market mechanisms, earnings-to-cash boundary and replacement counterfactual examined; no unsupported valuation or timing ranking introduced. |
| B. Prose authenticity | PASS | Entire accepted narrative reread; paragraph labels largely removed; reasoning and financial implications developed; necessary technical negations retained. Examples above show substantive changes. No AI detector used. |
| C. Visual integrity | PASS | All report pages and all deck pages rendered and inspected. Axis crowding corrected. Actual Georgia/Arial fonts verified in the final PDF. No observed clipping or material overlap; two conservative table-height warnings on slides 10/12 were reviewed. |
| D. Quantitative/source fidelity | PASS | Full **80/80** package checks; all **329** formula caches agree with the saved native export; model/evidence/CSV/brief files unchanged. All deck chart values and table numbers match the baseline. Report hyperlinks resolve to the same 16 unique destinations in PDF/Markdown/HTML. |
| E. Publication coherence | PASS | Headline sequence and full package tell the same conditional investment story. Report and deck serve distinct reading needs; the brief needs no revision. |

**Human release authorization: HOLD / PENDING.** The five content gates support submission to the user, not autonomous publication. No human approval of these exact revised files has yet been recorded.

### Final checks, repairs and production limits

- **14-page report**, approximately 5,000 PDF-extracted words including captions, tables, bibliography and running text. The canonical narrative generates the PDF, Markdown and standalone HTML. Checks verify all 41 accepted paragraphs, every table cell, seven captions and seven original SVG exhibits across the formats. Narrative structure and document length were determined by the argument, not a page target.
- Report/deck/brief contain **59/32/9** URI annotations. Report link destination sets agree across all three formats. This checks embedded destinations and correspondence to the accepted source register, not present or perpetual availability of every external website. Known source-access limits remain documented.
- The financial model, native-export snapshot, source register, claim matrix, four calculation CSVs, publication data, formula manifest and brief remain byte-identical to the completed-research baseline. This audit compares the unchanged model to its saved native readback and earlier six native scenario tests; it does not claim a new round of live Sheet scenario writes.
- The final deck's v5 receipt reports zero package/layout findings and successful portable embedded-chart validation. Existing table-height heuristics still flag slides 10 and 12; the actual artifact and final PDF renderings show the tables ending above the notes. Chart axis spacing is explicit, with zero baselines preserved.
- A real export failure was caught: the initial LibreOffice PDF silently substituted Frank Ruhl Hofshi/Liberation Sans despite Georgia/Arial declarations in PPTX. `export_deck_pdf.py` now supplies installed system font directories through a temporary fontconfig file. The accepted PDF embeds Georgia Bold and Arial; no fonts or bundled dependencies were modified or distributed. The complete 80-check suite passed after this repair.
- Native Microsoft PowerPoint/Excel rendering, a screen-reader audit and tagged-PDF conformance were **not** tested. PDF reading flow was visually assessed; native-object screen-reader order remains unverified. Charts have selectable/direct labels and chart transcripts in notes. This is not a formal accessibility certification.
- Source-note legibility, rights boundaries, units, nominal/gross/attributable scope, annual-average/end-year horizons and corporate recommendation were reviewed. No dataset, website, schema, publication gate or deployment workflow changed. No CI or production verification is claimed.

### Remaining issues and final gate

No unresolved material editorial or numerical defect was identified in the bounded research claims. Missing proprietary bank research and detailed project/no-build cash flows remain substantive research limitations rather than concealed modeling inputs. Permit metadata and source availability require a clearly dated check before any eventual release. Human editorial and public-release approval remain pending.

**Final recommendation: READY FOR EDITORIAL REVIEW**, meaning ready for the user's approval of this exact research edition. Preserve the existing website handoff; merge, deployment, public sharing and distribution remain outside this assignment.
