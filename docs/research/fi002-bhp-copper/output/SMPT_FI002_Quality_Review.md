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

## Automated and software verification

`SMPT_FI002_Verification_Results.json` records **70/70 passing checks**. These are checks on this research package, not repository CI or deployment tests.

- Six local selectable cases and four meaningful input perturbations passed. Six native Sheet scenario recalculations passed; the selector was restored to Base.
- Independent Python sums of annual capital and benefit discount factors match the six scenario thresholds and eight additional sensitivity cases.
- All **329 current formula results** agree between the local workbook and an exported native Sheet. No cached formula errors occur in either workbook. Google serializes two audit-comparison constants to 15 significant digits; their differences are below 1e-8 in workbook units, with unchanged calculation logic. Other formulas match exactly.
- Physical-unit, static exposure, financial-denominator, historical cash-flow, capital, ownership and source-lineage checks passed.
- PDFs contain 14 / 12 / 2 pages and **57 / 35 / 9 working URI annotations** for report / deck / brief. Destinations match the evidence and deliverable allowlist. No empty pages or tool placeholders were found. This validates embedded link targets, not perpetual availability of every external page.
- Finalized PowerPoint has 12 editable slides, eight native tables, three native charts and three embedded editable data workbooks. Native chart data pass portability validation. Chart display data use six decimal places because excess literal precision cannot be preserved in Excel chart workbooks; the research model retains its original precision.
- Presentation package-integrity and geometry validators report zero findings. Two conservative table-height warnings remain on slides 10 and 12. Both were inspected in the artifact renderer and final LibreOffice PDF: the tables end above the explanatory note, with no observed clipping or overlap.

Initial verification failures were investigated: the harness initially assumed a different valid chart-part path, treated “SMPT assumptions” as a source ID, and required byte-identical numeric serialization from Google. Those test assumptions were corrected; the complete final 70-check suite then passed. A real truncated chart-axis problem was fixed in the artifact itself before final validation. No failing broad check was disregarded because an isolated check passed.

## Visual review and limits

All 14 report pages, all 12 slide renders, the final deck PDF contact sheet and both brief pages were visually inspected. The changed report title and numeric frontier were inspected again after their last edits. Bounded native-export views from all 11 model tabs were rendered and inspected, including the new disclosed-sensitivity module, duration cases, funding map, dashboard and validation ranges. This is not a cell-by-cell browser review of every off-screen row.

The university Sheet was updated in place through the authenticated university connector. The in-app browser had only a different account and could not open the private university file. Sharing was not changed to work around it. Native formula readback, scenario recalculation and exported-file rendering supply the spreadsheet QA. Native Microsoft PowerPoint/Excel rendering and font fidelity have not been verified; the PDF exports were checked using LibreOffice and PDF rendering. Source scripts use installed bundled runtimes; regeneration elsewhere requires the documented equivalent dependencies.

## Remaining substantive limitations and editorial judgment

The original Goldman proprietary note, detailed no-build mine plan, annual ramp-up and capital draws, project costs, fiscal/depreciation schedules and internal hurdle rate remain unavailable. Those gaps prevent a defensible independent project valuation or definitive construction-timing recommendation. They do not prevent publication of the narrower, explicitly bounded research findings.

Current environmental stage relies on an indexed mirror; substantive October official documents were inaccessible. Refresh source status, project guidance and administrative milestones immediately before any eventual release. Public forecasts can change. No project probabilities or forecast consensus are inferred from the selected cases.

The package is ready for Ben's editorial assessment of the argument, financial interpretation and presentation. A more definitive project investment rating would require new operating and fiscal evidence, not additional formatting. The next authorized phase would be editorial review, followed by separately approved website preparation and release. No merge, deployment, public sharing change or distribution was performed.
