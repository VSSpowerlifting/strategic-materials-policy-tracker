# Stratellar production cutover checklist

Prepared 24 November 2026. The rebrand is ready for local release review and the domain registration is complete. Public GitHub changes, DNS and Vercel configuration, and production deployment require explicit authorization.

The design goal for the move is that no existing address stops working: record pages, research pages, downloads, API and export endpoints, citations already in circulation and links pinned to commit SHAs all keep resolving.

## 0. Launch dependencies (founder decisions, before anything else)

| # | Dependency | State | Blocks |
| --- | --- | --- | --- |
| 0.1 | Trademark clearance for "Stratellar" in the relevant classes and jurisdictions | Not done. No search was run as part of this work. | Any public use of the name |
| 0.2 | Registration of `stratellar.com` | Confirmed by the maintainer. Project connection and DNS are separate steps. | None for registration |
| 0.3 | Legal status. Stratellar is a publishing name, not an incorporated entity. Copy describes it that way. If an entity is formed, the footer, About page, licence notices and any commercial terms need a deliberate edit. | Open | Commercial documents, invoices, terms |
| 0.4 | Tagline. "Materials. Policy. Capital." was chosen by the founder on 24 November 2026 and replaces the provisional line. It is set in `lib/site.ts` and `BRAND` in `scripts/brand/build-brand-assets.mjs`; `npm run brand:build` redraws the artwork. | Decided | Nothing |
| 0.5 | Editorial sign-off on the research pages | Benjamin Yang approved all six records in `docs/editorial/reviews/` on 24 November 2026. | None |

## 1. Phase 1 — Review and merge the rebrand (no address changes)

The site can ship under the new name at the current address before the domain is connected. `site.url` still points at `https://strategic-materials-policy-tracker.vercel.app`, so canonicals, the sitemap and citation URLs do not move in this phase.

1. Review the proposed release branch, the brand system and the production-build captures.
2. Verify the six editorial records against the proposed release and run the editorial gate.
3. Approve a push and a pull request against `main`. Required checks: `npm run validate`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run editorial:check`, and the browser QA workflows.
4. Merge. Vercel deploys `main` (`vercel.json` enables deployment for `main` only).
5. Verify on the live site: header and footer lockups, `/opengraph-image`, `/manifest.webmanifest`, `/icon.png`, `/apple-icon.png`, `/favicon.ico`, one record page, one research page, `/api/export/dataset.json`, `/api/cite/bibtex`.
6. Re-scrape link previews: LinkedIn Post Inspector for the home page and each research page, so cached cards refresh.

Download file names change in this phase from `smpt-*` to `stratellar-*` (for example `stratellar-events.csv`). The request paths are unchanged, and the Controls snapshot keeps `smpt-controls-<date>.zip` because the name is part of a versioned release. A consumer that saves by the server-suggested name will see the new file name; nothing else about the response changes.

## 2. Phase 2 — Rename the GitHub repository (optional, independent of the domain)

GitHub redirects the web, git and API addresses of a renamed repository, including links pinned to a commit. The redirect breaks permanently if a new repository is ever created under the old name, so **never recreate `VSSpowerlifting/strategic-materials-policy-tracker`**.

1. Founder: Settings → General → Repository name → `stratellar`.
2. Confirm the Vercel Git connection followed the rename (Project → Settings → Git). Reconnect if it did not.
3. In one pull request, update the hard-coded references:

   | File | Reference |
   | --- | --- |
   | `lib/site.ts` | `repository` |
   | `scripts/audit-exim-reliability.ts`, `scripts/check-exim-schedule.ts`, `scripts/editorial-exim-sync.ts`, `scripts/editorial-sync.ts` | `const REPO = "VSSpowerlifting/strategic-materials-policy-tracker"` |
   | `tests/exim-state-recovery-admission.test.ts` | `repo: "strategic-materials-policy-tracker"` fixtures and assertion |
   | `README.md` | The paragraph that says the repository keeps its earlier name |
   | `package.json` | `name` (private package; optional, cosmetic) |
   | Local clones | `git remote set-url origin …/stratellar.git` |

4. Leave unchanged: the SHA-pinned links in `app/research/hemerdon-financing/page.tsx` and `app/research/tungsten-supply-security/page.tsx`, and the pinned raw-file links in the portfolio. They resolve through the redirect and their text is part of each study's provenance. After the rename, open one of each to confirm.
5. Leave unchanged: workflow names, concurrency groups and artifact names (`SMPT EXIM shadow monitoring`, `smpt-exim-*`). Tests assert them and stored state is keyed on them.
6. Do not rename the Vercel project unless there is a reason to. If it is renamed, confirm that `strategic-materials-policy-tracker.vercel.app` is still listed under the project's domains before and after; every published citation depends on it.

## 3. Phase 3 — Connect `stratellar.com`

1. Founder: add `stratellar.com` and `www.stratellar.com` to the Vercel project (Project → Settings → Domains) and create the DNS records Vercel shows. Wait for the certificate.
2. Choose the canonical host. Recommended: apex `stratellar.com`, with `www` redirecting to it.
3. Keep `strategic-materials-policy-tracker.vercel.app` assigned to the project and serving. Do not set a domain-level redirect on it yet (see Phase 4).
4. Check that both hosts serve the same deployment and that `https://stratellar.com/api/export/dataset.json` returns the same bytes as the old host.

