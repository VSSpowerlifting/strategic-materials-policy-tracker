# R001 / Applied Strategy 001 — editable Archivo candidates

Tracking: SMPT Issue #219. This is a separate design-only phase, independent of FI003.

The current public eight-page PDFs are the authoritative source renderings.
The R001 2026-11-04 publication record and evidence workbook, and the
Applied 001 evidence-and-assumptions register and 13-tab model, remain the
substantive reference sources. Research cutoffs stay 3 November (R001)
and 4 November 2026 (Applied 001). No data, public downloads or report
pages should be changed in this draft PR.

The candidate generator reconstructs PDF text spans, vector drawing paths,
images and external URL annotations into editable native PowerPoint objects.
The resulting editable candidates are staged only under
research/legacy-archivo-review-20261106, together with matching candidate
PDFs, pre/post contact sheets, source checksums and machine-readable QA.

Important limitation: The PDF is a final presentation, not its original
authoring file. Curve drawings are approximated as editable vector polylines;
charts reconstructed from vector elements do not recover underlying data
series. Treat the original PDFs as the controlling visual baseline. The
automated tests are necessary but do not certify full visual fidelity.

Release is explicitly out of scope for this branch. Human full-resolution
inspection of all 16 slides and exact quantitative/source-link checks are
required before a separate approval and public-asset update. Do not
automatically merge, replace live PDFs or change the website.
