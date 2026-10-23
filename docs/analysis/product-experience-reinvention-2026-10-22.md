# SMPT research product experience

Revision: 2026-10-23. Original reference/base: `084078f3150089d933aa6f510723f10c64ebaa59`.
Continues reviewed head `a2492e8433978003b6852339241d01bf5ae57b11` on
`codex/smpt-product-experience-reinvention`, existing draft PR #181.

## Final direction

Restore Lattice Register: warm charcoal `#12110f`, card `#1a1814`, cream
`#f5f3ee`, gold `#e3b04b`, and the established three semantic marks. Remove the
navy body override. Raise faint text slightly to `#a39b8e` for AA contrast across
actual dark surfaces; cream-panel swatches gain an outline. Preserve the supplied
logo and the existing Newsreader, Archivo and JetBrains Mono families.

The opening pairs a compact 32px desktop Newsreader introduction with the existing
React/SVG/HTML-table lattice. A selected-cell summary and real evidence/project
links sit beside it. The complete selected-record panel follows, retaining
separate counts, funding options, ended rows and off-lattice explanations. Mobile
uses a material selector and readable stage buttons with a selected check mark,
then the same record panel. No modal, new chart engine or arbitrary project-pair
comparison. Keep the three investigations, material entry points, bounded corpus
coverage and reuse/methodology links below the opening.

The shell retains Overview, Explore, Compare, Projects and Methodology. Combine
the two former secondary bars on small screens; keep About in the mobile menu,
Data/API visible and specialist tools available. Use Archivo for analytical
controls, legends and instrument details; Newsreader for editorial headings and
reading. The skip link moves focus without replacing analytical URL state.

## Shared analytical query

`lib/research-query.ts` is browser-safe and deterministic. Home and Compare use
one URL-backed query through the same hook and record panel. It delegates counted
records to the existing `cellView` and authoritative lattice model; `cellKey` now
lives in browser-safe view logic rather than importing seed composition at runtime.

Supported state: `material` + `stage`, `government`, `kind`; canonical links retain
legacy `#material:stage` selection and encode filters in the query string.
Governments accept canonical IDs or their short codes, case-insensitively, then
serialize canonical IDs. Kinds are all, commitments, controls, designations, their three pairwise
combinations, or none, preserving existing kind visibility. No state selects the supported gallium/processing cell by default. Explicit
empty cells stay empty. Unknown, empty, conflicting, incomplete or repeated
analytical parameters produce visible errors and no selected records. Unrelated
query parameters survive interaction; standard focus/section anchors are exempt.
Browser Back, sharing and reload retain the analytical state.

## Release-readiness correction (2026-10-23)

Dependency commit `949305e` updates exact pins for `next` and
`eslint-config-next` from **16.4.0 to 16.4.1**. Final pins are **16.4.3** after
the demonstrated preview font failure described below. The regenerated npm lockfile
changes only Next.js, its environment/ESLint packages and eight SWC variants;
Linux SWC metadata gains upstream libc selectors. React/DOM remain 19.2.4,
and sharp remains 0.35.5, now also the framework's minimum. Node >=20.9.0,
React 19 and ESLint 9 remain supported; no application compatibility code was needed.

The demonstrated CI failure was the direct path `root → next@16.4.0`:

