# FI003 draft 0.1 quality review

**Agent assessment: READY FOR HUMAN FINANCIAL AND METHODOLOGICAL REVIEW. Public release HOLD.**

- Research cutoff: 6 November 2026. Reviewer: Codex, agent research director and production reviewer. No human financial/editorial sign-off is inferred.
- Reviewed baseline: `146fa5084cf0492ce1e7f4ef84757c94879e83de`, PR #215. The draft commit containing this file identifies the complete successor version.
- [Editable PPTX](../outputs/presentation-draft-v01/SMPT_FI003_JPMorgan_MP_Draft_v01.pptx) and [matching PDF](../outputs/presentation-draft-v01/SMPT_FI003_JPMorgan_MP_Draft_v01.pdf).
- [Full manuscript/data lineage](slide-manifest.json), [source recheck](../outputs/managerial-review-20261106/source-recheck.json), [package finalization](../outputs/presentation-draft-v01/package-validation.json), [numerical/content verification](../outputs/presentation-draft-v01/verification.json).
- Slides rendered and inspected: **15 / 15**, at full size, from the actual PPTX through LibreOffice. Headline-only and full-copy reads completed. Final source footers and revised chart/model links reinspected. [Contact sheet](../outputs/presentation-draft-v01/contact.png) records deck flow; it does not substitute for individual-slide inspection.

| Gate | Agent draft result | Evidence / remaining condition |
|---|---|---|
| A Analytical substance | PASS for bounded claim; human financial review pending | Financing sequence, contract mechanics, competing explanations and explicit conditional decisions. Rejected unsupported bank indispensability and optimal-capital-mix claims. C53 adds qualified performance obligations beside favorable EBITDA recognition |
| B Prose authenticity | PASS | Complete copy read. Specific instrument/status claims and connective explanations. Necessary uncertainty retained. Removed internal “defensible case lens” narration from publication copy |
| C Visual integrity | PASS for rendered draft | All 15 slides inspected. Zero finalizer layout warnings. Zero-based native charts, readable tables, direct legend labels, original true-scaled waterfall and clickable source footers. Formal PDF tagging/assistive-technology and native PowerPoint application checks remain unperformed |
| D Quantitative/source fidelity | PASS for bounded computations; human financial review pending | Model hashes unchanged; 24 Python tests, 11 schedules and specification reproduce; 388 delivered-XLSX cached formula values and saved native scenarios reconcile. PPTX/native chart values, embedded literal workbooks, PDF text and all expected source URIs checked |
| E Publication coherence | PASS for draft; release HOLD | Fifteen titles form a financing/credit/execution argument. Sources and model linked. Exact human approval, source-rights confirmation and separately authorized release still required |

## Material analytical and production changes

C51 restores the $350m financing threshold and $400m initial preferred amount omitted from the claim-register prose. C53 identifies the Defense-performance covenant and conditions for subsequent credit extensions, without implying an existing default or automatic credit consequence. C54 links diligence requests to cost-to-complete and funding reports contemplated for DoD, without implying SMPT access. The original model assumptions, cash facts and calculations are unchanged.

The initial ownership chart rendered a truncated axis; it now starts at zero and reaches 100%. Native legend labels carry the exact displayed 92.32%/7.68% split, avoiding awkward internal-label wrapping. The financing table and model-links area were respaced. Source footers identify documents/dates/locators in two explicit paragraphs where needed. All affected exports were regenerated and rechecked.

The two charts use literal embedded XLSX snapshots. They preserve editable evidence, not the controlling model's live formulas. Ownership fractions are rounded to 12 decimal places for Excel portability; headline percentages round from the full controlling calculation. The native waterfall preserves opening/closing balances and all seven signed movements, with a common zero-based scale. All eleven tables are native, rather than slide screenshots.

## Checks and practical limits

- Artifact package integrity, first-party reimport and native chart-data checks pass. Eleven native tables, two native charts and two embedded chart-data workbooks are present.
- PDF has 15 pages, selectable text, 45 link annotations covering all expected original-source and research/model targets, and embedded Archivo faces. All source annotations point to the intended URL. Complete original sources were retrieved in this review; GitHub model/method targets exist in the repository. No live font binary, bank transcript or restricted reference screenshot is distributed.
- Text is logically ordered in authoring with sources after evidence, and status encodings use labels beyond color. This is not a PDF/UA or assistive-technology certification. Native PowerPoint save/reopen/edit testing remains a pre-release compatibility check.
- Repository validation passes using `node --import tsx scripts/validate-data.ts`. The ordinary `npm run validate` command fails because this runner blocks `tsx`'s local IPC socket. The equivalent loader executes the same validator successfully.
- Full `npm test`: 1,089 pass / 12 fail. Every failure is a CLI smoke test encountering the same `tsx` IPC `EPERM`, rather than a financial or publication assertion failure. No unrelated test or application code was changed. Starting-SHA GitHub CI was green; successor CI must be read against its exact SHA.
- Lint: zero errors, 28 inherited warnings, none in the new presentation builder. Production build and typecheck pass.
- The current native Google Sheet was not edited or newly executed. Saved native verification passes; live Drive metadata access was unavailable, so no fresh modification/access-state assertion is made. Microsoft Excel application testing, bank confirmation, legal opinion and physical completion verification are unperformed.

## Exact draft files

| File | SHA-256 |
|---|---|
| `SMPT_FI003_JPMorgan_MP_Draft_v01.pptx` | `efcf20d73dfd01726fa2dc23b315b90241e02b0a75dfbfa4a12136418f192dab` |
| `SMPT_FI003_JPMorgan_MP_Draft_v01.pdf` | `ea32f7c523e946a947df232114f1e655c6433318f946ccaa7235e1f44b3ba15d` |

## Open decisions

Benjamin reviews the thesis and attribution, clause interpretation/timing, ownership denominator and conditional recommendation. Missing original loan terms prevent optimality analysis, actual certificates prevent actual addback/headroom claims, and remaining project costs/collections prevent completion-funding certification. Those limits can remain in the narrower publication if accepted.

Optional Jiho challenge is unsent and has no approval authority. Authorship/credit follows actual contribution and Benjamin's decision. December 4 remains a conditional target. No merge, publication, manual deployment, outreach, restricted-file sharing or endorsement occurred. Human approval of these exact files is **PENDING**.
