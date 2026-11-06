# FI002 website release candidate

Status: **READY FOR FINAL PUBLICATION APPROVAL**. Prepared 5 November 2026. No production release authorized.

The release introduces `/research/escondida-copper` as a report-led Financial Intelligence publication. Charcoal and gold establish its identity; the cream reading surface uses the site's Archivo family throughout. A real first-page preview anchors the report. The short article connects price exposure to replacement economics and the construction decision; it does not duplicate fourteen pages of prose. The four-screen comparison uses only approved precomputed results, with a readable all-cases table that remains accessible without JavaScript. Companion downloads are grouped below the argument. Home, research catalog, search and sitemap provide discovery; related research provides the return journey. Canonical/article/author metadata, a social image and a BibTeX citation support professional reuse. No publication date is invented before release; the date is explicitly the research cutoff.

## Content and public assets

Approved research: `1c4288916abe8fa1df9f906c87a4278647e6adcb`, [PR #203](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/203), stacked on [PR #202](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/202). The website branch preserves that ancestry and merges `origin/main` at `b688516763447b669b6755d9083726e691753ac7`; approved research files are unchanged.

`public/research/fi002/` contains 24 allowlisted files, a checksum manifest, and a curated ZIP. The manifest identifies the approved research commit, cutoff, byte lengths and SHA-256s. There are no private Drive references in the public assets' extracted text, PDF URI annotations or Office XML. The ZIP intentionally excludes internal build scripts, delivery indexes, native export audits, administrative records and obsolete drafts.

Public-edition transformations are limited and reproducible:

- Report PDF/HTML/Markdown: same 41 approved analytical paragraphs, same seven original exhibits and financial tables. Replace private working-model references with the public XLSX destination; replace “Editorial review copy” with “Public research edition.” The HTML adds a return link, viewport metadata, main landmark and scrollable tables. The public report retains 14 pages and 59 URI annotations.
- PowerPoint: only `ppt/notesSlides/notesSlide12.xml` changes, replacing the private master link with the public model URL. All slide, chart, table and embedded workbook parts are identical. The existing 12-slide PDF is unchanged (32 links).
- Model, two-page brief (9 links), evidence register, claim matrix and four calculation CSVs: byte-identical to the approved package. The editable workbook remains an 11-tab independent download, not outside editing access to the university master.
- Methodology: retain the approved analytical explanation; replace the internal software section with instructions for using the downloadable workbook and CSVs. No new project valuation, financial scenario or thesis revision.
- Public typography/identity images: generated locally, without company branding or third-party graphics.

The older research PRs and public repository already contain private-resource IDs and internal delivery metadata. Those historical references do not grant access, and this task neither changes their permissions nor rewrites shared history. They are not included in the public website distribution.

## Focused source refresh — 5 November 2026

| Question | Check and result | Publication treatment |
| --- | --- | --- |
| Goldman annual average | [FinancialJuice, 20 October](https://www.financialjuice.com/News/9812752/Goldman-Sachs-Copper---FJElite.aspx?xy=rss) and [WII, 25 October](https://wiinstitute.org/copper-goldman-sachs-raises-price-forecast-on-us-china-competition/) still attribute $15,400/t for the 2027 annual average, previously $13,800/t. | Retain attributed public reporting. Original bank note remains unobtained. No proprietary note or charts distributed. |
| Point versus average forecast | [Goldman public transcript, 23 October](https://www.goldmansachs.com/insights/goldman-sachs-exchanges/why-oil-prices-are-surging-despite-recovering-supply) remains accessible. | Preserve the separate end-2027 horizon; do not use it to verify the annual average. |
| Readiness versus sanction | [BHP October review, pp. 1–2](https://www.bhp.com/-/media/documents/media/reports-and-presentations/2026/261020_bhpoperationalreviewforthequarterended30september2026-pdf.pdf) confirms $0.8bn gross approved readiness funding. Focused search found no later material sanction replacing this baseline. | No claim that approval establishes expenditure incurred or final construction sanction. |
| Permitting | [Indexed file 2167965265](https://ambihub.cl/seia/proyecto/2167965265) still shows En Calificación / RCA pending, 9 October questions and 4 November applicant request. [SEA May participation record](https://firma.sea.gob.cl/publicaciones/2026/05/26/1779832640_2168542066) is accessible and identifies the project's admission. Official SEIA project endpoint and the 9 October ICSARA document remained inaccessible in the refresh tool. | No approval claim, numerical delay assumption or new interpretation of substantive conditions. Mirror-based limitation remains explicit. |

No material development found that requires changing the approved financial content. This is a focused preparation-date check, not exhaustive subsequent-event assurance. The analytical cutoff remains 5 November 2026. Refresh these narrow checks if release occurs materially later.

## Verification and review evidence

- Production build and TypeScript check pass; data validation passes without dataset changes.
- Final checks were repeated after `npm ci` restored the exact lockfile dependencies. Production dependency audit: zero vulnerabilities.
- Full suite: 1,097 tests pass. Four publication tests verify manifest/member integrity, frozen model/data/brief bytes, approved interactive values, discovery and branch release controls. Search tests now include the publication result type.
- Lint: zero errors; 26 existing warnings in legacy research builders and unrelated tests. No warning introduced by website files.
- Chromium production-server QA: 320, 390, 768 and 1440 CSS pixels; no horizontal overflow, uncaught page errors or automated WCAG 2/2.1 A/AA findings on the main publication page. Radio state, arrow-key behavior, all-cases table, local links and downloads pass. Catalog, home, search, sitemap, full-text view and no-JavaScript fallback pass. Automated checks are not accessibility certification; manual screen-reader and Safari/Firefox testing were not performed.
- Visual inspection: desktop/mobile hero and exhibit captures, complete page captures, public PDF fourteen-page contact sheet, changed source-guide page and social identity image. No clipping or chart/value changes observed. The full report's denser PDF retains its approved layout; HTML provides an alternative reading path.
- Public asset audit: 64/64 checks pass (`review/asset-results.json`).
- Public file scanner: extracted PDF text/links and Office XML contain no university Drive URLs, personal account address, `/Users/` paths or private-delivery-folder wording.
- 41/41 approved narrative paragraphs preserved verbatim in the public PDF. Seven vector exhibits preserved. All 24 ZIP member hashes match its manifest. PowerPoint changed-member comparison confirms only final-slide notes changed.
- Native Microsoft Office rendering and tagged-PDF/screen-reader conformance remain unverified; original research's software limitations are not upgraded by website QA. The earlier 80 research checks / 329 saved native-export formula comparisons remain the approved research audit, not newly performed live Sheet tests.

Browser evidence is in `review/browser-results.json`, with local screenshots. The browser script uses a server bound to `127.0.0.1`; no hosted preview is required.

## Deployment boundary and existing exposure

Before pushing, GitHub's deployment API revealed an already-successful Preview deployment of research commit `1c42889` (deployment record 7586107751). This predates the website phase. The existing `vercel.json` rule `"*": false` does not match slash-separated `codex/...` branches under minimatch; the mismatch was reproduced locally. A draft PR is not a privacy boundary.

This branch adds an **exact** false rule for `codex/fi002-website-release-candidate`, plus `ignoreCommand: node scripts/fi002-ignore-preview.mjs` as defense in depth. The ignored-build script returns 0 only on this preparation branch and returns 1 for main and all other branches. Tests confirm main's deployment rule remains true. [Vercel's Git configuration documentation](https://vercel.com/docs/project-configuration/git-configuration) describes explicit branch rules; [static configuration](https://vercel.com/docs/project-configuration/vercel-json) describes the ignored-build command. No project-wide dashboard setting, production deployment, sharing permission or existing deployment was changed. Any broad wildcard correction is outside this task.

## Reproduce

1. `npm ci`, then `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
2. To rebuild the public distribution, run `scripts/prepare-fi002-public.py` with the approved bundled Python runtime (ReportLab, pypdf, Pillow) and `pdftoppm` on PATH. The preserved report renderer uses the same bundled Liberation Sans files as the approved source; media generation uses installed Arial. Public files are allowlisted; unexpected files fail the build. Financial model calculations are not rerun or altered.
3. For browser QA, install temporary `playwright@1.55.0` and `@axe-core/playwright` without changing the lockfile, install Chromium, then `node scripts/qa-fi002-browser.mjs`. It starts and closes a loopback-only production server. Use `npm ci` afterward to restore locked dependencies.
4. For ordinary local review: `npm run dev -- --hostname 127.0.0.1`, then open `/research/escondida-copper`. Static artifacts can also be reviewed directly from `public/research/fi002/`.

## Final release checklist — requires separate authorization

- [ ] Ben approves the website release candidate, public asset edition and the final release action.
- [ ] Resolve the merge sequence for #202 → #203 → publication branch; preserve the approved research history. Review the publication PR against main after its research dependencies land. No PR is merged by this preparation task.
- [ ] Recheck current main, required CI and the focused source facts if time has passed. Keep this branch's explicit no-preview rule during review.
- [ ] Authorize production deployment separately. Verify the resulting exact commit, route, downloads/hashes, metadata and production navigation; do not infer production success from local checks.
- [ ] Announcements or outreach require separate instruction.

There is no remaining known implementation or analytical blocker to final publication approval. Production release and production verification are deliberately pending.
