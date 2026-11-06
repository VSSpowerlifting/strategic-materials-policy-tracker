# Capital and industrial execution — November 6, 2026 curated corpus activation

**Status:** staged for exact-head CI and release verification; production confirmation requires a separate deployment/parity check.  
**Source review:** [November 5 admission and November 6 lifecycle/provenance audit](capital-industrial-execution-expansion-2026-11-05.md).  
**Release scope:** PR #208 only; no FI003 (#215) financing research or presentation changes.

## Admission approved for release

The maintainer gave the go-ahead on 6 November for the reviewed database expansion to proceed through final publication gates. The review covers the added records and modified lifecycle/status links, **not** rechecking all historical corpus sources. Set `site.lastUpdated` to **2026-11-06**, the date of the latest curated and source-verified admissions.

Relative to the previous November 4 public corpus, the admitted cohort adds:

| Public seed | Before | After | Change |
| --- | ---: | ---: | ---: |
| Policy events | 71 | 77 | +6 |
| Financial instruments | 97 | 109 | +12 |
| Physical projects | 103 | 110 | +7 |
| Organizations | 124 | 134 | +10 |
| Programmes | 13 | 16 | +3 |
| Materials | 14 | 20 | +6 |
| Sources | 197 | 207 | +10 |

Two independently sourced Nolans/Marathon construction-stage observations and Marathon's completed equity issuance are recorded distinctly from each instrument's financing stage. The C$50m CGF convertible note remains announced. Do not sum EXIM's up-to-$10bn Project Vault ceiling as distributed capital, the UK's £25m programme envelope as awarded funds, or Rio Tinto's C$164.8m across its two supported sites. Financing amounts remain in their reported currencies.

## Preservation and exclusion gates

- Historical source-cutoff snapshots for October 17, November 3 and November 4 remain pinned to their previously reviewed records; a November 6 live release label does not rewrite those historical reviews.
- The February 2026 Project Vault approval, conditional Australian instruments, Canada Growth Fund transactions and physical works receive their exact reviewed statuses and primary sources.
- November 10 MOFCOM/GACC Announcement 70 remains controlled by [Issue #207](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/207); do not infer a legal amendment from political commentary or auto-transition the status.
- FI003's unpublished JPMorgan/MP Materials analytical materials and separately approved MP/Texas seed proposals remain in draft PR #215. Later ID-level reconciliation is required, preserving both branches without blanket file overwrites.
- R001/A001 Archivo presentation candidates stay in separate draft PR #221.

## Exact-head and post-merge acceptance

- [ ] Validate seed/inverse links, typecheck, lint, full tests and production build on the release-dated branch head.
- [ ] Re-run browser QA of events, capital, projects, organizations, programmes, materials, coverage, source routes and exports.
- [ ] Confirm production build/deployment status and verify the live curated corpus date reads **November 6, 2026**.
- [ ] Confirm live dataset counts and no post-cutoff rows mislabeled as current; verify representative source and lifecycle detail pages.
- [ ] Record exact merged SHA, production deployment SHA and live parity check outcome in a follow-up release receipt.

A green GitHub merge is not itself evidence of a completed production deployment. Avoid announcing the dataset as publicly live until verified.
