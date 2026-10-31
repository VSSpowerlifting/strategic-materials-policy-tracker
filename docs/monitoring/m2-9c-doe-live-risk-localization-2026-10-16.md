# M2.9c — DOE live article coverage gaps and reviewer localization

**Reviewed 2026-10-16. Nonpublishing audit receipt — not DOE monitoring activation.**

## Verified first post-M2.9b live publisher run

- [GitHub Actions run 38955466705](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38955466705) completed **success** on exact merged `main` `1f26a0067ce82916fff27fa9108acd875d2690b8` at **2026-10-16T19:31:20.798Z**.
- Artifact [12069737637](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/38955466705/artifacts/12069737637), named `smpt-doe-body-evidence-38955466705-1`, SHA-256 of ZIP `2b1f8d9af451b30c2e34a556587daf821ffbccb804e9f012be43d19d768be309`. The tool-retrieved artifact contains exactly `report.json` and `summary.md`. This is the **original run's reported engineering sample**, not preserved complete DOE website source bodies.
- Two DOE listing pages verified; **20 source rows**, **zero duplicated URLs**, **three verified original header/body examples**, no tool errors. Status `forensic_only` and explicitly `fullBodyBoundaryConfirmed:false`, `enabledForMonitoring:false`, `revisionTrackingActivated:false`, `sourceStateCreated:false`.
- The study re-confirms **12 accordion headings and 14 publisher text fields** in the September 30 mining selections article. The publication describes **award negotiation selections, not binding executed awards or money disbursed**.

| Verified original article role | DOE visible date | Recognized text fields | Accordion headings | Outside text-field lists | Outside cited links | Tables/media/images flagged |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Mining selections, not contracts | 2026-09-30 | 14 | 12 | 1 | 2 | 0 |
| Workforce prize, not loan | 2026-09-14 | 1 | 0 | 1 | 3 | 0 |
| Nonmineral construction-program negative control | 2026-09-11 | 1 | 0 | 0 | 2 | 0 |
| **Total** | | **16** | **12** | **2** | **7** | **0** |

**Interpretation:** The **nine structural risk occurrences** (two `ul` elements and seven `a` elements) are **not nine publication changes or nine unmodeled policies**. They are publisher DOM elements that the candidate M2.8 hash currently does not include. No tables, images or embedded media were *flagged in this three-story bounded sample*, but this does **not** certify their absence across DOE's catalogue, article completeness or source-use/rights suitability. Their content remains **unadjudicated**: risk elements may contain article citations or link/navigation furniture, and the initial artifact does not report the original parent DOM context.

## Next actionable source verification

M2.9c adds an **owner-traceable structural breadcrumb** for each risk, keeping existing hashes/counts and the exact five HTTP requests unchanged. Each `ancestorTrail` contains at most six HTML **tag names plus up to two sanitized CSS classes** per ancestor (no text, links, IDs, titles, attributes or full HTML). Thus, an owner can distinguish an external original article paragraph/link from a DOE share/footer/sidebar element without seeing or republishing full official text in GitHub artifacts. The report does **not** auto-label items as “harmless” or omit risks based on CSS names. All flagged elements continue to count, regardless of ancestor.

The updated experiment still must be **manually dispatched from merged `main`** at [SMPT DOE CMEI experimental body evidence](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-body-proof.yml) for a *new* JSON artifact with `ancestorTrail`. No source-specific semantic boundary has been signed or promoted from this initial sample.

Reviewers should then cross-check **all nine current risk elements** (or newly discovered ones) in the real publisher DOM and explicitly identify whether they are inside the substantive article body, an original citation, or publisher page furniture. When structural claims remain ambiguous or full-body text rights unresolved, maintain `fullBodyBoundaryConfirmed:false` and `eligibleForRevisionTracking:false`. The next real engineering threshold remains a properly reviewed **complete semantic body fingerprint version**, independently permitted source use, and separate first-baseline/recovered-replay authorization per M2.9a.

### Nonpublication contract

No DOE scheduled scan, state baseline, published source/finance/event/industrial milestone, private editorial approval, dataset export or F5 review decision changed. EXIM and M1 state remain distinct. Open PRs #86, #130, #132, #133, #134 have no overlap with this DOE-only diagnostic.

