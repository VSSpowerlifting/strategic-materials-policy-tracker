# Presentation gallery: recovery and final engineering review

7 November 2026 · PR [#224](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/224) · Development reference, pending human acceptance.

## Recovery and scope

The original Claude worktree `.claude/worktrees/smpt-presentation-gallery-9f36b1` was accessible and clean at `4df38d4996688e51b3028822fa6c2df17d2a1e2f`. Its reflog and commit ancestry confirmed the intact sequence:

`59272fb` (remote PR head) → `946c6a4` (dependency portability) → `3b7d8f2` (type floor, rendering pathway, labels/previews) → `4df38d4` (research rendering command).

No reconstruction, reset, clean, rebase or force-push was used. A local `codex/presentation-gallery-recovery-4df38d4` ref and `/tmp/smpt-gallery-recovery.bundle` preserve that original chain. The completed branch retains all three commits. The other checkout's FI003 work and untracked files were untouched.

The live PR was verified as open and draft, based on `main` at `604632b74b89fd78d0d50ab46586f96db09bd29a`. It includes the open [#222](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/222) dependency merged at `a4640b4`. Neither PR was merged. No site route, deployment, research publication, controlled report revision or seed-data change was made.

## Independent improvements

- Dumbbell: five shared scale ticks, vertical gridlines, circular legend keys and an aligned value/change column.
- Condition tree: wider boxes, 12-point node labels, heights based on available space at each depth and wider branch labels.
- Exhibit with interpretation: a full-width composition, wider numerical columns and a proportionate notes area. Frame layering prevents native tables obscuring fixed annotations in LibreOffice.
- Role matrix: columns use available width, qualifiers have room beside the role marker, and row/header spacing supports wrapping.
- Annotated line: half-point dashed event references keep the measured series visually dominant.
- Portfolio: thumbnail browsing, search, family and editability filters, large previews, persistent two-pattern comparison, downloadable editable examples, responsive layout and keyboard support. No frontend framework or public route was added.
- Diversity: one original radial counterparty map for qualitative roles around a focal project. Equal spokes have no quantity, direction or ranking. Existing financial, operational and strategic forms retain their distinct purposes. The pattern-count quota was removed without replacing it.
- Research integration: renderer contracts, evidence resolution, composition HOLDs, source metadata in notes/manifests, artifact hashes, private draft outputs and overwrite protection. Attaching technical QC always leaves draft labels and human gates pending; the tool has no publication mode.

The library now contains 39 patterns, 40 gallery slides including the cover, and a 14-slide demonstration deck. Native chart tiers cover 15 patterns, positioned shapes 18, tables 6; no raster exhibits are used.

## Verification

| Check | Observed result |
|---|---|
| `npm test` | 1,129 passed; zero failed or skipped. Includes six new research/typography/radial/composition tests. |
| `npm run validate` | Passed; existing data completeness advisories remain. |
| `npm run lint` | Zero errors; 28 warnings in pre-existing non-exhibit files. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed; no gallery route added. |
| Registry and fixtures | Generated registry matches source specs; every renderer and fixture resolves and passes its data integrity checks. |
| PPTX generation | 40-slide gallery and 14-slide demo generated from repository dependencies. |
| OOXML structural verification | Both decks pass: named objects, native tables/charts, embedded chart workbooks, zero raster objects, expected text, Archivo and typography floors. |
| LibreOffice rendering/re-save | Both decks pass page-count and chart/raster preservation checks. All 39 gallery previews rendered. |
| Visual inspection | Every gallery preview inspected at full size; demo render/contact sheet inspected for composition, labels, sources and clipping. |
| Browser acceptance | Chrome: search, combined filters, empty state, URL persistence, selection limit/reset, large previews, comparison, Escape/focus return, every PNG, PPTX links, no-JavaScript fallback; zero browser errors. No horizontal overflow at 375, 768 or 1440 pixels. |
| Selection | Two-observation selection offers dumbbell/slope; relationship/edges selection offers dependency and counterparty maps, with advisory reasons. Covered in CLI checks and tests. |
| Composition | Demo: 0 HOLD, 0 REVIEW, 0 INFO. Research specifications now use the same review with a generated cover counted toward the research ceiling. |
| Reproducibility | Two complete generation/render/verification passes: all 45 generated artifacts byte-identical, including both PPTX files, manifests, registry, HTML, report and all 39 PNGs. |
| Clean-install portability | Separate temporary checkout of package files, exhibit scripts and exhibit docs; `npm ci --ignore-scripts`, then generation with private runtime module variables unset. Both PPTX files and the element manifest match the original checkout byte-for-byte. |
| Microsoft PowerPoint | **Not performed.** Structural and LibreOffice success do not establish actual PowerPoint behavior. |

The first full test run detected a stale report hash after a generation pass. The report was regenerated and the full suite rerun successfully; the final result is not an isolated-test pass.

Generation ran with Node 24.15.0, npm 11.12.1 and Python 3.9.6. Rendering used LibreOfficeDev 26.8.0.0.alpha0 and Poppler 26.05.0 exposed on this environment's `PATH`, with local Archivo through `FONTCONFIG_FILE`. Those system executables were environment-provided runtime wrappers; the repository does not search for or require their private location. Portable installation and explicit tool overrides are documented in the README. A stable LibreOffice or PowerPoint release may render differently.

`npm audit --omit=dev` reports zero vulnerabilities. The full dependency audit reports eight moderate and one high advisory in the existing ESLint dependency chain (minimatch and zod); these are outside the exhibit dependencies. No broad dependency upgrades were made in this presentation pass.

Final generated PPTX SHA-256 values:

- Gallery: `37006d2cc5f9fe6f0debbf8cb00ec30865b4527147f829c6999d9f48e849eab9`
- Demo: see the full SHA-256 in `element-manifest.json` and `editability-report.json` (both are checked against the actual deck).

## Remaining limitations and human acceptance

The synthetic previews have no observed clipping after this pass. The bubble legend remains an explicitly disclosed approximation of chart bubble sizes; use numeric data labels or a scatter/table when exact magnitude comparison matters. Shape-based diagrams and manually placed chart annotations do not update automatically after Edit Data; regenerate after data changes. Long or maximum-capacity real inputs still need their own visual review. Source references are structurally validated, not independently authenticated by the renderer. The 26-point title follows the accepted SMPT master rather than the standard's preferred 28–34 point range; data/axis/legend text has an 11-point floor and frame/footnote text a 10-point floor.

Manual Microsoft PowerPoint acceptance procedure (pending):

1. Install Archivo, download copies of both PPTX files, and open them in desktop Microsoft PowerPoint. Record operating system, PowerPoint version and font availability. Confirm no repair warning and 40/14 slides.
2. Inspect every slide in slide-show mode against the PNG previews, especially dumbbell circles/gridlines, tree branches, role qualifiers, table/notes layout, line-event references and bubble sizing. Check titles, source footers, clipping and chart geometry.
3. On copies, use **Edit Data** for a simple bar, line, scatter/bubble and waterfall. Confirm each workbook opens, edit a value, and verify the chart responds. For helper-series charts, maintain the documented helper values. Check manually positioned annotations separately.
4. Edit text, a native table cell and a shape-based diagram object. Confirm these remain editable; spokes/arrows are positioned shapes, not automatically reconnecting connectors.
5. Save under new filenames, close PowerPoint, reopen and inspect the edits, charts and slide count. Record repair prompts, layout shifts or broken workbook links. Preserve the original deliverables.
6. A human records acceptance or requested changes. Technical QC, successful reopening and the existence of this file do not authorize research publication or satisfy human gates A–E.

Recommendation: accept the development gallery for human review and reusable draft authoring. Keep the PR draft until the reviewer resolves its #222 dependency and records compatibility acceptance. Research publication remains a separate human-controlled decision.
