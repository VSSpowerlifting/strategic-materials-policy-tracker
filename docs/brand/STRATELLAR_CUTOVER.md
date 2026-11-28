# Stratellar production cutover

24 November 2026

- [Stratellar](https://stratellar.com) is the canonical platform. [www.stratellar.com](https://www.stratellar.com) redirects to the apex over HTTPS.
- [Release PR #292](https://github.com/VSSpowerlifting/stratellar/pull/292) launched the rebrand and canonical host at `818b623c53f33350f43176587f1e276d46909e7e` in Vercel deployment `dpl_D5s4qBobXPDXjpxzACKeT8Bazbee`. Benjamin Yang approved the visual identity for release. Six editorial approvals dated 24 November 2026 cover the research index and five studies.
- The [GitHub repository](https://github.com/VSSpowerlifting/stratellar) was renamed in place. The Vercel project and original deployment hostname retain their existing names. Existing GitHub links depend on the old repository name remaining unused.
- The [portfolio](https://benyang.dev) followed in [PR #15](https://github.com/VSSpowerlifting/benjamin-yang-portfolio/pull/15) at `a3003388be3fefb0a019adfbe1c3befa044d0f31` in Vercel deployment `dpl_CywkjvPEzFURpDZdo8JWcvu9V4Gh`. Its project route and historical download links are preserved.

Stratellar is a publishing name. Preliminary checks included the USPTO wordmark search and public uses of similar names. Formal trademark clearance is a separate matter.

*Addendum, 28 November 2026.* The paragraph above records the position at cutover. Public copy now names the company, Stratellar LLC, in the footer, About, contact and publisher metadata. The rules on what copy may claim are in `AGENTS.md` and the brand system.

## Historical links and browser storage

The [original host](https://strategic-materials-policy-tracker.vercel.app) remains assigned to the platform. Next.js redirects an explicit list of public page paths to the apex with 308 responses and retains query strings. API, citation and export endpoints, downloadable research files and metadata assets continue serving directly on both hosts.

Browser-local events saved before cutover remain available at the [original saved list](https://strategic-materials-policy-tracker.vercel.app/saved). Both `/events` and `/events/<id>` also remain available on the original host, preserving the ability to open, save and remove records on that origin. The new site's saved page links to the original list. Each origin keeps its own browser storage.

The canonical URL in `lib/site.ts` drives metadata, structured data, sitemap and newly generated citation URLs. Existing research files, suggested historical citations and SHA-pinned source links preserve their original attribution. Escondida (FI002) uses the default Stratellar preview. The four other research studies with dedicated preview routes serve their own cards.

The original Controls snapshot ZIP is served byte for byte under `smpt-controls-2026-11-12.zip`. Its SHA-256 is `40e142cc257d04ade1f2b36aa573872d3322bd5b7b1b15bc6dd666a20d403b55`; all four member hashes and row counts match its embedded manifest.

## Verify or roll back

Use the Vercel production aliases to confirm the deployed Git SHAs. From a clean client, check the apex, www redirect and old-host page redirects, then verify the sitemap, canonicals, Open Graph images, the legacy saved list and historical downloads. Run `npm run audit:production-parity -- --origin https://stratellar.com` and compare the Controls ZIP SHA-256 from both hosts. Check one SHA-pinned GitHub commit, one blob and one raw download from the original repository name.

If rollback is needed, use the Vercel deployment recorded immediately before the affected release. The pre-launch deployment IDs were `dpl_2L1t4iWMYGzQF2v8BgZ79HfFoTdF` for the platform and `dpl_DWVcjgSXmYm8j1aJtLpUgFENqfXj` for the portfolio. Restore the corresponding code in GitHub and verify the actual alias destination. Leave the original host assigned and keep released files and APIs available on both origins. Browsers may have cached 308 responses, so the apex should continue to serve those paths during recovery. Restore automatic production assignment once a corrected deployment is approved.

## Preserved identifiers of preserved identifiers

These keep the earlier name on purpose. Changing any of them would break a consumer, a stored record or a test that guards one. `AGENTS.md` carries the rule.

### Public interface (consumers depend on these)

| Identifier | Where | Why it stays |
| --- | --- | --- |
| All request paths: `/api/v1/**`, `/api/export/**`, `/api/cite/**`, `/events/<id>`, `/research/<slug>`, `/materials/<slug>`, `/actors/<code>` | `app/**` | Deep links and API compatibility |
| Record identifiers (event ids, `fc-*`, `fin-*`, `ctl-*`, `org-*`, `prj-*`, `prg-*`, `dsg-*`, `src-*`) | `data/seed/**` | Stable identifiers |
| Citation keys `smpt:<event id>`, `smpt-src:<source id>` | `lib/citation.ts` | Keys already in reference managers |
| Controls snapshot ids `smpt-controls-v…` and file `smpt-controls-<asOf>.zip` | Controls snapshot build | Versioned release name and checksums, including the frozen README inside the ZIP |
| `projectionVersion: "smpt-investigation-1"` | `/api/v1/projects/[id]/investigation` | Schema version string |
| `format: "smpt-search-references"` | Search reference export | Format identifier |
| `schemaVersion: "smpt-production-data-parity-1"` | Release parity audit | Schema identifier |
| Dataset version, licence terms, export column names and order | `lib/site.ts`, `lib/export.ts` | Unchanged; the publisher name in metadata is the only change |
| Browser storage key `smpt:saved-events:v1` and event `smpt:saved-events-change` | Saved events | Renaming would silently empty readers' saved lists |

### Released research (unchanged byte for byte)

| Item | Where |
| --- | --- |
| Every file under `public/research/**` (PDFs, decks, models, `citation.bib`, `report.html`, `report.md`, evidence files) | Carries the original imprint and the original host |
| `research/**` source packages and their `SMPT_FI001_*`, `SMPT_FI002_*` file names | Referenced by SHA-pinned links |
| `scripts/prepare-fi002-public.py` | The build script of a released edition; its edition string and citation text are part of that record |
| Market data releases `data/markets/**`, seed data `data/seed/**`, checksums and manifests | No file changed |
| `docs/editorial/reviews/*` signed before this work, `docs/analysis/**`, `docs/monitoring/**`, `docs/financial-intelligence/**`, dated review and QA records | Dated records |

### Internal names (changing them has a cost and no reader benefit)

| Identifier | Where |
| --- | --- |
| Environment variables `SMPT_ALLOW_MISSING_FONTS`, `SMPT_MONITOR_REQUIRE_PRIOR_STATE`, `SMPT_EXIM_BOOTSTRAP`, `SMPT_EXIM_AUDIT_TRIGGER_RUN_ID`, `SMPT_PRODUCTION_ORIGIN` | Scripts and workflows |
| Workflow names, concurrency groups and artifact names (`SMPT EXIM shadow monitoring`, `smpt-exim-*`) | `.github/workflows/*`; asserted in `tests/exim-reliability.test.ts` |
| User agents `SMPT-EXIM-shadow/1.0`, `SMPT-source-discovery/1.0`, `SMPT-source-pilot/1.0`, `SMPT-link-check/1.0` | Monitors; source hosts may have allow-listed or logged them |
| Placeholder origin `https://smpt.invalid` | Tests |
| Manifest schema `smpt-archivo-alternate-editions-1`, registry key `smpt-repertoire-2026` | Exhibit and edition manifests |
| Internal run-log headings (`## SMPT M1…`, `SMPT READ-ONLY PUBLIC DATA RELEASE PARITY`) | Operational scripts; matched by existing logs |
| Document file names `SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md`, `SMPT_APPLIED_STRATEGY_STANDARD.md`, `SMPT_PRESENTATION_STANDARD_V2.md` | Linked from instructions, skills and tests; their text now says Stratellar |
| Skill and agent identifiers `smpt-*`, `ben-smpt-review`; preview config `smpt-dev` | `.claude/skills`, `.agents/skills`, `.claude/launch.json` |
| Package name `strategic-materials-policy-tracker` | `package.json` (private) |
| `site.formerName` → `alternateName` in JSON-LD | `lib/site.ts`, `lib/structured-data.ts`; lets indexes connect the two names |
| `brand/legacy/smpt-lattice-mark.png`, `docs/design/presentations/validation/smpt-validation-*` | Archived artwork and dated validation output |
| Example slides `docs/design/presentations/examples/01`–`05` (labelled "SMPT / Financial Intelligence 001") | Drawn from FI001 as released; kept as worked examples of that study |

### Where the earlier name is shown to readers

Only where provenance needs it: the suggested citation on each research page released before the change, and `alternateName` in structured data. No page carries a "formerly" line.
