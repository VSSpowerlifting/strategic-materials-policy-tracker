# Archivo alternate presentations — legibility revision

**Status:** draft PR #223, source/layout edits only until CI validates the regenerated binaries.

The 6 November candidate PDFs used 8.2–8.5 pt identity/footer type, 8.8–9.2 pt linked source labels and 9.6 pt risk and methodology notes. These sizes were too small for the intended reading experience.

## Changed layout, unchanged analytical claim

- Footer identity, series and slide count: 9.5 pt. Section kicker and mechanism labels: 10.8 pt.
- Evidence/source links: at least a nominal 10.4 pt, given more vertical room and moved above the footer rule.
- Risk, assumption and interpretation notes: nominal 11.2 pt dark ink, moved to a dedicated lower reading band.
- R001 Japan investment lines moved up to protect their qualifiers; R001 closing strip moved up.
- Antimony recommendation, trade-off and domestic-ramp callouts moved up; reversal table compressed vertically to preserve its full critical warning; source-list links given more width and nominal 10.6 pt.
- Original approved PDFs, research cutoffs, financial figures, all source destinations and archival records must remain intact.

**Verification gates:** regenerate native PPTX and PDF, enforce the embedded Archivo and PDF link checks, compare rendered PDF and contact sheets, verify no missing qualifiers or numbers, run complete PR CI, and validate the exact preview downloads. This adjustment does not imply native Microsoft PowerPoint edit/save validation or author publication approval.