## 4. Phase 4 — Switch the canonical address

One constant drives the canonical host: `url` in `lib/site.ts`. It feeds `metadataBase`, every Open Graph URL, `app/sitemap.ts`, `app/robots.ts`, the structured data in `lib/structured-data.ts`, the record URLs written into BibTeX, RIS and CSL-JSON by `lib/citation.ts`, and the search-reference export.

1. In one pull request:

   | File | Change |
   | --- | --- |
   | `lib/site.ts` | `url: "https://stratellar.com"` |
   | `scripts/check-production-release-parity.ts` | `defaultOrigin` |
   | `.github/workflows/public-release-parity.yml` | default `origin` input |
   | `scripts/qa-fi002-browser.mjs`, `scripts/qa-search-references-browser.mjs` | canonical origin constants |
   | `README.md` | live-site links and the naming paragraph |
   | `AGENTS.md` | the sentence about repository and deployment addresses |

2. Add host-scoped redirects from the old host to the new one **for pages only**. A sketch for `next.config`, to be checked against the bundled Next.js guide (`node_modules/next/dist/docs/`) before it is applied:

   ```ts
   async redirects() {
     return [
       {
         // Pages move. API routes and released research files keep answering on the old host.
         source: "/:path((?!api/|research/.+\\.[a-z0-9]+$|_next/|brand/).*)",
         has: [{ type: "host", value: "strategic-materials-policy-tracker.vercel.app" }],
         destination: "https://stratellar.com/:path",
         permanent: true,
       },
     ];
   }
   ```

   Why pages only: `/api/v1/**`, `/api/export/**` and `/api/cite/**` have script consumers, and not every HTTP client follows a redirect (plain `curl`, some R and Python defaults on POST, spreadsheet importers). Serving them on both hosts costs nothing and breaks no one. Files under `/research/**` are linked from distributed PDFs and from `citation.bib`; keeping them direct avoids a redirect hop in a citation manager.

3. Canonical tags do the consolidation for the paths that stay on both hosts: every page and the sitemap name `stratellar.com` once `site.url` changes.
4. Record URLs inside newly generated citations change host. Citations generated earlier keep the old host and resolve through the page redirect. Citation keys (`smpt:<event id>`, `smpt-src:<source id>`) do not change.
5. Files that carry the old host and are **not** edited: `public/research/fi002/citation.bib`, `report.html`, `report.md`, `public/research/applied-001/antimony-evidence-and-assumptions.md`, `public/research/r001/tungsten-supply-security.pdf`. They are released documents. They stay correct for as long as the old host stays assigned to the project, which is why it is never removed.
6. After deployment, verify from a clean client:
   - `curl -sI https://strategic-materials-policy-tracker.vercel.app/events/<id>` → `308` to `https://stratellar.com/events/<id>`
   - `curl -s https://strategic-materials-policy-tracker.vercel.app/api/export/events.csv | shasum -a 256` equals the same request on the new host
   - `https://stratellar.com/sitemap.xml` and `/robots.txt` name the new host
   - a record page's `<link rel="canonical">`, `og:url` and JSON-LD `url` name the new host
   - `npm run audit:production-parity -- --origin https://stratellar.com` passes
   - each research page, each download on it, and each SHA-pinned GitHub link opens
7. Founder: Google Search Console — add the `stratellar.com` property, submit the sitemap, and use Change of Address from the old property. Bing Webmaster Tools likewise.
8. Remove the "keeps its earlier names until" paragraphs from `README.md` and `AGENTS.md`, and update this file to a dated record of what was done.

## 5. Phase 5 — External surfaces (founder only)

Nothing here was touched. Prepared files are in `brand/social/`.

| Surface | Action | Asset |
| --- | --- | --- |
| LinkedIn company page | Create or rename, upload logo and banner, set tagline and URL | `linkedin-profile-800.png`, `linkedin-company-banner-2256x382.png` |
| LinkedIn personal profile | Optional banner; update the project entry | `linkedin-personal-banner-1584x396.png` |
| Launch post | Use the announcement template for an approved publication | `brand/templates/research-announcement-1200x1200.*` |
| Portfolio | Verify and release the portfolio through its separate approval process. Update its platform link after the canonical host is verified. | Separate portfolio release |
| GitHub | Repository description, social preview image, topics | `brand/social/og-default.png` |
| Email, letterhead, commercial documents | Use the templates | `brand/templates/` |
| ORCID, Zenodo, Google Scholar, any index that lists the dataset | Update the publisher name; keep the earlier name as an alternate | — |

## 6. Rollback

- Phase 1: revert the merge commit. No address or identifier changed, so nothing external needs repair.
- Phase 2: rename the repository back; GitHub redirects in both directions as long as neither name is reused.
- Phase 4: revert the `site.url` pull request. Remove the Search Console change of address. The old host never stopped serving, so citations and API consumers are unaffected either way.

## 7. Register of preserved identifiers

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