| Advisory | Affected 16.x range | First patched 16.x |
| --- | --- | --- |
| [GHSA-2464-fhr4-w9xw: image optimization RCE](https://github.com/advisories/GHSA-2464-fhr4-w9xw) | >=16.0.0 <=16.4.0 | 16.4.1 |
| [GHSA-p3m5-59mp-jv5r: Server Actions denial of service](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) | >=16.0.0 <=16.4.0 | 16.4.1 |
| [GHSA-673q-mjm6-r5xr: cached typed-array RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | >=16.0.0 <=16.4.0 | 16.4.1 |

The [official 16.4.1 release](https://github.com/vercel/next.js/releases/tag/v16.4.1)
fixes all three. These advisory ranges alone require only 16.4.1. Fixed local PNG
optimization remains in use; targeted source inspection
found no Server Actions or Cache Components/use-cache functions. This is a
dependency remediation, not an assertion that an exploit was reproduced.

`npm ci` passed, `npm ls` found consistent framework/peer versions, and the exact
CI command `npm audit --omit=dev --audit-level=moderate` returned **zero
vulnerabilities**, without overrides, exclusions, threshold changes or bypasses.
An initial all-dependency audit snapshot also reported five high dev-only entries along
`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`
([braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); this is
outside the production gate and was not suppressed or independently patched.
The later clean-install audit reported zero; the earlier snapshot remains a
separate observation rather than evidence that this patch fixed braces.

**Observed compatibility blocker:** automatic preview for `5658029` restored the
previous build cache, then failed on Next.js 16.4.1 with JetBrains Mono and
`next/font/google queries have exactly one entry`. Clean local builds passed.
Cache restoration is observed context, not a demonstrated cause. The exact error
matches [upstream issue #99114](https://github.com/vercel/next.js/issues/99114):
Google sometimes returns extensionless font URLs containing query parameters;
Turbopack split embedded ampersands in the serialized options. The
[16.4.3 release](https://github.com/vercel/next.js/releases/tag/v16.4.3) includes
[backport #100277](https://github.com/vercel/next.js/pull/100277) of the
[URL parsing/extension fix #100158](https://github.com/vercel/next.js/pull/100158).
16.4.2 lacks that fix. Therefore 16.4.3 is the smallest released correction for
both the security advisories and the demonstrated font compatibility problem.
No font substitution, local-font migration, cache purge, bypass or unchanged
deployment retry was used. New final-head CI and preview evidence belongs in
the PR receipt; the failed 5658029 preview is not counted as verification.

The bounded presentation pass clarifies the headline to “How governments reshape
strategic-material supply chains.” at 32px on mobile/desktop (40px tablet), reduces desktop
secondary navigation from 36px to 32px, and keeps a compact symbol key beside the
selection actions. Full original counting qualifications remain in the native
“Counting rules and qualifications” disclosure at every viewport. The record
panel still serves the distinct purpose of listing individual canonical records.

Government means provider for commitments, issuer for clauses, designating
government for designations, never project geography. Counted IDs, options and
ended records are separate. Off-lattice records and related context do not inflate
counts. Project links come only from explicit financial `projectId`, separately
labelled nonallocative `associatedProjectIds`, or designation links. Controls
acquire no inferred project relationship from shared material or timing.

Example: gallium × processing → inspect the six commitments, one control clause
and one designation separately → follow a Wagerup financial project reference →
inspect its three direct instruments and one published groundbreaking observation
→ open original sources or download that investigation. Those project records
are a supported subset of cell evidence, not the cell's total.

## Public investigation projection and JSON

`getPublicProjectInvestigation` keeps the authoritative `projectStack` and
`buildProjectEvidencePathway`, and adds `packet` from
`buildPublicInvestigationPacket`. Financial chronology, policy context, native
milestones and unknowns on the actual page consume this shared projection.
Existing capital-stack calculations remain independent and unchanged.

Additive, read-only, statically generated resource:
`GET /api/v1/projects/[id]/investigation`. It returns UTF-8 JSON with attachment
filename `smpt-[projectId]-investigation.json`; unknown or unpublished IDs return
404. All public project IDs are generated at build time. The existing project
registry/stack endpoint and every existing dataset/CSV contract retain their
meaning. The Data/API page documents the new resource and links an example.

Projection version: `smpt-investigation-1`. Explicitly selected public fields:
project identity/materials/stages/locations, recorded organization roles, direct
instruments, distinct nonallocative associations, exact decimal amount strings
and original currency/qualifier/wording, financial histories, terms and
conditions, planned source-stated outcomes, legacy financier observations,
designations, parent policy context, announcement-sibling controls, published
native milestones and scope caveats, package references, field locators,
resolving source URLs, specific unknowns and analytical limitations.

No wholesale stack/pathway/internal-object serialization. Exclude lifecycle
maintenance metadata, adjudications, reviewer packets, filesystem paths and
unsupported fields. Milestone reviewer attribution is already legitimately
public in the existing register and is explicitly selected. The projection
preserves current corpus revision and legal-status cutoff `2026-10-17`; source
publication/access, status, occurrence, target and review clocks remain distinct.
No environment-dependent timestamp, historical known-as-of claim, historical
financial totals, invented project allocation or causal effect.

## Discovery and cost

The demonstrated search gap was `Wagerup groundbreaking`. Enrich existing project
search metadata with only published milestone wording and IDs; projects with
published claims link to their stable `#project-industrial` section. Preserve the
eleven existing search kinds, canonical identities, exact document identifiers,
original-language matching and registered organization names/aliases. No fuzzy
matching, private evidence import, milestone route or second index.

One local composition measurement: lattice ~9.2ms, public Wagerup investigation
~3.9ms; serialized lattice 91,557 bytes (12,356 gzip), packet 16,679 bytes
(4,142 gzip). These are bounded local observations, not production benchmarks.
The client receives the thin lattice display model, not the packet or full
financial histories. Packet composition occurs on the server/build path. No
additional cache, backend service or dependency was needed.

## Verification and review

- `npm run validate`: passed with existing incomplete-framing warnings. Published
  corpus remains 65 events, 96 instruments, 45 clauses, 76 projects and one native
  reviewed milestone. No research record or publication decision changed.
- `npm run typecheck`: passed.
- `npm run lint`: passed; nine pre-existing warnings in unchanged scripts/tests.
- `npm test`: **1,029 passed, zero failed**. Added all-cell ID reconciliation,
  URL normalization/roundtrip/error cases, government roles, page/packet byte
  parity, source resolution, amount/condition/undated history preservation,
  nonallocative treatment, unknown IDs, nested private-field sentinels, exact
  search discovery and a browser-safe import boundary. Updated an obsolete
  page-source regex to exercise actual public milestone rendering.
- `npm run build`: local 16.4.1 baseline passed, including static investigation
  routes. Remote 16.4.1 font failure prompted the justified 16.4.3 correction
  above; final-head results are reported in the PR receipt. No security bypass.
- Production-build Playwright: passed at **1440×900, 768×900, 390×900**, with
  reduced motion. Exercised material/stage keyboard and mobile selection,
  separate counts, government filtering, context transfer to Compare, Back,
  reload, invalid and empty cells, project links, financial/industrial evidence,
  actual JSON download bytes and filename, sources/citations, exact milestone
  search to its real investigation, skip-link focus/URL preservation, menus and
  Escape/focus return, plus 11 legacy routes. Release QA also exercises the
  counting disclosure by keyboard, exact document-number and original-language
  browser queries, JSON response headers/bytes and unknown/unpublished-ID 404s.
  Captured and checked Overview,
  Explore, Compare, Wagerup/Stibnite, About, Methodology and Data/API for page
  overflow. Browser page-error collection was empty.
- Fonts awaited before screenshots. Chromium platform-font inspection confirmed
  custom Newsreader on the headline, Archivo on controls at all three widths,
  and JetBrains Mono on the visible desktop data token. No fallback accepted.

The original production layout was captured afresh at 1440×900 after fonts were
ready; it still matches the original reference implementation. Revised captures
use the same desktop viewport. Visual inspection confirms the restored warm
identity, subordinate headline, substantial first-screen interactive matrix,
selected evidence links, readable legend/conditions and retained project journeys.
Mobile presents usable analytical controls instead of miniaturized columns.

[Original production reference, 1440×900](product-experience/production-before.png) ·
[Revised overview, 1440×900](product-experience/overview-desktop.png) ·
[Revised tablet overview, 768×900](product-experience/overview-tablet.png) ·
[Revised mobile overview](product-experience/overview-mobile.png) ·
[Wagerup investigation](product-experience/wagerup-desktop.png).

Screenshots are generated QA artifacts, not research evidence. Source URLs were
compared with the stored public references; this is not a new publisher-source
verification. Representative responsive/keyboard checks are not a complete
accessibility certification. Full local screenshots and logs are retained outside
the checkout.

## Delivery limits

Local release checks use Node 24.15.0/npm 11.12.1 on macOS; CI uses Node 20 on
Linux, while the existing Vercel project uses Node 24. No runtime/workflow setting
changed. Independent dependency investigation and patch review found no concrete
surviving advisory or regression; other OS execution was not tested locally.
Exact final-head CI and preview verification are reported in PR #181 after this
document's commit; pre-commit local results do not establish later-commit CI.
The Vercel connector lacks team authorization; the existing CLI can inspect the
correct project and is used for read-only preview discovery instead. CLI 62.1.0
misparsed the documented `env run` authentication probe, attempted an upload and
failed with an invalid environment-key error before a successful deployment.
That command was not retried; its newly created local project link was removed.

No changes to seed/research stores, eligibility, validators, source quotations,
financial calculations, legal standing, corpus dates, private evidence or existing
API/export schemas. The two stale unrouted-library comments were corrected;
comments grant no publication authority. Narva release #180, arbitrary project
comparison #166, finance guidance #162 and CSV security #167 remain separate.
No merge, successful manual deployment, production promotion, global CLI upgrade
or monitoring activation. Ordinary Git preview automation remains enabled.
